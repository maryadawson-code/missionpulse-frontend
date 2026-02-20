-- =============================================================================
-- MISSIONPULSE SPRINT 1 SCHEMA — Verified Reference (DO NOT RUN IN SUPABASE)
-- =============================================================================
-- Generated: 2026-02-19
-- Verified: profiles (13 cols) + opportunities (46 cols) from live info_schema
-- Instance: djuviwarqdvlbgcfuupa.supabase.co
--
-- ⚠ THIS IS A REFERENCE DOCUMENT, NOT A MIGRATION.
-- These tables and policies ALREADY EXIST in Supabase.
-- Running this will error with "already exists" messages.
-- Use this file to understand the schema when building Next.js queries.
-- =============================================================================


-- =========================================================================
-- SECTION 1: RBAC HELPER FUNCTIONS (Already Deployed)
-- =========================================================================
-- Included for reference. These are called by RLS policies.

-- is_authenticated() → auth.uid() IS NOT NULL
-- is_admin()         → profiles.role IN ('executive','operations','admin','CEO','COO')
-- is_internal_user() → profiles.role IN (15 internal roles)
-- can_access_sensitive() → profiles.role IN ('executive','operations','admin','CEO','COO','FIN')
-- get_user_role()    → profiles.role for auth.uid(), defaults to 'viewer'
-- get_my_role()      → same as above
-- get_my_company_id() → profiles.company_id for auth.uid()


-- =========================================================================
-- SECTION 2: PROFILES (Auth Pivot — 13 columns, 3 rows)
-- =========================================================================
-- ✅ VERIFIED from live information_schema export 2/19/2026
-- Every RLS function queries this table.
-- handle_new_user trigger inserts here on auth.users INSERT.

-- CREATE TABLE public.profiles (
--     id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
--     email           VARCHAR NOT NULL UNIQUE,
--     full_name       VARCHAR,
--     role            VARCHAR DEFAULT 'Partner',
--                     -- ⚠ Column default is 'Partner'
--                     -- handle_new_user trigger OVERRIDES to 'CEO'
--                     -- Change trigger to 'viewer' before multi-user
--     company         VARCHAR,             -- Display name (text)
--     phone           VARCHAR,
--     avatar_url      TEXT,
--     preferences     JSONB DEFAULT '{}',  -- User preferences
--     created_at      TIMESTAMPTZ DEFAULT now(),
--     updated_at      TIMESTAMPTZ DEFAULT now(),
--     company_id      UUID,                -- FK → companies(id), used by RLS
--     status          TEXT DEFAULT 'active', -- Account status
--     last_login      TIMESTAMPTZ
-- );

-- NOTES:
-- ❌ NO mfa_enabled column exists (GROUND_TRUTH was wrong)
-- ✅ company_id (uuid FK) AND company (varchar display) both exist
-- ✅ preferences (jsonb) exists for user settings


-- =========================================================================
-- SECTION 3: OPPORTUNITIES (Pipeline — 46 columns, 5 rows)
-- =========================================================================
-- ✅ VERIFIED from live information_schema export 2/19/2026
--
-- DUPLICATE COLUMNS (use the preferred one in Next.js):
--   pwin (preferred) vs win_probability (ignore)
--   phase (preferred, default 'Gate 1') vs shipley_phase (ignore) vs pipeline_stage (ignore)
--   custom_properties (user-facing) vs metadata (system)

