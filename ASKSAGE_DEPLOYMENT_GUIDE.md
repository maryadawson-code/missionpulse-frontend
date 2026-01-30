# AskSage Integration - Deployment Guide
## Mission Meets Tech | MissionPulse

---

## Prerequisites

✅ AskSage API key stored in Render environment variables as `ASKSAGE_API_KEY`

---

## Step 1: Add asksage_agent.py to Backend

Download `asksage_agent.py` and add it to your backend repository:

```powershell
cd C:\Users\MaryWomack\Desktop\missionpulse-frontend
Move-Item $env:USERPROFILE\Downloads\asksage_agent.py .
```

---

## Step 2: Update main.py to Include AskSage Router

Add this import and router registration to your `main.py`:

```python
# At the top with other imports
from asksage_agent import asksage_router, ASKSAGE_AGENT_CONFIG

# After other router includes
app.include_router(asksage_router)

# Update AGENT_REGISTRY to include AskSage
AGENT_REGISTRY.update(ASKSAGE_AGENT_CONFIG)
```

---

## Step 3: Update agents.py AgentId Enum

Add AskSage to the AgentId enum:

```python
class AgentId(str, Enum):
    """Available AI agents in MissionPulse."""
    CAPTURE = "capture"
    STRATEGY = "strategy"
    COMPLIANCE = "compliance"
    WRITER = "writer"
    PRICING = "pricing"
    BLACKHAT = "blackhat"
    CONTRACTS = "contracts"
    ORALS = "orals"
    ASKSAGE = "asksage"  # NEW - FedRAMP High
```

---

## Step 4: Add httpx Dependency

Update `requirements.txt`:

```
httpx>=0.25.0
```

---

## Step 5: Deploy to Render

```powershell
cd C:\Users\MaryWomack\Desktop\missionpulse-frontend
git add asksage_agent.py main.py agents.py requirements.txt
git commit -m "Add AskSage FedRAMP agent integration"
git push origin main
```

Render will auto-deploy with the new agent.

---

## Step 6: Verify Deployment

```bash
curl https://missionpulse-api.onrender.com/agents/asksage/status
```

Expected response:
```json
{
  "status": "configured",
  "model": "sage-gov",
  "security_level": "FEDRAMP_HIGH",
  "endpoints": {
    "chat": "/agents/asksage/chat",
    "analyze": "/agents/asksage/analyze"
  }
}
```

---

## API Endpoints

### Chat (Streaming)
```
POST /agents/asksage/chat
Content-Type: application/json

{
  "message": "Draft a CUI-compliant technical approach",
  "conversation_history": [],
  "stream": true
}
```

### Compliance Analysis
```
POST /agents/asksage/analyze
Content-Type: application/json

{
  "content": "Section text to analyze...",
  "analysis_type": "compliance"
}
```

### Status Check
```
GET /agents/asksage/status
```

---

## Security Notes

| Feature | Status |
|---------|--------|
| FedRAMP High | ✅ Compliant |
| IL5 Ready | ✅ Supported |
| CUI Handling | ✅ Safe |
| Data Residency | US GovCloud |
| API Key Storage | Render Env Vars |

---

## RBAC Configuration

AskSage requires `capture_manager` role or higher:
- CEO ✅
- COO ✅
- CAP ✅
- PM ✅
- Admin ✅
- Author ❌
- Partner ❌

---

## Troubleshooting

**"ASKSAGE_API_KEY not found"**
→ Verify key is set in Render Dashboard → Environment

**"API error: 401"**
→ API key may be invalid or expired - regenerate in AskSage dashboard

**"API error: 429"**
→ Rate limit hit - wait 1 minute or check usage quota

---

Mission Meets Tech © 2026
