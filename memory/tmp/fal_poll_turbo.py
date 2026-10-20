import json, time, sys, requests
sys.path.insert(0, "/app/backend")
from services_fal import _headers, _trusted_queue_url, download

body = json.load(open("/app/memory/tmp/fal_s3_turbo_req.json"))
su, ru = _trusted_queue_url(body["status_url"]), _trusted_queue_url(body["response_url"])
t0 = time.time()
while time.time() - t0 < 6000:
    try:
        s = requests.get(su, headers=_headers(), timeout=30)
        st = s.json() if s.status_code == 200 else {"status": f"HTTP{s.status_code}"}
    except Exception as e:
        st = {"status": f"ERR {e}"}
    print(int(time.time() - t0), st.get("status"), st.get("queue_position"), flush=True)
    if str(st.get("status", "")).upper() in ("COMPLETED", "OK"):
        r = requests.get(ru, headers=_headers(), timeout=60)
        res = r.json(); print(json.dumps(res)[:500], flush=True)
        url = (res.get("video") or {}).get("url")
        if url:
            open("/app/memory/tmp/s3_sync_turbo.mp4", "wb").write(download(url, timeout=300)); print("SAVED", flush=True)
        break
    if str(st.get("status", "")).upper() in ("FAILED", "ERROR", "CANCELLED", "CANCELED"):
        print("FAILED", st, flush=True); break
    time.sleep(20)
