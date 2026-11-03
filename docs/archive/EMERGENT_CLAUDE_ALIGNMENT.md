> **⚠️ HISTORISCH.** Die RAG-Checks unten (externer Embedding-Key in `.env`, `match_wladbot` in `chat.py`) gelten nicht mehr: Embeddings laufen lokal (`services_embeddings.py`, 384 dim), Konsistenz-Check via `GET /api/rag-status`. Aktuelle Referenz: `memory/RAG_SYSTEM.md`.


# 🎯 EMERGENT POD ↔ CLAUDE CODE ALIGNMENT (Iter 82 Final)

**Date**: 2026-02 · **Source**: Emergent Pod (`main` branch, no `origin` remote)  
**Target**: `aiporator/SHIPOS` branch `mvpcode`

This document is the **single source of truth** for what the Emergent E1 agent has changed in the live pod that is NOT yet reflected in your GitHub `mvpcode` branch. Use it to do a clean merge.

---

## 🚨 CRITICAL — Read First

The Emergent pod at `/app` has NO `origin` git remote. Every commit listed below is a local-only Emergent auto-commit. To get these into `mvpcode`, you must either:

**Path A**: From inside the pod (you have a GitHub PAT)
```bash
cd /app
export GITHUB_PAT="ghp_xxxxxxxxxxxx"
git remote add origin "https://${GITHUB_PAT}@github.com/aiporator/SHIPOS.git"
git fetch origin
git checkout -b emergent-iter82-pod-state
git push origin emergent-iter82-pod-state
# Then open PR emergent-iter82-pod-state → mvpcode on GitHub
```

**Path B**: From Claude Code (recommended — your laptop has the PAT already)
```bash
cd /path/to/local/SHIPOS
git checkout mvpcode
git pull --ff-only origin mvpcode

# Apply each change listed in the diff below
# (see sections 1-11 below for verbatim file patches)

# Verify with: bash scripts/deploy-backend.sh --branch mvpcode (after origin set)
```

---

## 📋 Changes That Must Land on `mvpcode`

### 1. backend/.env (ENV vars — NOT in git, set manually)

```bash
# Required additions:
EMERGENT_LLM_KEY=sk-emergent-c9aA8F6D100Dd693d4
# (Old key sk-emergent-c08fEbE10D29B5B4dC was invalid — all LLM endpoints 401'd)

JWT_SECRET=5DhuSLDtbDIv6haU6fcvV4QPuYaULV6CjZiFlaJVzg0md7zL-HMsSbWoMymnDv5HJp9ZeyjBljz4S9dHBpGQdg
# (Iter 80: 64-char secrets.token_urlsafe(64) — required, backend boots fail-fast if missing)

SENTRY_DSN=https://a7ea61a3e6e122ac9427ae9184fff624@o4511406606516224.ingest.de.sentry.io/4511407177990224
# (Iter 82: ready for PR #10 once Sentry SDK is wired)
```

⚠️ These MUST also be set in Emergent Production Deploy env-config UI before launch.

### 2. backend/config.py — Fail-fast on missing JWT_SECRET

```python
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')
JWT_SECRET = os.environ.get('JWT_SECRET')
if not JWT_SECRET:
    raise RuntimeError(
        "JWT_SECRET is not set in environment. Refusing to start — "
        "every /api/auth/login would return 500. "
        "Set a cryptographically random 64+ char value in backend/.env."
    )
OAUTH_SESSION_URL = os.environ.get('OAUTH_SESSION_URL')
```

### 3. backend/routes/auth.py — Google OAuth graceful 503

In `google_session()` function, add this check BEFORE `httpx.AsyncClient()`:

```python
if not OAUTH_SESSION_URL:
    raise HTTPException(
        status_code=503,
        detail="Google login is not configured on this environment. Use email/password.",
    )
```

### 4. backend/routes/admin.py — Iter 80 (already there, verify)

`require_admin()` returns 403 for anyone not in ADMIN_EMAILS allowlist AND not `is_admin=true`.

### 5. backend/routes/video.py — Video Trial Logic

```python
from services_tier import require_feature, resolve_user_tier
from services_video_trial import get_video_trial_status, consume_video_trial

@router.get("/user/video-trial-status")
async def get_user_video_trial_status(request: Request):
    user = await get_current_user(request)
    tier_info = await resolve_user_tier(user)
    return await get_video_trial_status(user, tier_info["tier"])

# In analyze_video_challenge() — replace `await require_feature(...)` with:
tier_info = await resolve_user_tier(user)
trial = await get_video_trial_status(user, tier_info["tier"])
used_trial_slot = False
if trial["active"]:
    await consume_video_trial(user["user_id"])
    used_trial_slot = True
else:
    await require_feature(user, "video_analysis")
# ... existing credit_result code ...

# At end of try block, before return:
if used_trial_slot:
    analysis["_trial"] = await get_video_trial_status(
        await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0}) or user,
        tier_info["tier"],
    )
return analysis
```

