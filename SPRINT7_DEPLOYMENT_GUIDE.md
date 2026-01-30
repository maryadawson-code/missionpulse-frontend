# MissionPulse Sprint 7 - Authentication Deployment Guide
## Production-Ready in 4 Steps

**Created:** January 27, 2026  
**Target:** Get MissionPulse client-ready with authentication

---

## 📦 Files in This Package

| File | Purpose |
|------|---------|
| `supabase-client.js` | Enhanced client with auth functions |
| `login.html` | Professional login page |
| `index.html` | Auth-protected entry point |
| `auth-components.jsx` | React components for dashboard integration |

---

## 🚀 Step 1: Deploy New Files

### PowerShell Commands (run one at a time):

```powershell
cd C:\Users\MaryWomack\Desktop\missionpulse-frontend
```

Download the files from Claude, then:

```powershell
Move-Item "$env:USERPROFILE\Downloads\supabase-client.js" . -Force
```

```powershell
Move-Item "$env:USERPROFILE\Downloads\login.html" . -Force
```

```powershell
Move-Item "$env:USERPROFILE\Downloads\index.html" . -Force
```

---

## 🔧 Step 2: Update Main Dashboard

Open `missionpulse-v12-task17-complete.html` and make these changes:

### 2a. Add Supabase scripts in `<head>` (if not already there):

```html
<head>
    ...
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- ADD THESE TWO LINES -->
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <script src="supabase-client.js"></script>
    ...
</head>
```

### 2b. Add AuthContext at the top of the `<script type="text/babel">` block:

```jsx
// Add after existing useContext imports
const AuthContext = createContext(null);
```

### 2c. Add the AuthProvider component (from auth-components.jsx):

Copy the `AuthProvider` function from `auth-components.jsx` and paste it after your ROLES definition.

### 2d. Add the UserMenu component (from auth-components.jsx):

Copy the `UserMenu` function and paste it with the other components.

### 2e. Wrap your main render with AuthProvider:

Find the ReactDOM.createRoot line at the bottom and change it:

**Before:**
```jsx
ReactDOM.createRoot(document.getElementById('root')).render(<MissionPulseApp />);
```

**After:**
```jsx
ReactDOM.createRoot(document.getElementById('root')).render(
  <AuthProvider>
    <MissionPulseApp />
  </AuthProvider>
);
```

### 2f. Add UserMenu to your header:

Find the header section in `MissionPulseApp` and add `<UserMenu />`:

```jsx
<header className="...">
  <div className="flex items-center gap-4">
    {/* ...existing logo and nav... */}
  </div>
  <div className="flex items-center gap-3">
    {/* ...existing connection status... */}
    <UserMenu />  {/* ADD THIS */}
  </div>
</header>
```

---

## 📤 Step 3: Commit & Deploy

```powershell
git add .
```

```powershell
git commit -m "Sprint 7: Add authentication with login flow"
```

```powershell
git push
```

Netlify auto-deploys in ~60 seconds.

---

## ✅ Step 4: Test Authentication

### 4a. Clear browser state:
- Open https://missionpulse.netlify.app in Incognito mode

### 4b. Verify login flow:
1. Should redirect to `login.html`
2. Use demo credentials: `mwomack@rockitdata.com` / `Test123!`
3. Should redirect to dashboard after login

### 4c. Verify session persistence:
1. Refresh the page - should stay logged in
2. Close browser, reopen - should stay logged in

### 4d. Verify logout:
1. Click user menu → Sign out
2. Should redirect to login page
3. Direct URL access to dashboard should redirect to login

---

## 🔐 Create Test Users in Supabase

If the demo credentials don't work, create a user in Supabase:

1. Go to https://supabase.com/dashboard/project/djuviwarqdvlbgcfuupa
2. Navigate to **Authentication** → **Users**
3. Click **Add user** → **Create new user**
4. Enter:
   - Email: `mwomack@rockitdata.com`
   - Password: `Test123!`
   - Auto Confirm User: ✅ (checked)
5. Click **Create user**

---

## 🎯 Production Checklist

### Authentication
- [ ] Login page loads at `/login.html`
- [ ] Demo credentials work
- [ ] Session persists on refresh
- [ ] Logout redirects to login
- [ ] Direct dashboard access requires login

### Dashboard
- [ ] Pipeline shows live Supabase data
- [ ] Stats calculate correctly
- [ ] User menu displays email
- [ ] Logout works from user menu

### Data Integration
- [ ] M1 Pipeline: Opportunity list from Supabase
- [ ] M2 War Room: Featured opportunity loads
- [ ] M3 Swimlane: Opportunities grouped by phase
- [ ] M8 Pricing: Ceiling values display
- [ ] M12 Dashboard: Live stats
- [ ] M13 ROI: Calculations use live data

### Polish
- [ ] No console errors
- [ ] Loading states display properly
- [ ] Error messages are user-friendly
- [ ] Mobile responsive

---

## 🐛 Troubleshooting

### "Invalid login credentials"
- Verify user exists in Supabase Auth → Users
- Check password is correct (case-sensitive)
- Try creating a new test user

### "Supabase not initialized"
- Check `supabase-client.js` is loaded before components
- Verify Supabase CDN script is in `<head>`
- Check browser console for errors

### Session not persisting
- Clear localStorage and try again
- Check browser isn't blocking cookies/storage
- Verify Supabase auth config has `persistSession: true`

### Redirect loop
- Clear sessionStorage: `sessionStorage.clear()`
- Check `mp_redirect_after_login` isn't set to login page

---

## 📊 What's Next (Sprint 8)

Once auth is working:

1. **Wire remaining modules to Supabase:**
   - M4 Compliance → `compliance_requirements` table
   - M7 Black Hat → `competitors` table
   - M11 Frenemy → `partners` table

2. **Add error boundaries** for graceful failures

3. **Loading states** on all data-dependent views

4. **Mobile responsiveness** check

---

**AI GENERATED - REQUIRES HUMAN REVIEW**

© 2026 Mission Meets Tech
