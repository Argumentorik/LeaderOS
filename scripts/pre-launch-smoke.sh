#!/usr/bin/env bash
# Pre-Launch Smoke Test — runs in ~60s, validates every critical endpoint.
#
# Usage:
#   bash scripts/pre-launch-smoke.sh                                # tests local pod
#   bash scripts/pre-launch-smoke.sh https://leader-os.de           # tests production
#   TEST_EMAIL=foo@bar.com TEST_PW=secret bash scripts/pre-launch-smoke.sh
#
# Exit codes:
#   0  all critical checks PASS
#   1  one or more critical checks FAIL (read the report)

set -u

API_URL="${1:-http://127.0.0.1:8001}"
TEST_EMAIL="${TEST_EMAIL:-accelerator@wladbot.test}"
TEST_PW="${TEST_PW:-test123}"
COOKIE_JAR="/tmp/wladbot_smoke_cj"

PASS=0
FAIL=0
WARN=0
LOG="/tmp/wladbot_smoke_$(date +%s).log"

c_red()   { printf '\033[31m%s\033[0m' "$1"; }
c_green() { printf '\033[32m%s\033[0m' "$1"; }
c_amber() { printf '\033[33m%s\033[0m' "$1"; }
c_cyan()  { printf '\033[36m%s\033[0m' "$1"; }

check() {
  local label="$1"; local expected="$2"; local actual="$3"; local critical="${4:-yes}"
  if [[ "$actual" == "$expected" ]]; then
    PASS=$((PASS+1))
    printf "  %s %-45s → %s\n" "$(c_green '✓')" "$label" "$actual"
  else
    if [[ "$critical" == "yes" ]]; then
      FAIL=$((FAIL+1))
      printf "  %s %-45s → %s (expected %s) %s\n" "$(c_red '✗')" "$label" "$actual" "$expected" "$(c_red 'FAIL')"
    else
      WARN=$((WARN+1))
      printf "  %s %-45s → %s (expected %s) %s\n" "$(c_amber '!')" "$label" "$actual" "$expected" "$(c_amber 'WARN')"
    fi
  fi
}

http_status() {
  local method="$1"; local path="$2"; local data="${3:-}"; local with_auth="${4:-yes}"
  local args=(-s -o /dev/null -w "%{http_code}" -m 30 -X "$method" "${API_URL}${path}")
  [[ "$with_auth" == "yes" ]] && args+=(-b "$COOKIE_JAR")
  if [[ -n "$data" ]]; then
    args+=(-H "Content-Type: application/json" -d "$data")
  fi
  curl "${args[@]}" 2>/dev/null
}

# ── HEADER ────────────────────────────────────────────────
echo ""
echo "════════════════════════════════════════════════════════════"
echo "  $(c_cyan 'WLAD AI PRE-LAUNCH SMOKE TEST')"
echo "════════════════════════════════════════════════════════════"
echo "  API:     $API_URL"
echo "  User:    $TEST_EMAIL"
echo "  Started: $(date -u +%FT%TZ)"
echo "════════════════════════════════════════════════════════════"
echo ""

# ── PHASE 1: PUBLIC HEALTH ────────────────────────────────
echo "$(c_cyan '▸ Phase 1: Public Health')"
check "Backend /api/health"  "200" "$(http_status GET /api/health '' no)"
# Frontend reachability only meaningful when API_URL is the public URL (not backend localhost).
if [[ "$API_URL" == *"127.0.0.1"* || "$API_URL" == *"localhost"* ]]; then
  printf "  %s %-45s → %s\n" "$(c_amber '~')" "Frontend reachable" "skipped (backend-only URL)"
else
  check "Frontend reachable"   "200" "$(curl -s -o /dev/null -w '%{http_code}' -m 10 "$API_URL" 2>/dev/null)" no
fi
echo ""

# ── PHASE 2: AUTH ─────────────────────────────────────────
echo "$(c_cyan '▸ Phase 2: Authentication')"
rm -f "$COOKIE_JAR"

LOGIN_RESP=$(curl -s -c "$COOKIE_JAR" -o /tmp/login_body.json -w "%{http_code}" -m 15 \
  -X POST "${API_URL}/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${TEST_EMAIL}\",\"password\":\"${TEST_PW}\"}")
check "POST /api/auth/login"  "200" "$LOGIN_RESP"

