import { SupabaseClient } from "npm:@supabase/supabase-js@2.45.4";

export async function logEvent(
  client: SupabaseClient,
  args: {
    component: string;
    event: string;
    level?: "info" | "warn" | "error";
    userId?: string | null;
    requestId?: string | null;
    durationMs?: number | null;
    payload?: unknown;
    errorClass?: string | null;
    errorMessage?: string | null;
  },
) {
  try {
    await client.rpc("log_system_event", {
      p_component: args.component,
      p_event: args.event,
      p_level: args.level ?? "info",
      p_user_id: args.userId ?? null,
      p_request_id: args.requestId ?? null,
      p_duration_ms: args.durationMs ?? null,
      p_payload: args.payload ?? null,
      p_error_class: args.errorClass ?? null,
      p_error_message: args.errorMessage ?? null,
    });
  } catch (_) {
    // Logging must never block the request.
  }
}
