// newsletter-confirm — double-opt-in confirmation link target.
//
// Self-contained so the deployed function matches git exactly. Reached
// as a browser GET via the Vercel rewrite:
//   GET https://leader-os.de/api/newsletter/confirm?token=<uuid>
//        -> https://<ref>.supabase.co/functions/v1/newsletter-confirm
//
// Deployed with verify_jwt=false (public confirmation link). On a valid
// pending token it flips status -> active and 302-redirects the browser
// to the React confirmation page. Invalid/!pending tokens redirect to
// the same page with a status flag so the UI can message accordingly.

import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SITE_URL = Deno.env.get("APP_URL") ?? "https://leader-os.de";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function redirect(status: "confirmed" | "already" | "invalid"): Response {
  const url = `${SITE_URL}/newsletter/confirmed?status=${status}`;
  return new Response(null, { status: 302, headers: { Location: url } });
}

Deno.serve(async (req) => {
  const token = new URL(req.url).searchParams.get("token") ?? "";
  if (!UUID_RE.test(token)) return redirect("invalid");

  const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    const { data: row } = await sb
      .from("newsletter_subscribers")
      .select("id, status")
      .eq("confirm_token", token)
      .maybeSingle();

    if (!row) return redirect("invalid");
    if (row.status === "active") return redirect("already");

    const { error } = await sb
      .from("newsletter_subscribers")
      .update({ status: "active", confirmed_at: new Date().toISOString() })
      .eq("id", row.id);
    if (error) throw error;

    sb.rpc("log_system_event", {
      p_component: "newsletter-confirm",
      p_event: "confirmed",
      p_level: "info",
      p_user_id: null,
      p_request_id: null,
      p_duration_ms: null,
      p_payload: null,
      p_error_class: null,
      p_error_message: null,
    }).then(() => {}, () => {});

    return redirect("confirmed");
  } catch {
    return redirect("invalid");
  }
});
