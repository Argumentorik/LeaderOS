// Authenticated endpoint for leader-os.de runtime events.
// Records sessions and leadership-insight updates for the signed-in user.

import { preflight, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { requireUser, serviceClient } from "../_shared/supabase.ts";
import { logEvent } from "../_shared/log.ts";

interface SessionStartBody {
  eventType: "session_start";
  platform?: string;
  userAgent?: string;
}

interface SessionEndBody {
  eventType: "session_end";
  sessionId: string;
  activityData?: Record<string, unknown>;
}

interface InsightUpdateBody {
  eventType: "insight_update";
  kiScore: number;
  rhetoricScore: number;
  eqScore: number;
  actionPlan: Record<string, unknown>;
  campaignId?: string | null;
}

type Body = SessionStartBody | SessionEndBody | InsightUpdateBody;

Deno.serve(async (req) => {
  const cors = preflight(req);
  if (cors) return cors;
  if (req.method !== "POST") return errorResponse(405, "method_not_allowed", "POST only");

  const requestId = crypto.randomUUID();
  const started = Date.now();
  const sb = serviceClient();

  const auth = await requireUser(req);
  if (!auth.user) return errorResponse(401, auth.error ?? "unauthorized", "auth required");

  const { data: appUser, error: lookupErr } = await sb
    .from("users")
    .select("id")
    .eq("auth_user_id", auth.user.id)
    .maybeSingle();
  if (lookupErr) return errorResponse(500, "lookup_failed", lookupErr.message);
  if (!appUser) return errorResponse(404, "user_not_provisioned", "no public.users row for this auth user");

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return errorResponse(400, "bad_json", "request body must be valid JSON");
  }

  try {
    if (body.eventType === "session_start") {
      const { data, error } = await sb.from("sessions").insert({
        user_id: appUser.id,
        platform: body.platform ?? "leader-os",
        user_agent: body.userAgent ?? null,
        activity_data: {},
      }).select("id").single();
      if (error) throw error;
      await logEvent(sb, {
        component: "ingest-leader-os",
        event: "session_start",
        userId: appUser.id,
        requestId,
        durationMs: Date.now() - started,
        payload: { sessionId: data.id },
      });
      return jsonResponse({ ok: true, sessionId: data.id });
    }

    if (body.eventType === "session_end") {
      const { error } = await sb
        .from("sessions")
        .update({
          ended_at: new Date().toISOString(),
          activity_data: body.activityData ?? {},
        })
        .eq("id", body.sessionId)
        .eq("user_id", appUser.id);
      if (error) throw error;
      await logEvent(sb, {
        component: "ingest-leader-os",
        event: "session_end",
        userId: appUser.id,
        requestId,
        durationMs: Date.now() - started,
        payload: { sessionId: body.sessionId },
      });
      return jsonResponse({ ok: true });
    }

    if (body.eventType === "insight_update") {
      const { data: insightId, error } = await sb.rpc("upsert_leadership_insight", {
        p_user_id: appUser.id,
        p_ki_score: body.kiScore,
        p_rhetoric_score: body.rhetoricScore,
        p_eq_score: body.eqScore,
        p_action_plan: body.actionPlan,
        p_campaign_id: body.campaignId ?? null,
      });
      if (error) throw error;
      await logEvent(sb, {
        component: "ingest-leader-os",
        event: "insight_update",
        userId: appUser.id,
        requestId,
        durationMs: Date.now() - started,
        payload: { insightId },
      });
      return jsonResponse({ ok: true, insightId });
    }

    return errorResponse(400, "bad_event_type", "unknown eventType");
  } catch (e) {
    const err = e as Error;
    await logEvent(sb, {
      component: "ingest-leader-os",
      event: "failure",
      level: "error",
      userId: appUser.id,
      requestId,
      durationMs: Date.now() - started,
      errorClass: err.name,
      errorMessage: err.message,
    });
    return errorResponse(500, "internal", err.message);
  }
});
