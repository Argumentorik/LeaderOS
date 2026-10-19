#!/usr/bin/env bash
# Launch-day smoke test for LeaderOS.
#
# Hits the key public endpoints + a few internal checks, reports pass/fail
# per probe, exits non-zero on any failure so it can run as a CI gate.
#
# Usage:
#   bash scripts/verify-launch.sh
#   bash scripts/verify-launch.sh --base https://leader-os.de
#   bash scripts/verify-launch.sh --base http://127.0.0.1:8001  # local backend
#
# Exit codes:
#   0  all probes passed
#   1  one or more probes failed (see output)

set -uo pipefail

BASE_URL="${BASE_URL:-https://leader-os.de}"
TIMEOUT_SEC="${TIMEOUT_SEC:-10}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --base) BASE_URL="$2"; shift 2 ;;
    --timeout) TIMEOUT_SEC="$2"; shift 2 ;;
    *) echo "unknown flag: $1" >&2; exit 64 ;;
  esac
done

GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[0;33m"
RESET="\033[0m"

PASS=0
FAIL=0

probe() {
  local name="$1"; shift
  local expected_status="$1"; shift
  local url="$1"; shift
  # Remaining args are passed to curl

  local actual_status
  actual_status=$(curl -sS -o /tmp/probe_body -w "%{http_code}" \
    --max-time "$TIMEOUT_SEC" \
    -A "leader-os-launch-verifier/1.0" \
    "$@" "$url" 2>/dev/null || echo "000")

  if [[ "$actual_status" == "$expected_status" ]]; then
    echo -e "${GREEN}✓${RESET} ${name}  →  HTTP $actual_status"
    PASS=$((PASS + 1))
  else
    echo -e "${RED}✗${RESET} ${name}  →  HTTP $actual_status (expected $expected_status)"
    echo "    URL: $url"
    if [[ -s /tmp/probe_body ]]; then
      echo "    body: $(head -c 200 /tmp/probe_body)"
    fi
    FAIL=$((FAIL + 1))
  fi
}

probe_contains() {
  local name="$1"; shift
  local expected_substring="$1"; shift
  local url="$1"; shift

  local body
  body=$(curl -sS --max-time "$TIMEOUT_SEC" \
    -A "leader-os-launch-verifier/1.0" \
    "$@" "$url" 2>/dev/null || echo "")

  if [[ "$body" == *"$expected_substring"* ]]; then
    echo -e "${GREEN}✓${RESET} ${name}  →  found '$expected_substring'"
    PASS=$((PASS + 1))
  else
    echo -e "${RED}✗${RESET} ${name}  →  '$expected_substring' not in response"
    echo "    URL: $url"
    FAIL=$((FAIL + 1))
  fi
}

echo "════════════════════════════════════════════════════════════════"
echo "  LeaderOS launch verification"
echo "  Base URL: $BASE_URL"
echo "════════════════════════════════════════════════════════════════"
echo

echo "--- Backend health ---"
probe "GET /api/health"                          200 "$BASE_URL/api/health"
probe "GET /api/auth/me (no auth)"               401 "$BASE_URL/api/auth/me"

echo
echo "--- Frontend domains ---"
probe "GET leader-os.de (apex)"                  200 "https://leader-os.de/"
probe "GET www.leader-os.de"                     200 "https://www.leader-os.de/"
probe "GET leader-check.de"                      200 "https://leader-check.de/"
probe "GET www.leader-check.de"                  200 "https://www.leader-check.de/"

echo
echo "--- Frontend includes Sentry + PostHog wiring ---"
probe_contains "leader-os.de HTML has PostHog snippet" \
  "posthog.init" \
  "https://leader-os.de/"
probe_contains "leader-os.de HTML hits EU PostHog" \
  "eu.i.posthog.com" \
  "https://leader-os.de/"

echo
echo "--- Security headers (should be set on every response) ---"
HEADERS=$(curl -sSI --max-time "$TIMEOUT_SEC" "$BASE_URL/" 2>/dev/null || echo "")
for header in "Strict-Transport-Security" "X-Content-Type-Options" "X-Frame-Options" "Referrer-Policy" "Content-Security-Policy-Report-Only"; do
  if echo "$HEADERS" | grep -qi "^${header}:"; then
    echo -e "${GREEN}✓${RESET} ${header}  →  present"
    PASS=$((PASS + 1))
  else
    echo -e "${RED}✗${RESET} ${header}  →  MISSING"
    FAIL=$((FAIL + 1))
  fi
done

echo
echo "--- CSP allowlist sanity (should mention EU hosts) ---"
CSP=$(curl -sSI --max-time "$TIMEOUT_SEC" "$BASE_URL/" 2>/dev/null | grep -i "Content-Security-Policy-Report-Only" || echo "")
for expected in "eu.i.posthog.com" "ingest.de.sentry.io"; do
  if [[ "$CSP" == *"$expected"* ]]; then
    echo -e "${GREEN}✓${RESET} CSP allows ${expected}"
    PASS=$((PASS + 1))
  else
    echo -e "${YELLOW}⚠${RESET}  CSP missing ${expected} (events may be flagged)"
    # Don't fail the run on this — it's report-only and won't break anything
  fi
done

echo
echo "--- API rewrites are routed (Vercel → backend) ---"
probe_contains "Vercel /api/health rewrites to backend" \
  "ok" \
  "https://leader-os.de/api/health"

echo
echo "════════════════════════════════════════════════════════════════"
if [[ $FAIL -eq 0 ]]; then
  echo -e "${GREEN}✓ All ${PASS} probes passed.${RESET}  Safe to open the doors."
  exit 0
else
  echo -e "${RED}✗ ${FAIL} probe(s) failed out of $((PASS + FAIL)).${RESET}  Fix before launching."
  echo
  echo "See docs/ops/INCIDENT_RUNBOOK.md for symptom-by-symptom remediation."
  exit 1
fi
