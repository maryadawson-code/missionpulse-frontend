# MissionPulse v2 Development Sprint Plan
## Federal-Grade Architecture Roadmap
### Generated: January 28, 2026 (Updated with Additional Features)

---

## Executive Summary

| Metric | Value |
|--------|-------|
| **Total Sprints** | 18 (Sprint 14-31) |
| **Estimated Duration** | 10-12 weeks |
| **Total Dev Hours** | 115-165 hours |
| **Target Completion** | April 25, 2026 |
| **Release Version** | v2.0 Production |

---

## ⭐ ADDITIONAL FEATURES REQUESTED (January 28, 2026)

| # | Feature | Sprint | Priority |
|---|---------|--------|----------|
| 1 | **CSV User Upload** - Bulk add users via CSV file | Sprint 15 | 🔴 HIGH |
| 2 | **HubSpot Field Alignment** - Model opportunities to match HubSpot deals | Sprint 16A | 🔴 HIGH |
| 3 | **Chat UX Enhancement** - Enter to send + agent-specific suggested prompts | Sprint 26 | 🟡 MED |
| 4 | **Request Access Form** - Public form with email notification to Gmail | Sprint 14A | 🔴 HIGH |
| 5 | **Multi-Tenant Isolation** - Company-level data separation (no data bleed) | Sprint 23 | 🔴 HIGH |

## ⭐ ADDITIONAL FEATURES REQUESTED (January 28, 2026 - Part 2)

| # | Feature | Sprint | Priority |
|---|---------|--------|----------|
| 6 | **Office 365 Integration** - Simple OAuth button for non-technical users | Sprint 28 | 🟡 MED |
| 7 | **AskSage Integration** - Connect to DoD IL5 AI platform | Sprint 28 | 🟡 MED |
| 8 | **Common GovCon Integrations** - SAM.gov, GovWin, SharePoint, Slack | Sprint 28 | 🟡 MED |
| 9 | **Solo Proposal Manager Mode** - Guided workflow for small companies | Sprint 29 | 🔴 HIGH |
| 10 | **RFP Shredder Multi-File** - Support PDF, DOCX, XLSX, TXT, MSG, ZIP | Sprint 16 | 🟡 MED |
| 11 | **Company Knowledge Base** - Upload training docs, build company memory (RAG) | Sprint 30 | 🔴 CRITICAL |
| 12 | **AI Image/Diagram Generator** - GPT-style interface for visuals | Sprint 31 | 🟡 MED |

---

## Current State Assessment

### ✅ COMPLETE (Sprints 0-13)
| Component | Status | Live URL |
|-----------|--------|----------|
| Production Deployment | ✅ | missionpulse.netlify.app |
| Staging Environment | ✅ | v2-development--missionpulse-io.netlify.app |
| Supabase Integration | ✅ | 12 opps / $847M pipeline |
| Backend API | ✅ | missionpulse-api.onrender.com |
| AI Agent Hub | ✅ | 8 agents operational |
| Authentication Pages | ✅ | login.html, admin-users.html |
| Unified Dashboard | ✅ | missionpulse-v12-PRODUCTION-COMPLETE.html |

### ⚠️ GAPS IDENTIFIED
| Gap | Risk Level | Impact |
|-----|------------|--------|
| Auth Consistency | 🔴 HIGH | Blocks client deployment |
| User Management Integration | 🟡 MEDIUM | Admin workflow broken |
| M5-M6 Hardcoded | 🟡 MEDIUM | Contracts/Compliance not live |
| M8 Pricing Engine | 🟡 MEDIUM | Core value prop incomplete |
| M9 HITL Queue | 🟡 MEDIUM | AI governance missing |
| M10 Orals Studio | 🟢 LOW | Feature incomplete |
| RBAC Enforcement | 🔴 HIGH | Security vulnerability |
| Partner Auto-Revoke | 🟡 MEDIUM | Compliance gap |
| Document Storage | 🟢 LOW | Manual workaround exists |

---

# 📋 PHASE 1: FOUNDATION (Sprints 14A-15)
## Goal: Secure, Stable Authentication & User Management

---

## Sprint 14A: Request Access Form (NEW FEATURE)
**Duration:** 2-3 hours  
**Branch:** `v2-development`  
**Risk Level:** 🔴 HIGH (Required for lead capture)

### Objectives
1. Create public "Request Access" form on login page
2. Send email notification to maryadawson@gmail.com when form submitted
3. Store access requests in Supabase for tracking
4. Auto-respond to requester with confirmation

### Tasks

| Task | File(s) | Acceptance Criteria |
|------|---------|---------------------|
| 14A.1 Request Form UI | `login.html` | Form with name, email, company, role, message |
| 14A.2 Supabase Table | SQL | `access_requests` table created |
| 14A.3 Email via Edge Function | Supabase Edge Function | Email sent to maryadawson@gmail.com |
| 14A.4 Auto-Response | Supabase Edge Function | Requester receives confirmation |
| 14A.5 Admin View | `admin-users.html` | CEO/Admin can view pending requests |

### SQL Required (Supabase)
```sql
-- Create access_requests table
CREATE TABLE IF NOT EXISTS access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  company_name TEXT NOT NULL,
  job_title TEXT,
  phone TEXT,
  message TEXT,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected, contacted
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_access_requests_status ON access_requests(status);
CREATE INDEX idx_access_requests_email ON access_requests(email);

-- RLS: Anyone can insert, only admins can view
ALTER TABLE access_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can request access"
ON access_requests FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view requests"
ON access_requests FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('CEO', 'COO', 'Admin')
  )
);
```

### Supabase Edge Function (Email Notification)
```typescript
// supabase/functions/notify-access-request/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const ADMIN_EMAIL = 'maryadawson@gmail.com'

serve(async (req) => {
  const { record } = await req.json()
  
  // Send to admin
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'MissionPulse <noreply@missionpulse.io>',
      to: ADMIN_EMAIL,
      subject: `🚀 New Access Request: ${record.full_name} (${record.company_name})`,
      html: `
        <h2>New MissionPulse Access Request</h2>
        <p><strong>Name:</strong> ${record.full_name}</p>
        <p><strong>Email:</strong> ${record.email}</p>
        <p><strong>Company:</strong> ${record.company_name}</p>
        <p><strong>Title:</strong> ${record.job_title || 'Not provided'}</p>
        <p><strong>Message:</strong> ${record.message || 'None'}</p>
        <hr>
        <p><a href="https://missionpulse.io/admin-users.html">Review in Admin Panel</a></p>
      `
    })
  })
  
  // Auto-respond to requester
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'MissionPulse <noreply@missionpulse.io>',
      to: record.email,
      subject: 'MissionPulse Access Request Received',
      html: `
        <h2>Thank you for your interest in MissionPulse!</h2>
        <p>Hi ${record.full_name},</p>
        <p>We've received your access request and will review it shortly.</p>
        <p>You'll hear back from us within 1-2 business days.</p>
        <br>
        <p>Best regards,</p>
        <p>The Mission Meets Tech Team</p>
      `
    })
  })
  
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

### Database Trigger (Auto-send on insert)
```sql
-- Create trigger to call Edge Function on new request
CREATE OR REPLACE FUNCTION notify_access_request()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://djuviwarqdvlbgcfuupa.supabase.co/functions/v1/notify-access-request',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb,
    body := json_build_object('record', NEW)::jsonb
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_access_request
  AFTER INSERT ON access_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_access_request();
```

### Form HTML Component
```html
<!-- Request Access Form on login.html -->
<div id="requestAccessForm" class="hidden">
  <h2 class="text-2xl font-bold text-white mb-6">Request Access</h2>
  <form id="accessForm" class="space-y-4">
    <div>
      <label class="block text-cyan-400 mb-1">Full Name *</label>
      <input type="text" name="full_name" required 
        class="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded text-white">
    </div>
    <div>
      <label class="block text-cyan-400 mb-1">Work Email *</label>
      <input type="email" name="email" required 
        class="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded text-white">
    </div>
    <div>
      <label class="block text-cyan-400 mb-1">Company Name *</label>
      <input type="text" name="company_name" required 
        class="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded text-white">
    </div>
    <div>
      <label class="block text-cyan-400 mb-1">Job Title</label>
      <input type="text" name="job_title" 
        class="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded text-white">
    </div>
    <div>
      <label class="block text-cyan-400 mb-1">How will you use MissionPulse?</label>
      <textarea name="message" rows="3" 
        class="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded text-white"></textarea>
    </div>
    <button type="submit" 
      class="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded">
      Request Access
    </button>
  </form>
  <p class="mt-4 text-center text-gray-400">
    Already have an account? <a href="#" onclick="showLogin()" class="text-cyan-400">Sign In</a>
  </p>
</div>
```

### Deliverables
1. Public access request form on login page
2. Email notification to maryadawson@gmail.com
3. Auto-response to requester
4. Admin panel to view/manage requests
5. Supabase Edge Function deployed

---

## Sprint 14: Authentication Unification
**Duration:** 4-6 hours  
**Branch:** `v2-development`  
**Risk Level:** 🔴 HIGH (Blocks all client deployment)

### Objectives
1. Eliminate demo data fallbacks in auth flow
2. Enforce login before dashboard access
3. Sync user role from Supabase profiles table
4. Implement proper session persistence

### Tasks

| Task | File(s) | Acceptance Criteria |
|------|---------|---------------------|
| 14.1 Auth Guard | `index.html` | Unauthenticated users redirect to login.html |
| 14.2 Session Sync | `supabase-client.js` | User session survives page refresh |
| 14.3 Profile Fetch | `supabase-client.js` | Role loaded from `profiles.role` column |
| 14.4 Demo Mode Toggle | `missionpulse-v12-PRODUCTION-COMPLETE.html` | Environment variable `DEMO_MODE=true/false` |
| 14.5 Logout Handler | `login.html` | Sign out clears session + redirects |

### SQL Required (Supabase)
```sql
-- Ensure profiles table has role column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'Partner';

-- Set test account to CEO
UPDATE profiles SET role='CEO' WHERE email='maryadawson@gmail.com';

-- Create RLS policy for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);
```

### Security Checklist
- [ ] No hardcoded API keys in frontend
- [ ] Session token stored in httpOnly cookie (if possible) or localStorage
- [ ] CORS configured correctly on Render backend
- [ ] Supabase RLS enabled on profiles table

### Deliverables
1. Updated `index.html` with auth guard
2. Updated `supabase-client.js` with session management
3. Updated `login.html` with profile sync
4. Test script for auth flow validation

---

## Sprint 15: User Management Integration + CSV Upload (ENHANCED)
**Duration:** 4-5 hours  
**Branch:** `v2-development`  
**Dependencies:** Sprint 14 complete

### Objectives
1. Integrate `admin-users.html` into main dashboard Admin module
2. Enable CEO/COO/Admin to manage users from within app
3. **NEW: CSV bulk upload for user creation**
4. Add user invitation workflow
5. Implement role change audit logging

### Tasks

| Task | File(s) | Acceptance Criteria |
|------|---------|---------------------|
| 15.1 Admin Module Update | `missionpulse-v12-PRODUCTION-COMPLETE.html` | Admin tab shows User Management |
| 15.2 User List Component | inline | Lists all users with role badges |
| 15.3 Role Editor | inline | Dropdown to change user roles |
| 15.4 Invite User | inline | Email input + role selection + invite button |
| 15.5 **CSV Upload UI** | inline | Drag-drop CSV file upload zone |
| 15.6 **CSV Parser** | inline | Parse CSV, validate columns, preview rows |
| 15.7 **Bulk Insert** | `supabase-client.js` | Insert multiple users with error handling |
| 15.8 **CSV Template Download** | inline | Downloadable template with correct headers |
| 15.9 RBAC Enforcement | inline | Only CEO/COO/Admin see Admin module |
| 15.10 Audit Log Entry | `supabase-client.js` | Role changes logged to activity_log |

### CSV Template Format
```csv
email,full_name,role,phone,company_name
jsmith@company.com,John Smith,PM,555-0100,Acme Corp
jdoe@company.com,Jane Doe,SA,555-0101,Acme Corp
```

**Required Columns:**
- `email` (required, unique)
- `full_name` (required)
- `role` (required, must be valid Shipley role)

**Optional Columns:**
- `phone`
- `company_name` (for multi-tenant future)
- `job_title`

### CSV Upload Component
```javascript
// CSV Upload Handler
const CSVUploader = () => {
  const [file, setFile] = React.useState(null);
  const [preview, setPreview] = React.useState([]);
  const [errors, setErrors] = React.useState([]);
  const [uploading, setUploading] = React.useState(false);

  const VALID_ROLES = ['CEO', 'COO', 'CAP', 'PM', 'SA', 'FIN', 'CON', 'DEL', 'QA', 'Partner', 'Admin'];
  const REQUIRED_COLUMNS = ['email', 'full_name', 'role'];

  const parseCSV = (text) => {
    const lines = text.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    // Validate headers
    const missingCols = REQUIRED_COLUMNS.filter(col => !headers.includes(col));
    if (missingCols.length > 0) {
      setErrors([`Missing required columns: ${missingCols.join(', ')}`]);
      return [];
    }
    
    const rows = [];
    const rowErrors = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const row = {};
      headers.forEach((header, idx) => {
        row[header] = values[idx] || '';
      });
      
      // Validate row
      if (!row.email || !row.email.includes('@')) {
        rowErrors.push(`Row ${i}: Invalid email "${row.email}"`);
      }
      if (!row.full_name) {
        rowErrors.push(`Row ${i}: Missing full_name`);
      }
      if (!VALID_ROLES.includes(row.role)) {
        rowErrors.push(`Row ${i}: Invalid role "${row.role}". Must be one of: ${VALID_ROLES.join(', ')}`);
      }
      
      rows.push({ ...row, rowNum: i });
    }
    
    setErrors(rowErrors);
    return rows;
  };

  const handleUpload = async () => {
    if (errors.length > 0) {
      alert('Please fix errors before uploading');
      return;
    }
    
    setUploading(true);
    const results = { success: 0, failed: 0, errors: [] };
    
    for (const row of preview) {
      try {
        // Create auth user
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: row.email,
          email_confirm: true,
          user_metadata: { full_name: row.full_name }
        });
        
        if (authError) throw authError;
        
        // Create profile
        await supabase.from('profiles').insert({
          id: authData.user.id,
          email: row.email,
          full_name: row.full_name,
          role: row.role,
          phone: row.phone || null,
          company_id: currentUser.company_id
        });
        
        results.success++;
      } catch (err) {
        results.failed++;
        results.errors.push(`${row.email}: ${err.message}`);
      }
    }
    
    setUploading(false);
    alert(`Upload complete: ${results.success} succeeded, ${results.failed} failed`);
    if (results.errors.length > 0) {
      console.error('Upload errors:', results.errors);
    }
  };

  const downloadTemplate = () => {
    const template = 'email,full_name,role,phone\njsmith@company.com,John Smith,PM,555-0100\njdoe@company.com,Jane Doe,SA,555-0101';
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'missionpulse_user_template.csv';
    a.click();
  };

  return (
    <div className="bg-slate-800 rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white">Bulk User Upload</h3>
        <button onClick={downloadTemplate} className="text-cyan-400 hover:text-cyan-300">
          📥 Download Template
        </button>
      </div>
      
      <div 
        className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center"
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files[0];
          if (file && file.name.endsWith('.csv')) {
            setFile(file);
            file.text().then(text => setPreview(parseCSV(text)));
          }
        }}
        onDragOver={(e) => e.preventDefault()}
      >
        <input
          type="file"
          accept=".csv"
          onChange={(e) => {
            const file = e.target.files[0];
            setFile(file);
            file.text().then(text => setPreview(parseCSV(text)));
          }}
          className="hidden"
          id="csvInput"
        />
        <label htmlFor="csvInput" className="cursor-pointer">
          <p className="text-gray-400">Drop CSV file here or click to browse</p>
          <p className="text-sm text-gray-500 mt-2">Max 100 users per upload</p>
        </label>
      </div>
      
      {errors.length > 0 && (
        <div className="mt-4 bg-red-900/50 border border-red-500 rounded p-3">
          <p className="text-red-400 font-semibold mb-2">Validation Errors:</p>
          {errors.map((err, i) => <p key={i} className="text-red-300 text-sm">• {err}</p>)}
        </div>
      )}
      
      {preview.length > 0 && errors.length === 0 && (
        <div className="mt-4">
          <p className="text-green-400 mb-2">✓ {preview.length} users ready to import</p>
          <button 
            onClick={handleUpload}
            disabled={uploading}
            className="w-full py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded"
          >
            {uploading ? 'Uploading...' : `Import ${preview.length} Users`}
          </button>
        </div>
      )}
    </div>
  );
};
```

### SQL Required (Supabase)
```sql
-- Create activity_log table if not exists
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activity_user ON activity_log(user_id);
CREATE INDEX idx_activity_action ON activity_log(action);

