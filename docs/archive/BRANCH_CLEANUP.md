# Branch-Cleanup — Audit + Putz-Plan

> Stand 2026-06-18. Insgesamt **83 remote Branches** auf
> `aiporator/SHIPOS`. Ziel: **< 10 lebende Branches**.
> Vergleichsbasis ist `mvpcode` (Production).

---

## 1. BEHALTEN (6 Branches)

| Branch | Grund |
|---|---|
| `mvpcode` | Production |
| `backup/mvpcode-pre-emergent-2026-05-17` | Last-Known-Good Backup vor Emergent-Migration |
| `claude/sign-guy-dodge-band` | PR #68 stuff — kann bald weg sobald merged stabil |
| `claude/wlad-images` | aktive PR mit Wlad-Bildern + QR-Codes + WladBot-Doc |
| `stefan/chat-improvements` | Stefans aktive Arbeit |
| `data/wlad-corpus-v3-fill-gaps` | RAG-Corpus-Versionierung (read-only Snapshot) |

---

## 2. SOFORT LÖSCHEN — 22 verifizierte 0-ahead Branches

Diese haben **keinen einzigen Commit** den mvpcode nicht schon hat.
Garantierter Datenverlust = null.

**Bulk-Delete via GitHub UI:**
https://github.com/aiporator/SHIPOS/branches/all

Such-Filter eingeben, oder einzeln 🗑 klicken:

```
chore/ci-hardening
claude/add-vimeo-links-9cL3u
claude/csp-allowlist-fix
claude/godmode-followup
claude/godmode-launch-prep
claude/integrate-sentry-mcp-BV4Ev
claude/launch-day-prep
claude/rename-default-branch-KQrTc
claude/security-hardening-tonight
docs/system-overview
emergent-iter-92.13
feat/enterprise-diagnosis-emails
feat/enterprise-emails
feature/folder-context-wingman
fix/lockfile-guard-always-run
fix/rag-context-budget
fix/video-upload-size-limit
fix/voice-prompt-framework-citation
iter-80-emergent
iter-82-emergent
iter-83-emergent
merge/emergent-iter-92.13
```

---

## 3. WAHRSCHEINLICH MERGED — 21 Branches (1 commit ahead = squash-merge-Pattern)

Diese haben nur **1 Commit voraus** auf mvpcode — der klassische
Squash-Merge-Trail (Original-Commit existiert noch, Inhalt ist in
mvpcode via Squash drin). Im GitHub-UI siehst du das "Merged"-Badge —
löschen ist sicher.

**Vorgehen:** Auf https://github.com/aiporator/SHIPOS/branches gehen,
Suchfeld nutzen, pro Branch das **"Merged" Badge** prüfen, dann 🗑.

```
claude/add-supabase-mcp-server-wVHPR
claude/cleanup-ci-workflow-QiBAS
claude/framer-mcp-relay-Ot1Oh
claude/mcp-server-integration-WWmJL
docs/app-architecture
feat/design-skills
feat/framework-mastery-quality-audit
feat/landing-circle-rename
feat/landing-cleanup-real-photos
feat/landing-client-ready
feat/landing-real-corner-copy
feat/output-style-knowledge-transfer
feat/premium-polish-phase3
fix/duplicate-imports
fix/lockfile-sync
fix/rag-everywhere
fix/vercel-build-complete
fix/vercel-build-final
fix/vercel-lockfile-emergency
iter92-emergent
railway/fix-deploy-1d4120
```

---

## 4. DEPENDABOT — 12 Branches (Dependency-Updates)

Dependabot eröffnet pro Update einen Branch. Wenn du den Update nicht
brauchst, schließe die PRs in GitHub — die Branches werden dann
automatisch aufgeräumt.

**Alle Dependabot-PRs:**
https://github.com/aiporator/SHIPOS/pulls?q=is%3Apr+is%3Aopen+author%3Aapp%2Fdependabot

```
dependabot/github_actions/actions/github-script-9
dependabot/github_actions/actions/setup-python-6
dependabot/npm_and_yarn/frontend/eslint/js-10.0.1
dependabot/npm_and_yarn/frontend/lucide-react-1.21.0
dependabot/npm_and_yarn/frontend/minor-non-react-41ed561a55
dependabot/npm_and_yarn/frontend/patch-updates-544269e1cd
dependabot/npm_and_yarn/frontend/tailwindcss-4.3.1
dependabot/pip/backend/black-26.5.1
dependabot/pip/backend/botocore-1.43.32
dependabot/pip/backend/motor-3.7.1
dependabot/pip/backend/patch-updates-d3fe84a1a2
dependabot/pip/backend/urllib3-2.7.0
```

