# Schema reference

Project: `srujvjjncrszhaaxepxf` · Postgres 17 · all tables in `public`, RLS enabled.

## Tables

### `users` — identity, cross-platform

| Column                | Type             | Notes                                                                    |
| --------------------- | ---------------- | ------------------------------------------------------------------------ |
| `id`                  | uuid pk          | App-side ID. Distinct from `auth.users.id`.                              |
| `email`               | text             | Display email.                                                           |
| `email_lower`         | text (generated) | `lower(trim(email))`. **UNIQUE** — cross-platform dedup key.              |
| `auth_user_id`        | uuid (nullable)  | FK → `auth.users.id`. Set by `handle_new_auth_user` on Supabase signup.  |
| `full_name`           | text             |                                                                          |
| `profile_data`        | jsonb            | App-specific user state.                                                 |
| `has_completed_check` | bool             | True iff the leader-check funnel was completed.                          |
| `meta_tags`           | text[]           | Multi-platform/role tag set. Auto-maintained — see CLAUDE.md.            |
| `source_platform`     | text (CHECK)     | `'leader-check' | 'leader-os' | 'manual'`. **First touch only.**         |
| `created_at`          | timestamptz      |                                                                          |
| `updated_at`          | timestamptz      | Maintained by `users_updated_at` trigger.                                |

Indexes: pk, `email_lower` UNIQUE, `auth_user_id` UNIQUE-partial,
GIN on `meta_tags` and `profile_data jsonb_path_ops`,
`(created_at DESC)`, `(source_platform, created_at DESC)`,
partial `(created_at DESC) WHERE has_completed_check`.

### `sessions` — usage events

| Column         | Type             | Notes                                  |
| -------------- | ---------------- | -------------------------------------- |
| `id`           | uuid pk          |                                        |
| `user_id`      | uuid             | FK → `users.id`.                       |
| `platform`     | text (CHECK)     | `'leader-check' | 'leader-os'`.        |
| `started_at`   | timestamptz      |                                        |
| `ended_at`     | timestamptz null |                                        |
| `duration_sec` | int generated    | `extract(epoch from ended_at-started_at)` when ended_at set. |
| `activity_data`| jsonb            |                                        |
| `ip_address`   | inet             |                                        |
| `user_agent`   | text             |                                        |

Indexes: `(user_id, started_at DESC)`, `(platform, started_at DESC)`, `started_at DESC`, `platform`, `user_id`.

A trigger `sessions_tag_user_platform` keeps `users.meta_tags` in sync — every
session insert adds its `platform` to the user's meta_tags via
`record_platform_touch`.

### `leadership_insights` — KI / Rhetoric / EQ scores

| Column            | Type            | Notes                                                              |
| ----------------- | --------------- | ------------------------------------------------------------------ |
| `id`              | uuid pk         |                                                                    |
| `user_id`         | uuid            | FK → `users.id`.                                                   |
| `campaign_id`     | text            |                                                                    |
| `ki_score`        | numeric (0..100)|                                                                    |
| `rhetoric_score`  | numeric (0..100)|                                                                    |
| `eq_score`        | numeric (0..100)|                                                                    |
| `composite_score` | numeric (gen)   | `0.35*ki + 0.35*rhetoric + 0.30*eq`.                               |
| `action_plan`     | jsonb           |                                                                    |
| `plan_status`     | enum            | `draft | active | completed | archived`.                            |
| `assessed_at`     | timestamptz     |                                                                    |

Indexes: pk, `user_id`, `assessed_at DESC`, `(user_id, assessed_at DESC)`.

### `incomplete_check_attempts` — leader-check funnel breadcrumbs

Anonymous visitor state, keyed by client-side `session_id`. Anon writes via
`upsert_incomplete_attempt` RPC. After completion, `link_check_completion`
stamps `answers_so_far.completed = true` so dashboards stop counting it as abandoned.

### `strategist_plays` — AI-generated weekly plays

`is_active = true` rows are the current set; older plays are deactivated. `period_days`
buckets plays by horizon (e.g. 7, 30). `confidence ∈ {high, medium, low}`.
Generated by edge function `ai-strategist`, kicked off by `trigger_strategist(p_range_days)`.

### `wladbot_documents` — RAG corpus

pgvector (cosine, HNSW). `source ∈ {framework, transcript, book, article, manual}`.
Chunk linked-list via `previous_chunk_id` / `next_chunk_id`.
RPCs: `match_wladbot_documents`, `match_wladbot_with_neighbors`.

### `marketing_attribution`

Per-user UTM/referrer record (one or more rows). Use `attribution_first` ordering
(`order by user_id, attributed_at asc`) for first-touch attribution.

### `prompt_templates`

Versioned LLM system prompts. AFTER INSERT trigger `trg_deactivate_prior_prompt_versions`
deactivates older versions automatically. Unique partial index on `name WHERE is_active`
guarantees at most one active version per name.

---

## Functions / RPCs (public schema)

| Function                                     | Caller         | Purpose                                                            |
| -------------------------------------------- | -------------- | ------------------------------------------------------------------ |
| `handle_new_auth_user()` (trigger)           | auth.users     | Auto-link new auth users to existing `public.users` by email_lower; tag `'leader-os'`. |
| `upsert_incomplete_attempt(...)`             | **anon**       | Save funnel progress from leader-check landing page.               |
| `link_check_completion(email,name,jsonb,session_id)` | service_role | Mark check completed, ensure user row exists, tag `'leader-check'`. Cross-platform safe. |
| `record_platform_touch(user_id, platform)`   | service_role   | Idempotently append a platform tag to `users.meta_tags`.           |
| `upsert_leadership_insight(...)`             | service_role   | Insert a new insights row, set plan_status='active'.               |
| `trigger_strategist(p_range_days)`           | service_role   | HTTP-POST the ai-strategist edge function (uses Vault `service_role_key`). |
| `dashboard_summary(days_param=7)`            | authenticated  | Heavyweight JSONB blob for the in-app dashboard frontend.          |
| `user_context(p_auth_user_id)`               | authenticated  | Per-user 360 JSONB (profile + latest insight + session counts).    |
| `is_admin()`                                 | authenticated  | True if caller's user has `'admin'` in meta_tags.                  |
| `grant_admin(p_email)`                       | service_role   | Append `'admin'` to a user's meta_tags by email.                   |
| `match_wladbot_documents(...)`               | authenticated  | RAG: cosine-similarity search over `wladbot_documents.embedding`.  |
| `match_wladbot_with_neighbors(...)`          | authenticated  | RAG: similarity search + adjacent chunks for context.              |

---

## RLS at a glance

All tables have RLS enabled. Pattern:

- `service_*` policy: `service_role` can do everything (used by edge functions).
- `user_*` policy: `authenticated` users can read/manage their **own** rows
  via `auth_user_id = auth.uid()` join through `users`.
- `admin_*` policy: `is_admin()` gates writes/reads of admin-only tables
  (`prompt_templates`, `strategist_plays`).

Anon role has no direct table grants; the only anon entry point is the
`upsert_incomplete_attempt` RPC.
