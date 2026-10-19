# 🔗 Supabase ↔ leader-os.de Sync Integration

> Bidirectional event sync between Supabase Edge Functions and the Mongo-backed leader-os.de backend.

---

## 🔐 Authentication

Both directions use a **shared-secret header** `X-Sync-Secret`.

| Direction | Secret Name (env) | Owner | Purpose |
|-----------|-------------------|-------|---------|
| **Inbound** (Supabase → us) | `INBOUND_SYNC_SECRET` | Mert | Supabase team adds this to their secrets and sends it on every call |
| **Outbound** (us → Supabase) | `SUPABASE_OUTBOUND_SECRET` | Supabase team | They generate, share with Mert, who adds it to backend `.env` |

### Inbound secret (generated for Supabase team)

```
INBOUND_SYNC_SECRET=pqOzrkwzWZAO8Wej7jIUPlk0PZc4jjmeKHg8T3Z0ctQgKtwYjYFiLiAS7KwLJQTF
```

Verify connectivity by hitting the public health endpoint with this secret:

```bash
curl -H "X-Sync-Secret: pqOz...JQTF" https://leader-os.de/api/internal/sync/health
# → 200 { "status": "ok", "service": "leader-os.de internal sync", "timestamp": "..." }
```

---

## 📥 Inbound Endpoints — Supabase → leader-os.de

Base URL: `https://leader-os.de/api/internal/sync`

### 1. `POST /subscription-updated`

Notify us that a user's plan/subscription state changed.

```jsonc
// Headers
X-Sync-Secret: <INBOUND_SYNC_SECRET>
Content-Type: application/json

// Body
{
  "event_id": "stripe_evt_1Or2X3...",     // required — used for idempotent replay-protection
  "mongo_user_id": "user_95ec4c805bad",   // optional — preferred lookup key
  "email": "alice@firma.de",              // optional — fallback lookup key
  "plan": "leadership_os_plus",           // required — see PLAN_TO_TIER below
  "active": true,                         // required — `false` → downgrade to free
  "via_installment": false,               // optional — true → mark installment plan active
  "installment_plan_id": "leadership_os_12x", // optional — only if via_installment=true
  "expires_at": "2027-02-11T00:00:00Z"    // optional — override tier expiration
}
```

**Plan → Tier mapping (PLAN_TO_TIER)**:

| Supabase `plan` value | Internal tier | Duration |
|----------------------|---------------|----------|
| `leadership_os` | `standard` | 365 days |
| `leadership_os_plus` | `accelerator` | 365 days |
| `leadership_os_enterprise` | `enterprise` | 365 days |
| `free` | `free` | Lifetime |
| `standard` / `accelerator` / `enterprise` (aliases) | same | – |

**Responses**:
- `200` `{"status": "ok", "user_id": "...", "tier": "accelerator", "event_id": "..."}` — applied
- `200` `{"status": "duplicate", "event_id": "..."}` — already processed (idempotent)
- `400` `{"detail": "Unknown plan/tier: ..."}` — unknown plan
- `401` `{"detail": "Invalid sync secret"}` — bad/missing secret
- `404` `{"detail": "user_not_found"}` — no Mongo user with given id/email
- `503` `{"detail": "Sync not configured"}` — server missing `INBOUND_SYNC_SECRET`

### 2. `POST /user-created`

Notify us when Supabase Auth creates a new user. We upsert a shell user in Mongo.

```jsonc
{
  "event_id": "supabase_evt_user_xyz",       // required
  "supabase_user_id": "uuid-from-supabase",  // optional
  "email": "alice@firma.de",                 // required
  "full_name": "Alice Schneider",            // optional
  "plan": "free"                             // optional — apply initial tier
}
```

**Responses**:
- `200` `{"status": "created", "user_id": "user_5f7...", "tier": "free"}` — new Mongo user
- `200` `{"status": "linked", "user_id": "user_5f7..."}` — already existed, Supabase id linked
- `200` `{"status": "duplicate", "event_id": "..."}` — already processed

### 3. `GET /health`

Quick auth + connectivity check. Useful for monitoring + CI smoke tests.

---

## 📤 Outbound Events — leader-os.de → Supabase

We POST to: `https://srujvjjncrszhaaxepxf.supabase.co/functions/v1/user-mirror`

With header: `X-Sync-Secret: <SUPABASE_OUTBOUND_SECRET>`

```jsonc
{
  "event_id": "evt_<uuid>",
  "event": "user.created",          // or "user.updated", "subscription.changed", etc.
  "mongo_user_id": "user_95ec4...",
  "email": "alice@firma.de",
  "full_name": "Alice Schneider",
  "timestamp": "2026-05-11T14:30:00Z",
  "extra": { "auth_method": "google" }  // optional context
}
```

### When we fire outbound events

| Trigger | Event name | Where |
|---------|-----------|-------|
| Email/password registration | `user.created` | `POST /api/auth/register` |
| Google OAuth first login | `user.created` | `POST /api/auth/google` |
| Google OAuth returning login | `user.updated` | `POST /api/auth/google` |

Outbound is **fire-and-forget**:
- Doesn't block the user-facing API response.
- 3 retry attempts with exponential backoff (0.5s, 1.5s, 4s).
- Persisted in `sync_events` collection for audit.
- If `SUPABASE_OUTBOUND_SECRET` is empty → sync silently disabled (no errors).

---

## 🛡️ Security Properties

- **Timing-safe comparison** of secrets via `secrets.compare_digest` (no early-exit timing leaks).
- **Idempotency** via unique `event_id` in `sync_events` collection (unique index).
- **Replay-protection**: duplicate `event_id` returns `{"status": "duplicate"}` without re-applying.
- **No password leak**: `user-created` from Supabase does NOT set a password — Supabase remains auth source-of-truth for that account.

---

## 🧪 How to test from the Supabase side

```bash
# 1) Health check
curl -s -H "X-Sync-Secret: pqOz...JQTF" \
  https://leader-os.de/api/internal/sync/health

# 2) Test plan upgrade (use a real test user email)
curl -s -X POST \
  -H "X-Sync-Secret: pqOz...JQTF" \
  -H "Content-Type: application/json" \
  -d '{
    "event_id":"supabase_test_001",
    "email":"standard@wladbot.test",
    "plan":"leadership_os_plus",
    "active":true
  }' \
  https://leader-os.de/api/internal/sync/subscription-updated
```

---

## ✅ What Mert needs from Supabase team

1. **Generate** `SUPABASE_OUTBOUND_SECRET` (32+ chars random).
2. **Add to leader-os.de `.env`** as `SUPABASE_OUTBOUND_SECRET=<value>` and restart backend.
3. **Add `INBOUND_SYNC_SECRET=pqOz...JQTF`** to the Supabase Edge Function's secrets.
4. **Implement** the Edge Function at `/functions/v1/user-mirror` that:
   - Verifies the `X-Sync-Secret` header against `INBOUND_SYNC_SECRET`.
   - Upserts the user into the Supabase Postgres `users` table by `email` or `mongo_user_id`.
   - On `subscription.changed`, calls back via `POST /api/internal/sync/subscription-updated`.
5. **Send** Mert the `SUPABASE_OUTBOUND_SECRET` over a secure channel (1Password / Signal / encrypted email).

Once Mert has the outbound secret, he'll set the env var and the bidirectional flow is live.
