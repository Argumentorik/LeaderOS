// Admin-only one-shot backfill: fetches wladbot_documents rows with NULL
// embedding, batches them through Voyage, writes vectors back. Idempotent —
// safe to re-run; only touches rows still missing an embedding.

import { preflight, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { requireUser, serviceClient } from "../_shared/supabase.ts";
import { embed } from "../_shared/voyage.ts";
import { logEvent } from "../_shared/log.ts";

const BATCH_SIZE = 16;
const MAX_BATCHES = 32; // hard cap to bound function runtime

Deno.serve(async (req) => {
  const cors = preflight(req);
  if (cors) return cors;
  if (req.method !== "POST") return errorResponse(405, "method_not_allowed", "POST only");

  const requestId = crypto.randomUUID();
  const started = Date.now();
  const sb = serviceClient();

  const auth = await requireUser(req);
  if (!auth.user || !auth.client) {
    return errorResponse(401, auth.error ?? "unauthorized", "auth required");
  }
  const { data: isAdmin, error: adminErr } = await auth.client.rpc("is_admin");
  if (adminErr) return errorResponse(500, "admin_check_failed", adminErr.message);
  if (!isAdmin) return errorResponse(403, "admin_only", "admin role required");

  let totalEmbedded = 0;
  let batches = 0;

  try {
    while (batches < MAX_BATCHES) {
      const { data: rows, error: fetchErr } = await sb
        .from("wladbot_documents")
        .select("id, content")
        .is("embedding", null)
        .order("created_at", { ascending: true })
        .limit(BATCH_SIZE);
      if (fetchErr) throw fetchErr;
      if (!rows || rows.length === 0) break;

      const vectors = await embed(
        rows.map((r) => r.content as string),
        "document",
      );

      // Update each row individually — small N, simpler than crafting a bulk update.
      const updates = await Promise.all(
        rows.map((r, i) =>
          sb
            .from("wladbot_documents")
            .update({ embedding: vectors[i] as unknown as string })
            .eq("id", r.id),
        ),
      );
      for (const u of updates) if (u.error) throw u.error;

      totalEmbedded += rows.length;
      batches++;
      if (rows.length < BATCH_SIZE) break;
    }

    await logEvent(sb, {
      component: "backfill-embeddings",
      event: "completed",
      userId: auth.user.id,
      requestId,
      durationMs: Date.now() - started,
      payload: { totalEmbedded, batches },
    });

    const { count } = await sb
      .from("wladbot_documents")
      .select("*", { count: "exact", head: true })
      .is("embedding", null);

    return jsonResponse({
      ok: true,
      totalEmbedded,
      batches,
      remainingUnembedded: count ?? null,
    });
  } catch (e) {
    const err = e as Error;
    await logEvent(sb, {
      component: "backfill-embeddings",
      event: "failure",
      level: "error",
      userId: auth.user.id,
      requestId,
      durationMs: Date.now() - started,
      errorClass: err.name,
      errorMessage: err.message,
      payload: { totalEmbedded, batches },
    });
    return errorResponse(500, "internal", err.message);
  }
});
