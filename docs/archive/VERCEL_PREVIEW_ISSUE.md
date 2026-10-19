# Vercel Preview Build — Known Issue

> Vermerk 2026-06-18. Geltend für shipos-vuml project.

## Symptom

PR-Preview-Builds für jeden Branch ≠ mvpcode failen sofort mit `state: ERROR`,
KEINE Build-Logs (`events: []`). Production-Builds (target=production) auf
mvpcode laufen sauber durch.

Beispiele:
- `claude/sign-guy-dodge-band` (PR #68): commit ce1ff31, 691ef57, 0887f10 alle failed
- `stefan/chat-improvements`: commit ecc7abb "new prompts" failed
- Selbe Failures-Periode startete ~2026-06-18 ~03:00 UTC

## Was nicht das Problem ist

- Code: `CI=true yarn build` lokal grün in 26 Sek
- Code: GitHub Actions `ci/frontend build (Vercel parity)` PASS
- Code: GitHub Actions `ci/backend syntax check` PASS
- Lockfile: `yarn.lock matches package.json` PASS
- Lockfile/Workspace: Production-mvpcode-Deploy mit identischen Files baut sauber

## Was wahrscheinlich das Problem ist

Vercel Project shipos-vuml hat **Production Override** Settings die für
mvpcode korrekt sind aber von Preview-Builds NICHT übernommen werden.
Vermutlich:

- `framework: null` als Project-Default (Production hat CRA override)
- `nodeVersion: 24.x` als Project-Default (Production hat 22.x override)
- Build/Install commands fehlen im Project-Default

Diese Werte stehen in den Vercel-Project-API-Responses bereits seit Wochen
in shipos-vuml. Production-Builds picken die Override-Settings aus dem
production-target Slot. Preview-Builds nehmen die Project-Defaults =
gebrochen.

## Fix-Optionen (User-Action erforderlich)

### Quick: Merge-Bypass

Bei jedem PR: ☑️ "Merge without waiting for requirements to be met"
checkbox. Production-Deploy auf mvpcode läuft danach sauber.

### Proper: Project-Settings synchronisieren

https://vercel.com/aiporators-projects/shipos-vuml/settings

1. **General → Framework Preset** → setzen auf `Create React App`
2. **General → Node.js Version** → setzen auf `22.x`
3. **General → Build and Output Settings:**
   - Build Command (Override) → `cd frontend && yarn build`
   - Output Directory (Override) → `frontend/build`
   - Install Command (Override) → `cd frontend && yarn install --frozen-lockfile`
4. **Save**

Diese Werte stehen schon in `vercel.json` — Vercel sollte sie picken,
aber das passiert nur konsistent wenn Project-Defaults sie matchen.

### Alternative: Neues Project anlegen

Statt das angeschlagene shipos-vuml zu reparieren — neues Vercel-Project
`leader-os` von Grund auf erstellen, alle Settings frisch und korrekt.
Dann Domain-Mapping umziehen.

War in `docs/LAUNCH_TOMORROW.md` schon mal als Plan dokumentiert.

## Wenn der Bypass-Merge zur Routine wird

Heisst: Project-Settings sind zu lange schief. Dann Punkt "Proper" oder
"Alternative" durchziehen. Nicht ewig bypass-mergen.
