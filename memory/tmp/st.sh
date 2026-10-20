API=$(grep REACT_APP_BACKEND_URL /app/frontend/.env | cut -d= -f2)
curl -s -m 20 -b /tmp/cj "$API/api/guide/admin/clips/teaser-login" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['status'], '|', d.get('progress'), '|', (d.get('error') or '')[:120], '|', round(d['spent_usd'],2), '|', d.get('duration_seconds_video'))"
