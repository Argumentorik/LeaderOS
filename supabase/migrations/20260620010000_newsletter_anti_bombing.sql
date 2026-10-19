-- Anti-bombing guard for the newsletter double-opt-in flow.
--
-- Surfaced by the Phase-1 security review: without rate limiting,
-- an attacker could send thousands of confirmation mails to a victim
-- (mail-bombing). Resend's own limits are per-account, not per-victim.
-- This RPC is called from the newsletter-subscribe Edge Function
-- BEFORE the Resend send and BEFORE the row-update, so a denied
-- request is a true no-op.
--
-- Caps:
--   per email   - one DOI mail every 5 minutes
--   per IP      - max 10 distinct emails per rolling 1 hour window
--
-- Applied to prod 2026-06-20 via apply_migration. The matching
-- newsletter-subscribe Edge Function source in this repo already
-- calls the RPC; the deployed Edge Function will pick it up on the
-- next redeploy (Supabase MCP server-side approval gate currently
-- blocks the redeploy from this session).

create or replace function public.newsletter_can_send_doi(
  p_email_lower text,
  p_ip text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  recent_for_email_count int;
  recent_for_ip_count int;
begin
  -- per-email cooldown
  select count(*) into recent_for_email_count
  from public.newsletter_subscribers
  where email_lower = p_email_lower
    and updated_at > now() - interval '5 minutes';
  if recent_for_email_count > 0 then
    return false;
  end if;

  -- per-IP throttle
  if p_ip is not null then
    select count(distinct email_lower) into recent_for_ip_count
    from public.newsletter_subscribers
    where ip = p_ip
      and created_at > now() - interval '1 hour';
    if recent_for_ip_count >= 10 then
      return false;
    end if;
  end if;

  return true;
end;
$$;

revoke all on function public.newsletter_can_send_doi(text, text) from public, anon, authenticated;
grant execute on function public.newsletter_can_send_doi(text, text) to service_role;

comment on function public.newsletter_can_send_doi(text, text) is
  'Anti-bombing guard called from newsletter-subscribe Edge Function before sending a DOI mail. Per-email cooldown 5min, per-IP cap 10 distinct emails / hour.';
