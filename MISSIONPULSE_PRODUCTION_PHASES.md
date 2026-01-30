# MissionPulse v12 - Production Build Phases
## Executable Phase Breakdown
**Created:** January 26, 2026  
**Total Phases:** 12  
**Total Time:** ~4 weeks

---

## 📊 PHASE OVERVIEW

| Phase | Name | Time | Deliverable |
|-------|------|------|-------------|
| P1 | Supabase Setup | 2 hrs | Project + Auth configured |
| P2 | Database Schema | 3 hrs | All tables + RLS policies |
| P3 | Login System | 4 hrs | login.html + auth protection |
| P4 | Dashboard Data | 4 hrs | Real data in index.html |
| P5 | User Management | 4 hrs | Admin panel + invites |
| P6 | Multi-Tenancy | 3 hrs | Company isolation verified |
| P7 | File Storage | 4 hrs | Upload/download working |
| P8 | AI Integration | 6 hrs | All agents connected |
| P9 | Company Wizard | 4 hrs | Onboarding flow complete |
| P10 | Enterprise Integrations | 8 hrs | MS 365 + HubSpot |
| P11 | Compliance & Billing | 6 hrs | CMMC + Stripe |
| P12 | QA & Launch | 4 hrs | Go-live ready |

---

## 🔵 PHASE 1: Supabase Project Setup
**Time:** 2 hours  
**Prerequisites:** None  
**Deliverable:** Supabase project with auth providers configured

### Tasks
- [ ] Create Supabase account at supabase.com
- [ ] Create new project "missionpulse-prod"
- [ ] Save Project URL and anon key
- [ ] Enable Email auth provider
- [ ] Enable Google OAuth provider
- [ ] Enable Microsoft OAuth provider (Azure AD)
- [ ] Configure email templates (welcome, password reset)
- [ ] Set site URL to https://missionpulse-frontend.netlify.app

### Manual Steps (You Do This)
1. Go to https://supabase.com → Sign Up
2. Click "New Project"
3. Enter:
   - Organization: Create new or select existing
   - Project name: `missionpulse-prod`
   - Database password: (generate strong password, SAVE IT)
   - Region: `us-east-1`
4. Wait 2 minutes for provisioning
5. Go to Settings → API → Copy:
   - Project URL
   - anon/public key

### Share With Claude
```
Supabase Project URL: https://__________.supabase.co
Supabase Anon Key: eyJ_______________
```

### Continuation Prompt
```
# MissionPulse Phase 1 Complete - Supabase Ready

## Credentials
- Supabase URL: [paste your URL]
- Supabase Anon Key: [paste your key]

## Context
- Frontend: https://missionpulse-frontend.netlify.app
- Desktop repo: C:\Users\MaryWomack\Desktop\missionpulse-frontend
- Design: Shield & Pulse UX v8.0 (#00E5FA cyan, #00050F navy)

## Task
Phase 2: Create the database schema in Supabase.
Generate the SQL for all tables (companies, users, opportunities, 
proposal_sections, compliance_requirements, team_assignments, 
chat_history, lessons_learned, audit_log) with Row Level Security.

Provide the SQL I can paste into Supabase SQL Editor.
```

---

## 🔵 PHASE 2: Database Schema
**Time:** 3 hours  
**Prerequisites:** Phase 1 complete  
**Deliverable:** All tables created with RLS policies

### Tasks
- [ ] Create companies table
- [ ] Create users table (linked to auth.users)
- [ ] Create opportunities table
- [ ] Create proposal_sections table
- [ ] Create compliance_requirements table
- [ ] Create team_assignments table
- [ ] Create chat_history table
- [ ] Create lessons_learned table
- [ ] Create audit_log table
- [ ] Enable RLS on all tables
- [ ] Create RLS policies for company isolation
- [ ] Create database functions (triggers, helpers)
- [ ] Insert seed data for testing

### Continuation Prompt
```
# MissionPulse Phase 2 - Database Schema

## Context
- Supabase URL: [your URL]
- Frontend: https://missionpulse-frontend.netlify.app
- RBAC Roles: CEO, COO, CAP, PM, SA, FIN, CON, DEL, QA, Partner, Admin

## Task
Generate complete SQL schema for MissionPulse including:

1. Tables:
   - companies (tenants)
   - users (with role field)
   - opportunities (pursuits with Shipley phases)
   - proposal_sections
   - compliance_requirements
   - team_assignments
   - chat_history
   - lessons_learned
   - audit_log

2. Row Level Security policies for multi-tenant isolation

3. Seed data:
   - 1 test company (Mission Meets Tech)
   - 1 admin user
   - 3 sample opportunities (DHA, VA, CMS)

Provide SQL I can paste into Supabase SQL Editor.
```

