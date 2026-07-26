-- Migration 003: Creator Intelligence — metrics, fraud, payout holds
-- Extends existing schema. Does NOT modify migrations 001 or 002.

-- ============================================================
-- 1. Extended Social Platform enum (add x, facebook)
-- ============================================================
do $$ begin
  alter type public.social_platform add value if not exists 'x';
  alter type public.social_platform add value if not exists 'facebook';
exception when others then null;
end $$;

-- ============================================================
-- 2. Submission status extensions
-- ============================================================
do $$ begin
  alter type public.submission_status add value if not exists 'flagged';
  alter type public.submission_status add value if not exists 'under_review';
exception when others then null;
end $$;

-- ============================================================
-- 3. Risk level enum
-- ============================================================
do $$ begin
  create type public.risk_level as enum ('low', 'medium', 'high', 'critical');
exception when duplicate_object then null;
end $$;

-- ============================================================
-- 4. Assessment status enum
-- ============================================================
do $$ begin
  create type public.assessment_status as enum ('clear', 'monitoring', 'under_review', 'confirmed_abuse', 'false_positive');
exception when duplicate_object then null;
end $$;

-- ============================================================
-- 5. Payout hold status enum
-- ============================================================
do $$ begin
  create type public.payout_hold_status as enum ('pending', 'verification_hold', 'eligible', 'credited', 'withdrawn', 'reversed');
exception when duplicate_object then null;
end $$;

-- ============================================================
-- 6. Extended transaction types
-- ============================================================
do $$ begin
  alter type public.transaction_type add value if not exists 'verification_hold';
  alter type public.transaction_type add value if not exists 'verification_release';
  alter type public.transaction_type add value if not exists 'fraud_adjustment';
  alter type public.transaction_type add value if not exists 'reversal';
exception when others then null;
end $$;

-- ============================================================
-- 7. Submission metric snapshots (extended, append-only)
-- ============================================================
create table if not exists public.submission_metric_snapshots (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  provider public.social_platform not null,
  provider_post_id text,
  captured_at timestamptz not null default now(),
  raw_views bigint not null default 0 check (raw_views >= 0),
  raw_likes bigint not null default 0 check (raw_likes >= 0),
  raw_comments bigint not null default 0 check (raw_comments >= 0),
  raw_shares bigint not null default 0 check (raw_shares >= 0),
  raw_saves bigint not null default 0 check (raw_saves >= 0),
  raw_followers bigint not null default 0 check (raw_followers >= 0),
  source text not null default 'provider_api',
  provider_response_hash text,
  created_at timestamptz not null default now()
);

create index if not exists sms_submission_idx on public.submission_metric_snapshots(submission_id, captured_at desc);
create index if not exists sms_provider_hash_idx on public.submission_metric_snapshots(provider_response_hash);

