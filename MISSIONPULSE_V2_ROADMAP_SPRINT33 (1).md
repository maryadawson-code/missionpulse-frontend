# MissionPulse V2 Roadmap - Updated January 30, 2026
## Sprint 33: Intelligent CUI-Aware Model Router

---

## 🎯 NEW FEATURE: Automatic CUI Detection & Model Routing

### Overview
MissionPulse now automatically detects Controlled Unclassified Information (CUI) in user prompts and routes to the appropriate AI backend:

| Content Type | Detection | Routing | Model Selection |
|--------------|-----------|---------|-----------------|
| **CUI Data** | Pricing, competitive intel, clearances, proprietary | **AskSage** | FedRAMP High (AWS Gov Claude, Azure Gov GPT, Gemini) |
| **Non-CUI** | General queries, public info, help requests | **Anthropic** | Claude Sonnet via MissionPulse API |

### CUI Detection Categories

```
┌─────────────────────────────────────────────────────────────────┐
│ EXPLICIT MARKERS                                                │
│ • CUI, FOUO, PROPIN, Source Selection, Competition Sensitive   │
├─────────────────────────────────────────────────────────────────┤
│ PRICING & FINANCIAL (Always CUI)                               │
│ • Labor rates, indirect rates, G&A, overhead, fringe           │
│ • BOE, cost volume, profit margins, fee percentages            │
│ • Dollar amounts >$100K, contract pricing                      │
├─────────────────────────────────────────────────────────────────┤
│ COMPETITIVE INTELLIGENCE (Always Restricted)                    │
│ • Black Hat analysis, competitor weaknesses                    │
│ • Win strategy, discriminators, price to win (PTW)             │
│ • Teaming strategy, ghost teams                                │
├─────────────────────────────────────────────────────────────────┤
│ PERSONNEL SENSITIVE                                            │
│ • SSN patterns, security clearances (TS/SCI, Secret)           │
│ • Salary/compensation, key personnel, resumes                  │
├─────────────────────────────────────────────────────────────────┤
│ TECHNICAL PROPRIETARY                                          │
│ • Proprietary solutions, trade secrets, patent pending         │
│ • Technical approach, solution architecture                    │
└─────────────────────────────────────────────────────────────────┘
```

### AskSage Model Catalog (FedRAMP High)

| Model | Context Window | Best For | Cost Tier |
|-------|----------------|----------|-----------|
| **AWS Gov Bedrock Claude 4.5 Sonnet** | 200K | Code, Complex reasoning | Medium |
| **Google Gemini 2.5 Pro** | 1M | Large documents | Medium |
| **Google Gemini 2.5 Flash** | 1M | Quick answers, Large docs | Low |
| **Azure OpenAI GPT-5** | 272K | Complex reasoning | High |
| **Azure OpenAI GPT-4.1** | 1M | Large docs, Code | Medium |
| **AWS Gov Nova Lite** | 300K | Quick Q&A (budget) | Very Low |
| **Azure GPT-5-nano** | 272K | Quick Q&A (budget) | Very Low |
| **Google Imagen 4** | - | Image generation | Medium |
| **Azure Gov GPT-4o** | 128K | General (IL5 capable) | Medium |

### Task-Based Model Selection

```
User Prompt → Task Detection → Optimal Model

"Analyze this 500-page RFP"
  └── largeDocument → Gemini 2.5 Pro (1M context)

"Write Python code for compliance checker"  
  └── codeGeneration → AWS Gov Claude 4.5 Sonnet

"What is FAR 15.304?"
  └── quickAnswer → Nova Lite (budget option)

"Create a diagram of our solution architecture"
  └── imageGeneration → Google Imagen 4

"Develop win strategy against Booz Allen"
  └── complexReasoning + CUI → AWS Gov Claude 4.5 Sonnet
```

---

## 📋 UPDATED V2 SPRINT ROADMAP

### ✅ COMPLETED SPRINTS (1-47)
| Sprint | Feature | Status |
|--------|---------|--------|
| 1-13 | Foundation, Core Modules | ✅ |
| 14-21 | Auth, Contracts, Black Hat, Pricing, HITL, Post-Award | ✅ |
| 22-47 | Various V2 upgrades, Agent Hub, Database schema | ✅ |

### 🔄 IN PROGRESS

#### Sprint 48: AskSage Integration Verification
- [ ] Verify AskSage agent endpoint works E2E
- [ ] Test FedRAMP High model routing
- [ ] Configure AskSage API credentials
- [ ] Document AskSage token consumption

#### Sprint 33 (NEW): Intelligent Model Router
- [x] CUI Detection Engine (`model-router.js`)
- [x] Task-based model selection algorithm
- [x] AskSage model catalog with cost tiers
- [ ] Agent Hub integration with routing indicator
- [ ] Pricing module auto-CUI routing
- [ ] Black Hat module auto-CUI routing
- [ ] Admin dashboard for routing analytics

### 📅 UPCOMING SPRINTS

#### Sprint 14A: Request Access Form (HIGH PRIORITY)
- [ ] Public lead capture page
- [ ] HubSpot integration for form submission
- [ ] Email notification to sales team
- [ ] CAPTCHA/bot protection

#### Sprint 20: Orals Studio V2
- [ ] Supabase-wired orals_decks table
- [ ] Q&A bank with AI-generated responses
- [ ] Mock evaluation scoring
- [ ] Timer/practice mode

#### Sprint 23: Multi-Tenant Isolation (CRITICAL)
- [ ] Company-scoped RLS policies
- [ ] Zero data bleed verification
- [ ] Tenant admin dashboard
- [ ] Data export per tenant

