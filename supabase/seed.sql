insert into public.system_settings (key, value) values
  ('minimum_withdrawal_cents', '5000'),
  ('referral_commission_bps', '1000'),
  ('default_view_sync_interval_hours', '24'),
  ('campaign_review_required', 'true')
on conflict (key) do update set value = excluded.value;

-- Auth users must be created through Supabase Auth locally, then profile ids can be
-- matched to those auth.users ids. See docs/LOCAL_SETUP.md for the safe procedure.