---

## 🔵 PHASE 3: Login System
**Time:** 4 hours  
**Prerequisites:** Phase 2 complete  
**Deliverable:** login.html with full auth flow

### Tasks
- [ ] Create login.html page
- [ ] Email/password login form
- [ ] Google OAuth button
- [ ] Microsoft OAuth button
- [ ] Sign up flow with company creation
- [ ] Forgot password flow
- [ ] Create supabase-client.js helper
- [ ] Create auth-guard.js for page protection
- [ ] Update all module pages with auth check
- [ ] Add logout functionality
- [ ] Session persistence (remember me)
- [ ] Redirect logic (login → dashboard)

### Continuation Prompt
```
# MissionPulse Phase 3 - Login System

## Context
- Supabase URL: [your URL]
- Supabase Anon Key: [your key]
- Frontend: https://missionpulse-frontend.netlify.app
- Desktop repo: C:\Users\MaryWomack\Desktop\missionpulse-frontend
- Design: Shield & Pulse UX v8.0 (#00E5FA cyan, #00050F navy)

## Task
Build the authentication system:

1. login.html - Beautiful login page with:
   - Email/password form
   - Google OAuth button
   - Microsoft OAuth button
   - Sign up link
   - Forgot password link
   - Error handling
   - Loading states

2. supabase-client.js - Auth helper:
   - Initialize Supabase client
   - Login/logout functions
   - Get current user
   - Get user's company

3. auth-guard.js - Protection wrapper:
   - Check if user is logged in
   - Redirect to login if not
   - Add to all module pages

Use Shield & Pulse design system. Provide files for download.
```

---

## 🔵 PHASE 4: Dashboard Data Integration
**Time:** 4 hours  
**Prerequisites:** Phase 3 complete  
**Deliverable:** index.html showing real database data

### Tasks
- [ ] Update index.html to fetch opportunities from Supabase
- [ ] Display logged-in user info
- [ ] Show company name in header
- [ ] KPI widgets with real counts
- [ ] Opportunity cards from database
- [ ] Filter by Shipley phase
- [ ] Filter by priority
- [ ] Loading states while fetching
- [ ] Error handling for failed requests
- [ ] Empty state when no opportunities

### Continuation Prompt
```
# MissionPulse Phase 4 - Dashboard Data Integration

## Context
- Supabase URL: [your URL]
- Supabase Anon Key: [your key]
- Frontend: https://missionpulse-frontend.netlify.app
- Desktop repo: C:\Users\MaryWomack\Desktop\missionpulse-frontend
- Current index.html uses mock data

## Task
Update index.html to use real Supabase data:

1. On page load:
   - Check auth (redirect to login if not authenticated)
   - Fetch current user's company
   - Fetch opportunities for that company
   - Populate KPI widgets with real counts
   - Render opportunity cards

2. Features:
   - User avatar + name in header
   - Company name display
   - Real-time opportunity count
   - Pipeline value calculation
   - Average pWin calculation

3. Keep existing UI design, just replace mock data with real fetches

Provide updated index.html for download.
```

---

## 🔵 PHASE 5: User Management
**Time:** 4 hours  
**Prerequisites:** Phase 4 complete  
**Deliverable:** Admin panel for user CRUD

### Tasks
- [ ] Create admin-users.html page
- [ ] List all company users
- [ ] Invite new user (email invitation)
- [ ] Edit user role
- [ ] Deactivate/reactivate user
- [ ] Role permission matrix display
- [ ] Invitation email template
- [ ] Pending invitations list
- [ ] Resend invitation option
- [ ] Add to navigation

### Continuation Prompt
```
# MissionPulse Phase 5 - User Management

## Context
- Supabase URL: [your URL]
- Frontend: https://missionpulse-frontend.netlify.app
- RBAC Roles: CEO, COO, CAP, PM, SA, FIN, CON, DEL, QA, Partner, Admin
- Only Admin and CEO roles can access this page

## Task
Build admin-users.html - User Management Panel:

1. User List:
   - Table of all company users
   - Columns: Name, Email, Role, Status, Last Login
   - Edit role dropdown
   - Deactivate button

2. Invite User:
   - Email input
   - Role selector
   - Send invitation button
   - Supabase sends magic link email

3. Pending Invitations:
   - List of sent but not accepted invites
   - Resend / Cancel options

4. Role Permission Matrix:
   - Visual grid showing what each role can access
   - Read-only reference

Add ADMIN badge and restrict to Admin/CEO roles.
Provide file for download.
```

