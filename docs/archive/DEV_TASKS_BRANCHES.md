# Developer Task List — Branch Cleanup

> **Repo:** `aiporator/SHIPOS` · **Stand:** 83 remote Branches · **Ziel:** ≤ 10
>
> Zeit-Budget: **45 Min** total. Reihenfolge ist optimiert — Schritt 1 zuerst,
> dann durchgehen. Bei jedem Schritt: erst lesen, dann ausführen, dann ✓.

---

## Vorbereitung (1 Min)

- [ ] Open: https://github.com/aiporator/SHIPOS/branches
- [ ] Open zweiten Tab: https://github.com/aiporator/SHIPOS/settings/general
- [ ] Open dritten Tab: https://github.com/aiporator/SHIPOS/pulls?q=is%3Aopen

---

## Task 1 — Auto-Delete einschalten (1 Min, wichtigster Punkt)

In **Settings → General** scrollen bis "Pull Requests".

- [ ] ✅ "Automatically delete head branches" aktivieren → **Save**

Damit löschen sich künftig alle gemergten Branches automatisch.
Ohne diesen Schritt müllt das Repo wieder zu.

---

## Task 2 — Branch Protection für `mvpcode` (3 Min)

In **Settings → Branches** → **Add branch protection rule**.

- [ ] Branch name pattern: `mvpcode`
- [ ] ☑ Require a pull request before merging
- [ ] ☑ Require approvals: 1
- [ ] ☑ Require status checks to pass:
  - ☑ `ci / backend syntax check`
  - ☑ `ci / frontend build (Vercel parity)`
  - ☑ `yarn.lock matches package.json`
- [ ] ☑ Do not allow bypassing the above settings
- [ ] **Create**

Verhindert dass jemand wieder direkt auf mvpcode pusht oder mit
broken CI mergt.

---

## Task 3 — 22 Branches sofort löschen (5 Min)

Diese sind **garantiert null Commits ahead** auf mvpcode (per
`git rev-list --count` verifiziert). Datenverlust unmöglich.

Gehe zu https://github.com/aiporator/SHIPOS/branches/all
und such jeden einzeln, dann 🗑 klicken.

- [ ] `chore/ci-hardening`
- [ ] `claude/add-vimeo-links-9cL3u`
- [ ] `claude/csp-allowlist-fix`
- [ ] `claude/godmode-followup`
- [ ] `claude/godmode-launch-prep`
- [ ] `claude/integrate-sentry-mcp-BV4Ev`
- [ ] `claude/launch-day-prep`
- [ ] `claude/rename-default-branch-KQrTc`
- [ ] `claude/security-hardening-tonight`
- [ ] `docs/system-overview`
- [ ] `emergent-iter-92.13`
- [ ] `feat/enterprise-diagnosis-emails`
- [ ] `feat/enterprise-emails`
- [ ] `feature/folder-context-wingman`
- [ ] `fix/lockfile-guard-always-run`
- [ ] `fix/rag-context-budget`
- [ ] `fix/video-upload-size-limit`
- [ ] `fix/voice-prompt-framework-citation`
- [ ] `iter-80-emergent`
- [ ] `iter-82-emergent`
- [ ] `iter-83-emergent`
- [ ] `merge/emergent-iter-92.13`

---

## Task 4 — 21 wahrscheinlich-merged Branches löschen (10 Min)

Diese haben nur 1 Commit voraus = typischer Squash-Merge-Trail.
Bei JEDEM einzeln im UI das **"Merged"-Badge prüfen**, dann 🗑.

Wenn Badge "Open PR" oder gar nichts → erstmal stehen lassen.

- [ ] `claude/add-supabase-mcp-server-wVHPR`
- [ ] `claude/cleanup-ci-workflow-QiBAS`
- [ ] `claude/framer-mcp-relay-Ot1Oh`
- [ ] `claude/mcp-server-integration-WWmJL`
- [ ] `docs/app-architecture`
- [ ] `feat/design-skills`
- [ ] `feat/framework-mastery-quality-audit`
- [ ] `feat/landing-circle-rename`
- [ ] `feat/landing-cleanup-real-photos`
- [ ] `feat/landing-client-ready`
- [ ] `feat/landing-real-corner-copy`
- [ ] `feat/output-style-knowledge-transfer`
- [ ] `feat/premium-polish-phase3`
- [ ] `fix/duplicate-imports`
- [ ] `fix/lockfile-sync`
- [ ] `fix/rag-everywhere`
- [ ] `fix/vercel-build-complete`
- [ ] `fix/vercel-build-final`
- [ ] `fix/vercel-lockfile-emergency`
- [ ] `iter92-emergent`
- [ ] `railway/fix-deploy-1d4120`

---

## Task 5 — 4 alte Emergent-Iter Branches (1 Min)

Sind alle obsolet (Pre-shipos-Iter-Backups). Wenn jemand sie braucht,
liegt der State in `backup/mvpcode-pre-emergent-2026-05-17`.

- [ ] `emergent-iter-92.18`
- [ ] `emergent-iter-92.21`
- [ ] `emergent-iter-92.23.5`
- [ ] `emergent-iter-92.24-contextfeature`

---

## Task 6 — Dependabot PRs durcharbeiten (10 Min)

Open: https://github.com/aiporator/SHIPOS/pulls?q=is%3Apr+is%3Aopen+author%3Aapp%2Fdependabot

### Patch-Updates (safe to bulk-merge)

- [ ] `dependabot/npm_and_yarn/frontend/patch-updates-544269e1cd` → Merge
- [ ] `dependabot/pip/backend/patch-updates-d3fe84a1a2` → Merge
- [ ] `dependabot/pip/backend/black-26.5.1` → Merge (Linter, safe)
- [ ] `dependabot/pip/backend/botocore-1.43.32` → Merge
- [ ] `dependabot/pip/backend/motor-3.7.1` → Merge (MongoDB driver)
- [ ] `dependabot/pip/backend/urllib3-2.7.0` → Merge (Security-Patch)

