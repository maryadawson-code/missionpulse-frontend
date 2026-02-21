

MISSIONPULSE
v2.0 Master Roadmap
From Current State to Production Launch
16 Sprints  •  ~85 Tickets  •  16 Weeks to Launch
Supersedes all prior sprint plans  |  Based on Product Spec v1.0 FINAL
Vertical slices > horizontal layers  |  Ship working features, not layers

February 2026  |  PROPRIETARY

1. Strategic Overview
1.1 Where We Are
Sprints 1-2 are COMPLETE. The foundation is solid:
	•	Next.js 14 (App Router) scaffolded with TypeScript strict mode
	•	Supabase connected — client.ts, server.ts, admin.ts, database.types.ts generated
	•	Auth middleware deployed — session refresh, redirect, cookie-based
	•	RBAC system built — config loader, useRole(), usePermissions(), <RBACGate>
	•	Database: 200 tables, RLS on all, 37 with data, all RBAC functions deployed, pgvector active, audit triggers live
Gap: No UI exists yet. No login screen. No dashboard. No modules. The security layer is rock-solid. Now we build everything the user actually sees.
1.2 Where We're Going
Production-ready MissionPulse v1.0 with all 16 modules, 8 AI agents, multi-model gateway, and track-changes UX. Deployed to missionpulse.io with staging on v2-development branch.
1.3 Guiding Principles
	•	Vertical slices, not horizontal layers. Every sprint ships a working feature end-to-end (UI + data + RBAC). You can demo every sprint.
	•	Database is done. Don't touch it unless forced. 200 tables exist. We build against them, not rebuild them. Schema migrations only for missing columns.
	•	One module at a time, fully complete. Don't stub 16 routes — finish Pipeline before starting War Room.
	•	Build → Verify → Ship. Every sprint. npm run build must pass before merging. Staging deploys automatically on push to v2-development.
	•	Shared components first. The DataTable, FormModal, StatusBadge, and EmptyState components built in early sprints get reused across every module.
	•	AI integration comes AFTER core workflows exist. Users need to see their data before AI can act on it. Agents plug into existing UI.
1.4 Sprint Cadence
Parameter
Value
Sprint Length
1 week (Mon–Fri)
Tickets per Sprint
4–6 max
Validation
npm run build must pass for every ticket
Branch
All work on v2-development. Merge to main at launch.
Deploy
Staging auto-deploys on push. Production requires manual merge.
Total Sprints
16 sprints (≈16 weeks to launch)
Launch Target
June 2026
1.5 Phase Map
Phase
Sprints
What Ships
PHASE A: Core Shell
S3–S4
Auth UI, Dashboard, Sidebar, Design System, shared components
PHASE B: Pipeline & Opps
S5–S6
Pipeline, Opportunity CRUD, War Room, Swimlane
PHASE C: Proposal Workflow
S7–S9
RFP Shredder, Iron Dome, Contract Scanner, HITL, Playbook
PHASE D: AI Integration
S10–S12
AskSage gateway, AI agents, track-changes UX, classification router
PHASE E: Advanced Modules
S13–S15
Pricing (CUI), Black Hat, Orals, Frenemy, Post-Award, Audit Trail
PHASE F: Launch
S16–S18
Integrations, Solo Mode, Demo env, docs, security audit, go-live

2. Pre-Flight Checklist (Before Sprint 3)
Run these on your Mac BEFORE starting Sprint 3. Each is a 2-minute task that prevents hours of debugging later.
#
Task
Command / Action
Status
1
Verify branch
git checkout v2-development && git pull

2
Regenerate types
npx supabase gen types typescript --project-id djuviwarqdvlbgcfuupa > lib/supabase/database.types.ts

3
Upload types to PK
Upload database.types.ts to Project Knowledge

4
Verify build passes
npm run build (should succeed with 0 errors)

5
Verify .env.local exists
NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY + SUPABASE_SERVICE_ROLE_KEY

6
Add v1.0 spec to PK
Upload MissionPulse_Product_Spec_v1_0_FINAL.docx to Project Knowledge

7
Remove stale PK files
Remove any old spec versions from Project Knowledge

8
Install shadcn/ui
npx shadcn-ui@latest init (dark mode, Inter, CSS variables)

Do NOT start Sprint 3 until all 8 items are checked. The first ticket depends on shadcn/ui and database.types.ts being present.

PHASE A: Core Shell
Goal: A user can sign up, log in, see a dark-mode dashboard with RBAC-filtered sidebar, and navigate between empty module pages. This is the skeleton everything else hangs on.

SPRINT 3  —  Auth UI + Design System
Week 1
A user can sign up, log in, see a loading state, and hit the dashboard. Dark mode. Inter font. Shield & Pulse tokens.
T-3.1  Tailwind Config + Design Tokens    [2hr]
Configure Tailwind with Shield & Pulse dark mode tokens. CSS custom properties for all colors, spacing, typography. Inter + JetBrains Mono fonts via next/font.
Acceptance Criteria:
	•	✓ tailwind.config.ts has all color tokens from spec Section 4.2
	•	✓ Dark mode is default (class strategy)
	•	✓ Inter loads via next/font/google
	•	✓ JetBrains Mono loads for data/code elements
	•	✓ CSS vars match spec: --bg-primary, --bg-card, --bg-elevated, etc.
	•	✓ npm run build passes
Depends on: None
Files: tailwind.config.ts, app/globals.css, app/layout.tsx
T-3.2  shadcn/ui Base Components    [2hr]
Install and configure shadcn/ui components needed across the app. Button, Input, Label, Card, Dialog, DropdownMenu, Tooltip, Badge, Separator, Skeleton, Table, Tabs, Toast. All themed to Shield & Pulse.
Acceptance Criteria:
	•	✓ shadcn/ui initialized with CSS variables
	•	✓ All listed components installed
	•	✓ Components render correctly in dark mode
	•	✓ No unstyled flashes
	•	✓ npm run build passes
