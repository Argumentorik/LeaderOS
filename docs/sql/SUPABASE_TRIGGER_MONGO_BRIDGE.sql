-- ============================================================================
-- Supabase → Emergent Mongo Bridge Trigger
-- ============================================================================
-- Purpose: After Stripe webhook updates `public.subscriptions`, fire a HTTP
-- POST to leader-os.de FastAPI so MongoDB stays in sync (so the app frontend
-- sees the new tier instantly on next request — no 15min sync-lag).
--
-- Prereq: pg_net extension must be enabled (it's enabled by default on
-- Supabase Pro+). Verify with:
--   select * from pg_extension where extname = 'pg_net';
-- If not enabled:
--   create extension if not exists pg_net with schema extensions;
--
-- Secrets needed in Vault (Studio → Project Settings → Vault):
--   - EMERGENT_INBOUND_SECRET  (= INBOUND_SYNC_SECRET from leader-os.de .env)
--   - EMERGENT_API_BASE        (= https://leader-os.de)
-- ============================================================================

-- 1. Helper: load secret from Vault
create or replace function private.get_secret(p_name text)
returns text
language plpgsql
security definer
as $$
declare v_value text;
begin
  select decrypted_secret into v_value
  from vault.decrypted_secrets
  where name = p_name
  limit 1;
  return v_value;
end;
$$;

-- 2. Plan-name → Emergent plan name mapping (matches PLAN_TO_TIER in sync.py)
--    Adjust if your `pricing_plans.code` values differ.
create or replace function private.map_plan_to_emergent(p_code text)
returns text
language sql immutable as $$
  select case p_code
    when 'leadership_os_yearly'       then 'leadership_os'
    when 'leadership_os_yearly_2x'    then 'leadership_os'
    when 'leadership_os_yearly_12x'   then 'leadership_os'
    when 'leadership_os_plus_yearly'  then 'leadership_os_plus'
    when 'enterprise'                 then 'leadership_os_enterprise'
    else 'free'
  end;
$$;

-- 3. The trigger function — fires on every INSERT/UPDATE in subscriptions
create or replace function private.notify_emergent_subscription_change()
returns trigger
language plpgsql
security definer
as $$
declare
  v_email           text;
  v_plan_code       text;
  v_emergent_plan   text;
  v_event_id        text;
  v_url             text;
  v_secret          text;
  v_active          boolean;
  v_payload         jsonb;
  v_request_id      bigint;
begin
  -- Resolve user email
  select email into v_email from public.users where id = NEW.user_id;
  if v_email is null then
    raise log 'notify_emergent: no email for user_id=%', NEW.user_id;
    return NEW;
  end if;

  -- Resolve plan code → emergent plan name
  select code into v_plan_code from public.pricing_plans where id = NEW.plan_id;
  v_emergent_plan := private.map_plan_to_emergent(coalesce(v_plan_code, 'free'));

  -- Active = Stripe status in ('active','trialing','past_due')
  v_active := NEW.status in ('active', 'trialing', 'past_due');

  v_event_id := 'sub_' || NEW.id::text || '_' || extract(epoch from now())::bigint::text;
  v_url      := private.get_secret('EMERGENT_API_BASE') || '/api/internal/sync/subscription-updated';
  v_secret   := private.get_secret('EMERGENT_INBOUND_SECRET');

  v_payload := jsonb_build_object(
    'event_id', v_event_id,
    'email',    v_email,
    'plan',     v_emergent_plan,
    'active',   v_active,
    'expires_at', to_char(NEW.current_period_end at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
  );

  -- Fire-and-forget HTTP POST via pg_net (async, won't block the trigger)
  select net.http_post(
    url     := v_url,
    headers := jsonb_build_object(
      'Content-Type',    'application/json',
      'X-Sync-Secret',   v_secret
    ),
    body    := v_payload,
    timeout_milliseconds := 5000
  ) into v_request_id;

  raise log 'notify_emergent: sent sub_id=% user=% plan=% active=% request_id=%',
    NEW.id, v_email, v_emergent_plan, v_active, v_request_id;

  return NEW;
end;
$$;

-- 4. Attach trigger to subscriptions table (fires after row is committed)
drop trigger if exists trg_notify_emergent_on_subscription_change on public.subscriptions;
create trigger trg_notify_emergent_on_subscription_change
  after insert or update of status, plan_id, current_period_end
  on public.subscriptions
  for each row
  execute function private.notify_emergent_subscription_change();

-- ============================================================================
-- Smoke test (run in SQL editor — replace UUID with a real subscription row):
--
--   update public.subscriptions
--   set status = 'active'
--   where id = '<your_test_sub_uuid>';
--
-- Then check Mongo audit log:
--   curl -X GET "https://leader-os.de/api/internal/sync/health" \
--        -H "X-Sync-Secret: <INBOUND_SYNC_SECRET>"
--
-- Or check pg_net response queue:
--   select * from net.http_response_queue order by id desc limit 5;
-- ============================================================================
