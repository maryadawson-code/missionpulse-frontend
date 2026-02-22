# MissionPulse UI/UX Flow Specification v1.0

**Purpose:** Deterministic routing, component, data, and interaction spec for every role × module combination. Feed this to Code as the single source of truth for frontend implementation.

**Source of Truth Chain:** roles_permissions_config.json v9.5 → database.types.ts → this document

---

## 1. ROUTE MAP

All protected routes live under `app/(dashboard)/`. Auth routes under `app/(auth)/`. Public routes under `app/(public)/`.

### 1.1 Auth Routes (No RBAC)

| Route | File | Purpose | Components |
|-------|------|---------|------------|
| `/login` | `app/(auth)/login/page.tsx` | Email/password login | `LoginForm`, Supabase Auth |
| `/signup` | `app/(auth)/signup/page.tsx` | New account creation | `SignupForm`, company wizard |
| `/auth/callback` | `app/(auth)/callback/route.ts` | OAuth code exchange | Server route handler |
| `/forgot-password` | `app/(auth)/forgot-password/page.tsx` | Password reset request | `ResetForm` |

**Auth Flow:**
```
Browser → middleware.ts (check session)
  ├─ No session + /dashboard/* → redirect /login
  ├─ Valid session + /login → redirect /dashboard
  └─ Valid session + /dashboard/* → refresh cookie, continue
```

### 1.2 Dashboard Routes (RBAC-Protected)

Every route below is wrapped in `<RBACGate module="MODULE_KEY">`. If `shouldRender=false` for the user's role, the component returns `null` — no redirect, no error, no DOM element.

| Module Key | Route | File | Primary Table(s) |
|------------|-------|------|-------------------|
| `dashboard` | `/dashboard` | `app/(dashboard)/page.tsx` | `opportunities`, `profiles`, `activity_log` |
| `pipeline` | `/dashboard/pipeline` | `app/(dashboard)/pipeline/page.tsx` | `opportunities` |
| `pipeline` | `/dashboard/pipeline/[id]` | `app/(dashboard)/pipeline/[id]/page.tsx` | `opportunities`, `opportunity_assignments` |
| `pipeline` | `/dashboard/pipeline/[id]/war-room` | `app/(dashboard)/pipeline/[id]/war-room/page.tsx` | `opportunity_comments`, `proposal_sections` |
| `proposals` | `/dashboard/proposals` | `app/(dashboard)/proposals/page.tsx` | `proposal_outlines`, `proposal_outline_volumes` |
| `proposals` | `/dashboard/proposals/[id]` | `app/(dashboard)/proposals/[id]/page.tsx` | `volume_sections`, `proposal_sections` |
| `pricing` | `/dashboard/pricing` | `app/(dashboard)/pricing/page.tsx` | `opportunity_boe`, `labor_categories` |
| `strategy` | `/dashboard/strategy` | `app/(dashboard)/strategy/page.tsx` | `opportunities` (pwin, discriminators) |
| `blackhat` | `/dashboard/blackhat` | `app/(dashboard)/blackhat/page.tsx` | `competitor_analysis` |
| `compliance` | `/dashboard/compliance` | `app/(dashboard)/compliance/page.tsx` | `opportunity_compliance`, `compliance_requirements` |
| `workflow_board` | `/dashboard/workflow` | `app/(dashboard)/workflow/page.tsx` | `proposal_sections` (status column) |
| `ai_chat` | `/dashboard/ai-chat` | `app/(dashboard)/ai-chat/page.tsx` | `ai_interactions`, `knowledge_embeddings` |
| `documents` | `/dashboard/documents` | `app/(dashboard)/documents/page.tsx` | `documents` |
| `analytics` | `/dashboard/analytics` | `app/(dashboard)/analytics/page.tsx` | `opportunities`, `activity_log`, `ai_interactions` |
| `admin` | `/dashboard/admin` | `app/(dashboard)/admin/page.tsx` | `profiles`, `companies`, `subscription_plans` |
| `integrations` | `/dashboard/integrations` | `app/(dashboard)/integrations/page.tsx` | `integration_configs` |
| `audit_log` | `/dashboard/audit` | `app/(dashboard)/audit/page.tsx` | `audit_logs` |

### 1.3 Public Routes (No Auth)

| Route | File | Purpose |
|-------|------|---------|
| `/` | `app/page.tsx` | Landing / redirect |
| `/pricing` | `app/(public)/pricing/page.tsx` | Pricing tiers |
| `/8a-toolkit` | `app/(public)/8a-toolkit/page.tsx` | 8(a) landing page |

---

## 2. LAYOUT & SHELL ARCHITECTURE

### 2.1 Dashboard Layout

```
app/(dashboard)/layout.tsx (Server Component)
├── Fetches: profiles table → user role, company_id, full_name
├── Provides: <RoleContext.Provider value={{ role, permissions, profile }}>
├── Renders:
│   ├── <Sidebar>                    ← Filters nav items by shouldRender
│   │   ├── MMT Logo
│   │   ├── NavItem[] (filtered)     ← Only modules where shouldRender=true
│   │   ├── User badge (name + role)
│   │   └── Logout button
│   └── <main>
│       ├── <Suspense fallback={<LoadingSkeleton />}>
│       │   └── {children}           ← Module page content
│       └── </Suspense>
└── Error boundary: app/(dashboard)/error.tsx
```

### 2.2 Sidebar Navigation Config

