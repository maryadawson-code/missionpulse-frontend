# MissionPulse Codebase Cleanup - Deployment Instructions
**Date:** January 30, 2026
**Classification:** CUI // SP-PROPIN

---

## Quick Deploy (Copy-Paste This)

### Step 1: Download the fixed files from this chat
Save these files to your Downloads folder:
- `supabase-client.js`
- `tokens.json`
- `token_cost_meter.py`
- `missionpulse-cleanup.ps1`

### Step 2: Run this PowerShell command

```powershell
cd C:\Users\MaryWomack\Desktop\missionpulse-frontend; Move-Item "$env:USERPROFILE\Downloads\supabase-client.js" . -Force; Move-Item "$env:USERPROFILE\Downloads\tokens.json" . -Force; Move-Item "$env:USERPROFILE\Downloads\token_cost_meter.py" . -Force; Get-ChildItem -Path . -Include "*.html","*.js","*.json","*.py" -Recurse | ForEach-Object { (Get-Content $_.FullName -Raw) -replace 'rockITdata', 'Mission Meets Tech' -replace 'https://qlbvbfaprymzdqywcsiq\.supabase\.co', 'https://qdrtpnpnhkxvfmvfziop.supabase.co' -replace 'https://djuviwarqdvlbgcfuupa\.supabase\.co', 'https://qdrtpnpnhkxvfmvfziop.supabase.co' | Set-Content $_.FullName -NoNewline }; if (Test-Path "rockit_playbook_v2.json") { Rename-Item "rockit_playbook_v2.json" "missionpulse_playbook_v2.json" -Force }; git add .; git commit -m "Codebase cleanup: MMT branding, Supabase URLs fixed"; git push origin main
```

---

## What This Fixes

| Issue | Before | After |
|-------|--------|-------|
| **Brand Name** | "rockITdata" | "Mission Meets Tech" |
| **Supabase URL #1** | `qlbvbfaprymzdqywcsiq.supabase.co` | `qdrtpnpnhkxvfmvfziop.supabase.co` |
| **Supabase URL #2** | `djuviwarqdvlbgcfuupa.supabase.co` | `qdrtpnpnhkxvfmvfziop.supabase.co` |
| **Playbook File** | `rockit_playbook_v2.json` | `missionpulse_playbook_v2.json` |
| **Tokens Config** | Old rockITdata colors | MMT Shield & Pulse v8.0 |
| **Supabase Client** | Wrong URL/Key | Correct production credentials |

---

## Files Modified

### Replaced Files (from Downloads)
- `supabase-client.js` - Fixed Supabase URL and key
- `tokens.json` - MMT brand tokens
- `token_cost_meter.py` - Fixed author line

### Find-Replace Applied To
All `*.html`, `*.js`, `*.json`, `*.py` files in the project directory

### Renamed Files
- `rockit_playbook_v2.json` → `missionpulse_playbook_v2.json`

---

## Verification After Deployment

Run these checks:

```powershell
# Check for remaining rockITdata references
Select-String -Path "*.html","*.js","*.json","*.py" -Pattern "rockITdata" -SimpleMatch

# Check for old Supabase URLs
Select-String -Path "*.html","*.js" -Pattern "qlbvbfaprymzdqywcsiq|djuviwarqdvlbgcfuupa"

# Verify correct Supabase URL is present
Select-String -Path "*.html","*.js" -Pattern "qdrtpnpnhkxvfmvfziop" | Measure-Object
```

**Expected Results:**
- No rockITdata references
- No old Supabase URLs
- 7+ files with correct Supabase URL

---

## Production URLs

After Netlify auto-deploys (2-3 minutes):

| Environment | URL |
|-------------|-----|
| Production | https://missionpulse.netlify.app |
| Dashboard | https://missionpulse.netlify.app/missionpulse-v12-PRODUCTION.html |
| API Backend | https://missionpulse-api.onrender.com |

---

## Correct Supabase Credentials

```javascript
const SUPABASE_URL = 'https://qdrtpnpnhkxvfmvfziop.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkcnRwbnBuaGt4dmZtdmZ6aW9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY3MTcyNjUsImV4cCI6MjA1MjI5MzI2NX0.DACT1xnVtJeHx5tL7_K8y1hOx9NyJE7B6UBhPqwHHx8';
```

---

*AI GENERATED - REQUIRES HUMAN REVIEW*