---

## 🔵 PHASE 6: Multi-Tenancy Verification
**Time:** 3 hours  
**Prerequisites:** Phase 5 complete  
**Deliverable:** Verified data isolation between companies

### Tasks
- [ ] Create second test company
- [ ] Create user in second company
- [ ] Verify RLS blocks cross-company queries
- [ ] Test all tables for isolation
- [ ] Verify Partner role restrictions
- [ ] Document any security gaps
- [ ] Fix any leakage issues
- [ ] Add company_id checks to all queries

### Continuation Prompt
```
# MissionPulse Phase 6 - Multi-Tenancy Verification

## Context
- Supabase URL: [your URL]
- Database has RLS policies enabled
- Need to verify complete data isolation

## Task
1. Create SQL test script that:
   - Creates Company B with test user
   - Attempts to access Company A's data as Company B user
   - Verifies all tables return empty for wrong company
   - Tests edge cases (direct ID access, joins, etc.)

2. Create verification checklist I can run manually

3. If any gaps found, provide SQL fixes

4. Test Partner role specifically:
   - Can only see assigned sections
   - Cannot see pricing data
   - Cannot see competitor intel

Provide SQL scripts and checklist.
```

---

## 🔵 PHASE 7: File Storage System
**Time:** 4 hours  
**Prerequisites:** Phase 6 complete  
**Deliverable:** File upload/download working

### Tasks
- [ ] Create Supabase storage buckets
- [ ] Configure storage RLS policies
- [ ] Build file upload component
- [ ] Build file list component
- [ ] Add to RFP Shredder module (M4)
- [ ] Add to Iron Dome module (M6)
- [ ] File type validation
- [ ] File size limits
- [ ] Progress indicator
- [ ] Download functionality
- [ ] Delete functionality
- [ ] CUI file warnings

### Continuation Prompt
```
# MissionPulse Phase 7 - File Storage System

## Context
- Supabase URL: [your URL]
- Need secure file storage for RFPs and proposals
- CUI-sensitive documents possible

## Task
1. Supabase Storage Setup:
   - Create bucket structure (rfp-uploads, proposal-drafts, exports)
   - RLS policies for company isolation
   - File path: {company_id}/{opportunity_id}/{filename}

2. File Upload Component (React):
   - Drag-drop zone
   - File type validation (PDF, DOCX, XLSX)
   - Size limit (50MB)
   - Progress bar
   - Success/error states

3. File List Component:
   - Display uploaded files
   - Download button
   - Delete button (with confirmation)
   - File metadata (size, date, uploader)

4. CUI Handling:
   - Warning banner for uploads
   - Portion marking reminder

Provide components and SQL for storage setup.
```

---

## 🔵 PHASE 8: AI Agent Integration
**Time:** 6 hours  
**Prerequisites:** Phase 7 complete  
**Deliverable:** All AI agents connected to frontend

### Tasks
- [ ] Create api-client.js for Render backend calls
- [ ] Update M1 Pipeline Intel with Capture agent
- [ ] Update M2 War Room with Strategy agent
- [ ] Update M5 Contracts with Contracts agent
- [ ] Update M6 Iron Dome with Writer agent
- [ ] Update M7 Black Hat with Black Hat agent
- [ ] Update M8 Pricing with Pricing agent
- [ ] Add context injection (company, opportunity)
- [ ] Add loading states
- [ ] Add error handling
- [ ] Add token usage tracking
- [ ] Save chat history to database

### Continuation Prompt
```
# MissionPulse Phase 8 - AI Agent Integration

## Context
- Supabase URL: [your URL]
- Render Backend: https://missionpulse-api.onrender.com
- 8 AI Agents available:
  - /api/agents/capture/chat
  - /api/agents/strategy/chat
  - /api/agents/blackhat/chat
  - /api/agents/pricing/chat
  - /api/agents/compliance/chat
  - /api/agents/writer/chat
  - /api/agents/contracts/chat
  - /api/agents/orals/chat

## Task
1. Create api-client.js:
   - Wrapper for Render API calls
   - Include auth token
   - Include context (company_id, opportunity_id, user_role)
   - Handle streaming responses
   - Track token usage

2. Update modules to use real agents:
   - Replace setTimeout mocks with actual API calls
   - Add loading spinners
   - Add error toasts
   - Save conversations to chat_history table

3. Context injection format:
   {
     company_id: "uuid",
     opportunity_id: "uuid",
     user_role: "PM",
     company_profile: {...},
     opportunity_details: {...}
   }

Provide api-client.js and update instructions for each module.
```