```typescript
// lib/nav-config.ts
export const NAV_ITEMS: NavItem[] = [
  { module: 'dashboard',      label: 'Command Center', icon: LayoutDashboard, href: '/dashboard' },
  { module: 'pipeline',       label: 'Pipeline',       icon: GitBranch,       href: '/dashboard/pipeline' },
  { module: 'proposals',      label: 'Proposals',      icon: FileText,        href: '/dashboard/proposals' },
  { module: 'pricing',        label: 'Pricing',        icon: DollarSign,      href: '/dashboard/pricing',        cuiBanner: true },
  { module: 'strategy',       label: 'Strategy',       icon: Target,          href: '/dashboard/strategy' },
  { module: 'blackhat',       label: 'Black Hat',      icon: Shield,          href: '/dashboard/blackhat',       cuiBanner: true },
  { module: 'compliance',     label: 'Compliance',     icon: CheckSquare,     href: '/dashboard/compliance' },
  { module: 'workflow_board', label: 'Workflow',       icon: Columns,         href: '/dashboard/workflow' },
  { module: 'ai_chat',        label: 'AI Chat',        icon: Bot,             href: '/dashboard/ai-chat' },
  { module: 'documents',      label: 'Documents',      icon: FolderOpen,      href: '/dashboard/documents' },
  { module: 'analytics',      label: 'Analytics',      icon: BarChart3,       href: '/dashboard/analytics' },
  { module: 'admin',          label: 'Admin',          icon: Settings,        href: '/dashboard/admin' },
  { module: 'integrations',   label: 'Integrations',   icon: Plug,            href: '/dashboard/integrations' },
  { module: 'audit_log',      label: 'Audit Log',      icon: ScrollText,      href: '/dashboard/audit' },
];
```

### 2.3 RBAC Gate Component

```typescript
// lib/rbac/gate.tsx
// Returns null (not a redirect, not an error) when shouldRender=false
export function RBACGate({ module, children, requiredPermission = 'canView' }) {
  const { permissions } = usePermissions();
  const perm = permissions[module];
  if (!perm?.shouldRender) return null;              // Invisible RBAC
  if (requiredPermission === 'canEdit' && !perm.canEdit) return null;
  return <>{children}</>;
}
```

### 2.4 CUI Banner Component

Renders on `pricing` and `blackhat` modules when `forceCUIWatermark=true` in role config.

```
┌─────────────────────────────────────────────────────────┐
│ ⚠ CUI//SP-PROPIN — CONTROLLED UNCLASSIFIED INFORMATION │
│ All data on this page is handled via AskSage (FedRAMP)  │
└─────────────────────────────────────────────────────────┘
```

---

## 3. ROLE-BY-ROLE UI/UX FLOWS

For each role: visible sidebar items → per-module screen spec → user actions → data mutations → state transitions.

---

### 3.1 EXECUTIVE (role: `executive`)

**UI Complexity:** `admin` (all nav items visible, admin settings, analytics)
**Sidebar Items (12):** Command Center, Pipeline, Proposals, Pricing, Strategy, Black Hat, Compliance, Workflow, AI Chat, Documents, Admin, Integrations, Audit Log *(Analytics not visible as canEdit=false but canView=true — shouldRender=true)*

> Actually all 14 modules have shouldRender=true for executive. That means 14 sidebar items.

**Sidebar Items (14):** All modules visible.

#### Screen: Command Center (`/dashboard`)

```
┌─────────────────────────────────────────────────────────────────┐
│ COMMAND CENTER                                            [role]│
├─────────┬─────────┬─────────┬─────────┬─────────────────────────┤
│ Active  │Pipeline │Compliance│Upcoming │ Recent Activity Feed   │
│Pursuits │ Value   │ Health  │Deadlines│ (real-time via Realtime)│
│   12    │ $45.2M  │  94%    │ 3 due   │ • Jane submitted V1    │
│         │         │         │ this wk │ • AI scored pWin 72%   │
└─────────┴─────────┴─────────┴─────────┴─────────────────────────┘
```

**Data Sources:**
| Widget | Query | Table | Columns |
|--------|-------|-------|---------|
| Active Pursuits | `count(*)` WHERE status='active' | `opportunities` | `status` |
| Pipeline Value | `sum(ceiling)` WHERE status='active' | `opportunities` | `ceiling` |
| Compliance Health | `count(status='compliant') / count(*)` | `opportunity_compliance` | `status` |
| Upcoming Deadlines | `ORDER BY submission_date ASC LIMIT 5` | `opportunities` | `submission_date`, `title` |
| Recent Activity | `ORDER BY created_at DESC LIMIT 20` | `activity_log` | `action`, `user_id`, `created_at` |

**Actions Available (canEdit modules):** Pipeline (CRUD opportunities), Proposals (CRUD), Strategy (edit discriminators), Black Hat (trigger analysis), Workflow (manage tasks), AI Chat (all 8 agents), Documents (CRUD), Admin (user management), Integrations (configure)

#### Screen: Pipeline (`/dashboard/pipeline`)

**Views:** Table (default) | Kanban (toggle via `?view=kanban`)

**Table View Columns:**
| Column | DB Field | Sortable | Filterable |
|--------|----------|----------|------------|
| Title | `opportunities.title` | ✓ | ✓ (text) |
| Agency | `opportunities.agency` | ✓ | ✓ (select) |
| Ceiling | `opportunities.ceiling` | ✓ | ✓ (range) |
| pWin | `opportunities.pwin` | ✓ | ✓ (range) |
| Phase | `opportunities.phase` | ✓ | ✓ (select) |
| Owner | `profiles.full_name` via `opportunities.owner_id` | ✓ | ✓ (select) |
| Due Date | `opportunities.submission_date` | ✓ | ✓ (date range) |
| Status | `opportunities.status` | ✓ | ✓ (select) |

**Kanban Columns:** One per Shipley `phase` value. Cards show title, agency, ceiling, pWin badge, due date.

**Actions:**
| Action | Trigger | Mutation | Server Action |
|--------|---------|----------|---------------|
| Create Opportunity | "New Opportunity" button | INSERT `opportunities` | `createOpportunity()` |
| Edit Opportunity | Click row → detail page | UPDATE `opportunities` | `updateOpportunity()` |
| Change Phase (Kanban) | Drag card to new column | UPDATE `opportunities.phase` | `updateOpportunityPhase()` |
| Delete/Archive | Menu → Delete | UPDATE `opportunities.status='archived'` | `archiveOpportunity()` |
| Go/No-Go | War Room → Gate button | UPDATE `opportunities.phase` + INSERT `audit_logs` | `approveGate()` |

#### Screen: Pipeline Detail (`/dashboard/pipeline/[id]`)

**Tabs:** Overview | Team | Timeline | Documents

**Overview Tab:**
- All `opportunities` fields displayed (read: always, edit: inline click-to-edit)
- pWin badge with color (0-30 red, 31-60 amber, 61-100 green)
- Activity log sidebar (last 50 from `opportunity_comments` + `activity_log`)

