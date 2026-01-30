# 🚀 MissionPulse Phase 4+ Complete Deployment Package

## Quick Reference
- **Supabase URL:** `https://djuviwarqdvlbgcfuupa.supabase.co`
- **Frontend:** `https://missionpulse-frontend.netlify.app`
- **Local Repo:** `C:\Users\MaryWomack\Desktop\missionpulse-frontend`

---

## 📦 PACKAGE CONTENTS

### Core Application Files
| File | Purpose |
|------|---------|
| `missionpulse-phase4-index.html` | Main dashboard → rename to `index.html` |
| `login.html` | Authentication (email/password + OAuth) |
| `reset-password.html` | Password reset flow |
| `accept-invite.html` | Team invitation acceptance |

### Feature Pages
| File | Purpose |
|------|---------|
| `admin-users.html` | User management (Admin only) |
| `opportunity.html` | View/Edit single opportunity |
| `notifications.html` | Notification center |
| `settings.html` | User settings page |
| `404.html` | Error page |

### JavaScript Libraries
| File | Purpose |
|------|---------|
| `supabase-client.js` | `MP.auth` and `MP.db` helper methods |
| `auth-guard.js` | Auto-protect pages, RBAC |
| `mp-components.js` | Reusable React component library |

### Database Files
| File | Purpose |
|------|---------|
| `missionpulse-schema.sql` | Complete database schema (run FIRST) |
| `missionpulse-seed-data.sql` | Sample opportunities data |

### Configuration
| File | Purpose |
|------|---------|
| `netlify.toml` | Routing, headers, security |

---

## 🔧 STEP-BY-STEP DEPLOYMENT

### STEP 1: Database Setup (Supabase)

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Run `missionpulse-schema.sql` (creates all tables + RLS policies)
3. Run `missionpulse-seed-data.sql` (adds sample data)

### STEP 2: Download Files

Download all files from this chat to your Downloads folder.

### STEP 3: Deploy to Repository

Open **PowerShell** and run these commands ONE AT A TIME:

```powershell
cd C:\Users\MaryWomack\Desktop\missionpulse-frontend
```

```powershell
Move-Item -Path "$env:USERPROFILE\Downloads\missionpulse-phase4-index.html" -Destination ".\index.html" -Force
```

```powershell
Move-Item -Path "$env:USERPROFILE\Downloads\login.html" -Destination "." -Force
```

```powershell
Move-Item -Path "$env:USERPROFILE\Downloads\reset-password.html" -Destination "." -Force
```

```powershell
Move-Item -Path "$env:USERPROFILE\Downloads\accept-invite.html" -Destination "." -Force
```

```powershell
Move-Item -Path "$env:USERPROFILE\Downloads\admin-users.html" -Destination "." -Force
```

```powershell
Move-Item -Path "$env:USERPROFILE\Downloads\opportunity.html" -Destination "." -Force
```

```powershell
Move-Item -Path "$env:USERPROFILE\Downloads\notifications.html" -Destination "." -Force
```

```powershell
Move-Item -Path "$env:USERPROFILE\Downloads\settings.html" -Destination "." -Force
```

```powershell
Move-Item -Path "$env:USERPROFILE\Downloads\404.html" -Destination "." -Force
```

```powershell
Move-Item -Path "$env:USERPROFILE\Downloads\supabase-client.js" -Destination "." -Force
```

```powershell
Move-Item -Path "$env:USERPROFILE\Downloads\auth-guard.js" -Destination "." -Force
```

```powershell
Move-Item -Path "$env:USERPROFILE\Downloads\mp-components.js" -Destination "." -Force
```

```powershell
Move-Item -Path "$env:USERPROFILE\Downloads\netlify.toml" -Destination "." -Force
```

### STEP 4: Git Push

```powershell
git add .
```

```powershell
git commit -m "Phase 4: Complete Supabase integration with auth, dashboard, and user management"
```

```powershell
git push origin main
```

### STEP 5: Link Your User Account

After signing up via the login page, get your auth user UUID from Supabase:
1. Go to **Supabase Dashboard** → **Authentication** → **Users**
2. Copy your user's UUID
3. Run this SQL in **SQL Editor** (replace the UUID):

```sql
UPDATE users 
SET id = 'YOUR-AUTH-USER-UUID-HERE'
WHERE email = 'your-email@example.com';
```

---

## ✅ TESTING CHECKLIST

### Authentication Flow
- [ ] Visit site → redirects to `/login.html`
- [ ] Sign up creates account
- [ ] Sign in works
- [ ] Logout returns to login
- [ ] Password reset sends email

### Dashboard
- [ ] KPIs load with real data
- [ ] Opportunity cards display
- [ ] Phase filter works
- [ ] Priority filter works
- [ ] Search works
- [ ] Click opportunity → detail page

### Admin (CEO/COO/Admin roles only)
- [ ] User management page loads
- [ ] Can see team members
- [ ] Can invite new users
- [ ] Can edit user roles

---

## 🗂️ FILE STRUCTURE AFTER DEPLOYMENT

```
missionpulse-frontend/
├── index.html              # Dashboard (protected)
├── login.html              # Auth page (public)
├── reset-password.html     # Password reset (public)
├── accept-invite.html      # Invitation acceptance (public)
├── admin-users.html        # User management (admin)
├── opportunity.html        # Opportunity detail (protected)
├── notifications.html      # Notifications (protected)
├── settings.html           # User settings (protected)
├── 404.html                # Error page
├── supabase-client.js      # MP.auth, MP.db helpers
├── auth-guard.js           # Page protection
├── mp-components.js        # React component library
├── netlify.toml            # Deploy config
└── [existing module files] # M1-M15 pages
```

---

## 🔐 SUPABASE CREDENTIALS

```javascript
const SUPABASE_URL = 'https://djuviwarqdvlbgcfuupa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqdXZpd2FycWR2bGJnY2Z1dXBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NDQ0NjUsImV4cCI6MjA4NTAyMDQ2NX0.3s8ufDDN2aWfkW0RBsAyJyacb2tjB7M550WSFIohHcA';
```

---

## 📝 QUICK API REFERENCE

### Authentication (MP.auth)
```javascript
await MP.auth.login(email, password)
await MP.auth.signup(email, password, { full_name: 'Name' })
await MP.auth.logout()
await MP.auth.getUser()
await MP.auth.resetPassword(email)
```

### Database (MP.db)
```javascript
await MP.db.getUserProfile()
await MP.db.getOpportunities({ phase: 'proposal', priority: 'high' })
await MP.db.getOpportunity(id)
await MP.db.createOpportunity(data)
await MP.db.updateOpportunity(id, updates)
await MP.db.deleteOpportunity(id)
await MP.db.getCompanyUsers()
```

---

## 🎯 WHAT'S NEXT (Phase 5+)

1. **Real-time Updates** - Live sync across users
2. **File Uploads** - RFP document storage
3. **AI Chat Integration** - Connect to Anthropic API
4. **Email Notifications** - Deadline alerts
5. **Module Integration** - Connect M1-M15 to real data

---

**Questions?** Everything is ready to deploy. Just follow the steps above!