-- Log bulk uploads
INSERT INTO activity_log (user_id, action, target_type, metadata)
VALUES (auth.uid(), 'bulk_user_upload', 'users', '{"count": 25, "source": "csv"}'::jsonb);
```

### RBAC Rules
```javascript
// Admin module visibility
const ADMIN_ROLES = ['CEO', 'COO', 'Admin'];
const canAccessAdmin = ADMIN_ROLES.includes(currentUser.role);
```

### Deliverables
1. Updated production HTML with integrated User Management
2. **CSV upload with drag-drop interface**
3. **Downloadable CSV template**
4. **Validation and error reporting**
5. Supabase functions for user CRUD
6. Activity logging for admin actions
7. Test cases for role-based access

---

# 📋 PHASE 2: MODULE INTEGRATION (Sprints 16A-18)
## Goal: Wire All Modules to Live Supabase Data + HubSpot Alignment

---

## Sprint 16A: HubSpot Field Alignment (NEW FEATURE)
**Duration:** 4-5 hours  
**Branch:** `v2-development`  
**Dependencies:** Sprint 15 complete

### Objectives
1. Align `opportunities` table schema with HubSpot deal properties
2. Create field mapping for future HubSpot API integration
3. Add HubSpot-compatible pipeline stages
4. Enable import/export in HubSpot format

### HubSpot Deal Properties Mapping

| HubSpot Property | MissionPulse Field | Type | Notes |
|------------------|-------------------|------|-------|
| `dealname` | `title` | string | Required |
| `dealstage` | `status` | enum | Map to Shipley phases |
| `pipeline` | `pipeline_id` | string | Default or custom |
| `amount` | `ceiling_value` | number | Contract value |
| `closedate` | `due_date` | datetime | Proposal due date |
| `hubspot_owner_id` | `capture_manager_id` | UUID | Assigned CAP |
| `hs_priority` | `priority` | enum | high/medium/low |
| `hs_deal_stage_probability` | `pwin` | number | Win probability 0-100 |
| `description` | `description` | text | Opportunity summary |
| `hs_createdate` | `created_at` | datetime | Auto-generated |
| `hs_lastmodifieddate` | `updated_at` | datetime | Auto-updated |
| `hs_object_id` | `hubspot_id` | string | NEW: HubSpot sync ID |
| --- | --- | --- | --- |
| **Custom Properties** | | | |
| `contract_type` | `contract_type` | enum | IDIQ/BPA/FFP/T&M |
| `naics_code` | `naics_code` | string | 6-digit NAICS |
| `set_aside` | `set_asides` | multiselect | SDVOSB/8a/HUBZone |
| `agency` | `agency` | string | DHA/VA/CMS/IHS |
| `solicitation_number` | `solicitation_number` | string | SAM.gov number |
| `pop_start` | `pop_start` | date | Period of performance |
| `pop_end` | `pop_end` | date | Period of performance |
| `incumbent` | `incumbent` | string | Current contractor |

### SQL Migration (Supabase)
```sql
-- ═══════════════════════════════════════════════════════════════
-- HUBSPOT ALIGNMENT MIGRATION
-- Run this to add HubSpot-compatible fields to opportunities table
-- ═══════════════════════════════════════════════════════════════

-- Add HubSpot sync fields
ALTER TABLE opportunities 
  ADD COLUMN IF NOT EXISTS hubspot_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS hubspot_synced_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pipeline_id TEXT DEFAULT 'default';

-- Add missing HubSpot-aligned fields
ALTER TABLE opportunities
  ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium'
    CHECK (priority IN ('low', 'medium', 'high')),
  ADD COLUMN IF NOT EXISTS pwin INTEGER DEFAULT 50
    CHECK (pwin >= 0 AND pwin <= 100),
  ADD COLUMN IF NOT EXISTS pop_start DATE,
  ADD COLUMN IF NOT EXISTS pop_end DATE,
  ADD COLUMN IF NOT EXISTS incumbent TEXT,
  ADD COLUMN IF NOT EXISTS solicitation_number TEXT;

-- Create pipeline stages aligned with both HubSpot and Shipley
CREATE TABLE IF NOT EXISTS pipeline_stages (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  display_order INTEGER NOT NULL,
  hubspot_stage_id TEXT, -- For sync
  shipley_phase TEXT, -- Phase 0-7
  probability INTEGER DEFAULT 0,
  pipeline_id TEXT DEFAULT 'default',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert Shipley-aligned pipeline stages
INSERT INTO pipeline_stages (id, name, display_order, shipley_phase, probability) VALUES
  ('opportunity_identified', 'Opportunity Identified', 1, 'Phase 0', 10),
  ('capture_planning', 'Capture Planning', 2, 'Phase 1', 20),
  ('rfp_analysis', 'RFP Analysis', 3, 'Phase 2', 30),
  ('proposal_development', 'Proposal Development', 4, 'Phase 3', 40),
  ('red_team', 'Red Team Review', 5, 'Phase 4', 50),
  ('gold_team', 'Gold Team / Final', 6, 'Phase 5', 60),
  ('submitted', 'Submitted', 7, 'Phase 6', 70),
  ('evaluation', 'Under Evaluation', 8, 'Phase 6', 75),
  ('negotiations', 'Negotiations', 9, 'Phase 7', 85),
  ('won', 'Won', 10, 'Post-Award', 100),
  ('lost', 'Lost', 11, 'Post-Award', 0),
  ('no_bid', 'No Bid', 12, 'Phase 0', 0)
ON CONFLICT (id) DO NOTHING;

-- Create index for HubSpot sync
CREATE INDEX IF NOT EXISTS idx_opportunities_hubspot ON opportunities(hubspot_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_pipeline ON opportunities(pipeline_id, status);

-- Update existing records to use new pipeline stages
UPDATE opportunities SET status = 'capture_planning' WHERE status = 'Phase 1 - Capture';
UPDATE opportunities SET status = 'rfp_analysis' WHERE status = 'Phase 2 - RFP Analysis';
UPDATE opportunities SET status = 'proposal_development' WHERE status = 'Phase 3 - Development';
UPDATE opportunities SET status = 'submitted' WHERE status = 'Submitted';
UPDATE opportunities SET status = 'won' WHERE status = 'Won';
UPDATE opportunities SET status = 'lost' WHERE status = 'Lost';
```

### Field Mapping Configuration
```javascript
// hubspot-field-mapping.js
const HUBSPOT_FIELD_MAP = {
  // HubSpot Property -> MissionPulse Field
  inbound: {
    'dealname': 'title',
    'dealstage': 'status',
    'pipeline': 'pipeline_id',
    'amount': 'ceiling_value',
    'closedate': 'due_date',
    'hubspot_owner_id': 'capture_manager_id',
    'hs_priority': 'priority',
    'hs_deal_stage_probability': 'pwin',
    'description': 'description',
    'hs_object_id': 'hubspot_id',
    // Custom properties (prefix with company namespace)
    'mmt_contract_type': 'contract_type',
    'mmt_naics_code': 'naics_code',
    'mmt_set_aside': 'set_asides',
    'mmt_agency': 'agency',
    'mmt_solicitation': 'solicitation_number',
    'mmt_pop_start': 'pop_start',
    'mmt_pop_end': 'pop_end',
    'mmt_incumbent': 'incumbent'
  },
  
  // MissionPulse Field -> HubSpot Property
  outbound: {
    'title': 'dealname',
    'status': 'dealstage',
    'pipeline_id': 'pipeline',
    'ceiling_value': 'amount',
    'due_date': 'closedate',
    'capture_manager_id': 'hubspot_owner_id',
    'priority': 'hs_priority',
    'pwin': 'hs_deal_stage_probability',
    'description': 'description',
    'hubspot_id': 'hs_object_id',
    'contract_type': 'mmt_contract_type',
    'naics_code': 'mmt_naics_code',
    'set_asides': 'mmt_set_aside',
    'agency': 'mmt_agency',
    'solicitation_number': 'mmt_solicitation',
    'pop_start': 'mmt_pop_start',
    'pop_end': 'mmt_pop_end',
    'incumbent': 'mmt_incumbent'
  },
  
  // Stage mapping
  stages: {
    'appointmentscheduled': 'opportunity_identified',
    'qualifiedtobuy': 'capture_planning',
    'presentationscheduled': 'rfp_analysis',
    'decisionmakerboughtin': 'proposal_development',
    'contractsent': 'submitted',
    'closedwon': 'won',
    'closedlost': 'lost'
  }
};

// Transform HubSpot deal to MissionPulse opportunity
const hubspotToMissionPulse = (hubspotDeal) => {
  const opportunity = {};
  
  for (const [hsField, mpField] of Object.entries(HUBSPOT_FIELD_MAP.inbound)) {
    if (hubspotDeal.properties[hsField] !== undefined) {
      let value = hubspotDeal.properties[hsField];
      
      // Type conversions
      if (mpField === 'ceiling_value') {
        value = parseFloat(value) || 0;
      }
      if (mpField === 'pwin') {
        value = parseInt(value) || 50;
      }
      if (mpField === 'status') {
        value = HUBSPOT_FIELD_MAP.stages[value] || value;
      }
      if (mpField === 'due_date' && value) {
        value = new Date(value).toISOString();
      }
      
      opportunity[mpField] = value;
    }
  }
  
  return opportunity;
};

// Transform MissionPulse opportunity to HubSpot deal
const missionPulseToHubspot = (opportunity) => {
  const properties = {};
  
  for (const [mpField, hsField] of Object.entries(HUBSPOT_FIELD_MAP.outbound)) {
    if (opportunity[mpField] !== undefined) {
      let value = opportunity[mpField];
      
      // Type conversions
      if (hsField === 'amount') {
        value = value?.toString() || '0';
      }
      if (hsField === 'dealstage') {
        // Reverse stage lookup
        const reverseStages = Object.fromEntries(
          Object.entries(HUBSPOT_FIELD_MAP.stages).map(([k, v]) => [v, k])
        );
        value = reverseStages[value] || value;
      }
      
      properties[hsField] = value;
    }
  }
  
  return { properties };
};

// Export for CSV in HubSpot format
const exportToHubspotCSV = (opportunities) => {
  const headers = Object.keys(HUBSPOT_FIELD_MAP.outbound);
  const rows = opportunities.map(opp => {
    const hsFormat = missionPulseToHubspot(opp);
    return headers.map(h => hsFormat.properties[HUBSPOT_FIELD_MAP.outbound[h]] || '');
  });
  
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
};
```

### Import/Export UI
```javascript
// Add to Admin module
const HubSpotSync = () => {
  const [importing, setImporting] = React.useState(false);
  
  const handleExport = async () => {
    const { data: opps } = await supabase.from('opportunities').select('*');
    const csv = exportToHubspotCSV(opps);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `missionpulse_deals_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  };
  
  const handleImport = async (file) => {
    setImporting(true);
    const text = await file.text();
    const lines = text.split('\n');
    const headers = lines[0].split(',');
    
    let imported = 0;
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      const hubspotDeal = { properties: {} };
      headers.forEach((h, idx) => {
        hubspotDeal.properties[h] = values[idx];
      });
      
      const opportunity = hubspotToMissionPulse(hubspotDeal);
      await supabase.from('opportunities').upsert(opportunity, {
        onConflict: 'hubspot_id'
      });
      imported++;
    }
    
    setImporting(false);
    alert(`Imported ${imported} deals from HubSpot format`);
  };
  
  return (
    <div className="bg-slate-800 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-4">HubSpot Integration</h3>
      <div className="grid grid-cols-2 gap-4">
        <button onClick={handleExport} className="py-2 bg-orange-500 hover:bg-orange-400 text-white rounded">
          📤 Export to HubSpot CSV
        </button>
        <label className="py-2 bg-cyan-500 hover:bg-cyan-400 text-black text-center rounded cursor-pointer">
          📥 Import from HubSpot
          <input
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => handleImport(e.target.files[0])}
          />
        </label>
      </div>
      <p className="mt-4 text-gray-400 text-sm">
        Future: Direct HubSpot API sync coming in v2.1
      </p>
    </div>
  );
};
```

### Deliverables
1. Updated opportunities table schema aligned with HubSpot
2. Pipeline stages matching both Shipley and HubSpot conventions
3. Field mapping configuration for future API integration
4. CSV import/export in HubSpot format
5. Documentation for HubSpot custom properties setup

---

## Sprint 16: Contracts & Compliance Modules + RFP Shredder Enhancement
**Duration:** 5-6 hours  
**Branch:** `v2-development`  
**Dependencies:** Sprint 15 complete

### Objectives
1. Wire M4 Compliance to `compliance_requirements` table
2. Wire M5 Contracts to opportunity-specific contract data
3. **ENHANCED: RFP Shredder multi-file support (PDF, DOCX, XLSX, TXT, MSG, ZIP)**
4. Connect Compliance AI Agent to module

### RFP Shredder Supported File Types (ENHANCED)

| File Type | Extension | Parser | Use Case |
|-----------|-----------|--------|----------|
| PDF | .pdf | pdf.js / pdfplumber | RFP documents, amendments |
| Word | .docx | mammoth.js / docx | SOW, PWS, RFP sections |
| Excel | .xlsx, .xls | SheetJS | Pricing tables, CLINs, labor categories |
| Text | .txt | Native | Plain text requirements |
| Email | .msg, .eml | msg-parser | Government correspondence |
| ZIP Archive | .zip | JSZip | Multiple RFP files bundled |
| CSV | .csv | PapaParse | Data tables, requirements lists |

### Multi-File Upload Component
```javascript
// Enhanced RFP Shredder with multi-file support
const RFPShredder = () => {
  const [files, setFiles] = React.useState([]);
  const [processing, setProcessing] = React.useState(false);
  const [results, setResults] = React.useState([]);
  const fileInputRef = React.useRef();

  // Supported file types
  const SUPPORTED_TYPES = {
    'application/pdf': { parser: 'pdf', icon: '📄' },
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { parser: 'docx', icon: '📝' },
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { parser: 'xlsx', icon: '📊' },
    'application/vnd.ms-excel': { parser: 'xlsx', icon: '📊' },
    'text/plain': { parser: 'text', icon: '📃' },
    'text/csv': { parser: 'csv', icon: '📋' },
    'application/vnd.ms-outlook': { parser: 'msg', icon: '📧' },
    'message/rfc822': { parser: 'eml', icon: '📧' },
    'application/zip': { parser: 'zip', icon: '📦' },
    'application/x-zip-compressed': { parser: 'zip', icon: '📦' }
  };

  const ACCEPTED_EXTENSIONS = '.pdf,.docx,.xlsx,.xls,.txt,.csv,.msg,.eml,.zip';

  const handleFileSelect = (e) => {
    const newFiles = Array.from(e.target.files).map(file => ({
      id: crypto.randomUUID(),
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'pending',
      parser: SUPPORTED_TYPES[file.type]?.parser || 'unknown',
      icon: SUPPORTED_TYPES[file.type]?.icon || '📁'
    }));
    
    setFiles(prev => [...prev, ...newFiles]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    // Process same as file select
    handleFileSelect({ target: { files: droppedFiles } });
  };

  const removeFile = (id) => {
    setFiles(files.filter(f => f.id !== id));
  };

  const processFiles = async () => {
    setProcessing(true);
    const allResults = [];

    for (const fileItem of files) {
      setFiles(prev => prev.map(f => 
        f.id === fileItem.id ? { ...f, status: 'processing' } : f
      ));

      try {
        const extractedText = await extractText(fileItem);
        const requirements = await analyzeWithAI(extractedText, fileItem.name);
        
        allResults.push({
          fileId: fileItem.id,
          fileName: fileItem.name,
          requirements,
          extractedCount: requirements.length
        });

        setFiles(prev => prev.map(f => 
          f.id === fileItem.id ? { ...f, status: 'complete', count: requirements.length } : f
        ));
      } catch (error) {
        setFiles(prev => prev.map(f => 
          f.id === fileItem.id ? { ...f, status: 'error', error: error.message } : f
        ));
      }
    }

    setResults(allResults);
    setProcessing(false);
  };

  const extractText = async (fileItem) => {
    const { file, parser } = fileItem;
    
    switch (parser) {
      case 'pdf':
        return await extractPDF(file);
      case 'docx':
        return await extractDOCX(file);
      case 'xlsx':
        return await extractXLSX(file);
      case 'text':
        return await file.text();
      case 'csv':
        return await extractCSV(file);
      case 'msg':
        return await extractMSG(file);
      case 'zip':
        return await extractZIP(file);
      default:
        throw new Error(`Unsupported file type: ${file.type}`);
    }
  };

  // PDF extraction using pdf.js
  const extractPDF = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    let text = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map(item => item.str).join(' ') + '\n';
    }
    
    return text;
  };

  // DOCX extraction using mammoth
  const extractDOCX = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  };

  // XLSX extraction using SheetJS
  const extractXLSX = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    let text = '';
    
    workbook.SheetNames.forEach(sheetName => {
      const sheet = workbook.Sheets[sheetName];
      text += `\n--- Sheet: ${sheetName} ---\n`;
      text += XLSX.utils.sheet_to_csv(sheet);
    });
    
    return text;
  };

  // CSV extraction
  const extractCSV = async (file) => {
    const text = await file.text();
    const result = Papa.parse(text, { header: true });
    return JSON.stringify(result.data, null, 2);
  };

  // ZIP extraction (recursive)
  const extractZIP = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);
    let allText = '';
    
    for (const [filename, zipEntry] of Object.entries(zip.files)) {
      if (!zipEntry.dir) {
        const content = await zipEntry.async('arraybuffer');
        const ext = filename.split('.').pop().toLowerCase();
        
        // Create a pseudo-file for nested extraction
        const nestedFile = new File([content], filename);
        const nestedParser = Object.entries(SUPPORTED_TYPES)
          .find(([, v]) => v.parser === ext)?.[1]?.parser;
        
        if (nestedParser) {
          allText += `\n--- File: ${filename} ---\n`;
          allText += await extractText({ file: nestedFile, parser: nestedParser });
        }
      }
    }
    
    return allText;
  };

  // AI Analysis
  const analyzeWithAI = async (text, fileName) => {
    const response = await fetch(`${CONFIG.API_URL}/analyze-rfp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        fileName,
        extractionType: 'requirements'
      })
    });
    
    const data = await response.json();
    return data.requirements;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white">RFP Shredder</h2>
          <p className="text-slate-400 text-sm">
            Upload RFP files to auto-extract requirements
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-cyan-500 text-black rounded-lg text-sm font-medium flex items-center gap-2"
          >
            <span>📁</span> Add Files
          </button>
          {files.length > 0 && (
            <button
              onClick={processFiles}
              disabled={processing}
              className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium"
            >
              {processing ? 'Processing...' : `Analyze ${files.length} Files`}
            </button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ACCEPTED_EXTENSIONS}
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center hover:border-cyan-500 transition-colors"
      >
        <p className="text-slate-400 mb-2">
          Drop files here or click "Add Files"
        </p>
        <p className="text-xs text-slate-500">
          Supported: PDF, DOCX, XLSX, XLS, TXT, CSV, MSG, EML, ZIP
        </p>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="glass p-4 space-y-2">
          <h3 className="text-white font-medium mb-2">Selected Files ({files.length})</h3>
          {files.map(f => (
            <div key={f.id} className="flex items-center justify-between p-2 bg-slate-800 rounded">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{f.icon}</span>
                <div>
                  <p className="text-white text-sm">{f.name}</p>
                  <p className="text-xs text-slate-400">
                    {(f.size / 1024).toFixed(1)} KB • {f.parser}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {f.status === 'pending' && (
                  <span className="text-xs text-slate-400">Pending</span>
                )}
                {f.status === 'processing' && (
                  <span className="text-xs text-cyan-400 animate-pulse">Processing...</span>
                )}
                {f.status === 'complete' && (
                  <span className="text-xs text-emerald-400">✓ {f.count} items</span>
                )}
                {f.status === 'error' && (
                  <span className="text-xs text-red-400">Error</span>
                )}
                <button
                  onClick={() => removeFile(f.id)}
                  className="text-slate-500 hover:text-red-400"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="glass p-4">
          <h3 className="text-white font-medium mb-4">
            Extracted Requirements ({results.reduce((s, r) => s + r.extractedCount, 0)} total)
          </h3>
          {/* Requirements table would go here */}
        </div>
      )}
    </div>
  );
};
```

### Required Libraries (add to HTML)
```html
<!-- PDF.js for PDF extraction -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>

