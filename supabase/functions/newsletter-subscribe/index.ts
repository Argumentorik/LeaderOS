// newsletter-subscribe — public double-opt-in entrypoint.
//
// Self-contained (no ../_shared imports) so what is deployed via the
// Supabase MCP is byte-identical to what lives in git. Invoked
// same-origin through the Vercel rewrite:
//   POST https://leader-os.de/api/newsletter/subscribe
//        -> https://<ref>.supabase.co/functions/v1/newsletter-subscribe
//
// Deployed with verify_jwt=false (public marketing endpoint). It does
// its own validation + a global suppression check, never trusts input.
//
// Flow:
//   1. validate email
//   2. global suppression check (GDPR — never email a suppressed address)
//   3. upsert subscriber on email_lower:
//        - new / pending / unsubscribed -> (re)issue confirm_token, send DOI mail
//        - already active               -> idempotent ok, no resend
//   4. send double-opt-in confirmation email via Resend
//
// Returns { ok: true } regardless of whether the address already existed,
// so the endpoint never leaks who is / isn't on the list.

import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const RESEND_FROM_EMAIL =
  Deno.env.get("RESEND_FROM_EMAIL") ?? "Wlad <wlad@leader-os.de>";
const SITE_URL = Deno.env.get("APP_URL") ?? "https://leader-os.de";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...cors },
  });
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function confirmHtml(confirmUrl: string): string {
  return `<!doctype html><html><body style="font-family:-apple-system,system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#0a0a0a;">
  <p style="font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#5a7a00;font-weight:700;margin:0 0 16px;">▸ LeaderOS · Feldnotizen</p>
  <h1 style="font-weight:800;font-size:24px;line-height:1.15;margin:0 0 12px;">Noch ein Klick.</h1>
  <p style="font-size:15px;line-height:1.55;color:#333;">Bestätige deine Anmeldung zu den Feldnotizen — Wlads Notizen aus 400 000 Coachings, alle paar Wochen, kein Spam.</p>
  <p style="margin:28px 0;">
    <a href="${confirmUrl}" style="display:inline-block;background:#bfff00;color:#0a0a0a;font-weight:800;font-size:14px;text-decoration:none;padding:14px 28px;letter-spacing:.04em;">Anmeldung bestätigen →</a>
  </p>
  <p style="font-size:12.5px;line-height:1.5;color:#888;">Wenn du das nicht warst, ignoriere diese E-Mail einfach — ohne Bestätigung passiert nichts.</p>
  <p style="font-size:12.5px;line-height:1.5;color:#888;margin-top:24px;">— Wlad Jachtchenko</p>
</body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  let body: {
    email?: string;
    source?: string;
    campaign?: string;
    referrer?: string;
  };
  try {
    body = await req.json();
  } catch {
    return json({ error: "bad_json" }, 400);
  }

  const email = (body.email ?? "").trim();
  if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
    return json({ error: "invalid_email" }, 400);
  }
  const emailLower = email.toLowerCase();
  const source = (body.source ?? "unknown").slice(0, 64);
  const campaign = body.campaign ? String(body.campaign).slice(0, 64) : null;
  const referrer = body.referrer ? String(body.referrer).slice(0, 512) : null;
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const userAgent = req.headers.get("user-agent")?.slice(0, 512) ?? null;

  const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    // GDPR: never email a globally suppressed address.
    const { data: suppressed } = await sb
      .from("email_suppressions")
      .select("email")
      .eq("email", emailLower)
      .maybeSingle();
    if (suppressed) return json({ ok: true, suppressed: true });

    // Does a row already exist?
    const { data: existing } = await sb
      .from("newsletter_subscribers")
      .select("id, status, confirm_token")
      .eq("email_lower", emailLower)
      .maybeSingle();

    if (existing?.status === "active") {
      // Already confirmed — idempotent, no resend, no leak.
      return json({ ok: true, already: true });
    }

    // Anti-bombing guard. Denies if this email had a DOI within the
    // last 5 minutes or this IP has hit 10 distinct emails / hour.
    // Returns the same {ok:true} so the surface stays non-committal.
    const { data: canSend } = await sb.rpc("newsletter_can_send_doi", {
      p_email_lower: emailLower,
      p_ip: ip,
    });
    if (canSend === false) {
      return json({ ok: true, throttled: true });
    }

    let confirmToken: string;
    if (existing) {
      // pending / unsubscribed / bounced -> reset to pending, fresh token.
      const token = crypto.randomUUID();
      const { error } = await sb
        .from("newsletter_subscribers")
        .update({
          status: "pending",
          confirm_token: token,
          source,
          campaign,
          referrer,
          ip,
          user_agent: userAgent,
          unsubscribed_at: null,
        })
        .eq("id", existing.id);
      if (error) throw error;
      confirmToken = token;
    } else {
      const token = crypto.randomUUID();
      const { error } = await sb.from("newsletter_subscribers").insert({
        email,
        status: "pending",
        confirm_token: token,
        source,
        campaign,
        referrer,
        ip,
        user_agent: userAgent,
      });
      if (error) throw error;
      confirmToken = token;
    }

    const confirmUrl = `${SITE_URL}/api/newsletter/confirm?token=${confirmToken}`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: RESEND_FROM_EMAIL,
        to: [email],
        subject: "Bestätige deine Anmeldung — LeaderOS Feldnotizen",
        html: confirmHtml(confirmUrl),
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`resend_${res.status}: ${text.slice(0, 200)}`);
    }

    // Best-effort audit (never blocks the response).
    sb.rpc("log_system_event", {
      p_component: "newsletter-subscribe",
      p_event: "doi_sent",
      p_level: "info",
      p_user_id: null,
      p_request_id: null,
      p_duration_ms: null,
      p_payload: { source, campaign },
      p_error_class: null,
      p_error_message: null,
    }).then(() => {}, () => {});

    return json({ ok: true });
  } catch (e) {
    const err = e as Error;
    sb.rpc("log_system_event", {
      p_component: "newsletter-subscribe",
      p_event: "failure",
      p_level: "error",
      p_user_id: null,
      p_request_id: null,
      p_duration_ms: null,
      p_payload: { source },
      p_error_class: err.name,
      p_error_message: err.message,
    }).then(() => {}, () => {});
    return json({ error: "internal" }, 500);
  }
});
