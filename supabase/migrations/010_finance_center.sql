-- CreatorX Enterprise Finance Center Migration

CREATE TABLE IF NOT EXISTS payment_providers (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'gateway',
  enabled BOOLEAN NOT NULL DEFAULT true,
  sandbox_mode BOOLEAN NOT NULL DEFAULT false,
  supported_currencies TEXT[] NOT NULL DEFAULT ARRAY['USD', 'EUR', 'GBP', 'INR'],
  processing_fee_percent NUMERIC(5,2) NOT NULL DEFAULT 2.9,
  fixed_fee_cents INTEGER NOT NULL DEFAULT 30,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO payment_providers (id, display_name, category, enabled, supported_currencies) VALUES
  ('stripe', 'Stripe Connect', 'gateway', true, ARRAY['USD','EUR','GBP','CAD','AUD']),
  ('razorpay', 'Razorpay', 'gateway', true, ARRAY['INR','USD']),
  ('paypal', 'PayPal', 'digital_wallet', true, ARRAY['USD','EUR','GBP']),
  ('wise', 'Wise (TransferWise)', 'bank_transfer', true, ARRAY['USD','EUR','GBP','INR']),
  ('bank_transfer', 'Direct Bank Transfer (ACH/SEPA/NEFT)', 'bank_transfer', true, ARRAY['USD','EUR','GBP','INR']),
  ('crypto', 'Crypto Wallet (USDC/USDT/SOL)', 'crypto', true, ARRAY['USDC','USDT','SOL'])
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS payment_provider_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id TEXT NOT NULL REFERENCES payment_providers(id) ON DELETE CASCADE,
  environment TEXT NOT NULL DEFAULT 'production' CHECK (environment IN ('sandbox','production')),
  client_id TEXT,
  encrypted_client_secret TEXT,
  encrypted_api_key TEXT,
  encrypted_webhook_secret TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_type TEXT NOT NULL CHECK (wallet_type IN ('creator','brand','platform')),
  currency TEXT NOT NULL DEFAULT 'USD',
  available_balance_cents BIGINT NOT NULL DEFAULT 0 CHECK (available_balance_cents >= 0),
  pending_balance_cents BIGINT NOT NULL DEFAULT 0 CHECK (pending_balance_cents >= 0),
  locked_balance_cents BIGINT NOT NULL DEFAULT 0 CHECK (locked_balance_cents >= 0),
  bonus_balance_cents BIGINT NOT NULL DEFAULT 0 CHECK (bonus_balance_cents >= 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','frozen','suspended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, wallet_type, currency)
);

CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('deposit','withdrawal','campaign_funding','bonus','refund','adjustment','commission','affiliate_earning','tax')),
  amount_cents BIGINT NOT NULL,
  fee_cents BIGINT NOT NULL DEFAULT 0,
  net_amount_cents BIGINT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending','completed','failed','cancelled')),
  reference_id TEXT,
  description TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS withdraw_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  amount_cents BIGINT NOT NULL CHECK (amount_cents > 0),
  fee_cents BIGINT NOT NULL DEFAULT 0,
  net_amount_cents BIGINT NOT NULL CHECK (net_amount_cents > 0),
  payment_method_type TEXT NOT NULL CHECK (payment_method_type IN ('bank_account','upi','paypal','wise','crypto','stripe_connect')),
  payment_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','info_requested','frozen','cancelled')),
  rejection_reason TEXT,
  processed_at TIMESTAMPTZ,
  receipt_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS campaign_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL UNIQUE,
  brand_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_budget_cents BIGINT NOT NULL CHECK (total_budget_cents >= 0),
  spent_budget_cents BIGINT NOT NULL DEFAULT 0 CHECK (spent_budget_cents >= 0),
  remaining_budget_cents BIGINT NOT NULL CHECK (remaining_budget_cents >= 0),
  daily_limit_cents BIGINT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','depleted','completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS subscription_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price_cents BIGINT NOT NULL DEFAULT 0,
  billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly','annual')),
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  trial_days INTEGER NOT NULL DEFAULT 14,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO subscription_plans (id, name, price_cents, billing_cycle, trial_days) VALUES
  ('plan_free', 'Free', 0, 'monthly', 0),
  ('plan_starter', 'Starter', 2900, 'monthly', 14),
  ('plan_pro', 'Pro', 7900, 'monthly', 14),
  ('plan_business', 'Business', 19900, 'monthly', 14),
  ('plan_enterprise', 'Enterprise Custom', 49900, 'monthly', 30)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL REFERENCES subscription_plans(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','trialing','past_due','canceled')),
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  current_period_end TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '30 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invoice_type TEXT NOT NULL CHECK (invoice_type IN ('creator_payout','brand_billing','subscription','tax_invoice','credit_note')),
  subtotal_cents BIGINT NOT NULL,
  tax_cents BIGINT NOT NULL DEFAULT 0,
  total_cents BIGINT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'paid' CHECK (status IN ('draft','issued','paid','void','uncollectible')),
  pdf_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS coupon_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage','fixed','first_payment','lifetime')),
  discount_value NUMERIC(10,2) NOT NULL,
  max_uses INTEGER,
  uses_count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tax_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  tax_type TEXT NOT NULL CHECK (tax_type IN ('GST','VAT','SalesTax','CountryTax')),
  percentage NUMERIC(5,2) NOT NULL,
  is_inclusive BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO tax_rules (name, country, tax_type, percentage, is_inclusive) VALUES
  ('US Sales Tax Standard', 'US', 'SalesTax', 8.25, false),
  ('UK VAT Standard', 'GB', 'VAT', 20.00, true),
  ('EU VAT Standard', 'EU', 'VAT', 21.00, true),
  ('India GST Standard', 'IN', 'GST', 18.00, false)
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS finance_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  platform_fee_percent NUMERIC(5,2) NOT NULL DEFAULT 5.0,
  creator_commission_percent NUMERIC(5,2) NOT NULL DEFAULT 85.0,
  brand_commission_percent NUMERIC(5,2) NOT NULL DEFAULT 10.0,
  withdrawal_fee_cents BIGINT NOT NULL DEFAULT 100,
  auto_approve_withdrawal_limit_cents BIGINT NOT NULL DEFAULT 25000,
  default_currency TEXT NOT NULL DEFAULT 'USD',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO finance_settings (id, platform_fee_percent) VALUES (1, 5.0) ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS finance_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  changes_masked TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
