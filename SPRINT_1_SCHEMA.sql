-- =============================================================================
-- MISSIONPULSE SPRINT 1 SCHEMA — Reconstructed Reference
-- =============================================================================
-- Generated: 2026-02-19
-- Source: GROUND_TRUTH_v2.md, Database_Schema_Documentation.docx,
--         supabase-client.js field mappings, deployed RLS helper functions
-- Instance: djuviwarqdvlbgcfuupa.supabase.co
--
-- ⚠ WARNING: This is a RECONSTRUCTION, not a raw pg_dump.
-- Some column names may differ from live schema. Before building Next.js
-- queries against any table, run the verification query in Section 9.
--
-- Tables: profiles, companies, opportunities, roles, pipeline_stages,
--         activity_log, audit_logs, pricing_items, labor_categories,
--         competitors
-- =============================================================================


-- =========================================================================
-- SECTION 1: RBAC HELPER FUNCTIONS (Deployed & Verified)
-- =========================================================================
-- These are called by RLS policies. They are the auth enforcement layer.

CREATE OR REPLACE FUNCTION public.is_authenticated()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN auth.uid() IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role IN ('executive', 'operations', 'admin', 'CEO', 'COO')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_internal_user()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role IN (
            'executive', 'operations', 'capture_manager', 'volume_lead',
            'author', 'admin', 'CEO', 'COO', 'CAP', 'PM', 'SA',
            'FIN', 'CON', 'DEL', 'QA'
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.can_access_sensitive()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role IN ('executive', 'operations', 'admin', 'CEO', 'COO', 'FIN')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role
    FROM public.profiles
    WHERE id = auth.uid();
    RETURN COALESCE(user_role, 'viewer');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role
    FROM public.profiles
    WHERE id = auth.uid();
    RETURN COALESCE(user_role, 'viewer');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_my_company_id()
RETURNS UUID AS $$
DECLARE
    cid UUID;
BEGIN
    SELECT company_id INTO cid
    FROM public.profiles
    WHERE id = auth.uid();
    RETURN cid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =========================================================================
-- SECTION 2: PROFILES (Auth Pivot — 3 rows)
-- =========================================================================
-- Every RLS function queries this table. handle_new_user trigger inserts here.

CREATE TABLE IF NOT EXISTS public.profiles (
    id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email           TEXT UNIQUE NOT NULL,
    full_name       TEXT,
    role            TEXT NOT NULL DEFAULT 'CEO',
    company_id      UUID REFERENCES public.companies(id),
    avatar_url      TEXT,
    mfa_enabled     BOOLEAN DEFAULT false,
    last_login      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_select_own ON public.profiles
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY profiles_select_admin ON public.profiles
    FOR SELECT USING (is_admin());
CREATE POLICY profiles_update_own ON public.profiles
    FOR UPDATE USING (auth.uid() = id);
CREATE POLICY profiles_update_admin ON public.profiles
    FOR UPDATE USING (is_admin());

-- Trigger: auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        'CEO'  -- ⚠ Change to 'viewer' before multi-user launch
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger binding (already deployed)
-- CREATE TRIGGER on_auth_user_created
--     AFTER INSERT ON auth.users
--     FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- =========================================================================
-- SECTION 3: COMPANIES (Tenant Root — 1 row)
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.companies (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    domain          TEXT,
    logo_url        TEXT,
    solo_mode       BOOLEAN DEFAULT false,
    trial_ends_at   TIMESTAMPTZ,
    subscription_tier TEXT DEFAULT 'trial',
    settings        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY companies_select ON public.companies
    FOR SELECT USING (is_authenticated());
CREATE POLICY companies_update ON public.companies
    FOR UPDATE USING (is_admin());


-- =========================================================================
-- SECTION 4: OPPORTUNITIES (Pipeline — 5 rows)
-- =========================================================================
-- ⚠ COLUMN NAME UNCERTAINTY:
-- GROUND_TRUTH says: title, value, pwin, status
-- supabase-client.js maps: name, contract_value, win_probability, shipley_phase
-- RUN VERIFICATION QUERY (Section 9) BEFORE BUILDING QUERIES.

CREATE TABLE IF NOT EXISTS public.opportunities (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id          UUID REFERENCES public.companies(id),
    title               TEXT NOT NULL,               -- May be 'name' in live schema
    nickname            TEXT,
    description         TEXT,
    solicitation_number TEXT,
    agency              TEXT,
    sub_agency          TEXT,
    naics_code          TEXT,
    set_aside           TEXT,
    contract_type       TEXT,
    contract_vehicle    TEXT,
    value               NUMERIC,                     -- May be 'contract_value'
    pwin                INTEGER CHECK (pwin >= 0 AND pwin <= 100),  -- May be 'win_probability'
    status              TEXT NOT NULL DEFAULT 'Identification',      -- May be 'shipley_phase'
    stage_id            UUID,                        -- May reference pipeline_stages
    submission_date     DATE,                        -- Exists per schema doc
    award_date          DATE,
    pop_start           DATE,
    pop_end             DATE,
    created_by          UUID REFERENCES public.profiles(id),
    capture_manager_id  UUID REFERENCES public.profiles(id),
    source              TEXT,
    tags                TEXT[],
    metadata            JSONB DEFAULT '{}',
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY opportunities_select_internal ON public.opportunities
    FOR SELECT USING (is_internal_user());
CREATE POLICY opportunities_select_partner ON public.opportunities
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.partner_access pa
            WHERE pa.opportunity_id = opportunities.id
            AND pa.partner_user_id = auth.uid()
            AND pa.is_active = true
        )
    );
CREATE POLICY opportunities_insert ON public.opportunities
    FOR INSERT WITH CHECK (is_internal_user());
CREATE POLICY opportunities_update ON public.opportunities
    FOR UPDATE USING (is_internal_user());


-- =========================================================================
-- SECTION 5: ROLES (Reference — 11 rows)
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.roles (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT UNIQUE NOT NULL,
    display_name    TEXT NOT NULL,
    description     TEXT,
    shipley_function TEXT,
    type            TEXT DEFAULT 'internal',
    ui_complexity   TEXT DEFAULT 'standard',
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY roles_select ON public.roles
    FOR SELECT USING (is_authenticated());


-- =========================================================================
-- SECTION 6: PIPELINE_STAGES (Shipley Config — 10 rows)
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.pipeline_stages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    display_name    TEXT NOT NULL,
    stage_order     INTEGER NOT NULL,
    description     TEXT,
    color           TEXT,
    icon            TEXT,
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.pipeline_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY pipeline_stages_select ON public.pipeline_stages
    FOR SELECT USING (is_authenticated());


-- =========================================================================
-- SECTION 7: ACTIVITY_LOG (User Events — 8 rows)
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.activity_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES public.profiles(id),
    action          TEXT NOT NULL,
    entity_type     TEXT,
    entity_id       UUID,
    description     TEXT,
    metadata        JSONB DEFAULT '{}',
    ip_address      INET,
    created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY activity_log_select ON public.activity_log
    FOR SELECT USING (is_internal_user());
CREATE POLICY activity_log_insert ON public.activity_log
    FOR INSERT WITH CHECK (is_authenticated());


-- =========================================================================
-- SECTION 8: AUDIT_LOGS (Immutable — NIST AU-9 — 2 rows)
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES public.profiles(id),
    action          TEXT NOT NULL,
    table_name      TEXT NOT NULL,
    record_id       UUID,
    old_values      JSONB,
    new_values      JSONB,
    ip_address      INET,
    user_agent      TEXT,
    created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY audit_logs_select ON public.audit_logs
    FOR SELECT USING (is_admin());
CREATE POLICY audit_logs_insert ON public.audit_logs
    FOR INSERT WITH CHECK (is_authenticated());

-- Immutability trigger (NIST AU-9)
CREATE OR REPLACE FUNCTION public.audit_logs_immutable()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Audit logs are immutable. UPDATE/DELETE prohibited (NIST AU-9).';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger binding (already deployed)
-- CREATE TRIGGER enforce_audit_immutability
--     BEFORE UPDATE OR DELETE ON public.audit_logs
--     FOR EACH ROW EXECUTE FUNCTION public.audit_logs_immutable();


-- =========================================================================
-- SECTION 8b: CUI TABLES (Restricted Access)
-- =========================================================================

-- PRICING_ITEMS (CUI // SP-PROPIN — 0 rows)
CREATE TABLE IF NOT EXISTS public.pricing_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id  UUID REFERENCES public.opportunities(id),
    category        TEXT NOT NULL,
    description     TEXT,
    quantity        NUMERIC,
    unit_price      NUMERIC,
    total_price     NUMERIC,
    labor_cat_id    UUID REFERENCES public.labor_categories(id),
    period          TEXT,
    notes           TEXT,
    created_by      UUID REFERENCES public.profiles(id),
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.pricing_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY pricing_items_select ON public.pricing_items
    FOR SELECT USING (can_access_sensitive());
CREATE POLICY pricing_items_insert ON public.pricing_items
    FOR INSERT WITH CHECK (can_access_sensitive());

-- LABOR_CATEGORIES (CUI // SP-PROPIN — 35 rows)
CREATE TABLE IF NOT EXISTS public.labor_categories (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id      UUID REFERENCES public.companies(id),
    name            TEXT NOT NULL,
    abbreviation    TEXT,
    description     TEXT,
    hourly_rate     NUMERIC,
    annual_rate     NUMERIC,
    gsa_schedule    TEXT,
    education_min   TEXT,
    experience_min  INTEGER,
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.labor_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY labor_categories_select ON public.labor_categories
    FOR SELECT USING (can_access_sensitive());

-- COMPETITORS (CUI // OPSEC — 3 rows)
CREATE TABLE IF NOT EXISTS public.competitors (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id      UUID REFERENCES public.companies(id),
    name            TEXT NOT NULL,
    duns_number     TEXT,
    cage_code       TEXT,
    strengths       TEXT,
    weaknesses      TEXT,
    threat_level    TEXT DEFAULT 'medium',
    notes           TEXT,
    metadata        JSONB DEFAULT '{}',
    created_by      UUID REFERENCES public.profiles(id),
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.competitors ENABLE ROW LEVEL SECURITY;

CREATE POLICY competitors_select ON public.competitors
    FOR SELECT USING (
        get_user_role() IN ('CEO', 'COO', 'CAP', 'executive', 'operations')
    );


-- =========================================================================
-- SECTION 9: VERIFICATION QUERIES
-- =========================================================================
-- Run these in Supabase SQL Editor BEFORE building Next.js queries.

-- 9a. Verify exact column names for opportunities
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'opportunities'
-- ORDER BY ordinal_position;

-- 9b. Verify exact column names for profiles
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'profiles'
-- ORDER BY ordinal_position;

-- 9c. Verify all RLS policies on MVP tables
-- SELECT tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- AND tablename IN ('profiles','companies','opportunities','roles',
--                   'pipeline_stages','activity_log','audit_logs',
--                   'pricing_items','labor_categories','competitors')
-- ORDER BY tablename, policyname;

-- 9d. Verify helper functions exist
-- SELECT routine_name, data_type
-- FROM information_schema.routines
-- WHERE routine_schema = 'public'
-- AND routine_name IN ('is_authenticated','is_admin','is_internal_user',
--                      'can_access_sensitive','get_user_role','get_my_company_id',
--                      'get_my_role','handle_new_user','audit_logs_immutable')
-- ORDER BY routine_name;

-- 9e. Verify triggers
-- SELECT trigger_name, event_object_table, event_manipulation, action_statement
-- FROM information_schema.triggers
-- WHERE trigger_schema = 'public'
-- AND event_object_table IN ('audit_logs', 'profiles')
-- ORDER BY event_object_table;