-- CREATE TABLE public.opportunities (
--     -- Core identification
--     id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     title                   VARCHAR NOT NULL,          -- ⚠ Phase 1 JS used 'name'
--     nickname                VARCHAR,
--     description             TEXT,
--
--     -- Agency & contract info
--     agency                  VARCHAR,
--     sub_agency              VARCHAR,
--     contract_vehicle        VARCHAR,
--     naics_code              VARCHAR,
--     set_aside               VARCHAR,                   -- SDVOSB, 8(a), etc.
--     ceiling                 NUMERIC,                   -- ⚠ Phase 1 JS used 'contract_value'
--     period_of_performance   VARCHAR,
--
--     -- Dates
--     due_date                TIMESTAMPTZ,               -- Proposal due date
--     submission_date         TIMESTAMPTZ,
--     award_date              TIMESTAMPTZ,
--     close_date              DATE,                      -- Expected close
--     pop_start               TIMESTAMPTZ,
--     pop_end                 TIMESTAMPTZ,
--
--     -- Pipeline tracking (⚠ 4 overlapping fields)
--     phase                   VARCHAR DEFAULT 'Gate 1',  -- ✅ USE THIS: Shipley gates
--     status                  VARCHAR DEFAULT 'Active',  -- ✅ USE THIS: lifecycle
--     priority                VARCHAR DEFAULT 'Medium',
--     pwin                    INTEGER DEFAULT 50,        -- ✅ USE THIS: win probability
--     go_no_go                VARCHAR,
--     pipeline_stage          TEXT DEFAULT 'qualification', -- ⚠ IGNORE: duplicate of phase
--     shipley_phase           TEXT,                      -- ⚠ IGNORE: duplicate of phase
--     win_probability         INTEGER DEFAULT 50,        -- ⚠ IGNORE: duplicate of pwin
--
--     -- Competitive intelligence
--     incumbent               VARCHAR,
--     is_recompete            BOOLEAN DEFAULT false,
--     bd_investment           NUMERIC DEFAULT 0,         -- B&P dollars spent
--
--     -- Source tracking
--     solicitation_number     VARCHAR,
--     sam_url                 TEXT,
--     sam_opportunity_id      TEXT,
--     govwin_id               TEXT,
--     deal_source             TEXT DEFAULT 'manual',     -- manual, hubspot, sam_gov
--
--     -- Contact
--     contact_name            TEXT,                      -- ⚠ Phase 1 JS used 'primaryContact'
--     contact_email           TEXT,
--     place_of_performance    TEXT,
--     notes                   TEXT,
--
--     -- Relationships
--     owner_id                UUID,                      -- FK → profiles(id)
--                                                        -- ⚠ Phase 1 JS used 'created_by'
--     company_id              UUID,                      -- FK → companies(id)
--
--     -- HubSpot CRM integration
--     hubspot_deal_id         TEXT,
--     hubspot_synced_at       TIMESTAMPTZ,
--
--     -- Extensibility
--     tags                    TEXT[],                    -- Array
--     custom_properties       JSONB DEFAULT '{}',        -- User-facing metadata
--     metadata                JSONB DEFAULT '{}',        -- System metadata
--
--     -- Timestamps
--     created_at              TIMESTAMPTZ DEFAULT now(),
--     updated_at              TIMESTAMPTZ DEFAULT now()
-- );


-- =========================================================================
-- SECTION 4: NEXT.JS QUERY QUICK REFERENCE
-- =========================================================================
-- Copy these patterns into your Server Components / Server Actions.

-- Pipeline page (list all opportunities):
--   supabase.from('opportunities')
--     .select('id, title, nickname, agency, ceiling, phase, status, priority, pwin, due_date, owner_id, set_aside, is_recompete')
--     .order('updated_at', { ascending: false })

-- Opportunity detail page:
--   supabase.from('opportunities')
--     .select('*')
--     .eq('id', opportunityId)
--     .single()

-- Dashboard stats:
--   supabase.from('opportunities')
--     .select('id, ceiling, pwin, phase, status')

-- User profile (current user):
--   supabase.from('profiles')
--     .select('id, email, full_name, role, company, company_id, phone, avatar_url, preferences, status')
--     .eq('id', userId)
--     .single()

-- Display name mapping for Next.js UI:
--   pwin         → "Win Probability"
--   ceiling      → "Contract Value" or "Ceiling"
--   phase        → "Shipley Phase" or "Gate"
--   set_aside    → "Set-Aside"
--   bd_investment → "B&P Investment"
--   is_recompete → "Recompete"
--   pop_start/pop_end → "Period of Performance"


-- =========================================================================
-- SECTION 5: VERIFICATION QUERIES (Run in Supabase SQL Editor)
-- =========================================================================
-- Use these to verify any table before building queries against it.

-- 5a. Verify companies table (NOT YET VERIFIED)
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'companies'
-- ORDER BY ordinal_position;

-- 5b. Verify roles table
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'roles'
-- ORDER BY ordinal_position;

-- 5c. Verify pipeline_stages table
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'pipeline_stages'
-- ORDER BY ordinal_position;

-- 5d. Verify audit_logs table
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'audit_logs'
-- ORDER BY ordinal_position;

-- 5e. Full RLS policy dump (ALL tables)
-- SELECT tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;

-- 5f. Check if mfa_enabled exists ANYWHERE
-- SELECT table_name, column_name
-- FROM information_schema.columns
-- WHERE table_schema = 'public' AND column_name LIKE '%mfa%';

-- 5g. Check what is_mfa_enabled() actually does
-- SELECT prosrc FROM pg_proc WHERE proname = 'is_mfa_enabled';