**Team Tab:**
- `opportunity_assignments` table: assignee_name, role, assignee_email
- CRUD: Add/remove team members (Server Action `updateTeam()`)

**War Room Sub-route (`/dashboard/pipeline/[id]/war-room`):**
- Real-time activity feed (Supabase Realtime on `opportunity_comments`)
- Section ownership table (from `proposal_sections`)
- Volume progress bars (% of sections in 'final' status)
- Deadline countdown timer
- Gate approval buttons (executive can approve gate1, gold, submit)

#### Screen: Admin (`/dashboard/admin`)

**Only `executive` sees this.**

**Sub-sections:**
| Section | Data | Actions |
|---------|------|---------|
| User Management | `profiles` table | CRUD users, assign roles |
| Company Settings | `companies` table | Edit company details |
| Subscription | `company_subscriptions` | View/manage plan |
| System Health | `/api/health` endpoint | View DB/Auth/AI status |

---

### 3.2 OPERATIONS (role: `operations`)

**UI Complexity:** `advanced` (analytics visible, no admin)
**Sidebar Items (13):** All except Admin (shouldRender=false for admin)

#### Unique Screen Behaviors

**Command Center:** Same widgets as Executive + team workload heatmap

**Pipeline:** Full CRUD. Can assign Capture Managers to opportunities.

**Pricing:** Full VE access. Sees CUI//SP-PROPIN banner + watermark. Routes through AskSage only.

**Black Hat:** Full VE access. Sees CUI//OPSEC banner. Can trigger Black Hat Agent.

**Workflow Board:** Primary owner. Manages color team assignments:
```
Pipeline → Select Opportunity → Workflow Board
┌──────────┬──────────┬──────────┬──────────┐
│  DRAFT   │  REVIEW  │ REVISION │  FINAL   │
├──────────┼──────────┼──────────┼──────────┤
│ Tech V1  │ Mgmt V1  │          │ PP V3    │
│ [Author] │ [VL:Kim] │          │ [VL:Pat] │
│ Due: 3/1 │ Due: 3/3 │          │ ✓ Done   │
└──────────┴──────────┴──────────┴──────────┘
```

**Data:** `proposal_sections` table. Columns: `section_title`, `status` (draft/review/revision/final), `assigned_to`, `volume_id`.

**Drag-and-drop:** UPDATE `proposal_sections.status` via Server Action `updateSectionStatus()`.

**Analytics (view-only):** Charts from `opportunities` (pipeline funnel), `activity_log` (team activity), `ai_interactions` (token usage).

---

### 3.3 CAPTURE MANAGER (role: `capture_manager`)

**UI Complexity:** `advanced`
**Sidebar Items (10):** Command Center, Pipeline, Proposals, Strategy, Black Hat, Compliance, Workflow, AI Chat, Documents, Analytics
**NOT visible:** Pricing, Admin, Integrations, Audit Log

#### Journey: New Opportunity Discovery → Capture Plan → Gate 1

**Step 1: Pipeline Scan**
```
Route: /dashboard/pipeline
Action: Filter by agency (DHA, VA), set_aside (SDVOSB), ceiling range
Query: SELECT * FROM opportunities WHERE agency IN (...) AND status = 'active'
        ORDER BY submission_date ASC
```

**Step 2: Create/Edit Opportunity**
```
Route: /dashboard/pipeline (modal) or /dashboard/pipeline/[id]
Action: Fill opportunity fields, set initial pWin
Mutation: INSERT/UPDATE opportunities
Fields: title, agency, ceiling, naics_code, set_aside, submission_date,
         contact_name, contact_email, description, pwin (initial estimate)
```

**Step 3: AI Capture Plan**
```
Route: /dashboard/ai-chat
Context: Opportunity selected in sidebar context picker
Agent: Capture Agent (Sonnet 4.5)
Trigger: "Generate capture plan for [opportunity.title]"
Input: opportunity record + SAM.gov data (if integrated)
Output: Win themes, discriminators, pWin with source citations, 'Because' statements
Classification: Server-side DLP scan → route to AskSage if CUI detected
Audit: INSERT ai_interactions (model, tokens, confidence, user_action)
```

**Step 4: RFP Shredding**
```
Route: /dashboard/compliance
Action: Upload RFP PDF (Sections L/M/C)
Process: Compliance Agent (Sonnet 4.5) parses in < 5 min
Output: compliance_requirements table populated (SHALL/MUST items extracted)
         opportunity_compliance records created per requirement
Display: Compliance matrix with tracked-changes highlighting
```

**Step 5: Strategy Development**
```
Route: /dashboard/strategy
Display: Discriminators list, Section M evaluation criteria, win themes
Agent: Strategy Agent (Opus 4.5) via AskSage
Action: Edit discriminators, align to Section M
Mutation: UPDATE opportunities (discriminators JSONB field)
```

**Step 6: Black Hat Analysis**
```
Route: /dashboard/blackhat
CUI: OPSEC classification → AskSage only → CUI banner displayed
Agent: Black Hat Agent (GPT-4o via AskSage)
Action: Select competitors → generate ghost strategies
Output: Competitor scorecard, counter-tactics
Display: XLSX export capability
Audit: All access logged to audit_logs
```

**Step 7: Gate 1 Approval**
```
Route: /dashboard/pipeline/[id]/war-room
Action: Present capture package to Executive
Display: Go/No-Go decision panel with pWin, competitive landscape, solution fit
Gate: capture_manager can trigger review (gateAuthority.canTriggerReview=true)
       but CANNOT approve (canApprove=['gate1','blue','red'] — not 'gold' or 'submit')
Mutation: UPDATE opportunities.phase + INSERT audit_logs
```

**Step 8: Orals Prep (if applicable)**
```
Route: /dashboard/ai-chat
Agent: Orals Agent (Opus 4.5 via AskSage)
Action: Generate 15+ evaluator Q&A, speaker notes
Output: PPTX export for orals deck
```

---

### 3.4 PROPOSAL MANAGER (role: `proposal_manager`)

**UI Complexity:** `standard`
**Sidebar Items (7):** Command Center, Pipeline, Proposals, Compliance, Workflow, AI Chat, Documents
**NOT visible:** Pricing, Strategy, Black Hat, Analytics, Admin, Integrations, Audit Log

