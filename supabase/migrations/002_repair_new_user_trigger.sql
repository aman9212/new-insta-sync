-- Migration 002: Repair new-user trigger, backfill missing profiles, add INSERT RLS policy
-- Idempotent — safe to run multiple times

-- ============================================================
-- 1. Re-create handle_new_user() (CREATE OR REPLACE is idempotent)
-- ============================================================
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

-- ============================================================
-- 2. Re-attach trigger on auth.users (drop + create is idempotent)
-- ============================================================
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ============================================================
-- 3. Backfill missing profiles for existing auth.users
--    Default role = 'creator', onboarding_completed = false
--    Does NOT overwrite existing profiles
--    Does NOT grant admin role
-- ============================================================
insert into public.profiles (id, email, display_name, avatar_url, role, onboarding_completed, account_status)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name'),
  u.raw_user_meta_data->>'avatar_url',
  'creator'::public.user_role,
  false,
  'active'::public.account_status
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

-- ============================================================
-- 4. Backfill missing wallets for existing profiles
-- ============================================================
insert into public.wallets (user_id)
select p.id
from public.profiles p
left join public.wallets w on w.user_id = p.id
where w.id is null;

-- ============================================================
-- 5. Add INSERT policy on profiles for authenticated users
--    Required for the client-side upsert in completeOnboarding.
--    Users can only insert their own profile row (id = auth.uid()).
-- ============================================================
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'profiles own insert'
  ) then
    create policy "profiles own insert" on public.profiles
      for insert
      with check (id = auth.uid());
  end if;
end;
$$;
