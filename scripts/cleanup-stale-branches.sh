#!/usr/bin/env bash
# Cleanup der stale Branches (Stand 30.07.2026, PR-Triage-Runde).
#
# Warum ein Script: Remote-Branch-Deletion braucht volle Push-Rechte —
# aus CI/Agent-Sessions heraus geblockt. Einmal lokal ausführen:
#
#   bash scripts/cleanup-stale-branches.sh          # dry-run (zeigt nur)
#   bash scripts/cleanup-stale-branches.sh --delete # löscht wirklich
#
# Enthalten sind NUR:
#   - Branches, deren Tip zum Zeitpunkt der Erstellung vollständig in
#     mvpcode enthalten war (beweisbar gemergt, kein Datenverlust), und
#   - claude/* Experiment-Branches, die CLAUDE.md als stale markiert.
# NICHT enthalten (bewusst): mvpcode, backup/*, emergent-iter-*
# (Referenz, siehe PR #41), fix/pricing-scroll-wlad-seo (siehe PR #146),
# offene dependabot-PR-Branches, feat/* & docs/* mit ungemergter Arbeit.

set -euo pipefail

BRANCHES=(
  claude/add-supabase-mcp-server-wVHPR
  claude/add-vimeo-links-9cL3u
  claude/auth-race-fixes
  claude/benefit-green-halftone
  claude/benefit-poster
  claude/benefit-typefirst
  claude/chapter07-voxel
  claude/check-status-indicators-MlDyM
  claude/cleanup-ci-workflow-QiBAS
  claude/cross-tier-redirect
  claude/csp-allowlist-fix
  claude/fix-xss-report-generator-9vIjG
  claude/footer-cleanup-mobile-polish
  claude/framer-mcp-relay-Ot1Oh
  claude/godmode-final
  claude/godmode-followup
  claude/godmode-launch-prep
  claude/integrate-sentry-mcp-BV4Ev
  claude/journal-godmode-expansion
  claude/journal-next-level
  claude/journal-polish-glow
  claude/launch-day-prep
  claude/legal-and-consent
  claude/mcp-server-integration-WWmJL
  claude/modal-godmode
  claude/poster-designs
  claude/poster-rename
  claude/posters-revert-flag
  claude/quick-check-mini-app
  claude/quiz-result-depth
  claude/rename-default-branch-KQrTc
  claude/security-hardening-tonight
  claude/setup-posthog-eu-Oy6Ly
  claude/shipping-mode-friday
  claude/sign-guy-dodge-band
  claude/skip-variant-on-posters
  claude/trust-poster-flag
  claude/trust-revert-posterDesign
  claude/wlad-images
  dependabot/pip/backend/fastapi-0.138.1
)

if [[ "${1:-}" == "--delete" ]]; then
  for b in "${BRANCHES[@]}"; do
    git push origin --delete "$b" && echo "deleted  $b" || echo "skipped  $b (already gone?)"
  done
else
  echo "DRY-RUN — würde ${#BRANCHES[@]} Branches löschen:"
  printf '  %s\n' "${BRANCHES[@]}"
  echo
  echo "Ausführen mit: bash scripts/cleanup-stale-branches.sh --delete"
fi