#### Journey: Proposal Kickoff → Volume Assignment → Color Teams → Assembly

**Step 1: Create Proposal from Opportunity**
```
Route: /dashboard/proposals
Action: "New Proposal" → select linked opportunity from dropdown
Mutation: INSERT proposal_outlines (opportunity_id, outline_name, volume_type)
          INSERT proposal_outline_volumes (opportunity_id, title, volume_number)
Fields: proposal_outlines.outline_name, .volume_type, .status
```

**Step 2: Volume Structure**
```
Route: /dashboard/proposals/[id]
Display: Volumes list (Tech, Management, Past Performance, Cost)
         Each volume → sections list from volume_sections
Action: Create sections, assign to Volume Leads
Mutation: INSERT volume_sections (volume_id, section_title, section_number,
          assigned_to, page_allocation, rfp_reference)
```

**Step 3: Schedule Management**
```
Route: /dashboard/workflow
Display: Swimlane board filtered to current proposal
Columns: Draft → Review → Revision → Final
Cards: One per proposal_section (section_title, assigned_to, status, due date)
Action: Set deadlines, assign reviewers
Mutation: UPDATE proposal_sections (status, assigned_to, deadline)
```

**Step 4: Compliance Monitoring (Iron Dome)**
```
Route: /dashboard/compliance (canEdit=true)
Display: Full compliance matrix
         Every SHALL/MUST from RFP → mapped to proposal section → status
Query: SELECT cr.*, oc.status, oc.gap_description
       FROM compliance_requirements cr
       LEFT JOIN opportunity_compliance oc ON cr.id = oc.requirement_id
       WHERE cr.opportunity_id = [current]
Action: Mark requirements as compliant/non-compliant/gap
Mutation: UPDATE opportunity_compliance (status, gap_description, remediation_plan)
```

**Step 5: Color Team Facilitation**
```
Route: /dashboard/workflow
Action: Move sections through color team gates
States: draft → pink_review → revision → green_review → red_review → final
Mutation: UPDATE proposal_sections.status
AI: Writer Agent available for section drafting
    Compliance Agent for cross-reference checking
    Contracts Agent for FAR/DFARS feedback
```

**Step 6: Launch Control (Assembly)**
```
Route: /dashboard/proposals/[id] → Launch tab
Display: Pre-submission checklist
         - All SHALLs mapped: ✓/✗
         - All sections in 'final' status: ✓/✗
         - Page count within limits: ✓/✗
         - CUI portion markings verified: ✓/✗
Action: "Assemble Binder" → generates ZIP (all volumes as DOCX/PDF)
Mutation: UPDATE proposal_outlines.status = 'submitted'
          INSERT audit_logs (action: 'proposal_submitted')
```

---

### 3.5 VOLUME LEAD (role: `volume_lead`)

**UI Complexity:** `standard`
**Sidebar Items (7):** Command Center, Proposals, Strategy (view-only), Compliance (view-only), Workflow, AI Chat, Documents
**NOT visible:** Pipeline, Pricing, Black Hat, Analytics, Admin, Integrations, Audit Log

#### Journey: Assignment → AI Draft → Review → Color Team → Final

**Step 1: View Assignments**
```
Route: /dashboard (Command Center — shows assigned sections only)
       /dashboard/workflow (filtered to own assignments)
Query: SELECT * FROM volume_sections WHERE assigned_to = [current_user_id]
       JOIN proposal_outline_volumes ON volume_sections.volume_id = volumes.id
Display: Section cards with title, due date, status, page allocation
```

**Step 2: Read Strategy Context (view-only)**
```
Route: /dashboard/strategy
Permission: canView=true, canEdit=false
Display: Win themes, discriminators, Section M alignment (READ ONLY)
         No edit buttons rendered. No form modals available.
```

**Step 3: AI-Assisted Drafting**
```
Route: /dashboard/ai-chat
Context: Select section from dropdown (scoped to assigned sections)
Agent: Writer Agent (Sonnet 4.5)
Action: "Draft section [section_title] for [opportunity.title]"
Input: Section requirements from compliance_requirements (view-only)
       Win themes from strategy context
       Company past performance from knowledge_embeddings (pgvector)
Output: Track-changes draft with confidence levels (High/Med/Low)
        Source citations + 'Because' statements
        "AI GENERATED — REQUIRES HUMAN REVIEW" disclaimer
UI: Side-by-side view: AI draft on left, edit panel on right
    Per-paragraph accept/reject/modify buttons
```

**Step 4: Playbook Search**
```
Route: /dashboard/ai-chat
Action: Search company Playbook for past proposals, boilerplate
Query: pgvector similarity search on knowledge_embeddings
       WHERE metadata->>'type' = 'past_performance' OR 'capability'
Display: Relevant excerpts with similarity score
Action: "Insert into section" → copies to draft
```

**Step 5: Color Team Response**
```
Route: /dashboard/workflow
Display: Section card moves Draft → Review → Revision → Final
         Comments from reviewers appear on section card
Action: Accept/address reviewer comments
        Upload revised section content
Mutation: UPDATE volume_sections (content_notes, status)
          UPDATE proposal_sections.status
```

**Step 6: Final Polish**
```
Route: /dashboard/ai-chat
Agent: Writer Agent → "Polish executive summary for [section]"
Action: Review AI output, accept changes, mark section as 'final'
Mutation: UPDATE volume_sections.status = 'final'
          UPDATE proposal_sections.status = 'final'
```

---

### 3.6 PRICING MANAGER (role: `pricing_manager`)

**UI Complexity:** `standard`
**CUI:** SP-PROPIN (forced watermark, AskSage only)
**Sidebar Items (7):** Command Center, Proposals (view-only), Pricing, Compliance (view-only), Workflow, AI Chat, Documents
**NOT visible:** Pipeline, Strategy, Black Hat, Analytics, Admin, Integrations, Audit Log

#### CUI Environment Rules

```
EVERY PAGE for this role:
1. CUI//SP-PROPIN banner at top (amber background)
2. Watermark overlay (company name + timestamp, 45° diagonal, 15% opacity)
3. All AI requests route through AskSage ONLY (FedRAMP High)
4. No data cached in Redis for this role
5. Export restricted: forceCUIWatermark=true, canExportCUI=true (exec approval)
6. Session timeout: 14400 seconds (4 hours)
```

