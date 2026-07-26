-- Migration 005: Production Hardening V2 — Role Escalation, Admin Security, Campaign state transitions
-- Create NEW migrations only. DO NOT EDIT 001, 002, 003, 004.

-- ============================================================
-- 1. Create secure onboarding RPC
-- ============================================================
create or replace function public.complete_onboarding(
  selected_role public.user_role,
  display_name text,
  username text,
  avatar_url text default null,
  brand_name text default null,
  website_url text default null,
  brand_description text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_profile public.profiles;
  brand_slug text;
  final_brand_name text;
begin
  -- 1. require auth.uid()
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  -- 2. accept only creator or brand
  if selected_role not in ('creator', 'brand') then
    raise exception 'Invalid role selection. Admin cannot be selected.';
  end if;

  -- 3. verify onboarding is not already completed (idempotency check)
  select * into existing_profile from public.profiles where id = auth.uid();
  if existing_profile.id is null then
    raise exception 'Profile not found';
  end if;

  if existing_profile.onboarding_completed then
    if existing_profile.role = selected_role then
      return; -- Idempotent return
    else
      raise exception 'Onboarding already completed with role: %', existing_profile.role;
    end if;
  end if;

  -- 4. update the authenticated caller only
  update public.profiles
  set role = selected_role,
      display_name = complete_onboarding.display_name,
      username = complete_onboarding.username,
      avatar_url = coalesce(complete_onboarding.avatar_url, existing_profile.avatar_url),
      onboarding_completed = true,
      updated_at = now()
  where id = auth.uid();

  -- 5. create related Brand workspace if selected role = brand
  if selected_role = 'brand' then
    final_brand_name := trim(brand_name);
    if final_brand_name is null or length(final_brand_name) < 2 then
      -- Derive brand name
      final_brand_name := coalesce(complete_onboarding.display_name, existing_profile.email, 'Brand Workspace');
      if final_brand_name like '%@%' then
        final_brand_name := split_part(final_brand_name, '@', 1) || ' Workspace';
      end if;
    end if;

    brand_slug := lower(regexp_replace(final_brand_name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(auth.uid()::text, 1, 8);

    insert into public.brands (owner_id, name, slug, website_url, description)
    values (auth.uid(), final_brand_name, brand_slug, website_url, brand_description)
    on conflict (slug) do nothing;
  end if;
end;
$$;

-- Revoke default public execution
revoke all on function public.complete_onboarding(public.user_role, text, text, text, text, text, text) from public;
-- Grant execute only to authenticated users
grant execute on function public.complete_onboarding(public.user_role, text, text, text, text, text, text) to authenticated;

-- ============================================================
-- 2. Harden profiles RLS update policies & constraints
-- ============================================================
-- Drop existing insert/update policies
drop policy if exists "profiles own insert" on public.profiles;
drop policy if exists "profiles own safe update" on public.profiles;
drop policy if exists "profiles read all" on public.profiles;

-- Normal profile updates should only allow safe fields (display_name, username, avatar_url).
-- Role and onboarding_completed must NOT be editable directly via REST.
create policy "profiles own safe update" on public.profiles
  for update
  using (id = auth.uid())
  with check (
    id = auth.uid() 
    and role = (select role from public.profiles where id = auth.uid())
    and onboarding_completed = (select onboarding_completed from public.profiles where id = auth.uid())
  );

-- Database-authoritative profile selection: exclude suspended or banned creators from brand exploration.
create policy "profiles_select_policy" on public.profiles
  for select using (
    public.is_admin() or
    id = auth.uid() or
    (
      role = 'creator' and account_status not in ('suspended', 'banned')
    ) or
    (
      role = 'brand'
    )
  );

-- Enforce display name and username maximum lengths at database level
alter table public.profiles drop constraint if exists check_display_name_length;
alter table public.profiles add constraint check_display_name_length check (display_name is null or length(display_name) <= 50);

alter table public.profiles drop constraint if exists check_username_length;
alter table public.profiles add constraint check_username_length check (username is null or length(username) <= 30);

-- ============================================================
-- 3. Campaign Status History Table
-- ============================================================
create table if not exists public.campaign_status_history (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  previous_status public.campaign_status,
  new_status public.campaign_status not null,
  actor_user_id uuid references public.profiles(id) on delete set null,
  actor_role public.user_role not null,
  reason text,
  created_at timestamptz not null default now()
);

alter table public.campaign_status_history enable row level security;

create policy "campaign_status_history_read" on public.campaign_status_history
  for select using (
    public.is_admin() or
    exists (
      select 1 from public.campaigns c
      join public.brands b on b.id = c.brand_id
      where c.id = campaign_id and b.owner_id = auth.uid()
    )
  );

-- ============================================================
-- 4. Enforce Campaign State Transitions in Trigger
-- ============================================================
create or replace function public.handle_campaign_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_role_val public.user_role;
  is_caller_admin boolean;
begin
  if new.status is distinct from old.status then
    -- 1. Get actor role and check if admin
    is_caller_admin := public.is_admin();
    
    if not is_caller_admin then
      -- Verify caller is a brand workspace member / owner
      if not exists (
        select 1 from public.brands b
        where b.id = new.brand_id and b.owner_id = auth.uid()
      ) then
        raise exception 'Not authorized to change campaign status';
      end if;
      
      -- Check allowed transitions for Brand
      if not (
        (old.status = 'draft' and new.status = 'pending_review') or
        (old.status = 'rejected' and new.status = 'pending_review') or
        (old.status = 'active' and new.status = 'paused') or
        (old.status = 'paused' and new.status = 'active')
      ) then
        raise exception 'Invalid campaign status transition from % to % for brand', old.status, new.status;
      end if;
    end if;

    -- Get actor role for logging
    select role into actor_role_val from public.profiles where id = auth.uid();

    -- 2. Insert into history
    insert into public.campaign_status_history (
      campaign_id, previous_status, new_status, actor_user_id, actor_role
    )
    values (
      new.id, old.status, new.status, auth.uid(), coalesce(actor_role_val, 'brand'::public.user_role)
    );
  end if;
  return new;
end;
$$;

drop trigger if exists on_campaign_status_changed on public.campaigns;
create trigger on_campaign_status_changed
before update of status on public.campaigns
for each row execute function public.handle_campaign_status_change();

-- ============================================================
-- 5. Campaign Status Transition RPC Functions
-- ============================================================
create or replace function public.submit_campaign_for_review(target_campaign_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.campaigns
  set status = 'pending_review'
  where id = target_campaign_id;
end;
$$;

create or replace function public.pause_campaign(target_campaign_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.campaigns
  set status = 'paused'
  where id = target_campaign_id;
end;
$$;

create or replace function public.resume_campaign(target_campaign_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.campaigns
  set status = 'active'
  where id = target_campaign_id;
end;
$$;

-- Grant execute permissions to authenticated users
grant execute on function public.submit_campaign_for_review(uuid) to authenticated;
grant execute on function public.pause_campaign(uuid) to authenticated;
grant execute on function public.resume_campaign(uuid) to authenticated;

-- ============================================================
-- 6. Campaign Budget Exposure Engine View
-- ============================================================
create or replace view public.campaign_budget_summaries as
select
  c.id as campaign_id,
  c.total_budget_cents as total_budget,
  c.used_budget_cents as used_budget,
  coalesce(sum(s.earnings_cents) filter (where s.status in ('eligible', 'paid')), 0) as credited_amount,
  coalesce(sum(s.earnings_cents) filter (where s.status = 'paid'), 0) as paid_amount,
  coalesce(sum(s.earnings_cents) filter (where s.status = 'eligible'), 0) as verified_payable,
  coalesce(sum(coalesce(c.cap_per_post_cents, s.earnings_cents)) filter (where s.status in ('processing', 'eligible', 'under_review')), 0) as committed_exposure,
  greatest(0, c.total_budget_cents - coalesce(sum(coalesce(c.cap_per_post_cents, s.earnings_cents)) filter (where s.status in ('processing', 'eligible', 'under_review')), 0)) as remaining_uncommitted_budget
from public.campaigns c
left join public.submissions s on s.campaign_id = c.id
group by c.id, c.total_budget_cents, c.used_budget_cents;

-- ============================================================
-- 7. Creator Campaign Eligibility Check RPC
-- ============================================================
create or replace function public.check_campaign_eligibility(target_campaign_id uuid)
returns table (eligible boolean, reasons text[])
language plpgsql
security definer
set search_path = public
as $$
declare
  campaign_rec record;
  profile_rec record;
  connected_accounts_count int;
  budget_summary record;
  reasons_list text[] := '{}';
  is_eligible boolean := true;
begin
  -- 1. Resolve creator profile
  select * into profile_rec from public.profiles where id = auth.uid();
  if profile_rec.id is null then
    reasons_list := array_append(reasons_list, 'User profile not found');
    return query select false, reasons_list;
  end if;

  -- Verify role = creator
  if profile_rec.role != 'creator' then
    reasons_list := array_append(reasons_list, 'Only creators can submit to campaigns');
  end if;

  -- Creator suspension status
  if profile_rec.account_status = 'suspended' or profile_rec.account_status = 'banned' then
    reasons_list := array_append(reasons_list, 'Account is suspended or banned');
  end if;

  -- 2. Resolve campaign
  select * into campaign_rec from public.campaigns where id = target_campaign_id;
  if campaign_rec.id is null then
    reasons_list := array_append(reasons_list, 'Campaign not found');
    return query select false, reasons_list;
  end if;

  -- Campaign active
  if campaign_rec.status != 'active' then
    reasons_list := array_append(reasons_list, 'Campaign is not active (status: ' || campaign_rec.status || ')');
  end if;

  -- Campaign date window
  if campaign_rec.start_at is not null and now() < campaign_rec.start_at then
    reasons_list := array_append(reasons_list, 'Campaign has not started yet');
  end if;
  if campaign_rec.end_at is not null and now() > campaign_rec.end_at then
    reasons_list := array_append(reasons_list, 'Campaign has ended');
  end if;

  -- 3. Platform and Provider Account checks
  select count(*) into connected_accounts_count
  from public.provider_connections pc
  join public.campaign_platforms cp on cp.platform = pc.provider
  where pc.user_id = auth.uid()
    and cp.campaign_id = target_campaign_id
    and pc.status = 'active';

  if connected_accounts_count = 0 then
    reasons_list := array_append(reasons_list, 'No active linked social account matching the campaign platforms');
  end if;

  -- 4. Budget capacity
  select * into budget_summary from public.campaign_budget_summaries where campaign_id = target_campaign_id;
  if budget_summary.remaining_uncommitted_budget <= 0 then
    reasons_list := array_append(reasons_list, 'Campaign budget capacity has been fully committed');
  end if;

  -- 5. Creator submission cap per campaign
  if campaign_rec.cap_per_creator_cents is not null then
    declare
      current_earnings bigint;
    begin
      select coalesce(sum(earnings_cents), 0) into current_earnings
      from public.submissions
      where campaign_id = target_campaign_id
        and creator_id = auth.uid();

      if current_earnings >= campaign_rec.cap_per_creator_cents then
        reasons_list := array_append(reasons_list, 'Creator budget cap reached for this campaign');
      end if;
    end;
  end if;

  -- Return results
  if array_length(reasons_list, 1) > 0 then
    is_eligible := false;
  end if;

  return query select is_eligible, reasons_list;
end;
$$;

grant execute on function public.check_campaign_eligibility(uuid) to authenticated;

-- ============================================================
-- 8. Creator Submission Hardening Triggers & Indexes
-- ============================================================
-- Prevent duplicate provider post globally
alter table public.submissions drop constraint if exists submissions_normalized_post_url_key;
alter table public.submissions add constraint submissions_normalized_post_url_key unique (normalized_post_url);

drop index if exists submissions_platform_external_post_id_idx;
create unique index submissions_platform_external_post_id_idx on public.submissions (platform, external_post_id) where external_post_id is not null;

-- Submission insert enforcement trigger
create or replace function public.validate_submission_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  is_eligible boolean;
  reasons_list text[];
begin
  -- Force server-authoritative fields
  new.creator_id := auth.uid();
  new.status := 'processing';
  new.payout_status := 'pending';
  new.total_views := 0;
  new.verified_views := 0;
  new.eligible_views := 0;
  new.earnings_cents := 0;

  -- Check eligibility
  select eligible, reasons into is_eligible, reasons_list
  from public.check_campaign_eligibility(new.campaign_id);

  if not is_eligible then
    raise exception 'Creator not eligible to submit: %', array_to_string(reasons_list, ', ');
  end if;

  return new;
end;
$$;

drop trigger if exists on_submission_insert on public.submissions;
create trigger on_submission_insert
before insert on public.submissions
for each row execute function public.validate_submission_insert();

-- ============================================================
-- 9. Submission Event History Table & Trigger
-- ============================================================
create table if not exists public.submission_event_history (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  event_type text not null,
  actor_user_id uuid references public.profiles(id) on delete set null,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.submission_event_history enable row level security;

create policy "submission_event_history_read" on public.submission_event_history
  for select using (
    public.is_admin() or
    exists (
      select 1 from public.submissions s
      where s.id = submission_id and s.creator_id = auth.uid()
    ) or
    exists (
      select 1 from public.submissions s
      join public.campaigns c on c.id = s.campaign_id
      join public.brands b on b.id = c.brand_id
      where s.id = submission_id and b.owner_id = auth.uid()
    )
  );

create or replace function public.handle_submission_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  event_val text;
begin
  if tg_op = 'INSERT' then
    insert into public.submission_event_history (submission_id, event_type, actor_user_id)
    values (new.id, 'submitted', auth.uid());
  elsif tg_op = 'UPDATE' and new.status is distinct from old.status then
    case new.status
      when 'processing' then event_val := 'verification_started';
      when 'eligible' then event_val := 'verification_completed';
      when 'rejected' then event_val := 'rejected';
      when 'paid' then event_val := 'payout_processed';
      when 'under_review' then event_val := 'verification_started';
      else event_val := new.status::text;
    end case;
    
    insert into public.submission_event_history (submission_id, event_type, actor_user_id)
    values (new.id, event_val, auth.uid());
  end if;
  return new;
end;
$$;

drop trigger if exists on_submission_status_changed on public.submissions;
create trigger on_submission_status_changed
after insert or update on public.submissions
for each row execute function public.handle_submission_status_change();

-- ============================================================
-- 10. Creator Dynamic Action Center RPC
-- ============================================================
create or replace function public.get_creator_action_items()
returns table (
  type text,
  priority text,
  title text,
  description text,
  target_route text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  -- 1. Provider connection expired or pending verification
  return query
  select
    'provider_connection'::text,
    'Critical'::text,
    'Social account action required'::text,
    'Your ' || provider::text || ' account connection status is ' || status::text || ' or verification is pending.',
    '/creator/accounts'::text,
    updated_at
  from public.provider_connections
  where user_id = auth.uid()
    and (status = 'expired' or status = 'revoked' or verification_status = 'pending');

  -- 2. Submission under verification hold
  return query
  select
    'submission_verification'::text,
    'Important'::text,
    'Submission under verification hold'::text,
    'Your submission for campaign "' || c.name || '" is currently held for metric verification.',
    '/creator/submissions'::text,
    s.updated_at
  from public.submissions s
  join public.campaigns c on c.id = s.campaign_id
  where s.creator_id = auth.uid()
    and s.payout_status = 'verification_hold';

  -- 3. Withdrawal processing
  return query
  select
    'withdrawal_processing'::text,
    'Informational'::text,
    'Withdrawal request processing'::text,
    'Your withdrawal of ' || round((amount_cents::numeric / 100), 2)::text || ' USD is ' || status::text || '.',
    '/creator/wallet'::text,
    updated_at
  from public.withdrawals
  where user_id = auth.uid()
    and status in ('pending', 'processing');

  -- 4. Payout available
  return query
  select
    'payout_available'::text,
    'Informational'::text,
    'Earnings available for withdrawal'::text,
    'You have ' || round((available_balance_cents::numeric / 100), 2)::text || ' USD available to withdraw.',
    '/creator/wallet'::text,
    updated_at
  from public.wallets
  where user_id = auth.uid()
    and available_balance_cents >= 5000;
end;
$$;

grant execute on function public.get_creator_action_items() to authenticated;

-- ============================================================
-- 11. Daily Creator Analytics Engine
-- ============================================================
create or replace function public.get_creator_daily_analytics(
  platform_filter text default null,
  campaign_id_filter uuid default null,
  start_date timestamptz default null,
  end_date timestamptz default null
)
returns table (
  day date,
  raw_views bigint,
  verified_views bigint,
  eligible_views bigint,
  pending_earnings bigint,
  credited_earnings bigint,
  paid_earnings bigint,
  submission_count bigint,
  approved_submission_count bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Enforce authenticated user checks only
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  return query
  select
    s.submitted_at::date as day,
    coalesce(sum(s.total_views), 0) as raw_views,
    coalesce(sum(s.verified_views), 0) as verified_views,
    coalesce(sum(s.eligible_views), 0) as eligible_views,
    coalesce(sum(case when s.status in ('eligible', 'under_review') and s.payout_status = 'verification_hold' then s.earnings_cents else 0 end), 0) as pending_earnings,
    coalesce(sum(case when s.status in ('eligible', 'paid') and s.payout_status != 'verification_hold' then s.earnings_cents else 0 end), 0) as credited_earnings,
    coalesce(sum(case when s.status = 'paid' then s.earnings_cents else 0 end), 0) as paid_earnings,
    count(s.id)::bigint as submission_count,
    count(s.id) filter (where s.status in ('eligible', 'paid'))::bigint as approved_submission_count
  from public.submissions s
  where s.creator_id = auth.uid()
    and (platform_filter is null or platform_filter = 'all' or s.platform::text = platform_filter)
    and (campaign_id_filter is null or s.campaign_id = campaign_id_filter)
    and (start_date is null or s.submitted_at >= start_date)
    and (end_date is null or s.submitted_at <= end_date)
  group by s.submitted_at::date
  order by day asc;
end;
$$;

grant execute on function public.get_creator_daily_analytics(text, uuid, timestamptz, timestamptz) to authenticated;

-- ============================================================
-- 12. Prevent duplicate metric snapshots at database level
-- ============================================================
alter table public.submission_metric_snapshots drop constraint if exists sms_provider_response_hash_key;
alter table public.submission_metric_snapshots add constraint sms_provider_response_hash_key unique (provider_response_hash);

-- ============================================================
-- 13. Hardened brand_flag_submission RPC
-- ============================================================
create or replace function public.brand_flag_submission(
  target_submission_id uuid,
  flag_reason text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  sub_record public.submissions;
  assessment_id uuid;
  total_score int;
  final_level public.risk_level;
begin
  -- 1. Verify the brand owns the campaign
  select s.* into sub_record
  from public.submissions s
  join public.campaigns c on c.id = s.campaign_id
  join public.brands b on b.id = c.brand_id
  where s.id = target_submission_id and b.owner_id = auth.uid();

  if sub_record.id is null then raise exception 'Submission not found or not authorized'; end if;

  -- 2. Create a new fraud assessment
  insert into public.fraud_assessments (submission_id, creator_id, assessment_status, risk_level, risk_score)
  values (sub_record.id, sub_record.creator_id, 'under_review', 'low', 0)
  returning id into assessment_id;

  -- 3. Insert the brand flag signal (weak signal contribution of 15)
  insert into public.fraud_signals (assessment_id, signal_type, signal_code, severity, score_contribution, evidence_json)
  values (assessment_id, 'manual', 'brand_manual_flag', 'medium', 15, jsonb_build_object('reason', flag_reason));

  -- 4. Calculate total score and level from all signals linked to this assessment
  select coalesce(sum(score_contribution), 0) into total_score
  from public.fraud_signals
  where assessment_id = brand_flag_submission.assessment_id;

  if total_score > 100 then total_score := 100; end if;

  if total_score >= 80 then final_level := 'critical'::public.risk_level;
  elsif total_score >= 60 then final_level := 'high'::public.risk_level;
  elsif total_score >= 30 then final_level := 'medium'::public.risk_level;
  else final_level := 'low'::public.risk_level;
  end if;

  -- Update assessment with calculated score/level
  update public.fraud_assessments
  set risk_score = total_score,
      risk_level = final_level
  where id = assessment_id;

  -- Create review event
  insert into public.fraud_review_events (assessment_id, action, actor_id, reason)
  values (assessment_id, 'brand_flag', auth.uid(), flag_reason);

  -- Update submission status
  update public.submissions
  set status = 'under_review', payout_status = 'verification_hold'
  where id = target_submission_id;

  -- Audit log
  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), 'submission.brand_flag', 'submission', target_submission_id,
    jsonb_build_object('reason', flag_reason, 'risk_score', total_score));

  return assessment_id;
end;
$$;

grant execute on function public.brand_flag_submission(uuid, text) to authenticated;

-- ============================================================
-- 14. Hardened admin_review_fraud RPC
-- ============================================================
create or replace function public.admin_review_fraud(
  target_assessment_id uuid,
  review_action text, -- 'clear' | 'monitor' | 'confirm_abuse' | 'false_positive'
  review_reason text default null,
  review_notes text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  assessment_record public.fraud_assessments;
  submission_record public.submissions;
  wallet_record public.wallets;
  campaign_record public.campaigns;
  new_status public.assessment_status;
  earning_tx record;
  adjusted_cents bigint := 0;
begin
  -- 1. Verify Admin
  if not public.is_admin() then raise exception 'Admin role required'; end if;

  -- 2. Load and lock assessment & related entities
  select * into assessment_record from public.fraud_assessments where id = target_assessment_id for update;
  if assessment_record.id is null then raise exception 'Assessment not found'; end if;

  select * into submission_record from public.submissions where id = assessment_record.submission_id for update;
  select * into campaign_record from public.campaigns where id = submission_record.campaign_id for update;
  select * into wallet_record from public.wallets where user_id = submission_record.creator_id for update;

  -- Map action to status
  case review_action
    when 'clear' then new_status := 'clear';
    when 'monitor' then new_status := 'monitoring';
    when 'confirm_abuse' then new_status := 'confirmed_abuse';
    when 'false_positive' then new_status := 'false_positive';
    else raise exception 'Invalid review action: %', review_action;
  end case;

  -- 3. Update assessment status
  update public.fraud_assessments
  set assessment_status = new_status,
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      updated_at = now()
  where id = target_assessment_id;

  -- 4. Confirm Abuse Workflow
  if review_action = 'confirm_abuse' then
    -- Find existing credited earning transactions for this submission
    for earning_tx in
      select * from public.wallet_transactions
      where reference_type = 'submission'
        and reference_id = submission_record.id
        and transaction_type = 'earning'
        and direction = 'credit'
    loop
      -- Check if compensating transaction already exists
      if not exists (
        select 1 from public.wallet_transactions
        where idempotency_key = 'fraud_adj:' || earning_tx.id
      ) then
        -- Insert compensating debit transaction
        insert into public.wallet_transactions (
          wallet_id, user_id, transaction_type, amount_cents, direction,
          reference_type, reference_id, description, idempotency_key
        )
        values (
          earning_tx.wallet_id, earning_tx.user_id, 'fraud_adjustment', earning_tx.amount_cents, 'debit',
          'submission', submission_record.id, 'Fraud adjustment for submission: ' || coalesce(review_reason, 'abuse confirmed'),
          'fraud_adj:' || earning_tx.id
        );

        adjusted_cents := adjusted_cents + earning_tx.amount_cents;
      end if;
    end loop;

    -- Decrement wallet balances safely
    if adjusted_cents > 0 then
      update public.wallets
      set pending_balance_cents = greatest(0, pending_balance_cents - adjusted_cents),
          available_balance_cents = greatest(0, available_balance_cents - greatest(0, adjusted_cents - pending_balance_cents)),
          lifetime_earnings_cents = greatest(0, lifetime_earnings_cents - adjusted_cents),
          updated_at = now()
      where id = wallet_record.id;

      -- Decrement campaign used budget
      update public.campaigns
      set used_budget_cents = greatest(0, used_budget_cents - adjusted_cents),
          updated_at = now()
      where id = campaign_record.id;
    end if;

    -- Update submission status
    update public.submissions
    set payout_status = 'reversed',
        status = 'rejected',
        earnings_cents = 0,
        eligible_views = 0,
        rejection_reason = coalesce(review_reason, 'Abuse confirmed by administrator'),
        updated_at = now()
    where id = submission_record.id;

  -- 5. False Positive Workflow
  elsif review_action = 'false_positive' then
    -- Update submission to release hold
    update public.submissions
    set payout_status = 'eligible',
        updated_at = now()
    where id = submission_record.id and payout_status = 'verification_hold';

    -- Trigger standard earning calculation & wallet credit
    perform public.credit_submission_earnings(
      submission_record.id,
      submission_record.total_views,
      'false_positive_release:' || target_assessment_id
    );
  end if;

  -- 6. Log timeline event and audit log
  insert into public.fraud_review_events (assessment_id, action, actor_id, reason, notes)
  values (target_assessment_id, review_action, auth.uid(), review_reason, review_notes);

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), 'fraud.review', 'fraud_assessment', target_assessment_id,
    jsonb_build_object('action', review_action, 'reason', review_reason, 'previous_status', assessment_record.assessment_status));
end;
$$;

grant execute on function public.admin_review_fraud(uuid, text, text, text) to authenticated;

-- ============================================================
-- 15. Decouple auth delete cascade from profiles table fkey
-- ============================================================
alter table public.profiles drop constraint if exists profiles_id_fkey;

-- ============================================================
-- 16. Brand Workspace Team Members & Invitations Schema
-- ============================================================
create table if not exists public.brand_members (
  brand_id uuid not null references public.brands(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'member')),
  created_at timestamptz not null default now(),
  primary key (brand_id, user_id)
);

create table if not exists public.brand_invitations (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  email text not null,
  role text not null check (role in ('admin', 'member')),
  invited_by uuid references public.profiles(id) on delete set null,
  token text not null unique,
  accepted boolean not null default false,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days')
);

alter table public.brand_members enable row level security;
alter table public.brand_invitations enable row level security;

-- brand_members policies
create policy "brand_members_select" on public.brand_members
  for select using (
    user_id = auth.uid() or
    exists (
      select 1 from public.brands where id = brand_id and owner_id = auth.uid()
    ) or
    exists (
      select 1 from public.brand_members bm where bm.brand_id = brand_members.brand_id and bm.user_id = auth.uid()
    ) or
    public.is_admin()
  );

create policy "brand_members_write" on public.brand_members
  for all using (
    exists (
      select 1 from public.brands where id = brand_id and owner_id = auth.uid()
    ) or
    exists (
      select 1 from public.brand_members bm where bm.brand_id = brand_members.brand_id and bm.user_id = auth.uid() and bm.role = 'admin'
    ) or
    public.is_admin()
  );

-- brand_invitations policies
create policy "brand_invitations_select" on public.brand_invitations
  for select using (
    email = (select email from public.profiles where id = auth.uid()) or
    exists (
      select 1 from public.brands where id = brand_id and owner_id = auth.uid()
    ) or
    exists (
      select 1 from public.brand_members bm where bm.brand_id = brand_invitations.brand_id and bm.user_id = auth.uid() and bm.role = 'admin'
    ) or
    public.is_admin()
  );

create policy "brand_invitations_write" on public.brand_invitations
  for all using (
    exists (
      select 1 from public.brands where id = brand_id and owner_id = auth.uid()
    ) or
    exists (
      select 1 from public.brand_members bm where bm.brand_id = brand_invitations.brand_id and bm.user_id = auth.uid() and bm.role = 'admin'
    ) or
    public.is_admin()
  );

-- 17. Brand invitation acceptance RPC
create or replace function public.accept_brand_invitation(token_val text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  invitation record;
  profile_rec record;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;

  select * into invitation from public.brand_invitations where token = token_val and accepted = false for update;
  if invitation.id is null then raise exception 'Invalid or accepted invitation'; end if;

  if now() > invitation.expires_at then raise exception 'Invitation has expired'; end if;

  select * into profile_rec from public.profiles where id = auth.uid();
  if profile_rec.email is distinct from invitation.email then
    raise exception 'Invitation email mismatch';
  end if;

  -- Add to brand_members
  insert into public.brand_members (brand_id, user_id, role)
  values (invitation.brand_id, auth.uid(), invitation.role)
  on conflict (brand_id, user_id) do update set role = invitation.role;

  -- Mark accepted
  update public.brand_invitations
  set accepted = true
  where id = invitation.id;
end;
$$;

grant execute on function public.accept_brand_invitation(text) to authenticated;

-- ============================================================
-- 18. Secure System Health RPC Function
-- ============================================================
create or replace function public.get_system_health()
returns table (
  database_size_bytes bigint,
  sync_queue_size bigint,
  active_cron_jobs bigint,
  youtube_api_status text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Verify Admin
  if not public.is_admin() then raise exception 'Admin role required'; end if;

  return query
  select
    pg_database_size(current_database())::bigint,
    (select count(*) from public.submissions where status = 'processing')::bigint,
    (select count(*) from pg_catalog.pg_stat_activity where state = 'active')::bigint,
    'Operational'::text;
end;
$$;

grant execute on function public.get_system_health() to authenticated;

-- ============================================================
-- 19. Scoped Notifications Table
-- ============================================================
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  target_route text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;

create policy "notifications_select" on public.notifications
  for select using (user_id = auth.uid() or public.is_admin());

create policy "notifications_update" on public.notifications
  for update using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());

create policy "notifications_admin_write" on public.notifications
  for all using (public.is_admin()) with check (public.is_admin());
