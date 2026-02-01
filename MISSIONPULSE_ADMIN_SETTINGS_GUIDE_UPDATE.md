# MissionPulse Admin Settings Guide - Update v1.1

**Version:** 1.1  
**Last Updated:** February 1, 2026  
**Owner:** Mission Meets Tech (MMT)  
**Classification:** UNCLASSIFIED // FOR PUBLIC RELEASE

---

## WHAT'S NEW IN v1.1

This update documents the new Admin Settings module (missionpulse-admin-settings.html) deployed in Sprint 29. Key additions include:

- Solo Mode enable/disable toggle
- Subscription tier management
- Enhanced security settings
- Feature flags for new capabilities

---

## ACCESSING ADMIN SETTINGS

**Required Roles:** Executive, Operations (COO), or Admin

1. Click the **gear icon** (⚙️) in the top-right navigation
2. Select **Admin Settings** from the dropdown
3. Or navigate directly to: `https://missionpulse.netlify.app/missionpulse-admin-settings.html`

[SCREENSHOT: Navigation showing Admin Settings location]

---

## COMPANY SETTINGS TAB

### Basic Information

| Field | Description | Example |
|-------|-------------|---------|
| **Company Name** | Your legal business name | Mission Meets Tech LLC |
| **CAGE Code** | Commercial and Government Entity Code | 8ABC1 |
| **UEI Number** | Unique Entity Identifier | ABCD1234EFGH5678 |
| **Primary NAICS** | Primary North American Industry Classification | 541512 |

### Set-Aside Certifications

Select all applicable small business certifications:

- [ ] SDVOSB (Service-Disabled Veteran-Owned Small Business)
- [ ] WOSB (Women-Owned Small Business)
- [ ] 8(a) Business Development Program
- [ ] HUBZone
- [ ] Small Business (General)

> **Note:** Set-aside certifications are used by AI agents to filter relevant opportunities and ensure compliance messaging aligns with your status.

---

## FEATURES TAB

### Solo Proposal Manager Mode

**Availability:** Professional and Enterprise subscriptions only

| Setting | Options | Description |
|---------|---------|-------------|
| **Solo Mode Enabled** | On / Off | Enables Solo Mode interface for all users |
| **Default New Proposals** | Solo / Team | Sets default mode when creating new proposals |

**To Enable Solo Mode:**

1. Navigate to Admin Settings → Features
2. Locate "Solo Proposal Manager Mode"
3. Toggle the switch to **ON**
4. Click **Save Changes**

[SCREENSHOT: Solo Mode toggle in Features tab]

**Audit Trail:**

When Solo Mode is enabled or disabled, the system logs:
- Timestamp
- User who made the change
- Previous setting
- New setting

Access the audit log at Admin Settings → Audit Log.

---

### CUI Auto-Classification

**Availability:** All subscription tiers

| Setting | Options | Description |
|---------|---------|-------------|
| **Auto-Classification** | On / Off | Enables automatic CUI detection in queries |
| **Default AI Model** | AskSage / Claude | Sets default model when no CUI detected |
| **Classification Strictness** | Low / Medium / High | Adjusts sensitivity of CUI detection |

**Classification Strictness Levels:**

- **Low:** Only detects explicit CUI markers and obvious sensitive content
- **Medium (Recommended):** Balanced detection including context-aware patterns
- **High:** Maximum sensitivity, may produce false positives

---

### Other Feature Toggles

| Feature | Description | Tier Required |
|---------|-------------|---------------|
| AI Agent Chat | Enable/disable AI chat widgets | Starter+ |
| Black Hat Module | Competitive intelligence features | Professional+ |
| Orals Studio | Presentation builder and coaching | Professional+ |
| AskSage Integration | Route CUI to FedRAMP High AI | Enterprise |
| Custom Branding | White-label interface options | Enterprise |

---

## SUBSCRIPTION TAB

### Current Subscription

Displays your current subscription tier and usage:

| Metric | Description |
|--------|-------------|
| **Plan** | Starter / Professional / Enterprise |
| **Billing Cycle** | Monthly / Annual |
| **Active Users** | Current vs. allowed user count |
| **Proposals** | Active proposals vs. limit |
| **API Calls** | Monthly AI agent usage |

### Tier Comparison

| Feature | Starter | Professional | Enterprise |
|---------|---------|--------------|------------|
| Active Proposals | 5 | 25 | Unlimited |
| AI Agent Queries | 100/mo | 1,000/mo | Unlimited |
| Solo Mode | ❌ | ✅ | ✅ |
| Black Hat Module | ❌ | ✅ | ✅ |
| AskSage (FedRAMP) | ❌ | ❌ | ✅ |
| Custom Branding | ❌ | ❌ | ✅ |
| Support | Email | Priority | Dedicated |

### Upgrading Your Subscription

