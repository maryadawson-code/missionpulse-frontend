# MissionPulse V2 Release - Lessons Learned

**Date:** January 28, 2025  
**Release:** v2-development → main  
**Incident:** Login "Invalid API key" error + Missing modules in production  

---

## Executive Summary

The V2 production merge introduced 21 new modules but had critical issues:
1. Login page broken due to wrong Supabase credentials
2. Three modules (m7, m8, m25) missing from production
3. Navigation references modules that don't exist

---

## Issues Discovered

### Issue 1: Invalid API Key on Login
**Symptom:** Login page shows "Invalid API key" error  
**Root Cause:** `supabase-client.js` contained old Supabase project credentials  
- Old (wrong): `djuviwarqdvlbgcfuupa.supabase.co`
- Correct: `qdrtpnpnhkxvfmvfziop.supabase.co`

**How it happened:** The supabase-client.js was updated in v2-development sprints but contained credentials from an older/different Supabase project that no longer exists or has different API keys.

**Impact:** All users unable to login to production

### Issue 2: Missing Module Files
**Symptom:** 404 errors when clicking navigation links  
**Root Cause:** Files never downloaded before Move-Item commands ran

| Module | Sprint | What Happened |
|--------|--------|---------------|
| missionpulse-m7-blackhat-live.html | 17 | Move-Item failed - file not in Downloads |
| missionpulse-m8-pricing-live.html | 18 | Move-Item failed - file not in Downloads |
| missionpulse-m25-executive-live.html | 36 | Move-Item failed - file not in Downloads |

**Impact:** Navigation shows links to non-existent pages

### Issue 3: SQL Commands in PowerShell
**Symptom:** PowerShell errors like "UPDATE: The term 'UPDATE' is not recognized"  
**Root Cause:** SQL statements copied into PowerShell instead of Supabase dashboard  
**Impact:** Database tables may not have been created/updated properly

### Issue 4: No Pre-Merge Testing
**Symptom:** Issues discovered after production deploy  
**Root Cause:** No systematic verification of staging URL before merge  
**Impact:** Production users encountered broken functionality immediately

---

## Pre-Production Checklist (NEW REQUIREMENT)

### Before ANY merge to main:

#### 1. File Verification
```powershell
# List all HTML files in repo
cd C:\Users\MaryWomack\Desktop\missionpulse-frontend
git checkout v2-development
dir *.html | Select-Object Name
dir *.js | Select-Object Name
```

#### 2. Navigation Link Audit
- [ ] Open missionpulse-nav.js
- [ ] For EACH href in modules array, verify file exists in repo
- [ ] Remove or comment out any missing module links

#### 3. Supabase Credential Check
```powershell
# Search for Supabase URLs in all files
Select-String -Path "*.js" -Pattern "supabase.co" | Select-Object Filename, Line
```
Expected: ALL files should reference `qdrtpnpnhkxvfmvfziop.supabase.co`

#### 4. Staging Verification
- [ ] Visit: https://v2-development--missionpulse-io.netlify.app
- [ ] Test login with maryadawson@gmail.com
- [ ] Verify green "Live Database" indicator
- [ ] Click through ALL navigation links
- [ ] Test at least one CRUD operation

#### 5. Merge Only After All Checks Pass
```powershell
# Only run after checklist complete
git checkout main
git merge v2-development --no-ff -m "V2 Release - All checks passed"
git push origin main
```

---

## Corrective Actions Required

### Immediate (Before next user session):

1. **Fix supabase-client.js** - Replace with correct credentials
2. **Deploy missing modules** - m7, m8, m25 need to be created and deployed
3. **Update navigation** - Remove links to missing modules OR deploy the modules

### Process Improvements:

1. **Download verification** - Always run `dir $env:USERPROFILE\Downloads\missionpulse*` before Move-Item
2. **SQL separation** - Keep SQL in separate .sql files, run in Supabase dashboard only
3. **Staging gate** - No merge without staging URL verification
4. **Credential audit** - Check all JS files for correct Supabase URL before merge

---

## PowerShell Best Practices

### DO:
```powershell
# Check Downloads folder first
dir $env:USERPROFILE\Downloads\missionpulse*

# Then move files
cd C:\Users\MaryWomack\Desktop\missionpulse-frontend
Move-Item -Path "$env:USERPROFILE\Downloads\filename.html" -Destination "." -Force

# Verify file exists
dir filename.html
```

### DON'T:
- Don't paste SQL into PowerShell
- Don't paste markdown (###, ```, numbered lists) into PowerShell
- Don't chain commands without verifying previous step succeeded
- Don't merge without testing staging

---

## Files Status After V2 Merge

### ✅ Deployed Successfully (21 files):
- missionpulse-m5-contracts-live.html
- missionpulse-m6-compliance-live.html
- missionpulse-m9-hitl-live.html
- missionpulse-m10-writer-live.html
- missionpulse-m11-orals-live.html
- missionpulse-m12-winthemes-live.html
- missionpulse-m13-lessons-live.html
- missionpulse-m14-risks-live.html
- missionpulse-m15-teams-live.html
- missionpulse-m16-compliance-checklist-live.html
- missionpulse-m17-pastperformance-live.html
- missionpulse-m18-teaming-live.html
- missionpulse-m19-colorteam-live.html
- missionpulse-m20-amendments-live.html
- missionpulse-m21-outline-live.html
- missionpulse-m22-graphics-live.html
- missionpulse-m23-questions-live.html
- missionpulse-m24-calendar-live.html
- missionpulse-m26-reports-live.html
- missionpulse-module-index.html
- missionpulse-nav.js

### ❌ Missing (3 files):
- missionpulse-m7-blackhat-live.html (Black Hat Analysis)
- missionpulse-m8-pricing-live.html (Pricing Engine)
- missionpulse-m25-executive-live.html (Executive Dashboard v2)

### ⚠️ Needs Fix (1 file):
- supabase-client.js (wrong credentials)

---

## Action Items

| Priority | Action | Owner | Status |
|----------|--------|-------|--------|
| P0 | Fix supabase-client.js credentials | Dev | ⏳ Pending |
| P0 | Deploy m7-blackhat-live.html | Dev | ⏳ Pending |
| P0 | Deploy m8-pricing-live.html | Dev | ⏳ Pending |
| P0 | Deploy m25-executive-live.html | Dev | ⏳ Pending |
| P1 | Update navigation to match deployed files | Dev | ⏳ Pending |
| P2 | Create pre-merge checklist as GitHub Action | Dev | Future |

---

*Document created: January 28, 2025*  
*AI GENERATED CONTENT - REQUIRES HUMAN REVIEW*  
*© 2025 Mission Meets Tech*
