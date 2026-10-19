-- Newsletter subscriber registry — dedicated marketing-opt-in domain.
-- Distinct from public.leads (foreign product analytics) and
-- public.email_journeys (lifecycle automation). Double-opt-in by design.
--
-- Applied to prod 2026-06-20 via execute_sql (apply_migration was timing
-- out against a flaky pooler); this file is the version-controlled record.
-- Idempotent — safe to re-run.

create table if not exists public.newsletter_subscribers (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  email         text not null,
  email_lower   text not null generated always as (lower(btrim(email))) stored,
  status        text not null default 'pending'
                  check (status in ('pending','active','unsubscribed','bounced')),
  source        text not null default 'unknown',
  campaign      text,
  confirm_token uuid not null default gen_random_uuid(),
  confirmed_at  timestamptz,
  unsubscribed_at timestamptz,
  ip            text,
  user_agent    text,
  referrer      text,
  payload       jsonb not null default '{}'::jsonb
);

-- email_lower is the dedup key (matches the CLAUDE.md cross-platform rule).
create unique index if not exists newsletter_subscribers_email_lower_key
  on public.newsletter_subscribers (email_lower);
create index if not exists newsletter_subscribers_status_idx
  on public.newsletter_subscribers (status);
create index if not exists newsletter_subscribers_confirm_token_idx
  on public.newsletter_subscribers (confirm_token);
create index if not exists newsletter_subscribers_source_idx
  on public.newsletter_subscribers (source);

comment on table public.newsletter_subscribers is
  'Marketing newsletter opt-in registry. Double-opt-in: status pending -> active on confirm-link click. Written only by service_role (newsletter-subscribe / newsletter-confirm Edge Functions). source/campaign attribute every signup to its capture surface.';

-- keep updated_at fresh on every UPDATE (e.g. the confirm flow)
create or replace function public.touch_newsletter_subscribers_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function public.touch_newsletter_subscribers_updated_at() from public, anon, authenticated;
grant execute on function public.touch_newsletter_subscribers_updated_at() to service_role;

drop trigger if exists trg_touch_newsletter_subscribers on public.newsletter_subscribers;
create trigger trg_touch_newsletter_subscribers
  before update on public.newsletter_subscribers
  for each row execute function public.touch_newsletter_subscribers_updated_at();

-- RLS on, no anon/authenticated policies => locked to service_role only.
-- The Edge Functions use the service-role key and bypass RLS. This yields
-- the intended "rls_enabled_no_policy" INFO advisor (same as public.sites).
alter table public.newsletter_subscribers enable row level security;