#### Journey: LCAT Config → BOE → Price-to-Win → Green Team → Cost Volume

**Step 1: CUI Environment Entry**
```
Route: /dashboard/pricing
Display: CUI//SP-PROPIN banner
         Watermark overlay
         Opportunity selector (scoped to assigned opportunities)
```

**Step 2: LCAT Configuration**
```
Route: /dashboard/pricing → LCAT tab
Data: labor_categories table
Display: Labor category grid
         Base rate, fringe %, overhead %, G&A %, fee %
         Wrap rate auto-calculated
Action: Add/edit LCATs, set rates
Mutation: INSERT/UPDATE labor_categories
          Server Action: updateLaborCategory()
```

**Step 3: BOE Generation**
```
Route: /dashboard/ai-chat
Context: Pricing module selected
Agent: Pricing Agent (GPT-4o via AskSage ONLY)
Action: "Generate BOE for [opportunity.title]"
Input: LCAT table, RFP requirements, period of performance
Output: Hours per LCAT per period, extended costs, assumptions
        Track-changes for review
        Confidence: ≥95% evidence threshold
Mutation: INSERT opportunity_boe records
Display: BOE spreadsheet view in pricing module
```

**Step 4: Price-to-Win**
```
Route: /dashboard/pricing → Price-to-Win tab
Agent: Pricing Agent
Action: "Run price-to-win analysis"
Output: Three scenarios (aggressive/moderate/conservative)
        Market benchmarks, competitor pricing history
Display: Comparison table with win probability per scenario
```

**Step 5: Green Team Review**
```
Route: /dashboard/workflow
Display: Cost volume section card
         Reviewer comments from finance
Action: Address comments, validate wrap rates
Mutation: UPDATE opportunity_boe, UPDATE proposal_sections.status
```

**Step 6: Cost Volume Assembly**
```
Route: /dashboard/pricing → Export tab
Action: "Assemble Cost Volume"
Output: XLSX with BOE tables, rate tables, pricing narrative
        All cells marked with CUI portion markings
        Watermarked on every page
Mutation: INSERT audit_logs (action: 'cost_volume_exported')
```

---

### 3.7 CONTRACTS (role: `contracts`)

**UI Complexity:** `standard`
**Sidebar Items (6):** Command Center, Proposals (view-only), Compliance (edit), Workflow, AI Chat, Documents
**NOT visible:** Pipeline, Pricing, Strategy, Black Hat, Analytics, Admin, Integrations, Audit Log

#### Journey: Clause Analysis → Matrix Validation → T&C Risk → Legal Review

**Step 1: Contract Scanner**
```
Route: /dashboard/compliance (canEdit=true for contracts role)
Action: Upload RFP Section I (clauses)
Agent: Contracts Agent (Sonnet 4.5)
Process: Parse all FAR/DFARS clauses
Output: opportunity_clauses records
        Each clause: clause_id, compliance_notes, status
        Risk score per clause (high/medium/low)
Display: Clause table with risk color coding
```

**Step 2: Compliance Matrix Validation**
```
Route: /dashboard/compliance
Display: Iron Dome matrix (SHALL/MUST items)
Action: Verify FAR/DFARS references are correct
        Flag non-standard clauses
        Mark each clause as reviewed/flagged
Mutation: UPDATE opportunity_clauses (status, compliance_notes)
```

**Step 3: T&C Risk Assessment**
```
Route: /dashboard/ai-chat
Agent: Contracts Agent
Action: "Analyze T&C risk for [opportunity.title]"
Output: High-risk clauses, liability gaps, IP issues, sub flow-downs
Display: Risk summary with recommended actions
```

**Step 4: Pre-Submit Legal Review**
```
Route: /dashboard/proposals (view-only) + /dashboard/compliance (edit)
Action: Review all volumes (read-only in proposals module)
        Flag legal issues via compliance module
        Verify reps & certs
Mutation: UPDATE opportunity_compliance
          INSERT audit_logs (action: 'legal_review_complete')
```

---

### 3.8 HR / STAFFING (role: `hr_staffing`)

**UI Complexity:** `standard`
**CUI:** SP-PRVCY (PII protection)
**Sidebar Items (6):** Command Center, Proposals (edit), Compliance (view-only), Workflow, AI Chat, Documents
**NOT visible:** Pipeline, Pricing, Strategy, Black Hat, Analytics, Admin, Integrations, Audit Log

**Note:** Has `personnel` module (shouldRender=true, canEdit=true) — this maps to a sub-view within Proposals or a dedicated personnel route.

#### Journey: Requirements → Resume Prep → Past Perf → Mgmt Volume

**Step 1: LCAT Requirements Review**
```
Route: /dashboard/proposals/[id] → Staffing tab
Data: labor_categories WHERE opportunity_id = [current]
Display: Required LCATs, minimum qualifications, clearance requirements
         Gap analysis: filled vs unfilled positions
```

**Step 2: Resume Preparation**
```
Route: /dashboard/ai-chat
Agent: Writer Agent (Sonnet 4.5)
Action: "Format resume for [person] to meet [RFP spec]"
Input: Raw resume (uploaded to documents), RFP personnel requirements
Output: Compliant resume (education, experience, certifications sections)
        Track-changes for review
CUI: SP-PRVCY applied (PII handling)
```

**Step 3: Past Performance Matching**
```
Route: /dashboard/ai-chat
Action: Search Playbook for relevant past performance
Query: pgvector similarity search
       WHERE metadata->>'type' = 'past_performance'
Output: Relevance summaries, staff-to-eval-criteria matches
```

**Step 4: Management Volume**
```
Route: /dashboard/proposals/[id] → Management Volume
Action: Draft org chart narrative, staffing plan
Agent: Writer Agent
Mutation: UPDATE volume_sections (management volume sections)
```

---

### 3.9 AUTHOR / SME (role: `author`)

**UI Complexity:** `simplified` (max 4 nav items, assigned_tasks default view)
**Sidebar Items (5):** Proposals, Compliance (view-only), Workflow, AI Chat, Documents
**NOT visible:** Command Center (!), Pipeline, Pricing, Strategy, Black Hat, Analytics, Admin, Integrations, Audit Log