<!-- Mammoth for DOCX extraction -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js"></script>

<!-- SheetJS for Excel extraction -->
<script src="https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js"></script>

<!-- PapaParse for CSV -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.4.1/papaparse.min.js"></script>

<!-- JSZip for ZIP files -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
```

### Tasks

| Task | File(s) | Acceptance Criteria |
|------|---------|---------------------|
| 16.1 Compliance Data Provider | `supabase-client.js` | `getComplianceRequirements(oppId)` |
| 16.2 M4 Module Wiring | production HTML | Real requirements from Supabase |
| 16.3 Add Requirement | inline | Form to add new requirement |
| 16.4 Compliance Status | inline | Toggle compliant/non-compliant/pending |
| 16.5 M5 Contracts Wiring | production HTML | Contract vehicles from opportunity |
| 16.6 Risk Calculator | inline | Auto-calculate contract risk score |
| 16.7 AI Agent Connection | inline | Compliance Agent context injection |
| **16.8 Multi-File Upload** | production HTML | Accept PDF, DOCX, XLSX, TXT, MSG, ZIP |
| **16.9 File Parsers** | inline | Extract text from all file types |
| **16.10 Drag-Drop Zone** | inline | Visual drop zone for files |

### SQL Required (Supabase)
```sql
-- Add fields to compliance_requirements if needed
ALTER TABLE compliance_requirements 
  ADD COLUMN IF NOT EXISTS evidence_url TEXT,
  ADD COLUMN IF NOT EXISTS reviewer_id UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS source_file TEXT; -- Track which file requirement came from

-- Create contract_vehicles table
CREATE TABLE IF NOT EXISTS contract_vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  vehicle_name TEXT NOT NULL,
  vehicle_type TEXT, -- IDIQ, BPA, GSA, etc.
  ceiling_value NUMERIC,
  risk_level TEXT DEFAULT 'Medium',
  key_clauses JSONB DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Track uploaded RFP files
CREATE TABLE IF NOT EXISTS rfp_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  storage_path TEXT,
  extracted_text TEXT,
  requirements_count INTEGER DEFAULT 0,
  uploaded_by UUID REFERENCES profiles(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);
```

### API Integration
```javascript
// Context injection for Compliance Agent
const complianceContext = {
  opportunityId: selectedOpp.id,
  requirements: await MissionPulse.getComplianceRequirements(selectedOpp.id),
  contractType: selectedOpp.contractType,
  naicsCode: selectedOpp.naicsCode,
  setAsides: selectedOpp.setAsides
};
```

### Deliverables
1. Live M4 Compliance module with Supabase data
2. Live M5 Contracts module with risk scoring
3. **Multi-file RFP Shredder supporting 7+ file types**
4. **Drag-and-drop upload interface**
5. AI context injection for compliance queries
6. Test cases for requirement CRUD

---

## Sprint 17: Black Hat & Competitor Intelligence
**Duration:** 4-5 hours  
**Branch:** `v2-development`  
**Dependencies:** Sprint 16 complete

### Objectives
1. Enforce RBAC on M7 Black Hat (CEO/COO/CAP only)
2. Wire to `competitors` table with full CRUD
3. Add Ghost Strategy generator (AI-powered)
4. Implement competitor intel confidence scoring

### Tasks

| Task | File(s) | Acceptance Criteria |
|------|---------|---------------------|
| 17.1 RBAC Enforcement | production HTML | Only CEO/COO/CAP see Black Hat |
| 17.2 Competitor CRUD | `supabase-client.js` | Full create/read/update/delete |
| 17.3 M7 Data Wiring | production HTML | Real competitors from Supabase |
| 17.4 Threat Level UI | inline | Visual indicator (🔴🟡🟢) |
| 17.5 Ghost Strategy AI | inline | Generate counter-positioning |
| 17.6 Intel Source Tracking | inline | Track where intel came from |
| 17.7 Confidence Score | inline | 0-100 slider with justification |

### RBAC Configuration
```javascript
// Black Hat access control
const BLACKHAT_ROLES = ['CEO', 'COO', 'CAP'];
const canAccessBlackHat = BLACKHAT_ROLES.includes(currentUser.role);

// Invisible RBAC - don't render if no access
if (!canAccessBlackHat) return null;
```

### AI Agent Integration
```javascript
// Black Hat Agent context
const blackHatContext = {
  opportunity: selectedOpp,
  competitors: await MissionPulse.getCompetitors(selectedOpp.id),
  ourStrengths: companyProfile.discriminators,
  ourWeaknesses: companyProfile.knownGaps,
  evaluationCriteria: selectedOpp.evaluationCriteria
};
```

### Deliverables
1. Role-restricted M7 Black Hat module
2. Full competitor management functionality
3. AI-powered ghost strategy generation
4. Confidence scoring system

---

## Sprint 18: Pricing Engine Enhancement
**Duration:** 6-8 hours  
**Branch:** `v2-development`  
**Dependencies:** Sprint 17 complete

### Objectives
1. Build comprehensive BOE (Basis of Estimate) calculator
2. Integrate LCAT rate card management
3. Add labor mix optimization
4. Connect to `team_members` table
5. Generate Price-to-Win analysis

### Tasks

| Task | File(s) | Acceptance Criteria |
|------|---------|---------------------|
| 18.1 Rate Card Table | `supabase-client.js` | LCAT rates with burden factors |
| 18.2 BOE Builder UI | production HTML | Labor categories + hours + rates |
| 18.3 Team Assignment | inline | Assign named personnel to LCATs |
| 18.4 Burden Calculator | inline | Fringe, OH, G&A, Fee calculations |
| 18.5 Price Summary | inline | Total cost, fully burdened rate |
| 18.6 PTW Analysis | inline | Compare to competitor estimates |
| 18.7 Export to Excel | inline | Download BOE spreadsheet |
| 18.8 Pricing AI Agent | inline | "What-if" scenario analysis |

### SQL Required (Supabase)
```sql
-- Create rate_cards table
CREATE TABLE IF NOT EXISTS rate_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  lcat_name TEXT NOT NULL,
  lcat_code TEXT,
  base_rate NUMERIC NOT NULL,
  fringe_rate NUMERIC DEFAULT 0.35,
  overhead_rate NUMERIC DEFAULT 0.85,
  ga_rate NUMERIC DEFAULT 0.08,
  fee_rate NUMERIC DEFAULT 0.08,
  effective_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create boe_line_items table
CREATE TABLE IF NOT EXISTS boe_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  rate_card_id UUID REFERENCES rate_cards(id),
  team_member_id UUID REFERENCES team_members(id),
  hours_year1 NUMERIC DEFAULT 0,
  hours_year2 NUMERIC DEFAULT 0,
  hours_year3 NUMERIC DEFAULT 0,
  hours_year4 NUMERIC DEFAULT 0,
  hours_year5 NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### BOE Calculation Logic
```javascript
const calculateFullyBurdenedRate = (baseRate, rateCard) => {
  const labor = baseRate;
  const fringe = labor * rateCard.fringeRate;
  const overhead = (labor + fringe) * rateCard.overheadRate;
  const subtotal = labor + fringe + overhead;
  const ga = subtotal * rateCard.gaRate;
  const cost = subtotal + ga;
  const fee = cost * rateCard.feeRate;
  return cost + fee;
};
```

### Deliverables
1. Complete BOE Builder with LCAT management
2. Burden calculation engine
3. Price-to-Win comparison tool
4. Excel export functionality
5. AI-powered pricing scenarios

---

# 📋 PHASE 3: ADVANCED FEATURES (Sprints 19-21)
## Goal: AI Governance, Orals, and Post-Award Capabilities

---

## Sprint 19: HITL Queue Enhancement
**Duration:** 5-6 hours  
**Branch:** `v2-development`  
**Dependencies:** Sprint 18 complete

### Objectives
1. Build production-grade Human-in-the-Loop approval queue
2. Implement AI output review workflow
3. Add evidence citation tracking (≥95% coverage)
4. Create approval/rejection with feedback loop

### Tasks

| Task | File(s) | Acceptance Criteria |
|------|---------|---------------------|
| 19.1 Queue Data Model | `supabase-client.js` | HITL queue table operations |
| 19.2 Queue Dashboard | production HTML | Pending items with priority |
| 19.3 Review Interface | inline | Side-by-side AI output + sources |
| 19.4 Citation Validator | inline | Highlight uncited claims |
| 19.5 Approve/Reject | inline | One-click with reason capture |
| 19.6 Feedback Loop | inline | Rejected items → AI retraining |
| 19.7 Role-Based Queue | inline | Show only role-appropriate items |
| 19.8 SLA Tracking | inline | Time-to-review metrics |

### SQL Required (Supabase)
```sql
-- Create hitl_queue table
CREATE TABLE IF NOT EXISTS hitl_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID REFERENCES opportunities(id),
  agent_type TEXT NOT NULL, -- capture, compliance, writer, etc.
  output_type TEXT NOT NULL, -- strategy, section, analysis
  ai_output TEXT NOT NULL,
  citations JSONB DEFAULT '[]',
  citation_coverage NUMERIC DEFAULT 0, -- 0-100%
  priority TEXT DEFAULT 'medium', -- low, medium, high, urgent
  assigned_to UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'pending', -- pending, approved, rejected, revision
  reviewer_id UUID REFERENCES profiles(id),
  reviewer_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

CREATE INDEX idx_hitl_status ON hitl_queue(status);
CREATE INDEX idx_hitl_assigned ON hitl_queue(assigned_to);
```

### Citation Coverage Algorithm
```javascript
const calculateCitationCoverage = (output, citations) => {
  const sentences = output.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const citedSentences = citations.map(c => c.sentenceIndex);
  const coverage = (citedSentences.length / sentences.length) * 100;
  return Math.min(100, coverage);
};

// Require ≥95% for compliance outputs
const isAcceptable = coverage >= 95;
```

### Deliverables
1. Full HITL queue management system
2. Citation coverage validation
3. Review workflow with feedback
4. SLA dashboard for queue metrics

---

## Sprint 20: Orals Studio Build
**Duration:** 6-8 hours  
**Branch:** `v2-development`  
**Dependencies:** Sprint 19 complete

### Objectives
1. Build Orals presentation generator
2. Create Q&A simulation environment
3. Add presentation deck export (PowerPoint)
4. Implement practice mode with AI evaluator

### Tasks

| Task | File(s) | Acceptance Criteria |
|------|---------|---------------------|
| 20.1 Orals Module | production HTML | New M10 tab in sidebar |
| 20.2 Deck Generator | inline | Auto-generate from proposal sections |
| 20.3 Speaker Notes | inline | AI-generated talking points |
| 20.4 Q&A Bank | inline | Anticipated questions + answers |
| 20.5 Practice Mode | inline | AI asks questions, scores responses |
| 20.6 Timer Module | inline | Countdown for timed practice |
| 20.7 PPTX Export | backend | Generate downloadable deck |
| 20.8 Video Recording | inline | Record practice sessions |

### SQL Required (Supabase)
```sql
-- Create orals_decks table
CREATE TABLE IF NOT EXISTS orals_decks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slides JSONB DEFAULT '[]',
  qa_bank JSONB DEFAULT '[]',
  speaker_notes JSONB DEFAULT '{}',
  created_by UUID REFERENCES profiles(id),
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create practice_sessions table
CREATE TABLE IF NOT EXISTS practice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id UUID REFERENCES orals_decks(id) ON DELETE CASCADE,
  presenter_id UUID REFERENCES profiles(id),
  duration_seconds INTEGER,
  ai_score NUMERIC,
  ai_feedback JSONB DEFAULT '{}',
  recording_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### AI Integration
```javascript
// Orals Agent context
const oralsContext = {
  proposal: proposalSections,
  evaluationCriteria: selectedOpp.evaluationCriteria,
  competitorWeaknesses: competitors.map(c => c.weaknesses),
  ourDiscriminators: proposalStrengths,
  timeLimit: 45 // minutes
};

// Q&A generation prompt
const generateQA = `
Generate 20 challenging questions an evaluation panel might ask about:
1. Technical approach weaknesses
2. Past performance gaps
3. Staffing contingencies
4. Cost realism
5. Risk mitigation
`;
```

### Deliverables
1. Complete Orals Studio module
2. AI-powered Q&A generation
3. Practice mode with scoring
4. PowerPoint export capability

---

## Sprint 21: Post-Award & Lessons Learned
**Duration:** 4-5 hours  
**Branch:** `v2-development`  
**Dependencies:** Sprint 20 complete

### Objectives
1. Build M14 Post-Award transition planning
2. Build M15 Playbook/Lessons Learned module
3. Implement "Save to Playbook" workflow
4. Create win/loss analysis capture

### Tasks

| Task | File(s) | Acceptance Criteria |
|------|---------|---------------------|
| 21.1 Post-Award Module | production HTML | M14 in sidebar |
| 21.2 Transition Checklist | inline | Standard items from template |
| 21.3 Kickoff Generator | inline | Generate kickoff presentation |
| 21.4 Lessons Module | production HTML | M15 in sidebar |
| 21.5 Lesson Capture | inline | Form for new lessons |
| 21.6 Lesson Search | inline | Filter by phase, agency, outcome |
| 21.7 Save to Playbook | inline | One-click from any AI output |
| 21.8 Win/Loss Analysis | inline | Debrief capture template |

### SQL Required (Supabase)
```sql
-- Enhance playbook_lessons table
ALTER TABLE playbook_lessons
  ADD COLUMN IF NOT EXISTS opportunity_id UUID REFERENCES opportunities(id),
  ADD COLUMN IF NOT EXISTS phase TEXT,
  ADD COLUMN IF NOT EXISTS outcome TEXT, -- win, loss, no-bid
  ADD COLUMN IF NOT EXISTS agency TEXT,
  ADD COLUMN IF NOT EXISTS contract_type TEXT,
  ADD COLUMN IF NOT EXISTS lesson_type TEXT, -- golden_example, anti_pattern, tip
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS effectiveness_score NUMERIC;

-- Create transition_tasks table
CREATE TABLE IF NOT EXISTS transition_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  task_name TEXT NOT NULL,
  category TEXT, -- personnel, systems, security, contracts
  due_date DATE,
  assigned_to UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Playbook Injection