-- ============================================================
-- 8. Fraud assessments
-- ============================================================
create table if not exists public.fraud_assessments (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  creator_id uuid not null references public.profiles(id) on delete cascade,
  risk_score integer not null default 0 check (risk_score between 0 and 100),
  risk_level public.risk_level not null default 'low',
  assessment_version integer not null default 1,
  assessment_status public.assessment_status not null default 'clear',
  assessed_at timestamptz not null default now(),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists fa_submission_idx on public.fraud_assessments(submission_id);
create index if not exists fa_creator_idx on public.fraud_assessments(creator_id);
create index if not exists fa_status_idx on public.fraud_assessments(assessment_status);
create index if not exists fa_risk_level_idx on public.fraud_assessments(risk_level);

-- ============================================================
-- 9. Fraud signals
-- ============================================================
create table if not exists public.fraud_signals (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.fraud_assessments(id) on delete cascade,
  signal_type text not null,
  signal_code text not null,
  severity public.risk_level not null default 'low',
  score_contribution integer not null default 0 check (score_contribution between 0 and 100),
  evidence_json jsonb not null default '{}',
  detected_at timestamptz not null default now()
);

create index if not exists fs_assessment_idx on public.fraud_signals(assessment_id);

-- ============================================================
-- 10. Fraud review events (immutable timeline)
-- ============================================================
create table if not exists public.fraud_review_events (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.fraud_assessments(id) on delete cascade,
  action text not null,
  actor_id uuid references public.profiles(id) on delete set null,
  reason text,
  notes text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists fre_assessment_idx on public.fraud_review_events(assessment_id, created_at);

-- ============================================================
-- 11. Extend provider_connections (safe additions)
-- ============================================================
do $$ begin
  alter table public.provider_connections add column if not exists display_name text;
  alter table public.provider_connections add column if not exists avatar_url text;
  alter table public.provider_connections add column if not exists verification_status public.verification_status not null default 'pending';
  alter table public.provider_connections add column if not exists token_expires_at timestamptz;
  alter table public.provider_connections add column if not exists last_sync_at timestamptz;
end $$;

-- ============================================================
-- 12. Add payout_hold_status to submissions
-- ============================================================
do $$ begin
  alter table public.submissions add column if not exists payout_status public.payout_hold_status not null default 'pending';
  alter table public.submissions add column if not exists verified_views bigint not null default 0 check (verified_views >= 0);
exception when others then null;
end $$;

-- ============================================================
-- 13. Updated_at triggers for new tables
-- ============================================================
do $$ begin
  create trigger fraud_assessments_updated_at before update on public.fraud_assessments for each row execute function public.set_updated_at();
exception when duplicate_object then null;
end $$;

-- ============================================================
-- 14. RLS on new tables
-- ============================================================
alter table public.submission_metric_snapshots enable row level security;
alter table public.fraud_assessments enable row level security;
alter table public.fraud_signals enable row level security;
alter table public.fraud_review_events enable row level security;

-- Metric snapshots: only admin and brand (for their campaign submissions) can read
-- Creators see aggregated data through views, not raw snapshots
do $$ begin
  create policy "metric_snapshots_admin" on public.submission_metric_snapshots
    for all using (public.is_admin()) with check (public.is_admin());

  create policy "metric_snapshots_brand_read" on public.submission_metric_snapshots
    for select using (
      exists (
        select 1 from public.submissions s
        join public.campaigns c on c.id = s.campaign_id
        join public.brands b on b.id = c.brand_id
        where s.id = submission_id and b.owner_id = auth.uid()
      )
    );

  create policy "metric_snapshots_creator_read" on public.submission_metric_snapshots
    for select using (
      exists (
        select 1 from public.submissions s
        where s.id = submission_id and s.creator_id = auth.uid()
      )
    );
exception when duplicate_object then null;
end $$;

-- Fraud assessments: admin full access, brand limited read for their submissions
do $$ begin
  create policy "fraud_assessments_admin" on public.fraud_assessments
    for all using (public.is_admin()) with check (public.is_admin());

  create policy "fraud_assessments_brand_read" on public.fraud_assessments
    for select using (
      exists (
        select 1 from public.submissions s
        join public.campaigns c on c.id = s.campaign_id
        join public.brands b on b.id = c.brand_id
        where s.id = submission_id and b.owner_id = auth.uid()
      )
    );
exception when duplicate_object then null;
end $$;

-- Fraud signals: admin only
do $$ begin
  create policy "fraud_signals_admin" on public.fraud_signals
    for all using (public.is_admin()) with check (public.is_admin());

  create policy "fraud_signals_brand_read" on public.fraud_signals
    for select using (
      exists (
        select 1 from public.fraud_assessments fa
        join public.submissions s on s.id = fa.submission_id
        join public.campaigns c on c.id = s.campaign_id
        join public.brands b on b.id = c.brand_id
        where fa.id = assessment_id and b.owner_id = auth.uid()
      )
    );
exception when duplicate_object then null;
end $$;

-- Fraud review events: admin only
do $$ begin
  create policy "fraud_review_events_admin" on public.fraud_review_events
    for all using (public.is_admin()) with check (public.is_admin());
exception when duplicate_object then null;
end $$;

-- ============================================================
-- 15. Fraud scoring config in system_settings
-- ============================================================
insert into public.system_settings (key, value) values
  ('fraud_risk_thresholds', '{"low": [0, 29], "medium": [30, 59], "high": [60, 79], "critical": [80, 100]}'),
  ('fraud_signal_weights', '{"view_velocity_anomaly": 25, "engagement_mismatch": 20, "follower_view_anomaly": 15, "repeated_identical_growth": 20, "metric_reversal": 15, "snapshot_timing_anomaly": 10, "duplicate_content": 30, "cross_submission_pattern": 15, "payout_threshold_gaming": 20}')
on conflict (key) do nothing;

-- ============================================================
-- 16. Admin fraud review functions
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
  new_status public.assessment_status;
begin
  if not public.is_admin() then raise exception 'Admin role required'; end if;

  select * into assessment_record from public.fraud_assessments where id = target_assessment_id;
  if assessment_record.id is null then raise exception 'Assessment not found'; end if;

  case review_action
    when 'clear' then new_status := 'clear';
    when 'monitor' then new_status := 'monitoring';
    when 'confirm_abuse' then new_status := 'confirmed_abuse';
    when 'false_positive' then new_status := 'false_positive';
    else raise exception 'Invalid review action: %', review_action;
  end case;

  update public.fraud_assessments
  set assessment_status = new_status,
      reviewed_by = auth.uid(),
      reviewed_at = now()
  where id = target_assessment_id;

  insert into public.fraud_review_events (assessment_id, action, actor_id, reason, notes)
  values (target_assessment_id, review_action, auth.uid(), review_reason, review_notes);

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), 'fraud.review', 'fraud_assessment', target_assessment_id,
    jsonb_build_object('action', review_action, 'reason', review_reason, 'previous_status', assessment_record.assessment_status));

  -- If confirmed abuse: set submission payout_status to 'reversed'
  if review_action = 'confirm_abuse' then
    update public.submissions
    set payout_status = 'reversed', status = 'rejected'
    where id = assessment_record.submission_id;
  end if;

  -- If false positive: release hold
  if review_action = 'false_positive' then
    update public.submissions
    set payout_status = 'eligible'
    where id = assessment_record.submission_id and payout_status = 'verification_hold';
  end if;
