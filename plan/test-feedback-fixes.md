# Leader-Check: code fixes for test-phase feedback (adapted to this repo)

## Context

The original plan was written against the **LeaderOS product app** (chat, challengers, tools, playbooks, video,
credits, 30-day challenge, dashboard, onboarding tour). **This repo is the Leader-Check funnel**
(leadercheck.de): Landing → UserForm → 20-question quiz → optional WladBot chat → Analyzing → Report → Roadmap →
`/close` sales page, plus the floating `AICoach` on report/roadmap/close. Stack: FastAPI + Mongo (Motor),
`emergentintegrations` LlmChat (Claude Sonnet 4.5), Resend, Stripe; CRA/craco React frontend; Emergent hosting.

Paths: `fe/` = `frontend/src/`, `be/` = `backend/`.

### What's already done here (don't redo)

- **1.7b "coworker's report-flow plan"** is implemented (Iter 42, `plan/plan.md`, `memory/PRD.md`): clear
  "Meinen Report jetzt erstellen" CTA, WladBot marked optional + told not to promise background report/email,
  honest Analyzing status, retry button, answers kept until report is persisted, server-side report recovery
  (`fe/utils/reportRecovery.js`), server-side quiz progress + resume link + 2 h / 24 h abandonment mails.
- Free-vs-paid wording in the report (`fe/components/report/ReportPackages.jsx`).

### Not applicable to this repo (keep in the LeaderOS app plan)

1.3 (challenger/tools/simulation/check-in jobs), 1.4 ffmpeg, 1.6 credits, 1.8 Fly/`/api/health/deep`/Sentry/
`/api/chat/send` limiter, 2.1 challengers, 2.2 30-day quiz/onboarding/check-in/tools drafts, 2.3 chat context
panel, 2.4 chat history/sessions, 2.5 playbooks, 3.1–3.4 and 3.6–3.7 (subtasks, action days, tasks, tour,
layouts, dashboard), Phase 4 credits UI, Phase 5 chat page/dock/iPad history panel, Phase 6 voice, Phase 7
challenge mails / EQ tooltips / videos. **2.6 Leader-check import** has a half here (see 2.3 below).

---

## Phase 1: "Bot unreachable" and failed analyses (complaints 1, 5)

### 1.1 Rate limits are per-IP and likely shared by every tester ⚠️ check first

- Limits: `/user/create` 10/min (`be/server.py:140`), `/quiz/generate-report` 6/min (`be/routes/quiz.py:185`),
  `/quiz/progress` 60/min (`:251`), `/coach/chat` 20/min (`:334`).
- Key is `secure_client_ip` = **right-most** `X-Forwarded-For` hop (`be/services/security.py:183-193`). Behind
  Emergent's ingress chain that hop may be an internal proxy IP, which would put **all users in one bucket**.
  Even if it's the real client IP, a group test on one office Wi-Fi/NAT shares it: 20 coach messages/min across
  the whole room → 429.
- 429s are then masked (see 1.2), which looks exactly like "bot unreachable"; `/quiz/progress` 429s silently
  drop server-side saves.
