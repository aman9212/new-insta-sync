create extension if not exists "pgcrypto";

create type public.user_role as enum ('creator', 'brand', 'admin');
create type public.account_status as enum ('active', 'suspended', 'banned');
create type public.verification_status as enum ('pending', 'verified', 'rejected');
create type public.campaign_type as enum ('logo', 'music', 'clipping', 'ugc');
create type public.campaign_status as enum ('draft', 'pending_review', 'active', 'paused', 'completed', 'rejected', 'cancelled');
create type public.social_platform as enum ('instagram', 'tiktok', 'youtube');
create type public.submission_status as enum ('processing', 'eligible', 'ineligible', 'rejected', 'paid');
create type public.transaction_type as enum ('earning', 'adjustment', 'withdrawal', 'refund', 'referral');
create type public.transaction_direction as enum ('credit', 'debit');
create type public.withdrawal_status as enum ('pending', 'approved', 'processing', 'paid', 'rejected', 'failed');
create type public.provider_connection_status as enum ('active', 'expired', 'revoked');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null default 'creator',
  display_name text,
  username text unique,
  avatar_url text,
  email text unique,
  onboarding_completed boolean not null default false,
  account_status public.account_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_length check (username is null or length(username) between 3 and 32)
);

create table public.brands (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (length(name) between 2 and 120),
  slug text not null unique,
  logo_url text,
  website_url text,
  description text,
  verification_status public.verification_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  name text not null check (length(name) between 3 and 160),
  slug text not null unique,
  campaign_type public.campaign_type not null,
  status public.campaign_status not null default 'draft',
  description text,
  requirements text[] not null default '{}',
  cover_url text,
  total_budget_cents bigint not null check (total_budget_cents >= 0),
  used_budget_cents bigint not null default 0 check (used_budget_cents >= 0),
  rate_per_million_cents bigint not null check (rate_per_million_cents >= 0),
  cap_per_post_cents bigint check (cap_per_post_cents is null or cap_per_post_cents >= 0),
  cap_per_creator_cents bigint check (cap_per_creator_cents is null or cap_per_creator_cents >= 0),
  minimum_duration_seconds integer check (minimum_duration_seconds is null or minimum_duration_seconds >= 0),
  start_at timestamptz,
  end_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint campaigns_budget_guard check (used_budget_cents <= total_budget_cents)
);

create table public.campaign_platforms (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  platform public.social_platform not null,
  created_at timestamptz not null default now(),
  unique (campaign_id, platform)
);

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  creator_id uuid not null references public.profiles(id) on delete cascade,
  platform public.social_platform not null,
  post_url text not null check (length(post_url) <= 600),
  normalized_post_url text not null,
  external_post_id text,
  status public.submission_status not null default 'processing',
  total_views bigint not null default 0 check (total_views >= 0),
  eligible_views bigint not null default 0 check (eligible_views >= 0),
  earnings_cents bigint not null default 0 check (earnings_cents >= 0),
  rejection_reason text,
  ineligible_reason text,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  last_synced_at timestamptz,
  next_sync_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (campaign_id, creator_id, normalized_post_url)
);

create table public.wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  available_balance_cents bigint not null default 0 check (available_balance_cents >= 0),
  pending_balance_cents bigint not null default 0 check (pending_balance_cents >= 0),
  lifetime_earnings_cents bigint not null default 0 check (lifetime_earnings_cents >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references public.wallets(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  transaction_type public.transaction_type not null,
  amount_cents bigint not null check (amount_cents > 0),
  direction public.transaction_direction not null,
  reference_type text,
  reference_id uuid,
  description text,
  idempotency_key text not null unique,
  created_at timestamptz not null default now()
);

create table public.withdrawals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount_cents bigint not null check (amount_cents > 0),
  status public.withdrawal_status not null default 'pending',
  payout_provider text,
  payout_reference text,
  rejection_reason text,
  requested_at timestamptz not null default now(),
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references public.profiles(id) on delete cascade,
  referred_id uuid not null unique references public.profiles(id) on delete cascade,
  commission_bps integer not null default 1000 check (commission_bps between 0 and 10000),
  total_commission_cents bigint not null default 0 check (total_commission_cents >= 0),
  created_at timestamptz not null default now()
);

create table public.view_snapshots (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  provider public.social_platform not null,
  total_views bigint not null check (total_views >= 0),
  captured_at timestamptz not null default now()
);

create table public.provider_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  provider public.social_platform not null,
  provider_account_id text,
  provider_username text,
  encrypted_token_reference text,
  status public.provider_connection_status not null default 'active',
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider, provider_account_id)
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table public.system_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

