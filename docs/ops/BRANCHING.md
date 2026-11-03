# Branching & naming convention

The bar: a newcomer should understand any branch or PR from its name alone, and
the branch list should read like a changelog — not an archaeology dig. Boring,
consistent, predictable.

## Branch names

```
<type>/<short-kebab-summary>
```

`<type>` is one of a small, fixed set:

| type        | use for                                              | example                          |
| ----------- | ---------------------------------------------------- | -------------------------------- |
| `feat`      | new user-facing capability                           | `feat/hybrid-rag-fusion`         |
| `fix`       | bug fix                                              | `fix/stripe-onetime-no-customer` |
| `docs`      | documentation only                                   | `docs/branching-convention`      |
| `chore`     | tooling, deps, CI, no product change                 | `chore/ruff-mypy-ci`             |
| `refactor`  | behaviour-preserving restructuring                   | `refactor/rag-services-split`    |

Rules:
- **kebab-case**, lower-case, no spaces; 2–5 words. The summary names the
  *outcome*, not the file (`fix/voice-rag-grounding`, not `fix/voice-tts-py`).
- **One concern per branch** → one PR → one reviewable diff.
- Branch off `mvpcode`; keep it short-lived. Long-running branches drift and
  become the merge-pain we keep paying for.
- No personal/agent prefixes (`claude/…`, initials). The work is the work.

## PR titles

Conventional-commit style, matching the branch type:

```
feat(rag): hybrid retrieval — vector + German full-text, fused by RRF
fix(stripe): activate one-time payments when Stripe skips the Customer
```

`type(scope): imperative summary`. Scope is the subsystem (`rag`, `stripe`,
`folders`, `quality`, `ci`). This is what the squash-merge commit on `mvpcode`
becomes, so it reads as a clean history.

## Lifecycle

1. Branch from `mvpcode`.
2. Open a PR early; let CI run (constants-drift, lockfile-guard, backend syntax,
   frontend build).
3. Squash-merge into `mvpcode`.
4. **Delete the head branch on merge.**
   → Repo **Settings → General → "Automatically delete head branches"**. Turn it
   on once; every future merged branch self-cleans. This is the single highest-
   leverage cleanup action.

## Protected & special branches

| branch                              | meaning                                            | keep? |
| ----------------------------------- | -------------------------------------------------- | ----- |
| `mvpcode`                           | production source of truth                         | ✅ protected |
| `backup/mvpcode-pre-emergent-*`     | pre-migration safety snapshot                      | ✅ archive |
| `emergent-iter-*`, `iter-*-emergent`| Emergent pod snapshots (full-tree, old base)       | ✅ archive — restore-from, never merge whole |

Pod snapshots are **archive insurance**, not merge candidates: they carry an old
base and would delete current work (legal pages, CI guards, stripe-webhook). The
correct pattern is the surgical cherry-pick we used for the folder feature and
the RAG fixes — lift the one changed file onto a fresh branch off `mvpcode`.

## One-time cleanup (refreshed 2026-06-30, post-launch)

GitHub's web UI can't bulk-delete, and this environment's git proxy blocks
`push --delete` (403), so run the command below **locally**, or do a manual pass
in **Branches → (trash icon)**.

> The repo reached ~110 branches. Flip the auto-delete toggle (above) first —
> that stops the bleeding — then clear the backlog once.

**Safe to delete now** — fully contained in `mvpcode` (`git branch -r --merged
origin/mvpcode`, plus the three squash-merged launch PRs), not an open PR, not an
archive:

```
chore/ci-hardening
claude/add-vimeo-links-9cL3u
claude/cross-tier-redirect
claude/integrate-sentry-mcp-BV4Ev
claude/rename-default-branch-KQrTc
claude/shipping-mode-friday
claude/sign-guy-dodge-band
docs/system-overview
emergent-iter-92.13
merge/emergent-iter-92.13
feat/enterprise-diagnosis-emails
feat/enterprise-emails
feature/folder-context-wingman
fix/lockfile-guard-always-run
fix/rag-context-budget
fix/video-upload-size-limit
fix/voice-prompt-framework-citation
claude/footer-cleanup-mobile-polish    # squash-merged via PR #129
claude/journal-next-level              # squash-merged via PR #140
claude/journal-polish-glow             # squash-merged via PR #141
```

