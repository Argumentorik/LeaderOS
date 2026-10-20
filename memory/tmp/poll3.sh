API=$(grep REACT_APP_BACKEND_URL /app/frontend/.env | cut -d= -f2)
while true; do
  curl -s -c /tmp/cj -X POST "$API/api/auth/login" -H "Content-Type: application/json" -d '{"identifier":"test@test.com","password":"test123"}' -o /dev/null
  echo "== $(date +%H:%M:%S)" >> /app/memory/tmp/poll3.log
  curl -s -b /tmp/cj "$API/api/guide/admin/overview" | python3 -c "
import sys,json; d=json.load(sys.stdin)
for c in d['clips']:
    if c['kind'] in ('onboarding','mission') or c['slug'] in ('bp-missionen','bp-video-analyse'):
        print(' ', c['slug'].ljust(24), (c.get('status') or '').ljust(14), str(c.get('progress') or '').ljust(28), str(c.get('error') or '')[:60], round(c.get('spent_usd') or 0,2), c.get('duration_seconds_video'), 'stale' if c.get('stale') else '')
" >> /app/memory/tmp/poll3.log
  sleep 120
done
