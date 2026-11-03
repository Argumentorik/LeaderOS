# Dashboard layer

All views live in `public` and are **`security_invoker = true`** so RLS on base
tables is honored. Open them in Supabase Studio → **Database → Views**, or query
in the **SQL Editor**.

## Views (alphabetical)

| View                                 | Shape       | What it answers                                                    |
| ------------------------------------ | ----------- | ------------------------------------------------------------------ |
| `v_dashboard_overview`               | 1 row × 21  | Top-line KPIs: total/new users, sessions, scores, plays, abandons. |
| `v_dashboard_health`                 | 1 row × 11  | One-shot system health snapshot — pin this on Studio overview.     |
| `v_dashboard_cross_platform`         | n × 7       | Users by platform_segment (both / leader-os-only / leader-check-only / none). |
| `v_dashboard_platform_journey`       | n × 4       | first_platform × ever-touched matrix.                              |
| `v_dashboard_user_360_recent`        | 50 × ~30    | Most recent 50 users with full 360.                                |
| `v_dashboard_signups_daily`          | n × 4       | Daily signups by platform, last 90d.                               |
| `v_dashboard_session_activity_daily` | n × 5       | 30d sessions/unique-users/avg-duration by platform.                |
| `v_dashboard_funnel`                 | 1 row × 5   | 30d Leader-Check funnel: started → identified → completed → abandoned. |
| `v_dashboard_score_distribution`     | n × 2       | Composite-score histogram (5 buckets).                             |
| `v_dashboard_attribution_top`        | ≤25 × 5     | Top UTM source × campaign with avg score, last 90d.                |
| `v_dashboard_insights_weekly`        | ≤26 × 6     | Weekly trend of KI / Rhetoric / EQ / composite.                    |
| `v_dashboard_plan_status`            | n × 3       | Action plan status breakdown with avg score.                       |
| `v_dashboard_strategist_freshness`   | n × 7       | Active plays per period_days, hours since generated, confidence mix. |
| `v_dashboard_wladbot_corpus`         | n × 7       | RAG corpus stats: chunks, parents, embedding coverage.             |
| `v_dashboard_abandonment_by_step`    | n × 4       | 14d abandoned attempts grouped by `last_step`.                     |
| `v_dashboard_prompt_templates`       | n × 5       | Per-template active/latest version status.                         |

## Underlying primitive

`v_user_360` (not prefixed `v_dashboard_*`) is the per-user join used by all the
cross-platform dashboard views. It's also useful for ad-hoc ops queries:

```sql
-- Users active on both platforms in the last 7 days
select email, platform_segment, last_leader_check_at, last_leader_os_at, composite_score
from v_user_360
where platform_segment = 'both'
  and last_session_at >= now() - interval '7 days'
order by last_session_at desc;
```

## In-app dashboard

The LeaderOS app frontend calls `dashboard_summary(days_param := N)` which
returns a single JSONB document with everything the in-app dashboard renders
(KPIs, funnel, channels, layers, cohorts, daily, plays).

This is *separate from* the Studio views — `dashboard_summary` is shaped for the
React UI; the views are shaped for ad-hoc analysis in Studio.

## Adding a new panel in Studio

1. Click the view in **Database → Views** to inspect rows.
2. Or in **SQL Editor**, write `select * from v_dashboard_xxx` and click **Save**.
   Studio remembers saved queries per project.
3. For charts: Studio's chart toggle on the SQL Editor result works for any view
   with a numeric column and a label/time column.

## When to add a new view vs a new RPC

- **View** → it's a cross-section of state, refreshes every read, no parameters
  beyond what users add as a `where` clause.
- **RPC (function)** → it takes parameters (`days_param`, etc.), returns a complex
  JSONB shape, or runs heavy logic.

If unsure, start with a view; promote to an RPC only when callers need parameters.
