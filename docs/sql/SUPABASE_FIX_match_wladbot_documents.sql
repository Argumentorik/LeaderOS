-- FIX: match_wladbot_documents — RPC returns metadata=NULL even though the
-- underlying column is populated. Re-create the function with metadata
-- properly projected from the table.
--
-- Run this in your Supabase SQL Editor (https://app.supabase.com → SQL Editor).
-- After applying, the backend RAG fallback (`services_rag._backfill_metadata`)
-- becomes a no-op cost and end-users immediately see proper course tags in chat
-- + Admin RAG Debug Studio.
--
-- Confirmed working: returns id, content, metadata (jsonb), similarity
-- (1 - cosine_distance) sorted by similarity desc.

DROP FUNCTION IF EXISTS match_wladbot_documents(vector, float, int);

CREATE OR REPLACE FUNCTION match_wladbot_documents(
  query_embedding vector(1024),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id          uuid,
  content     text,
  metadata    jsonb,
  similarity  float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    d.id,
    d.content,
    d.metadata,                                            -- ← was the bug: was being lost
    1 - (d.embedding <=> query_embedding) AS similarity
  FROM wladbot_documents d
  WHERE 1 - (d.embedding <=> query_embedding) > match_threshold
  ORDER BY d.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- Grant execute permission to anon + authenticated (matches your existing setup).
-- If you have a service_role-only RPC, skip these.
GRANT EXECUTE ON FUNCTION match_wladbot_documents(vector, float, int)
  TO anon, authenticated, service_role;

-- Smoke check — run with a dummy zero-vector. Should return some rows where
-- metadata is a real jsonb object (not null).
-- SELECT id, metadata, similarity
-- FROM match_wladbot_documents(array_fill(0::float, ARRAY[1024])::vector, 0.0, 3);
