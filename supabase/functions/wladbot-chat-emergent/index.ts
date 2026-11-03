// wladbot-chat-emergent v3 — DEPRECATED, redirects to canonical Python /api/chat.
//
// As of Iter 92.14, there is exactly ONE chat path in production:
//
//   Frontend → https://leader-os.de/api/chat   (FastAPI on Emergent)
//     └─ services_rag.retrieve_context()   threshold 0.25 → voyage-3 → match_wladbot_documents
//     └─ LlmChat(GPT-5.2)                  via Emergent gateway
//     └─ Returns rag.active + rag.chunks   for observability
//
// This Edge Function existed historically as an alternate chat path for direct
// Emergent→Supabase bridging but never received production traffic (0 events in
// 14 days at time of deprecation). Kept as a 410-Gone stub so any forgotten
// caller fails loudly instead of silently bypassing the canonical RAG pipeline.
//
// Removed v2's RAG+Claude logic completely. If you need this back, restore from
// git history (commit 655a1a0 or earlier).

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, x-sync-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  // Loud-log the call so we can hunt down whoever still uses this URL.
  try {
    await sb.rpc('log_system_event', {
      p_component: 'wladbot-chat-emergent',
      p_event: 'deprecated_endpoint_called',
      p_level: 'warn',
      p_user_id: null,
      p_request_id: crypto.randomUUID(),
      p_duration_ms: null,
      p_payload: {
        method: req.method,
        url: req.url,
        user_agent: req.headers.get('user-agent'),
        referer: req.headers.get('referer'),
      },
      p_error_class: null,
      p_error_message: null,
    });
  } catch (_) { /* never block */ }

  return new Response(
    JSON.stringify({
      error: 'endpoint_deprecated',
      message: 'wladbot-chat-emergent is retired. Use https://leader-os.de/api/chat instead.',
      canonical: 'https://leader-os.de/api/chat',
      deprecated_since: '2026-06-03',
    }),
    { status: 410, headers: { 'Content-Type': 'application/json', ...CORS } },
  );
});
