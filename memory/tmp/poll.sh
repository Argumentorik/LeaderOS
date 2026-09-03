API=$(grep REACT_APP_BACKEND_URL /app/frontend/.env | cut -d '=' -f2)
T=$(curl -s -X POST "$API/api/auth/login" -H "Content-Type: application/json" -d '{"email":"test@test.com","password":"test123"}' | python3 -c "import sys,json;d=json.load(sys.stdin);print(d.get('token') or d.get('access_token') or d.get('session_token'))")
echo "$T" > /app/memory/tmp/admin_token
curl -s "$API/api/guide/admin/overview" -H "Authorization: Bearer $T" | python3 -c "
import sys,json;d=json.load(sys.stdin)
r=[c for c in d['clips'] if c['multi_shot']]
done=[c['slug'] for c in r if c['status']=='video_ready']
fail=[(c['slug'],(c.get('error') or '')[:90]) for c in r if c['status'].endswith('_failed') or c['status']=='interrupted']
run=[(c['slug'][:14],c.get('progress')) for c in r if c['status'].endswith('_running') and c.get('progress')!='wartet auf Slot']
print('done',len(done),done,'| running',run,'| failed',fail,'| spent',d['settings']['spent_usd'])"