Depends on: T-3.1
Files: components/ui/*.tsx
T-3.3  Login Page    [3hr]
Email/password login form using Supabase Auth. Server Action for form submission. Error handling (invalid creds, network). Redirect to /dashboard on success. Shield & Pulse styled with MMT logo.
Acceptance Criteria:
	•	✓ Form submits via Server Action (not API route)
	•	✓ Invalid credentials show error toast
	•	✓ Successful login redirects to /dashboard
	•	✓ Session cookie set via @supabase/ssr
	•	✓ Page is a Server Component with client form island
	•	✓ Responsive (mobile-friendly)
	•	✓ npm run build passes
Depends on: T-3.1, T-3.2
Files: app/(auth)/login/page.tsx, app/(auth)/login/actions.ts
T-3.4  Signup Page + Company Wizard    [4hr]
Email/password signup. After auth creation, prompt for: company name, team size (Solo/Micro/Small/Mid/Enterprise), primary NAICS, set-aside type. Writes to profiles + companies tables.
Acceptance Criteria:
	•	✓ Signup creates auth user via Supabase
	•	✓ handle_new_user trigger creates profile (verify this works)
	•	✓ Wizard step 2 collects company info
	•	✓ Company record created in companies table
	•	✓ Profile updated with company_id
	•	✓ Redirect to /dashboard after completion
	•	✓ npm run build passes
Depends on: T-3.3
Files: app/(auth)/signup/page.tsx, app/(auth)/signup/actions.ts, app/(auth)/signup/wizard.tsx
T-3.5  Auth Callback + Middleware Verification    [2hr]
Auth callback route for email confirmation. Verify middleware.ts correctly refreshes sessions and redirects unauthenticated users from /dashboard routes.
Acceptance Criteria:
	•	✓ GET /auth/callback exchanges code for session
	•	✓ Unauthenticated /dashboard/* requests redirect to /login
	•	✓ Authenticated /login requests redirect to /dashboard
	•	✓ Session refresh works on page reload
	•	✓ npm run build passes
Depends on: T-3.3
Files: app/(auth)/callback/route.ts, middleware.ts (verify only)

SPRINT 4  —  Dashboard Shell + Sidebar
Week 2
User lands on a real dashboard with RBAC-filtered sidebar navigation. Every module has a route (even if empty). The shell is complete.
T-4.1  Sidebar Navigation Component    [4hr]
Responsive sidebar with module links filtered by RBAC. Uses usePermissions() hook to check shouldRender for each module. Collapsible on mobile. Active state indicator. MMT logo at top.
Acceptance Criteria:
	•	✓ Sidebar renders module links from nav config
	•	✓ Links with shouldRender=false do not appear in DOM (invisible RBAC)
	•	✓ Active route highlighted with cyan indicator
	•	✓ Collapses to icon-only on mobile
	•	✓ MMT logo renders at top
	•	✓ User name + role badge at bottom
	•	✓ Logout button works
	•	✓ npm run build passes
Depends on: T-3.5
Files: components/layout/Sidebar.tsx, components/layout/SidebarLink.tsx, lib/nav-config.ts
T-4.2  Dashboard Layout (Protected Shell)    [4hr]
The (dashboard) layout.tsx that wraps all protected routes. Fetches user profile server-side. Provides role context. Renders Sidebar + main content area. Loading state via loading.tsx.
Acceptance Criteria:
	•	✓ Layout is a Server Component fetching profile from Supabase
	•	✓ Passes role to client via context provider
	•	✓ Sidebar renders on left, content on right
	•	✓ loading.tsx shows skeleton while route loads
	•	✓ Error boundary catches and displays errors gracefully
	•	✓ npm run build passes
Depends on: T-4.1
Files: app/(dashboard)/layout.tsx, app/(dashboard)/loading.tsx, app/(dashboard)/error.tsx, lib/contexts/RoleContext.tsx
T-4.3  Command Center (Dashboard Home)    [5hr]
The main dashboard page. Role-adaptive widgets: Active Pursuits count, Pipeline Value, Compliance Health, Upcoming Deadlines, Recent Activity. Server Component with Suspense boundaries per widget.
Acceptance Criteria:
	•	✓ Dashboard shows real data from opportunities and profiles tables
	•	✓ Widgets wrapped in Suspense with skeleton fallbacks
	•	✓ Executive role sees all widgets
	•	✓ Partner role sees scoped widgets only
	•	✓ Empty states show when no data (with helpful CTAs)
	•	✓ Cards use glass morphism from design tokens
	•	✓ npm run build passes
Depends on: T-4.2
Files: app/(dashboard)/page.tsx, components/features/dashboard/*.tsx
T-4.4  Module Route Stubs (All 14 RBAC Modules)    [3hr]
Create route folders for all 14 RBAC modules. Each gets a page.tsx with module title, description, and 'Coming Soon' state if not yet built. RBACGate wraps each page.
Acceptance Criteria:
	•	✓ 14 route folders created under app/(dashboard)/
	•	✓ Each page.tsx wrapped in <RBACGate module='...'> 
	•	✓ Unauthorized access shows nothing (invisible RBAC)
	•	✓ Pages display module name and construction indicator
	•	✓ All routes accessible from sidebar
	•	✓ npm run build passes
Depends on: T-4.2
Files: app/(dashboard)/[module]/page.tsx for all 14 modules
T-4.5  Shared DataTable Component    [5hr]
Reusable data table with: sorting, filtering, pagination, column visibility, row selection, empty states. Built on shadcn/ui Table + TanStack Table. This is THE table component for Pipeline, Compliance, Audit, etc.
Acceptance Criteria:
	•	✓ Generic DataTable<T> component with typed columns
	•	✓ Server-side pagination via Supabase .range()
	•	✓ Column sorting (single column)
	•	✓ Text filter on any column
	•	✓ Row selection with checkbox
	•	✓ Empty state with configurable message + CTA
	•	✓ Loading skeleton state
	•	✓ Responsive (horizontal scroll on mobile)
	•	✓ npm run build passes
Depends on: T-3.2
Files: components/ui/DataTable.tsx, components/ui/DataTablePagination.tsx, components/ui/DataTableColumnHeader.tsx
T-4.6  Shared FormModal Component    [3hr]
Reusable modal for create/edit forms. Built on shadcn/ui Dialog. Handles form state, validation (zod), Server Action submission, loading states, and error display.
Acceptance Criteria:
	•	✓ Generic FormModal with customizable fields
	•	✓ Zod schema validation before submission
	•	✓ Calls Server Action on submit
	•	✓ Loading spinner during submission
	•	✓ Error toast on failure, success toast + close on success
	•	✓ Keyboard accessible (Escape to close, Tab through fields)
	•	✓ npm run build passes
Depends on: T-3.2
Files: components/ui/FormModal.tsx, lib/utils/validation.ts

PHASE B: Pipeline & Opportunities
Goal: Full opportunity lifecycle — create, view, edit, track through Shipley phases. War Room for per-opportunity collaboration. Swimlane for task tracking. This is the core product loop.

SPRINT 5  —  Pipeline Module
Week 3
Users can see all opportunities in a sortable, filterable table. Create new opportunities. Click into detail views. Kanban view of Shipley phases.
T-5.1  Pipeline Table View    [5hr]
Full DataTable showing opportunities from Supabase. Columns: title, agency, ceiling, pwin, phase, owner, due date, status. Server Component with Suspense. Paginated, sorted by due date.
Acceptance Criteria:
	•	✓ Queries opportunities table via server-side Supabase client
	•	✓ Correct column names: title, ceiling, pwin, phase, owner_id
	•	✓ RLS filters to user's company_id automatically
	•	✓ Pagination working (25 per page)
	•	✓ Sort by any column
	•	✓ Filter by phase, status, agency
	•	✓ Click row navigates to opportunity detail
	•	✓ npm run build passes
Depends on: T-4.5
Files: app/(dashboard)/pipeline/page.tsx, app/(dashboard)/pipeline/columns.tsx, app/(dashboard)/pipeline/actions.ts
T-5.2  Pipeline Kanban View    [5hr]
Alternative view: Kanban columns for each Shipley phase. Cards show opportunity title, agency, ceiling, pwin, due date. Drag-and-drop to change phase. Toggle between Table and Kanban.
Acceptance Criteria:
	•	✓ Kanban columns match Shipley phases from database
	•	✓ Cards render opportunity summary
	•	✓ Drag-and-drop updates phase via Server Action
	•	✓ View toggle persists in URL params (?view=kanban)
	•	✓ Empty columns show 'No opportunities in this phase'
	•	✓ npm run build passes
Depends on: T-5.1
Files: app/(dashboard)/pipeline/KanbanView.tsx, components/features/pipeline/OpportunityCard.tsx
T-5.3  Create Opportunity    [3hr]
FormModal for new opportunity. Fields: title, agency, ceiling, naics, set_aside, due_date, contact_name, contact_email, description. Creates record via Server Action.
Acceptance Criteria:
	•	✓ FormModal opens from Pipeline 'New Opportunity' button
	•	✓ Zod validation on all required fields
	•	✓ Server Action inserts into opportunities table
	•	✓ owner_id set to current user automatically
	•	✓ Phase defaults to first Shipley phase
	•	✓ pwin defaults to 0
	•	✓ Toast on success, redirect to new opportunity
	•	✓ npm run build passes
Depends on: T-4.6, T-5.1
Files: app/(dashboard)/pipeline/CreateOpportunityModal.tsx, app/(dashboard)/pipeline/actions.ts
T-5.4  Opportunity Detail Page    [5hr]
Dynamic route /pipeline/[id]. Full opportunity view with tabs: Overview, Team, Timeline, Documents. Editable fields via inline edit or edit modal. Activity log sidebar.
Acceptance Criteria:
	•	✓ Dynamic route fetches opportunity by ID
	•	✓ RLS enforces access (404 if no permission)
	•	✓ Overview tab shows all opportunity fields
	•	✓ Edit mode allows updating fields via Server Action
	•	✓ Activity log shows recent actions on this opportunity
	•	✓ Breadcrumb: Pipeline > [Opportunity Title]
	•	✓ npm run build passes
Depends on: T-5.1
Files: app/(dashboard)/pipeline/[id]/page.tsx, app/(dashboard)/pipeline/[id]/actions.ts
T-5.5  Opportunity Delete + Archive    [2hr]
Delete (soft) and archive capabilities. Confirmation dialog. Server Action updates status field. Archived items hidden from default Pipeline view but accessible via filter.
Acceptance Criteria:
	•	✓ Delete shows confirmation dialog with opportunity title
	•	✓ Server Action sets status to 'archived' (soft delete)
	•	✓ Archived opportunities hidden from default view
	•	✓ Filter toggle shows/hides archived
	•	✓ Audit log entry created on delete/archive
	•	✓ npm run build passes
Depends on: T-5.4
Files: app/(dashboard)/pipeline/[id]/actions.ts (extend)

SPRINT 6  —  War Room + Swimlane
Week 4
Per-opportunity command center with real-time collaboration. Swimlane board for section-level task tracking across Shipley color teams.
T-6.1  War Room Shell    [6hr]
Nested route: /pipeline/[id]/war-room. Real-time activity feed, section ownership table, volume progress bars, deadline countdown. Supabase Realtime subscription.
Acceptance Criteria:
	•	✓ War Room loads under opportunity context
	•	✓ Activity feed shows last 50 actions (real-time via Supabase Realtime)
	•	✓ Section ownership table shows assigned team members
	•	✓ Volume progress bars show % complete per section
	•	✓ Deadline countdown timer (days/hours to due date)
	•	✓ npm run build passes
Depends on: T-5.4
Files: app/(dashboard)/pipeline/[id]/war-room/page.tsx, components/features/war-room/*.tsx
T-6.2  Swimlane Board    [6hr]
Kanban per opportunity: columns are Draft → Review → Revision → Final. Cards are proposal sections (from proposal_sections table). Drag-and-drop changes status. Owner assignment per card.
Acceptance Criteria:
	•	✓ Columns: Draft, Review, Revision, Final
	•	✓ Cards show section title, owner, due date, volume
	•	✓ Drag-and-drop updates section status
	•	✓ Click card opens section detail sidebar
	•	✓ Filter by volume (Tech, Mgmt, Past Perf, Cost)
	•	✓ Assign owner from team members dropdown
	•	✓ npm run build passes
Depends on: T-6.1, T-4.5
Files: app/(dashboard)/pipeline/[id]/swimlane/page.tsx, components/features/swimlane/*.tsx
T-6.3  Team Management (per Opportunity)    [4hr]
Manage team members assigned to a specific opportunity. Invite by email, assign roles, set section ownership. Tab within opportunity detail.
Acceptance Criteria:
	•	✓ Team tab shows assigned members with roles
	•	✓ Invite by email (sends notification)
	•	✓ Assign role from 12-role dropdown
	•	✓ Role determines what they see in this opportunity (RBAC)
	•	✓ Remove team member (with confirmation)
	•	✓ npm run build passes
Depends on: T-5.4
Files: app/(dashboard)/pipeline/[id]/team/page.tsx, actions.ts
T-6.4  Shared StatusBadge + PhaseIndicator Components    [2hr]
Reusable status badges (color-coded) and Shipley phase indicators used across Pipeline, Swimlane, War Room, and future modules.
Acceptance Criteria:
	•	✓ StatusBadge renders with correct color per status
	•	✓ PhaseIndicator shows Shipley phase with progress
	•	✓ Both components are typed and documented
	•	✓ Colors match design token system
	•	✓ npm run build passes
Depends on: T-3.1
Files: components/ui/StatusBadge.tsx, components/ui/PhaseIndicator.tsx
T-6.5  Activity Log Component    [3hr]
Shared component that displays activity_log entries for any entity (opportunity, proposal, section). Used in War Room, Dashboard, and detail pages.
Acceptance Criteria:
	•	✓ Renders timestamped activity entries
	•	✓ Groups by date
	•	✓ Shows actor name + avatar + action
	•	✓ Real-time updates via Supabase Realtime
	•	✓ Configurable: show for opportunity_id, or globally
	•	✓ npm run build passes
Depends on: T-4.2
Files: components/features/shared/ActivityLog.tsx, lib/utils/activity.ts

PHASE C: Proposal Workflow
Goal: The modules that DO the work — shred RFPs, track compliance, scan contracts, manage content. These are the engines. AI plugs in later, but the manual workflows must work first.

SPRINT 7  —  RFP Shredder + Compliance Matrix
Week 5
Upload a PDF. Extract requirements. Build the compliance matrix. This is the highest-value feature for first-time users.
T-7.1  RFP Upload + PDF Parser    [5hr]
File upload component. Accepts PDF/DOCX. Stores in Supabase Storage. Server Action extracts text via pdf-parse. Saves raw text to rfp_documents table.
Acceptance Criteria:
	•	✓ Drag-and-drop file upload with progress indicator
	•	✓ PDF text extracted server-side (pdf-parse or similar)
	•	✓ Raw text stored in rfp_documents table
	•	✓ File stored in Supabase Storage bucket
	•	✓ Max file size: 50MB
	•	✓ Error handling for corrupt/password-protected PDFs
	•	✓ npm run build passes
Depends on: T-5.4
Files: app/(dashboard)/pipeline/[id]/shredder/page.tsx, actions.ts, lib/utils/pdf-parser.ts
T-7.2  Requirements Extraction (Manual)    [6hr]
UI for manually identifying requirements from RFP text. Split-pane: source text on left, extracted requirements on right. Click to highlight and extract SHALL/MUST statements.
Acceptance Criteria:
	•	✓ Split-pane layout with source PDF text
	•	✓ Click-to-extract creates requirement entry
	•	✓ Each requirement: reference, text, section, priority
	•	✓ Requirements saved to compliance_requirements table
	•	✓ Bulk actions: mark priority, assign section, assign reviewer
	•	✓ This is the MANUAL workflow — AI auto-extraction comes in Phase D
	•	✓ npm run build passes
Depends on: T-7.1
Files: components/features/shredder/*.tsx, app/(dashboard)/pipeline/[id]/shredder/requirements.tsx
T-7.3  Compliance Matrix View    [4hr]
DataTable of all extracted requirements for an opportunity. Columns: reference, requirement (truncated), section, priority, status, assigned_to, evidence. Filterable, sortable, exportable.
Acceptance Criteria:
	•	✓ DataTable with all compliance_requirements for opportunity
	•	✓ Status tracking: Not Started, In Progress, Addressed, Verified
	•	✓ Assign to team member
	•	✓ Link evidence (free text or document reference)
	•	✓ Export to CSV
	•	✓ Progress bar showing % addressed
	•	✓ npm run build passes
Depends on: T-7.2, T-4.5
Files: app/(dashboard)/pipeline/[id]/compliance/page.tsx
T-7.4  Iron Dome Dashboard    [5hr]
Compliance command center. Aggregates compliance status across all active opportunities. Overall health score. Gap detection. NIST control mapping (read from nist_controls table).
Acceptance Criteria:
	•	✓ Shows compliance health across all opportunities
	•	✓ Per-opportunity compliance percentage
	•	✓ Gap detection: requirements with status 'Not Started' past due
	•	✓ NIST 800-171 control reference where applicable
	•	✓ Drill-down to individual opportunity compliance matrix
	•	✓ npm run build passes
Depends on: T-7.3
Files: app/(dashboard)/compliance/page.tsx, components/features/compliance/*.tsx

SPRINT 8  —  Contract Scanner + Documents
Week 6
Clause-level contract analysis. Document library with version control. Building blocks for all generated content.
T-8.1  Contract Scanner    [5hr]
Displays contract_clauses for an opportunity. FAR/DFARS clause identification. Risk level badges (Low/Medium/High). Compliance status per clause. Notes field for legal review.
Acceptance Criteria:
	•	✓ DataTable of contract_clauses filtered by opportunity_id
	•	✓ Risk level displayed as color-coded badge
	•	✓ Compliance status: Compliant, Review Needed, Non-Compliant
	•	✓ Click clause to expand full text + notes
	•	✓ Edit notes and compliance status via Server Action
	•	✓ npm run build passes
Depends on: T-4.5, T-5.4
Files: app/(dashboard)/pipeline/[id]/contracts/page.tsx, components/features/contracts/*.tsx
T-8.2  Document Library (per Opportunity)    [5hr]
File management per opportunity. Upload, categorize (volume, section, support), version tracking. Supabase Storage integration.
Acceptance Criteria:
	•	✓ Upload files to opportunity-specific storage bucket
	•	✓ Categorize: Technical, Management, Past Performance, Cost, Support
	•	✓ Version tracking (re-upload creates new version, old preserved)
	•	✓ Preview for PDF/images, download for all types
	•	✓ Delete with confirmation (soft delete)
	•	✓ npm run build passes
Depends on: T-5.4
Files: app/(dashboard)/pipeline/[id]/documents/page.tsx, lib/utils/storage.ts
T-8.3  Global Documents Module    [4hr]
Company-wide document library. Templates, capability statements, past performance narratives. Searchable. Used by Playbook and AI agents later.
Acceptance Criteria:
	•	✓ Shows all documents across opportunities + company-level docs
	•	✓ Search by name, category, content
	•	✓ Upload company-level documents (not tied to any opportunity)
	•	✓ Categories: Templates, Past Performance, Capabilities, Certifications
	•	✓ npm run build passes
Depends on: T-8.2
Files: app/(dashboard)/documents/page.tsx
T-8.4  HITL Review Queue    [5hr]
Human-in-the-loop review interface. Shows items pending human approval. For now, surfaces compliance requirements and contract clauses needing review. AI-generated items added in Phase D.
Acceptance Criteria:
	•	✓ DataTable of items with status 'Pending Review'
	•	✓ Filterable by type (compliance, contract, document)
	•	✓ Click to open review pane with full context
	•	✓ Approve / Reject / Request Changes actions
	•	✓ Rejection requires reason (free text)
	•	✓ Status updates via Server Action
	•	✓ npm run build passes
Depends on: T-4.5
Files: app/(dashboard)/proposals/page.tsx (HITL tab), components/features/hitl/*.tsx

SPRINT 9  —  Playbook + Analytics + Admin
Week 7
Content library for reuse. Admin panel for user/company management. Analytics for executive visibility.
T-9.1  Playbook Module    [6hr]
Golden content library. Past performance narratives, boilerplate sections, capability statements. Upload, tag, rate quality. pgvector search integration for semantic matching.
Acceptance Criteria:
	•	✓ Upload content items with metadata (title, category, tags, NAICS)
	•	✓ Browse by category: Past Performance, Boilerplate, Capabilities, Win Themes
	•	✓ Quality rating (1-5 stars) per item
	•	✓ Search: text search + pgvector semantic search
	•	✓ Click to view full content with copy-to-clipboard
	•	✓ npm run build passes
Depends on: T-8.3
Files: app/(dashboard)/playbook/page.tsx (maps to documents module in RBAC), components/features/playbook/*.tsx, lib/utils/embeddings.ts
T-9.2  Analytics Module    [6hr]
Executive analytics dashboard. Pipeline value by phase, win rate trends, active pursuit count, team workload distribution, compliance health scores.
Acceptance Criteria:
	•	✓ Pipeline value chart (bar chart by Shipley phase)
	•	✓ Win rate over time (line chart)
	•	✓ Active pursuits by status (donut chart)
	•	✓ Team workload (who owns what)
	•	✓ Compliance health heatmap
	•	✓ Date range filter
	•	✓ Charts via Recharts
	•	✓ npm run build passes
Depends on: T-4.3
Files: app/(dashboard)/analytics/page.tsx, components/features/analytics/*.tsx
T-9.3  Admin Module    [5hr]
User management: invite users, assign roles, deactivate accounts. Company settings: name, NAICS, set-aside, branding. RBAC: only executive + admin roles see this.
Acceptance Criteria:
	•	✓ User list with role, status, last active
	•	✓ Invite user by email with role pre-assignment
	•	✓ Change user role (Server Action + profiles table update)
	•	✓ Deactivate user (sets status to 'inactive')
	•	✓ Company settings form (name, NAICS, set_aside_type)
	•	✓ Wrapped in <RBACGate module='admin'>
	•	✓ npm run build passes
Depends on: T-4.2
Files: app/(dashboard)/admin/page.tsx, app/(dashboard)/admin/users/page.tsx, app/(dashboard)/admin/settings/page.tsx
T-9.4  Audit Trail Module    [3hr]
Read-only viewer for audit_logs table. Immutable records (NIST AU-9). Filterable by user, action type, entity, date range. Exportable.
Acceptance Criteria:
	•	✓ DataTable reads from audit_logs
	•	✓ Columns: timestamp, user, action, entity_type, entity_id, details
	•	✓ Filter by date range, user, action type
	•	✓ Export to CSV
	•	✓ No edit/delete capabilities (immutable by design)
	•	✓ RBAC: only executive, operations, admin see this
	•	✓ npm run build passes
Depends on: T-4.5
Files: app/(dashboard)/audit-log/page.tsx

PHASE D: AI Integration
Goal: Connect AskSage. Build the classification router. Wire up AI agents to existing modules. Implement track-changes UX. This is where MissionPulse becomes intelligent.
AI is an enhancement layer on top of working modules — NOT a replacement for them. Every feature must work manually first. AI makes it faster.

SPRINT 10  —  AI Gateway + Classification Router
Week 8
AskSage connected. Classification gate operational. First AI endpoint working. Token tracking.
T-10.1  AskSage API Client    [5hr]
Server-side AskSage client library. Wraps the REST API. Handles auth, model selection, token tracking, error handling, retry logic. Never runs on client.
Acceptance Criteria:
	•	✓ Server-only module (import check enforced)
	•	✓ Supports /query endpoint with model parameter
	•	✓ Token counting per request/response
	•	✓ Retry logic: 3 retries with exponential backoff
	•	✓ Error types: RateLimit, AuthError, ModelUnavailable, Timeout
	•	✓ Environment variable: ASKSAGE_API_KEY (never NEXT_PUBLIC_)
	•	✓ npm run build passes
Depends on: None
Files: lib/ai/asksage-client.ts, lib/ai/types.ts
T-10.2  Classification Router    [4hr]
Server-side middleware that classifies every AI request by data sensitivity before routing. CUI/OPSEC/SP-PROPIN → AskSage only. Unclassified → configurable (AskSage or direct).
Acceptance Criteria:
	•	✓ classifyRequest(content) returns classification level
	•	✓ Regex + keyword scanning for CUI markings, PII patterns
	•	✓ Classification determines allowed models and engines
	•	✓ CUI-classified requests ONLY route to AskSage
	•	✓ Classification logged in ai_request_logs table
	•	✓ npm run build passes
Depends on: T-10.1
Files: lib/ai/classification-router.ts, lib/ai/classification-rules.ts
T-10.3  Model Selection Engine    [4hr]
Given a task type + classification level, selects the optimal model. Supports model cascade (cheap first, escalate if needed). Budget guard integration.
Acceptance Criteria:
	•	✓ selectModel(taskType, classification) returns model config
	•	✓ Task-model mapping from spec Section 6.3
	•	✓ Cascade logic: try cheaper model, check confidence, escalate
	•	✓ Budget guard checks at 75% monthly spend
	•	✓ Returns: model name, engine (AskSage/direct), estimated tokens
	•	✓ npm run build passes
Depends on: T-10.2
Files: lib/ai/model-selector.ts, lib/ai/budget-guard.ts
T-10.4  AI Request/Response Pipeline    [5hr]
Unified function: aiRequest(taskType, prompt, context). Classifies → selects model → sends to AskSage → tracks tokens → returns typed response. All AI calls go through this.
Acceptance Criteria:
	•	✓ Single entry point for all AI operations
	•	✓ Pipes through: classify → select → execute → log → return
	•	✓ Writes to ai_usage_logs: model, tokens_in, tokens_out, cost_estimate, latency
	•	✓ Returns typed AIResponse<T> with content, model_used, confidence, citations
	•	✓ Error handling returns graceful fallback (feature works without AI)
	•	✓ npm run build passes
Depends on: T-10.3
Files: lib/ai/pipeline.ts, lib/ai/logger.ts
T-10.5  AI Chat Interface    [6hr]
Chat panel accessible from sidebar (ai_chat module). Conversational interface to ask questions about opportunities, compliance, strategy. Context-aware: knows current opportunity if on that page.
Acceptance Criteria:
	•	✓ Chat UI with message history
	•	✓ Context injection: current opportunity data included automatically
	•	✓ User messages routed through AI pipeline
	•	✓ Responses show model attribution ('Answered by Claude Sonnet 4.5 via AskSage')
	•	✓ Markdown rendering in responses
	•	✓ RBAC: available to roles with ai_chat shouldRender=true
	•	✓ npm run build passes
Depends on: T-10.4
Files: app/(dashboard)/ai-chat/page.tsx, components/features/ai-chat/*.tsx

SPRINT 11  —  Track Changes UX + Agent Wiring
Week 9
Track-changes component for all AI outputs. Wire Capture, Compliance, and Writer agents into existing modules.
T-11.1  Track Changes Component    [8hr]
The core trust UX component. Renders AI-generated content as tracked changes with per-paragraph accept/reject/modify. 'Because' statements. Confidence indicators. Source citations.
Acceptance Criteria:
	•	✓ TrackChangesBlock component: renders suggested text with diff highlighting
	•	✓ Per-paragraph: Accept, Reject, Modify buttons
	•	✓ 'Because' statement shown below each suggestion
	•	✓ Confidence badge: High (green), Medium (yellow), Low (red)
	•	✓ Source citations as clickable links
	•	✓ Model attribution line at bottom
	•	✓ Edit mode: click to modify suggested text inline
	•	✓ Batch actions: Accept All, Reject All
	•	✓ npm run build passes
Depends on: T-3.2
Files: components/features/ai/TrackChangesBlock.tsx, components/features/ai/ConfidenceBadge.tsx, components/features/ai/CitationLink.tsx, components/features/ai/BecauseStatement.tsx
T-11.2  Capture Agent Integration    [5hr]
Wire Capture Agent into Pipeline. On opportunity creation or manual trigger: generate pWin score, win themes, competitive landscape summary. Output as TrackChangesBlock.
Acceptance Criteria:
	•	✓ 'Analyze Opportunity' button on opportunity detail page
	•	✓ Calls AI pipeline with taskType='capture_analysis'
	•	✓ Returns pWin score, win themes, risk factors
	•	✓ Rendered as TrackChangesBlock with accept/reject per item
	•	✓ Accepted items update opportunity record (pwin, notes)
	•	✓ Loading state while AI processes
	•	✓ npm run build passes
Depends on: T-10.4, T-11.1, T-5.4
Files: components/features/pipeline/CaptureAnalysis.tsx, lib/ai/agents/capture.ts
T-11.3  Compliance Agent Integration    [5hr]
Wire Compliance Agent into RFP Shredder. Auto-extract requirements from uploaded PDF text. Output as TrackChangesBlock for human review before saving.
Acceptance Criteria:
	•	✓ 'Auto-Extract Requirements' button in Shredder
	•	✓ AI parses PDF text, identifies SHALL/MUST/requirement patterns
	•	✓ Results shown as TrackChangesBlock list
	•	✓ Each requirement: accept to add to compliance matrix, reject to skip
	•	✓ Confidence indicator per requirement
	•	✓ Accepted items write to compliance_requirements table
	•	✓ npm run build passes
Depends on: T-10.4, T-11.1, T-7.2
Files: components/features/shredder/AutoExtract.tsx, lib/ai/agents/compliance.ts
T-11.4  Writer Agent Integration    [6hr]
Wire Writer Agent into document/section editing. 'Draft Section' button generates proposal content based on RFP requirements + Playbook content. Output as TrackChangesBlock.
Acceptance Criteria:
	•	✓ 'AI Draft' button on section editing view
	•	✓ Sends: section requirements, RFP context, relevant Playbook content (pgvector search)
	•	✓ Returns: draft narrative with citations to source material
	•	✓ Rendered as TrackChangesBlock
	•	✓ Accepted content saves to section body
	•	✓ Multi-level refinement: regenerate specific paragraphs without losing others
	•	✓ npm run build passes
Depends on: T-10.4, T-11.1, T-9.1
Files: components/features/proposals/AIWriterPanel.tsx, lib/ai/agents/writer.ts

SPRINT 12  —  Remaining Agents + Token Dashboard
Week 10
Wire Strategy, Contracts, and Orals agents. Build token usage dashboard for cost visibility.
T-12.1  Strategy Agent Integration    [4hr]
Wire Strategy Agent into opportunity detail. Generates discriminators, Section M alignment analysis, competitor positioning. Uses Opus for complex reasoning.
Acceptance Criteria:
	•	✓ 'Generate Strategy' button on opportunity detail
	•	✓ Outputs: discriminators, win themes, Section M alignment
	•	✓ TrackChangesBlock rendering
	•	✓ Accepted items update opportunity strategy fields
	•	✓ npm run build passes
Depends on: T-10.4, T-11.1
Files: lib/ai/agents/strategy.ts, components/features/pipeline/StrategyAnalysis.tsx
T-12.2  Contracts Agent Integration    [4hr]
Wire Contracts Agent into Contract Scanner. Auto-analyze FAR/DFARS clauses. Risk scoring with plain-language explanations. Negotiation recommendations.
Acceptance Criteria:
	•	✓ 'Analyze Clauses' button in Contract Scanner
	•	✓ AI processes clause text, returns risk assessment per clause
	•	✓ TrackChangesBlock with accept/reject per clause analysis
	•	✓ Plain-language risk explanation ('Because' pattern)
	•	✓ Accepted items update contract_clauses risk_level + notes
	•	✓ npm run build passes
Depends on: T-10.4, T-11.1, T-8.1
Files: lib/ai/agents/contracts.ts, components/features/contracts/AIClauseAnalysis.tsx
T-12.3  Orals Agent Integration    [6hr]
Orals prep module. AI generates evaluator-style Q&A (15+ questions). Coaching feedback. Speaker notes generation. Uses Opus for realistic questioning.
Acceptance Criteria:
	•	✓ Orals module accessible from opportunity
	•	✓ Generate Q&A: 15+ evaluator-style questions with suggested answers
	•	✓ Each Q&A pair rendered as TrackChangesBlock
	•	✓ Coaching tips per question
	•	✓ Speaker notes generation for key slides
	•	✓ Export Q&A to DOCX
	•	✓ npm run build passes
Depends on: T-10.4, T-11.1
Files: app/(dashboard)/pipeline/[id]/orals/page.tsx, lib/ai/agents/orals.ts
T-12.4  Token Usage Dashboard    [5hr]
Admin-visible dashboard showing AI usage: tokens consumed by model, cost estimates, cache hit rate, requests per agent, budget remaining.
Acceptance Criteria:
	•	✓ Chart: token usage by model over time
	•	✓ Chart: cost by agent type
	•	✓ Metric: cache hit rate percentage
	•	✓ Metric: budget remaining vs. monthly limit
	•	✓ Table: recent AI requests with model, tokens, latency
	•	✓ RBAC: executive + operations + admin only
	•	✓ npm run build passes
Depends on: T-9.2, T-10.4
Files: app/(dashboard)/admin/ai-usage/page.tsx, components/features/admin/TokenUsageCharts.tsx

PHASE E: Advanced Modules
Goal: CUI-protected modules (Pricing, Black Hat), partner portal, post-award tracking, and notification system. The features that differentiate MissionPulse from competitors.

SPRINT 13  —  Pricing Module (CUI) + Black Hat
Week 11
CUI-protected pricing with LCAT mapping, BOE generation. Black Hat competitive analysis with OPSEC controls.
T-13.1  Pricing Module Shell    [8hr]
CUI-watermarked pricing interface. LCAT selection, labor categories, rates, BOE structure. All data routes through AskSage (GPT-4o). CUI banner on every view.
Acceptance Criteria:
	•	✓ CUI banner: 'CUI//SP-PROPIN' displayed at top of module
	•	✓ Watermark overlay on all pricing views
	•	✓ LCAT dropdown from labor_categories table
	•	✓ Rate entry per LCAT with wrap rates
	•	✓ BOE template structure
	•	✓ RBAC: pricing_manager, executive, operations only
	•	✓ All AI requests classified as CUI → AskSage only
	•	✓ npm run build passes
Depends on: T-10.4, T-5.4
Files: app/(dashboard)/pipeline/[id]/pricing/page.tsx, components/features/pricing/*.tsx, lib/utils/cui-watermark.ts
T-13.2  Pricing AI Agent    [5hr]
Wire Pricing Agent. AI generates LCAT recommendations, BOE estimates, price-to-win analysis, margin scenarios. GPT-4o via AskSage only.
Acceptance Criteria:
	•	✓ 'Generate BOE' button in Pricing module
	•	✓ AI recommends LCATs based on RFP requirements
	•	✓ Price-to-win analysis with market benchmarks
	•	✓ Margin scenarios (aggressive/moderate/conservative)
	•	✓ All requests force-routed to AskSage (CUI classification)
	•	✓ TrackChangesBlock output
	•	✓ npm run build passes
Depends on: T-13.1, T-10.4
Files: lib/ai/agents/pricing.ts, components/features/pricing/PricingAI.tsx
T-13.3  Black Hat Module    [6hr]
CUI//OPSEC competitive analysis. Competitor profiling, ghost strategies, weakness identification. Requires canTriggerBlackHat flag. AskSage-only routing.
Acceptance Criteria:
	•	✓ CUI//OPSEC banner on all views
	•	✓ Competitor profile entry (name, strengths, weaknesses, past awards)
	•	✓ AI-generated ghost strategy per competitor
	•	✓ Weakness identification + counter-tactics
	•	✓ RBAC: executive, operations, capture_manager only
	•	✓ Classification gate forces AskSage routing
	•	✓ npm run build passes
Depends on: T-10.4, T-5.4
Files: app/(dashboard)/pipeline/[id]/strategy/page.tsx (maps to strategy module), lib/ai/agents/blackhat.ts

SPRINT 14  —  Frenemy Firewall + Post-Award + Notifications
Week 12
Partner access controls. Post-submission tracking. Notification system across all modules.
T-14.1  Frenemy Firewall (Partner Portal)    [6hr]
Scoped access for partners/subcontractors. They see ONLY their assigned sections. Auto-watermark on every page they see. Auto-revoke access on proposal submission.
Acceptance Criteria:
	•	✓ Partner login shows only assigned opportunities + sections
	•	✓ Every page renders with partner-specific watermark (company name + timestamp)
	•	✓ Scope restriction enforced at RLS level (company_id + scopeRestriction)
	•	✓ Partner cannot see pricing, strategy, or Black Hat modules (invisible RBAC)
	•	✓ Auto-revoke: Server Action disables partner access when proposal status changes to 'submitted'
	•	✓ npm run build passes
Depends on: T-4.2, T-6.3
Files: components/layout/PartnerWatermark.tsx, lib/utils/partner-access.ts, app/(dashboard)/layout.tsx (enhance)
T-14.2  Launch Control (Submission)    [6hr]
Final submission readiness dashboard. Compliance verification against shredder output. pWin display. Executive sign-off workflow. One-click binder assembly (ZIP of all volumes).
Acceptance Criteria:
	•	✓ Dashboard shows: compliance %, pWin, missing sections, team sign-offs
	•	✓ Executive approval button (writes to gate_decisions table)
	•	✓ Binder assembly: generates ZIP with all proposal documents
	•	✓ Compliance check: flags any requirements with status != 'Verified'
	•	✓ Blocks submission if compliance < 100% (override available for executive)
	•	✓ npm run build passes
Depends on: T-7.3, T-8.2
Files: app/(dashboard)/pipeline/[id]/launch/page.tsx, lib/utils/binder-assembly.ts
T-14.3  Post-Award Module    [5hr]
Win/loss tracking. Debrief capture. Lessons learned auto-feed into Playbook. Performance tracking against proposed metrics.
Acceptance Criteria:
	•	✓ Set outcome: Won, Lost, No Bid, Protest
	•	✓ Debrief form: strengths cited, weaknesses cited, evaluator feedback
	•	✓ AI-generated lessons learned summary (if outcome recorded)
	•	✓ Lessons learned auto-added to Playbook with 'Post-Award' tag
	•	✓ Performance tracking: actual vs. proposed metrics
	•	✓ npm run build passes
Depends on: T-9.1, T-5.4
Files: app/(dashboard)/pipeline/[id]/post-award/page.tsx, lib/ai/agents/post-award.ts
T-14.4  Notification System    [6hr]
In-app notification center + email dispatch. Role-based notifications for: gate approvals, deadline warnings, HITL queue items, pWin changes, team assignments.
Acceptance Criteria:
	•	✓ Notification bell icon in header with unread count
	•	✓ Dropdown shows recent notifications
	•	✓ Click notification navigates to relevant page
	•	✓ Email dispatch for critical notifications (gate approvals, 48hr deadlines)
	•	✓ Notification preferences per user (in-app, email, both, none per type)
	•	✓ Server-side: logNotification() utility called from Server Actions
	•	✓ npm run build passes
Depends on: T-4.2
Files: components/layout/NotificationBell.tsx, lib/utils/notifications.ts, app/(dashboard)/notifications/page.tsx

SPRINT 15  —  Integrations Hub + Settings
Week 13
SAM.gov auto-sync. HubSpot CRM integration. User preferences. Company branding.
T-15.1  Integrations Hub Shell    [4hr]
Module showing available integrations as cards. Connect/disconnect via OAuth flows. Status indicators. Settings per integration.
Acceptance Criteria:
	•	✓ Grid of integration cards with logos
	•	✓ Each card: name, description, status (Connected/Disconnected), Configure button
	•	✓ Connect initiates OAuth flow (or API key entry for SAM.gov)
	•	✓ Disconnect with confirmation
	•	✓ RBAC: executive, operations, admin only
	•	✓ npm run build passes
Depends on: T-4.4
Files: app/(dashboard)/integrations/page.tsx, components/features/integrations/*.tsx
T-15.2  SAM.gov Integration    [6hr]
Auto-search SAM.gov for opportunities matching company NAICS codes. Import opportunities to Pipeline. Periodic sync (daily via Supabase Cron or Edge Function).
Acceptance Criteria:
	•	✓ Search SAM.gov API by NAICS, set-aside, agency
	•	✓ Display results with import button
	•	✓ Import creates opportunity record with SAM.gov reference
	•	✓ De-duplicate: check existing opportunities before import
	•	✓ Manual sync button + scheduled daily sync
	•	✓ npm run build passes
Depends on: T-15.1, T-5.3
Files: lib/integrations/sam-gov.ts, app/(dashboard)/integrations/sam-gov/page.tsx
T-15.3  HubSpot CRM Integration    [8hr]
Bi-directional sync: MissionPulse opportunities ↔ HubSpot deals. Map Shipley phases to HubSpot deal stages. Contact sync.
Acceptance Criteria:
	•	✓ OAuth connection to HubSpot
	•	✓ Field mapping configuration (opportunity fields → deal properties)
	•	✓ Sync direction: MissionPulse→HubSpot, HubSpot→MissionPulse, or bidirectional
	•	✓ Shipley phase changes auto-update HubSpot deal stage
	•	✓ Contact sync from HubSpot to opportunity contacts
	•	✓ Manual sync button + webhook-based real-time sync
	•	✓ npm run build passes
Depends on: T-15.1, T-5.1
Files: lib/integrations/hubspot.ts, app/(dashboard)/integrations/hubspot/page.tsx
T-15.4  User Preferences + Profile    [4hr]
User can edit: display name, avatar, notification preferences, default view (Table/Kanban), AI model preferences. Writes to profiles.preferences JSONB.
Acceptance Criteria:
	•	✓ Profile page: edit name, avatar upload, email (read-only)
	•	✓ Notification preferences: toggle per notification type
	•	✓ Display preferences: default view, sidebar collapsed, etc.
	•	✓ AI preferences: preferred model tier (cost-optimized vs. quality-first)
	•	✓ All saved to profiles.preferences JSONB field
	•	✓ npm run build passes
Depends on: T-4.2
Files: app/(dashboard)/settings/page.tsx, app/(dashboard)/settings/actions.ts

PHASE F: Launch Preparation
Goal: Demo environment, Solo Mode, security hardening, performance optimization, documentation, and production deployment. Ship it.

SPRINT 16  —  Solo Mode + Demo Environment
Week 14
Solo Mode for single-user firms. Demo environment with 5 pre-loaded opportunities for product tours.
T-16.1  Solo Mode Implementation    [5hr]
When company size is 'Solo', activate simplified workflows. User holds all roles. Simplified gate approvals. AI confidence warnings below 70%.
Acceptance Criteria:
	•	✓ Detect Solo mode from company size profile
	•	✓ Auto-assign all roles to solo user (union permissions)
	•	✓ Gate approvals require only solo user's approval
	•	✓ AI confidence < 70% shows warning with risk factors
	•	✓ Simplified sidebar: fewer modules visible, combined views
	•	✓ Solo-specific token cost optimization (aggressive cascade)
	•	✓ npm run build passes
Depends on: T-4.2, T-10.3
Files: lib/utils/solo-mode.ts, components/layout/SoloModeBanner.tsx
T-16.2  Demo Environment Seed Data    [4hr]
Script that creates a demo company with 5 realistic opportunities (DHA IDIQ, VA recompete, CMS new start, IHS set-aside, generic BPA). Each at different Shipley phases with sample data.
Acceptance Criteria:
	•	✓ Supabase seed script creates demo company + user
	•	✓ 5 opportunities with realistic data (agencies, NAICS, ceilings, pWin)
	•	✓ Sample compliance requirements per opportunity
	•	✓ Sample contract clauses
	•	✓ Sample team assignments
	•	✓ Demo user credentials: demo@missionpulse.io / [configured password]
	•	✓ npm run build passes
Depends on: T-5.1
Files: scripts/seed-demo.ts, supabase/seed.sql
T-16.3  Guided Tour / Onboarding Flow    [5hr]
First-login experience. Step-by-step guided tour highlighting key features. Dismissable. Per-module tooltips on first visit.
Acceptance Criteria:
	•	✓ First login detection (check profiles.preferences for onboarding_complete)
	•	✓ 5-step tour: Dashboard → Pipeline → Create Opportunity → Shredder → AI Chat
	•	✓ Spotlight overlay highlighting current feature
	•	✓ Skip button available at every step
	•	✓ Per-module tooltip on first visit (dismissable)
	•	✓ npm run build passes
Depends on: T-4.3
Files: components/features/onboarding/GuidedTour.tsx, lib/utils/onboarding.ts
T-16.4  Landing Page / Marketing Shell    [6hr]
Public landing page at / (root). Product overview, features, pricing tiers, CTA to sign up. Replaces current redirect. SEO-optimized.
Acceptance Criteria:
	•	✓ Public page (no auth required)
	•	✓ Hero section with tagline and CTA
	•	✓ Features overview (modules, AI, security)
	•	✓ Pricing table (Starter $99, Professional $299, Enterprise $2,500)
	•	✓ Trust badges (NIST, CMMC, FedRAMP via AskSage)
	•	✓ Footer with links
	•	✓ npm run build passes
Depends on: T-3.1
Files: app/page.tsx, app/(marketing)/layout.tsx, app/(marketing)/pricing/page.tsx

SPRINT 17  —  Security Hardening + Performance
Week 15
Pen test prep, rate limiting, CSP headers, performance optimization, error tracking, monitoring.
T-17.1  Security Headers + CSP    [4hr]
Configure Content Security Policy, HSTS, X-Frame-Options, and all security headers. Rate limiting on auth endpoints. CSRF protection.
Acceptance Criteria:
	•	✓ next.config.js security headers configured
	•	✓ CSP policy: restrict script sources, connect-src to Supabase + AskSage
	•	✓ HSTS: max-age=31536000, includeSubDomains
	•	✓ X-Frame-Options: DENY
	•	✓ Rate limiting on /auth/* routes (10 req/min per IP)
	•	✓ npm run build passes
Depends on: None
Files: next.config.js, middleware.ts (rate limiting)
T-17.2  Error Tracking + Monitoring    [4hr]
Sentry integration for error tracking. Health check endpoint. Supabase connection monitoring. AI gateway health check.
Acceptance Criteria:
	•	✓ Sentry SDK configured for Next.js (client + server)
	•	✓ Error boundaries report to Sentry
	•	✓ Health check at /api/health returns status of: DB, Auth, AI gateway
	•	✓ Structured logging for server-side errors
	•	✓ npm run build passes
Depends on: None
Files: lib/monitoring/sentry.ts, app/api/health/route.ts, app/error.tsx, app/global-error.tsx
T-17.3  Performance Optimization    [4hr]
Lighthouse audit. Image optimization. Bundle analysis. Lazy loading for heavy modules. Redis caching for hot queries (if Upstash configured).
Acceptance Criteria:
	•	✓ Lighthouse score > 90 on all categories
	•	✓ next/image for all images
	•	✓ Dynamic imports for heavy components (charts, Kanban)
	•	✓ Server Component default (verify no unnecessary 'use client')
	•	✓ Bundle size analysis: no single route > 200KB JS
	•	✓ npm run build passes
Depends on: None
Files: Various files (optimization pass)
T-17.4  MFA Implementation    [6hr]
TOTP-based MFA via Supabase Auth. Required for roles accessing CUI modules (pricing_manager, executive, operations). Enrollment flow. Recovery codes.
Acceptance Criteria:
	•	✓ MFA enrollment: QR code display, TOTP verification
	•	✓ MFA required for CUI-accessing roles (enforced at middleware level)
	•	✓ MFA challenge on login for enrolled users
	•	✓ Recovery codes generated and displayed once
	•	✓ profiles table: add mfa_enrolled_at column (migration)
	•	✓ npm run build passes
Depends on: T-3.3
Files: app/(auth)/mfa/page.tsx, middleware.ts (MFA check), supabase/migrations/add_mfa.sql

SPRINT 18  —  Docs, DNS, Deploy, Go-Live
Week 16
Documentation, custom domain, production deployment, smoke tests, launch.
T-18.1  Custom Domain + DNS    [2hr]
Configure missionpulse.io DNS. Point to Netlify. SSL certificate. Verify staging + production URLs work.
Acceptance Criteria:
	•	✓ DNS A/CNAME records configured for missionpulse.io
	•	✓ SSL certificate provisioned (Netlify auto-manages)
	•	✓ missionpulse.io resolves to production
	•	✓ staging.missionpulse.io resolves to v2-development
	•	✓ Redirect www → non-www
	•	✓ Verify all auth callbacks use correct domain
Depends on: None
Files: Netlify dashboard + DNS provider
T-18.2  Production Merge + Smoke Test    [4hr]
Merge v2-development → main. Run full smoke test suite. Verify all 16 modules load. Verify auth flow. Verify AI gateway. Verify integrations.
Acceptance Criteria:
	•	✓ git merge v2-development into main
	•	✓ Production build succeeds on Netlify
	•	✓ Login/signup flow works on production
	•	✓ All 16 modules accessible (per RBAC)
	•	✓ AI chat returns response from AskSage
	•	✓ Pipeline CRUD works end-to-end
	•	✓ Audit log records actions
	•	✓ No console errors in production
Depends on: All prior sprints
Files: Terminal (git merge), Netlify dashboard
T-18.3  User Documentation    [6hr]
Help docs covering: Getting Started, Modules Overview, AI Features, RBAC Explanation, Keyboard Shortcuts, FAQ. Hosted at docs.missionpulse.io or in-app.
Acceptance Criteria:
	•	✓ Getting Started guide (matches onboarding flow)
	•	✓ Per-module help page
	•	✓ AI features explanation (models, trust levels, track changes)
	•	✓ FAQ: common questions
	•	✓ Accessible from help icon in sidebar
	•	✓ Written in Markdown, rendered in app
Depends on: None
Files: app/(dashboard)/help/page.tsx, content/docs/*.md
T-18.4  Launch Checklist + Go-Live    [3hr]
Final verification checklist. Remove demo-only flags. Update meta tags. Submit to search engines. Announce.
Acceptance Criteria:
	•	✓ All environment variables verified for production
	•	✓ Demo mode toggle works (separate from production data)
	•	✓ Meta tags: title, description, OG image for social sharing
	•	✓ robots.txt allows indexing
	•	✓ Google Search Console submission
	•	✓ Product Hunt / LinkedIn launch prep
	•	✓ SHIP IT 🚀
Depends on: T-18.2
Files: Various (final sweep)

Appendix A: Critical Path Dependencies
This shows the longest dependency chain. Any delay on this path delays launch.
Critical Path: T-3.1 → T-3.3 → T-3.5 → T-4.2 → T-5.1 → T-5.4 → T-7.1 → T-7.2 → T-10.4 → T-11.1 → T-11.3 → T-18.2

That's 12 dependencies deep. At ~4 hours per ticket average, the critical path is ~48 working hours minimum. With a single developer (you + Forge), plan for 2x buffer: ~96 hours = ~12 working days for just the critical path.
The remaining ~73 tickets run in parallel with or branch off from the critical path. Total estimate: ~400 working hours across 16 sprints.
Parallel Work Streams
Stream
Sprints
Can Start After
Independent Of
Shared Components
S4
T-3.1
Auth flow
Analytics/Admin
S9
T-4.2
AI integration
Design System Polish
Anytime
T-3.1
Everything else
Integrations
S15
T-5.1
AI integration
Docs + Marketing
S16-18
T-4.3
Everything else

Appendix B: Risk Register
Risk
Impact
Probability
Mitigation
AskSage API instability
AI features unavailable
Medium
Fallback to direct Claude API for non-CUI. Queue for retry. Core works without AI.
Schema migration needed
Blocks tickets requiring new columns
Low
database.types.ts regen after each migration. Run migrations in dedicated tickets.
Scope creep on AI features
Delays launch
High
Phase D is capped at 3 sprints. Ship manual-first, AI-enhanced.
Supabase RLS performance
Slow queries on large tables
Medium
Index audit in Sprint 17. Query optimization. Client-side filter hints.
Single developer bottleneck
Can't parallelize work
High
Sequential sprints. No blocked tickets waiting on parallel work.
shadcn/ui breaking changes
Component regression
Low
Pin versions in package.json. Test after updates.
FedRAMP audit requirements
Compliance documentation gaps
Medium
SSP narratives built alongside features (not after). Audit trail from day 1.

Appendix C: How to Use This Roadmap
Starting a Sprint
	•	Open a new Claude chat in this project. Say: 'Execute Sprint [N], starting with ticket [T-N.1]'
	•	Forge will: Load AGENTS.md → read database.types.ts → read the ticket from this roadmap → execute the agent loop (Research → Plan → Implement → Verify → Report)
	•	You: Copy files to your repo, run the validation command, commit, push. Move to next ticket.
Completing a Ticket
	•	1. Forge outputs complete files with // filepath: comments
	•	2. You paste into your repo (or cp from output)
	•	3. Run: npm run build (must pass)
	•	4. Run: git add . && git commit -m 'feat: T-N.X — [title]' && git push origin v2-development
	•	5. Verify staging deploy at v2-development--missionpulse-io.netlify.app
	•	6. Say: 'T-N.X complete. Next ticket.'
If Forge Gets Blocked
	•	Circuit Breaker fires → Forge tells you exactly what's missing
	•	You provide the file or clarification → Forge resumes
	•	If stuck 3 times on same ticket → skip it, move to next, come back later
Updating This Roadmap
	•	Replace this file in Project Knowledge after each completed sprint
	•	Mark tickets as [DONE] in the Sprint Status section
	•	Add new tickets only via formal scope change (not mid-sprint)

PROPRIETARY — Mission Meets Tech, LLC — February 2026
