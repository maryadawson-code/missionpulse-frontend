# rockITdata Pipeline Portal - Project Context

> **For Claude Projects**: Upload all files from this package to your Project Knowledge. Claude will have full context for future development sessions.

## Quick Start

**Main Files:**
1. `rockitdata-portal-complete.jsx` - The full React portal with all features
2. `generate_excel_report.py` - Python script for Excel exports
3. `INTEGRATION-GUIDE.md` - SharePoint & HubSpot connection instructions
4. `PROJECT-CONTEXT.md` - This file (project documentation)

**To continue development**, start a new chat in your Claude Project and say:
- "Let's continue working on the rockITdata portal"
- "Add [feature] to the pipeline portal"
- "Connect the SharePoint integration"

---

## Project Overview

This is a comprehensive React-based pipeline management portal for rockITdata LLC, a small business government contractor (SDVOSB/WOSB) specializing in federal healthcare IT, particularly DHA and VA contracts.

**Owner:** Mary (Capture Lead)
**Business:** Federal Healthcare IT consulting (DHA, VA, CMS, IHS)
**Certifications:** SDVOSB, WOSB

## Current Implementation Status

### ✅ Completed Features

#### 1. Core Portal Structure
- Multi-section navigation (Dashboard, Workspace, Pipeline, Partners, Documents, AI Agents, Integrations)
- Role-based access control (10 roles: Executive, Admin, Capture Manager, Proposal Manager, Contracts, Solution Architect, Analyst, BD, Congressional Liaison, Partner/Subcontractor)
- User switcher for demo/testing purposes
- rockITdata branding (red #990000, rocket logo)

#### 2. Partner Access Control System
- **Isolation**: Partners only see proposals they're invited to
- **Auto-revocation**: Access automatically revoked when proposal marked "Submitted" (stage 9+)
- **Invitation system**: Capture Managers can invite partners via email address
- **Multi-partner support**: Each proposal can have multiple partners/subs with their own workspace
- **Partner-specific navigation**: Partners see simplified portal with only their proposals and documents

#### 3. Partner Invitation Flow
- Capture Managers/Admins/Executives can invite partners
- Add organization name, email, and role (Partner or Subcontractor)
- Bulk invite multiple emails at once
- View pending, active, and revoked access
- Manual revocation option

#### 4. SharePoint Integration (UI Ready)
- Document library browser with 6 categories:
  - Capability Statements
  - Past Performance
  - Proposal Templates
  - Contract Documents
  - Teaming Agreements
  - Brand Assets
- Search and filter functionality
- Per-proposal SharePoint folder links
- Partners see filtered document access (no contracts/teaming docs)

#### 5. HubSpot Integration (UI Ready)
- Connection status display
- Field mapping configuration (Portal → HubSpot)
- Stage mapping (Shipley → HubSpot deal stages)
- Sync status per deal
- Setup instructions included

#### 6. Financial Metrics
- Total Pipeline / Weighted Pipeline
- Direct Costs / Indirect Costs
- Margin % and Margin $
- FTE requirements
- Burn rate analysis
- Wrap rate components (Overhead, Fringe, G&A, Fee)
- Prime vs Subcontractor analysis

#### 7. AI Agents Integration
- 7 Claude Project agents configured:
  - Capture & Proposal Agent
  - DAFE (Defense Appropriations)
  - Contracts Manager Agent
  - Go To Market - Partner Alignment
  - Pipeline Analyst Agent (NEW)
  - Risk Manager Agent (NEW)
  - Financial Analyst Agent (NEW)
- Role-based agent visibility

#### 8. Export Functionality
- CSV export (pipeline data)
- JSON export (full data dump)
- Excel report generator (Python script)

### 🔧 Needs Backend Implementation

#### SharePoint Connection
Three options documented in the code:
1. **Microsoft Graph API** (Recommended) - Full read/write access
2. **SharePoint REST API** - Direct SharePoint access
3. **Power Automate** - No-code option

Required steps:
- Register Azure AD app
- Grant permissions (Sites.Read.All, Files.Read.All)
- Implement MSAL.js authentication
- Replace mock data with API calls

#### HubSpot Connection
Setup required:
1. Create HubSpot Private App with `crm.objects.deals` scope
2. Create custom properties: priority_tier, pwin, margin, agency, solicitation_number
3. Implement backend proxy for API calls
4. Optional: Configure webhooks for real-time sync

#### Authentication
Current state: Demo mode with user switcher
Needs: Actual authentication system (recommend Azure AD SSO for SharePoint integration)

## File Structure

```
/project-portal/
├── rockitdata-complete.jsx    # Main React portal (full implementation)
├── generate_excel_report.py   # Python script for Excel exports
├── PROJECT-CONTEXT.md         # This file
└── INTEGRATION-GUIDE.md       # Detailed integration instructions
```

## Key Data Structures

### Deal Object
```javascript
{
  id: 1,
  name: "DHA Data Governance",
  agency: "DHA",
  solicitation: "HT001126RE011",
  vehicle: "Direct Award (SB Set-Aside)",
  role: "Prime", // or "Sub"
  primePartner: "rockITdata (Prime)",
  setAside: "SDVOSB/WOSB",
  projectedValue: 2300000,
  pWin: 0.75,
  weightedValue: 1725000,
  proposalDue: "2026-01-09",
  expectedAward: "2026-04-30",
  stage: 9, // 1-10 Shipley stages
  priorityTier: "P-0", // P-0, P-1, P-2
  strategicLane: "DHA Prime Authority",
  gateStatus: "GO", // GO, CONDITIONAL GO, PAUSE
  margin: 0.42,
  marginDollars: 966000,
  directCosts: 1334000,
  indirectCosts: 524000,
  fte: 4.2,
  monthlyRevenue: 95833,
  // Partner access control
  partnerAccess: [
    {
      odernerId: 101,
      odername: 'LMI',
      email: 'team@lmi.org',
      role: 'subcontractor',
      accessGranted: '2025-11-15',
      accessRevoked: '2026-01-09', // only if revoked
      status: 'active' // active, pending, revoked
    }
  ],
  sharePointFolder: '/Shared Documents/Proposals/HT001126RE011',
  hubspotDealId: 'hs_deal_001'
}
```

### User Object
```javascript
{
  id: 1,
  name: 'Mary',
  email: 'mary@rockitdata.com',
  role: 'admin', // matches roles object
  initials: 'M',
  title: 'Capture Lead',
  organization: 'rockITdata',
  partnerId: null // only set for external partners
}
```

### Partner Access Rules
1. Partners with `role: 'partner'` or `role: 'subcontractor'` see limited navigation
2. Partners only see deals where their email appears in `partnerAccess` with `status: 'active'`
3. When `deal.stage >= 9` (Submitted), all partner access is auto-revoked
4. Partners cannot see contracts/teaming documents in SharePoint
5. Partners cannot invite other partners

## Configuration Points

### SharePoint (Update in code)
```javascript
const sharepointConfig = {
  siteUrl: 'https://rockitdata.sharepoint.com/sites/ProposalPortal', // UPDATE
  libraries: { ... },
  proposalFolderPattern: '/Shared Documents/Proposals/{solicitation}'
};
```

### HubSpot (Update in code)
```javascript
const hubspotConfig = {
  portalId: 'YOUR_PORTAL_ID', // UPDATE
  apiEndpoint: '/api/hubspot',
  pipelineId: 'default',
  stageMapping: { ... },
  customProperties: [ ... ]
};
```

### Claude Project IDs (Update for your projects)
```javascript
const claudeProjects = {
  captureProposal: {
    id: '019bb290-838f-704d-92aa-434b40f16ef6', // UPDATE with your project IDs
    url: 'https://claude.ai/project/019bb290-838f-704d-92aa-434b40f16ef6',
    ...
  },
  ...
};
```

## Shipley Stage Mapping

| ID | Stage | Short | Color | Description |
|----|-------|-------|-------|-------------|
| 1 | Gate 1 | G1 | Gray | Initial qualification |
| 2 | Capture | CAP | Blue | Active capture |
| 3 | Blue Team | BLUE | Cyan | Initial draft review |
| 4 | Kickoff | KO | Purple | Proposal kickoff |
| 5 | Pink Team | PINK | Pink | Compliance review |
| 6 | Red Team | RED | Red | Final review |
| 7 | Gold Team | GOLD | Amber | Executive review |
| 8 | White Glove | WG | Green | Final production |
| 9 | Submitted | SUB | Teal | **Partner access revoked** |
| 10 | Active | ACT | Green | Contract active |

## Role Permissions Matrix

| Role | View All | Edit | Manage Users | Manage Projects | Invite Partners |
|------|----------|------|--------------|-----------------|-----------------|
| Executive | ✅ | ✅ | ✅ | ✅ | ✅ |
| Admin | ✅ | ✅ | ✅ | ✅ | ✅ |
| Capture | ✅ | ✅ | ❌ | ✅ | ✅ |
| Proposal | ❌ | ✅ | ❌ | ✅ | ❌ |
| Contracts | ❌ | ✅ | ❌ | ❌ | ❌ |
| Lead | ❌ | ✅ | ❌ | ❌ | ❌ |
| Analyst | ❌ | ❌ | ❌ | ❌ | ❌ |
| BD | ❌ | ✅ | ❌ | ❌ | ❌ |
| Congressional | ❌ | ❌ | ❌ | ❌ | ❌ |
| Partner | ❌ | ❌ | ❌ | ❌ | ❌ |
| Subcontractor | ❌ | ❌ | ❌ | ❌ | ❌ |

## Current Pipeline (Sample Data)

| Priority | Deal | Agency | Value | pWin | Stage |
|----------|------|--------|-------|------|-------|
| P-0 | DHA Data Governance | DHA | $2.3M | 75% | Submitted |
| P-0 | VA CCN Next Gen | VA | $10M | 35% | Kickoff |
| P-0 | VA EHRM Restart | VA | $1.5M | 65% | Active |
| P-1 | VA IHT 2.0 | VA | $4M | 45% | Capture |
| P-1 | VA NAII AI Policy | VA | $3M | 50% | Capture |
| P-1 | DHA OPMED PAE | DHA | $2.5M | 30% | Capture |

## Next Development Priorities

1. **Authentication**: Implement Azure AD SSO
2. **SharePoint API**: Replace mock docs with real Graph API calls
3. **HubSpot Sync**: Build backend proxy and webhook handlers
4. **Database**: Add persistence layer (recommend Supabase or Firebase)
5. **Notifications**: Email alerts for partner invites, deadlines
6. **Audit Log**: Track partner access changes

## Questions for Mary

When continuing development, consider:
1. Which SharePoint site/libraries should we connect to?
2. Do you have HubSpot API credentials ready?
3. What authentication method does rockITdata prefer (Azure AD, Okta, etc.)?
4. Should partners be able to upload documents?
5. Do you need approval workflow for partner invitations?