end;
$$;

-- ============================================================
-- 17. Brand flag submission function
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
begin
  -- Verify the brand owns the campaign
  select s.* into sub_record
  from public.submissions s
  join public.campaigns c on c.id = s.campaign_id
  join public.brands b on b.id = c.brand_id
  where s.id = target_submission_id and b.owner_id = auth.uid();

  if sub_record.id is null then raise exception 'Submission not found or not authorized'; end if;

  -- Create or update fraud assessment
  insert into public.fraud_assessments (submission_id, creator_id, assessment_status, risk_level, risk_score)
  values (sub_record.id, sub_record.creator_id, 'under_review', 'medium', 50)
  returning id into assessment_id;

  -- Create review event
  insert into public.fraud_review_events (assessment_id, action, actor_id, reason)
  values (assessment_id, 'brand_flag', auth.uid(), flag_reason);

  -- Update submission status
  update public.submissions
  set status = 'under_review', payout_status = 'verification_hold'
  where id = target_submission_id;

  -- Audit
  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), 'submission.brand_flag', 'submission', target_submission_id,
    jsonb_build_object('reason', flag_reason));

  return assessment_id;
end;
$$;

-- ============================================================
-- 18. Creator analytics view (aggregated, safe)
-- ============================================================
create or replace view public.creator_analytics_summary
with (security_invoker = true) as
select
  s.creator_id,
  s.platform,
  s.campaign_id,
  c.name as campaign_name,
  count(s.id) as total_submissions,
  count(s.id) filter (where s.status in ('eligible', 'paid')) as approved_submissions,
  coalesce(sum(s.total_views), 0) as total_raw_views,
  coalesce(sum(s.verified_views), 0) as total_verified_views,
  coalesce(sum(s.eligible_views), 0) as total_eligible_views,
  coalesce(sum(s.earnings_cents), 0) as total_earnings_cents,
  coalesce(sum(s.earnings_cents) filter (where s.status = 'paid'), 0) as paid_earnings_cents,
  min(s.submitted_at) as first_submission_at,
  max(s.submitted_at) as last_submission_at
from public.submissions s
join public.campaigns c on c.id = s.campaign_id
where s.creator_id = auth.uid()
group by s.creator_id, s.platform, s.campaign_id, c.name;
