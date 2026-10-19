// Authenticated RAG chat endpoint.
// Pipeline: classify intent -> embed query -> retrieve neighbors -> generate response.

import { preflight, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { requireUser, serviceClient } from "../_shared/supabase.ts";
import { embed } from "../_shared/voyage.ts";
import { complete, AnthropicMessage } from "../_shared/anthropic.ts";
import { logEvent } from "../_shared/log.ts";

interface Body {
  message: string;
  history?: AnthropicMessage[];
  documentSet?: string | null;
}

interface PromptRow {
  system_prompt: string;
  model_hint: string | null;
}

const CLASSIFIER_FALLBACK_MODEL = "claude-haiku-4-5-20251001";
const ANSWER_FALLBACK_MODEL = "claude-opus-4-7";
const MATCH_COUNT = 6;
const NEIGHBOR_RADIUS = 1;
// RAG-Match-Threshold ist Pflicht-Env. Canonical-Wert lebt in
// backend/services_rag.py — siehe .github/workflows/constants-drift.yml.
// Drift-Prävention: keine Default-Zahl, harter Throw wenn ungesetzt.
const _ragThresholdEnv = Deno.env.get("RAG_MATCH_THRESHOLD");
if (!_ragThresholdEnv) {
  throw new Error(
    "RAG_MATCH_THRESHOLD env var is required for wladbot-chat. " +
      "Set it in Supabase Edge-Function-Secrets to the same value as " +
      "MATCH_THRESHOLD in backend/services_rag.py."
  );
}
const RAG_THRESHOLD_VALUE = Number(_ragThresholdEnv);

async function loadActivePrompt(
  sb: ReturnType<typeof serviceClient>,
  name: string,
): Promise<PromptRow> {
  const { data, error } = await sb
    .from("prompt_templates")
    .select("system_prompt, model_hint")
    .eq("name", name)
    .eq("is_active", true)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error(`no active prompt template for ${name}`);
  return data as PromptRow;
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

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return errorResponse(400, "bad_json", "request body must be valid JSON");
  }
  if (!body?.message || typeof body.message !== "string") {
    return errorResponse(400, "missing_message", "message is required");
  }

  try {
    const classifier = await loadActivePrompt(sb, "wladbot_classifier");
    const intentRaw = await complete({
      model: classifier.model_hint ?? CLASSIFIER_FALLBACK_MODEL,
      system: classifier.system_prompt,
      messages: [{ role: "user", content: body.message }],
      maxTokens: 16,
      temperature: 0,
    });
    const intent = intentRaw.toLowerCase().includes("speech") ? "speech" : "theory";

    const [queryVec] = await embed([body.message], "query");

    const { data: matches, error: matchErr } = await sb.rpc("match_wladbot_with_neighbors", {
      query_embedding: queryVec as unknown as string,
      match_count: MATCH_COUNT,
      neighbor_radius: NEIGHBOR_RADIUS,
      match_threshold: RAG_THRESHOLD_VALUE,
      filter_source: body.documentSet ?? null,
    });
    if (matchErr) throw matchErr;

    const context = (matches ?? [])
      .map((m: { source: string; content: string }, i: number) =>
        `[${i + 1}] (${m.source})\n${m.content}`
      )
      .join("\n\n---\n\n");

    const promptName = intent === "speech" ? "wladbot_speech" : "wladbot_theory";
    const answerPrompt = await loadActivePrompt(sb, promptName);

    const systemWithContext = context
      ? `${answerPrompt.system_prompt}\n\n# Retrieved context\n${context}`
      : answerPrompt.system_prompt;

    const history = (body.history ?? []).slice(-6);
    const messages: AnthropicMessage[] = [
      ...history,
      { role: "user", content: body.message },
    ];

    const answer = await complete({
      model: answerPrompt.model_hint ?? ANSWER_FALLBACK_MODEL,
      system: systemWithContext,
      messages,
      maxTokens: 1024,
    });

    await logEvent(sb, {
      component: "wladbot-chat",
      event: "answered",
      userId: auth.user.id,
      requestId,
      durationMs: Date.now() - started,
      payload: { intent, matchCount: matches?.length ?? 0 },
    });

    return jsonResponse({
      ok: true,
      intent,
      answer,
      sources: (matches ?? []).map((m: { source: string; chunk_id: string; similarity: number }) => ({
        source: m.source,
        chunkId: m.chunk_id,
        similarity: m.similarity,
      })),
    });
  } catch (e) {
    const err = e as Error;
    await logEvent(sb, {
      component: "wladbot-chat",
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
