# 🚀 rockITdata AMANDA™ AI Portal v7.1
## Ultra-Delight Edition

> **"Driven by Innovation, Built on Trust"**

A production-ready AI-powered proposal development portal for federal contracting, built with Streamlit and Claude.

---

## ✨ Features

### 🤖 AI Assistants (5 Specialized Bots)
| Bot | Phase | Purpose |
|-----|-------|---------|
| 📝 Proposal Writer | Write | Executive summaries, PWS analysis, compliance matrices |
| 🛡️ Compliance Checker | Review | Section L/M validation, FAR/DFARS compliance |
| 🎯 Win Theme Generator | Capture | Differentiators, ghost strategies, win themes |
| 🎭 Black Hat Reviewer | Review | Evaluator critique, scoring analysis (Admin only) |
| 🧠 Strategy Coach | Qualify | Bid/no-bid analysis, capture planning (Admin only) |

### 🔗 HubSpot CRM Integration
- Bidirectional deal sync with custom AMANDA properties
- Win probability, gate status, phase tracking
- Automatic stage mapping to Shipley methodology
- Webhook support for real-time updates

### 👥 User Management
- Role-based access control (10 roles)
- Custom user creation with permission overrides
- Bulk import (CSV, Excel, JSON)
- Partner lifecycle management with auto-revocation

### ✨ Ultra-Delight Features
- **Visor Reactivity**: AI state indicator with 5 states
- **Theme Depth-Shift**: 400ms cubic-bezier transitions
- **Aurora Celebration**: Closed-Won confetti animation

### 📚 Playbook Learning Engine
- TF-IDF semantic search for golden examples
- Category-based organization
- Export/import functionality
- Runtime example injection

---

## 🚀 Quick Start

### 1. Clone & Install
```bash
cd rockitdata_portal_v7_1
pip install -r requirements.txt
```

### 2. Set Environment Variables
```bash
# Required
export ANTHROPIC_API_KEY="your-api-key-here"

# Optional (HubSpot integration)
export HUBSPOT_ACCESS_TOKEN="your-hubspot-token"
export HUBSPOT_WEBHOOK_SECRET="your-webhook-secret"
```

### 3. Run the Portal
```bash
streamlit run app.py
```

### 4. Login
Default accounts:
| Email | Password | Role |
|-------|----------|------|
| admin@rockitdata.com | admin123 | Admin |
| mary@rockitdata.com | mary123 | Capture Lead |
| demo@rockitdata.com | demo123 | Analyst |

---

## 📁 Project Structure

```
rockitdata_portal_v7_1/
├── app.py                  # Main Streamlit application
├── database.py             # SQLite persistence layer
├── hubspot_connector.py    # HubSpot CRM integration
├── user_management.py      # User CRUD & bulk import
├── ultra_delight.py        # Visor, Aurora, transitions
├── lessons.py              # Playbook learning engine
├── requirements.txt        # Python dependencies
├── README.md               # This file
└── data/                   # Auto-created
    ├── amanda.db           # SQLite database
    └── rockit_playbook.json # Playbook entries
```

---

## 🔐 Security

- **No hardcoded secrets** - All keys via environment variables
- **Password hashing** - SHA-256 with random salt
- **Role-based access** - Private bots hidden from standard users
- **System prompt protection** - Never exposed to client
- **Audit logging** - All actions tracked with timestamps

---

## 🎨 Brand Colors

| Name | Hex | Usage |
|------|-----|-------|
| RockIT Red | #990000 | Primary accent |
| Celestial Navy | #090A2F | Dark backgrounds |
| Pioneer Blue | #62C3E1 | Interactive elements |
| Nebula Purple | #A04BC5 | Highlights |

---

## 📊 Admin Features

### Token Meter
- Track API usage per user
- 30-day cost summary
- Pricing: $3/1M input, $15/1M output (Sonnet-4)

### User Management
- Create users with custom permissions
- Bulk import with validation preview
- Partner lifecycle management

### Playbook Manager
- View all golden examples
- Delete low-quality entries
- Category filtering

---

## 🔄 Shipley Process Alignment

```
Gate 1 → Blue Team → Kickoff (48hr) → Pink (30%) → Red (70%) → Gold (90%) → White Glove → Submit
```

Optional gates: Black Hat, Green Team, Silver Team, Orange Team

---

## 📝 License

Proprietary - rockITdata LLC © 2025

---

## 🆘 Support

Contact: mary@rockitdata.com

---

**⚠️ AI GENERATED - REQUIRES HUMAN REVIEW**