### Major-Bumps (test before merge)

- [ ] `dependabot/github_actions/actions/setup-python-6` → Major Action-Bump → CI testen, dann merge
- [ ] `dependabot/github_actions/actions/github-script-9` → Major Action-Bump → CI testen, dann merge
- [ ] `dependabot/npm_and_yarn/frontend/eslint/js-10.0.1` → Major ESLint-Bump → Lint testen
- [ ] `dependabot/npm_and_yarn/frontend/lucide-react-1.21.0` → Major → erst Visual-Test
- [ ] `dependabot/npm_and_yarn/frontend/minor-non-react-41ed561a55` → Merge
- [ ] `dependabot/npm_and_yarn/frontend/tailwindcss-4.3.1` → **Major-Bump (Tailwind 3→4) — separater PR, gründlich testen!**

---

## Task 7 — 18 unmerged Branches reviewen (15 Min)

Pro Branch: 30 Sek scannen → entscheiden **Merge / Close+Delete / Review-PR auf**.

| Branch | Ahead | Empfehlung | ✓ |
|---|---|---|---|
| `claude/auth-race-fixes` | 19 | Auth-Bugfixes — wertvoll, PR aufmachen, mergen | [ ] |
| `claude/check-status-indicators-MlDyM` | 11 | Status-UI obsolet — delete | [ ] |
| `claude/fix-xss-report-generator-9vIjG` | 2 | Security-Fix — wenn merged in mvpcode (check diff), delete | [ ] |
| `claude/install-supabase-cli-Z8CF9` | 2 | War falscher Base von PR #70 — delete | [ ] |
| `claude/legal-and-consent` | 2 | Legal-Updates — diff prüfen, evtl. mergen | [ ] |
| `claude/setup-posthog-eu-Oy6Ly` | 2 | PostHog ist live — vermutlich obsolet, delete | [ ] |
| `docs/branching-convention` | 2 | Branching-Konvention — als PR mergen | [ ] |
| `feat/folder-surfaces` | 2 | Folder-UI Spike — wenn nicht mehr relevant, delete | [ ] |
| `feat/hybrid-rag-fusion` | 3 | **RAG-Verbesserung — wertvoll, reviewen + mergen** | [ ] |
| `feat/landing-fixes-typography-svg` | 2 | Vor-Nike-DNA-Spike — delete | [ ] |
| `feat/landing-page-direction-a` | 2 | Direction-A wurde live, branch obsolet — delete | [ ] |
| `feat/revolut-premium-design-upgrade` | 2 | Revolut-Style obsolet (Nike gewann) — delete | [ ] |
| `feat/stripe-admin-fn` | 3 | Stripe-Admin — reviewen, evtl. mergen | [ ] |
| `feat/taste-skill-mypath` | 2 | Skill-Spike obsolet — delete | [ ] |
| `feat/taste-skill-sprint` | 3 | Skill-Spike obsolet — delete | [ ] |
| `fix/rag-simulations` | 2 | RAG-Sim-Bug — diff prüfen | [ ] |
| `fix/sexier-framework-correct-name` | 3 | Naming-Fix — wenn nicht in mvpcode, mergen | [ ] |
| `fix/stripe-onetime-no-customer` | 2 | Stripe-Bug — reviewen | [ ] |

---

## Task 8 — Aktive Branches finalisieren (5 Min)

Diese sind die aktuellen Work-In-Progress. Pro Branch entscheiden:

- [ ] **`claude/sign-guy-dodge-band`** — PR #68 ist gemergt. Sobald
  Production live und stabil → branch löschen.
- [ ] **`claude/wlad-images`** — Aktive PR mit Wlad-Bildern + QR-Codes +
  WladBot-Doc + Email-Template + Branch-Cleanup-Doc. PR via
  https://github.com/aiporator/SHIPOS/compare/mvpcode...claude/wlad-images
  öffnen, mergen, branch löschen.
- [ ] **`stefan/chat-improvements`** — Stefan's eigene Arbeit, nicht touchen.

---

## Endergebnis (Soll-State)

Nach Abarbeitung sollten **nur noch ~6 Branches** existieren:

```
mvpcode                                   ← Production
backup/mvpcode-pre-emergent-2026-05-17    ← Last-known-good (read-only)
data/wlad-corpus-v3-fill-gaps             ← RAG-Versionierung
stefan/chat-improvements                  ← Stefan's WIP
claude/wlad-images                        ← bald gemergt + auto-deleted
claude/sign-guy-dodge-band                ← bald gelöscht
```

Plus eventuell 0–2 noch-aktive Dependabot-PRs.

---

## Anti-Drift — Hygiene-Rituale

Damit es so bleibt:

- [ ] **Branch-Naming-Convention** einführen:
  - `feat/<5-word-slug>` für Features
  - `fix/<bug-name>` für Bugfixes
  - `docs/<topic>` für Doku
  - **Kein `claude/*` oder `iter-*` mehr** — die generieren visuellen Lärm
- [ ] **Wöchentlich-30-Sek-Check:** Open
  https://github.com/aiporator/SHIPOS/branches/stale — alles > 14 Tage
  alt prüfen
- [ ] **Auto-Delete + Branch Protection** (Task 1 + 2 oben) sind die
  zwei einzigen automatisierten Schritte — der Rest ist Disziplin

---

**Mit diesem Set wird das Repo wartbar und PRs werden schnell wieder
mergbar ohne Konfliktdrama.**
