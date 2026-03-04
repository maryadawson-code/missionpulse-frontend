# MissionPulse Architecture

> GovCon Proposal Management Platform — Technical Architecture Reference
>
> Version: 1.2 | Last updated: 2026-02-28

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Directory Structure](#2-directory-structure)
3. [Request Lifecycle](#3-request-lifecycle)
4. [RBAC Model](#4-rbac-model)
5. [AI Pipeline](#5-ai-pipeline)
6. [Module Map](#6-module-map)
7. [Real-time Architecture](#7-real-time-architecture)
8. [Security Architecture](#8-security-architecture)
9. [Data Layer](#9-data-layer)

---

## 1. System Overview

MissionPulse is a GovCon proposal management platform built on the Shipley
methodology. It orchestrates capture management, proposal authoring, compliance
tracking, pricing, and competitive analysis across 16 modules, 9 AI agents,
and integrations with federal and commercial data sources.

```
                              +---------------------+
                              |      Browser        |
                              | (React / Next.js)   |
                              +----------+----------+
                                         |
                                   HTTPS / WSS
                                         |
                              +----------v----------+
                              |    middleware.ts     |
                              | CSP nonce, rate      |
                              | limiting, brute      |
                              | force, auth redirect,|
                              | correlation ID       |
                              +----------+----------+
                                         |
                       +-----------------+-----------------+
                       |                                   |
            +----------v----------+             +----------v----------+
            |  Server Components  |             |    API Routes       |
            |  (App Router RSC)   |             |  app/api/*          |
            +----------+----------+             +----------+----------+
                       |                                   |
                       +----------+----------+-------------+
                                  |          |
                       +----------v--+  +----v-----------+
                       | Server      |  | Server         |
                       | Actions     |  | Actions        |
                       | (lib/       |  | (app/          |
                       |  actions/)  |  |  */actions.ts) |
                       +------+------+  +------+---------+
                              |                |
         +--------------------+----------------+--------------------+
         |                    |                |                    |
+--------v-------+  +--------v-------+  +-----v--------+  +-------v--------+
|   Supabase     |  |    Redis       |  | AI Gateway   |  |  External      |
| +Auth          |  | (Upstash)      |  |              |  |  Integrations  |
| +DB (Postgres) |  | +Cache         |  | +AskSage     |  |                |
| +Realtime      |  | +Rate Limiting |  |  (FedRAMP)   |  | +Stripe        |
| +Storage       |  | +Token Billing |  | +Anthropic   |  | +Salesforce    |
| +Edge Funcs    |  | +Semantic      |  | +OpenAI      |  | +GovWin        |
|                |  |  Cache         |  |              |  | +SAM.gov       |
+----------------+  +----------------+  +--------------+  | +USAspending   |
                                                          | +FPDS          |
                                                          | +M365          |
                                                          | +Google Wksp   |
                                                          | +DocuSign      |
                                                          | +Slack         |
                                                          +----------------+
```

### Technology Stack

| Layer            | Technology                                              |
| ---------------- | ------------------------------------------------------- |
| Framework        | Next.js 14 (App Router, Server Components)              |
| Language         | TypeScript (strict mode)                                |
| Styling          | Tailwind CSS + shadcn/ui + CSS Variables (dark theme)   |
| State            | React Server Components + react-hook-form + URL state   |
| Validation       | Zod v4 (`$ZodType<T,T>` for FormModal compatibility)    |
| Tables           | @tanstack/react-table (DataTable<T> generic component)  |
| Drag & Drop      | @hello-pangea/dnd (Kanban + Swimlane)                   |
| Auth             | Supabase Auth (JWT, email/password, MFA)                |
| Database         | Supabase (Postgres) with RLS on all tables              |
| Cache            | Upstash Redis (rate limiting, semantic cache, billing)  |
| Realtime         | Supabase Realtime (presence, broadcast)                 |
| Storage          | Supabase Storage (RFP uploads, documents, avatars)      |
| AI Providers     | AskSage (FedRAMP), Anthropic, OpenAI                    |
| Billing          | Stripe (subscriptions, checkout, webhooks)              |
| Doc Gen          | PPTX / DOCX / XLSX engines (server-side generation)     |
| Monitoring       | Sentry (error tracking, CSP reports, performance)       |
| Logging          | Structured logger with correlation IDs                  |
| Testing          | Vitest (unit) + Playwright (E2E)                        |
| Deployment       | Netlify (serverless)                                    |

---

## 2. Directory Structure

```
missionpulse-frontend/
|
+-- app/                          # Next.js App Router
|   +-- (auth)/                   # Auth route group (login, signup, etc.)
|   +-- (dashboard)/              # Protected dashboard route group
|   |   +-- layout.tsx            # Auth gate + RBAC resolution + RoleProvider
|   |   +-- dashboard/            # Home dashboard (KPIs, charts)
|   |   +-- pipeline/             # Opportunity pipeline (table + kanban)
|   |   +-- proposals/            # Proposal authoring + volumes
|   |   +-- war-room/             # War room detail + swimlane
|   |   +-- compliance/           # Compliance matrix + Iron Dome
|   |   +-- strategy/             # Win strategy (Black Hat, etc.)
|   |   +-- blackhat/             # Competitive analysis
|   |   +-- pricing/              # Pricing models + worksheets
|   |   +-- documents/            # Document management + RFP shredder
|   |   +-- ai/ + ai-chat/       # AI assistant chat interface
|   |   +-- analytics/            # Reporting + analytics dashboards
|   |   +-- admin/                # Admin panel (users, billing, config)
|   |   +-- audit/                # Immutable audit log viewer
|   |   +-- personnel/            # Personnel / staffing management
|   |   +-- integrations/         # Integration settings + OAuth callbacks
|   |   +-- workflow/             # Workflow board (Shipley phases)
|   |   +-- settings/             # User settings + preferences
|   |   +-- notifications/        # Notification center
|   |   +-- partners/             # Partner / teaming management
|   |   +-- subcontractors/       # Subcontractor management
|   |   +-- playbook/             # Capture playbook (Shipley phases)
|   |   +-- past-performance/     # Past performance database
|   |   +-- win-loss/             # Win/loss debrief analysis
|   |   +-- debriefs/             # Post-submission debriefs
|   |   +-- capacity/             # Resource capacity planning
|   |   +-- reports/              # Report generation
|   |   +-- feedback/             # User feedback collection
|   |   +-- help/                 # Help / documentation
|   +-- (public)/                 # Public pages (landing, plans, 8a-toolkit)
|   +-- api/                      # API routes
|   |   +-- auth/callback/        # Supabase auth callback
|   |   +-- health/               # Health check endpoints
|   |   +-- cron/                 # Scheduled jobs
|   |   +-- webhooks/stripe/      # Stripe webhook handler
|   |   +-- integrations/         # OAuth callbacks (DocuSign, Google, etc.)
|   |   +-- section-versions/     # Section versioning API
|   |   +-- metrics/              # Prometheus-style metrics
|   |   +-- newsletter/           # Newsletter subscription
|   +-- fonts/                    # Custom fonts
|
+-- components/
|   +-- ui/                       # shadcn/ui base (14 components) + shared
|   |   +-- DataTable.tsx         # Generic DataTable<T> (sort/search/filter)
|   |   +-- FormModal.tsx         # Zod v4 + react-hook-form dynamic modal
|   |   +-- ConfirmModal.tsx      # AlertDialog for destructive actions
|   |   +-- StatusBadge.tsx       # Color-coded status badges
|   |   +-- PhaseIndicator.tsx    # Shipley phase progress bar
|   |   +-- Toast.tsx             # Custom toast notifications
|   +-- layout/                   # Layout components
|   |   +-- Sidebar.tsx           # RBAC-filtered navigation sidebar
|   |   +-- DashboardHeader.tsx   # Top bar with notifications + search
|   |   +-- MobileNav.tsx         # Mobile navigation drawer
|   |   +-- GlobalSearch.tsx      # Cmd+K global search
|   |   +-- KeyboardShortcuts.tsx # Global keyboard shortcuts
|   |   +-- SkipNav.tsx           # Accessibility skip navigation
|   |   +-- SessionTimeoutGuard   # Session timeout enforcer
|   |   +-- PartnerWatermark.tsx  # CUI watermark for external roles
|   +-- features/shared/          # Shared feature components
|   |   +-- ActivityLog.tsx       # Date-grouped activity + real-time
|   +-- auth/                     # Auth UI (login, signup forms)
|   +-- dashboard/                # Dashboard-specific components
|   +-- modules/                  # Module-specific components
|   +-- rbac/                     # RBAC components (CUIBanner, gates)
|   +-- marketing/                # Public marketing components
|   +-- monitoring/               # Performance monitoring widgets
|
+-- lib/
|   +-- supabase/                 # Supabase client configuration
|   |   +-- server.ts             # Server-side Supabase client (cookies)
|   |   +-- client.ts             # Browser Supabase client
|   |   +-- admin.ts              # Service-role admin client
|   |   +-- sync-client.ts        # Real-time sync client
|   |   +-- database.types.ts     # Auto-generated DB types (351KB)
|   |   +-- query-utils.ts        # Query builder utilities
|   +-- rbac/                     # Role-Based Access Control
|   |   +-- config.ts             # RBAC config loader + permission functions
|   |   +-- hooks.ts              # Client hooks (useRole, useModuleAccess)
|   |   +-- RoleContext.tsx        # React context for role state
|   +-- ai/                       # AI pipeline
|   |   +-- pipeline.ts           # Unified aiRequest() entry point
|   |   +-- classification-router # CUI/OPSEC content classification
|   |   +-- classification-rules  # Regex-based classification rules
|   |   +-- model-selector.ts     # Task-to-model mapping + budget guard
|   |   +-- router.ts             # Provider routing (FedRAMP-aware)
|   |   +-- intent-classifier.ts  # Deterministic intent classification
|   |   +-- logger.ts             # Token usage logging
|   |   +-- voice-fingerprint.ts  # Writer voice consistency
|   |   +-- suggested-prompts.ts  # Context-aware prompt suggestions
|   |   +-- agents/               # 9 domain-specific AI agents
|   |   +-- providers/            # AskSage, Anthropic, OpenAI adapters
|   |   +-- proactive/            # Proactive AI recommendations
|   |   +-- fine-tune/            # Fine-tuning pipeline
|   +-- actions/                  # Server actions (CRUD + audit trail)
|   +-- billing/                  # Stripe + token billing + plans
|   +-- cache/                    # Redis client + semantic cache
|   +-- comments/                 # Threaded commenting actions
|   +-- docgen/                   # Doc generation (PPTX, DOCX, XLSX)
|   +-- integrations/             # External service adapters
|   |   +-- salesforce/           # Salesforce CRM sync
|   |   +-- govwin/               # GovWin opportunity feed
|   |   +-- m365/                 # Microsoft 365 integration
|   |   +-- google/               # Google Workspace integration
|   |   +-- docusign/             # DocuSign e-signature
|   |   +-- slack/                # Slack notifications
|   |   +-- fpds/                 # Federal Procurement Data System
|   |   +-- usaspending/          # USAspending.gov data
|   |   +-- sam-gov.ts            # SAM.gov entity validation
|   +-- logging/                  # Structured logging + correlation IDs
|   +-- migration/                # Data migration utilities
|   +-- monitoring/               # Health checks + web vitals
|   +-- playbook/                 # Shipley playbook engine
|   +-- proposals/                # Proposal lifecycle helpers
|   +-- rag/                      # RAG pipeline
|   |   +-- chunker.ts            # Document chunking
|   |   +-- hybrid-search.ts      # Vector + keyword hybrid search
|   |   +-- knowledge-graph.ts    # Entity-relation knowledge graph
|   |   +-- entity-extractor.ts   # Named entity extraction
|   |   +-- reranker.ts           # Result reranking
|   +-- realtime/                 # Real-time collaboration
|   |   +-- presence.ts           # User presence tracking
|   |   +-- section-lock.ts       # Pessimistic section locking
|   +-- security/                 # Security utilities
|   |   +-- rate-limiter.ts       # Redis-backed rate limiting (3 tiers)
|   |   +-- brute-force.ts        # IP + account lockout
|   |   +-- sanitize.ts           # DOMPurify XSS prevention
|   +-- sync/                     # Real-time sync engine
|   |   +-- sync-manager.ts       # Sync orchestrator
|   |   +-- conflict-resolver.ts  # OT conflict resolution
|   |   +-- diff-engine.ts        # Change diffing
|   |   +-- version-tracker.ts    # Version vector tracking
|   |   +-- coordination-engine   # Multi-user coordination
|   |   +-- sync-queue.ts         # Operation queue
|   |   +-- adapters/             # Per-entity sync adapters
|   +-- types/                    # TypeScript type definitions
|   +-- utils/                    # Shared utilities (cn(), validation, etc.)
|
+-- roles_permissions_config.json # RBAC config v9.5 (12 roles x 15 modules)
+-- middleware.ts                 # Edge middleware (CSP, rate limiting, auth)
+-- instrumentation.ts           # Sentry instrumentation hook
+-- tailwind.config.ts           # Tailwind + brand colors
+-- next.config.mjs              # Next.js configuration
+-- vitest.config.ts             # Vitest test configuration
+-- playwright.config.ts         # Playwright E2E configuration
+-- netlify.toml                 # Netlify deployment config
```

---

## 3. Request Lifecycle

Every request to MissionPulse flows through the following stages:

```
  Browser
    |
    v
+---[1. middleware.ts]----------------------------------------------+
|                                                                   |
|  1a. Generate correlation ID (x-request-id) via crypto.randomUUID|
|  1b. Generate CSP nonce via crypto.randomUUID -> base64           |
|  1c. Landing page (/) -> public, skip auth                        |
|  1d. Rate limit check (Redis-backed, tiered by route):            |
|      - strict:   5 req / 60s  (auth, password reset)              |
|      - standard: 30 req / 60s (API, forms)                        |
|      - relaxed:  100 req / 60s (health, reads)                    |
|  1e. Brute force check on POST /login, /signup:                   |
|      - IP lockout: 5 fails in 15min -> 30min block                |
|      - Account lockout: 10 fails in 1hr -> 1hr block              |
|      - Progressive delay: 4th attempt = 2s, 5th = 5s             |
|  1f. Create Supabase server client (cookie-based session)         |
|  1g. Refresh auth session via supabase.auth.getUser()             |
|  1h. Redirect unauthenticated users to /login                    |
|  1i. Redirect authenticated users away from auth pages            |
|  1j. Apply security headers (CSP + nonce + x-request-id)          |
|                                                                   |
+-------------------------------------------------------------------+
    |
    v
+---[2. app/(dashboard)/layout.tsx]---------------------------------+
|                                                                   |
|  2a. Auth Gate: supabase.auth.getUser()                           |
|      -> If no user: redirect('/login')                            |
|  2b. Profile + Role Resolution:                                   |
|      -> Query profiles table for role, name, company_id           |
|      -> Default to 'partner' (most restrictive) if missing        |
|  2c. RBAC Permission Resolution:                                  |
|      -> getRolePermissions(userRole) -> Record<module, permission> |
|      -> Fallback: deny all except dashboard on config error       |
|  2d. Security context:                                            |
|      -> isInternalRole(), hasForceCUIWatermark()                  |
|      -> getClassificationCeiling(), getSessionTimeout()           |
|  2e. Render layout:                                               |
|      -> <RoleProvider> wraps all children with role context       |
|      -> <SessionTimeoutGuard> enforces role-based timeout         |
|      -> <PartnerWatermark> for external / CUI-forced roles        |
|      -> <CUIBanner> for CUI classification marking                |
|      -> <Sidebar> filtered by permissions.shouldRender            |
|      -> <DashboardHeader> with notifications                      |
|                                                                   |
+-------------------------------------------------------------------+
    |
    v
+---[3. Page Server Component]-------------------------------------+
|                                                                   |
|  3a. createClient() -> server-side Supabase client                |
|  3b. Fetch data via Supabase queries (RLS-enforced)               |
|  3c. Pass data to client components as props                      |
|                                                                   |
+-------------------------------------------------------------------+
    |
    v
+---[4. Client Component (mutations)]------------------------------+
|                                                                   |
|  4a. User action triggers server action ('use server')            |
|  4b. Server action: createClient() -> authenticated query         |
|  4c. Mutation: INSERT/UPDATE/DELETE with RLS enforcement          |
|  4d. Dual audit trail:                                            |
|      -> audit_logs (immutable, compliance)                        |
|      -> activity_log (user-visible feed)                          |
|  4e. revalidatePath() -> refresh server component data            |
|                                                                   |
+-------------------------------------------------------------------+
```

### Public Routes (bypass auth)

The following routes skip authentication in middleware:

- `/login`, `/signup`, `/forgot-password`, `/reset-password`
- `/api/auth/callback`, `/api/health`, `/api/newsletter`
- `/plans`, `/8a-toolkit`, `/mfa`, `/accessibility`
- `/robots.txt`, `/sitemap.xml`

---

## 4. RBAC Model

MissionPulse uses an **invisible RBAC** pattern: UI components simply do not
render if the current user lacks permission. There are no "access denied" pages
or visible permission errors. The system fails closed -- if RBAC config lookup
fails, all modules except the dashboard are denied.

### 4.1 Role Hierarchy

12 roles organized by type:

| Type     | Roles                                                           |
| -------- | --------------------------------------------------------------- |
| Internal | executive, operations, capture_manager, proposal_manager,       |
|          | volume_lead, pricing_manager, contracts, hr_staffing, author    |
| External | partner, subcontractor, consultant                              |

External roles receive:
- CUI watermark overlay (`<PartnerWatermark>`)
- Scope restrictions on queries (own data only)
- Reduced session timeouts
- Forced CUI markings where required

### 4.2 Module Permissions

Each role is assigned a permission triple per module:

```typescript
interface ModulePermission {
  shouldRender: boolean   // Invisible RBAC: hide the entire module
  canView: boolean        // Read access to module data
  canEdit: boolean        // Write access to module data
  scopeRestriction?: string  // e.g., 'own_data_only'
}
```

15 modules are permissioned:

`dashboard`, `pipeline`, `proposals`, `pricing`, `strategy`, `blackhat`,
`compliance`, `workflow_board`, `ai_chat`, `documents`, `analytics`,
`admin`, `integrations`, `audit_log`, `personnel`

### 4.3 Permission Resolution Chain

```
Database role string (e.g., "CEO", "cap", "proposal_manager")
    |
    v
resolveRole(dbRole)                    # lib/rbac/config.ts
    |  - Normalizes casing/separators
    |  - Maps legacy abbreviations (ceo->executive, cap->capture_manager)
    |  - Falls back to 'partner' (most restrictive)
    v
getRolePermissions(resolved)           # Returns Record<ModuleId, ModulePermission>
    |
    v
Server: passed to Sidebar + RoleProvider as props
Client: available via useRole(), useModuleAccess(), useVisibleNav()
```

### 4.4 Key RBAC Functions

| Function                  | Location            | Purpose                                    |
| ------------------------- | ------------------- | ------------------------------------------ |
| `resolveRole()`           | `lib/rbac/config.ts`| Map DB role to canonical ConfigRoleId      |
| `getModulePermission()`   | `lib/rbac/config.ts`| Permission triple for role + module        |
| `getRolePermissions()`    | `lib/rbac/config.ts`| All module permissions for a role          |
| `getVisibleNav()`         | `lib/rbac/config.ts`| Filtered nav items (primary/secondary/admin)|
| `hasPermission()`         | `lib/rbac/config.ts`| Boolean check for specific permission      |
| `isInternalRole()`        | `lib/rbac/config.ts`| Internal vs external type check            |
| `hasForceCUIWatermark()`  | `lib/rbac/config.ts`| CUI watermark enforcement                  |
| `getClassificationCeiling()`| `lib/rbac/config.ts`| Max data classification for role         |
| `getSessionTimeout()`     | `lib/rbac/config.ts`| Role-based session duration (seconds)      |
| `getAllowedAgents()`       | `lib/rbac/config.ts`| AI agents accessible by role               |
| `getGateAuthority()`      | `lib/rbac/config.ts`| Shipley gate approval permissions          |

### 4.5 Client Hooks

| Hook                | Location            | Purpose                                      |
| ------------------- | ------------------- | -------------------------------------------- |
| `useRole()`         | `lib/rbac/hooks.ts` | Current user's resolved role + display name  |
| `useModuleAccess()` | `lib/rbac/hooks.ts` | Permission triple for a specific module      |
| `useVisibleNav()`   | `lib/rbac/hooks.ts` | Filtered navigation items for sidebar        |

All hooks fail closed: while loading, `shouldRender` / `canView` / `canEdit`
are all `false`. No content flashes before permissions resolve.

### 4.6 Configuration

Source of truth: `roles_permissions_config.json` (v9.5)

The JSON file defines per-role configuration including:
- Module permissions (shouldRender / canView / canEdit)
- UI complexity level (full, standard, simplified)
- Allowed AI agents per role
- Security settings (CUI watermark, classification ceiling, session timeout)
- Gate authority (Shipley gate approval, review trigger, override)

---

## 5. AI Pipeline

All AI operations flow through a single entry point: `aiRequest()` in
`lib/ai/pipeline.ts`. This function enforces authentication, token gating,
content classification, model selection, caching, provider routing, usage
logging, and billing in a deterministic sequence.

### 5.1 Pipeline Flow

```
User Input
    |
    v
classifyIntent(message, allowedAgents)     # lib/ai/intent-classifier.ts
    |  Deterministic regex/keyword scoring
    |  Routes to 1 of 9 domain agents
    |  Confidence threshold: 0.6 for auto-route
    v
aiRequest(options)                          # lib/ai/pipeline.ts
    |
    +--[1] Auth: supabase.auth.getUser()
    |       -> Reject if not authenticated
    |
    +--[2] Agent Access Gate
    |       -> resolveRole() -> getAllowedAgents()
    |       -> Reject if agent not in role's allowed list
    |       -> Utility tasks (chat, summarize, classify) are ungated
    |
    +--[3] Token Gate: checkTokenGate(companyId, opportunityId)
    |       -> Pre-flight budget check (company-level monthly cap)
    |       -> Return graceful fallback if limit exceeded
    |
    +--[4] classifyRequest(prompt, context)  # classification-router.ts
    |       -> Regex scan for CUI markings, PII, OPSEC indicators
    |       -> Returns: UNCLASSIFIED | CUI | CUI//SP-PROPIN | OPSEC
    |
    +--[5] selectModel(taskType, classification)  # model-selector.ts
    |       -> Task-to-model mapping (see table below)
    |       -> Budget guard: auto-downgrade at 75% spend threshold
    |       -> Force AskSage engine for CUI+ classification
    |
    +--[6] getCachedResponse(prompt, model, classification)
    |       -> Semantic cache in Redis (skip LLM if cache hit)
    |
    +--[7] routedQuery(request, classification)  # router.ts
    |       -> CUI+ -> FedRAMP providers only (AskSage)
    |       -> UNCLASSIFIED -> configurable primary/fallback
    |       -> Automatic failover on provider error
    |
    +--[8] setCachedResponse() -> store in semantic cache
    |
    +--[9] logTokenUsage() -> token_usage table
    |
    +--[10] recordTokenUsage() -> debit company token balance
    |
    v
AIResponse {
  content, model_used, engine, confidence,
  citations, tokens_in, tokens_out,
  latency_ms, classification
}
```

### 5.2 Task-to-Model Mapping

| Task Type    | Primary Model      | Fallback Model     |
| ------------ | ------------------ | ------------------ |
| `chat`       | Claude Sonnet 4.5  | Claude Haiku 4.5   |
| `strategy`   | Claude Opus 4      | Claude Sonnet 4.5  |
| `compliance` | Claude Sonnet 4.5  | Claude Haiku 4.5   |
| `capture`    | Claude Sonnet 4.5  | Claude Haiku 4.5   |
| `writer`     | Claude Opus 4      | Claude Sonnet 4.5  |
| `contracts`  | Claude Sonnet 4.5  | Claude Haiku 4.5   |
| `orals`      | Claude Opus 4      | Claude Sonnet 4.5  |
| `pricing`    | GPT-4o             | Claude Sonnet 4.5  |
| `summarize`  | Claude Haiku 4.5   | Claude Haiku 4.5   |
| `classify`   | Claude Haiku 4.5   | Claude Haiku 4.5   |

### 5.3 AI Agents

9 domain-specific agents, each located in `lib/ai/agents/`:

| Agent        | File                | Domain                                |
| ------------ | ------------------- | ------------------------------------- |
| Strategy     | `strategy.ts`       | Win themes, discriminators, SWOT      |
| Capture      | `capture.ts`        | Opportunity qualification, gate reviews|
| Compliance   | `compliance.ts`     | RFP requirement mapping, gap analysis |
| Writer       | `writer.ts`         | Proposal section drafting, editing    |
| Pricing      | `pricing.ts`        | Cost model analysis, rate optimization|
| Contracts    | `contracts.ts`      | Contract clause review, risk analysis |
| Orals        | `orals.ts`          | Oral presentation preparation         |
| Black Hat    | `blackhat.ts`       | Competitive analysis, ghost teams     |
| Parsers      | `parsers.ts`        | RFP/document parsing and extraction   |

### 5.4 CUI Data Routing

Content classification determines provider routing:

```
Classification Level   |  Allowed Providers        |  Reason
-----------------------+---------------------------+---------------------------
UNCLASSIFIED           |  AskSage, Anthropic,      |  Configurable primary
                       |  OpenAI                   |  with failover
CUI                    |  AskSage only             |  FedRAMP mandate
CUI//SP-PROPIN         |  AskSage only             |  FedRAMP mandate
OPSEC                  |  AskSage only             |  FedRAMP mandate
```

### 5.5 Budget Guard

- Monthly budget cap: configurable via `AI_MONTHLY_BUDGET_USD` (default $500)
- Warning threshold: 75% of monthly budget
- When over threshold: auto-downgrade to cheaper fallback model
- Token gate: per-company monthly limit enforced pre-flight
- All usage logged to `token_usage` table with cost estimates

### 5.6 Graceful Degradation

If the AI pipeline fails at any step, features continue to work without AI.
The response returns a user-friendly fallback message:
`"AI processing is currently unavailable. Please try again later or complete this task manually."`

---

## 6. Module Map

### 6.1 Core Modules

| Module          | Route             | Key Files                                    |
| --------------- | ----------------- | -------------------------------------------- |
| Dashboard       | `/dashboard`      | `app/(dashboard)/dashboard/page.tsx`         |
| Pipeline        | `/pipeline`       | `app/(dashboard)/pipeline/page.tsx`          |
|                 |                   | `components/dashboard/PipelineTable.tsx`     |
|                 |                   | `components/dashboard/KanbanView.tsx`        |
| Proposals       | `/proposals`      | `app/(dashboard)/proposals/page.tsx`         |
|                 |                   | `lib/proposals/`                             |
| War Room        | `/war-room`       | `app/(dashboard)/war-room/page.tsx`          |
|                 |                   | Swimlane (DnD sections by phase)             |
|                 |                   | Team management + activity log               |
| Compliance      | `/compliance`     | `app/(dashboard)/compliance/page.tsx`        |
|                 |                   | Compliance matrix + Iron Dome dashboard      |
| Strategy        | `/strategy`       | `app/(dashboard)/strategy/page.tsx`          |
| Black Hat       | `/blackhat`       | `app/(dashboard)/blackhat/page.tsx`          |
| Pricing         | `/pricing`        | `app/(dashboard)/pricing/page.tsx`           |
| Documents       | `/documents`      | `app/(dashboard)/documents/page.tsx`         |
|                 |                   | RFP shredder (PDF parse + requirement split) |
| Personnel       | `/personnel`      | `app/(dashboard)/personnel/page.tsx`         |
| Workflow        | `/workflow`        | `app/(dashboard)/workflow/page.tsx`          |

### 6.2 AI & Analytics

| Module          | Route             | Key Files                                    |
| --------------- | ----------------- | -------------------------------------------- |
| AI Chat         | `/ai`             | `app/(dashboard)/ai/page.tsx`                |
|                 |                   | `lib/ai/pipeline.ts` (entry point)           |
|                 |                   | `lib/ai/intent-classifier.ts`                |
| Analytics       | `/analytics`      | `app/(dashboard)/analytics/page.tsx`         |
|                 |                   | `lib/analytics/`                             |

### 6.3 Administration

| Module          | Route             | Key Files                                    |
| --------------- | ----------------- | -------------------------------------------- |
| Admin           | `/admin`          | `app/(dashboard)/admin/page.tsx`             |
| Audit Log       | `/audit`          | `app/(dashboard)/audit/page.tsx`             |
| Integrations    | `/integrations`   | `app/(dashboard)/integrations/page.tsx`      |
|                 |                   | `lib/integrations/` (per-service adapters)   |
| Settings        | `/settings`       | `app/(dashboard)/settings/page.tsx`          |
| Notifications   | `/notifications`  | `app/(dashboard)/notifications/page.tsx`     |

### 6.4 Additional Modules

| Module               | Route                | Purpose                           |
| -------------------- | -------------------- | --------------------------------- |
| Playbook             | `/playbook`          | Shipley capture playbook          |
| Past Performance     | `/past-performance`  | Past performance database         |
| Partners             | `/partners`          | Teaming partner management        |
| Subcontractors       | `/subcontractors`    | Subcontractor management          |
| Win/Loss             | `/win-loss`          | Win/loss analysis + debriefs      |
| Debriefs             | `/debriefs`          | Post-submission debriefs          |
| Capacity             | `/capacity`          | Resource capacity planning        |
| Reports              | `/reports`           | Report generation                 |
| Feedback             | `/feedback`          | User feedback collection          |
| Help                 | `/help`              | In-app documentation              |

---

## 7. Real-time Architecture

MissionPulse uses Supabase Realtime for multi-user collaboration. Two
subsystems work together: **presence tracking** and **section locking**.

### 7.1 Presence Tracking

File: `lib/realtime/presence.ts`

Tracks which users are viewing or editing an opportunity in real time.

```
joinPresenceChannel(opportunityId, user, onSync)
    |
    v
Supabase Channel: "presence:opportunity:{id}"
    |  config: { presence: { key: userId } }
    |
    +-- on('presence', 'sync') -> aggregate user list -> onSync(users)
    +-- channel.track(PresenceUser) on SUBSCRIBED
    |
    v
PresenceUser {
  userId, userName, avatarUrl,
  sectionId,                    // which section they're viewing
  status: 'viewing' | 'editing',
  lastSeen: ISO timestamp
}
```

Functions:
- `joinPresenceChannel()` -- subscribe to presence, returns cleanup function
- `updatePresence()` -- update section or status (e.g., viewing -> editing)
- `getPresenceUsers()` -- snapshot of currently present users

### 7.2 Section Locking

File: `lib/realtime/section-lock.ts`

Pessimistic locking prevents concurrent edits to the same proposal section.

```
joinLockChannel(opportunityId, onUpdate)
    |
    v
Supabase Channel: "locks:opportunity:{id}"
    |
    +-- on('broadcast', 'lock_acquired')  -> add lock to Map
    +-- on('broadcast', 'lock_released')  -> remove lock from Map
    +-- on('broadcast', 'lock_expired')   -> remove stale lock
    |
    v
SectionLock {
  sectionId, userId, userName,
  lockedAt: ISO timestamp,
  expiresAt: ISO timestamp        // 30 minutes from acquisition
}
```

Lock lifecycle:
1. `acquireLock()` -- attempt to acquire; fails if locked by another user
   (unless lock has expired)
2. `extendLock()` -- heartbeat to extend TTL while user is actively editing
3. `releaseLock()` -- explicit release (only lock holder can release)
4. `isLockedByOther()` -- check if section is locked by a different user

Auto-expiry:
- Lock TTL: 30 minutes (`LOCK_TTL_MS = 30 * 60 * 1000`)
- Stale lock cleanup runs every 60 seconds via `setInterval`
- Expired locks are broadcast as `lock_expired` events to all participants

### 7.3 Sync Engine

Directory: `lib/sync/`

For deeper collaboration beyond presence and locking:

| File                     | Purpose                                       |
| ------------------------ | --------------------------------------------- |
| `sync-manager.ts`        | Orchestrates sync operations                  |
| `conflict-resolver.ts`   | Operational transform conflict resolution     |
| `diff-engine.ts`         | Change detection and diffing                  |
| `version-tracker.ts`     | Version vector tracking                       |
| `coordination-engine.ts` | Multi-user coordination rules                 |
| `sync-queue.ts`          | Operation queue for ordered application       |
| `adapters/`              | Per-entity sync adapters                      |

---

## 8. Security Architecture

### 8.1 Content Security Policy (CSP)

Generated per-request in `middleware.ts` with a unique nonce:

```
default-src:  'self'
script-src:   'self' 'nonce-{random}' 'unsafe-inline'
              (+ 'unsafe-eval' in development only)
style-src:    'self' 'unsafe-inline'
              (required by Tailwind + shadcn)
img-src:      'self' data: blob: {supabase}/storage Gravatar
font-src:     'self' fonts.gstatic.com
connect-src:  'self' {supabase} api.asksage.ai api.sam.gov *.sentry.io
frame-ancestors: 'none'
object-src:   'none'
base-uri:     'self'
form-action:  'self'
upgrade-insecure-requests
```

CSP violation reports are sent to Sentry via `report-uri` when configured.

### 8.2 Rate Limiting

File: `lib/security/rate-limiter.ts`

Redis-backed (Upstash) distributed rate limiting using sliding window algorithm.
Replaces in-memory Maps that are ineffective in serverless environments.

| Tier       | Limit          | Routes                                       |
| ---------- | -------------- | -------------------------------------------- |
| `strict`   | 5 req / 60s    | `/login`, `/signup`, `/api/auth/callback`,   |
|            |                | `/api/newsletter`, `/api/cron/daily`         |
| `standard` | 30 req / 60s   | `/api/webhooks/stripe`, `/api/metrics`,      |
|            |                | `/api/section-versions`, integration callbacks|
| `relaxed`  | 100 req / 60s  | `/api/health`, `/api/health/detailed`        |

Fail-open policy: if Redis is unavailable, requests pass through with a
structured log warning. This prevents service outage due to cache failures.

Response headers on rate-limited requests:
- `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- `Retry-After` (on 429 responses)

IP allowlist: configurable via `RATE_LIMIT_ALLOWLIST` environment variable.

### 8.3 Brute Force Protection

File: `lib/security/brute-force.ts`

Two-level lockout with progressive delays:

```
IP-level:
  Threshold: 5 failed attempts in 15 minutes
  Lockout:   30 minutes
  Reset:     Cleared on successful login

Account-level:
  Threshold: 10 failed attempts in 1 hour
  Lockout:   1 hour
  Reset:     Decays by TTL only (not reset on success)

Progressive delays (server-side sleep):
  4th attempt: 2 second delay
  5th attempt: 5 second delay
```

Admin functions: `adminUnlockAccount(email)`, `adminUnlockIp(ip)`

### 8.4 Input Sanitization

File: `lib/security/sanitize.ts`

Three sanitization levels using DOMPurify (isomorphic -- works server and
client side):

| Function              | Use Case                        | Behavior                     |
| --------------------- | ------------------------------- | ---------------------------- |
| `sanitizeHtml()`      | Proposal sections, comments     | Strips scripts/handlers,     |
|                       |                                 | keeps safe formatting tags   |
| `sanitizeMarkdown()`  | Rendered markdown content       | Same as HTML + allows `<img>`|
| `sanitizePlainText()` | Titles, names, identifiers      | Strips ALL HTML tags         |

Allowed tags: `p`, `br`, `strong`, `em`, `h1`-`h6`, `ul`, `ol`, `li`,
`table`, `thead`, `tbody`, `tr`, `th`, `td`, `blockquote`, `pre`, `code`,
`a`, `span`, `div`, `sup`, `sub`, `hr`

### 8.5 Compliance Controls

| Control   | Standard    | Implementation                                        |
| --------- | ----------- | ----------------------------------------------------- |
| AU-9      | NIST/CMMC   | Immutable `audit_logs` table (no UPDATE/DELETE RLS)    |
| AC-3      | NIST/CMMC   | RLS on all 200 tables, RBAC permission enforcement     |
| SC-13     | NIST/CMMC   | CUI classification routing, AskSage-only for CUI data |
|           |             | CUI scrubbed from Sentry error reports                 |
|           |             | CUI watermark overlay for external roles               |

### 8.6 Session Management

- Role-based session timeouts via `getSessionTimeout(role)`
- Default: 28,800 seconds (8 hours); configurable per role
- `<SessionTimeoutGuard>` component enforces client-side timeout
- Supabase session refresh on every request via middleware

### 8.7 Monitoring

- **Sentry**: Error tracking + performance monitoring
  - Server config: `sentry.server.config.ts`
  - Edge config: `sentry.edge.config.ts`
  - Client config: `instrumentation-client.ts`
  - Instrumentation hook: `instrumentation.ts`
- **Structured logging**: `lib/logging/logger.ts` with correlation IDs
  (`lib/logging/correlation.ts`)
- **Health checks**: `lib/monitoring/health-checks.ts`
- **Web Vitals**: `lib/monitoring/web-vitals.ts`

---

## 9. Data Layer

### 9.1 Supabase Configuration

| Component        | Details                                                 |
| ---------------- | ------------------------------------------------------- |
| Project          | `djuviwarqdvlbgcfuupa`                                  |
| Tables           | 200 tables, 37 with active data                         |
| RLS              | Enabled on all tables                                   |
| Auth             | Email/password + MFA, `handle_new_user` trigger         |
| Storage          | RFP uploads, generated documents, avatars               |
| Realtime         | Presence channels + broadcast for section locking       |

### 9.2 Client Configuration

Three Supabase client variants:

| Client           | File                         | Context                        |
| ---------------- | ---------------------------- | ------------------------------ |
| Server           | `lib/supabase/server.ts`     | Server Components, Actions     |
| Browser          | `lib/supabase/client.ts`     | Client Components, hooks       |
| Admin            | `lib/supabase/admin.ts`      | Service-role (bypasses RLS)    |

Additional:
- `lib/supabase/sync-client.ts` -- real-time sync operations
- `lib/supabase/query-utils.ts` -- query builder utilities

### 9.3 Type System

Types are auto-generated from the Supabase schema:

```
lib/supabase/database.types.ts    # Auto-generated (351KB)
    |
    v
lib/types/index.ts                # Re-exports derived types
lib/types/opportunities.ts        # Domain types for pipeline
lib/types/*.ts                    # Per-domain type definitions
```

Convention: types are always derived from `Database['public']['Tables']`.
The codebase has zero `as any` casts.

### 9.4 Dual Audit Trail

Every mutation writes to two tables:

| Table          | Purpose                    | Retention        | Mutability      |
| -------------- | -------------------------- | ---------------- | --------------- |
| `audit_logs`   | Compliance (NIST AU-9)     | Permanent        | Immutable       |
| `activity_log` | User-visible activity feed | Configurable     | Append-only     |

Server actions in `lib/actions/` enforce this dual-write pattern for all
CRUD operations.

### 9.5 Redis (Upstash)

File: `lib/cache/redis.ts`

| Use Case         | Key Pattern                     | TTL              |
| ---------------- | ------------------------------- | ---------------- |
| Rate limiting    | `ratelimit:{tier}:{id}`         | Sliding window   |
| Brute force      | `brute:ip:{ip}`                 | 15 min           |
| IP lockout       | `brute:ip:lock:{ip}`            | 30 min           |
| Account lockout  | `brute:acct:lock:{email}`       | 1 hour           |
| Semantic cache   | Prompt hash -> response         | Configurable     |
| Token billing    | Company token counters          | Monthly reset    |

### 9.6 Document Generation

Directory: `lib/docgen/`

Server-side document generation for proposal exports:

| Engine           | File               | Output Format                      |
| ---------------- | ------------------ | ---------------------------------- |
| PPTX             | `pptx-engine.ts`   | PowerPoint presentations           |
| DOCX             | `docx-engine.ts`   | Word documents (proposals)         |
| XLSX             | `xlsx-engine.ts`   | Excel worksheets (pricing, data)   |
| Binder TOC       | `binder-toc.ts`    | Table of contents generation       |
| Templates        | `templates/`       | Template assets                    |

### 9.7 RAG Pipeline

Directory: `lib/rag/`

Retrieval-Augmented Generation for knowledge-based AI responses:

| Component        | File                  | Purpose                            |
| ---------------- | --------------------- | ---------------------------------- |
| Chunker          | `chunker.ts`          | Document segmentation              |
| Hybrid Search    | `hybrid-search.ts`    | Vector + keyword combined search   |
| Knowledge Graph  | `knowledge-graph.ts`  | Entity-relation graph              |
| Entity Extractor | `entity-extractor.ts` | Named entity recognition           |
| Reranker         | `reranker.ts`         | Result relevance reranking         |

### 9.8 External Integrations

Directory: `lib/integrations/`

| Integration      | Directory/File        | Purpose                            |
| ---------------- | --------------------- | ---------------------------------- |
| Salesforce       | `salesforce/`         | CRM opportunity sync               |
| GovWin           | `govwin/`             | GovCon opportunity feed            |
| Microsoft 365    | `m365/`               | Office doc integration             |
| Google Workspace | `google/`             | Drive, Docs, Calendar              |
| DocuSign         | `docusign/`           | Electronic signature               |
| Slack            | `slack/`              | Team notifications                 |
| SAM.gov          | `sam-gov.ts`          | Entity validation + exclusions     |
| USAspending      | `usaspending/`        | Federal spending data              |
| FPDS             | `fpds/`               | Federal procurement data           |
| Stripe           | `lib/billing/stripe.ts`| Subscription billing              |
