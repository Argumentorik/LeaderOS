# Identity Architecture — LeaderOS / WladBot

> Single source of truth for: who is a user, what id system represents them,
> and how that id propagates across MongoDB, Supabase, PostHog, and Sentry.

## TL;DR

```
                          ┌─────────────────────────────┐
                          │  MongoDB (Emergent-managed) │ ← SOURCE OF TRUTH
                          │  collection: users          │
                          │  primary key: user_id       │
                          └──────────────┬──────────────┘
                                         │ fire-and-forget
                                         │ mirror (event-driven)
                                         ▼
                          ┌─────────────────────────────┐
                          │  Supabase (read-model)      │
                          │  table: user_mirror         │
                          │  join key: mongo_user_id    │
                          └─────────────────────────────┘

                          ┌─────────────────────────────┐
                          │  PostHog (analytics)        │
                          │  distinct_id = user_id      │
                          │  email = person property    │
                          └─────────────────────────────┘

                          ┌─────────────────────────────┐
                          │  Sentry (errors)            │
                          │  user.id = user_id          │
                          │  user.email = property      │
                          └─────────────────────────────┘
```

## Canonical Identity

Every user has exactly **one** canonical identifier across all systems:

| System | Field | Format | Example |
|---|---|---|---|
| MongoDB | `user_id` | `user_{12 hex chars}` | `user_f111693f1b00` |
| Supabase | `mongo_user_id` | (mirror of above) | `user_f111693f1b00` |
| PostHog | `distinct_id` | (mirror of above) | `user_f111693f1b00` |
| Sentry | `user.id` | (mirror of above) | `user_f111693f1b00` |
| JWT | `user_id` claim | (mirror of above) | `user_f111693f1b00` |
| Server-side session | `user_id` | (mirror of above) | `user_f111693f1b00` |

**Email is NOT a primary key anywhere.** It is:
- A unique index on `users.email` for login lookups (case-insensitive)
- A searchable property on Sentry/PostHog person profiles
- A field on the Supabase user_mirror row

This decouples identity from email changes, OAuth provider drift, and account
merges.

## OAuth Provider Linking

Multiple OAuth providers can be linked to one canonical `user_id` via the
`oauth_providers` sub-document:

```python
user = {
  "user_id": "user_f111693f1b00",
  "email": "mert@leader-os.de",
  "oauth_providers": {
    "google":    {"sub": "117...", "linked_at": "2026-05-20T..."},
    "apple":     {"sub": "001234.abc...", "linked_at": "2026-06-01T..."},
    "microsoft": {"sub": "...uuid...", "linked_at": "2026-06-01T..."},
  },
  ...
}
```

When a user signs in via Google, we look up by `email` (since Google guarantees
verified emails) → if a user exists, link the Google `sub` into
`oauth_providers.google`. If not, create a new user with the canonical
`user_id` and seed `oauth_providers`.

## Source of Truth Hierarchy

```
1. MongoDB (primary)
     │
     ▼
2. Supabase user_mirror table (event-driven mirror, NOT a parallel write)
     │
     ▼
3. PostHog person profile + Sentry user (set on every login)
```

**Rules:**
- All writes to user identity go to **MongoDB first**.
- After MongoDB write succeeds, fire-and-forget `mirror_user_event(...)`
  to Supabase. Failures are logged but **non-blocking**.
- Frontend telemetry (PostHog, Sentry) is updated on `login()` and
  `checkAuth()` only — never as a stand-alone write.
- **No dual writes.** Supabase is read-model; it never writes back to MongoDB
  except via the `/api/internal/sync/*` inbound endpoints which are authenticated
  with `INBOUND_SYNC_SECRET`.

## Frontend Helper Contracts

### `lib/analytics.js`
```js
identifyByUser(user)   // user_id as distinct_id, email/name/tier as props
resetIdentity()        // on logout
capture(event, props)  // generic event capture
```

**Deprecated:** `identifyByEmail(email)` — kept as no-op shim for transitional
safety. New code MUST use `identifyByUser(user)`.

### `contexts/AuthContext.js`
```js
setSentryUser(user)   // {id: user.user_id, email, username: user.name}
                      // NOT {email: ...} alone
```

## Backend Sync Contracts

### Outbound (Mongo → Supabase)
```python
from services_supabase_sync import mirror_user_event_fire_and_forget

mirror_user_event_fire_and_forget(
  mongo_user_id=user_id,    # REQUIRED — primary join key
  email=email,              # property, not key
  full_name=name,           # property
  event="user.created" | "user.updated" | "subscription.changed",
  extra={...},
)
```

### Inbound (Supabase → Mongo)
Endpoints under `/api/internal/sync/*` authenticated via `X-Sync-Secret` header
matching `INBOUND_SYNC_SECRET`. Idempotent via `sync_events.event_id` unique
index — a replay of the same event is a no-op.

## Migration Notes

| Date | Change |
|---|---|
| 2026-05-20 (Iter 84.5) | Frontend `identifyByEmail` → `identifyByUser`; Sentry user.id = user_id |
| 2026-02 (Iter 84) | OAuth providers stored as `user.oauth_providers` map |
| 2026-02 (Iter 79) | Supabase bidirectional sync introduced as read-model |

## Anti-Patterns (DO NOT DO)

❌ `Sentry.setUser({email: ...})` without `id` — breaks user grouping on email change
❌ `ph.identify(email)` — uses email as PostHog distinct_id, conflates accounts
❌ `await supabase.from('users').insert(...)` directly — must go through `mirror_user_event`
❌ Joining MongoDB ↔ Supabase by `email` — always use `mongo_user_id`
❌ Trusting client-provided `user_id` — always derive from session cookie / JWT
