# LeaderOS Growth Loop — Data Model + Event Tracking Spec

> The self-reinforcing system that turns SEO traffic into captured leadership
> problems, problems into WladBot solutions, and solution data back into the
> next round of content. This doc is the buildable contract: the event schema,
> the DB model, and the loops — not just the strategy.

```
        ┌──────────────────────────────────────────────────────┐
        │                                                      │
        ▼                                                      │
   1. ACQUISITION            2. PROBLEM CAPTURE        3. SOLUTION
   SEO pillars + clusters →  WladBot funnel +      →   WladBot diagnosis →
   internal links + schema   inline diagnostics        framework → 3 steps →
        ▲                    (normalized intent)        escalation to app
        │                          │                          │
        │                          ▼                          ▼
        └────────────  4. INTELLIGENCE  ◄───────────────────────┘
            content-gap detection ← problem clustering ← PostHog event stream
```

The loop compounds because Layer 4 reads Layer 2's data and tells Layer 1 what
to write next. Every article ships a capture block; every capture sharpens the
content map.

---

## Layer 2 — the canonical capture event

**One event name, one schema, every surface.** That uniformity is the whole
point — clustering and gap-detection query a single clean stream instead of
reconciling five ad-hoc payloads. The normalization lives in
`frontend/src/lib/leadershipIntent.js` (`classifyIntent` →
`captureLeadershipIntent`).

### `leadership_intent_captured`

PostHog event (project `181271`, eu.posthog.com). Fired whenever a visitor
submits a leadership problem on any marketing surface.

| Property           | Type                          | Notes                                                                 |
| ------------------ | ----------------------------- | --------------------------------------------------------------------- |
| `raw_problem`      | string                        | Verbatim user text. The raw signal for keyword + cluster mining.      |
| `category`         | enum                          | `conflict \| delegation \| performance \| communication \| change \| identity \| other` |
| `leadership_level` | enum \| null                  | `first-time \| senior \| exec \| null`                                |
| `urgency`          | enum                          | `low \| medium \| high` (keyword-detected: "sofort/morgen/krise" → high) |
| `clarity_score`    | number `0..1`                 | How actionable the input is. `len*0.5 + specificity(0.3) + context(0.2)`. |
| `keywords`         | string[]                      | Deduped signal terms (≥4 chars, stopwords dropped, max 8).            |
| `source`           | string                        | Capture surface — see source enum below.                              |
| `article`          | string \| null                | Article slug when captured on a journal page.                         |

**`source` enum** (where the intent was captured):

| Value                 | Surface                                                        |
| --------------------- | ------------------------------------------------------------- |
| `article-right-rail`  | Sticky WladBot mini-card in the article right rail.           |
| `article-diagnostic`  | Inline "Which situation are you in?" block inside body copy.  |
| `wladbot-card`        | Standalone WladBot funnel card (journal index / landing).     |
| `unknown`             | Fallback when a caller forgets to pass `opts.source`.         |

**Person-property roll-up.** On capture, when the category resolves (not
`other`) or a level is detected, we also `posthog.people.set`:

- `last_problem_category` — the visitor's most recent problem category.
- `leadership_level` — sticky once detected.

This makes "all first-time leaders who asked about delegation" a queryable
cohort without a join.

> ⚠️ Person-on-events is enabled on this project. `person.properties.*` on the
> events table reflects the value **at ingest time**, not the current value.
> For "current dominant category" use the persons table, not events.

### Why v1 is keyword-based (and the upgrade path)

Classification is a client-side keyword scorer on purpose: zero latency, zero
cost, ships today, starts filling the intent database immediately. The
`category` model can move to a server-side LLM pass later **without changing
the event name or schema** — `classifyIntent` is the only thing that changes,
and every downstream query keeps working. Don't rename fields; only add.

---

## Layer 3 — solution routing

`wladbotUrlForIntent(intent, articleTitle)` builds the deep-link into the app's
WladBot (`https://leaderos.de/chat`) carrying the captured intent so the bot
opens with a category-tuned diagnosis instead of a blank prompt:

```
https://leaderos.de/chat
  ?prompt=<category-tuned ask for Diagnose + Framework + 3 Schritte>
  &utm_source=leader-os
  &utm_medium=intent-funnel
  &utm_campaign=<source>
  &cat=<category>
  &article=<slug>
```

The funnel handoff is: **marketing captures → app solves**. The `cat`,
`article`, and `utm_campaign` params let the app attribute every conversation
back to the content + problem that produced it (Loop B below).

---

## Layer 4 — the intelligence model (proposed DB schema)

