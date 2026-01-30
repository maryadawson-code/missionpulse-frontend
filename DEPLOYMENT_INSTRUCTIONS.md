# MissionPulse API Integration - Deployment Instructions

## Summary

This package adds **Render API integration** to all 21 HTML modules, connecting your frontend to the backend at `https://missionpulse-api.onrender.com`.

## What's Included

### Updated Files (21 HTML modules)
| File | Purpose |
|------|---------|
| `index.html` | Main entry/demo page |
| `index__13_.html` | Legacy demo |
| `index__14_.html` | Legacy demo |
| `index__15_.html` | Legacy demo |
| `missionpulse-m1-enhanced.html` | Pipeline Intelligence |
| `missionpulse-m2-warroom-enhanced.html` | War Room |
| `missionpulse-m3-swimlane-board.html` | Swimlane/Kanban Board |
| `missionpulse-m5-contracts.html` | Contract Scanner |
| `missionpulse-m5-contracts-enhanced.html` | Contract Scanner Enhanced |
| `missionpulse-m6-iron-dome.html` | Iron Dome Compliance |
| `missionpulse-m7-blackhat-enhanced.html` | Black Hat Intel |
| `missionpulse-m8-pricing.html` | LCAT Pricing Engine |
| `missionpulse-m9-hitl-enhanced.html` | Human-in-the-Loop Queue |
| `missionpulse-m11-frenemy-protocol.html` | Partner Access Control |
| `missionpulse-m13-launch-roi.html` | Launch & ROI |
| `missionpulse-m14-post-award.html` | Post-Award Transition |
| `missionpulse-m15-lessons-playbook.html` | Lessons/Playbook |
| `missionpulse-task16-rbac.html` | RBAC Dashboard |
| `missionpulse-task17a-foundation.html` | Foundation Components |
| `missionpulse-v12-task17-complete.html` | **Main Unified Dashboard** |
| `missionpulse-v12-ultimate-part1.html` | Ultimate Part 1 |

### New JavaScript Files (2)
| File | Purpose |
|------|---------|
| `supabase-client.js` | Database client (already existed) |
| `render-api-client.js` | **NEW** - Render API client |

## Changes Made

Every HTML file now includes these script tags after Tailwind:

```html
<script src="https://cdn.tailwindcss.com"></script>
<!-- Database & API Clients -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="supabase-client.js"></script>
<script src="render-api-client.js"></script>
```

## Deployment Steps

### Step 1: Extract the ZIP
Download `missionpulse-api-integration.zip` and extract it.

### Step 2: Replace Files in Your Repo
PowerShell commands:

```powershell
cd C:\Users\MaryWomack\Desktop\missionpulse-frontend
```

```powershell
# Extract the zip to your repo (overwrites existing files)
Expand-Archive -Path "$env:USERPROFILE\Downloads\missionpulse-api-integration.zip" -DestinationPath . -Force
```

```powershell
# Move files from subfolder to root
Move-Item -Path ".\updated-modules\*" -Destination . -Force
```

```powershell
# Remove the empty folder
Remove-Item -Path ".\updated-modules" -Force
```

### Step 3: Commit and Deploy

```powershell
git add .
```

```powershell
git commit -m "Add Render API integration to all modules"
```

```powershell
git push
```

Netlify will auto-deploy within ~60 seconds.

## Verification

After deployment, open browser console on any page and run:

```javascript
// Check API connection
MissionPulseAPI.checkConnection().then(ok => console.log('API Connected:', ok));

// List available agents
MissionPulseAPI.agents.list().then(r => console.log('Agents:', r.data));

// Get dashboard summary
MissionPulseAPI.dashboard.summary().then(r => console.log('Dashboard:', r.data));
```

## API Endpoints Now Available

| Namespace | Methods |
|-----------|---------|
| `MissionPulseAPI.system` | `health()`, `version()`, `contextStatus()` |
| `MissionPulseAPI.agents` | `list()`, `get(id)`, `chat(id, msg)` |
| `MissionPulseAPI.dashboard` | `summary()`, `pipeline()`, `activities()`, `workload()` |
| `MissionPulseAPI.trainingData` | Company profile, win themes, competitors, LCATs, past perf, partners |

## Architecture After Deployment

```
┌─────────────────────────────────────────────────────────────┐
│                    USER BROWSER                              │
├─────────────────────────────────────────────────────────────┤
│  supabase-client.js          render-api-client.js           │
│  (MissionPulse.*)            (MissionPulseAPI.*)            │
└───────────┬───────────────────────────┬─────────────────────┘
            │                           │
            ▼                           ▼
┌───────────────────────┐   ┌─────────────────────────────────┐
│      SUPABASE         │   │         RENDER                   │
│  djuviwarqdvlbgcfuupa │   │  missionpulse-api.onrender.com  │
│  - opportunities      │   │  - 8 AI Agents                  │
│  - users              │   │  - Dashboard API                │
│  - real-time          │   │  - Training Data CRUD           │
└───────────────────────┘   └─────────────────────────────────┘
```

---

**Generated:** January 27, 2026
**AI GENERATED - REQUIRES HUMAN REVIEW**
