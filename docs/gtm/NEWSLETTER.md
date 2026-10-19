# Newsletter Engine — Phase 1 of the Content Engine

The growth layer ships **before** the journal on purpose: the primary KPI
is email subscribers, not page views, so the capture mechanism exists
first and every future content surface feeds it.

## One component, attributed everywhere

```jsx
import { EmailCapture } from '@/features/newsletter';

<EmailCapture source="footer"  campaign="field-notes" tone="dark" compact />
<EmailCapture source="journal" campaign="field-notes" tone="light" />
<EmailCapture source="article" campaign="why-coaches-stall" variant="stacked" />
```

`source` (+ optional `campaign`) is stored on every row, so analytics can
answer "where did this subscriber convert" without guesswork. Today it
lives in the landing footer (`source="footer"`); Phase 3 drops the same
component into articles, guides, and lead magnets with new `source` tags.

## Data flow (keyless frontend)

```
EmailCapture (browser)
   │  POST /api/newsletter/subscribe        (same-origin, no anon key)
   ▼
vercel.json rewrite
   │  → https://<ref>.supabase.co/functions/v1/newsletter-subscribe
   ▼
Edge Function newsletter-subscribe  (verify_jwt=false, service_role)
   │  1. validate email
   │  2. global suppression check (email_suppressions — GDPR)
   │  3. upsert pending row + confirm_token
   │  4. Resend → double-opt-in email
   ▼
user clicks confirm link
   │  GET /api/newsletter/confirm?token=…    (same-origin)
   ▼
vercel.json rewrite → Edge Function newsletter-confirm
   │  flip status pending → active, set confirmed_at
   ▼
302 → /newsletter/confirmed?status=confirmed   (React page, noindex)
```

No Supabase anon key ships in the bundle: the Vercel rewrite + the
functions' `verify_jwt=false` keep the client dumb and keyless. CSP is
satisfied because the browser only ever talks to same-origin
`/api/newsletter/*`.

## Pieces

| Layer | Path |
|---|---|
| Table | `public.newsletter_subscribers` (migration `20260620000000_*`) |
| Subscribe fn | `supabase/functions/newsletter-subscribe/index.ts` |
| Confirm fn | `supabase/functions/newsletter-confirm/index.ts` |
| Rewrites | `vercel.json` — `/api/newsletter/*` (BEFORE the `/api/*` Emergent catch-all) |
| Component | `frontend/src/features/newsletter/EmailCapture.jsx` |
| Client | `frontend/src/features/newsletter/lib/newsletterClient.js` |
| Confirm page | `frontend/src/pages/NewsletterConfirmedPage.js` → `/newsletter/confirmed` |

## Table contract

- **`email_lower`** (generated `lower(btrim(email))`, UNIQUE) is the dedup
  key — same identity key as the rest of the platform (CLAUDE.md rule 5).
- **`status`**: `pending → active` on confirm; `unsubscribed` / `bounced`
  reserved for Phase 2 webhook handling.
- **RLS on, zero policies** → only `service_role` (the Edge Functions)
  can read/write. Produces the intended `rls_enabled_no_policy` INFO
  advisor (same posture as `public.sites`). **Do not add anon policies.**
- Re-subscribe is idempotent: an already-`active` address returns `ok`
  with no resend (no list-membership leak); a `pending`/`unsubscribed`
  address gets a fresh token + new confirmation mail.

## Secrets (already set on the Supabase project)

`RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `APP_URL`, plus the standard
`SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`. Reused from
`send-welcome-email`; nothing new to provision.

## What's next (later phases — NOT built yet)

- **Phase 2**: Resend bounce/complaint webhook → flip `status` to
  `bounced`, write `email_suppressions`. Unsubscribe endpoint
  (`/api/newsletter/unsubscribe?token=`) + token column.
- **Phase 3**: `features/content/` — registry-driven articles, the
  `EmailCapture` dropped into article bodies, RSS, content sitemap.
- **Phase 5**: CMS (Sanity/Notion) feeding the same registry shape.