- Fix: log `request.client.host` + full XFF in prod to see what the key really is; pick the correct hop (or the
  ingress's trusted client-IP header). Key AI routes by `session_id` (+ IP as a coarse outer limit), and raise
  limits: coach ~10/min per session, progress ~120/min per session.

### 1.2 Stop masking errors and losing the user's message

- `be/routes/quiz.py:344-345, 362-365`: coach errors return **HTTP 200** with "Ein Fehler ist aufgetreten…" →
  the frontend can't tell a failure from an answer. Return 503 with a German `detail`.
- `fe/pages/Quiz.jsx:26-46` (pre-report WladBot): input is cleared before the request (`:30`), and on **any**
  error a fake bot reply "Danke fürs Teilen!…" is inserted (`:40-42`). Show a real error bubble with
  "Erneut senden", keep/restore the text, and don't count it as an exchange.
- `fe/components/AICoach.jsx:32-55`: same pattern (clears at `:37`, generic text at `:47-51`). Restore input on
  error, add retry, and show the backend `detail` (429 → "Zu viele Anfragen, kurz warten").
- Add an axios `timeout` (e.g. 45 s) to both coach calls; none is set today.

### 1.3 WladBot has no memory between messages

- `be/routes/quiz.py:359` builds a fresh `LlmChat` per request and sends only the latest message, so the bot
  never sees earlier turns and answers out of context. Pass the last ~8 turns: add `history: List[ChatTurn]`
  to `CoachMessage` (`be/models.py:41-43`) and send it from `Quiz.jsx` / `AICoach.jsx`. Alternatively, persist
  turns in `db.coach_messages` keyed by `session_id`. Inject the history into the prompt (cap length).

### 1.4 Report generation: timeouts, idempotency, hollow reports

- **LLM timeout:** `generate_ai_narrative` (`be/routes/quiz.py:146-164`) has no timeout. Wrap `send_message` in
  `asyncio.wait_for(…, 60)` so the server fails *before* the client gives up at 90 s (`fe/pages/Analyzing.jsx:81`).
  Also measure real latency on prod: if the Emergent ingress cuts requests around 30 s, move to
  `POST /quiz/generate-report` → `{job_id}` + `GET /quiz/report-status/{sid}` polling. Analyzing already has the
  UI states; only the transport changes.
- **Silent fallback:** on LLM/JSON failure the report is **persisted** with the generic `_NARRATIVE_FALLBACK`
  ("Dein individuelles Führungsprofil wurde analysiert.") and shown as if complete. That's a "failed analysis".
  Do one retry (the same `LlmChat` instance keeps the prompt, so append a "nur valides JSON" message). If it
  still fails, store `narrative_status:"fallback"`, and on the Report page show "Analyse-Text wird nachgeladen" +
  a `POST /quiz/regenerate-narrative/{sid}` button (report_token-protected).
- **Idempotency:** a client retry after a timeout (or a double-click, or a reload of `/analyzing`) while the first
  request is still running inserts a **second report** (`:215`), sends a **second report mail with PDF**
  (`:228-229`, no dedup in `be/routes/email.py:31-58`), and re-runs the drip enqueue. Fix: if a report for
  `session_id` exists and was created < 10 min ago, return it (with fresh tokens) instead of regenerating;
  otherwise upsert by `session_id`. Dedup the auto report mail via `email_log` (`type:"report_auto"`, `session_id`).
- `GET /report/{sid}` (`:328`) does `find_one` without sort → returns the **oldest** report when duplicates exist.
  Sort by `created_at` desc (and add an index on `reports.session_id`).
- Analyzing waits a fixed 3 s before even starting the request (`fe/pages/Analyzing.jsx:101`). Start immediately;
  the animation can run in parallel.

### 1.5 Monitoring

- `GET /api/health` only (`be/server.py:121-123`). Add `/api/health/deep` (Mongo ping + LLM key present +
  last-N narrative failures) and put an uptime monitor on it.
- Log + count: coach 429/503, narrative fallbacks, generate-report duration. Show them in the admin stats
  (`be/routes/admin.py:_build_overview_stats`) so a spike is visible during the next test round.

---

## Phase 2: Never lose user data (complaint 2)

### 2.1 Login is broken for returning users (likely the biggest "lost my report" cause)

- `fe/pages/Login.jsx:44-63` calls legacy `POST /auth/quick-login`, which (since the security hardening) only
  sends an OTP and returns `{status, masked_email}` (`be/routes/auth.py:298-310`). The frontend then stores
  `emergent_user` with `session_id: undefined` and navigates to `/diagnose` (`has_report` is undefined). The user
  never gets a code-entry field, so they can't get back to their report on another device or after a storage wipe.
- Backend is ready: `POST /auth/quick-login/request` + `/verify` return `session_id`, `has_report`, `report_token`
  (`be/routes/auth.py:151-188`). Add the OTP step in `Login.jsx`; on success, store `emergent_user` +
  `leaderos_report_token` and navigate to `/report` (recovery via `reportRecovery.js` then just works).
- `Login.jsx:296` "Ohne Anmeldung fortfahren" → `/diagnose-guest`, which doesn't exist (blank page). Point it at
  `/diagnose`.

### 2.2 Report reachable from the email on any device

- The report mail's only CTA goes to `/roadmap` (`be/email_templates.py:212`; plan-reminder `:286` and payment
  mail `:358` too), and no mail links back to the report. On a phone/mail client without localStorage, `/report` bounces to `/` (`fe/pages/Report.jsx:31`).
