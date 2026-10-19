// Authenticated strategist generator.
// Loads the user's context, asks Claude for next-step plays, persists them.

import { preflight, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { requireUser, serviceClient } from "../_shared/supabase.ts";
import { complete } from "../_shared/anthropic.ts";
import { logEvent } from "../_shared/log.ts";

interface Body {
  goal?: string | null;
  horizonDays?: number | null;
}

interface Play {
  title: string;
  rationale: string;
  steps: string[];
  metric: string;
  effort: "low" | "medium" | "high";
  expected_impact: "low" | "medium" | "high";
}

const SYSTEM = `You are the LeaderOS strategist. You produce concrete, measurable, time-boxed leadership plays.

Output a JSON array of 3-5 plays. Each play MUST have:
- title (string, < 80 chars)
- rationale (string, why now, < 200 chars)
- steps (array of 3-5 short imperative strings)
- metric (string, observable signal that the play worked)
- effort: "low" | "medium" | "high"
- expected_impact: "low" | "medium" | "high"

Output ONLY the JSON array, no prose, no markdown fences.`;

function tryParsePlays(text: string): Play[] {
  const trimmed = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  const parsed = JSON.parse(trimmed);
  if (!Array.isArray(parsed)) throw new Error("model output was not an array");
  return parsed as Play[];
}

Deno.serve(async (req) => {
  const cors = preflight(req);
  if (cors) return cors;
  if (req.method !== "POST") return errorResponse(405, "method_not_allowed", "POST only");

  const requestId = crypto.randomUUID();
  const started = Date.now();
  const sb = serviceClient();

  const auth = await requireUser(req);
  if (!auth.user) return errorResponse(401, auth.error ?? "unauthorized", "auth required");

  let body: Body = {};
  try {
    body = await req.json().catch(() => ({}));
  } catch {
    body = {};
  }

  try {
    const { data: contextJson, error: ctxErr } = await sb.rpc("user_context", {
      p_auth_user_id: auth.user.id,
    });
    if (ctxErr) throw ctxErr;

    const userPrompt = JSON.stringify({
      user_context: contextJson,
      goal: body.goal ?? null,
      horizon_days: body.horizonDays ?? 14,
    });

    const raw = await complete({
      model: "claude-opus-4-7",
      system: SYSTEM,
      messages: [{ role: "user", content: userPrompt }],
      maxTokens: 1500,
      temperature: 0.4,
    });

    let plays: Play[];
    try {
      plays = tryParsePlays(raw);
    } catch (parseErr) {
      throw new Error(`model returned invalid JSON: ${(parseErr as Error).message}`);
    }

    const ctx = contextJson as { user_id?: string } | null;
    const appUserId = ctx?.user_id ?? null;
    if (!appUserId) throw new Error("user_context did not include user_id");

    const rows = plays.map((p) => ({
      user_id: appUserId,
      title: p.title,
      rationale: p.rationale,
      steps: p.steps,
      metric: p.metric,
      effort: p.effort,
      expected_impact: p.expected_impact,
      generated_by: "ai-strategist",
      status: "active",
    }));

    const { data: inserted, error: insErr } = await sb
      .from("strategist_plays")
      .insert(rows)
      .select("id, title");
    if (insErr) throw insErr;

    await logEvent(sb, {
      component: "ai-strategist",
      event: "plays_generated",
      userId: appUserId,
      requestId,
      durationMs: Date.now() - started,
      payload: { count: inserted?.length ?? 0 },
    });

    return jsonResponse({ ok: true, plays: inserted });
  } catch (e) {
    const err = e as Error;
    await logEvent(sb, {
      component: "ai-strategist",
      event: "failure",
      level: "error",
      userId: auth.user.id,
      requestId,
      durationMs: Date.now() - started,
      errorClass: err.name,
      errorMessage: err.message,
    });
    return errorResponse(500, "internal", err.message);
  }
});
