## Test Credentials

### Admin Dashboard
- URL: /admin
- Password: wladhub2026
- Backend requires: `ADMIN_JWT_SECRET` in backend/.env (no fallback — startup fails if missing)

### Report / Sync Tokens (SEC-002)
- Frontend stores after quiz submit: `localStorage.leaderos_report_token` + `localStorage.leaderos_sync_token`
- Backend requires: `REPORT_JWT_SECRET` in backend/.env (no fallback)
- All calls to `GET /api/report/{sid}` + `POST /api/coach/chat` (post-report) send `Authorization: Bearer <report_token>`

### Passwordless OTP Login (SEC-002)
- Endpoints: `POST /api/auth/quick-login/request` → OTP sent via Resend
- Verify: `POST /api/auth/quick-login/verify` with `{email, code}`
- 6-digit code, TTL 10 min, max 5 attempts

### Test Email
- Email: start@aiporate.com (Resend verified recipient)

### Resend
- Sender: wlad@leader.wladhub.com
- API Key: configured in backend/.env

### Stripe
- Test key configured in backend/.env
- **Production Webhook (SEC-001)**: after redeploy, configure `STRIPE_WEBHOOK_SECRET` in Stripe Dashboard → Webhooks → whsec_… paste into backend/.env
- Until configured: `/webhook/stripe` returns 503 (fail-safe, no free licenses can be minted)
