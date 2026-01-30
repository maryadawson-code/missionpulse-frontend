# MissionPulse Quick Deploy Card
## January 30, 2026 - AskSage Sprint

---

## 🚀 IMMEDIATE ACTIONS (Copy-Paste Ready)

### Step 1: Deploy Frontend Files
```powershell
cd C:\Users\MaryWomack\Desktop\missionpulse-frontend; Move-Item "$env:USERPROFILE\Downloads\missionpulse-agent-hub.html" . -Force; Move-Item "$env:USERPROFILE\Downloads\render-api-client.js" . -Force; Move-Item "$env:USERPROFILE\Downloads\ai-chat-widget.js" . -Force; git add .; git commit -m "AskSage FedRAMP integration v1.3.0"; git push
```

### Step 2: Verify Backend (Wait 3 min for Render)
```powershell
curl https://missionpulse-api.onrender.com/agents/asksage/status
```

### Step 3: Test Full Integration
```powershell
curl -X POST "https://missionpulse-api.onrender.com/agents/asksage/chat" -H "Content-Type: application/json" -d "{\"message\":\"Explain CMMC 2.0 Level 2 requirements\",\"user_role\":\"ceo\"}"
```

---

## ✅ SUCCESS INDICATORS

| Check | Expected |
|-------|----------|
| Backend health | `{"status":"healthy"}` |
| AskSage status | `{"status":"ready","security_level":"FedRAMP High"}` |
| Agent Hub | 9 agents visible, FedRAMP badge on AskSage |
| Chat response | CMMC-related content returned |

---

## 🔗 PRODUCTION URLS

- **Dashboard**: https://missionpulse.netlify.app
- **Agent Hub**: https://missionpulse.netlify.app/missionpulse-agent-hub.html
- **Backend**: https://missionpulse-api.onrender.com
- **API Docs**: https://missionpulse-api.onrender.com/docs

---

## 📁 FILES IN THIS PACKAGE

| File | Purpose |
|------|---------|
| `missionpulse-agent-hub.html` | Updated Agent Hub with 9 agents |
| `render-api-client.js` | API client v1.3.0 with AskSage |
| `ai-chat-widget.js` | Chat widget v1.3.0 with FedRAMP |
| `test-asksage.ps1` | PowerShell verification script |
| `MISSIONPULSE_ASKSAGE_HANDOFF.md` | Full handoff documentation |
| `QUICK_DEPLOY.md` | This file |

---

## 🆘 TROUBLESHOOTING

**Render not responding?**
- Cold start takes 10-15 seconds
- Wait 3 minutes after push for deploy
- Check Render dashboard for build errors

**AskSage returning errors?**
- Verify `ASKSAGE_API_KEY` in Render env vars
- Check API quota/rate limits
- Confirm user_role is `ceo`, `coo`, `cap`, `pm`, or `admin`

**Frontend not updating?**
- Hard refresh: Ctrl+Shift+R
- Check Netlify deploy log
- Verify git push succeeded

---

*Mission Meets Tech | AI GENERATED - REQUIRES HUMAN REVIEW*
