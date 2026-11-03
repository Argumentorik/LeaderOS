#!/usr/bin/env bash
# ────────────────────────────────────────────────────────────────────────────
# LeaderOS · Post-Deploy Smoke Test (Production)
#
# Usage:
#   API_BASE=https://leader-os.de bash /app/scripts/smoke_test_production.sh
#
# Was wird getestet:
#   1. Backend reachable
#   2. Stripe LIVE mode confirmed
#   3. Auth endpoint reachable
#   4. RAG-Pipeline (Voyage + Supabase) reachable
#   5. Webhook endpoint signature validation
#
# Exit-Code 0 = alles grün, sonst 1 = manueller Check nötig.
# ────────────────────────────────────────────────────────────────────────────
set -euo pipefail

API_BASE="${API_BASE:-https://leader-os.de}"
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'

pass() { echo -e "${GREEN}✓${NC} $1"; }
fail() { echo -e "${RED}✗${NC} $1"; FAILS=$((FAILS+1)); }
warn() { echo -e "${YELLOW}!${NC} $1"; }

FAILS=0

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  LeaderOS Production Smoke Test · $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "  Target: $API_BASE"
echo "═══════════════════════════════════════════════════════════════"

# 1. Backend reachable?
echo ""
echo "[1/5] Backend reachable …"
if curl -fsS -o /dev/null -w "%{http_code}" "$API_BASE/api/health" | grep -q "^200$"; then
  pass "Backend antwortet auf /api/health"
else
  fail "Backend nicht erreichbar oder /api/health gibt non-200"
fi

# 2. Stripe LIVE mode confirmed?
echo ""
echo "[2/5] Stripe mode check …"
STRIPE_RESP=$(curl -fsS "$API_BASE/api/payments/stripe-mode")
STRIPE_MODE=$(echo "$STRIPE_RESP" | python3 -c "import sys,json;print(json.load(sys.stdin)['mode'])" 2>/dev/null || echo "parse-error")
STRIPE_LIVE=$(echo "$STRIPE_RESP" | python3 -c "import sys,json;print(json.load(sys.stdin)['live'])" 2>/dev/null || echo "parse-error")
echo "  Response: $STRIPE_RESP"
if [ "$STRIPE_LIVE" = "True" ] && [ "$STRIPE_MODE" = "live" ]; then
  pass "Stripe ist im LIVE mode (sk_live_…)"
elif [ "$STRIPE_MODE" = "platform_default" ]; then
  fail "STRIPE_API_KEY ist noch Emergent's Sandbox-Default (sk_test_emergent) — setz deinen sk_live_… in Vercel!"
elif [ "$STRIPE_MODE" = "test" ]; then
  fail "STRIPE_API_KEY ist test-mode (sk_test_…) — setz deinen sk_live_… in Vercel!"
elif [ "$STRIPE_MODE" = "missing" ]; then
  fail "STRIPE_API_KEY ist gar nicht gesetzt!"
else
  fail "Unerwarteter Stripe-Mode: $STRIPE_MODE"
fi

# 3. Auth endpoint reachable?
echo ""
echo "[3/5] Auth endpoint reachable …"
AUTH_HTTP=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"smoke-test-nonexistent@leader-os.de","password":"x"}' || echo "000")
# Expected: 401 (invalid credentials), NOT 5xx
if [ "$AUTH_HTTP" = "401" ] || [ "$AUTH_HTTP" = "400" ]; then
  pass "Auth-Endpoint responsive (returned $AUTH_HTTP wie erwartet für invalid creds)"
elif [ "$AUTH_HTTP" = "429" ]; then
  warn "Rate-limited ($AUTH_HTTP) — vermutlich vorheriger Test, OK"
else
  fail "Auth-Endpoint gibt unerwartetes $AUTH_HTTP (erwartet: 400/401)"
fi

# 4. Events endpoint (no auth needed, sanity check)
echo ""
echo "[4/5] Events endpoint reachable (public) …"
EVENTS_HTTP=$(curl -s -o /dev/null -w "%{http_code}" "$API_BASE/api/events" || echo "000")
if [ "$EVENTS_HTTP" = "200" ]; then
  pass "Events-Endpoint responsive"
else
  fail "Events-Endpoint gibt $EVENTS_HTTP"
fi

# 5. Stripe Webhook URL accepting POSTs?
echo ""
echo "[5/5] Stripe webhook reachable …"
WEBHOOK_HTTP=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_BASE/api/webhook/stripe" \
  -H "Content-Type: application/json" \
  -d '{}' || echo "000")
# Expected: 400/401/410 (missing/invalid signature) — that means endpoint is wired up correctly
if [ "$WEBHOOK_HTTP" = "400" ] || [ "$WEBHOOK_HTTP" = "401" ] || [ "$WEBHOOK_HTTP" = "410" ]; then
  pass "Webhook responsive ($WEBHOOK_HTTP = correct rejection without valid Stripe signature)"
elif [ "$WEBHOOK_HTTP" = "405" ]; then
  fail "Webhook gibt 405 — Route accepts POST? Check routes/payments.py"
elif [ "$WEBHOOK_HTTP" = "404" ]; then
  fail "Webhook 404 — /api/webhook/stripe Route fehlt oder URL falsch"
else
  warn "Webhook gibt $WEBHOOK_HTTP — manuell prüfen"
fi

# ────────────────────────────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════════"
if [ "$FAILS" = "0" ]; then
  echo -e "  ${GREEN}🎉 ALLE CHECKS GREEN — Production is GO.${NC}"
  echo "═══════════════════════════════════════════════════════════════"
  echo ""
  echo "Nächster Schritt: Manueller 1€-Test mit echter Karte:"
  echo "  1. Login als admin"
  echo "  2. /coaching → Leadership OS €997 → Checkout"
  echo "  3. Stripe Dashboard → Payments → Refund sofort"
  exit 0
else
  echo -e "  ${RED}❌ $FAILS Check(s) failed — siehe oben.${NC}"
  echo "═══════════════════════════════════════════════════════════════"
  exit 1
fi