```javascript
// Inject top lessons into AI system prompt
const injectPlaybookContext = async (agentType, phase) => {
  const lessons = await MissionPulse.getPlaybookLessons({
    phase,
    lessonType: 'golden_example',
    limit: 3,
    orderBy: 'effectiveness_score'
  });
  
  return `
GOLDEN EXAMPLES FROM PLAYBOOK:
${lessons.map(l => `- ${l.title}: ${l.content}`).join('\n')}
`;
};
```

### Deliverables
1. Post-Award transition module
2. Lessons Learned capture and search
3. "Save to Playbook" button on all AI outputs
4. Win/loss analysis templates

---

# 📋 PHASE 4: ENTERPRISE FEATURES (Sprints 22-23)
## Goal: Partner Management, Document Storage, Multi-Tenant

---

## Sprint 22: Partner Management & Auto-Revoke
**Duration:** 4-5 hours  
**Branch:** `v2-development`  
**Dependencies:** Sprint 21 complete

### Objectives
1. Enhance M11 Frenemy Protocol with full partner management
2. Implement automatic access revocation on proposal submission
3. Add CUI watermarking for partner-visible content
4. Create partner activity audit trail

### Tasks

| Task | File(s) | Acceptance Criteria |
|------|---------|---------------------|
| 22.1 Partner CRUD | `supabase-client.js` | Full partner management |
| 22.2 Access Levels | inline | Define what partners can see |
| 22.3 Time-Based Access | inline | Set expiration dates |
| 22.4 Auto-Revoke Trigger | inline | Revoke on status='submitted' |
| 22.5 CUI Watermark | inline | Add to all partner views |
| 22.6 Partner Audit | inline | Track all partner access |
| 22.7 NDA Tracking | inline | Upload/track NDA status |
| 22.8 Partner Dashboard | inline | What partners see when they log in |

### SQL Required (Supabase)
```sql
-- Enhance partners table
ALTER TABLE partners
  ADD COLUMN IF NOT EXISTS access_level TEXT DEFAULT 'limited', -- full, standard, limited
  ADD COLUMN IF NOT EXISTS access_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS nda_signed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS nda_document_url TEXT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Create partner_access_log table
CREATE TABLE IF NOT EXISTS partner_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES partners(id),
  opportunity_id UUID REFERENCES opportunities(id),
  resource_type TEXT, -- module, document, section
  resource_id TEXT,
  action TEXT, -- view, download, export
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-revoke function
CREATE OR REPLACE FUNCTION revoke_partner_access()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'submitted' AND OLD.status != 'submitted' THEN
    UPDATE partners 
    SET is_active = false, access_expires_at = NOW()
    WHERE id IN (
      SELECT partner_id FROM partner_opportunities 
      WHERE opportunity_id = NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_revoke_partner_access
  AFTER UPDATE ON opportunities
  FOR EACH ROW
  EXECUTE FUNCTION revoke_partner_access();
```

### CUI Watermark Implementation
```javascript
// Add to all partner-visible outputs
const CUI_FOOTER = `
═══════════════════════════════════════════════════════════════
CUI // SP-PROPIN // CONTROLLED UNCLASSIFIED INFORMATION
Distribution limited to authorized personnel only
AI GENERATED - REQUIRES HUMAN REVIEW
Mission Meets Tech | missionpulse.io
═══════════════════════════════════════════════════════════════
`;

const isPartner = currentUser.role === 'Partner';
```

### Deliverables
1. Complete partner management system
2. Automatic access revocation
3. CUI watermarking on all partner content
4. Partner activity audit log

---

## Sprint 23: Document Storage & Multi-Tenant Isolation (CRITICAL)
**Duration:** 6-8 hours  
**Branch:** `v2-development`  
**Dependencies:** Sprint 22 complete  
**Risk Level:** 🔴 HIGH (Data bleed prevention is CRITICAL)

### Objectives
1. Implement document upload to Supabase Storage
2. Add document version control
3. Create document-level access controls
4. **CRITICAL: Ensure complete multi-tenant isolation (NO DATA BLEED)**

### ⚠️ MULTI-TENANT ISOLATION REQUIREMENTS

**Zero Data Bleed Guarantee:**
Every query, every table, every function MUST be scoped to `company_id`.

| Layer | Isolation Method | Enforcement |
|-------|------------------|-------------|
| **Database** | RLS policies on ALL tables | Mandatory |
| **Storage** | Folder paths by company_id | Mandatory |
| **Queries** | company_id in WHERE clause | Automatic via RLS |
| **API** | Middleware validation | Mandatory |
| **Frontend** | Context injection | Automatic |

### Tasks

| Task | File(s) | Acceptance Criteria |
|------|---------|---------------------|
| 23.1 Storage Bucket | Supabase | Configure secure bucket |
| 23.2 Upload Component | inline | Drag-drop file upload |
| 23.3 Document CRUD | `supabase-client.js` | Full document management |
| 23.4 Version Control | inline | Track document versions |
| 23.5 Access Control | inline | Document-level permissions |
| 23.6 Preview/Download | inline | In-app preview, secure download |
| 23.7 **RLS ALL Tables** | Supabase SQL | Every table has company_id policy |
| 23.8 **Isolation Test** | Test script | Verify no cross-company data access |
| 23.9 **Storage Isolation** | Supabase | Folder paths by company_id |

### Complete RLS Policy Set (ALL TABLES)
```sql
-- ═══════════════════════════════════════════════════════════════
-- MULTI-TENANT ISOLATION - RLS POLICIES FOR ALL TABLES
-- CRITICAL: Run this to ensure NO DATA BLEED between companies
-- ═══════════════════════════════════════════════════════════════

-- Helper function to get current user's company_id
CREATE OR REPLACE FUNCTION get_my_company_id()
RETURNS UUID AS $$
  SELECT company_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════
-- PROFILES TABLE
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own company profiles" ON profiles;
CREATE POLICY "Users see own company profiles" ON profiles
  FOR SELECT USING (company_id = get_my_company_id());

DROP POLICY IF EXISTS "Users update own profile" ON profiles;
CREATE POLICY "Users update own profile" ON profiles
  FOR UPDATE USING (id = auth.uid());

-- ═══════════════════════════════════════════════════════════════
-- OPPORTUNITIES TABLE (CRITICAL - Main data)
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Company opportunities only" ON opportunities;
CREATE POLICY "Company opportunities only" ON opportunities
  FOR ALL USING (company_id = get_my_company_id());

-- ═══════════════════════════════════════════════════════════════
-- COMPETITORS TABLE (SENSITIVE - Black Hat data)
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Company competitors only" ON competitors;
CREATE POLICY "Company competitors only" ON competitors
  FOR ALL USING (
    opportunity_id IN (
      SELECT id FROM opportunities WHERE company_id = get_my_company_id()
    )
  );

-- ═══════════════════════════════════════════════════════════════
-- COMPLIANCE_REQUIREMENTS TABLE
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE compliance_requirements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Company compliance only" ON compliance_requirements;
CREATE POLICY "Company compliance only" ON compliance_requirements
  FOR ALL USING (
    opportunity_id IN (
      SELECT id FROM opportunities WHERE company_id = get_my_company_id()
    )
  );

-- ═══════════════════════════════════════════════════════════════
-- PARTNERS TABLE
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Company partners only" ON partners;
CREATE POLICY "Company partners only" ON partners
  FOR ALL USING (company_id = get_my_company_id());

-- ═══════════════════════════════════════════════════════════════
-- ALL OTHER TABLES - Same pattern applied
-- ═══════════════════════════════════════════════════════════════
-- team_members, documents, playbook_lessons, hitl_queue, 
-- rate_cards, boe_line_items, activity_log
-- (Full SQL in deployment script)
```

### Supabase Storage Setup
```sql
-- Storage paths MUST be: documents/{company_id}/{opportunity_id}/{filename}

CREATE POLICY "Company storage access"
ON storage.objects FOR ALL
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = get_my_company_id()::text
);
```

### Document Table Schema
```sql
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES opportunities(id),
  name TEXT NOT NULL,
  description TEXT,
  file_type TEXT,
  file_size INTEGER,
  storage_path TEXT NOT NULL,
  version INTEGER DEFAULT 1,
  parent_id UUID REFERENCES documents(id),
  uploaded_by UUID REFERENCES profiles(id),
  access_level TEXT DEFAULT 'internal',
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Company documents only" ON documents
  FOR ALL USING (company_id = get_my_company_id());
```

### Verification Script (Run After Setup)
```sql
-- MULTI-TENANT ISOLATION VERIFICATION
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
  'profiles', 'opportunities', 'competitors', 'compliance_requirements',
  'partners', 'team_members', 'documents', 'playbook_lessons',
  'hitl_queue', 'rate_cards', 'boe_line_items', 'activity_log'
)
ORDER BY tablename;

-- Expected result: ALL should show rowsecurity = true
```

### Deliverables
1. Supabase Storage integration
2. Document upload/download/preview
3. Version control system
4. **Complete RLS policy set for ALL tables**
5. **Multi-tenant isolation verification script**
6. **Zero data bleed guarantee**

---

# 📋 PHASE 5: POLISH & LAUNCH (Sprints 24-27)
## Goal: Production-Ready, Demo-Ready, Client-Ready

---

## Sprint 24: QA Gauntlet & Security Audit
**Duration:** 4-5 hours  
**Branch:** `v2-development`  
**Dependencies:** Sprint 23 complete

### Objectives
1. Comprehensive security audit
2. Load testing and performance optimization
3. Accessibility compliance (WCAG 2.1 AA)
4. Mobile responsiveness verification

### Security Tests

| Test | Method | Pass Criteria |
|------|--------|---------------|
| Auth Bypass | Try direct URL access | Redirect to login |
| RBAC Enforcement | Switch roles, verify module hiding | Correct modules per role |
| Session Hijacking | Copy token to incognito | Session invalidated |
| XSS Testing | Inject script in inputs | Sanitized output |
| SQL Injection | Inject SQL in search | Parameterized queries |
| API Key Exposure | View source, network tab | No keys visible |
| CORS Testing | Cross-origin requests | Only allowed origins |

### Performance Tests

| Metric | Target | Test Method |
|--------|--------|-------------|
| Initial Load | < 3 seconds | Lighthouse |
| Time to Interactive | < 5 seconds | Lighthouse |
| API Response | < 500ms | Network tab |
| Supabase Query | < 200ms | Supabase dashboard |
| AI Response Start | < 2 seconds | Stopwatch |

### Accessibility Checklist
- [ ] Color contrast ratio ≥ 4.5:1
- [ ] All images have alt text
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Focus indicators visible
- [ ] Form labels associated

### Deliverables
1. Security audit report
2. Performance baseline metrics
3. Accessibility compliance report
4. Bug fix list with priorities

---

## Sprint 25: Launch Readiness
**Duration:** 4-5 hours  
**Branch:** `main` (merge from v2-development)  
**Dependencies:** Sprint 24 complete

### Objectives
1. Final merge to production
2. DNS configuration for missionpulse.io
3. Demo script validation
4. Client onboarding documentation

### Tasks

| Task | Acceptance Criteria |
|------|---------------------|
| 25.1 Code Freeze | No new features, bugs only |
| 25.2 Merge to Main | v2-development → main PR |
| 25.3 DNS Setup | missionpulse.io resolves |
| 25.4 SSL Verification | HTTPS working |
| 25.5 Demo Script Run | All 10 scenes work |
| 25.6 Client Docs | Onboarding guide complete |
| 25.7 Support Process | Issue submission flow |
| 25.8 Monitoring | Error tracking enabled |

### DNS Configuration (Netlify)
```
Type    Name    Value
A       @       75.2.60.5
CNAME   www     missionpulse.netlify.app
```

### Demo Script Validation
Run through all scenes from `MissionPulse_v12_Demo_Script.xlsx`:
1. ☐ Scene 1: Gate 1 / Capture Manager
2. ☐ Scene 2: Blue Team / Proposal Manager
3. ☐ Scene 3: Contracts Risk Analysis
4. ☐ Scene 4: Pink Team / Volume Lead
5. ☐ Scene 5: Red Team / QA Manager
6. ☐ Scene 6: Pricing Build / CFO
7. ☐ Scene 7: Gold Team / Executive
8. ☐ Scene 8: Orals Prep / Presenter
9. ☐ Scene 9: Submission / Capture Manager
10. ☐ Scene 10: Post-Award / PM

### Client Onboarding Package
1. Quick Start Guide (PDF)
2. Video walkthrough (5 min)
3. Role-specific guides (11 roles)
4. FAQ document
5. Support contact information

### Deliverables
1. Production deployment at missionpulse.io
2. Demo validation complete
3. Client documentation package
4. Monitoring and alerting active

---

## Sprint 26: Chat UX Enhancement (NEW FEATURE)
**Duration:** 4-5 hours  
**Branch:** `v2-development`  
**Dependencies:** Sprint 25 complete

### Objectives
1. **Enter key sends message** (no click required)
2. **Agent-specific suggested prompts** (contextual guidance)
3. Improved chat loading states
4. Better error handling for AI responses

### Tasks

| Task | File(s) | Acceptance Criteria |
|------|---------|---------------------|
| 26.1 Enter to Send | `ai-chat-widget.js` | Enter submits, Shift+Enter = newline |
| 26.2 Prompt Suggestions | inline | Show 3-4 prompts based on active agent |
| 26.3 Prompt Config | JSON | Define prompts per agent |
| 26.4 Click to Insert | inline | Clicking prompt fills input |
| 26.5 Hide on Typing | inline | Suggestions hide when user types |
| 26.6 Loading States | inline | Typing indicator, spinner |
| 26.7 Error Recovery | inline | Retry button on failure |

### Agent-Specific Suggested Prompts Configuration
```javascript
// agent-prompts.js
const AGENT_SUGGESTED_PROMPTS = {
  capture: [
    "What are the key win themes for this opportunity?",
    "Analyze our competitive position against [competitor]",
    "Draft a capture strategy summary",
    "What intel gaps should I fill before Gate 1?"
  ],
  
  strategy: [
    "Generate 3 discriminators for our technical approach",
    "What ghost strategies could we use against the incumbent?",
    "Create a SWOT analysis for this opportunity",
    "Draft executive summary talking points"
  ],
  
  blackhat: [
    "Analyze [competitor]'s likely proposal strategy",
    "What are the incumbent's biggest weaknesses?",
    "How might competitors attack our past performance?",
    "Generate counter-positioning for their price advantage"
  ],
  
  compliance: [
    "Extract all mandatory requirements from Section L",
    "Check our response against Section M criteria",
    "Flag any FAR/DFARS clauses we need to address",
    "Create a compliance matrix from the RFP"
  ],
  
  writer: [
    "Draft the technical approach section",
    "Rewrite this paragraph to be more persuasive",
    "Format this resume for the proposal",
    "Create a staffing narrative for [role]"
  ],
  
  pricing: [
    "Help me build a BOE for this task",
    "What's a competitive price-to-win for this effort?",
    "Analyze the labor mix for cost efficiency",
    "Check our rates against industry benchmarks"
  ],
  
  contracts: [
    "Analyze the T&Cs for risk",
    "What DFARS clauses apply to this contract?",
    "Flag any unusual liability provisions",
    "Explain the IP rights implications"
  ],
  
  orals: [
    "Generate likely evaluation panel questions",
    "Create speaker notes for the management slide",
    "What questions should we prepare for about staffing?",
    "Draft a 2-minute executive summary pitch"
  ]
};

// Get prompts for current agent
const getPromptsForAgent = (agentType) => {
  return AGENT_SUGGESTED_PROMPTS[agentType] || [
    "How can I help with this proposal?",
    "Analyze the current opportunity",
    "What should I focus on next?",
    "Summarize the key requirements"
  ];
};
```