**Critical UX Note:** Dashboard (shouldRender=false) means this role does NOT see the Command Center. Their landing page should redirect to `/dashboard/workflow` or `/dashboard/proposals` showing only assigned sections.

#### Journey: Task → Context → AI Draft → Submit

**Step 1: Landing — Assigned Tasks**
```
Route: /dashboard/workflow (default landing for simplified UI)
Display: ONLY cards assigned to current user
Query: SELECT * FROM proposal_sections WHERE assigned_to = [current_user_id]
Cards: section_title, due date, status, volume name
```

**Step 2: Read Section Requirements**
```
Route: /dashboard/compliance (canView=true, canEdit=false)
Display: Compliance requirements for assigned sections ONLY
         Win themes summary from strategy (NOT visible — read from proposal context)
         No edit controls rendered
```

**Step 3: AI-Assisted Writing**
```
Route: /dashboard/ai-chat
Allowed Agents: Writer, Compliance (2 agents only)
Context: Scoped to assigned sections
Action: "Draft section [title]"
Output: Track-changes with AI disclaimer
UI: Simplified editor — no advanced filters, no analytics panels
```

**Step 4: Submit Draft**
```
Route: /dashboard/workflow
Action: Upload draft → move card from Draft → Review
Mutation: UPDATE proposal_sections.status = 'review'
          INSERT activity_log (action: 'section_submitted')
Notification: Proposal Manager notified
```

**Step 5: Address Feedback**
```
Route: /dashboard/workflow
Display: Reviewer comments on section card
Action: Revise content, move Revision → Final when approved
Mutation: UPDATE proposal_sections.status
```

---

### 3.10 PARTNER (role: `partner`) — External

**UI Complexity:** `simplified` (scoped portal)
**Sidebar Items (4):** Command Center†, Proposals†, Workflow†, Documents†
(† = scoped to assigned opportunities only, watermarked)
**NOT visible:** Pipeline, Pricing, Strategy, Black Hat, Compliance, AI Chat, Analytics, Admin, Integrations, Audit Log

**NO AI Agents available.** `allowedAgents: []`

#### Scoping & Security

```
EVERY REQUEST for partner role:
1. RLS policy: WHERE opportunity_id IN (
     SELECT opportunity_id FROM opportunity_assignments
     WHERE assignee_email = auth.jwt()->>'email'
   )
2. Watermark on every page: [company_name] | [timestamp] | PARTNER COPY
3. Cannot see other partners' contributions (isolated)
4. Cannot see full Swimlane (only their assigned sections)
5. Auto-revoke: When proposal_outlines.status = 'submitted',
   opportunity_assignments record for this user is soft-deleted
6. Session timeout: 3600 seconds (1 hour)
```

#### Journey: Portal Login → Section Review → Content Delivery → Auto-Revoke

**Step 1: Scoped Dashboard**
```
Route: /dashboard
Display: ONLY assigned opportunities (1-3 typically)
         Watermark overlay on all content
         No pipeline value, no compliance health (not available)
Widgets: Assigned sections count, due dates only
```

**Step 2: View Assigned Sections**
```
Route: /dashboard/proposals/[id] (scoped)
Display: Only sections assigned to this partner
         Cannot see other volume sections
         Compliance excerpt for their work only
```

**Step 3: Content Delivery**
```
Route: /dashboard/documents
Action: Upload assigned section content
        All uploads auto-watermarked
Mutation: INSERT documents (watermarked, partner scope)
          UPDATE proposal_sections.status = 'review'
```

**Step 4: Status Updates**
```
Route: /dashboard/workflow (scoped)
Display: Only their section cards
Action: Move Draft → Review
Cannot: See full board, see other team's tasks
```

**Step 5: Auto-Revoke on Submission**
```
Trigger: proposal_outlines.status changes to 'submitted'
Action: Database trigger soft-deletes opportunity_assignments for partner
        Active sessions invalidated
        Audit log entry: 'partner_access_revoked'
Timing: < 1 minute from submission
```

---

### 3.11 SUBCONTRACTOR (role: `subcontractor`) — External

**UI Complexity:** `simplified` (scoped portal)
**Sidebar Items (4):** Command Center†, Proposals†, Workflow†, Documents† (edit)
**Identical to Partner** except: Documents has canEdit=true (can upload directly)
**NO AI Agents.** Same scoping, watermarking, and auto-revoke as Partner.

**Key Difference:** Subcontractor can EDIT documents (upload technical content, resumes, letters of commitment). Partner can only view documents.

---

### 3.12 CONSULTANT (role: `consultant`) — External

**UI Complexity:** `simplified`
**Sidebar Items (6):** Command Center†, Proposals (view), Strategy (view), Compliance (view), AI Chat (edit), Documents (view)
**NOT visible:** Pipeline, Pricing, Black Hat, Workflow, Analytics, Admin, Integrations, Audit Log

**1 AI Agent:** Writer (advisory mode only)
**Time-Limited:** 30-day access window (configurable). Expiration countdown visible.

#### Journey: Time-Limited Entry → Strategy Review → Advisory → Deliverables → Auto-Expire

**Step 1: Time-Limited Entry**
```
Route: /dashboard
Display: Expiration countdown: "Access expires in X days"
         Assigned opportunities only (scopeRestriction)
         Watermarked content
```

**Step 2: Strategy Review (read-only)**
```
Route: /dashboard/strategy
Permission: canView=true, canEdit=false
Display: Win themes, discriminators, competitive positioning
         NO edit buttons, NO form modals
```

**Step 3: Advisory via AI Chat**
```
Route: /dashboard/ai-chat (canEdit=true — can submit queries)
Allowed Agents: Writer (advisory mode)
Action: Ask questions, generate recommendations
Output: Advisory notes for team to review
```

**Step 4: Upload Deliverables**
```
Route: /dashboard/documents (canView=true, canEdit=false)
Note: Consultant can VIEW documents but NOT upload
      Advisory reports submitted via AI Chat or shared with team externally
```

**Step 5: Auto-Expire**
```
Trigger: current_date > consultant access_expiry date (30 days from creation)
Action: opportunity_assignments record deactivated
        Sessions terminated
        Audit log: 'consultant_access_expired'
```

