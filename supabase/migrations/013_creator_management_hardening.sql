-- Creator management hardening: authoritative admin workflows, auditability, and RLS.

CREATE OR REPLACE FUNCTION public.creator_profile_from_account_status(p_status account_status)
RETURNS creator_account_status
LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE p_status
    WHEN 'suspended' THEN 'suspended'::creator_account_status
    WHEN 'banned' THEN 'banned'::creator_account_status
    ELSE 'pending'::creator_account_status
  END;
$$;

INSERT INTO public.creator_profiles (id, display_name, username, email, status)
SELECT p.id, p.display_name, p.username, p.email, creator_profile_from_account_status(p.account_status)
FROM public.profiles p
WHERE p.role = 'creator'
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.creator_wallets (creator_id, available_balance_cents, pending_balance_cents, lifetime_earnings_cents)
SELECT w.user_id, w.available_balance_cents, w.pending_balance_cents, w.lifetime_earnings_cents
FROM public.wallets w JOIN public.profiles p ON p.id = w.user_id
WHERE p.role = 'creator'
ON CONFLICT (creator_id) DO NOTHING;

INSERT INTO public.creator_levels (creator_id)
SELECT p.id FROM public.profiles p WHERE p.role = 'creator'
ON CONFLICT (creator_id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.initialize_creator_management_profile()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.role = 'creator' THEN
    INSERT INTO creator_profiles (id, display_name, username, email, status)
    VALUES (NEW.id, NEW.display_name, NEW.username, NEW.email, creator_profile_from_account_status(NEW.account_status))
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO creator_wallets (creator_id) VALUES (NEW.id) ON CONFLICT (creator_id) DO NOTHING;
    INSERT INTO creator_levels (creator_id) VALUES (NEW.id) ON CONFLICT (creator_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_creator_management_initialized ON public.profiles;
CREATE TRIGGER profiles_creator_management_initialized
AFTER INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.initialize_creator_management_profile();

CREATE OR REPLACE FUNCTION public.creator_management_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
DROP TRIGGER IF EXISTS creator_profiles_updated_at ON public.creator_profiles;
CREATE TRIGGER creator_profiles_updated_at BEFORE UPDATE ON public.creator_profiles FOR EACH ROW EXECUTE FUNCTION public.creator_management_updated_at();
DROP TRIGGER IF EXISTS creator_wallets_updated_at ON public.creator_wallets;
CREATE TRIGGER creator_wallets_updated_at BEFORE UPDATE ON public.creator_wallets FOR EACH ROW EXECUTE FUNCTION public.creator_management_updated_at();

CREATE INDEX IF NOT EXISTS creator_profiles_status_created_idx ON public.creator_profiles(status, created_at DESC);
CREATE INDEX IF NOT EXISTS creator_profiles_kyc_status_idx ON public.creator_profiles(kyc_status);
CREATE INDEX IF NOT EXISTS creator_social_accounts_creator_idx ON public.creator_social_accounts(creator_id, platform_id);
CREATE INDEX IF NOT EXISTS creator_history_creator_created_idx ON public.creator_history(creator_id, created_at DESC);
CREATE INDEX IF NOT EXISTS creator_analytics_creator_date_idx ON public.creator_analytics(creator_id, date DESC);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('creator-kyc', 'creator-kyc', false, 10485760, ARRAY['image/jpeg','image/png','application/pdf'])
ON CONFLICT (id) DO UPDATE SET public = false, file_size_limit = EXCLUDED.file_size_limit, allowed_mime_types = EXCLUDED.allowed_mime_types;
DROP POLICY IF EXISTS creator_kyc_owner_read ON storage.objects;
DROP POLICY IF EXISTS creator_kyc_owner_upload ON storage.objects;
DROP POLICY IF EXISTS creator_kyc_owner_update ON storage.objects;
DROP POLICY IF EXISTS creator_kyc_admin_manage ON storage.objects;
CREATE POLICY creator_kyc_owner_read ON storage.objects FOR SELECT USING (bucket_id = 'creator-kyc' AND (owner_id = auth.uid()::text OR public.is_admin()));
CREATE POLICY creator_kyc_owner_upload ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'creator-kyc' AND owner_id = auth.uid()::text AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY creator_kyc_owner_update ON storage.objects FOR UPDATE USING (bucket_id = 'creator-kyc' AND owner_id = auth.uid()::text) WITH CHECK (bucket_id = 'creator-kyc' AND owner_id = auth.uid()::text);
CREATE POLICY creator_kyc_admin_manage ON storage.objects FOR ALL USING (bucket_id = 'creator-kyc' AND public.is_admin()) WITH CHECK (bucket_id = 'creator-kyc' AND public.is_admin());

-- RLS policies are recreated so writes require explicit checks as well as admin membership.
DO $$ DECLARE item record; BEGIN
  FOR item IN SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public' AND tablename IN
    ('creator_settings','creator_profiles','creator_levels','creator_badges','creator_social_accounts','creator_wallets','creator_kyc','creator_notes','creator_flags','creator_referrals','creator_permissions','creator_analytics','creator_history','creator_reports')
  LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', item.policyname, item.tablename); END LOOP;
END $$;

CREATE POLICY creator_profiles_read ON public.creator_profiles FOR SELECT USING (id = auth.uid() OR is_admin());
CREATE POLICY creator_profiles_admin_write ON public.creator_profiles FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY creator_levels_read ON public.creator_levels FOR SELECT USING (creator_id = auth.uid() OR is_admin());
CREATE POLICY creator_levels_admin_write ON public.creator_levels FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY creator_badges_read ON public.creator_badges FOR SELECT USING (creator_id = auth.uid() OR is_admin());
CREATE POLICY creator_badges_admin_write ON public.creator_badges FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY creator_social_read ON public.creator_social_accounts FOR SELECT USING (creator_id = auth.uid() OR is_admin());
CREATE POLICY creator_social_admin_write ON public.creator_social_accounts FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY creator_wallets_read ON public.creator_wallets FOR SELECT USING (creator_id = auth.uid() OR is_admin());
CREATE POLICY creator_wallets_admin_write ON public.creator_wallets FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY creator_kyc_read ON public.creator_kyc FOR SELECT USING (creator_id = auth.uid() OR is_admin());
CREATE POLICY creator_kyc_admin_write ON public.creator_kyc FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY creator_notes_admin_only ON public.creator_notes FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY creator_flags_admin_only ON public.creator_flags FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY creator_referrals_read ON public.creator_referrals FOR SELECT USING (referrer_id = auth.uid() OR referred_id = auth.uid() OR is_admin());
CREATE POLICY creator_referrals_admin_write ON public.creator_referrals FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY creator_permissions_admin_only ON public.creator_permissions FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY creator_analytics_read ON public.creator_analytics FOR SELECT USING (creator_id = auth.uid() OR is_admin());
CREATE POLICY creator_analytics_admin_write ON public.creator_analytics FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY creator_history_admin_only ON public.creator_history FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY creator_reports_admin_only ON public.creator_reports FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY creator_settings_admin_only ON public.creator_settings FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE OR REPLACE FUNCTION public.admin_creator_action(p_creator_id uuid, p_action text, p_payload jsonb DEFAULT '{}'::jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_amount bigint := coalesce((p_payload->>'amount_cents')::bigint, 0); v_kind text := p_payload->>'kind'; v_status text := p_payload->>'status';
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'Administrator permission is required' USING ERRCODE = '42501'; END IF;
  PERFORM 1 FROM creator_profiles WHERE id = p_creator_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Creator profile not found' USING ERRCODE = 'P0002'; END IF;
  IF p_action = 'set_status' THEN
    IF v_status NOT IN ('pending','verified','rejected','suspended','banned','archived','deleted') THEN RAISE EXCEPTION 'Invalid creator status'; END IF;
    UPDATE creator_profiles SET status = v_status::creator_account_status WHERE id = p_creator_id;
    UPDATE profiles SET account_status = CASE WHEN v_status = 'suspended' THEN 'suspended'::account_status WHEN v_status IN ('banned','deleted') THEN 'banned'::account_status ELSE 'active'::account_status END WHERE id = p_creator_id;
  ELSIF p_action = 'review_kyc' THEN
    IF v_status NOT IN ('pending','approved','rejected','changes_requested') THEN RAISE EXCEPTION 'Invalid KYC status'; END IF;
    INSERT INTO creator_kyc (creator_id,status,rejection_reason,reviewed_at,reviewed_by) VALUES (p_creator_id,v_status,p_payload->>'reason',now(),auth.uid())
      ON CONFLICT (creator_id) DO UPDATE SET status = EXCLUDED.status, rejection_reason = EXCLUDED.rejection_reason, reviewed_at = EXCLUDED.reviewed_at, reviewed_by = EXCLUDED.reviewed_by;
    UPDATE creator_profiles SET kyc_status = v_status WHERE id = p_creator_id;
  ELSIF p_action = 'adjust_wallet' THEN
    IF v_kind NOT IN ('credit','bonus','deduct','freeze','unfreeze') OR v_amount < 0 THEN RAISE EXCEPTION 'Invalid wallet adjustment'; END IF;
    INSERT INTO creator_wallets (creator_id) VALUES (p_creator_id) ON CONFLICT (creator_id) DO NOTHING;
    IF v_kind = 'freeze' THEN UPDATE creator_wallets SET is_frozen = true WHERE creator_id = p_creator_id;
    ELSIF v_kind = 'unfreeze' THEN UPDATE creator_wallets SET is_frozen = false WHERE creator_id = p_creator_id;
    ELSIF v_kind = 'deduct' THEN UPDATE creator_wallets SET available_balance_cents = greatest(0, available_balance_cents - v_amount) WHERE creator_id = p_creator_id;
    ELSE UPDATE creator_wallets SET available_balance_cents = available_balance_cents + v_amount, lifetime_earnings_cents = lifetime_earnings_cents + v_amount, bonus_earnings_cents = bonus_earnings_cents + CASE WHEN v_kind = 'bonus' THEN v_amount ELSE 0 END WHERE creator_id = p_creator_id; END IF;
    UPDATE wallets w SET available_balance_cents = cw.available_balance_cents, pending_balance_cents = cw.pending_balance_cents, lifetime_earnings_cents = cw.lifetime_earnings_cents FROM creator_wallets cw WHERE w.user_id = p_creator_id AND cw.creator_id = p_creator_id;
    IF v_kind NOT IN ('freeze','unfreeze') AND v_amount > 0 THEN
      INSERT INTO wallet_transactions (wallet_id,user_id,transaction_type,amount_cents,direction,description,idempotency_key)
      SELECT w.id, p_creator_id, 'adjustment'::transaction_type, v_amount, CASE WHEN v_kind = 'deduct' THEN 'debit'::transaction_direction ELSE 'credit'::transaction_direction END, nullif(trim(p_payload->>'reason'),''), 'creator-admin-' || gen_random_uuid()::text
      FROM wallets w WHERE w.user_id = p_creator_id;
    END IF;
  ELSIF p_action = 'add_note' THEN
    IF nullif(trim(p_payload->>'content'),'') IS NULL OR p_payload->>'note_type' NOT IN ('internal','warning','flag') THEN RAISE EXCEPTION 'A note and a valid note type are required'; END IF;
    INSERT INTO creator_notes (creator_id,note_type,content,is_flagged,created_by) VALUES (p_creator_id,p_payload->>'note_type',trim(p_payload->>'content'),p_payload->>'note_type'='flag',auth.uid());
  ELSIF p_action = 'award_badge' THEN
    IF nullif(trim(p_payload->>'badge_key'),'') IS NULL OR nullif(trim(p_payload->>'badge_name'),'') IS NULL THEN RAISE EXCEPTION 'Badge key and name are required'; END IF;
    INSERT INTO creator_badges (creator_id,badge_key,badge_name,icon,awarded_by) VALUES (p_creator_id,p_payload->>'badge_key',p_payload->>'badge_name',coalesce(p_payload->>'icon','award'),auth.uid()) ON CONFLICT (creator_id,badge_key) DO UPDATE SET badge_name = EXCLUDED.badge_name, icon = EXCLUDED.icon, awarded_at = now(), awarded_by = auth.uid();
  ELSIF p_action = 'set_level' THEN
    IF coalesce((p_payload->>'level_number')::integer,0) < 1 OR coalesce((p_payload->>'current_xp')::bigint,0) < 0 THEN RAISE EXCEPTION 'Invalid level values'; END IF;
    INSERT INTO creator_levels (creator_id,level_number,level_name,rank_name,current_xp) VALUES (p_creator_id,(p_payload->>'level_number')::integer,trim(p_payload->>'level_name'),trim(p_payload->>'rank_name'),(p_payload->>'current_xp')::bigint) ON CONFLICT (creator_id) DO UPDATE SET level_number=EXCLUDED.level_number, level_name=EXCLUDED.level_name, rank_name=EXCLUDED.rank_name, current_xp=EXCLUDED.current_xp;
  ELSIF p_action = 'set_permission' THEN
    IF nullif(trim(p_payload->>'permission_key'),'') IS NULL THEN RAISE EXCEPTION 'Permission key is required'; END IF;
    INSERT INTO creator_permissions (creator_id,permission_key,is_granted) VALUES (p_creator_id,trim(p_payload->>'permission_key'),coalesce((p_payload->>'is_granted')::boolean,false)) ON CONFLICT (creator_id,permission_key) DO UPDATE SET is_granted=EXCLUDED.is_granted;
  ELSE RAISE EXCEPTION 'Unsupported creator action'; END IF;
  INSERT INTO creator_history (creator_id,action_type,metadata,performed_by) VALUES (p_creator_id,p_action,p_payload,auth.uid());
  INSERT INTO audit_logs (actor_id,action,entity_type,entity_id,metadata) VALUES (auth.uid(),'creator.' || p_action,'creator',p_creator_id,p_payload);
END;
$$;
REVOKE ALL ON FUNCTION public.admin_creator_action(uuid,text,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_creator_action(uuid,text,jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_creator_dashboard()
RETURNS TABLE(total_creators bigint, online_creators bigint, verified_creators bigint, pending_kyc_creators bigint, rejected_creators bigint, suspended_creators bigint, banned_creators bigint, top_earner_name text, top_creator_name text, new_registrations_today bigint, daily_active_creators bigint, campaign_participations bigint, pending_withdrawals bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT (SELECT count(*) FROM creator_profiles), (SELECT count(*) FROM creator_profiles WHERE is_online), (SELECT count(*) FROM creator_profiles WHERE status='verified'), (SELECT count(*) FROM creator_profiles WHERE kyc_status IN ('pending','changes_requested')), (SELECT count(*) FROM creator_profiles WHERE status='rejected'), (SELECT count(*) FROM creator_profiles WHERE status='suspended'), (SELECT count(*) FROM creator_profiles WHERE status='banned'),
  (SELECT cp.display_name FROM creator_wallets cw JOIN creator_profiles cp ON cp.id=cw.creator_id ORDER BY cw.lifetime_earnings_cents DESC NULLS LAST LIMIT 1), (SELECT cp.display_name FROM submissions s JOIN creator_profiles cp ON cp.id=s.creator_id GROUP BY cp.id,cp.display_name ORDER BY sum(s.total_views) DESC LIMIT 1),
  (SELECT count(*) FROM creator_profiles WHERE created_at >= date_trunc('day',now())), (SELECT count(*) FROM creator_profiles WHERE last_login_at >= now()-interval '24 hours'), (SELECT count(*) FROM submissions), (SELECT count(*) FROM withdrawals WHERE status='pending');
$$;
REVOKE ALL ON FUNCTION public.admin_creator_dashboard() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_creator_dashboard() TO authenticated;
