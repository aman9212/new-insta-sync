-- ====================================================
-- CreatorX Enterprise Brand Management System Schema
-- Migration File: 20260721_brand_management_system.sql
-- ====================================================

-- Enable UUID extension if not present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enum Types for Brand Status & Verification
DO $$ BEGIN
    CREATE TYPE brand_status_type AS ENUM ('pending', 'verified', 'rejected', 'suspended', 'banned', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE brand_doc_status_type AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. BRANDS MASTER TABLE
CREATE TABLE IF NOT EXISTS public.brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    legal_name VARCHAR(255),
    slug VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    website VARCHAR(255),
    logo_url TEXT,
    banner_url TEXT,
    industry VARCHAR(100),
    business_category VARCHAR(100),
    description TEXT,
    founded_year INT,
    company_size VARCHAR(50),
    status brand_status_type DEFAULT 'pending',
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS status brand_status_type DEFAULT 'pending';

-- 2. BRAND PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.brand_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE UNIQUE NOT NULL,
    tax_id VARCHAR(100),
    gst_number VARCHAR(100),
    country VARCHAR(100) DEFAULT 'United States',
    state VARCHAR(100),
    city VARCHAR(100),
    timezone VARCHAR(100) DEFAULT 'UTC',
    language VARCHAR(20) DEFAULT 'en',
    address TEXT,
    email_verified BOOLEAN DEFAULT FALSE,
    domain_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. BRAND WALLETS TABLE
CREATE TABLE IF NOT EXISTS public.brand_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE UNIQUE NOT NULL,
    available_balance DECIMAL(15,2) DEFAULT 0.00,
    pending_balance DECIMAL(15,2) DEFAULT 0.00,
    campaign_budget DECIMAL(15,2) DEFAULT 0.00,
    currency VARCHAR(10) DEFAULT 'USD',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. BRAND ROLES & PERMISSIONS
CREATE TABLE IF NOT EXISTS public.brand_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL, -- Owner, Admin, Manager, Finance, Reviewer, Moderator
    description TEXT,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.brand_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID REFERENCES public.brand_roles(id) ON DELETE CASCADE NOT NULL,
    permission_key VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. BRAND MEMBERS TABLE
CREATE TABLE IF NOT EXISTS public.brand_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'Manager',
    status VARCHAR(50) DEFAULT 'active', -- active, invited, suspended
    invitation_token VARCHAR(255),
    invited_at TIMESTAMPTZ DEFAULT NOW(),
    joined_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. BRAND DOCUMENTS TABLE
CREATE TABLE IF NOT EXISTS public.brand_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE NOT NULL,
    doc_type VARCHAR(100) NOT NULL, -- business_license, gst_certificate, tax_doc, website_proof
    doc_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    status brand_doc_status_type DEFAULT 'pending',
    rejection_reason TEXT,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. BRAND TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.brand_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE NOT NULL,
    type VARCHAR(50) NOT NULL, -- deposit, withdrawal, campaign_spend, refund
    amount DECIMAL(15,2) NOT NULL,
    fee DECIMAL(15,2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'completed', -- pending, completed, failed
    description TEXT,
    reference_id VARCHAR(100),
    invoice_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. BRAND REPORTS TABLE
CREATE TABLE IF NOT EXISTS public.brand_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(255) NOT NULL,
    report_type VARCHAR(50) NOT NULL, -- campaign, finance, creator, invoice
    format VARCHAR(20) NOT NULL, -- pdf, csv, excel
    file_url TEXT,
    generated_by VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. BRAND SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.brand_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE UNIQUE NOT NULL,
    default_budget DECIMAL(15,2) DEFAULT 5000.00,
    default_currency VARCHAR(10) DEFAULT 'USD',
    auto_approve_campaign BOOLEAN DEFAULT FALSE,
    auto_invite_creators BOOLEAN DEFAULT TRUE,
    verification_required BOOLEAN DEFAULT TRUE,
    tax_rules JSONB DEFAULT '{"vat": 0, "gst": 0}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. BRAND ACTIVITY LOGS TABLE
CREATE TABLE IF NOT EXISTS public.brand_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE NOT NULL,
    actor_email VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL,
    details TEXT,
    ip_address VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. BRAND NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.brand_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL, -- campaign_approved, budget_low, creator_applied, etc.
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================
-- RLS POLICIES & SECURITY
-- ====================================================
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_notifications ENABLE ROW LEVEL SECURITY;

-- Allow public read of verified brands
CREATE POLICY "Public read verified brands" ON public.brands
    FOR SELECT USING (verification_status = 'verified' OR status = 'verified');

-- Allow authenticated admins full access
CREATE POLICY "Admins full access brands" ON public.brands
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admins full access brand_profiles" ON public.brand_profiles
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admins full access brand_wallets" ON public.brand_wallets
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admins full access brand_documents" ON public.brand_documents
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admins full access brand_transactions" ON public.brand_transactions
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admins full access brand_settings" ON public.brand_settings
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admins full access brand_activity_logs" ON public.brand_activity_logs
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admins full access brand_notifications" ON public.brand_notifications
    FOR ALL USING (auth.role() = 'authenticated');