---

## 🔵 PHASE 9: Company Setup Wizard
**Time:** 4 hours  
**Prerequisites:** Phase 8 complete  
**Deliverable:** Onboarding flow for new customers

### Tasks
- [ ] Create setup-wizard.html
- [ ] Step 1: Company profile
- [ ] Step 2: NAICS codes
- [ ] Step 3: Set-aside status
- [ ] Step 4: Contract vehicles
- [ ] Step 5: Win themes library
- [ ] Step 6: Past performance
- [ ] Step 7: Invite team members
- [ ] Step 8: Import first opportunity
- [ ] Progress indicator
- [ ] Save progress (resume later)
- [ ] Skip optional steps
- [ ] Completion celebration

### Continuation Prompt
```
# MissionPulse Phase 9 - Company Setup Wizard

## Context
- Supabase URL: [your URL]
- New customers need guided onboarding
- 8-step wizard flow

## Task
Build setup-wizard.html - Multi-step onboarding:

Step 1: Company Profile
- Company name, CAGE code, DUNS
- Logo upload
- Primary contact

Step 2: NAICS Codes
- Search/select NAICS codes
- Primary vs secondary

Step 3: Set-Aside Status
- Checkboxes: SDVOSB, 8(a), HUBZone, WOSB, etc.

Step 4: Contract Vehicles
- GSA schedules, OASIS, SEWP, agency-specific

Step 5: Win Themes Library
- Add 3-5 standard win themes
- Templates provided

Step 6: Past Performance
- Add key past contracts
- Agency, value, description

Step 7: Invite Team
- Bulk email invite
- Role assignment

Step 8: First Opportunity
- Import from SAM.gov or manual entry

Include progress bar, back/next navigation, skip option.
Provide file for download.
```

---

## 🔵 PHASE 10: Enterprise Integrations
**Time:** 8 hours  
**Prerequisites:** Phase 9 complete  
**Deliverable:** Microsoft 365 + HubSpot connected

### Tasks
- [ ] Azure AD app registration
- [ ] Microsoft Graph API setup
- [ ] Outlook calendar sync (deadlines)
- [ ] SharePoint document sync
- [ ] Teams notifications (optional)
- [ ] HubSpot Private App setup
- [ ] HubSpot Companies sync
- [ ] HubSpot Deals sync
- [ ] Webhook handlers
- [ ] Integration settings page
- [ ] Connection status indicators
- [ ] Disconnect option

### Continuation Prompt
```
# MissionPulse Phase 10 - Enterprise Integrations

## Context
- Supabase URL: [your URL]
- Target integrations: Microsoft 365, HubSpot CRM
- User needs to connect their own accounts

## Task A: Microsoft 365 Integration
1. Azure AD App Registration instructions
2. OAuth flow implementation
3. Calendar sync:
   - Push deadlines to Outlook
   - Pull calendar availability
4. Integration settings UI

## Task B: HubSpot Integration
1. HubSpot Private App setup instructions
2. OAuth flow implementation
3. Bi-directional sync:
   - Companies ↔ HubSpot Companies
   - Opportunities ↔ HubSpot Deals
4. Webhook handler for updates

## Task C: Settings Page
- integrations.html
- Connection cards for each service
- Connect/Disconnect buttons
- Sync status indicators
- Last sync timestamp

Provide setup instructions and code files.
```

---

## 🔵 PHASE 11: Compliance & Billing
**Time:** 6 hours  
**Prerequisites:** Phase 10 complete  
**Deliverable:** CMMC controls + Stripe billing

### Tasks
- [ ] Audit logging implementation
- [ ] Session timeout (15 min idle)
- [ ] MFA option (TOTP)
- [ ] CUI banner component
- [ ] Export restrictions
- [ ] Stripe account setup
- [ ] Pricing tiers configuration
- [ ] Subscription checkout flow
- [ ] Billing portal link
- [ ] Usage metering (AI tokens)
- [ ] Invoice history
- [ ] Upgrade/downgrade flow

### Continuation Prompt
```
# MissionPulse Phase 11 - Compliance & Billing

## Context
- Supabase URL: [your URL]
- Need CMMC 2.0 Level 1 compliance minimum
- Stripe for billing

## Task A: CMMC Compliance
1. Audit Logging:
   - Log all data access
   - Log all changes
   - 90-day retention
   - Export capability

2. Session Security:
   - 15-minute idle timeout
   - Secure session storage
   - Force re-auth for sensitive actions

3. CUI Handling:
   - Banner component for CUI pages
   - Portion marking reminders
   - Export warnings

## Task B: Stripe Billing
1. Pricing tiers:
   - Starter: $499/mo (5 users, 3 opps)
   - Professional: $1,499/mo (25 users, 15 opps)
   - Enterprise: Custom

2. Implementation:
   - Stripe Checkout for new subscriptions
   - Customer Portal for management
   - Webhook handler for events
   - Usage tracking for AI tokens

3. Billing page (billing.html):
   - Current plan display
   - Usage meters
   - Upgrade button
   - Invoice history

Provide compliance checklist and billing implementation.
```

