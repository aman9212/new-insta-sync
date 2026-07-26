-- Migration 004: Fix Brand Campaign Creation and Bootstrap brand workspace
-- Idempotent, safe to run multiple times.

-- ============================================================
-- 1. Create public.bootstrap_brand_workspace()
-- ============================================================
create or replace function public.bootstrap_brand_workspace()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_brand_id uuid;
  user_email text;
  brand_name text;
  brand_slug text;
begin
  -- Verify caller is authenticated
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  -- Verify caller profile is brand
  if not exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'brand'
  ) then
    raise exception 'Only brand users can bootstrap a brand workspace';
  end if;

  -- Check for existing brand owned by this user
  select id into existing_brand_id
  from public.brands
  where owner_id = auth.uid()
  limit 1;

  if existing_brand_id is not null then
    return existing_brand_id;
  end if;

  -- Derive brand name from email or display name
  select coalesce(display_name, email, 'Brand Workspace') into brand_name
  from public.profiles
  where id = auth.uid();

  if brand_name like '%@%' then
    brand_name := split_part(brand_name, '@', 1) || ' Workspace';
  end if;

  brand_slug := lower(regexp_replace(brand_name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(auth.uid()::text, 1, 8);

  -- Insert brand row owned by auth.uid()
  insert into public.brands (owner_id, name, slug)
  values (auth.uid(), brand_name, brand_slug)
  returning id into existing_brand_id;

  return existing_brand_id;
end;
$$;

-- Revoke default public execution
revoke all on function public.bootstrap_brand_workspace() from public;
-- Grant execute only to authenticated users
grant execute on function public.bootstrap_brand_workspace() to authenticated;

-- ============================================================
-- 2. Backfill brand workspace rows for existing brand profiles
-- ============================================================
do $$
declare
  profile_rec record;
  brand_name text;
  brand_slug text;
begin
  for profile_rec in 
    select id, display_name, email 
    from public.profiles 
    where role = 'brand'
  loop
    if not exists (select 1 from public.brands where owner_id = profile_rec.id) then
      brand_name := coalesce(profile_rec.display_name, profile_rec.email, 'Brand Workspace');
      if brand_name like '%@%' then
        brand_name := split_part(brand_name, '@', 1) || ' Workspace';
      end if;
      brand_slug := lower(regexp_replace(brand_name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(profile_rec.id::text, 1, 8);
      
      insert into public.brands (owner_id, name, slug)
      values (profile_rec.id, brand_name, brand_slug)
      on conflict (slug) do nothing;
    end if;
  end loop;
end $$;

-- ============================================================
-- 3. Update public.create_brand_campaign() function to auto-bootstrap
-- ============================================================
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
  -- Fetch brand record
  select * into brand_record from public.brands where owner_id = auth.uid() order by created_at limit 1;
  
  -- If missing, bootstrap brand workspace inline
  if brand_record.id is null then
    perform public.bootstrap_brand_workspace();
    select * into brand_record from public.brands where owner_id = auth.uid() order by created_at limit 1;
  end if;

  if brand_record.id is null then 
    raise exception 'Brand workspace not found'; 
  end if;

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

-- ============================================================
-- 4. Enable Campaign deletion for drafts only
-- ============================================================
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'campaigns'
      and policyname = 'campaigns brand delete'
  ) then
    create policy "campaigns brand delete" on public.campaigns
      for delete
      using (
        exists (
          select 1 from public.brands b
          where b.id = brand_id
            and b.owner_id = auth.uid()
        )
        and status = 'draft'
      );
  end if;
end $$;