- Add `https://leadercheck.de/report?sid=<sid>&t=<report_token>` (30-day JWT already exists) to the report mail.
  In `Report.jsx`/`reportRecovery.js`, read `sid`/`t`, persist them, recover, then strip them from the URL. Same
  for `/roadmap`.
- Report.jsx fallback when nothing can be recovered: show "Report per Login-Code öffnen" (→ `/login`) instead of
  silently redirecting to `/`.

### 2.3 Leader-check results not arriving in LeaderOS (this repo's half of 2.6)

- `sync_token` is issued and stored (`fe/pages/Analyzing.jsx:88-90`) but **never sent anywhere**:
  `PaymentSuccess.jsx:6,56` and `ActivateKey.jsx:64` redirect to bare `https://leaderos.de`, and no code calls
  `POST /auth/leader-os-sync`. The documented handoff (PRD "Sync-Flow") isn't wired in the frontend.
- Fix: before redirecting, call `/auth/leader-os-sync` with the report_token and append `?sync_token=…`. Confirm
  with the LeaderOS app owners which param/endpoint they consume. The other half (`auto_sync_wladhub_on_signup`,
  `email_lower` lookup, `upsert_incomplete_attempt` signature) lives in the LeaderOS repo.

### 2.4 Pre-report WladBot chat is lost on reload