---

## 4. DATA FLOW DIAGRAMS

### 4.1 Opportunity Lifecycle

```
CREATE                    UPDATE                    COMPLETE
───────                   ──────                    ────────
Pipeline                  Pipeline/Detail           War Room
  │                         │                         │
  ▼                         ▼                         ▼
INSERT opportunities     UPDATE opportunities      UPDATE opportunities
  │                         │                       phase='submitted'
  ▼                         ▼                         │
INSERT audit_logs        INSERT activity_log          ▼
  │                                                 Trigger: auto-revoke
  ▼                                                 external users
INSERT opportunity_                                    │
  assignments                                         ▼
                                                    INSERT audit_logs
```

### 4.2 Proposal Section Lifecycle (State Machine)

```
             ┌─────────┐
             │  DRAFT  │ ← Author/Volume Lead creates
             └────┬────┘
                  │ submit
                  ▼
          ┌──────────────┐
          │  PINK_REVIEW │ ← Writer Agent assists
          └──────┬───────┘
                 │ feedback
                 ▼
           ┌──────────┐
           │ REVISION  │ ← Author addresses comments
           └─────┬────┘
                 │ resubmit
                 ▼
         ┌───────────────┐
         │ GREEN_REVIEW  │ ← Pricing/Finance review (CUI)
         └───────┬───────┘
                 │ approve
                 ▼
          ┌─────────────┐
          │  RED_REVIEW  │ ← Black Hat competitive check
          └──────┬──────┘
                 │ approve
                 ▼
             ┌───────┐
             │ FINAL │ ← Ready for binder assembly
             └───────┘
```

**DB Column:** `proposal_sections.status`
**Valid Values:** `draft`, `pink_review`, `revision`, `green_review`, `red_review`, `final`
**Transitions:** Only forward (no skipping). Rejection sends back to `revision`.

### 4.3 AI Agent Request Pipeline

```
User Action (UI)
    │
    ▼
Client Component → Server Action (lib/ai/router.ts)
    │
    ▼
Classification Gate (Server-side DLP)
    ├─ CUI detected → AskSage ONLY (FedRAMP High)
    ├─ PII detected → AskSage ONLY + SP-PRVCY marking
    ├─ OPSEC detected → AskSage ONLY + additional logging
    └─ Unclassified → cost-optimal routing
                       ├─ Budget < 75% → Haiku/Flash (cheap)
                       ├─ Standard → Sonnet 4.5
                       └─ Complex → Opus 4.5
    │
    ▼
AI Provider Response
    │
    ▼
Post-Processing
    ├─ Add "AI GENERATED — REQUIRES HUMAN REVIEW"
    ├─ Attach confidence level (High/Med/Low)
    ├─ Attach source citations
    └─ Format as track-changes
    │
    ▼
INSERT ai_interactions (model, tokens_in, tokens_out, confidence,
                        classification, provider, user_id, opportunity_id)
    │
    ▼
Display in UI → User accepts/rejects/modifies per paragraph
    │
    ▼
INSERT audit_logs (action: 'ai_output_reviewed', details: {accepted, modified, rejected})
```

---

## 5. COMPONENT REGISTRY

### 5.1 Shared Components (used across modules)

| Component | Location | Used By |
|-----------|----------|---------|
| `<DataTable<T>>` | `components/ui/DataTable.tsx` | Pipeline, Compliance, Audit, Admin |
| `<FormModal>` | `components/ui/FormModal.tsx` | All CRUD operations |
| `<RBACGate>` | `lib/rbac/gate.tsx` | Every module page |
| `<CUIBanner>` | `components/layout/CUIBanner.tsx` | Pricing, Black Hat |
| `<Watermark>` | `components/layout/Watermark.tsx` | External role views |
| `<StatusBadge>` | `components/ui/StatusBadge.tsx` | Pipeline, Workflow, Proposals |
| `<EmptyState>` | `components/ui/EmptyState.tsx` | All modules (zero-data state) |
| `<LoadingSkeleton>` | `components/ui/LoadingSkeleton.tsx` | Suspense fallbacks |
| `<ActivityFeed>` | `components/features/ActivityFeed.tsx` | Dashboard, War Room |
| `<AIDisclaimer>` | `components/features/ai/AIDisclaimer.tsx` | All AI outputs |

### 5.2 Module-Specific Components

| Module | Component | Purpose |
|--------|-----------|---------|
| Pipeline | `<KanbanView>` | Drag-drop Shipley phase board |
| Pipeline | `<OpportunityCard>` | Kanban card (title, agency, pWin, deadline) |
| Pipeline | `<PipelineFilters>` | Agency, ceiling, pWin, phase filters |
| War Room | `<GateApproval>` | Go/No-Go decision panel |
| War Room | `<DeadlineCountdown>` | Timer to submission_date |
| Proposals | `<VolumeOutline>` | Volume → sections tree view |
| Proposals | `<LaunchControl>` | Pre-submission checklist |
| Pricing | `<LCATGrid>` | Labor category configuration |
| Pricing | `<BOETable>` | Basis of estimate spreadsheet view |
| Pricing | `<PriceToWin>` | Scenario comparison (3 columns) |
| Compliance | `<ComplianceMatrix>` | SHALL/MUST requirement tracker |
| Compliance | `<ClauseScanner>` | FAR/DFARS clause risk analysis |
| Workflow | `<SwimlaneBoard>` | Section-level Kanban |
| AI Chat | `<AgentSelector>` | Dropdown filtered by role's allowedAgents |
| AI Chat | `<TrackChangesView>` | Side-by-side AI output + editor |
| AI Chat | `<ConfidenceBadge>` | High/Med/Low indicator |
| Documents | `<DocumentUpload>` | File upload with watermark logic |
| Analytics | `<PipelineFunnel>` | Opportunity phase funnel chart |
| Analytics | `<TokenUsage>` | AI cost tracking chart |
| Admin | `<UserManagement>` | CRUD profiles table |
| Audit | `<AuditLogViewer>` | Immutable log viewer with filters |

---

## 6. CONDITIONAL RENDERING RULES

### 6.1 Per-Role Rendering Matrix

For Code: use this to build the sidebar filter and conditional component rendering.

