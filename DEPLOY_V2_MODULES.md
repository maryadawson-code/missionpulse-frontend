# ============================================================
# MissionPulse V2 Deployment Package
# FILE: DEPLOY_V2_MODULES.md
# DATE: January 30, 2026
# ============================================================

## 📦 PACKAGE CONTENTS

This deployment package contains 10 production-ready files:

### HTML Modules (9 files)
1. `missionpulse-unified-shell.html` - SPA Navigation Shell with MODULE_REGISTRY
2. `missionpulse-orals-v2.html` - Orals Prep Studio
3. `missionpulse-winthemes-v2.html` - Win Themes Builder
4. `missionpulse-compliance-v2.html` - Compliance Matrix (L/M Tracker)
5. `missionpulse-irondome-v2.html` - Iron Dome Technical Writer
6. `missionpulse-teaming-v2.html` - Teaming Partners Management
7. `missionpulse-frenemy-v2.html` - Frenemy Data Masking (RBAC)
8. `missionpulse-launchroi-v2.html` - Launch ROI Calculator
9. `missionpulse-postaward-v2.html` - Post-Award Transition Tracker

### SQL Migration (1 file)
10. `missionpulse-v2-migrations.sql` - Database schema for 9 new tables

---

## 🚀 SINGLE-COMMAND DEPLOYMENT

### Step 1: Move Files to Repository
Run this SINGLE command in PowerShell (copy entire block):

```powershell
cd C:\Users\MaryWomack\Desktop\missionpulse-frontend; Move-Item -Force "$env:USERPROFILE\Downloads\missionpulse-unified-shell.html" .; Move-Item -Force "$env:USERPROFILE\Downloads\missionpulse-orals-v2.html" .; Move-Item -Force "$env:USERPROFILE\Downloads\missionpulse-winthemes-v2.html" .; Move-Item -Force "$env:USERPROFILE\Downloads\missionpulse-compliance-v2.html" .; Move-Item -Force "$env:USERPROFILE\Downloads\missionpulse-irondome-v2.html" .; Move-Item -Force "$env:USERPROFILE\Downloads\missionpulse-teaming-v2.html" .; Move-Item -Force "$env:USERPROFILE\Downloads\missionpulse-frenemy-v2.html" .; Move-Item -Force "$env:USERPROFILE\Downloads\missionpulse-launchroi-v2.html" .; Move-Item -Force "$env:USERPROFILE\Downloads\missionpulse-postaward-v2.html" .; git add -A; git commit -m "Deploy V2 modules: orals, winthemes, compliance, irondome, teaming, frenemy, launch, postaward + unified shell"; git push origin main
```

### Step 2: Run SQL Migration
1. Open Supabase Dashboard: https://supabase.com/dashboard/project/qdrtpnpnhkxvfmvfziop
2. Go to SQL Editor
3. Paste contents of `missionpulse-v2-migrations.sql`
4. Click "Run"

---

## ✅ VERIFICATION CHECKLIST

After deployment, verify at https://missionpulse.netlify.app:

- [ ] Unified shell loads with sidebar navigation
- [ ] All 9 V2 modules accessible via sidebar
- [ ] Supabase connection indicator shows "Live"
- [ ] RBAC restricts Black Hat to CEO/COO/CAP roles
- [ ] CUI marking appears on Pricing module
- [ ] Frenemy masking preview works correctly

---

## 📊 ARCHITECTURE SNAPSHOT

### Files Modified
- NEW: 9 HTML modules
- NEW: 1 SQL migration file

### Database Schemas Created
- `win_themes` - Discriminator management
- `orals_decks` - Presentation slides
- `compliance_items` - L/M requirements
- `teaming_partners` - Partner NDAs
- `proposal_drafts` - Iron Dome content
- `rfp_requirements` - Shredder output
- `lessons_learned` - Knowledge capture
- `ai_approvals` - HITL queue
- `audit_logs` - CMMC trail

### Security Audit
- ✓ All Supabase keys are anon (public safe)
- ✓ RLS enabled on all new tables
- ✓ RBAC enforced via invisible rendering
- ✓ CUI marking on sensitive modules
- ✓ Partner access controls implemented

### Cost Meter
- Estimated token impact: ~500 tokens/module load
- Total package: ~4,500 tokens for full navigation

---

## 🔧 TROUBLESHOOTING

### Module doesn't load
1. Check browser console for errors
2. Verify Supabase URL: `qdrtpnpnhkxvfmvfziop.supabase.co`
3. Check network for blocked domains

### SQL migration fails
1. Ensure you're in the correct project
2. Run tables individually if batch fails
3. Check for existing policies with same names

### Git push fails
1. Run `git pull origin main` first
2. Resolve any conflicts
3. Re-run push command

---

## 📋 MODULE REGISTRY REFERENCE

The unified shell includes these module definitions:

| Module | File | RBAC | Group |
|--------|------|------|-------|
| Command Center | dashboard-v12.html | ALL | command |
| Pipeline | pipeline-v2.html | ALL | command |
| War Room | warroom-v2.html | CEO,COO,CAP,PM | command |
| Kanban Board | swimlane-v2.html | ALL | command |
| RFP Shredder | rfpshredder-v2.html | CEO,COO,CAP,PM,SA | capture |
| Black Hat | blackhat-v2.html | CEO,COO,CAP,Admin | capture |
| Win Themes | winthemes-v2.html | CEO,COO,CAP,SA,PM | capture |
| Frenemy View | frenemy-v2.html | CEO,COO,CAP | capture |
| Compliance | compliance-v2.html | CEO,COO,CAP,PM,CON,QA | compliance |
| Contracts | contracts-v2.html | CEO,COO,CON,FIN | compliance |
| Iron Dome | irondome-v2.html | CEO,COO,CAP,SA,QA | compliance |
| Pricing | pricing-v2.html | CEO,COO,FIN,PM | pricing (CUI) |
| Teaming | teaming-v2.html | CEO,COO,CAP,PM,DEL | execution |
| HITL Queue | hitl-v2.html | CEO,COO,CAP,PM,QA | execution |
| Orals Studio | orals-v2.html | CEO,COO,CAP,PM,SA | execution |
| Lessons | lessons-v2.html | ALL | intelligence |
| Reports | reports-v2.html | CEO,COO,CAP,FIN | intelligence |
| Launch ROI | launchroi-v2.html | CEO,COO,CAP,PM | lifecycle |
| Post-Award | postaward-v2.html | CEO,COO,PM,DEL | lifecycle |
| Settings | settings-v2.html | ALL | admin |
| Audit Log | audit-v2.html | CEO,COO,Admin,QA | admin |
| Health Check | health-check.html | Admin | admin |

---

**AI GENERATED - REQUIRES HUMAN REVIEW**
© 2026 Mission Meets Tech
