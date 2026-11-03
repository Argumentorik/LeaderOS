// Sends a welcome email via Resend. Invoked from the welcome-email trigger
// (subscription -> service-role internal call) or directly by an admin.

import { preflight, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { serviceClient } from "../_shared/supabase.ts";
import { logEvent } from "../_shared/log.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const RESEND_FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") ?? "Wlad <wlad@leader-os.de>";
const APP_URL = Deno.env.get("APP_URL") ?? "https://leader-os.de";

interface Body {
  userId: string;
  planCode?: string | null;
}

function welcomeHtml(displayName: string, planLabel: string | null): string {
  const greeting = displayName ? `Hallo ${displayName},` : "Hallo,";
  const planLine = planLabel
    ? `<p>Dein Zugang zu <strong>${planLabel}</strong> ist aktiviert.</p>`
    : "";
  return `<!doctype html><html><body style="font-family: -apple-system, system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
  <h1 style="font-weight: 600; font-size: 22px;">${greeting}</h1>
  <p>Willkommen bei LeaderOS.</p>
  ${planLine}
  <p>Dein Cockpit: <a href="${APP_URL}" style="color: #2563eb;">${APP_URL}</a></p>
  <p>Wenn du in den nächsten Tagen einen kurzen Check-in willst, antworte einfach auf diese E-Mail.</p>
  <p>— Wlad</p>
</body></html>`;
}

Deno.serve(async (req) => {
  const cors = preflight(req);
  if (cors) return cors;
  if (req.method !== "POST") return errorResponse(405, "method_not_allowed", "POST only");

  const requestId = crypto.randomUUID();
  const started = Date.now();
  const sb = serviceClient();

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return errorResponse(400, "bad_json", "request body must be valid JSON");
  }
  if (!body?.userId) return errorResponse(400, "missing_user_id", "userId is required");

  try {
    const { data: user, error: userErr } = await sb
      .from("users")
      .select("email, full_name")
      .eq("id", body.userId)
      .maybeSingle();
    if (userErr) throw userErr;
    if (!user) return errorResponse(404, "user_not_found", `no user ${body.userId}`);

    let planLabel: string | null = null;
    if (body.planCode) {
      const { data: plan } = await sb
        .from("pricing_plans")
        .select("display_name")
        .eq("code", body.planCode)
        .maybeSingle();
      planLabel = plan?.display_name ?? null;
    }

    const claim = await sb.rpc("claim_idempotency_key", {
      p_key: `welcome_email:${body.userId}:${body.planCode ?? "none"}`,
      p_source: "send-welcome-email",
      p_operation: "send",
      p_user_id: body.userId,
      p_payload: null,
    });
    if (claim.error) throw claim.error;
    const decision = (claim.data as Array<{ decision: string }>)?.[0];
    if (decision?.decision === "duplicate") {
      return jsonResponse({ ok: true, deduped: true });
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: RESEND_FROM_EMAIL,
        to: [user.email],
        subject: "Willkommen bei LeaderOS",
        html: welcomeHtml(user.full_name ?? "", planLabel),
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Resend ${res.status}: ${text.slice(0, 300)}`);
    }
    const sent = await res.json() as { id?: string };

    await logEvent(sb, {
      component: "send-welcome-email",
      event: "sent",
      userId: body.userId,
      requestId,
      durationMs: Date.now() - started,
      payload: { resendId: sent.id, planCode: body.planCode ?? null },
    });

    return jsonResponse({ ok: true, resendId: sent.id });
  } catch (e) {
    const err = e as Error;
    await logEvent(sb, {
      component: "send-welcome-email",
      event: "failure",
      level: "error",
      userId: body.userId,
      requestId,
      durationMs: Date.now() - started,
      errorClass: err.name,
      errorMessage: err.message,
    });
    return errorResponse(500, "internal", err.message);
  }
});