```typescript
// Pseudocode for sidebar rendering
const visibleModules = NAV_ITEMS.filter(item => {
  const perm = roleConfig.modules[item.module];
  return perm.shouldRender === true;
});
```

### 6.2 Edit vs View-Only Rendering

```typescript
// Inside any module page
const { canEdit } = usePermissions().permissions[MODULE_KEY];

return (
  <>
    <DataTable data={items} />
    {canEdit && <Button onClick={openCreateModal}>New Item</Button>}
    {canEdit && <FormModal ... />}
    {/* View-only users see data but no create/edit/delete controls */}
  </>
);
```

### 6.3 CUI Conditional Rendering

```typescript
// lib/rbac/hooks.ts
function useCUIProtection(module: string) {
  const { role } = useRole();
  const config = getRoleConfig(role);
  return {
    showCUIBanner: config.security.forceCUIWatermark && ['pricing', 'blackhat'].includes(module),
    showWatermark: config.type === 'external' || config.security.forceCUIWatermark,
    classificationCeiling: config.security.classificationCeiling,
    aiRoutingRestriction: config.security.forceCUIWatermark ? 'asksage_only' : 'cost_optimal',
  };
}
```

### 6.4 External Role Scoping

```typescript
// Applied at RLS level, but also enforced in UI for defense-in-depth
function useExternalScoping() {
  const { role } = useRole();
  const isExternal = ['partner', 'subcontractor', 'consultant'].includes(role);
  return {
    isExternal,
    scopeRestriction: isExternal ? 'assigned_opportunities_only' : null,
    showWatermark: isExternal,
    autoRevokeOnSubmit: isExternal,
    sessionTimeout: isExternal ? 3600 : 28800,
  };
}
```

---

## 7. AI AGENT ROUTING TABLE

For Code: which agents are available per role, and what model/engine to use.

| Role | Allowed Agents | Black Hat? | Override AI? |
|------|---------------|------------|--------------|
| `executive` | capture, strategy, blackhat, writer, compliance, pricing, contracts, orals | ✓ | ✓ |
| `operations` | capture, strategy, blackhat, writer, compliance, pricing | ✓ | ✓ |
| `capture_manager` | capture, strategy, blackhat, writer, compliance | ✓ | ✗ |
| `proposal_manager` | writer, compliance, contracts | ✗ | ✗ |
| `volume_lead` | writer, compliance | ✗ | ✗ |
| `pricing_manager` | pricing, compliance | ✗ | ✗ |
| `contracts` | contracts, compliance | ✗ | ✗ |
| `hr_staffing` | writer | ✗ | ✗ |
| `author` | writer, compliance | ✗ | ✗ |
| `partner` | *(none)* | ✗ | ✗ |
| `subcontractor` | *(none)* | ✗ | ✗ |
| `consultant` | writer | ✗ | ✗ |

### Agent → Model → Engine Mapping

| Agent | Default Model | CUI Engine | Non-CUI Engine | Min Evidence |
|-------|--------------|------------|----------------|-------------|
| Capture | Sonnet 4.5 | AskSage | AskSage or Direct | ≥90% |
| Strategy | Opus 4.5 | AskSage | AskSage | ≥85% |
| Compliance | Sonnet 4.5 | AskSage | AskSage or Direct | 100% |
| Writer | Sonnet 4.5 | AskSage | Both | ≥95% |
| Pricing | GPT-4o | AskSage (always) | AskSage (always) | ≥95% |
| Black Hat | GPT-4o | AskSage (always) | AskSage (always) | ≥95% |
| Contracts | Sonnet 4.5 | AskSage | AskSage or Direct | 100% |
| Orals | Opus 4.5 | AskSage | AskSage | ≥90% |

---

## 8. GATE AUTHORITY MATRIX

Who can approve which Shipley gates:

| Role | gate1 | blue | red | gold | submit |
|------|-------|------|-----|------|--------|
| `executive` | ✓ | — | — | ✓ | ✓ |
| `operations` | ✓ | ✓ | ✓ | — | — |
| `capture_manager` | ✓ | ✓ | ✓ | — | — |
| All others | — | — | — | — | — |

**UI Rule:** Gate approval buttons only render for roles with `gateAuthority.canApprove` containing that gate name.

```typescript
// In War Room GateApproval component
const { gateAuthority } = getRoleConfig(role);
const canApproveThisGate = gateAuthority.canApprove.includes(currentGate);
if (!canApproveThisGate) return null; // Don't render button
```

---

## 9. ERROR STATES & EMPTY STATES

| Scenario | Component | Message | CTA |
|----------|-----------|---------|-----|
| No opportunities | `<EmptyState>` | "No opportunities in your pipeline yet" | "Create Opportunity" (if canEdit) |
| No assigned sections (Author) | `<EmptyState>` | "No sections assigned to you" | "Contact your Proposal Manager" |
| No data (external role) | `<EmptyState>` | "No assignments available" | "Contact your prime contractor" |
| RLS denied (404) | `not-found.tsx` | "Opportunity not found" | "Back to Pipeline" |
| Session expired | `middleware.ts` redirect | Redirect to `/login` | Auto-redirect |
| AI agent error | `<AIErrorState>` | "AI generation failed. Retry or contact support." | "Retry" button |
| CUI classification error | `<CUIErrorState>` | "Unable to classify content. Routing to secure channel." | Auto-route to AskSage |

---

## 10. NOTIFICATION TRIGGERS

| Event | Roles Notified | Channel |
|-------|---------------|---------|
| Gate approval needed | executive, operations | In-app + email digest |
| Section submitted for review | proposal_manager | In-app |
| Color team deadline approaching | volume_lead, author | In-app + email |
| pWin score changed | executive, capture_manager | In-app |
| CUI access attempt | executive (security alert) | In-app + email |
| Partner access auto-revoked | partner, executive | Email |
| Consultant access expiring | consultant, executive | In-app + email |
| AI confidence below threshold | triggering user | In-app (inline warning) |

---

*End of UI/UX Flow Specification v1.0*
*Source: roles_permissions_config.json v9.5 + database.types.ts + MissionPulse_v2_Master_Roadmap*
*Generated: February 2026 | Mission Meets Tech, LLC | PROPRIETARY*
