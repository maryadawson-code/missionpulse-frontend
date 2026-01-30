# MissionPulse Phase 25: API Integration

## 📋 Overview

Phase 25 connects the frontend dashboard to the live FastAPI backend, replacing demo data with real API calls.

### Deliverables

| File | Purpose | Destination |
|------|---------|-------------|
| `dashboard_routes.py` | New API endpoints for dashboard | `backend/app/routes/` |
| `main_updated.py` | Updated main.py with CORS fix | `backend/app/api/` |
| `missionpulse-api-client.js` | Frontend API client | `frontend/js/` |

### New API Endpoints

```
GET /api/dashboard/summary    → KPI strip (pipeline count, value, pWin, deadlines)
GET /api/dashboard/pipeline   → Opportunities by Shipley stage
GET /api/dashboard/activities → Recent activity feed (filterable)
GET /api/dashboard/workload   → Team assignments & capacity
GET /api/dashboard/health     → Dashboard API health check
```

### CORS Fix

**Before:** `https://missionpulse.netlify.app` (wrong)  
**After:** `https://missionpulse-frontend.netlify.app` (correct)

---

## 🚀 Deployment Instructions

### Step 1: Deploy Backend (missionpulse-v1)

Open PowerShell and run these commands ONE AT A TIME:

```powershell
cd C:\Users\MaryWomack\Desktop\missionpulse-v1
```

```powershell
dir
```

Now copy the downloaded files to the correct locations:

```powershell
Move-Item -Path "$env:USERPROFILE\Downloads\dashboard_routes.py" -Destination ".\backend\app\routes\dashboard.py" -Force
```

```powershell
Copy-Item -Path ".\backend\app\api\main.py" -Destination ".\backend\app\api\main_backup.py"
```

```powershell
Move-Item -Path "$env:USERPROFILE\Downloads\main_updated.py" -Destination ".\backend\app\api\main.py" -Force
```

Update the routes `__init__.py` to include dashboard routes:

```powershell
Add-Content -Path ".\backend\app\routes\__init__.py" -Value "`nfrom .dashboard import router as dashboard_router"
```

**Then in GitHub Desktop:**
1. Open the `missionpulse-v1` repository
2. Review changes (3 files modified/added)
3. Commit message: `feat(P25): Add dashboard API routes + CORS fix`
4. Click **Push origin**

Wait 2-3 minutes for Render to redeploy.

**Test the deployment:**
```
https://missionpulse-api.onrender.com/api/dashboard/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "missionpulse-dashboard-api",
  "version": "1.0.0"
}
```

---

### Step 2: Deploy Frontend (missionpulse-frontend)

Open PowerShell:

```powershell
cd C:\Users\MaryWomack\Desktop\missionpulse-frontend
```

Create the js folder if it doesn't exist:

```powershell
New-Item -ItemType Directory -Path ".\js" -Force
```

Move the API client:

```powershell
Move-Item -Path "$env:USERPROFILE\Downloads\missionpulse-api-client.js" -Destination ".\js\missionpulse-api-client.js" -Force
```

**Then in GitHub Desktop:**
1. Open the `missionpulse-frontend` repository
2. Review changes (1 new file)
3. Commit message: `feat(P25): Add API client module`
4. Click **Push origin**

Wait 1-2 minutes for Netlify to redeploy.

---

### Step 3: Update Dashboard HTML

The dashboard needs a small update to use the API client. Add this script tag to `missionpulse-dashboard.html` just before the closing `</body>` tag:

```html
<!-- MissionPulse API Client -->
<script src="./js/missionpulse-api-client.js"></script>
<script>
  // Initialize API connection
  document.addEventListener('DOMContentLoaded', async () => {
    const health = await MissionPulseAPI.checkHealth();
    console.log('API Status:', health.success ? '✅ Connected' : '❌ Using demo data');
    
    if (health.success) {
      // API is live - fetch real data
      const summary = await MissionPulseAPI.getDashboardSummary();
      const pipeline = await MissionPulseAPI.getPipeline();
      const activities = await MissionPulseAPI.getActivities();
      const workload = await MissionPulseAPI.getWorkload();
      
      // Update dashboard with live data
      console.log('Dashboard data loaded:', { summary, pipeline, activities, workload });
      
      // Show live indicator
      document.querySelector('[data-api-status]')?.classList.add('live');
    }
  });
</script>
```

---

## ✅ Verification Checklist

After deployment, verify each endpoint:

### Backend API Tests

| Test | URL | Expected |
|------|-----|----------|
| Health | https://missionpulse-api.onrender.com/api/health | `status: healthy` |
| Dashboard Health | https://missionpulse-api.onrender.com/api/dashboard/health | `status: healthy` |
| Summary | https://missionpulse-api.onrender.com/api/dashboard/summary | KPI data |
| Pipeline | https://missionpulse-api.onrender.com/api/dashboard/pipeline | 7 stages |
| Activities | https://missionpulse-api.onrender.com/api/dashboard/activities | Activity list |
| Workload | https://missionpulse-api.onrender.com/api/dashboard/workload | Team data |

### Frontend Tests

1. Open https://missionpulse-frontend.netlify.app/missionpulse-dashboard.html
2. Open browser DevTools (F12) → Console
3. Should see: `API Status: ✅ Connected`
4. If API unavailable: `API Status: ❌ Using demo data` (graceful fallback)

### CORS Test

In browser console on the dashboard page:
```javascript
fetch('https://missionpulse-api.onrender.com/api/health')
  .then(r => r.json())
  .then(console.log)
```

Should return health data without CORS errors.

---

## 🔧 Troubleshooting

### "Connection refused" or timeout errors

Render free tier instances sleep after 15 minutes of inactivity. First request takes 30-60 seconds to wake.

**Solution:** The API client has a 45-second timeout and will retry twice before falling back to demo data.

### CORS errors in browser

If you see `Access-Control-Allow-Origin` errors:

1. Verify the main.py CORS config includes `https://missionpulse-frontend.netlify.app`
2. Check Render logs for any startup errors
3. Clear browser cache and retry

### API returns demo data even when online

Check browser console for specific error messages. Common causes:
- API still starting up (wait 30-60 seconds)
- Network connectivity issues
- Invalid endpoint paths

---

## 📁 File Structure After Phase 25

```
missionpulse-v1/backend/
├── app/
│   ├── api/
│   │   └── main.py          # UPDATED: CORS + dashboard routes
│   └── routes/
│       ├── __init__.py      # UPDATED: exports dashboard_router
│       ├── agents.py        # Existing
│       └── dashboard.py     # NEW: dashboard endpoints
│
missionpulse-frontend/
├── js/
│   └── missionpulse-api-client.js  # NEW: API client
├── missionpulse-dashboard.html     # UPDATE: add script tag
└── ...other modules
```

---

## 🎯 Next Steps: Phase 26

Phase 26 will focus on **Full Dashboard Integration**:
- Replace all demo data in dashboard with live API calls
- Add loading spinners and error states
- Real-time activity feed updates (polling)
- Optimistic UI updates

---

**Mission Meets Tech**  
*Mission. Technology. Transformation.*

*AI GENERATED - REQUIRES HUMAN REVIEW*
