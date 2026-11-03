// Public endpoint for the leader-check.de funnel.
// Two modes:
//   - "progress": save in-progress answers (anonymous-friendly)
//   - "complete": finalize the check, link to a public.users row, and persist insights

import { preflight, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { serviceClient } from "../_shared/supabase.ts";
import { logEvent } from "../_shared/log.ts";

type Mode = "progress" | "complete";

interface ProgressBody {
  mode: "progress";
  sessionId: string;
  lastStep: string;
  answersSoFar: Record<string, unknown>;
  email?: string | null;
  referrer?: string | null;
  utmSource?: string | null;
  utmCampaign?: string | null;
}

interface CompleteBody {
  mode: "complete";
  sessionId: string;
  email: string;
  fullName?: string | null;
  profileData?: Record<string, unknown> | null;
  kiScore: number;
  rhetoricScore: number;
  eqScore: number;
  actionPlan: Record<string, unknown>;
  campaignId?: string | null;
}

type Body = ProgressBody | CompleteBody;

function isCompleteBody(b: Body): b is CompleteBody {
  return b.mode === "complete";
}

Deno.serve(async (req) => {
  const cors = preflight(req);
  if (cors) return cors;
  if (req.method !== "POST") return errorResponse(405, "method_not_allowed", "POST only");

  const requestId = crypto.randomUUID();
  const sb = serviceClient();
  const started = Date.now();

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return errorResponse(400, "bad_json", "request body must be valid JSON");
  }
  if (!body?.mode || (body.mode !== "progress" && body.mode !== "complete")) {
    return errorResponse(400, "bad_mode", "mode must be 'progress' or 'complete'");
  }
  if (!body.sessionId) {
    return errorResponse(400, "missing_session_id", "sessionId is required");
  }

  try {
    if (body.mode === "progress") {
      const { data, error } = await sb.rpc("upsert_incomplete_attempt", {
        p_session_id: body.sessionId,
        p_last_step: body.lastStep,
        p_answers_so_far: body.answersSoFar ?? {},
        p_email: body.email ?? null,
        p_referrer: body.referrer ?? null,
        p_utm_source: body.utmSource ?? null,
        p_utm_campaign: body.utmCampaign ?? null,
      });
      if (error) throw error;

      await logEvent(sb, {
        component: "ingest-leader-check",
        event: "progress_saved",
        requestId,
        durationMs: Date.now() - started,
        payload: { sessionId: body.sessionId, lastStep: body.lastStep },
      });
      return jsonResponse({ ok: true, attemptId: data });
    }

    if (!isCompleteBody(body)) {
      return errorResponse(400, "invariant", "complete-mode body required");
    }
    if (!body.email) return errorResponse(400, "missing_email", "email is required to complete");

    const { data: userId, error: linkErr } = await sb.rpc("link_check_completion", {
      p_email: body.email,
      p_full_name: body.fullName ?? null,
      p_profile_data: body.profileData ?? {},
      p_session_id: body.sessionId,
    });
    if (linkErr) throw linkErr;

    const { data: insightId, error: insErr } = await sb.rpc("upsert_leadership_insight", {
      p_user_id: userId,
      p_ki_score: body.kiScore,
      p_rhetoric_score: body.rhetoricScore,
      p_eq_score: body.eqScore,
      p_action_plan: body.actionPlan,
      p_campaign_id: body.campaignId ?? null,
    });
    if (insErr) throw insErr;

    await logEvent(sb, {
      component: "ingest-leader-check",
      event: "completion_linked",
      userId,
      requestId,
      durationMs: Date.now() - started,
      payload: { sessionId: body.sessionId, insightId },
    });

    return jsonResponse({ ok: true, userId, insightId });
  } catch (e) {
    const err = e as Error;
    await logEvent(sb, {
      component: "ingest-leader-check",
      event: "failure",
      level: "error",
      requestId,
      durationMs: Date.now() - started,
      errorClass: err.name,
      errorMessage: err.message,
      payload: { mode: body.mode },
    });
    return errorResponse(500, "internal", err.message);
  }
});