JWT_LEN=$(python3 -c "import json,sys;d=json.load(open('/tmp/login_body.json'));print(len(d.get('token','')))" 2>/dev/null || echo "0")
[[ "$JWT_LEN" -gt 100 ]] && check "JWT length sane (>100)" ">100" ">100" || check "JWT length sane (>100)" ">100" "$JWT_LEN"

check "GET /api/auth/me (with cookie)"     "200" "$(http_status GET /api/auth/me)"
check "GET /api/auth/me (no cookie → 401)" "401" "$(http_status GET /api/auth/me '' no)"
echo ""

# ── PHASE 3: AUTHZ (Admin gates) ──────────────────────────
echo "$(c_cyan '▸ Phase 3: Admin Authorization')"
check "/api/admin (non-admin → 403)"  "403" "$(http_status GET /api/admin/overview)"
echo ""

# ── PHASE 4: LLM ENDPOINTS ────────────────────────────────
echo "$(c_cyan '▸ Phase 4: LLM Endpoints (each ~5-15s)')"
check "POST /api/chat"                          "200" "$(http_status POST /api/chat '{"message":"smoke test"}')"
check "GET  /api/tools (list)"                  "200" "$(http_status GET  /api/tools)"
check "POST /api/tools/email-optimizer"         "200" "$(http_status POST /api/tools/email-optimizer '{"input":"Hi","persona":"Lead"}')"
check "POST /api/daily-checkin"                 "200" "$(http_status POST /api/daily-checkin '{"content":"smoke"}')"
check "GET  /api/user/video-trial-status"       "200" "$(http_status GET  /api/user/video-trial-status)"
check "GET  /api/playbooks"                     "200" "$(http_status GET  /api/playbooks)"
echo ""

# ── PHASE 5: PAYMENTS ─────────────────────────────────────
echo "$(c_cyan '▸ Phase 5: Payment Endpoints')"
check "GET  /api/payments/packages"     "200" "$(http_status GET /api/payments/packages)"
check "GET  /api/credits (balance)"      "200" "$(http_status GET /api/credits)"
echo ""

# ── PHASE 6: SECRET ADMIN URL ─────────────────────────────
echo "$(c_cyan '▸ Phase 6: Secret Admin URL accessibility (frontend SPA)')"
if [[ "$API_URL" == *"127.0.0.1"* || "$API_URL" == *"localhost"* ]]; then
  printf "  %s %s\n" "$(c_amber '~')" "skipped — only meaningful against public URL"
else
  # Old /admin route deleted — SPA catchall serves index.html (HTTP 200) but React redirects to /dashboard
  SPA_ADMIN=$(curl -s -o /dev/null -w '%{http_code}' -m 5 "${API_URL}/admin" 2>/dev/null)
  SPA_SECRET=$(curl -s -o /dev/null -w '%{http_code}' -m 5 "${API_URL}/wlad-control-x7k9q2" 2>/dev/null)
  check "GET /admin (SPA fallback)"             "200" "$SPA_ADMIN" no
  check "GET /wlad-control-x7k9q2 (SPA OK)"     "200" "$SPA_SECRET" no
fi
echo ""

# ── PHASE 7: OBSERVABILITY ────────────────────────────────
echo "$(c_cyan '▸ Phase 7: Observability (Sentry / PostHog)')"
MON_HEALTH=$(curl -s -m 5 "${API_URL}/api/monitoring/health" 2>/dev/null)
SENTRY_ON=$(echo "$MON_HEALTH" | python3 -c "import json,sys;d=json.load(sys.stdin);print('yes' if d.get('sentry') else 'no')" 2>/dev/null || echo "?")
POSTHOG_ON=$(echo "$MON_HEALTH" | python3 -c "import json,sys;d=json.load(sys.stdin);print('yes' if d.get('posthog') else 'no')" 2>/dev/null || echo "?")
check "Sentry DSN configured"       "yes" "$SENTRY_ON"
check "PostHog key configured"      "yes" "$POSTHOG_ON" no
echo ""

# ── REPORT ────────────────────────────────────────────────
echo "════════════════════════════════════════════════════════════"
TOTAL=$((PASS + FAIL + WARN))
if [[ $FAIL -eq 0 ]]; then
  echo "  $(c_green 'RESULT: ALL CRITICAL CHECKS PASS')  $PASS/$TOTAL  (warn:$WARN)"
  echo "════════════════════════════════════════════════════════════"
  exit 0
else
  echo "  $(c_red 'RESULT: FAILED')  pass:$PASS  fail:$FAIL  warn:$WARN  (of $TOTAL)"
  echo "════════════════════════════════════════════════════════════"
  exit 1
fi