---

## 🔵 PHASE 12: QA & Launch
**Time:** 4 hours  
**Prerequisites:** Phase 11 complete  
**Deliverable:** Production-ready system

### Tasks
- [ ] End-to-end test script
- [ ] RBAC verification (all 11 roles)
- [ ] Multi-tenant isolation test
- [ ] Performance testing
- [ ] Mobile responsiveness check
- [ ] Browser compatibility (Chrome, Edge, Firefox)
- [ ] Error monitoring setup (Sentry)
- [ ] Analytics setup (PostHog)
- [ ] Documentation review
- [ ] First customer account creation
- [ ] Go-live checklist completion

### Continuation Prompt
```
# MissionPulse Phase 12 - QA & Launch

## Context
- All features built
- Need final testing and go-live

## Task A: QA Testing
1. Generate test script covering:
   - Auth flows (login, logout, password reset)
   - RBAC (test each of 11 roles)
   - Data isolation (multi-tenant)
   - All modules functional
   - AI agents responding
   - File upload/download
   - Integrations working

2. Performance checklist:
   - Page load times
   - API response times
   - Concurrent user test

## Task B: Monitoring Setup
1. Sentry error tracking
2. PostHog analytics
3. Uptime monitoring

## Task C: Go-Live Checklist
- [ ] Production environment verified
- [ ] SSL certificates valid
- [ ] Backup system tested
- [ ] Support email configured
- [ ] First customer account ready
- [ ] Onboarding call scheduled

Provide test scripts and launch checklist.
```

---

## 📋 QUICK REFERENCE

### Start Each Session With:
```
# MissionPulse Phase [X] - [Name]

## Completed Phases
- P1: ✅ Supabase Setup
- P2: ✅ Database Schema
- P3: ⏳ Current phase...

## Credentials
- Supabase URL: [your URL]
- Supabase Anon Key: [your key]
- Render Backend: https://missionpulse-api.onrender.com

## Context
- Frontend: https://missionpulse-frontend.netlify.app
- Desktop repo: C:\Users\MaryWomack\Desktop\missionpulse-frontend
- Design: Shield & Pulse UX v8.0 (#00E5FA, #00050F)

## Git Workflow
PowerShell commands one per code block.
Always: cd C:\Users\MaryWomack\Desktop\missionpulse-frontend FIRST

## Task
[Paste the continuation prompt for current phase]
```

---

## 🎯 PHASE DEPENDENCIES

```
P1 (Supabase) ─────┐
                   ▼
P2 (Schema) ───────┤
                   ▼
P3 (Login) ────────┤
                   ▼
P4 (Dashboard) ────┼───► P5 (Users) ────┐
                   │                    │
                   │                    ▼
                   └───► P6 (Tenant) ───┤
                                        ▼
                        P7 (Files) ─────┤
                                        ▼
                        P8 (AI) ────────┤
                                        ▼
                        P9 (Wizard) ────┤
                                        ▼
                        P10 (Enterprise)┤
                                        ▼
                        P11 (Compliance)┤
                                        ▼
                        P12 (Launch) ───► 🚀 GO LIVE
```

---

## ⏱️ TIME TRACKING

| Phase | Estimated | Actual | Status |
|-------|-----------|--------|--------|
| P1 | 2 hrs | ___ | ⬜ |
| P2 | 3 hrs | ___ | ⬜ |
| P3 | 4 hrs | ___ | ⬜ |
| P4 | 4 hrs | ___ | ⬜ |
| P5 | 4 hrs | ___ | ⬜ |
| P6 | 3 hrs | ___ | ⬜ |
| P7 | 4 hrs | ___ | ⬜ |
| P8 | 6 hrs | ___ | ⬜ |
| P9 | 4 hrs | ___ | ⬜ |
| P10 | 8 hrs | ___ | ⬜ |
| P11 | 6 hrs | ___ | ⬜ |
| P12 | 4 hrs | ___ | ⬜ |
| **TOTAL** | **52 hrs** | ___ | |

---

*Ready to start Phase 1? Create your Supabase account and let's go!*