### 6. backend/services_video_trial.py — NEW FILE

See full file in pod at `/app/backend/services_video_trial.py`. Key constants:
- `TRIAL_DAYS = 14`
- `TRIAL_VIDEO_LIMIT = 3`
- `TRIAL_ELIGIBLE_TIERS = {"free", "starter", "standard"}`

### 7. frontend/src/App.js — /admin route removed, secret URL added

```jsx
{/* /admin REMOVED — catch-all redirects to /dashboard */}
<Route path="/wlad-control-x7k9q2" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
```

### 8. frontend/src/components/layout/Sidebar.js — Admin link removed

Remove `useAuth` import. Remove admin link from sidebar nav sections entirely. Admin section now contains only `/coaching`.

### 9. frontend/src/components/layout/DashboardLayout.js — BotMascot removed

```jsx
// Remove import: import { BotMascot } from '../shared/BotMascot';
// Remove JSX: <BotMascot />
```

### 10. frontend/src/lib/pdfGenerator.js — Add missing color

```javascript
const violet = [124, 58, 237];   // ADD this line — was referenced but undefined
```

### 11. frontend/src/pages/ChatPage.js + chat components — Remove 5 Roles

- **DELETE**: `frontend/src/components/chat/chatRoles.js`
- **MODIFY**: `ChatPage.js` — remove `selectedAgent` state, remove `agent` from POST body, remove `activeRole` logic
- **MODIFY**: `ChatRolesHeader.js` — remove RoleTabs + ActiveRolePanel components, simplify header
- **REWRITE**: `ChatEmpty.js` — replace 5 role cards with 6 universal suggestion prompts (DE/EN)
- **MODIFY**: `ChatUpsellModal.js` — replace "5 Rollen" copy
- **MODIFY**: `LoginPage.js` — replace "5 spezialisierte Rollen" subtitle
- **MODIFY**: `BotMascotPanel.js` — replace "5 spezialisierte Rollen" sub

### 12. frontend/src/pages/VideoChallengePage.js — Trial banner

- `canAccess = isAccelerator || Boolean(trial?.active)`
- Load trial state on mount via `GET /api/user/video-trial-status`
- Refresh trial from analysis response `_trial` field
- Show banner with "X / 3 free analyses · trial ends in Y days"

### 13. scripts/deploy-backend.sh — NEW FILE

Deploy script with `--branch <name>` and `--health <url>` args, ff-only pull, conditional pip install, supervisorctl restart, 10s health curl loop. Exit codes 0-5.

### 14. Removed wladhub.com → leader-check.de (Iter 80, already in mvpcode if pulled)

Verify these are still leader-check.de in mvpcode:
- frontend/src/components/layout/Sidebar.js:96
- frontend/src/components/dashboard/wladhub/WladHubEmptyState.js
- frontend/src/components/dashboard/wladhub/WladHubUpgradeCta.js
- frontend/src/components/dashboard/wladhub/WladHubHeader.js
- frontend/src/components/dashboard/WladHubCard.js
- frontend/src/pages/DashboardPage.js
- frontend/src/pages/ReferralPage.js (×2)
- frontend/src/pages/OnboardingPage.js
- frontend/src/pages/CoachingPage.js (mailto support@leader-os.de)
- backend/routes/wladhub.py
- backend/routes/referral.py
- backend/services_tier.py (comment only)

---

## ✅ Verified Working on Pod (E2E Test Iter 82)

All 13 LLM-dependent endpoints return HTTP 200 with valid LLM output:

