API=$(grep REACT_APP_BACKEND_URL /app/frontend/.env | cut -d= -f2)
while true; do
  for s in start-1-willkommen start-2-so-sprichst-du; do
    echo "$(date +%H:%M:%S) $s $(curl -s -b /tmp/cj "$API/api/guide/admin/clips/$s" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['status'], '|', d.get('progress'), '|', d.get('error'), '|', round(d.get('spent_usd',0),2), '|', d.get('duration_seconds_video'))")" >> /app/memory/tmp/poll2.log
  done; sleep 60
done