Run locally:

```bash
git fetch --prune
git push origin --delete \
  chore/ci-hardening claude/add-vimeo-links-9cL3u claude/cross-tier-redirect \
  claude/integrate-sentry-mcp-BV4Ev claude/rename-default-branch-KQrTc \
  claude/shipping-mode-friday claude/sign-guy-dodge-band docs/system-overview \
  emergent-iter-92.13 merge/emergent-iter-92.13 feat/enterprise-diagnosis-emails \
  feat/enterprise-emails feature/folder-context-wingman fix/lockfile-guard-always-run \
  fix/rag-context-budget fix/video-upload-size-limit fix/voice-prompt-framework-citation \
  claude/footer-cleanup-mobile-polish claude/journal-next-level claude/journal-polish-glow
```

**Leave until merged/closed** — all `dependabot/*` PRs (review → merge or close;
they then auto-delete). Currently open: codeql-action-4, gitleaks-action-3,
globals-17, react-resizable-panels-4 (major — test), zod-4 (major — test),
frontend minor + patch groups, backend fastapi-0.138 (major — test), aiohttp,
markdown-it-py, tiktoken, backend patch group.

**Triage (unmerged, likely stale — confirm before deleting)** — have commits not
in `mvpcode`; skim each, then delete:

```
feat/landing-*  feat/benefit-*  feat/poster-*  feat/sprint-mit-wlad-*
claude/poster-*  claude/trust-*  claude/benefit-*  claude/skip-variant-on-posters
claude/posters-revert-flag  claude/godmode-*  claude/journal-godmode-expansion
claude/security-hardening-tonight  claude/launch-day-prep  claude/legal-and-consent
claude/quiz-result-depth  claude/quick-check-mini-app  claude/modal-godmode
claude/auth-race-fixes  claude/csp-allowlist-fix  claude/chapter07-voxel
claude/check-status-indicators-MlDyM  claude/cleanup-ci-workflow-QiBAS
claude/framer-mcp-relay-Ot1Oh  claude/mcp-server-integration-WWmJL
claude/setup-posthog-eu-Oy6Ly  claude/add-supabase-mcp-server-wVHPR
claude/wlad-images  claude/fix-xss-report-generator-9vIjG
fix/rag-everywhere  fix/rag-simulations  fix/lockfile-sync  fix/duplicate-imports
fix/vercel-build-complete  fix/vercel-build-final  fix/vercel-lockfile-emergency
fix/node-engine-compat  fix/stripe-onetime-no-customer  fix/sexier-framework-correct-name
feat/design-skills  feat/stripe-admin-fn  feat/taste-skill-mypath  feat/taste-skill-sprint
feat/output-style-knowledge-transfer  feat/hybrid-rag-fusion  feat/framework-mastery-quality-audit
feat/premium-polish-phase3  feat/revolut-premium-design-upgrade  feat/folder-surfaces
feat/class-scarcity-godmode  feat/wlad-face-personal
iter-80-emergent  iter-82-emergent  iter-83-emergent  iter92-emergent
```

**Ask the owner before touching**: `stefan/chat-improvements`,
`railway/fix-deploy-1d4120`, `data/wlad-corpus-v3-fill-gaps`, and the `docs/*`
working branches (`docs/branching-convention`, `docs/app-architecture`,
`docs/vercel-project-rename`).

**Keep (never delete)**: `mvpcode`, `backup/mvpcode-pre-emergent-2026-05-17`, and
the `emergent-iter-*` / `iter-*-emergent` archive snapshots (restore-from, never
merge whole — see above).

### Target end-state

After the toggle + this pass, `git branch -r` reads like a changelog:

```
mvpcode                        ← production (protected)
backup/mvpcode-pre-emergent-…  ← frozen safety snapshot
emergent-iter-* (archives)     ← restore-only
feat/… fix/… (a handful)       ← only what's actively in flight
dependabot/…                   ← transient, auto-managed
```