**Empfehlung:** Patch-Updates (z.B. `patch-updates-544269e1cd`) bulk-mergen.
Major-Bumps (tailwindcss 4.3 ist Major) einzeln prüfen.

---

## 5. ALTE ITER-BRANCHES — 4 Branches

Emergent's Auto-Save-Branches aus Pre-shipos-Zeit. Sind alle obsolet.

```
emergent-iter-92.18      [9 ahead — alte Iter]
emergent-iter-92.21      [12 ahead — alte Iter]
emergent-iter-92.23.5    [22 ahead — alte Iter]
emergent-iter-92.24-contextfeature   [38 ahead — alte Iter]
```

Diese Inhalte sind über die letzten 8 Wochen entweder in
`backup/mvpcode-pre-emergent-2026-05-17` enthalten oder sind
post-Emergent-Cut-off irrelevant. **Löschen.**

---

## 6. ECHT UNMERGED — 18 Branches

Diese haben unmergte Arbeit. Pro Branch entscheiden: **brauchen oder weg?**

| Branch | Ahead | Was vermutlich drin ist | Empfehlung |
|---|---|---|---|
| `claude/auth-race-fixes` | 19 | Auth-Bugfixes | Reviewen, mergen oder weg |
| `claude/check-status-indicators-MlDyM` | 11 | Status-UI-Arbeit | Vermutlich obsolet — weg |
| `claude/fix-xss-report-generator-9vIjG` | 2 | Security-Fix | Reviewen, evtl. mergen |
| `claude/install-supabase-cli-Z8CF9` | 2 | Spike — wurde Base für PR #70 falsch | Weg |
| `claude/legal-and-consent` | 2 | Legal/Datenschutz | Reviewen |
| `claude/setup-posthog-eu-Oy6Ly` | 2 | PostHog-Setup | Wahrscheinlich schon drin in mvpcode — weg |
| `docs/branching-convention` | 2 | Branching-Doku | Reviewen, mergen |
| `feat/folder-surfaces` | 2 | Folder-UI | Reviewen |
| `feat/hybrid-rag-fusion` | 3 | RAG-Verbesserung | Reviewen — könnte wertvoll sein |
| `feat/landing-fixes-typography-svg` | 2 | Landing-Typo | Vermutlich obsolet (PR #68 hat alles refresht) |
| `feat/landing-page-direction-a` | 2 | Direction-A Spike | Obsolet — Nike-DNA ist live |
| `feat/revolut-premium-design-upgrade` | 2 | Revolut-Style Spike | Obsolet — Nike gewann |
| `feat/stripe-admin-fn` | 3 | Stripe-Admin-Tooling | Reviewen |
| `feat/taste-skill-mypath` | 2 | Skill-Spike | Obsolet |
| `feat/taste-skill-sprint` | 3 | Skill-Spike | Obsolet |
| `fix/rag-simulations` | 2 | RAG-Sim-Bug | Reviewen |
| `fix/sexier-framework-correct-name` | 3 | Naming-Fix | Reviewen, sollte längst gemergt sein |
| `fix/stripe-onetime-no-customer` | 2 | Stripe-Bug | Reviewen |

---

## Workflow-Empfehlung

### Heute (5 Min)
1. Öffne https://github.com/aiporator/SHIPOS/branches/all
2. Such "Merged"-Tab → Bulk-Delete alle merged Branches
3. Such "Stale"-Tab → Branches > 30 Tage tot → review & delete

### Diese Woche (15 Min)
4. Dependabot-PRs reviewen, Patch-Updates mergen
5. Die 18 "echt unmerged"-Branches je 30 Sek scannen → mergen/zu/löschen

### Danach
- **Branch Protection Rule** für `mvpcode` einschalten — verhindert direkte Pushes
- **Auto-Delete** für gemergte Branches in Repo-Settings aktivieren
  (Settings → General → "Automatically delete head branches")

---

## Ziel-State

| | Heute | Nach Cleanup |
|---|---|---|
| Total Branches | 83 | ~8 |
| Active Work | 3 (claude/sign-guy-dodge-band, wlad-images, stefan) | 1–3 |
| Long-Lived | 2 (mvpcode, backup) | 2 |
| Dependabot | 12 | 0–3 (was übrig nach Merge) |
| Stale/Merged | 60+ | 0 |

**Ein gepflegtes Repo macht Mergen sicher und PRs schneller.**