The PostHog stream is the source of truth for events; for clustering and the
weekly content-gap report we land a normalized copy in Postgres (Supabase
project `srujvjjncrszhaaxepxf`). Proposed tables — **not yet migrated**; apply
via `apply_migration` per the working rules, all views `security_invoker`, all
trigger functions service-role-only.

### `leadership_intents` (one row per capture)

| Column             | Type          | Notes                                            |
| ------------------ | ------------- | ------------------------------------------------ |
| `id`               | uuid PK       | `gen_random_uuid()`                              |
| `created_at`       | timestamptz   | ingest time                                      |
| `raw_problem`      | text          | verbatim                                         |
| `category`         | text          | enum-checked                                     |
| `leadership_level` | text \| null  |                                                  |
| `urgency`          | text          |                                                  |
| `clarity_score`    | numeric(3,2)  |                                                  |
| `keywords`         | text[]        |                                                  |
| `source`           | text          |                                                  |
| `article_slug`     | text \| null  | FK-soft to content registry                      |
| `email_lower`      | text \| null  | set if the visitor is known — the cross-platform dedup key |
| `cluster_id`       | uuid \| null  | assigned by the clustering job                   |

### `intent_clusters` (emergent problem groups)

| Column          | Type        | Notes                                              |
| --------------- | ----------- | -------------------------------------------------- |
| `id`            | uuid PK     |                                                    |
| `label`         | text        | human-readable cluster name (e.g. "delegation to a senior")|
| `category`      | text        | dominant category                                  |
| `size`          | int         | member count                                       |
| `top_keywords`  | text[]      | highest-TF terms across members                    |
| `has_article`   | bool        | does a published article already serve this?       |
| `first_seen`    | timestamptz |                                                    |
| `last_seen`     | timestamptz |                                                    |

### `content_gaps` (the report Layer 1 consumes)

A `security_invoker` view, not a table — derived from clusters that are large,
recent, and `has_article = false`:

```
intent_clusters
  where has_article = false
    and size >= <threshold>
    and last_seen > now() - interval '14 days'
  order by size desc
```

Each row is a "write this next" instruction: a real, sized, currently-unanswered
leadership problem with the keywords to target.

---

## The four loops

| Loop | Name              | Mechanic                                                                 |
| ---- | ----------------- | ------------------------------------------------------------------------ |
| A    | Acquisition       | Pillar ranks → cluster articles internal-link to it → topical authority rises → pillar ranks higher. |
| B    | Capture→Solve     | Every article has a capture block → intent → WladBot deep-link with attribution → conversation → conversion. |
| C    | Solution quality  | WladBot answers (diagnosis/framework/steps) feed back which framings convert → tighten the prompts. |
| D    | Content feedback  | Clustered intents → `content_gaps` → write the cluster article → it captures more intent in that category. |

The flywheel: more traffic → more captured problems → better content map →
more traffic. Each turn is cheaper than the last because the content compounds.

---

## What's shipped vs. proposed

**Shipped (this branch):**

- ✅ Intent Schema Layer — `frontend/src/lib/leadershipIntent.js`
  (`classifyIntent`, `captureLeadershipIntent`, `wladbotUrlForIntent`).
- ✅ `leadership_intent_captured` PostHog event + person roll-up.
- ✅ Inline diagnostic block (`InlineDiagnostic.jsx`) + `diagnostic` block type
  in `BlockRenderer.jsx`, wired into all four leadership-development pillars.
- ✅ WladBot right-rail card routed through the normalized capture.

**Proposed (next):**

- ⬜ Cluster Article Generator — 1 pillar → ~10 supporting cluster articles
  with internal links back to the pillar (Loop A).
- ⬜ Diagnostic blocks in **every** SEO article, not just the four pillars.
- ⬜ Supabase tables + clustering job + `content_gaps` view (Layer 4).
- ⬜ Weekly "top emerging leadership problems" report off `content_gaps`
  (Loop D automation).

---

## Build rules for anyone extending this

1. **Never rename an event field.** `leadership_intent_captured` is a contract
   the Intelligence Layer depends on. Add fields; don't break old ones.
2. **Every new capture surface uses `captureLeadershipIntent`** — never call
   `posthog.capture('leadership_intent_captured', …)` by hand. One code path,
   one schema.
3. **Pass `source`.** A capture without a `source` lands as `unknown` and is
   useless for attribution.
4. **Keep classification client-side and synchronous in v1.** No network call
   in the funnel path — analytics must never block the CTA.
5. **DB writes use `email_lower`** as the dedup/link key, same as everywhere
   else in the schema (see `docs/app/SCHEMA.md`).