- `WladBotChat` state is React-only (`fe/pages/Quiz.jsx:10-18`) and `showWladBot` isn't persisted, so a reload
  lands back on question 20 (`:205`), which has to be re-selected, and the chat is gone (the report then can't
  reference the user's challenge). Persist `{showWladBot, messages}` in localStorage (`quiz_wladbot`), restore on
  mount when all questions are answered, and clear it with the other keys in `Analyzing.jsx:91-92`.

### 2.5 Roadmap journal entries

- The 6 journal fields (`fe/pages/Roadmap.jsx:12`) are React-only and vanish on reload. Persist them in
  localStorage (small `useDraft` hook); optional server save via `POST /roadmap/journal`.

---

## Phase 3: Flow, links, honesty (complaints 3, 6, 9, 12)

- **No catch-all route:** `fe/App.js:124-138` has no `path="*"`, so any bad link renders a blank page under the
  navbar (matches the "link → blank page" reports). Add a NotFound page with "Zur Diagnose" / "Zu meinem Report".
- **Fake "Report wurde gesendet" banner:** `fe/pages/Report.jsx:35` sets `emailSent` after a 3 s timer and
  `ReportHeader.jsx:6-13` claims the mail was sent, even when Resend isn't configured or failed. Same class of
  problem as the WladBot promise. Return `email_status` from generate-report ("queued" vs "disabled") and word
  it honestly ("Wir schicken dir den Report zusätzlich per E-Mail, das kann ein paar Minuten dauern").
- **Broken unsubscribe:** `be/email_templates.py:46` hard-codes `?email=unknown` → unsubscribe in
  welcome/report/reminder mails does nothing. Pass the recipient. Also: `GET /email/unsubscribe` takes a bare
  email, so anyone can unsubscribe anyone. Sign it (HMAC token) while touching it.
- **Unauthenticated mail triggers:** `POST /email/send-report` and `/email/send-plan-reminder`
  (`be/routes/email.py:174-182`) accept any `session_id`. Require the report_token like `GET /report/{sid}`.
- "Buch sichern" (`fe/components/report/ReportPlan.jsx:51`) is an external link to remote-verlag.de; check it
  manually.
- Copy/typos users notice: `manifest.json` still says "30 Fragen"; Analyzing phases "Kommunikationsstarke",
  "Problemlosungs-DNA" (`fe/pages/Analyzing.jsx:11,14`); `AICoach.jsx:75` "offnen".
- **Too complex (complaint 3), funnel version:** the Report page stacks 11 sections plus ExitIntentPopup, and the
  Roadmap stacks an upsell popup on top (`Roadmap.jsx:59-69`). Suggested: collapse AgentEcosystem/Credo under
  "Mehr anzeigen", and suppress ExitIntentPopup on `/report` for the first visit. Product decision, so keep it
  small.

---

## Phase 4: Free vs. paid clarity (complaint 4, funnel version)

- No credits in this repo. Ensure the report/roadmap "kostenlos" labels and the 997 € CTAs use one price
  constant (`fe/components/pricing/pricingConstants.js`). Today the price is hard-coded in `ReportPlan.jsx:97`,
  `ReportPackages.jsx`, and `App.js:56`.

---

## Phase 5: Mobile & readability (complaints 7, 11)

- **iOS zoom on focus:** inputs use `text-sm` (14 px): WladBot input `fe/pages/Quiz.jsx:119`, AICoach
  `fe/components/AICoach.jsx:170`, UserForm fields. Use `text-base` (16 px) on inputs.
- **AICoach panel on phones:** fixed `w-80` × `500px` at `bottom-24` (`AICoach.jsx:84-85`) overflows small
  screens/when the keyboard is open, and the toggle covers page CTAs. On mobile, use a full-width bottom sheet
  with `h-[85dvh]`.
- WladBot chat box `maxHeight: 380px` (`Quiz.jsx:75`): fine on desktop; use `max-h-[50dvh]` on mobile so the
  input + CTA stay visible above the keyboard.
- Bot text is `text-sm`: bump bot bubbles to 15 px; render basic markdown (bold/lists) since Claude returns it.
  If adding `react-markdown` + `remark-gfm`, update `frontend/yarn.lock` (currently untracked, so commit it).
- Contrast: `text-slate-600` on `#0a0a0a` (hints/footers in Quiz, Analyzing, Report CTAs) is below AA. Use
  `slate-400`/`500` for anything users need to read.

---

## Suggested order

1. **Quick wins (≤1 day each):** 1.1 (diagnose the IP key + raise limits), 1.2, 2.1 Login OTP step + `/diagnose-guest`,
   catch-all route, unsubscribe link, honest email banner, 2.4, typos, iOS input font size.
2. **Medium:** 1.3 chat history, 1.4 (timeout, idempotency, fallback flag + regenerate), 2.2 report link in mail,
   2.3 sync handoff (needs LeaderOS-side confirmation), AICoach mobile sheet, 1.5 deep health.
3. **Only if prod measurements require it:** async job + polling for generate-report.

## Verification

- Backend pytest (`backend/tests/`):
  - rate-limit key uses the correct hop and limits per session;
  - coach returns 503 on LLM error;
  - generate-report twice in a row → one report, one `report_auto` mail log;
  - `GET /report/{sid}` returns the newest report;
  - narrative failure → `narrative_status:"fallback"`, then regenerate works;
  - unsubscribe link contains the recipient.
- Frontend:
  - kill network mid-WladBot / AICoach → text restored, retry works, no fake reply;
  - reload on the WladBot step → chat and step restored;
  - login with OTP on a fresh browser → lands on own report;
  - open the report mail link on another device → report renders;
  - unknown URL → NotFound page.
- Load: ~20 parallel sessions from one IP through prod ingress (quiz progress + coach) → no 429s.
- Real iPhone Safari: input focus doesn't zoom; AICoach sheet usable with the keyboard open.
- `yarn build` with frozen lockfile.
