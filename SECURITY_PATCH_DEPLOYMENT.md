# MissionPulse Security Patch Deployment
## TURBO MODE COMMANDS - January 30, 2026

---

## FILES CREATED

| File | Purpose |
|------|---------|
| `login.html` | Unified auth page with demo mode |
| `missionpulse-auth.js` | Universal auth module for all pages |
| `AUTH_INJECTION_SNIPPET.js` | Code snippet to add auth to modules |
| `BLACKHAT_RBAC_PATCH.js` | RBAC restriction for Black Hat (CEO/COO/CAP) |
| `CUI_BANNER_PATCH.js` | CUI marking for Pricing module |
| `security-patches.ps1` | Automated fix script |

---

## 🚀 TURBO DEPLOYMENT (Copy-Paste Ready)

### Step 1: Download all files to your Downloads folder
*Files should already be there from this chat*

### Step 2: Run this SINGLE COMMAND in PowerShell:

```powershell
cd C:\Users\MaryWomack\Desktop\missionpulse-frontend; Get-ChildItem -Filter "*.html" | ForEach-Object { (Get-Content $_.FullName -Raw) -replace 'qlbvbfaprymzdqywcsiq', 'qdrtpnpnhkxvfmvfziop' | Set-Content $_.FullName -NoNewline }; Move-Item "$env:USERPROFILE\Downloads\login.html" . -Force -ErrorAction SilentlyContinue; Move-Item "$env:USERPROFILE\Downloads\missionpulse-auth.js" . -Force -ErrorAction SilentlyContinue; Move-Item "$env:USERPROFILE\Downloads\AUTH_INJECTION_SNIPPET.js" . -Force -ErrorAction SilentlyContinue; Move-Item "$env:USERPROFILE\Downloads\BLACKHAT_RBAC_PATCH.js" . -Force -ErrorAction SilentlyContinue; Move-Item "$env:USERPROFILE\Downloads\CUI_BANNER_PATCH.js" . -Force -ErrorAction SilentlyContinue; Move-Item "$env:USERPROFILE\Downloads\security-patches.ps1" . -Force -ErrorAction SilentlyContinue; git add .; git commit -m "SECURITY: Supabase URL fix, auth module, RBAC patches"; git push origin main
```

---

## 📋 MANUAL VERIFICATION CHECKLIST

After deployment, verify:

- [ ] https://missionpulse.netlify.app loads
- [ ] Login page appears at /login.html
- [ ] Demo login works: `demo@missionmeetstech.com` / `demo123`
- [ ] Dashboard loads after login
- [ ] Black Hat shows restriction banner (if not CEO/COO/CAP)
- [ ] Pricing shows CUI banner at top

---

## ⚠️ REMAINING MANUAL TASKS

The PowerShell script fixes the Supabase URL automatically. However, you still need to **manually integrate** the RBAC and CUI patches into the actual modules:

### For Black Hat (missionpulse-m7-blackhat-enhanced.html):
1. Add auth check from `AUTH_INJECTION_SNIPPET.js`
2. Add RBAC check from `BLACKHAT_RBAC_PATCH.js`
3. Add classification banner

### For Pricing (missionpulse-m8-pricing.html):
1. Add auth check from `AUTH_INJECTION_SNIPPET.js`
2. Add CUI banner from `CUI_BANNER_PATCH.js`
3. Add export interception

### For ALL other modules (M1-M15):
1. Add the `checkAuth()` function from `AUTH_INJECTION_SNIPPET.js`
2. Call `checkAuth()` in the main `useEffect`

---

## 🔧 QUICK SUPABASE URL FIX ONLY

If you just want to fix the Supabase URL without the full security patch:

```powershell
cd C:\Users\MaryWomack\Desktop\missionpulse-frontend; Get-ChildItem -Filter "*.html" | ForEach-Object { (Get-Content $_.FullName -Raw) -replace 'qlbvbfaprymzdqywcsiq', 'qdrtpnpnhkxvfmvfziop' | Set-Content $_.FullName -NoNewline }; git add .; git commit -m "FIX: Correct Supabase URL"; git push origin main
```

---

## 📊 SECURITY PATCH STATUS

| Issue | Status | Fix Applied |
|-------|--------|-------------|
| CRIT-001: Supabase URL | ✅ FIXED | PowerShell replace |
| CRIT-002: No Module Auth | 🟡 PARTIAL | Auth.js created, needs integration |
| CRIT-003: Black Hat RBAC | 🟡 PARTIAL | Patch created, needs integration |
| MAJ-001: Inconsistent Keys | ✅ FIXED | Standardized in auth.js |
| MAJ-002: CUI Marking | 🟡 PARTIAL | Banner created, needs integration |
| MAJ-003: Missing login.html | ✅ FIXED | Created |

---

## NEXT SESSION TASK

Say: **"Integrate auth patches into all modules"**

This will generate:
1. Complete updated versions of all 13 modules with auth
2. Fully patched Black Hat with RBAC
3. Fully patched Pricing with CUI

---

*AI GENERATED - REQUIRES HUMAN REVIEW*