| Endpoint | Method | Status |
|---|---|---|
| /api/health | GET | ✅ 200 |
| /api/auth/login | POST | ✅ 200 (HS256, httpOnly cookie) |
| /api/chat | POST | ✅ 200 (Kommunikations-Coach JSON) |
| /api/tools (list) | GET | ✅ 200 (7 workflows) |
| /api/tools/conversation-prep | POST | ✅ 200 (LLM JSON) |
| /api/tools/email-optimizer | POST | ✅ 200 |
| /api/tools/decision-maker | POST | ✅ 200 |
| /api/tools/team-event-planner | POST | ✅ 200 |
| /api/tools/meeting-builder | POST | ✅ 200 |
| /api/tools/performance-analysis | POST | ✅ 200 |
| /api/tools/priority-planner | POST | ✅ 200 |
| /api/tools/deep-assist | POST | ✅ 200 (5-step action plan) |
| /api/daily-checkin | POST | ✅ 200 (LLM feedback with score_delta) |
| /api/challenge30/quiz/{day} | POST | ✅ 200 |
| /api/simulations | POST | ✅ 200 (LLM roleplay character) |
| /api/playbooks/{id}/start | POST | ✅ 200 |
| /api/user/video-trial-status | GET | ✅ 200 (NEW endpoint) |
| /api/admin/overview (admin) | GET | ✅ 200 |
| /api/admin/overview (non-admin) | GET | ✅ 403 |
| /api/admin/overview (no-auth) | GET | ✅ 401 |

---

## 🔧 Test Credentials (in /app/memory/test_credentials.md)

```
Admin:        test@test.com / test123             (in ADMIN_EMAILS allowlist)
Non-Admin:    standard@wladbot.test / test123     (free tier)
Free-User:    free@wladbot.test / test123         (free tier, account >14d, trial expired)
Accelerator:  accelerator@wladbot.test / test123  (accelerator — unlimited video)
```

⚠️ **Before launch**: Delete from Prod-MongoDB:
```js
db.users.deleteMany({email: /@wladbot\.test$/})
```

---

## 📦 What's STILL Missing in Pod (Pull from GitHub Pending)

Despite user's "done" claim, these are NOT in pod:

| What | Where it should be | Verify command |
|---|---|---|
| PR #10 Sentry SDK init | backend/server.py + frontend/src/index.js | `grep -c sentry_sdk backend/server.py` → should be > 0 |
| PR #14 Stripe webhook verify | backend/routes/payments.py | `grep -c construct_event backend/routes/payments.py` → should be > 0 |
| PR #15 PostHog wiring | frontend/src/index.js + AuthContext.js | `grep -c posthog frontend/src/index.js` → should be > 0 |
| PR #16 (unknown contents) | ? | ? |
| Voyage RAG wiring (v1.1) | backend/routes/chat.py | `grep -c match_wladbot backend/routes/chat.py` → should be > 0 |
| VOYAGE_API_KEY in env | backend/.env | `grep -c VOYAGE_API_KEY backend/.env` → should be 1 |

**Currently all of the above are 0.** The pull from GitHub has not actually executed.

---

## 🚀 Recommended Launch Sequence (heute abend)

```
T-3h    Get pod-to-GitHub sync done (PAT in Claude Code OR push pod state to PR)
T-2.5h  GitHub mvpcode now contains BOTH PRs #10/#14/#15/#16 AND pod Iter 81/82 fixes
T-2h    Pull merged mvpcode back into pod (via Emergent UI or PAT)
T-1.5h  Verify: 4 greps all > 0 (sentry, construct_event, posthog, match_wladbot)
T-1h    Set Production env-vars: EMERGENT_LLM_KEY, SENTRY_DSN, STRIPE_WEBHOOK_SECRET
T-45m   Stripe LIVE 4 products + webhook endpoint registered
T-30m   Delete @wladbot.test/* users from Prod-MongoDB
T-15m   Smoke test: register → login → 1 LLM call → checkout test card
T-0     🚀 LAUNCH
```

---

## 🤝 Aligned: What E1 Did vs What Claude Code Did

**E1 (Emergent Pod, Iter 80-82):**
- Iter 80: Admin lockdown, leader-check.de migration, JWT_SECRET hardening
- Iter 81: BotMascot removed, video trial (3 free/14d), /admin → /wlad-control-x7k9q2
- Iter 82: 5 Rollen removed from Chat, LLM key rotation, PDF violet fix, OAuth 503 fix

**Claude Code (GitHub `mvpcode`):**
- PR #10: Sentry SDK init (backend + frontend)
- PR #14: Stripe webhook construct_event verify
- PR #15: PostHog wiring
- PR #16: (your call)
- Voyage RAG infrastructure (chunks in Supabase, deferred wiring to v1.1)

**NO OVERLAP** = clean merge possible. No conflicts expected.

---

## 📝 If You Need to Reach E1 (Emergent Pod)

Pod stays alive 24/7. Just send a message in Emergent chat with the request — E1 will:
- Read this file
- Read /app/memory/PRD.md
- Read latest /app/test_reports/iteration_*.json
- Continue from where you left off
