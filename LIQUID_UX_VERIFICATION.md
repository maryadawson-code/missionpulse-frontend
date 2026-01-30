# LIQUID UX VERIFICATION CHECKLIST
## rockITdata AI Portal (AMANDA™) — Specification v6.0 FINAL

**Date:** January 16, 2026  
**Status:** ✅ VERIFIED COMPLETE

---

## Liquid UX Definition

> **"Liquid UX"** is the design philosophy that creates an interface that is **not static**, but instead **purposefully adapts** to the specific user's role and the current project phase.

---

## ✅ COMPONENT 1: Role-Aware Adaptation

**Requirement:** The portal's start page and available tools physically shift based on who is logging in. Executives see a high-density Command Center, while project teams see a focused "War Room".

### Specification Coverage

| Documented In | Section | Status |
|---------------|---------|--------|
| v6.0 Spec | §19. Role-Aware Adaptation | ✅ Complete |
| React Mockup | `amanda-ecosystem-mockup.jsx` | ✅ Implemented |

### Implementation Details

| Role | Start Page | Primary Tools |
|------|------------|---------------|
| Executive (CEO/COO) | **Command Center** | Revenue dashboard, gate approvals, portfolio view |
| Capture Lead | War Room + Intel | Competitive analysis, win themes, strategy coach |
| Proposal Manager | **War Room** | Workflow board, task assignments, deadline tracker |
| Finance | War Room + Pricing | BOE calculator, margin alerts, rate validation |
| Contracts | War Room + Compliance | FAR/DFARS checker, T&C review, risk register |
| Analyst/Writer | War Room (focused) | Assigned sections only, AI drafting |
| Partner | Limited War Room | Assigned scope only, no competitive intel |

### Prime vs Sub Mode

| Mode | UI Configuration | Key Features |
|------|------------------|--------------|
| **PRIME** | Authority UI | Subcontractor Management Suite, FAR 52.219-14 CoP Model, SubK SOW generation |
| **SUB** | Defender UI | Workshare Protection, Red Flags in Partner TAs, exclusivity alerts |

---

## ✅ COMPONENT 2: Phase-Driven Intelligence (Focus Mode)

**Requirement:** The interface follows a "Focus Mode" where the UI only highlights the tools and actions required for the active phase (e.g., Phase 2: Kickoff), keeping other complex features "liquid" and tucked away until they are needed.

### Specification Coverage

| Documented In | Section | Status |
|---------------|---------|--------|
| v6.0 Spec | §20. Phase-Driven Intelligence | ✅ Complete |
| React Mockup | `currentPhase` state management | ✅ Implemented |

### Focus Mode by Phase

| Phase | Visible Tools | Hidden Until Needed |
|-------|---------------|---------------------|
| P0: Qualification | Go/No-Go analyzer, pWin calculator | Compliance matrix, section drafting |
| P1: Capture | Win themes, Black Hat, competitive intel | Pricing tools, review cycles |
| P2: Kickoff | RFP shredder, compliance matrix, assignments | Red Team, Gold Team reviews |
| P3: Development | AI drafting, section writing, live sync | Final QA, submission checklist |
| P4: Review | Pink/Red/Gold review tools, issue register | Archive, lessons learned |
| P5: Submission | Final checklist, compliance verification | New opportunity tools |

### "You Are Here" Indicator
Every screen includes a phase indicator showing current position in the Shipley lifecycle, with clear visual distinction between:
- ✅ Completed phases
- 🔵 Active phase (highlighted)
- ⬜ Upcoming phases (dimmed)

---

## ✅ COMPONENT 3: Handoff Micro-interactions

**Requirement:** To maintain flow, the UI uses subtle animations to "pass the pen" between stakeholders, visually handing off task cards across swimlanes on the Miro-style board.

### Specification Coverage

| Documented In | Section | Status |
|---------------|---------|--------|
| v6.0 Spec | §21. Handoff Micro-interactions | ✅ Complete |
| React Mockup | `showHandoff` state + animations | ✅ Implemented |

### Visual Pen Tracking
The War Room features a **Miro-style Workflow Board** showing the "pen" moving across stakeholder lanes:

```
┌─────────┬─────────┬─────────┬─────────┬─────────┬─────────┬─────────┐
│   CEO   │ CAPTURE │   PM    │   SA    │ FINANCE │CONTRACTS│ PARTNERS│
├─────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
│ Gate    │ Win     │ ●ACTIVE │ Tech    │ Pricing │ T&C     │ Section │
│ Approve │ Themes  │ Card    │ Approach│ Review  │ Review  │ Contrib │
└─────────┴─────────┴─────────┴─────────┴─────────┴─────────┴─────────┘
                          ↓
                    [Handoff Animation]
                          ↓
┌─────────┬─────────┬─────────┬─────────┬─────────┬─────────┬─────────┐
│   CEO   │ CAPTURE │   PM    │   SA    │ FINANCE │CONTRACTS│ PARTNERS│
├─────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
│ Gate    │ Win     │ Done    │ ●ACTIVE │ Pricing │ T&C     │ Section │
│ Approve │ Themes  │         │ Card    │ Review  │ Review  │ Contrib │
└─────────┴─────────┴─────────┴─────────┴─────────┴─────────┴─────────┘
```

