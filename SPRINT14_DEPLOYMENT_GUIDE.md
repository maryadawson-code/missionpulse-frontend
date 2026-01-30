# MissionPulse Sprint 14 Deployment Guide

## Sprint 14 Features Implemented

### 1. Comments System ✅
- **Comments Tab in Drawer** - Replaces Notes tab with full comments functionality
- **Real-time Updates** - Supabase subscription for instant comment sync
- **Pin/Unpin Comments** - Pinned comments stick to top of list
- **Delete with Confirmation** - Safe deletion flow
- **Character Limit** - Max 1000 characters per comment
- **Keyboard Shortcut** - Ctrl/Cmd+Enter to submit
- **localStorage Fallback** - Works offline if Supabase unavailable

### 2. Team Assignments ✅
- **Collapsible Section** - In drawer below details
- **Role Dropdown** - All 9 Shipley roles (CEO, COO, CAP, PM, SA, FIN, CON, DEL, QA)
- **Avatar Badges** - Color-coded by role with initials
- **Max 10 Assignments** - Per opportunity limit
- **Email Field** - Optional contact email

### 3. Gantt Timeline View ✅
- **Fifth View Option** - Added to view toggle
- **Horizontal Bars** - Each opportunity as a timeline bar
- **Color by Phase** - Bars colored by Shipley phase
- **Today Marker** - Red vertical line for current date
- **Zoom Controls** - Day/Week/Month views
- **Group By** - None/Agency/Priority/Phase options
- **Click to Open** - Clicking bar opens drawer
- **Tooltips** - Hover shows details

### 4. Customizable Dashboard ✅
- **8 Available Widgets**:
  - Pipeline Summary (total value, weighted value, count, avg pWin)
  - Phase Funnel (horizontal bar chart)
  - Due This Week (upcoming deadlines)
  - Win Probability Distribution (histogram)
  - Agency Breakdown (donut chart)
  - Recent Activity (last 10 activities)
  - My Assignments (user's assigned opps)
  - Stale Opportunities (7+ days no updates)
- **Configurable Layout** - Toggle widgets on/off
- **2 or 3 Column Grid** - User selectable
- **localStorage Persistence** - Layout saves between sessions

---

## Database Migration

### Step 1: Run SQL in Supabase

1. Go to https://supabase.com/dashboard
2. Select project: `djuviwarqdvlbgcfuupa`
3. Navigate to SQL Editor
4. Paste and run the contents of `sprint14-migration.sql`

This creates:
- `opportunity_comments` table
- `opportunity_assignments` table
- Required indexes
- RLS policies
- Sample data

---

## Git Deployment Commands

### CRITICAL: Always start with cd to repo directory!

Open PowerShell and run these commands ONE AT A TIME:

```powershell
cd C:\Users\MaryWomack\Desktop\missionpulse-frontend
```

```powershell
Move-Item -Path "$env:USERPROFILE\Downloads\missionpulse-v12-sprint14.html" -Destination "." -Force
```

```powershell
Move-Item -Path "$env:USERPROFILE\Downloads\sprint14-migration.sql" -Destination "." -Force
```

```powershell
git add .
```

```powershell
git commit -m "Sprint 14: Comments, Assignments, Gantt Timeline, Dashboard Widgets"
```

```powershell
git push origin main
```

---

## Testing Checklist

### Comments
- [ ] Comments tab appears in drawer
- [ ] Can add comment with Send button
- [ ] Can add comment with Ctrl+Enter
- [ ] Comments display with author and timestamp
- [ ] Can pin/unpin comments (pinned stay at top)
- [ ] Can delete comments with confirmation
- [ ] Character count shows (max 1000)
- [ ] Real-time updates work

### Assignments
- [ ] Assignments section in drawer (collapsible)
- [ ] Add Team Member button works
- [ ] Role dropdown shows all 9 Shipley roles
- [ ] Name field is required
- [ ] Email field is optional
- [ ] Avatars show with role-colored backgrounds
- [ ] Can remove assignments
- [ ] Max 10 assignments enforced

### Gantt Timeline View
- [ ] Timeline view appears in view toggle
- [ ] Bars render for opportunities with due dates
- [ ] Bars colored by Shipley phase
- [ ] Today marker (red line) visible
- [ ] Zoom Day/Week/Month works
- [ ] Group by None/Agency/Priority/Phase works
- [ ] Click bar opens drawer
- [ ] Hover shows tooltip with details

### Dashboard
- [ ] Dashboard view appears in view toggle
- [ ] All 8 widgets render correctly
- [ ] Configure button toggles widgets on/off
- [ ] 2/3 column toggle works
- [ ] Layout persists after refresh
- [ ] Refresh button on widgets works
- [ ] Widget data updates with filter changes

---

## LocalStorage Keys Used

| Key | Purpose |
|-----|---------|
| `MP_THEME` | Light/dark theme preference |
| `MP_DASHBOARD_LAYOUT` | Widget visibility and positions |
| `MP_DASHBOARD_COLUMNS` | 2 or 3 column grid |
| `MP_COMMENTS_{id}` | Fallback comment storage per opportunity |
| `MP_ASSIGNMENTS_{id}` | Fallback assignments per opportunity |

---

## Files Modified/Added

| File | Description |
|------|-------------|
| `missionpulse-v12-sprint14.html` | Main Sprint 14 implementation |
| `sprint14-migration.sql` | Database migration script |

---

## Next Sprint (Sprint 15) Suggestions

1. **Calendar View** - Monthly grid showing opportunities by due date
2. **Notification Center** - Bell icon with alerts for due dates, stale opps
3. **Command Palette** - Cmd/Ctrl+K for quick actions
4. **Bulk Operations** - Multi-select for batch phase changes
5. **Templates** - Save/apply opportunity templates

---

## Troubleshooting

### Comments not saving
- Check Supabase connection in browser console
- Verify `opportunity_comments` table exists
- Check RLS policies are enabled

### Assignments not loading
- Run migration SQL again
- Check for errors in SQL Editor output
- Verify `opportunity_assignments` table created

### Gantt not showing bars
- Ensure opportunities have `due_date` set
- Check date format is valid (YYYY-MM-DD)

### Dashboard widgets empty
- Verify opportunities are loaded
- Check browser console for errors
- Clear localStorage and refresh

---

© 2026 Mission Meets Tech | MissionPulse v12.14
