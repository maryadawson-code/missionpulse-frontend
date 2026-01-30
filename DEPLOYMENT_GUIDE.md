# MissionPulse Auth System Deployment Guide
## Complete Setup Instructions

---

## 📋 Pre-Deployment Checklist

Before starting, verify you have:
- [ ] Access to Supabase dashboard (https://supabase.com/dashboard/project/djuviwarqdvlbgcfuupa)
- [ ] GitHub access to missionpulse-frontend repo
- [ ] PowerShell open on your desktop
- [ ] These 4 files downloaded to your Downloads folder

---

## 🗄️ STEP 1: Database Setup (5 minutes)

### 1.1 Create Auth User in Supabase

1. Open: https://supabase.com/dashboard/project/djuviwarqdvlbgcfuupa/auth/users
2. Click **"Add user"** → **"Create new user"**
3. Enter:
   - **Email:** `mwomack@missionmeetstech.com`
   - **Password:** `MissionPulse2026!`
   - **Auto Confirm User:** ✅ ON (toggle it)
4. Click **Create user**

### 1.2 Run Database Schema

1. Open: https://supabase.com/dashboard/project/djuviwarqdvlbgcfuupa/sql/new
2. Copy the ENTIRE contents of `database-setup.sql`
3. Paste into the SQL Editor
4. Click **Run** (or Cmd/Ctrl + Enter)
5. You should see "Success. No rows returned" messages

### 1.3 Verify Tables Created

In the Supabase sidebar, click **Table Editor** and confirm these tables exist:
- ✅ companies
- ✅ users (should have 11 rows)
- ✅ opportunities (should have 6 rows)
- ✅ competitors
- ✅ compliance_requirements
- ✅ team_members
- ✅ partners
- ✅ documents
- ✅ gate_reviews
- ✅ playbook_lessons

---

## 📁 STEP 2: Deploy Files to GitHub (3 minutes)

### 2.1 Move Files to Repo

Open PowerShell and run these commands ONE AT A TIME:

```powershell
cd C:\Users\MaryWomack\Desktop\missionpulse-frontend
```

```powershell
Move-Item -Path "$env:USERPROFILE\Downloads\supabase-client.js" -Destination "." -Force
```

```powershell
Move-Item -Path "$env:USERPROFILE\Downloads\auth-guard.js" -Destination "." -Force
```

```powershell
Move-Item -Path "$env:USERPROFILE\Downloads\login.html" -Destination "." -Force
```

### 2.2 Commit and Push to GitHub

```powershell
git add .
```

```powershell
git commit -m "Add auth system: login page, auth guard, enhanced supabase client v2.0"
```

```powershell
git push origin main
```

### 2.3 Wait for Netlify Deploy

Netlify will auto-deploy in ~30 seconds. Check status at:
https://app.netlify.com/sites/missionpulse/deploys

---

## 🧪 STEP 3: Test Auth Flow (2 minutes)

### 3.1 Test Login Page

1. Open: https://missionpulse.netlify.app/login.html
2. Credentials should be pre-filled (demo mode)
3. Click **Sign In**
4. You should be redirected to the dashboard

### 3.2 Verify Session

Open browser console (F12) and run:

```javascript
// Check user is logged in
MissionPulse.getCurrentUser().then(r => console.log('User:', r.data?.profile?.fullName, '| Role:', r.data?.profile?.roleId));
```

Expected output: `User: Mary Womack | Role: CEO`

### 3.3 Test CRUD Operations

```javascript
// Fetch opportunities
MissionPulse.getOpportunities().then(r => console.log('Pipeline:', r.data?.length, 'opportunities | Total:', MissionPulse.formatCurrency(r.data?.reduce((s,o) => s + (o.contractValue||0), 0))));
```

Expected output: `Pipeline: 6 opportunities | Total: $713.0M`

---

## 🔧 STEP 4: Update Protected Pages

For each HTML page that should require login, add these scripts in the `<head>`:

```html
<!-- Auth Scripts (add BEFORE closing </head>) -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="supabase-client.js"></script>
<script src="auth-guard.js"></script>
```

And add these data attributes to the `<body>` tag:

```html
<body data-require-auth="true" data-module-id="dashboard">
```

### Module IDs for RBAC:

| Module ID | Page Purpose |
|-----------|--------------|
| dashboard | Main dashboard |
| pipeline | Opportunity pipeline |
| warroom | War room / capture |
| compliance | Compliance tracking |
| irondome | Iron Dome module |
| blackhat | Competitive intel |
| pricing | BOE / Pricing |
| staffing | Team staffing |
| partners | Partner management |
| documents | Document vault |
| admin | Admin panel |

---

## 🎨 STEP 5: Add Logout Button (Optional)

Add this anywhere in your navigation:

```html
<button onclick="mpLogout()" class="logout-btn">
  Sign Out
</button>
```

Style as needed with your design system.

---

## 🔒 STEP 6: Production Hardening (Later)

When ready for production:

1. **Remove demo banner** from login.html:
   - Delete the `<div class="demo-banner">` section
   - Remove the pre-fill JavaScript at the bottom

2. **Enable RLS** in Supabase:
   - Uncomment the RLS section in database-setup.sql
   - Run the uncommented policies

3. **Configure allowed domains** in Supabase:
   - Go to Authentication → URL Configuration
   - Add your production domain to "Redirect URLs"

---

## 🚨 Troubleshooting

### "Invalid login credentials"
- Verify user exists in Supabase Auth tab (not just users table)
- Confirm "Auto Confirm User" was enabled when creating user
- Check email matches exactly (case-sensitive)

### "Supabase not initialized"
- Ensure `@supabase/supabase-js@2` script loads BEFORE `supabase-client.js`
- Check browser console for CORS errors

### "No data returned"
- Run verification queries in SQL Editor
- Check that opportunities table has data
- Verify Supabase anon key is correct

### Auth guard redirects immediately
- Check that login.html is in PUBLIC_PAGES array in auth-guard.js
- Verify page path matches exactly

---

## ✅ Success Criteria

Your auth system is working when:

1. ✅ Login page loads with branded design
2. ✅ Can sign in with demo credentials
3. ✅ Dashboard loads after login
4. ✅ `MissionPulse.getCurrentUser()` returns user data
5. ✅ `MissionPulse.getOpportunities()` returns 6 records
6. ✅ Protected pages redirect to login when not authenticated

---

**Questions? Issues?** 
Provide the browser console output and I'll diagnose the issue.

© 2026 Mission Meets Tech | Mission. Technology. Transformation.