1. Navigate to Admin Settings → Subscription
2. Click **Change Plan**
3. Select your desired tier
4. Enter payment information (if not on file)
5. Confirm upgrade

> **Note:** Upgrades take effect immediately. Downgrades take effect at the next billing cycle.

---

## SECURITY SETTINGS TAB

### Multi-Factor Authentication (MFA)

| Setting | Options | Description |
|---------|---------|-------------|
| **Require MFA** | On / Off | Forces MFA for all users |
| **MFA Methods** | Authenticator App, SMS, Email | Allowed verification methods |
| **Grace Period** | 0-7 days | Days before MFA is enforced for new users |

### Session Management

| Setting | Default | Range | Description |
|---------|---------|-------|-------------|
| **Session Timeout** | 8 hours | 1-24 hrs | Inactive session duration |
| **Max Sessions** | 3 | 1-10 | Concurrent sessions per user |
| **Remember Device** | On | On/Off | Skip MFA on trusted devices |

### Password Policy

| Setting | Default | Description |
|---------|---------|-------------|
| **Minimum Length** | 12 characters | Required password length |
| **Complexity** | Required | Upper, lower, number, special character |
| **Expiration** | 90 days | Password change frequency |
| **History** | 5 passwords | Prevent reuse of recent passwords |

---

## USERS & ROLES TAB

### Adding Users

1. Click **+ Add User**
2. Enter email address
3. Select role from dropdown
4. (Optional) Assign to specific proposals
5. Click **Send Invitation**

### Role Assignment Matrix

| Role | Module Access | AI Agents | Gate Authority |
|------|---------------|-----------|----------------|
| Executive | Full | All 8 | All gates |
| Operations | Full (no admin) | 6 agents | Gate 1, Blue, Red |
| Capture Manager | Pipeline, Strategy, BlackHat | 5 agents | Gate 1, Blue |
| Proposal Manager | Proposals, Workflow | 4 agents | Pink, Red |
| Pricing Analyst | Pricing, BOE | 2 agents | None |
| Teaming Partner | Assigned only | Writer only | None |
| **Solo Owner** | **Full** | **All 8** | **All gates (self)** |

> **New in v1.1:** Solo Owner role automatically assigned when Solo Mode is enabled for a proposal.

### Deactivating Users

1. Select user from list
2. Click **Actions → Deactivate**
3. Choose whether to reassign their proposals
4. Confirm deactivation

Deactivated users cannot log in but their activity history is preserved in audit logs.

---

## INTEGRATIONS TAB

### Available Integrations

| Integration | Status | Tier Required |
|-------------|--------|---------------|
| Microsoft 365 | Available | Professional+ |
| HubSpot CRM | Available | Professional+ |
| SharePoint | Available | Professional+ |
| AskSage | Coming Soon | Enterprise |
| SAM.gov | Coming Soon | All |
| Deltek GovWin | Coming Soon | Professional+ |

### Configuring Integrations

1. Navigate to Admin Settings → Integrations
2. Click **Connect** next to desired integration
3. Complete OAuth authentication flow
4. Configure sync settings (one-way / two-way)
5. Test connection

---

## AUDIT LOG TAB

### Viewing Audit Logs

The audit log captures all administrative actions:

| Event Type | What's Logged |
|------------|---------------|
| User Changes | Add, remove, role change, deactivation |
| Settings Changes | Feature toggles, security settings, subscription |
| Solo Mode Events | Enable, disable, proposal conversions |
| CUI Events | Classification decisions, model routing |
| Gate Decisions | Approvals, overrides, no-go decisions |

### Filtering Audit Logs

Filter by:
- Date range
- Event type
- User
- Proposal
- Module

### Exporting Audit Logs

Click **Export** to download logs as CSV for compliance documentation.

---

## TROUBLESHOOTING

### Solo Mode Not Appearing

**Issue:** Solo Mode toggle not visible in Features tab

**Solution:** Verify your subscription tier is Professional or Enterprise. Solo Mode is not available on Starter plans.

### Unable to Save Settings

**Issue:** Settings changes not saving

**Solution:** 
1. Check that you have Executive, Operations, or Admin role
2. Verify no validation errors (highlighted in red)
3. Try refreshing the page and re-entering changes

### User Invitation Not Received

**Issue:** New users not receiving invitation emails

**Solution:**
1. Check spam/junk folders
2. Verify email address is correct
3. Resend invitation from Users tab
4. Contact support if issue persists

---

## RELATED DOCUMENTATION

- [Solo Mode User Guide](/docs/solo-mode-user-guide)
- [CUI Auto-Classification Technical Brief](/docs/cui-classification)
- [Role-Based Access Control Reference](/docs/rbac-reference)
- [Security & Compliance Overview](/docs/security-compliance)

---

*Classification: UNCLASSIFIED*  
*Mission Meets Tech - MissionPulse*  
*Mission. Technology. Transformation.*
