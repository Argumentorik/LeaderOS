# Launch state — current and remaining work

Production went live on 2026-05-17 after PR #13 merged into `mvpcode`.
Vercel serves the CRA app on all four domains: `leader-os.de`,
`www.leader-os.de`, `leader-check.de`, `www.leader-check.de`.

**This doc is the state tracker.** For the go-live execution sequence, see
`docs/LAUNCH_DAY.md`. For incident response, see `docs/INCIDENT_RUNBOOK.md`.

Last updated after PR #16 (CSP allowlist fix) merged at commit `561e50e`.

---

## Live infrastructure

| Layer | State | Notes |
|---|---|---|
| Vercel frontend | ✅ Live | `mvpcode` HEAD auto-deploys; 4 domains served |
| Supabase EU (`srujvjjncrszhaaxepxf`) | ✅ Live | Advisor: 0 errors, 3 reviewed WARNs |
| PostHog EU | ✅ Live | inline init in `frontend/public/index.html`, project `phc_xmMQne...` |
| Sentry frontend (`leader-os`, `leader-check` projects) | ✅ Live* | * if Vercel env vars set + redeploy happened |
| Sentry backend (`leader-os` project) | 🔴 Wired, not deployed | `backend/server.py` has init; pod is stale |
| CSP report-only | ✅ Live | EU PostHog + Sentry hosts allowlisted (PR #16) |
| Supabase migrations | ✅ Pinned | `supabase/migrations/20260517195842_lock_ops_…sql` matches live DB |
| Frontend Stripe checkout | ✅ Wired | Calls live `/api/payments/*` — backend bug blocks this |
| Backend Stripe webhook | 🔴 Wired on mvpcode, not deployed | Native signature validation in PR #10 |

---

## Remaining work in priority order

### 🔴 HARD BLOCKERS (must do before opening to real users)

#### HB1. Pod backend pull (15 min)

The Emergent pod is 14 commits behind mvpcode. Without this, the backend:
- Has the old Stripe webhook handler (returns 200 on any exception — exploitable)
- Has no Sentry init (server errors invisible)
- Has no CSP-aware logging

**Fix:** Emergent UI → "Pull from GitHub" → branch `mvpcode`. Then set
`SENTRY_DSN` env var on the pod and `sudo supervisorctl restart backend`.
Full sequence in `docs/LAUNCH_DAY.md §Phase 1`.

#### HB2. Stripe switch from test → live (30 min)

`STRIPE_API_KEY` on the pod is still `sk_test_...`. Until this is `sk_live_...`:
- Real customer cards fail at checkout
- Test cards work but revenue = €0

**Fix:** create live products + webhook in Stripe Dashboard, copy
`sk_live_...` + `whsec_...` into Emergent's env-config UI, restart backend.
Full sequence in `docs/LAUNCH_DAY.md §Phase 2` (with the 4 product IDs +
6 webhook events needed).

#### HB3. End-to-end smoke test (15 min)

Don't open the doors until this passes:
```bash
bash scripts/verify-launch.sh
```
Plus the manual flows in `docs/LAUNCH_DAY.md §Phase 3` (signup, checkout
with real card, force-error in DevTools).

---

### 🟡 SOFT BLOCKERS (won't break launch, do same-day)

| # | Item | Effort | Done? |
|---|---|---|---|
| SB1 | GitHub: set default branch to `mvpcode` | 30 sec UI | ☐ |
| SB2 | GitHub: delete 9 dead `claude/*` branches | 2 min UI | ☐ |
| SB3 | Supabase: enable HaveIBeenPwned password protection | 30 sec UI | ☐ |
| SB4 | Sentry: delete vestigial `javascript-nextjs` project | 30 sec UI | ☐ |

---

### 🟢 POST-LAUNCH (do in week 1)

- Re-run `get_advisors(type='performance')` after 7 days of traffic. Currently
  flagged 25 unused indexes — these are cold from zero traffic. Don't drop
  any until real usage shows what's actually unused.
- Set up Sentry alert rules (Slack/email when issue volume > threshold).
- Configure PostHog dashboards for activation, retention, revenue funnel.
- Address the 3 unindexed FKs on email tables (`email_events`, `email_sends`,
  `email_suppressions`) — only matters at ~10k emails/day.
- Schedule weekly Dependabot PR reviews.
- Decide on Edge Functions (PR #5) — defer or merge.

---

## Branch hygiene reference

### KEEP

- `mvpcode` — production source of truth
- `backup/mvpcode-pre-emergent-2026-05-17` — pre-Emergent snapshot, archive
- `iter-80-emergent` — Emergent's auto-push branch (active, do not delete)
- `dependabot/*` — auto-maintained
- This PR's branch — delete after merge

### DELETE (after SB1 default-branch swap)

All 9 have zero content diff vs `mvpcode`:
- `claude/install-supabase-cli-Z8CF9`
- `claude/integrate-sentry-mcp-BV4Ev`
- `claude/setup-posthog-eu-Oy6Ly`
- `claude/add-supabase-mcp-server-wVHPR`
- `claude/cleanup-ci-workflow-QiBAS`
- `claude/fix-xss-report-generator-9vIjG`
- `claude/framer-mcp-relay-Ot1Oh`
- `claude/mcp-server-integration-WWmJL`
- `claude/rename-default-branch-KQrTc`

Other transient branches (`claude/godmode-launch-prep`, `claude/godmode-followup`,
`claude/csp-allowlist-fix`, `claude/security-hardening-tonight`) — all merged
via PRs already, safe to delete.

---

## Open security advisor items (all reviewed, all non-blocking)

| # | Item | Verdict | Action |
|---|---|---|---|
| 1 | `upsert_incomplete_attempt` callable by `anon` | Keep as-is | Funnel capture needs anonymous write |
| 2 | `is_admin()` callable by `authenticated` | Keep as-is | Returns boolean only, no escalation; gated on `auth.uid()` + `meta_tags ANY('admin')` |
| 3 | Leaked password protection disabled | Fix via UI | SB3 above — one toggle |

Migration `20260517195842_lock_ops_dashboard_views_to_service_role.sql`
applied on 2026-05-17 cleared the previous 2 ERROR-level findings. Repo
mirrors live DB; future `supabase db push` won't re-grant `anon`.

---

## How to read this doc

- **🔴 hard blocker** = real customers will hit problems (payment failures, blind debugging)
- **🟡 soft blocker** = should fix today, but launch won't fall over
- **🟢 post-launch** = improvements that wait for real traffic data

When everything in 🔴 is ☑, the launch is safe to open. When 🟡 is ☑, the
operational footing is solid.