### Enhanced Chat Widget Component
```javascript
// Updated ai-chat-widget.js
const AIChatWidget = ({ agentType = 'capture', opportunityContext }) => {
  const [message, setMessage] = React.useState('');
  const [messages, setMessages] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [showSuggestions, setShowSuggestions] = React.useState(true);
  const [error, setError] = React.useState(null);
  const inputRef = React.useRef(null);

  const suggestedPrompts = getPromptsForAgent(agentType);

  // Handle keyboard events
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Prevent newline
      handleSend();
    }
    // Shift+Enter allows newline (default textarea behavior)
  };

  // Handle input change
  const handleInputChange = (e) => {
    setMessage(e.target.value);
    // Hide suggestions when user starts typing
    if (e.target.value.length > 0) {
      setShowSuggestions(false);
    } else {
      setShowSuggestions(true);
    }
  };

  // Handle suggested prompt click
  const handlePromptClick = (prompt) => {
    setMessage(prompt);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  // Send message
  const handleSend = async () => {
    if (!message.trim() || isLoading) return;
    
    const userMessage = message.trim();
    setMessage('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('https://missionpulse-api.onrender.com/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          agent: agentType,
          context: opportunityContext,
          history: messages.slice(-10) // Last 10 messages for context
        })
      });

      if (!response.ok) throw new Error('AI service unavailable');

      const data = await response.json();
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.response,
        citations: data.citations || []
      }]);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Retry on error
  const handleRetry = () => {
    setError(null);
    if (messages.length > 0) {
      const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
      if (lastUserMessage) {
        setMessage(lastUserMessage.content);
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-lg">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-lg p-3 ${
              msg.role === 'user' 
                ? 'bg-cyan-600 text-white' 
                : 'bg-slate-700 text-gray-100'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-700 rounded-lg p-3 text-gray-400">
              <span className="inline-flex items-center">
                <span className="animate-pulse">●</span>
                <span className="animate-pulse animation-delay-200 ml-1">●</span>
                <span className="animate-pulse animation-delay-400 ml-1">●</span>
                <span className="ml-2">Thinking...</span>
              </span>
            </div>
          </div>
        )}

        {error && (
          <div className="flex justify-center">
            <div className="bg-red-900/50 border border-red-500 rounded-lg p-3 text-red-300">
              <p>{error}</p>
              <button 
                onClick={handleRetry}
                className="mt-2 px-3 py-1 bg-red-600 hover:bg-red-500 rounded text-white text-sm"
              >
                Retry
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Suggested prompts */}
      {showSuggestions && messages.length === 0 && (
        <div className="px-4 pb-2">
          <p className="text-gray-500 text-xs mb-2">Suggested prompts:</p>
          <div className="flex flex-wrap gap-2">
            {suggestedPrompts.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handlePromptClick(prompt)}
                className="text-xs px-3 py-1.5 bg-slate-700 hover:bg-slate-600 
                           text-cyan-400 rounded-full border border-slate-600
                           transition-colors truncate max-w-[200px]"
                title={prompt}
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="p-4 border-t border-slate-700">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={`Ask the ${agentType} agent... (Enter to send)`}
            className="flex-1 px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg 
                       text-white placeholder-gray-500 resize-none focus:outline-none 
                       focus:border-cyan-500"
            rows="2"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!message.trim() || isLoading}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-600 
                       disabled:cursor-not-allowed text-black font-semibold rounded-lg
                       transition-colors"
          >
            {isLoading ? '...' : '→'}
          </button>
        </div>
        <p className="text-gray-500 text-xs mt-1">
          Press Enter to send • Shift+Enter for new line
        </p>
      </div>
      
      {/* AI Disclaimer */}
      <div className="px-4 pb-2 text-center">
        <p className="text-gray-600 text-xs">AI GENERATED - REQUIRES HUMAN REVIEW</p>
      </div>
    </div>
  );
};
```

### Deliverables
1. **Enter to send functionality** (Shift+Enter for newlines)
2. **Agent-specific suggested prompts** (8 agents × 4 prompts each)
3. Improved loading states with typing indicator
4. Error handling with retry button
5. Prompt configuration file for easy updates

---

## Sprint 27: Final Polish & Documentation
**Duration:** 3-4 hours  
**Branch:** `main`  
**Dependencies:** Sprint 26 complete

### Objectives
1. Final bug fixes from user testing
2. Complete API documentation
3. Update all README files
4. Archive sprint planning documents

### Tasks

| Task | Acceptance Criteria |
|------|---------------------|
| 27.1 Bug Bash | Fix all P0/P1 bugs |
| 27.2 API Docs | Swagger/OpenAPI spec |
| 27.3 README Update | Current setup instructions |
| 27.4 Sprint Archive | Move completed sprint docs |
| 27.5 Changelog | v2.0 release notes |

### Deliverables
1. Zero P0/P1 bugs
2. Complete API documentation
3. Updated README with v2.0 instructions
4. v2.0 release notes published

---

## Sprint 28: Integration Hub (NEW - Office 365, AskSage, GovCon Tools)
**Duration:** 6-8 hours  
**Branch:** `v2-development`  
**Dependencies:** Sprint 27 complete

### Objectives
1. **Office 365 Integration** - Simple OAuth button for non-technical users
2. **AskSage Integration** - Connect to FedRAMP High/IL5 AI platform
3. **GovCon Integrations** - SAM.gov, GovWin IQ, SharePoint, Slack
4. Create unified Integrations Hub in Admin module

### Target Integrations

| Integration | Type | Purpose | Complexity |
|-------------|------|---------|------------|
| **Microsoft 365** | OAuth 2.0 | Word/Excel/SharePoint/Teams | Medium |
| **AskSage** | API Key | DoD AI compliance, document generation | Low |
| **SAM.gov** | Public API | Auto-import opportunities | Low |
| **GovWin IQ** | API Key | Market intelligence, competitor data | Medium |
| **SharePoint** | OAuth 2.0 | Document storage, team collaboration | Medium |
| **Slack** | OAuth 2.0 | Notifications, alerts | Low |
| **HubSpot** | OAuth 2.0 | CRM sync (from Sprint 16A) | Medium |
| **DocuSign** | OAuth 2.0 | Signature workflows | Low |

### Integration Hub UI Component
```javascript
// Integrations Hub Component
const IntegrationsHub = () => {
  const [integrations, setIntegrations] = React.useState([]);
  const [connecting, setConnecting] = React.useState(null);

  const INTEGRATIONS = [
    {
      id: 'microsoft365',
      name: 'Microsoft 365',
      description: 'Connect Word, Excel, SharePoint, and Teams',
      icon: '📎',
      color: '#0078D4',
      category: 'Productivity',
      scopes: ['Files.ReadWrite', 'Sites.ReadWrite.All', 'User.Read'],
      authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize'
    },
    {
      id: 'asksage',
      name: 'AskSage',
      description: 'FedRAMP High & IL5 AI Platform (DoD Approved)',
      icon: '🧠',
      color: '#00D4AA',
      category: 'AI',
      authType: 'apiKey',
      docsUrl: 'https://docs.asksage.ai/api'
    },
    {
      id: 'samgov',
      name: 'SAM.gov',
      description: 'Import federal opportunities automatically',
      icon: '🏛️',
      color: '#112E51',
      category: 'GovCon',
      authType: 'apiKey',
      docsUrl: 'https://open.gsa.gov/api/sam-entity-management-api/'
    },
    {
      id: 'govwin',
      name: 'GovWin IQ',
      description: 'Market intelligence and competitor tracking',
      icon: '📊',
      color: '#FF6B35',
      category: 'GovCon',
      authType: 'apiKey',
      docsUrl: 'https://www.deltek.com/en/products/govwin'
    },
    {
      id: 'sharepoint',
      name: 'SharePoint',
      description: 'Document management and team sites',
      icon: '📁',
      color: '#038387',
      category: 'Productivity',
      scopes: ['Sites.ReadWrite.All', 'Files.ReadWrite.All'],
      authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize'
    },
    {
      id: 'slack',
      name: 'Slack',
      description: 'Notifications and team alerts',
      icon: '💬',
      color: '#4A154B',
      category: 'Communication',
      scopes: ['chat:write', 'channels:read'],
      authUrl: 'https://slack.com/oauth/v2/authorize'
    },
    {
      id: 'hubspot',
      name: 'HubSpot CRM',
      description: 'Sync opportunities and contacts',
      icon: '🔶',
      color: '#FF7A59',
      category: 'CRM',
      scopes: ['crm.objects.deals.read', 'crm.objects.deals.write'],
      authUrl: 'https://app.hubspot.com/oauth/authorize'
    },
    {
      id: 'docusign',
      name: 'DocuSign',
      description: 'Electronic signatures and approvals',
      icon: '✍️',
      color: '#FFD100',
      category: 'Legal',
      scopes: ['signature', 'impersonation'],
      authUrl: 'https://account.docusign.com/oauth/auth'
    }
  ];

  // OAuth flow handler
  const handleConnect = async (integration) => {
    setConnecting(integration.id);
    
    if (integration.authType === 'apiKey') {
      // Show API key modal
      const apiKey = prompt(`Enter your ${integration.name} API Key:`);
      if (apiKey) {
        await saveIntegration(integration.id, { apiKey });
      }
    } else {
      // OAuth flow
      const state = crypto.randomUUID();
      const redirectUri = `${window.location.origin}/auth/callback`;
      
      const params = new URLSearchParams({
        client_id: getClientId(integration.id),
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: integration.scopes.join(' '),
        state: `${integration.id}:${state}`
      });
      
      window.location.href = `${integration.authUrl}?${params}`;
    }
    
    setConnecting(null);
  };

  const saveIntegration = async (integrationId, credentials) => {
    await supabase.from('integrations').upsert({
      company_id: currentUser.company_id,
      integration_id: integrationId,
      credentials: credentials, // Encrypted in production
      connected_at: new Date().toISOString(),
      connected_by: currentUser.id
    });
    
    // Refresh integrations list
    loadIntegrations();
  };

  const handleDisconnect = async (integrationId) => {
    if (!confirm('Disconnect this integration?')) return;
    
    await supabase.from('integrations')
      .delete()
      .eq('company_id', currentUser.company_id)
      .eq('integration_id', integrationId);
    
    loadIntegrations();
  };

  // Group by category
  const categories = [...new Set(INTEGRATIONS.map(i => i.category))];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white">Integration Hub</h2>
          <p className="text-slate-400 text-sm">Connect your tools with one click</p>
        </div>
        <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg text-sm">
          {integrations.length} Connected
        </span>
      </div>

      {categories.map(category => (
        <div key={category}>
          <h3 className="text-lg font-semibold text-white mb-3">{category}</h3>
          <div className="grid grid-cols-2 gap-4">
            {INTEGRATIONS.filter(i => i.category === category).map(integration => {
              const isConnected = integrations.find(i => i.integration_id === integration.id);
              
              return (
                <div key={integration.id} className="glass p-4 hover-lift">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                        style={{ backgroundColor: `${integration.color}20` }}
                      >
                        {integration.icon}
                      </div>
                      <div>
                        <h4 className="font-medium text-white">{integration.name}</h4>
                        <p className="text-xs text-slate-400">{integration.description}</p>
                      </div>
                    </div>
                    
                    {isConnected ? (
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded text-xs">
                          ✓ Connected
                        </span>
                        <button 
                          onClick={() => handleDisconnect(integration.id)}
                          className="text-slate-400 hover:text-red-400 text-xs"
                        >
                          Disconnect
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleConnect(integration)}
                        disabled={connecting === integration.id}
                        className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black rounded-lg text-sm font-medium"
                      >
                        {connecting === integration.id ? 'Connecting...' : 'Connect'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
      
      <div className="glass p-4 bg-slate-800/50">
        <p className="text-slate-400 text-sm">
          💡 <strong>For non-technical users:</strong> Just click "Connect" and follow the prompts. 
          No coding required. Your data stays secure with encrypted credentials.
        </p>
      </div>
    </div>
  );
};
```

### AskSage Integration Details
```javascript
// AskSage API Integration
const AskSageClient = {
  baseUrl: 'https://api.asksage.ai/v1',
  
  // Initialize with API key from company settings
  init: async (apiKey) => {
    return {
      apiKey,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    };
  },
  
  // Generate compliance documents (ATO, CMMC, FedRAMP)
  generateCompliance: async (client, documentType, context) => {
    const response = await fetch(`${AskSageClient.baseUrl}/documents/generate`, {
      method: 'POST',
      headers: client.headers,
      body: JSON.stringify({
        template: documentType, // 'ato', 'cmmc', 'fedramp', 'nist800-53'
        context: context,
        format: 'docx'
      })
    });
    return response.json();
  },
  
  // Analyze RFP with AskSage
  analyzeRFP: async (client, fileBase64, fileName) => {
    const response = await fetch(`${AskSageClient.baseUrl}/analyze`, {
      method: 'POST',
      headers: client.headers,
      body: JSON.stringify({
        file: fileBase64,
        filename: fileName,
        analysis_type: 'rfp_requirements'
      })
    });
    return response.json();
  },
  
  // Chat with AskSage models
  chat: async (client, message, model = 'gpt-4') => {
    const response = await fetch(`${AskSageClient.baseUrl}/chat`, {
      method: 'POST',
      headers: client.headers,
      body: JSON.stringify({
        messages: [{ role: 'user', content: message }],
        model: model // 'gpt-4', 'claude-3', 'mistral', etc.
      })
    });
    return response.json();
  }
};

// Usage in MissionPulse
const useAskSageAgent = () => {
  const [client, setClient] = React.useState(null);
  
  React.useEffect(() => {
    const loadClient = async () => {
      const { data: integration } = await supabase
        .from('integrations')
        .select('credentials')
        .eq('integration_id', 'asksage')
        .single();
      
      if (integration?.credentials?.apiKey) {
        setClient(await AskSageClient.init(integration.credentials.apiKey));
      }
    };
    loadClient();
  }, []);
  
  return client;
};
```

### SAM.gov Integration
```javascript
// SAM.gov Opportunity Import
const SAMGovClient = {
  baseUrl: 'https://api.sam.gov/opportunities/v2',
  
  searchOpportunities: async (apiKey, params) => {
    const queryParams = new URLSearchParams({
      api_key: apiKey,
      postedFrom: params.postedFrom || '',
      postedTo: params.postedTo || '',
      limit: params.limit || 25,
      offset: params.offset || 0,
      ptype: params.type || '', // 'o' = solicitation, 'p' = presolicitation
      solnum: params.solicitationNumber || '',
      title: params.keyword || ''
    });
    
    const response = await fetch(`${SAMGovClient.baseUrl}/search?${queryParams}`);
    return response.json();
  },
  
  // Transform SAM.gov format to MissionPulse opportunities
  transformToOpportunity: (samRecord) => ({
    title: samRecord.title,
    solicitation_number: samRecord.solicitationNumber,
    agency: samRecord.department,
    description: samRecord.description,
    due_date: samRecord.responseDeadLine,
    ceiling_value: samRecord.award?.amount || 0,
    naics_code: samRecord.naicsCode,
    set_asides: samRecord.setAside,
    status: 'opportunity_identified',
    source: 'sam.gov',
    source_url: samRecord.uiLink
  })
};
```