### Animated Handoff Sequence
When a task is ready for the next person:
1. **Visual Movement**: Active card slides to the next swimlane
2. **Lane Highlight**: Receiving stakeholder's lane pulses/highlights
3. **Notification**: In-app toast notification to the next owner
4. **M365 Integration**: Auto-create Outlook task/calendar invite (if connected)
5. **Audit Log**: Record handoff in decision object audit trail

### Stakeholder Lanes

| Lane | Owner | Typical Actions |
|------|-------|-----------------|
| CEO | Executive | Gate approvals, Go/No-Go decisions |
| Capture | Capture Lead | Strategy, win themes, competitive analysis |
| PM | Proposal Manager | Coordination, schedule, assignments |
| SA | Solution Architect | Technical approach, architecture |
| Finance | Finance Lead | Pricing, margins, BOE validation |
| Contracts | Contracts Lead | FAR/DFARS compliance, T&C review |
| Partners | Teaming Partners | Assigned section contributions |

---

## ✅ COMPONENT 4: Seamless Integration (Microsoft 365 Bridge)

**Requirement:** The "Liquid" nature extends to external ecosystems, such as an optional Microsoft 360 bridge, allowing for live document co-authoring without leaving the primary workspace.

### Specification Coverage

| Documented In | Section | Status |
|---------------|---------|--------|
| v6.0 Spec | §22. Microsoft 365 Integration Bridge | ✅ Complete |
| Module File | `m365_connector.py` (planned) | 🔄 In Development |

### Integration Capabilities

| Integration | Capability | Trigger |
|-------------|------------|---------|
| **SharePoint Sync** | Drafts sync directly to proposal document library | Auto on save |
| **Live Co-Authoring** | "Live Sync" toggle opens Word session in-app | Manual toggle |
| **Outlook Tasks** | Gate handoffs auto-create tasks with Decision Memo attached | On handoff |
| **Calendar Sync** | Review dates, deadlines sync to Outlook calendar | Phase transition |
| **Teams Notifications** | Gate decisions, handoffs post to proposal channel | On event |
| **Azure AD SSO** | Corporate login for CMMC-compliant audit logging | On login |

### Live Sync Toggle
In Phase 3 (Development), a **"Live Sync"** toggle activates Microsoft Graph API integration:

```
┌────────────────────────────────────────────────────────────────┐
│  📝 Section 4.0 - Technical Approach                          │
│                                                                │
│  [🔗 Live Sync: ON ●]  Connected to SharePoint                │
│                                                                │
│  When enabled:                                                 │
│  • AI assistant syncs drafts to configured SharePoint folder  │
│  • Opens live Word session for collaborative editing          │
│  • Changes auto-save with version history                     │
│  • Conflict detection and merge support                       │
└────────────────────────────────────────────────────────────────┘
```

---

## VERIFICATION SUMMARY

| Component | Documented | Implemented | Status |
|-----------|------------|-------------|--------|
| Role-Aware Adaptation | ✅ §19 | ✅ JSX Mockup | **COMPLETE** |
| Phase-Driven Intelligence | ✅ §20 | ✅ JSX Mockup | **COMPLETE** |
| Handoff Micro-interactions | ✅ §21 | ✅ JSX Mockup | **COMPLETE** |
| Microsoft 365 Bridge | ✅ §22 | 🔄 Planned | **DOCUMENTED** |

---

## FILES INVENTORY

| File | Purpose | Liquid UX Coverage |
|------|---------|-------------------|
| `ROCKITDATA_PORTAL_SPEC_v6_LIQUID_UX_FINAL.docx` | Complete specification | All 4 components |
| `amanda-ecosystem-mockup.jsx` | React prototype | War Room, handoffs, M365 |
| `amanda-war-room.jsx` | War Room focus | Focus Mode, pen tracking |
| `amanda-executive-dashboard.jsx` | Command Center | Executive view |
| `app.py` | Production application | Core implementation |

---

## ALIGNMENT CONFIRMATION

The v6.0 FINAL specification with Liquid UX is **100% aligned** to the required design philosophy:

✅ **Role-Aware Adaptation** — Start page shifts based on user role (War Room vs Command Center)

✅ **Phase-Driven Intelligence** — Focus Mode highlights only active phase tools

✅ **Handoff Micro-interactions** — Animated pen passing across Miro-style swimlanes

✅ **Seamless Integration** — Optional Microsoft 365 bridge for live document co-authoring

---

*Document generated for rockITdata LLC*  
*"Driven by Innovation. Built on Trust."*  
*AI GENERATED - REQUIRES HUMAN REVIEW*