#### Sprint 28: Integration Hub
- [ ] Microsoft 365 SSO
- [ ] AskSage deep integration ✅ (Started)
- [ ] SAM.gov opportunity sync
- [ ] SharePoint document bridge

#### Sprint 29: Solo Proposal Manager (HIGH VALUE)
- [ ] Single-user workflow mode
- [ ] Simplified capture process
- [ ] Personal knowledge base
- [ ] Quick-submit templates

#### Sprint 30: Company Knowledge Base (CRITICAL)
- [ ] RAG system for company docs
- [ ] Past performance database
- [ ] Reusable content library
- [ ] AI-powered content suggestions

#### Sprint 31: AI Visual Generator
- [ ] Solution architecture diagrams
- [ ] Process flow generation
- [ ] Org chart automation
- [ ] Integration with Google Imagen 4

#### Sprint 32: Feature Suggestions Portal
- [ ] In-app feedback submission
- [ ] Upvoting system
- [ ] Roadmap transparency
- [ ] Beta feature flags

---

## 🏗️ ARCHITECTURE: Intelligent Routing Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     MISSIONPULSE FRONTEND                       │
│                   (Agent Hub / Chat Widget)                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     MODEL ROUTER (model-router.js)              │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 1. CUI DETECTION                                        │    │
│  │    - Pattern matching (pricing, competitive, personnel) │    │
│  │    - Module context checking                            │    │
│  │    - Confidence scoring                                 │    │
│  ├─────────────────────────────────────────────────────────┤    │
│  │ 2. TASK DETECTION                                       │    │
│  │    - Large document, code, image, quick Q&A, reasoning  │    │
│  ├─────────────────────────────────────────────────────────┤    │
│  │ 3. MODEL SELECTION                                      │    │
│  │    - Match task to optimal model                        │    │
│  │    - Consider cost tier preference                      │    │
│  │    - Check context window requirements                  │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
              ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────┐
│      ASKSAGE API        │     │   ANTHROPIC (via Render)│
│   (FedRAMP High)        │     │   (Standard Claude)     │
│                         │     │                         │
│ Models:                 │     │ Agents:                 │
│ • AWS Gov Claude 4.5    │     │ • Capture               │
│ • Azure Gov GPT-5       │     │ • Strategy              │
│ • Gemini 2.5 Pro        │     │ • Writer                │
│ • Imagen 4              │     │ • Compliance            │
│ • Nova Lite             │     │ • Contracts             │
│                         │     │ • Orals                 │
│ Datasets:               │     │                         │
│ • FAR/DFARS             │     │                         │
│ • DoD Policies          │     │                         │
└─────────────────────────┘     └─────────────────────────┘
              │                               │
              └───────────────┬───────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    RESPONSE HANDLER                             │
│  • CUI marking on responses (if applicable)                     │
│  • Token usage tracking                                         │
│  • Audit logging                                                │
│  • Response formatting                                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 💰 COST OPTIMIZATION MATRIX

| Scenario | Model | Est. Cost/1K tokens | Notes |
|----------|-------|---------------------|-------|
| Quick FAQ (CUI) | Nova Lite | $0.002 | Budget option |
| Quick FAQ (Non-CUI) | Anthropic Claude | $0.003 | Standard |
| Large RFP Analysis | Gemini 2.5 Flash | $0.005 | 1M context |
| Complex Strategy (CUI) | AWS Gov Claude 4.5 | $0.015 | Best quality |
| Code Generation (CUI) | AWS Gov Claude 4.5 | $0.015 | Optimal |
| Image Generation | Imagen 4 | ~2,600 tokens/image | FedRAMP High |

---

## 🔐 SECURITY CONSIDERATIONS

### CUI Handling Requirements
1. **Data at Rest**: AskSage FedRAMP High models only
2. **Data in Transit**: TLS 1.3 required
3. **Response Marking**: Auto-append "CUI // SP-PROPIN" to CUI responses
4. **Audit Trail**: Log all CUI model invocations
5. **Access Control**: Only authorized roles access CUI-generating features

### Module-Level CUI Defaults
| Module | Default CUI Status | Reasoning |
|--------|-------------------|-----------|
| Pricing Engine | **ALWAYS CUI** | Contains rates, BOE |
| Black Hat | **ALWAYS CUI** | Competitive intel |
| Win Themes | Detect per prompt | May contain strategy |
| Contracts | Detect per prompt | FAR/DFARS is public |
| Compliance | Detect per prompt | Matrix may be sensitive |
| Orals | Detect per prompt | Q&A may reveal strategy |
| Pipeline | Detect per prompt | Opportunity values |

---

## 📊 SUCCESS METRICS

### Sprint 33 KPIs
- [ ] 95%+ CUI detection accuracy
- [ ] <100ms routing decision latency
- [ ] 100% FedRAMP High compliance for CUI data
- [ ] 20% cost reduction via intelligent model selection
- [ ] Zero CUI data sent to non-compliant endpoints

---

## 🚀 DEPLOYMENT CHECKLIST

### Sprint 33 Deployment
1. [ ] Deploy `model-router.js` to frontend
2. [ ] Update Agent Hub with routing indicator
3. [ ] Configure AskSage API credentials (secure storage)
4. [ ] Test CUI detection with sample prompts
5. [ ] Verify audit logging captures routing decisions
6. [ ] Update admin dashboard with routing analytics
7. [ ] Document for users which models handle their data

---

*Updated: January 30, 2026*
*Classification: CUI // SP-PROPIN*
*AI GENERATED - REQUIRES HUMAN REVIEW*