### SQL Required (Supabase)
```sql
-- Integrations table for storing connection credentials
CREATE TABLE IF NOT EXISTS integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  integration_id TEXT NOT NULL, -- 'microsoft365', 'asksage', 'samgov', etc.
  credentials JSONB, -- Encrypted API keys, tokens
  settings JSONB DEFAULT '{}', -- Integration-specific settings
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  connected_by UUID REFERENCES profiles(id),
  last_sync_at TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'idle', -- idle, syncing, error
  UNIQUE(company_id, integration_id)
);

-- RLS policy
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Company integrations only" ON integrations
  FOR ALL USING (company_id = get_my_company_id());

-- Sync log for debugging
CREATE TABLE IF NOT EXISTS integration_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID REFERENCES integrations(id),
  action TEXT NOT NULL, -- 'sync', 'import', 'export'
  records_processed INTEGER DEFAULT 0,
  status TEXT, -- success, error
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Deliverables
1. Integration Hub UI in Admin module
2. One-click OAuth for Microsoft 365, SharePoint, Slack, HubSpot, DocuSign
3. API key integration for AskSage, SAM.gov, GovWin
4. SAM.gov opportunity auto-import
5. AskSage compliance document generation
6. Secure credential storage with encryption

---

## Sprint 29: Solo Proposal Manager Mode (NEW - Small Company Workflow)
**Duration:** 6-8 hours  
**Branch:** `v2-development`  
**Dependencies:** Sprint 28 complete

### Objectives
1. Create guided workflow for small companies with ONE person doing all roles
2. Leadership approval gates (Go/No-Go checkpoints)
3. SME feedback collection points
4. Progressive disclosure based on proposal phase
5. AI handles all 11 roles, human provides final approval

### Target User Profile
- **Company Size:** 1-10 employees
- **Proposal Team:** 1-2 people (often the CEO does everything)
- **Resources:** No dedicated proposal team, no Shipley consultants
- **Need:** Step-by-step guidance through entire proposal lifecycle

### Solo Mode Architecture
```javascript
// Solo Proposal Manager Mode Component
const SoloProposalManager = () => {
  const [opportunity, setOpportunity] = React.useState(null);
  const [currentPhase, setCurrentPhase] = React.useState(0);
  const [gateApprovals, setGateApprovals] = React.useState({});
  const [smeFeedback, setSmeFeedback] = React.useState({});
  const [aiOutputs, setAiOutputs] = React.useState({});

  // Shipley-aligned phases for solo mode
  const SOLO_PHASES = [
    {
      id: 0,
      name: 'Opportunity Discovery',
      shipleyPhase: 'Phase 0',
      description: 'Identify and qualify the opportunity',
      tasks: [
        { id: 'opp-import', title: 'Import from SAM.gov or Manual Entry', ai: true },
        { id: 'initial-review', title: 'AI Analysis of RFP/Sources Sought', ai: true },
        { id: 'go-nogo-0', title: 'Go/No-Go Decision', gate: true, approver: 'leadership' }
      ],
      aiRole: 'Capture Agent',
      duration: '1-2 days'
    },
    {
      id: 1,
      name: 'Capture Planning',
      shipleyPhase: 'Phase 1',
      description: 'Develop win strategy and understand customer',
      tasks: [
        { id: 'customer-intel', title: 'Customer Intelligence Gathering', ai: true },
        { id: 'competitor-analysis', title: 'Black Hat Competitor Analysis', ai: true },
        { id: 'win-themes', title: 'Generate Win Themes & Discriminators', ai: true },
        { id: 'teaming-analysis', title: 'Teaming Partner Recommendations', ai: true },
        { id: 'capture-plan', title: 'AI Draft Capture Plan', ai: true },
        { id: 'gate-1', title: 'Capture Readiness Review', gate: true, approver: 'leadership' }
      ],
      aiRole: 'Strategy Agent + Black Hat Agent',
      duration: '3-5 days'
    },
    {
      id: 2,
      name: 'RFP Analysis',
      shipleyPhase: 'Phase 2',
      description: 'Shred the RFP and build compliance matrix',
      tasks: [
        { id: 'rfp-upload', title: 'Upload RFP Documents', manual: true },
        { id: 'rfp-shred', title: 'AI Extract Requirements (Section L/M)', ai: true },
        { id: 'compliance-matrix', title: 'Build Compliance Matrix', ai: true },
        { id: 'questions', title: 'Generate Q&A for Government', ai: true },
        { id: 'sme-tech', title: 'Technical SME Review', sme: true, expertise: 'Technical' },
        { id: 'gate-2', title: 'Bid/No-Bid Final Decision', gate: true, approver: 'leadership' }
      ],
      aiRole: 'Compliance Agent',
      duration: '2-3 days'
    },
    {
      id: 3,
      name: 'Proposal Development',
      shipleyPhase: 'Phase 3',
      description: 'Write the proposal volumes',
      tasks: [
        { id: 'outline', title: 'AI Generate Annotated Outline', ai: true },
        { id: 'exec-summary', title: 'Draft Executive Summary', ai: true },
        { id: 'tech-approach', title: 'Draft Technical Approach', ai: true },
        { id: 'mgmt-approach', title: 'Draft Management Approach', ai: true },
        { id: 'past-perf', title: 'Draft Past Performance', ai: true },
        { id: 'staffing', title: 'Draft Staffing Plan & Resumes', ai: true },
        { id: 'sme-review', title: 'SME Technical Review', sme: true, expertise: 'Technical' },
        { id: 'pink-team', title: 'AI Pink Team Review', ai: true }
      ],
      aiRole: 'Writer Agent',
      duration: '5-10 days'
    },
    {
      id: 4,
      name: 'Pricing',
      shipleyPhase: 'Phase 3',
      description: 'Build pricing and cost volumes',
      tasks: [
        { id: 'boe', title: 'Build Basis of Estimate', ai: true },
        { id: 'labor-rates', title: 'Apply Labor Rate Cards', ai: true },
        { id: 'ptw', title: 'Price-to-Win Analysis', ai: true },
        { id: 'cost-volume', title: 'Generate Cost Volume', ai: true },
        { id: 'sme-finance', title: 'Finance/Contracts Review', sme: true, expertise: 'Finance' },
        { id: 'gate-pricing', title: 'Pricing Approval', gate: true, approver: 'leadership' }
      ],
      aiRole: 'Pricing Agent',
      duration: '2-3 days'
    },
    {
      id: 5,
      name: 'Reviews',
      shipleyPhase: 'Phase 4-5',
      description: 'Red team and gold team reviews',
      tasks: [
        { id: 'red-team', title: 'AI Red Team Review', ai: true },
        { id: 'red-fixes', title: 'Address Red Team Findings', manual: true },
        { id: 'gold-team', title: 'AI Gold Team Polish', ai: true },
        { id: 'compliance-check', title: 'Final Compliance Verification', ai: true },
        { id: 'gate-final', title: 'Final Submission Approval', gate: true, approver: 'leadership' }
      ],
      aiRole: 'QA Agent',
      duration: '2-3 days'
    },
    {
      id: 6,
      name: 'Submission',
      shipleyPhase: 'Phase 6',
      description: 'Package and submit the proposal',
      tasks: [
        { id: 'package', title: 'Package Proposal Volumes', ai: true },
        { id: 'production', title: 'Generate Final PDFs', ai: true },
        { id: 'submit', title: 'Submit to Government', manual: true },
        { id: 'confirmation', title: 'Record Submission Confirmation', manual: true }
      ],
      aiRole: 'System',
      duration: '1 day'
    },
    {
      id: 7,
      name: 'Orals Prep',
      shipleyPhase: 'Phase 6',
      description: 'Prepare for oral presentations (if required)',
      tasks: [
        { id: 'deck', title: 'Generate Orals Deck', ai: true },
        { id: 'qa-bank', title: 'Generate Q&A Bank', ai: true },
        { id: 'practice', title: 'Practice Session', manual: true }
      ],
      aiRole: 'Orals Agent',
      duration: '2-3 days',
      optional: true
    },
    {
      id: 8,
      name: 'Post-Award',
      shipleyPhase: 'Phase 7',
      description: 'Win or learn from the outcome',
      tasks: [
        { id: 'debrief', title: 'Request/Analyze Debrief', ai: true },
        { id: 'lessons', title: 'Capture Lessons Learned', ai: true },
        { id: 'playbook', title: 'Save to Playbook', ai: true },
        { id: 'transition', title: 'Transition Planning (if won)', ai: true }
      ],
      aiRole: 'Capture Agent',
      duration: '1-2 days'
    }
  ];

  // Execute AI task
  const executeAITask = async (task, phase) => {
    setAiOutputs(prev => ({
      ...prev,
      [task.id]: { status: 'generating', content: null }
    }));

    try {
      const response = await fetch(`${CONFIG.API_URL}/solo-task`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_id: task.id,
          task_title: task.title,
          phase: phase.name,
          opportunity: opportunity,
          previous_outputs: aiOutputs,
          ai_role: phase.aiRole
        })
      });

      const result = await response.json();
      
      setAiOutputs(prev => ({
        ...prev,
        [task.id]: { 
          status: 'complete', 
          content: result.output,
          confidence: result.confidence,
          citations: result.citations
        }
      }));
    } catch (error) {
      setAiOutputs(prev => ({
        ...prev,
        [task.id]: { status: 'error', error: error.message }
      }));
    }
  };

  // Handle gate approval
  const handleGateApproval = (taskId, approved, notes) => {
    setGateApprovals(prev => ({
      ...prev,
      [taskId]: { 
        approved, 
        notes, 
        approvedAt: new Date().toISOString(),
        approvedBy: currentUser.id 
      }
    }));

    if (approved) {
      // Progress to next phase
      setCurrentPhase(p => p + 1);
    }
  };

  // Handle SME feedback
  const handleSMEFeedback = (taskId, feedback) => {
    setSmeFeedback(prev => ({
      ...prev,
      [taskId]: { 
        feedback,
        submittedAt: new Date().toISOString()
      }
    }));
  };

  const phase = SOLO_PHASES[currentPhase];

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Progress Header */}
      <div className="bg-slate-800 p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-white">Solo Proposal Manager</h1>
            <p className="text-slate-400 text-sm">{opportunity?.title || 'No opportunity selected'}</p>
          </div>
          <span className="px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-full text-sm">
            {phase.shipleyPhase}
          </span>
        </div>
        
        {/* Phase Progress Bar */}
        <div className="flex gap-1">
          {SOLO_PHASES.filter(p => !p.optional).map((p, i) => (
            <div
              key={p.id}
              className={`flex-1 h-2 rounded-full ${
                i < currentPhase ? 'bg-emerald-500' :
                i === currentPhase ? 'bg-cyan-500' : 'bg-slate-700'
              }`}
            />
          ))}
        </div>
        <div className="flex justify-between mt-1 text-xs text-slate-500">
          <span>Discovery</span>
          <span>Submission</span>
        </div>
      </div>

      {/* Current Phase */}
      <div className="p-6">
        <div className="glass p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-xl bg-cyan-500/20 flex items-center justify-center">
              <span className="text-3xl">{phase.id + 1}</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{phase.name}</h2>
              <p className="text-slate-400">{phase.description}</p>
              <div className="flex gap-2 mt-2">
                <span className="px-2 py-1 bg-slate-700 rounded text-xs text-slate-300">
                  AI Role: {phase.aiRole}
                </span>
                <span className="px-2 py-1 bg-slate-700 rounded text-xs text-slate-300">
                  Est. {phase.duration}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Task List */}
        <div className="space-y-4">
          {phase.tasks.map((task, i) => {
            const output = aiOutputs[task.id];
            const isGateApproved = gateApprovals[task.id]?.approved;
            const hasSMEFeedback = smeFeedback[task.id];

            return (
              <div 
                key={task.id} 
                className={`glass p-4 ${
                  task.gate ? 'border-2 border-amber-500/50' :
                  task.sme ? 'border-2 border-purple-500/50' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      output?.status === 'complete' || isGateApproved || hasSMEFeedback
                        ? 'bg-emerald-500'
                        : output?.status === 'generating'
                        ? 'bg-cyan-500 animate-pulse'
                        : 'bg-slate-700'
                    }`}>
                      {output?.status === 'complete' || isGateApproved ? '✓' : i + 1}
                    </div>
                    <div>
                      <h3 className="font-medium text-white">{task.title}</h3>
                      <div className="flex gap-2 mt-1">
                        {task.ai && <span className="text-xs text-cyan-400">🤖 AI</span>}
                        {task.gate && <span className="text-xs text-amber-400">🚦 Gate</span>}
                        {task.sme && <span className="text-xs text-purple-400">👤 SME: {task.expertise}</span>}
                        {task.manual && <span className="text-xs text-slate-400">📝 Manual</span>}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {task.ai && !output && (
                      <button
                        onClick={() => executeAITask(task, phase)}
                        className="px-4 py-2 bg-cyan-500 text-black rounded-lg text-sm font-medium"
                      >
                        Run AI
                      </button>
                    )}
                    
                    {task.gate && output?.status === 'complete' && !isGateApproved && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleGateApproval(task.id, false, '')}
                          className="px-3 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm"
                        >
                          No-Go
                        </button>
                        <button
                          onClick={() => handleGateApproval(task.id, true, '')}
                          className="px-3 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium"
                        >
                          Approve & Continue
                        </button>
                      </div>
                    )}
                    
                    {task.sme && !hasSMEFeedback && (
                      <button
                        onClick={() => {
                          const feedback = prompt(`Enter ${task.expertise} SME feedback:`);
                          if (feedback) handleSMEFeedback(task.id, feedback);
                        }}
                        className="px-4 py-2 bg-purple-500 text-white rounded-lg text-sm font-medium"
                      >
                        Add Feedback
                      </button>
                    )}
                  </div>
                </div>

                {/* AI Output Preview */}
                {output?.status === 'complete' && (
                  <div className="mt-4 p-3 bg-slate-800 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-slate-400">AI Output</span>
                      <span className={`text-xs ${
                        output.confidence >= 85 ? 'text-emerald-400' : 'text-amber-400'
                      }`}>
                        {output.confidence}% confidence
                      </span>
                    </div>
                    <p className="text-sm text-slate-300 line-clamp-3">
                      {output.content?.substring(0, 300)}...
                    </p>
                    <button className="text-xs text-cyan-400 mt-2">View Full Output →</button>
                  </div>
                )}

                {/* Gate Approval Status */}
                {isGateApproved && (
                  <div className="mt-4 p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/30">
                    <span className="text-emerald-400 text-sm">✓ Approved by Leadership</span>
                  </div>
                )}

                {/* SME Feedback */}
                {hasSMEFeedback && (
                  <div className="mt-4 p-3 bg-purple-500/10 rounded-lg border border-purple-500/30">
                    <span className="text-purple-400 text-sm">
                      SME Feedback: {smeFeedback[task.id].feedback}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Assistant Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-800 p-4 border-t border-slate-700">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <p className="text-white text-sm">
              💡 <strong>Tip:</strong> {phase.id === 0 ? 
                "Start by importing an opportunity from SAM.gov or entering details manually." :
                `Focus on completing ${phase.tasks.filter(t => t.ai && !aiOutputs[t.id]).length} remaining AI tasks.`
              }
            </p>
          </div>
          <button className="px-4 py-2 bg-slate-700 text-white rounded-lg text-sm">
            Ask AI for Help
          </button>
        </div>
      </div>
    </div>
  );
};
```

### SQL Required
```sql
-- Solo mode progress tracking
CREATE TABLE IF NOT EXISTS solo_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  opportunity_id UUID REFERENCES opportunities(id),
  current_phase INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  settings JSONB DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS solo_task_outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solo_proposal_id UUID REFERENCES solo_proposals(id),
  task_id TEXT NOT NULL,
  phase INTEGER NOT NULL,
  ai_output TEXT,
  confidence INTEGER,
  citations JSONB,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS solo_gate_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solo_proposal_id UUID REFERENCES solo_proposals(id),
  task_id TEXT NOT NULL,
  approved BOOLEAN NOT NULL,
  notes TEXT,
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS solo_sme_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solo_proposal_id UUID REFERENCES solo_proposals(id),
  task_id TEXT NOT NULL,
  expertise TEXT,
  feedback TEXT NOT NULL,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS policies
ALTER TABLE solo_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE solo_task_outputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE solo_gate_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE solo_sme_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company solo proposals" ON solo_proposals
  FOR ALL USING (company_id = get_my_company_id());
```

### Deliverables
1. Solo Proposal Manager mode (new module)
2. 9-phase guided workflow aligned with Shipley
3. Leadership approval gates at key decision points
4. SME feedback collection mechanism
5. AI handles all 11 roles automatically
6. Progress persistence and resume capability
7. AI tips and guidance throughout

---

## Sprint 30: Company Knowledge Base (CRITICAL - Training Documents)
**Duration:** 8-10 hours  
**Branch:** `v2-development`  
**Dependencies:** Sprint 23 (Multi-Tenant Isolation) complete  
**Priority:** 🔴 HIGH - Core value proposition

### Problem Statement
Currently, MissionPulse AI has NO company-specific context. Every company gets generic Shipley advice. To win proposals, the AI needs to know:
- Past proposals (winning AND losing)
- Company boilerplate language
- Past performance citations
- Key personnel resumes/bios
- Technical approach templates
- Company capabilities statements
- Contract history
- Win themes that worked before
- Competitor intelligence gathered over time

### Objectives
1. **Document Upload Portal** - Drag-drop interface for training documents
2. **Vector Storage** - Embeddings for semantic search (RAG architecture)
3. **Auto-Categorization** - AI classifies documents by type
4. **Context Injection** - Relevant docs automatically injected into AI prompts
5. **Admin Management** - View, search, delete, re-categorize documents
6. **Multi-Tenant Isolation** - Each company's knowledge is completely separate

### Document Categories

| Category | Examples | Use Case |
|----------|----------|----------|
| **Past Proposals** | Technical volumes, exec summaries | Reuse winning language |
| **Past Performance** | CPARs, citations, case studies | Auto-populate past perf sections |
| **Resumes/Bios** | Key personnel, SME profiles | Staffing plan generation |
| **Capabilities** | Capability statements, quals | Discriminator identification |
| **Templates** | Section templates, outlines | Consistent formatting |
| **Contracts** | Awarded contracts, mods | Historical pricing data |
| **Competitor Intel** | Research, debrief notes | Black Hat analysis |
| **Win/Loss Analysis** | Debrief reports, lessons learned | Playbook enrichment |
| **Company Info** | Org charts, certifications | Boilerplate generation |
| **RFP Library** | Past RFPs, amendments | Pattern recognition |

### Architecture: RAG (Retrieval-Augmented Generation)

```
┌─────────────────────────────────────────────────────────────────┐
│                     COMPANY KNOWLEDGE BASE                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐    │
│  │   Upload     │────▶│   Process    │────▶│   Store      │    │
│  │   Portal     │     │   & Chunk    │     │   Vectors    │    │
│  └──────────────┘     └──────────────┘     └──────────────┘    │
│         │                    │                    │             │
│         ▼                    ▼                    ▼             │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐    │
│  │ PDF/DOCX/    │     │ Text Chunks  │     │ Supabase     │    │
│  │ XLSX/TXT     │     │ (512 tokens) │     │ pgvector     │    │
│  └──────────────┘     └──────────────┘     └──────────────┘    │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                       AI QUERY FLOW                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐    │
│  │  User Query  │────▶│   Embed &    │────▶│   Retrieve   │    │
│  │  "Draft exec │     │   Search     │     │   Top 5      │    │
│  │   summary"   │     │   Vectors    │     │   Chunks     │    │
│  └──────────────┘     └──────────────┘     └──────────────┘    │
│                                                   │             │
│                                                   ▼             │
│                              ┌──────────────────────────────┐   │
│                              │  Inject into AI Prompt       │   │
│                              │  + Generate Response         │   │
│                              └──────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Company Knowledge Base UI Component
```javascript
// Company Knowledge Base Module
const CompanyKnowledgeBase = () => {
  const [documents, setDocuments] = React.useState([]);
  const [uploading, setUploading] = React.useState(false);
  const [processing, setProcessing] = React.useState([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('all');
  const [stats, setStats] = React.useState({ total: 0, byCategory: {} });
  const fileInputRef = React.useRef();

  const CATEGORIES = [
    { id: 'past_proposals', name: 'Past Proposals', icon: '📄', color: '#00E5FA' },
    { id: 'past_performance', name: 'Past Performance', icon: '⭐', color: '#fbbf24' },
    { id: 'resumes', name: 'Resumes/Bios', icon: '👤', color: '#8b5cf6' },
    { id: 'capabilities', name: 'Capabilities', icon: '🎯', color: '#10b981' },
    { id: 'templates', name: 'Templates', icon: '📋', color: '#f97316' },
    { id: 'contracts', name: 'Contracts', icon: '📜', color: '#a78bfa' },
    { id: 'competitor_intel', name: 'Competitor Intel', icon: '🎭', color: '#ef4444' },
    { id: 'win_loss', name: 'Win/Loss Analysis', icon: '📊', color: '#22d3ee' },
    { id: 'company_info', name: 'Company Info', icon: '🏢', color: '#ec4899' },
    { id: 'rfp_library', name: 'RFP Library', icon: '📚', color: '#64748b' }
  ];

  const ACCEPTED_TYPES = '.pdf,.docx,.doc,.xlsx,.xls,.txt,.csv,.pptx,.ppt,.md';

  // Load documents on mount
  React.useEffect(() => {
    loadDocuments();
    loadStats();
  }, []);

  const loadDocuments = async () => {
    const { data, error } = await supabase
      .from('knowledge_documents')
      .select('*')
      .order('uploaded_at', { ascending: false });
    
    if (!error) setDocuments(data || []);
  };

  const loadStats = async () => {
    const { data } = await supabase
      .from('knowledge_documents')
      .select('category');
    
    if (data) {
      const byCategory = data.reduce((acc, doc) => {
        acc[doc.category] = (acc[doc.category] || 0) + 1;
        return acc;
      }, {});
      setStats({ total: data.length, byCategory });
    }
  };

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setUploading(true);

    for (const file of files) {
      const docId = crypto.randomUUID();
      
      // Add to processing queue
      setProcessing(prev => [...prev, { id: docId, name: file.name, progress: 0 }]);

      try {
        // 1. Upload file to Supabase Storage
        const filePath = `${currentUser.company_id}/${docId}/${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('knowledge-documents')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        setProcessing(prev => prev.map(p => 
          p.id === docId ? { ...p, progress: 30 } : p
        ));

        // 2. Extract text from document
        const text = await extractTextFromFile(file);
        
        setProcessing(prev => prev.map(p => 
          p.id === docId ? { ...p, progress: 50 } : p
        ));

        // 3. Auto-categorize with AI
        const category = await categorizeDocument(text, file.name);
        
        setProcessing(prev => prev.map(p => 
          p.id === docId ? { ...p, progress: 70 } : p
        ));

        // 4. Chunk text and generate embeddings
        const chunks = chunkText(text, 512); // 512 token chunks
        const embeddings = await generateEmbeddings(chunks);
        
        setProcessing(prev => prev.map(p => 
          p.id === docId ? { ...p, progress: 90 } : p
        ));

        // 5. Store document metadata
        await supabase.from('knowledge_documents').insert({
          id: docId,
          company_id: currentUser.company_id,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          storage_path: filePath,
          category: category,
          chunk_count: chunks.length,
          uploaded_by: currentUser.id,
          metadata: {
            original_name: file.name,
            detected_type: detectDocumentType(text)
          }
        });

        // 6. Store embeddings in vector table
        for (let i = 0; i < chunks.length; i++) {
          await supabase.from('knowledge_embeddings').insert({
            document_id: docId,
            company_id: currentUser.company_id,
            chunk_index: i,
            chunk_text: chunks[i],
            embedding: embeddings[i],
            metadata: { source: file.name, category }
          });
        }

        setProcessing(prev => prev.map(p => 
          p.id === docId ? { ...p, progress: 100, status: 'complete' } : p
        ));

      } catch (error) {
        console.error('Upload error:', error);
        setProcessing(prev => prev.map(p => 
          p.id === docId ? { ...p, status: 'error', error: error.message } : p
        ));
      }
    }

    setUploading(false);
    loadDocuments();
    loadStats();
    
    // Clear processing queue after 3 seconds
    setTimeout(() => setProcessing([]), 3000);
  };

  // Text extraction (uses same parsers as RFP Shredder)
  const extractTextFromFile = async (file) => {
    const ext = file.name.split('.').pop().toLowerCase();
    
    switch (ext) {
      case 'pdf':
        return await extractPDF(file);
      case 'docx':
      case 'doc':
        return await extractDOCX(file);
      case 'xlsx':
      case 'xls':
        return await extractXLSX(file);
      case 'txt':
      case 'md':
        return await file.text();
      case 'csv':
        return await extractCSV(file);
      case 'pptx':
      case 'ppt':
        return await extractPPTX(file);
      default:
        throw new Error(`Unsupported file type: ${ext}`);
    }
  };

  // AI-powered categorization
  const categorizeDocument = async (text, fileName) => {
    const response = await fetch(`${CONFIG.API_URL}/categorize-document`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: text.substring(0, 3000), // First 3000 chars for categorization
        fileName,
        categories: CATEGORIES.map(c => c.id)
      })
    });
    
    const data = await response.json();
    return data.category || 'company_info';
  };

  // Chunk text into ~512 token pieces
  const chunkText = (text, maxTokens = 512) => {
    const words = text.split(/\s+/);
    const chunks = [];
    let currentChunk = [];
    let currentLength = 0;

    for (const word of words) {
      const wordTokens = Math.ceil(word.length / 4); // Rough token estimate
      
      if (currentLength + wordTokens > maxTokens && currentChunk.length > 0) {
        chunks.push(currentChunk.join(' '));
        currentChunk = [word];
        currentLength = wordTokens;
      } else {
        currentChunk.push(word);
        currentLength += wordTokens;
      }
    }
    
    if (currentChunk.length > 0) {
      chunks.push(currentChunk.join(' '));
    }
    
    return chunks;
  };

  // Generate embeddings using API
  const generateEmbeddings = async (chunks) => {
    const response = await fetch(`${CONFIG.API_URL}/generate-embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts: chunks })
    });
    
    const data = await response.json();
    return data.embeddings;
  };

  // Delete document
  const handleDelete = async (doc) => {
    if (!confirm(`Delete "${doc.file_name}"? This cannot be undone.`)) return;

    // Delete embeddings
    await supabase.from('knowledge_embeddings')
      .delete()
      .eq('document_id', doc.id);

    // Delete document metadata
    await supabase.from('knowledge_documents')
      .delete()
      .eq('id', doc.id);

    // Delete from storage
    await supabase.storage
      .from('knowledge-documents')
      .remove([doc.storage_path]);

    loadDocuments();
    loadStats();
  };

  // Re-categorize document
  const handleRecategorize = async (doc, newCategory) => {
    await supabase.from('knowledge_documents')
      .update({ category: newCategory })
      .eq('id', doc.id);
    
    await supabase.from('knowledge_embeddings')
      .update({ metadata: { ...doc.metadata, category: newCategory } })
      .eq('document_id', doc.id);

    loadDocuments();
    loadStats();
  };

  // Search documents
  const searchDocuments = async () => {
    if (!searchQuery.trim()) return;

    const response = await fetch(`${CONFIG.API_URL}/search-knowledge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: searchQuery,
        company_id: currentUser.company_id,
        category: selectedCategory !== 'all' ? selectedCategory : null,
        limit: 10
      })
    });

    const data = await response.json();
    // Display search results...
  };

  const filteredDocs = documents.filter(doc => 
    (selectedCategory === 'all' || doc.category === selectedCategory) &&
    (!searchQuery || doc.file_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white">Company Knowledge Base</h2>
          <p className="text-slate-400 text-sm">
            Train AI with your company's documents • {stats.total} documents indexed
          </p>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2 bg-cyan-500 text-black rounded-lg text-sm font-medium flex items-center gap-2"
        >
          <span>📁</span> Upload Documents
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ACCEPTED_TYPES}
          className="hidden"
          onChange={handleUpload}
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-5 gap-4">
        {CATEGORIES.slice(0, 5).map(cat => (
          <div 
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`glass p-4 cursor-pointer hover-lift ${
              selectedCategory === cat.id ? 'border-2 border-cyan-500' : ''
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{cat.icon}</span>
              <span className="text-sm text-slate-400">{cat.name}</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {stats.byCategory[cat.id] || 0}
            </p>
          </div>
        ))}
      </div>

      {/* Processing Queue */}
      {processing.length > 0 && (
        <div className="glass p-4 space-y-3">
          <h3 className="text-white font-medium">Processing Documents...</h3>
          {processing.map(p => (
            <div key={p.id} className="flex items-center gap-4">
              <span className="text-sm text-slate-300 flex-1">{p.name}</span>
              <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all ${
                    p.status === 'error' ? 'bg-red-500' :
                    p.status === 'complete' ? 'bg-emerald-500' : 'bg-cyan-500'
                  }`}
                  style={{ width: `${p.progress}%` }}
                />
              </div>
              <span className={`text-xs ${
                p.status === 'error' ? 'text-red-400' :
                p.status === 'complete' ? 'text-emerald-400' : 'text-slate-400'
              }`}>
                {p.status === 'error' ? 'Error' :
                 p.status === 'complete' ? '✓ Done' : `${p.progress}%`}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Search & Filter */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents..."
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none"
        >
          <option value="all">All Categories</option>
          {CATEGORIES.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      {/* Document List */}
      <div className="glass overflow-hidden">
        <div className="p-4 border-b border-slate-700/50">
          <h3 className="font-semibold text-white">
            Documents ({filteredDocs.length})
          </h3>
        </div>
        <div className="divide-y divide-slate-700/50">
          {filteredDocs.map(doc => {
            const cat = CATEGORIES.find(c => c.id === doc.category);
            return (
              <div key={doc.id} className="p-4 hover:bg-slate-800/30 flex items-center gap-4">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                  style={{ backgroundColor: `${cat?.color}20` }}
                >
                  {cat?.icon || '📄'}
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-medium">{doc.file_name}</h4>
                  <div className="flex gap-3 mt-1">
                    <span className="text-xs text-slate-400">
                      {(doc.file_size / 1024).toFixed(1)} KB
                    </span>
                    <span className="text-xs text-slate-400">
                      {doc.chunk_count} chunks
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(doc.uploaded_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <select
                  value={doc.category}
                  onChange={(e) => handleRecategorize(doc, e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                >
                  {CATEGORIES.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <button
                  onClick={() => handleDelete(doc)}
                  className="p-2 text-slate-500 hover:text-red-400"
                >
                  🗑️
                </button>
              </div>
            );
          })}
          
          {filteredDocs.length === 0 && (
            <div className="p-12 text-center">
              <div className="text-4xl mb-4">📚</div>
              <p className="text-white">No documents yet</p>
              <p className="text-slate-400 text-sm mt-2">
                Upload past proposals, capabilities, and resumes to train your AI
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Help Text */}
      <div className="glass p-4 bg-slate-800/50">
        <p className="text-slate-400 text-sm">
          💡 <strong>How it works:</strong> Upload your company's documents and the AI will 
          automatically extract, categorize, and index them. When you use any AI agent, 
          relevant content from your knowledge base is automatically included for more 
          accurate, company-specific responses.
        </p>
      </div>
    </div>
  );
};
```

### Context Injection for AI Agents
```javascript
// Enhanced AI Agent with Knowledge Base Context
const useKnowledgeContext = async (query, category = null) => {
  // 1. Generate embedding for user query
  const response = await fetch(`${CONFIG.API_URL}/search-knowledge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      company_id: currentUser.company_id,
      category,
      limit: 5 // Top 5 most relevant chunks
    })
  });

  const { results } = await response.json();
  
  // 2. Format context for injection
  const context = results.map(r => ({
    source: r.source,
    category: r.category,
    content: r.chunk_text,
    relevance: r.similarity
  }));

  return context;
};

// Modified AI Chat with Knowledge Base
const sendMessageWithContext = async (userMessage, agentType) => {
  // Get relevant context from knowledge base
  const knowledgeContext = await useKnowledgeContext(userMessage, agentType);
  
  // Build enhanced prompt
  const systemPrompt = `You are a ${agentType} specialist for federal proposals.

COMPANY KNOWLEDGE BASE CONTEXT:
${knowledgeContext.map(c => `
[Source: ${c.source}]
${c.content}
`).join('\n---\n')}

Use the above company-specific context to inform your response.
If the context contains relevant information, cite it.
If asked about past performance, resumes, or capabilities, prioritize company documents.
`;

  const response = await fetch(`${CONFIG.API_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      company_id: currentUser.company_id
    })
  });

  return response.json();
};
```

### SQL Required (Supabase with pgvector)
```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Knowledge documents metadata
CREATE TABLE IF NOT EXISTS knowledge_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  storage_path TEXT NOT NULL,
  category TEXT NOT NULL,
  chunk_count INTEGER DEFAULT 0,
  uploaded_by UUID REFERENCES profiles(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  
  -- Indexes
  CONSTRAINT fk_company FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- Create index on company_id and category
CREATE INDEX idx_knowledge_docs_company ON knowledge_documents(company_id);
CREATE INDEX idx_knowledge_docs_category ON knowledge_documents(category);

-- Knowledge embeddings (vector storage)
CREATE TABLE IF NOT EXISTS knowledge_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES knowledge_documents(id) ON DELETE CASCADE,
  company_id UUID NOT NULL,
  chunk_index INTEGER NOT NULL,
  chunk_text TEXT NOT NULL,
  embedding vector(1536), -- OpenAI ada-002 dimension
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create vector similarity index (HNSW for fast search)
CREATE INDEX idx_embeddings_vector ON knowledge_embeddings 
  USING hnsw (embedding vector_cosine_ops);

-- Create index on company_id for multi-tenant isolation
CREATE INDEX idx_embeddings_company ON knowledge_embeddings(company_id);

-- RLS Policies
ALTER TABLE knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_embeddings ENABLE ROW LEVEL SECURITY;

-- Only access own company's documents
CREATE POLICY "Company knowledge documents" ON knowledge_documents
  FOR ALL USING (company_id = get_my_company_id());

CREATE POLICY "Company knowledge embeddings" ON knowledge_embeddings
  FOR ALL USING (company_id = get_my_company_id());

-- Similarity search function
CREATE OR REPLACE FUNCTION search_knowledge(
  query_embedding vector(1536),
  match_company_id UUID,
  match_category TEXT DEFAULT NULL,
  match_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
  document_id UUID,
  chunk_text TEXT,
  source TEXT,
  category TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.document_id,
    e.chunk_text,
    d.file_name as source,
    d.category,
    1 - (e.embedding <=> query_embedding) as similarity
  FROM knowledge_embeddings e
  JOIN knowledge_documents d ON e.document_id = d.id
  WHERE e.company_id = match_company_id
    AND (match_category IS NULL OR d.category = match_category)
  ORDER BY e.embedding <=> query_embedding
  LIMIT match_limit;
END;
$$;

-- Storage bucket for documents
-- Run in Supabase Dashboard: Storage > Create bucket > "knowledge-documents"
-- Set RLS: Only authenticated users can access their company's folder
```

### Backend API Endpoints
```python
# Backend API for Knowledge Base
from fastapi import APIRouter, HTTPException
from openai import OpenAI
import numpy as np

router = APIRouter()
client = OpenAI()

@router.post("/generate-embeddings")
async def generate_embeddings(request: dict):
    """Generate embeddings for text chunks"""
    texts = request.get("texts", [])
    
    response = client.embeddings.create(
        model="text-embedding-ada-002",
        input=texts
    )
    
    embeddings = [item.embedding for item in response.data]
    return {"embeddings": embeddings}

@router.post("/search-knowledge")
async def search_knowledge(request: dict):
    """Search knowledge base using vector similarity"""
    query = request.get("query")
    company_id = request.get("company_id")
    category = request.get("category")
    limit = request.get("limit", 5)
    
    # Generate embedding for query
    response = client.embeddings.create(
        model="text-embedding-ada-002",
        input=[query]
    )
    query_embedding = response.data[0].embedding
    
    # Search in Supabase using the similarity function
    results = await supabase.rpc(
        "search_knowledge",
        {
            "query_embedding": query_embedding,
            "match_company_id": company_id,
            "match_category": category,
            "match_limit": limit
        }
    ).execute()
    
    return {"results": results.data}

@router.post("/categorize-document")
async def categorize_document(request: dict):
    """Auto-categorize document using AI"""
    text = request.get("text")
    file_name = request.get("fileName")
    categories = request.get("categories")
    
    response = client.chat.completions.create(
        model="claude-sonnet-4-20250514",
        messages=[{
            "role": "user",
            "content": f"""Categorize this document into ONE of these categories:
{', '.join(categories)}

File name: {file_name}
Content preview: {text[:2000]}

Return ONLY the category ID, nothing else."""
        }]
    )
    
    category = response.choices[0].message.content.strip().lower()
    if category not in categories:
        category = "company_info"  # Default
    
    return {"category": category}
```

### Deliverables
1. Company Knowledge Base module (new)
2. Document upload with auto-categorization
3. Vector storage with pgvector
4. Semantic search across company documents
5. Context injection into all AI agents
6. Admin management (view, search, delete, re-categorize)
7. Multi-tenant isolation (company_id on all queries)
8. 10 document categories
9. Backend API for embeddings and search

---

## Sprint 31: AI Image & Diagram Generator (GPT-Style Interface)
**Duration:** 4-5 hours  
**Branch:** `v2-development`  
**Dependencies:** Sprint 28 (Integration Hub) complete  
**Priority:** 🟡 MEDIUM

### Objectives
1. **Image Generation** - Create proposal graphics, org charts, process flows
2. **Diagram Generation** - Mermaid diagrams, architecture diagrams
3. **GPT-Style Interface** - Natural language input → visual output
4. **Export Options** - PNG, SVG, embedded in documents
5. **Company Branding** - Apply company colors/logo to generated visuals

### Use Cases

| Use Case | Example Prompt | Output |
|----------|----------------|--------|
| **Org Chart** | "Create org chart for DHA project with PM, Tech Lead, 3 devs" | PNG/SVG |
| **Process Flow** | "Show our Agile development process with 6 sprints" | Mermaid diagram |
| **Architecture** | "AWS GovCloud architecture with 3-tier web app" | Architecture diagram |
| **Timeline** | "18-month implementation timeline with 4 phases" | Gantt chart |
| **Comparison** | "Side-by-side comparison of our approach vs incumbent" | Table/infographic |
| **Infographic** | "Key differentiators for DHA proposal" | Branded PNG |

### AI Image Generator Component
```javascript
// AI Image & Diagram Generator
const AIVisualGenerator = () => {
  const [prompt, setPrompt] = React.useState('');
  const [generating, setGenerating] = React.useState(false);
  const [output, setOutput] = React.useState(null);
  const [outputType, setOutputType] = React.useState('image'); // image, diagram, chart
  const [history, setHistory] = React.useState([]);

  const VISUAL_TYPES = [
    { id: 'image', name: 'Image/Graphic', icon: '🖼️', description: 'AI-generated images and graphics' },
    { id: 'orgchart', name: 'Org Chart', icon: '👥', description: 'Organizational hierarchy' },
    { id: 'flowchart', name: 'Flowchart', icon: '🔀', description: 'Process and decision flows' },
    { id: 'architecture', name: 'Architecture', icon: '🏗️', description: 'System architecture diagrams' },
    { id: 'timeline', name: 'Timeline/Gantt', icon: '📅', description: 'Project timelines' },
    { id: 'sequence', name: 'Sequence', icon: '↔️', description: 'Interaction sequences' }
  ];

  const EXAMPLE_PROMPTS = {
    image: [
      "Professional infographic showing 3 key differentiators for healthcare IT",
      "Modern tech illustration of cloud migration process",
      "Clean org chart icon set in blue and white"
    ],
    orgchart: [
      "Project org chart: Program Manager at top, under them Tech Lead and Admin Lead, under Tech Lead are 3 Developers",
      "Corporate hierarchy: CEO, then CFO and CTO, then their direct reports",
      "Matrix organization showing functional and project reporting lines"
    ],
    flowchart: [
      "Agile sprint process: Backlog → Planning → Development → Testing → Review → Deploy",
      "Incident response workflow with escalation paths",
      "User authentication flow with MFA"
    ],
    architecture: [
      "3-tier web application on AWS GovCloud: ALB, ECS, RDS Aurora",
      "Microservices architecture with API Gateway, 4 services, shared database",
      "CI/CD pipeline: GitHub → Jenkins → Docker → EKS"
    ],
    timeline: [
      "18-month implementation: Phase 1 Planning (3mo), Phase 2 Development (9mo), Phase 3 Testing (4mo), Phase 4 Deployment (2mo)",
      "Contract milestones: Award Jan, Kickoff Feb, PDR Apr, CDR Jul, Delivery Dec",
      "Sprint timeline showing 6 two-week sprints"
    ],
    sequence: [
      "User login sequence: Browser → API Gateway → Auth Service → Database → Response",
      "Order processing: Customer → Frontend → Order Service → Payment → Inventory → Notification",
      "Data sync between MissionPulse and SAM.gov"
    ]
  };

  const generate = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);

    try {
      const visualType = VISUAL_TYPES.find(t => t.id === outputType);
      
      if (outputType === 'image') {
        // Use DALL-E or similar for images
        const response = await fetch(`${CONFIG.API_URL}/generate-image`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: `Professional, clean, corporate style: ${prompt}. 
                     Use these brand colors: Primary Cyan #00E5FA, Navy #00050F.
                     No text unless specifically requested. High quality, proposal-ready.`,
            size: '1024x1024',
            style: 'vivid'
          })
        });
        
        const data = await response.json();
        setOutput({
          type: 'image',
          url: data.url,
          prompt: prompt
        });
      } else {
        // Use Claude to generate Mermaid diagram code
        const response = await fetch(`${CONFIG.API_URL}/generate-diagram`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt,
            diagramType: outputType,
            brandColors: {
              primary: '#00E5FA',
              secondary: '#00050F',
              accent: '#fbbf24'
            }
          })
        });
        
        const data = await response.json();
        setOutput({
          type: 'diagram',
          mermaidCode: data.mermaidCode,
          svg: data.svg,
          prompt: prompt
        });
      }

      // Add to history
      setHistory(prev => [{
        id: Date.now(),
        prompt,
        type: outputType,
        output: output,
        timestamp: new Date()
      }, ...prev.slice(0, 9)]); // Keep last 10

    } catch (error) {
      console.error('Generation error:', error);
      alert('Failed to generate visual. Please try again.');
    }

    setGenerating(false);
  };

  const exportVisual = async (format) => {
    if (!output) return;

    if (output.type === 'image') {
      // Download image
      const link = document.createElement('a');
      link.href = output.url;
      link.download = `visual_${Date.now()}.png`;
      link.click();
    } else {
      // Export diagram as SVG or PNG
      if (format === 'svg') {
        const blob = new Blob([output.svg], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `diagram_${Date.now()}.svg`;
        link.click();
      } else {
        // Convert SVG to PNG using canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          canvas.toBlob(blob => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `diagram_${Date.now()}.png`;
            link.click();
          });
        };
        img.src = 'data:image/svg+xml;base64,' + btoa(output.svg);
      }
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white">AI Visual Generator</h2>
        <p className="text-slate-400 text-sm">
          Create proposal graphics, diagrams, and charts with natural language
        </p>
      </div>

      {/* Visual Type Selector */}
      <div className="grid grid-cols-6 gap-3">
        {VISUAL_TYPES.map(type => (
          <button
            key={type.id}
            onClick={() => setOutputType(type.id)}
            className={`glass p-3 text-center hover-lift ${
              outputType === type.id ? 'border-2 border-cyan-500' : ''
            }`}
          >
            <div className="text-2xl mb-1">{type.icon}</div>
            <div className="text-xs text-white">{type.name}</div>
          </button>
        ))}
      </div>

      {/* Prompt Input */}
      <div className="glass p-4 space-y-4">
        <div>
          <label className="text-sm text-slate-400 block mb-2">
            Describe what you want to create:
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={`Example: "${EXAMPLE_PROMPTS[outputType]?.[0] || 'Describe your visual...'}"`}
            className="w-full h-24 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white resize-none focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Example Prompts */}
        <div>
          <p className="text-xs text-slate-500 mb-2">Try these examples:</p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_PROMPTS[outputType]?.map((example, i) => (
              <button
                key={i}
                onClick={() => setPrompt(example)}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded text-xs text-slate-300"
              >
                {example.substring(0, 50)}...
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={generate}
          disabled={!prompt.trim() || generating}
          className="w-full py-3 bg-gradient-to-r from-cyan-500 to-teal-500 text-black font-medium rounded-lg disabled:opacity-50"
        >
          {generating ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              Generating...
            </span>
          ) : (
            `Generate ${VISUAL_TYPES.find(t => t.id === outputType)?.name}`
          )}
        </button>
      </div>

      {/* Output Preview */}
      {output && (
        <div className="glass p-4 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-white font-medium">Generated Output</h3>
            <div className="flex gap-2">
              <button
                onClick={() => exportVisual('png')}
                className="px-3 py-1 bg-slate-700 text-white rounded text-sm"
              >
                Download PNG
              </button>
              {output.type === 'diagram' && (
                <button
                  onClick={() => exportVisual('svg')}
                  className="px-3 py-1 bg-slate-700 text-white rounded text-sm"
                >
                  Download SVG
                </button>
              )}
              <button
                onClick={() => navigator.clipboard.writeText(output.mermaidCode || output.url)}
                className="px-3 py-1 bg-slate-700 text-white rounded text-sm"
              >
                Copy
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 flex items-center justify-center min-h-[400px]">
            {output.type === 'image' ? (
              <img 
                src={output.url} 
                alt="Generated visual"
                className="max-w-full max-h-[500px] object-contain"
              />
            ) : (
              <div 
                className="mermaid-output"
                dangerouslySetInnerHTML={{ __html: output.svg }}
              />
            )}
          </div>

          {output.mermaidCode && (
            <details className="text-sm">
              <summary className="text-slate-400 cursor-pointer">View Mermaid Code</summary>
              <pre className="mt-2 p-3 bg-slate-800 rounded text-slate-300 overflow-x-auto">
                {output.mermaidCode}
              </pre>
            </details>
          )}
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="glass p-4">
          <h3 className="text-white font-medium mb-3">Recent Generations</h3>
          <div className="grid grid-cols-5 gap-3">
            {history.map(item => (
              <div 
                key={item.id}
                onClick={() => {
                  setPrompt(item.prompt);
                  setOutputType(item.type);
                }}
                className="aspect-square bg-slate-800 rounded-lg p-2 cursor-pointer hover:bg-slate-700"
              >
                <div className="text-xs text-slate-400 truncate">{item.prompt}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
```

### Backend API for Visual Generation
```python
# Backend API for Image/Diagram Generation
from fastapi import APIRouter
from openai import OpenAI
import anthropic

router = APIRouter()
openai_client = OpenAI()
anthropic_client = anthropic.Anthropic()

@router.post("/generate-image")
async def generate_image(request: dict):
    """Generate image using DALL-E"""
    prompt = request.get("prompt")
    size = request.get("size", "1024x1024")
    style = request.get("style", "vivid")
    
    response = openai_client.images.generate(
        model="dall-e-3",
        prompt=prompt,
        size=size,
        style=style,
        quality="hd",
        n=1
    )
    
    return {"url": response.data[0].url}

@router.post("/generate-diagram")
async def generate_diagram(request: dict):
    """Generate Mermaid diagram using Claude"""
    prompt = request.get("prompt")
    diagram_type = request.get("diagramType")
    brand_colors = request.get("brandColors", {})
    
    # Map diagram type to Mermaid syntax
    type_map = {
        'orgchart': 'graph TD',
        'flowchart': 'flowchart LR',
        'architecture': 'graph TB',
        'timeline': 'gantt',
        'sequence': 'sequenceDiagram'
    }
    
    mermaid_type = type_map.get(diagram_type, 'graph TD')
    
    response = anthropic_client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=2000,
        messages=[{
            "role": "user",
            "content": f"""Generate a Mermaid diagram for this request:

Request: {prompt}
Diagram Type: {mermaid_type}

Rules:
1. Start with "{mermaid_type}"
2. Use clear, professional labels
3. Keep it readable and not too complex
4. Use these styling if supported:
   - Primary color: {brand_colors.get('primary', '#00E5FA')}
   - Secondary: {brand_colors.get('secondary', '#00050F')}

Return ONLY the Mermaid code, no explanation."""
        }]
    )
    
    mermaid_code = response.content[0].text.strip()
    
    # Render Mermaid to SVG (using mermaid-cli or API)
    svg = await render_mermaid_to_svg(mermaid_code)
    
    return {
        "mermaidCode": mermaid_code,
        "svg": svg
    }

async def render_mermaid_to_svg(mermaid_code: str) -> str:
    """Render Mermaid code to SVG using mermaid.ink API"""
    import base64
    import httpx
    
    encoded = base64.b64encode(mermaid_code.encode()).decode()
    url = f"https://mermaid.ink/svg/{encoded}"
    
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        return response.text
```

### SQL Required
```sql
-- Visual generation history
CREATE TABLE IF NOT EXISTS visual_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  user_id UUID REFERENCES profiles(id),
  prompt TEXT NOT NULL,
  visual_type TEXT NOT NULL,
  output_url TEXT,
  mermaid_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE visual_generations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Company visuals" ON visual_generations
  FOR ALL USING (company_id = get_my_company_id());
```

### Deliverables
1. AI Visual Generator module (new)
2. Image generation using DALL-E 3
3. Diagram generation using Claude + Mermaid
4. 6 visual types (image, org chart, flowchart, architecture, timeline, sequence)
5. Export to PNG/SVG
6. Company branding injection
7. Generation history
8. Example prompts for each type

---

# 📊 SPRINT SUMMARY (UPDATED)

| Sprint | Name | Hours | Deliverable | Risk |
|--------|------|-------|-------------|------|
| **14A** | **Request Access Form** | **2-3** | **Public form + Gmail notify** | 🔴 HIGH |
| 14 | Auth Unification | 4-6 | Secure login flow | 🔴 HIGH |
| 15 | User Management + **CSV Upload** | **4-5** | Admin controls + bulk import | 🟡 MED |
| **16A** | **HubSpot Field Alignment** | **4-5** | **Opportunity schema + mapping** | 🔴 HIGH |
| 16 | Contracts/Compliance | 4-5 | Live M4/M5 modules | 🟡 MED |
| 17 | Black Hat | 4-5 | RBAC + competitor CRUD | 🟡 MED |
| 18 | Pricing Engine | 6-8 | BOE Builder + PTW | 🟡 MED |
| 19 | HITL Queue | 5-6 | AI governance system | 🟡 MED |
| 20 | Orals Studio | 6-8 | Presentation builder | 🟢 LOW |
| 21 | Post-Award/Playbook | 4-5 | M14/M15 modules | 🟢 LOW |
| 22 | Partner Management | 4-5 | Auto-revoke + CUI | 🟡 MED |
| 23 | **Multi-Tenant Isolation** | **6-8** | **RLS all tables + storage** | 🔴 HIGH |
| 24 | QA Gauntlet | 4-5 | Security audit | 🔴 HIGH |
| 25 | Launch Readiness | 4-5 | Production deploy | 🔴 HIGH |
| **26** | **Chat UX Enhancement** | **4-5** | **Enter-to-send + prompts** | 🟡 MED |
| **27** | **Final Polish** | **3-4** | **Docs + bug fixes** | 🟢 LOW |
| **TOTAL** | | **71-92 hrs** | **v2.0 Complete** | |

---

# 🗓️ RECOMMENDED TIMELINE (UPDATED)

## Week 1-2: Foundation
- **Sprint 14A: Request Access Form (NEW)**
- Sprint 14: Auth Unification
- Sprint 15: User Management + CSV Upload

## Week 3-4: Data & Module Integration
- **Sprint 16A: HubSpot Field Alignment (NEW)**
- Sprint 16: Contracts/Compliance
- Sprint 17: Black Hat
- Sprint 18: Pricing Engine

## Week 5-6: Advanced Features
- Sprint 19: HITL Queue
- Sprint 20: Orals Studio
- Sprint 21: Post-Award/Playbook

## Week 7: Enterprise & Security
- Sprint 22: Partner Management
- Sprint 23: Multi-Tenant Isolation (CRITICAL)

## Week 8-9: Launch & Polish
- Sprint 24: QA Gauntlet
- Sprint 25: Launch Readiness
- **Sprint 26: Chat UX Enhancement (NEW)**
- **Sprint 27: Final Polish (NEW)**

---

# 🚀 IMMEDIATE NEXT ACTION

**Start Sprint 14A: Request Access Form**

This creates the public-facing lead capture before locking down authentication.

First command to execute:
```powershell
cd C:\Users\MaryWomack\Desktop\missionpulse-frontend
```

Then:
```powershell
git checkout v2-development
```

Ready to proceed with Sprint 14A implementation?

---

*Document Version: 2.0*
*Created: January 28, 2026*
*Updated: January 28, 2026 (Added 5 new features)*
*Author: MissionPulse Architecture Team*
*Classification: CUI // SP-PROPIN*

---

## Footer Stack (Per Architecture Standards)

**Architecture Snapshot:**
- Files: 14 sprints defined (was 12)
- Tables: 10+ new Supabase tables specified
- Policies: 15+ RLS policies required
- **NEW: HubSpot field mapping**
- **NEW: CSV user import**
- **NEW: Request access form with email**
- **NEW: Agent-specific chat prompts**

**Security Audit:**
- ✅ No secrets in document
- ✅ RBAC defined per module
- ✅ Multi-tenant isolation specified (COMPREHENSIVE)
- ✅ Zero data bleed guarantee

**Cost Meter:**
- Estimated dev hours: 71-92 (was 54-68)
- Supabase: Within free tier
- Render: Free tier sufficient
- Resend (email): Free tier (100 emails/day)

**Liability Disclaimer:**
AI GENERATED - REQUIRES HUMAN REVIEW