insert into public.system_settings (key, value) values
  ('minimum_withdrawal_cents', '5000'),
  ('referral_commission_bps', '1000'),
  ('default_view_sync_interval_hours', '24'),
  ('campaign_review_required', 'true')
on conflict (key) do nothing;

create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger brands_updated_at before update on public.brands for each row execute function public.set_updated_at();
create trigger campaigns_updated_at before update on public.campaigns for each row execute function public.set_updated_at();
create trigger submissions_updated_at before update on public.submissions for each row execute function public.set_updated_at();
create trigger wallets_updated_at before update on public.wallets for each row execute function public.set_updated_at();
create trigger withdrawals_updated_at before update on public.withdrawals for each row execute function public.set_updated_at();
create trigger provider_connections_updated_at before update on public.provider_connections for each row execute function public.set_updated_at();

create index brands_owner_idx on public.brands(owner_id);
create index campaigns_brand_idx on public.campaigns(brand_id);
create index campaigns_status_idx on public.campaigns(status);
create index campaigns_type_idx on public.campaigns(campaign_type);
create index campaign_platforms_platform_idx on public.campaign_platforms(platform);
create index submissions_creator_idx on public.submissions(creator_id);
create index submissions_campaign_idx on public.submissions(campaign_id);
create index submissions_status_idx on public.submissions(status);
create index wallet_transactions_user_idx on public.wallet_transactions(user_id, created_at desc);
create index withdrawals_user_idx on public.withdrawals(user_id, requested_at desc);
create index audit_logs_entity_idx on public.audit_logs(entity_type, entity_id);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and account_status = 'active'
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;

  insert into public.wallets (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace view public.campaign_marketplace
with (security_invoker = true) as
select
  c.*,
  b.name as brand_name,
  b.logo_url as brand_logo_url,
  coalesce(array_agg(cp.platform) filter (where cp.platform is not null), '{}') as platforms,
  case when c.total_budget_cents = 0 then 0 else round((c.used_budget_cents::numeric / c.total_budget_cents::numeric) * 100)::integer end as budget_used_percent
from public.campaigns c
join public.brands b on b.id = c.brand_id
left join public.campaign_platforms cp on cp.campaign_id = c.id
where c.status = 'active'
group by c.id, b.name, b.logo_url;

create or replace view public.brand_campaigns
with (security_invoker = true) as
select
  c.*,
  b.name as brand_name,
  b.logo_url as brand_logo_url,
  coalesce(array_agg(cp.platform) filter (where cp.platform is not null), '{}') as platforms
from public.campaigns c
join public.brands b on b.id = c.brand_id
left join public.campaign_platforms cp on cp.campaign_id = c.id
group by c.id, b.name, b.logo_url;

create or replace view public.creator_submissions
with (security_invoker = true) as
select s.*, c.name as campaign_name, c.campaign_type, b.name as brand_name
from public.submissions s
join public.campaigns c on c.id = s.campaign_id
join public.brands b on b.id = c.brand_id;

create or replace view public.brand_submissions
with (security_invoker = true) as
select s.*, c.name as campaign_name, c.campaign_type, b.name as brand_name, p.display_name as creator_name
from public.submissions s
join public.campaigns c on c.id = s.campaign_id
join public.brands b on b.id = c.brand_id
join public.profiles p on p.id = s.creator_id;

create or replace function public.create_brand_campaign(
  name text,
  campaign_type public.campaign_type,
  description text,
  total_budget_cents bigint,
  rate_per_million_cents bigint,
  cap_per_post_cents bigint,
  cap_per_creator_cents bigint,
  minimum_duration_seconds integer,
  requirements text[],
  platforms public.social_platform[]
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  brand_record public.brands;
  new_campaign_id uuid;
  platform_value public.social_platform;
begin
  select * into brand_record from public.brands where owner_id = auth.uid() order by created_at limit 1;
  if brand_record.id is null then raise exception 'Brand workspace not found'; end if;

  insert into public.campaigns (
    brand_id, name, slug, campaign_type, status, description, total_budget_cents,
    rate_per_million_cents, cap_per_post_cents, cap_per_creator_cents,
    minimum_duration_seconds, requirements
  )
  values (
    brand_record.id, name, lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(gen_random_uuid()::text, 1, 8),
    campaign_type, 'draft', description, total_budget_cents, rate_per_million_cents,
    nullif(cap_per_post_cents, 0), nullif(cap_per_creator_cents, 0),
    nullif(minimum_duration_seconds, 0), requirements
  )
  returning id into new_campaign_id;

  foreach platform_value in array platforms loop
    insert into public.campaign_platforms (campaign_id, platform) values (new_campaign_id, platform_value);
  end loop;

  return new_campaign_id;
end;
$$;

create or replace function public.request_withdrawal(request_amount_cents bigint, request_idempotency_key text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  wallet_record public.wallets;
  minimum_cents bigint;
  withdrawal_id uuid;
begin
  select (value #>> '{}')::bigint into minimum_cents from public.system_settings where key = 'minimum_withdrawal_cents';
  select * into wallet_record from public.wallets where user_id = auth.uid() for update;

  if wallet_record.id is null then raise exception 'Wallet not found'; end if;
  if request_amount_cents < coalesce(minimum_cents, 5000) then raise exception 'Amount below minimum withdrawal'; end if;
  if wallet_record.available_balance_cents < request_amount_cents then raise exception 'Insufficient available balance'; end if;

  update public.wallets
  set available_balance_cents = available_balance_cents - request_amount_cents
  where id = wallet_record.id;

  insert into public.withdrawals (user_id, amount_cents, status, payout_provider)
  values (auth.uid(), request_amount_cents, 'pending', 'manual')
  returning id into withdrawal_id;

  insert into public.wallet_transactions (wallet_id, user_id, transaction_type, amount_cents, direction, reference_type, reference_id, description, idempotency_key)
  values (wallet_record.id, auth.uid(), 'withdrawal', request_amount_cents, 'debit', 'withdrawal', withdrawal_id, 'Withdrawal request reserve', request_idempotency_key);

  return withdrawal_id;
end;
$$;

create or replace function public.credit_submission_earnings(target_submission_id uuid, new_total_views bigint, idempotency_key text)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  submission_record public.submissions;
  campaign_record public.campaigns;
  wallet_record public.wallets;
  gross_cents bigint;
  capped_cents bigint;
  delta_cents bigint;
begin
  select * into submission_record from public.submissions where id = target_submission_id for update;
  select * into campaign_record from public.campaigns where id = submission_record.campaign_id for update;
  select * into wallet_record from public.wallets where user_id = submission_record.creator_id for update;

  gross_cents := greatest(0, floor((new_total_views * campaign_record.rate_per_million_cents)::numeric / 1000000)::bigint);
  capped_cents := gross_cents;
  if campaign_record.cap_per_post_cents is not null then capped_cents := least(capped_cents, campaign_record.cap_per_post_cents); end if;
  capped_cents := least(capped_cents, campaign_record.total_budget_cents - campaign_record.used_budget_cents + submission_record.earnings_cents);
  delta_cents := greatest(0, capped_cents - submission_record.earnings_cents);

  update public.submissions
  set total_views = new_total_views,
      eligible_views = new_total_views,
      earnings_cents = capped_cents,
      status = 'eligible',
      last_synced_at = now(),
      next_sync_at = now() + interval '24 hours'
  where id = target_submission_id;

  if delta_cents > 0 then
    update public.wallets
    set pending_balance_cents = pending_balance_cents + delta_cents,
        lifetime_earnings_cents = lifetime_earnings_cents + delta_cents
    where id = wallet_record.id;

    update public.campaigns
    set used_budget_cents = used_budget_cents + delta_cents
    where id = campaign_record.id;

    insert into public.wallet_transactions (wallet_id, user_id, transaction_type, amount_cents, direction, reference_type, reference_id, description, idempotency_key)
    values (wallet_record.id, submission_record.creator_id, 'earning', delta_cents, 'credit', 'submission', target_submission_id, 'Submission earnings sync', idempotency_key)
    on conflict (idempotency_key) do nothing;
  end if;

  return delta_cents;
end;
$$;

create or replace function public.admin_moderate_campaign(target_campaign_id uuid, next_status public.campaign_status, moderation_reason text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'Admin role required'; end if;
  update public.campaigns set status = next_status where id = target_campaign_id;
  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), 'campaign.moderate', 'campaign', target_campaign_id, jsonb_build_object('status', next_status, 'reason', moderation_reason));
end;
$$;

create or replace function public.admin_moderate_submission(target_submission_id uuid, next_status public.submission_status, moderation_reason text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'Admin role required'; end if;
  update public.submissions
  set status = next_status,
      rejection_reason = case when next_status = 'rejected' then moderation_reason else rejection_reason end,
      ineligible_reason = case when next_status = 'ineligible' then moderation_reason else ineligible_reason end,
      reviewed_at = now()
  where id = target_submission_id;
  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), 'submission.moderate', 'submission', target_submission_id, jsonb_build_object('status', next_status, 'reason', moderation_reason));
end;
$$;

alter table public.profiles enable row level security;
alter table public.brands enable row level security;
alter table public.campaigns enable row level security;
alter table public.campaign_platforms enable row level security;
alter table public.submissions enable row level security;
alter table public.wallets enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.withdrawals enable row level security;
alter table public.referrals enable row level security;
alter table public.view_snapshots enable row level security;
alter table public.provider_connections enable row level security;
alter table public.audit_logs enable row level security;
alter table public.system_settings enable row level security;

create policy "profiles own read" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "profiles own safe update" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid() and (role = (select role from public.profiles where id = auth.uid()) or (select onboarding_completed from public.profiles where id = auth.uid()) = false));
create policy "admin profiles" on public.profiles for all using (public.is_admin()) with check (public.is_admin());

create policy "brands owner read" on public.brands for select using (owner_id = auth.uid() or public.is_admin());
create policy "brands owner insert" on public.brands for insert with check (owner_id = auth.uid());
create policy "brands owner update" on public.brands for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "admin brands" on public.brands for all using (public.is_admin()) with check (public.is_admin());

create policy "campaigns active read" on public.campaigns for select using (status = 'active' or public.is_admin() or exists (select 1 from public.brands b where b.id = brand_id and b.owner_id = auth.uid()));
create policy "campaigns brand insert" on public.campaigns for insert with check (exists (select 1 from public.brands b where b.id = brand_id and b.owner_id = auth.uid()));
create policy "campaigns brand update" on public.campaigns for update using (exists (select 1 from public.brands b where b.id = brand_id and b.owner_id = auth.uid())) with check (exists (select 1 from public.brands b where b.id = brand_id and b.owner_id = auth.uid()));
create policy "admin campaigns" on public.campaigns for all using (public.is_admin()) with check (public.is_admin());

create policy "campaign platforms readable" on public.campaign_platforms for select using (exists (select 1 from public.campaigns c where c.id = campaign_id));
create policy "campaign platforms brand manage" on public.campaign_platforms for all using (exists (select 1 from public.campaigns c join public.brands b on b.id = c.brand_id where c.id = campaign_id and b.owner_id = auth.uid()) or public.is_admin()) with check (exists (select 1 from public.campaigns c join public.brands b on b.id = c.brand_id where c.id = campaign_id and b.owner_id = auth.uid()) or public.is_admin());

create policy "submissions creator insert" on public.submissions for insert with check (creator_id = auth.uid());
create policy "submissions scoped read" on public.submissions for select using (creator_id = auth.uid() or public.is_admin() or exists (select 1 from public.campaigns c join public.brands b on b.id = c.brand_id where c.id = campaign_id and b.owner_id = auth.uid()));
create policy "admin submissions" on public.submissions for all using (public.is_admin()) with check (public.is_admin());

create policy "wallet own read" on public.wallets for select using (user_id = auth.uid() or public.is_admin());
create policy "admin wallets" on public.wallets for all using (public.is_admin()) with check (public.is_admin());
create policy "wallet tx own read" on public.wallet_transactions for select using (user_id = auth.uid() or public.is_admin());
create policy "admin wallet tx" on public.wallet_transactions for all using (public.is_admin()) with check (public.is_admin());

create policy "withdrawals own read" on public.withdrawals for select using (user_id = auth.uid() or public.is_admin());
create policy "admin withdrawals" on public.withdrawals for all using (public.is_admin()) with check (public.is_admin());

create policy "referrals own read" on public.referrals for select using (referrer_id = auth.uid() or referred_id = auth.uid() or public.is_admin());
create policy "view snapshots scoped read" on public.view_snapshots for select using (public.is_admin() or exists (select 1 from public.submissions s where s.id = submission_id and s.creator_id = auth.uid()));
create policy "provider connections own read" on public.provider_connections for select using (user_id = auth.uid() or public.is_admin());
create policy "provider connections own insert" on public.provider_connections for insert with check (user_id = auth.uid());
create policy "provider connections own update" on public.provider_connections for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "audit logs admin read" on public.audit_logs for select using (public.is_admin());
create policy "system settings admin read" on public.system_settings for select using (public.is_admin());
create policy "system settings admin write" on public.system_settings for all using (public.is_admin()) with check (public.is_admin());
