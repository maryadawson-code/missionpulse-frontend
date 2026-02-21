# Agent Handoff Specification v1

**2-Agent Orchestration Standard for Commercialization Analysis**

---

## Overview

MissionPulse uses a 2-agent architecture for commercialization analysis where complex business decisions require both technical product knowledge and financial/market analysis.

## Agent Roles

### Agent 1: MissionPulse Strategic Architect

**Role:** Technical product expert. Knows the codebase, architecture, feature inventory, and competitive positioning.

**Responsibilities:**
- Feature inventory and capability mapping
- Technical feasibility assessment
- Architecture implications of business decisions
- Sprint effort estimation
- Integration complexity analysis

**Access:** Full codebase, `ROADMAP_v1.1_v1.2.md`, `ROADMAP_GTM_EXTENSION.md`, `database.types.ts`

### Agent 2: Business Agent (CFO/FP&A)

**Role:** Financial and market analyst. Evaluates revenue models, pricing strategy, market sizing, and go-to-market execution.

**Responsibilities:**
- Revenue modeling and projection
- Pricing strategy validation
- Market sizing (TAM/SAM/SOM)
- Customer acquisition cost analysis
- Unit economics (LTV/CAC)
- Competitive positioning
- Risk assessment

**Access:** Business context documents, market research, pricing data

## Handoff Schema

When Agent 1 hands off to Agent 2, the payload follows this structure:

```json
{
  "handoff_version": "1.0",
  "timestamp": "ISO-8601",
  "source_agent": "strategic-architect",
  "target_agent": "business-agent",
  "context": {
    "product_state": "Description of current product capabilities",
    "feature_inventory": ["list", "of", "features"],
    "technical_constraints": ["list", "of", "constraints"],
    "pricing_current": {
      "starter": { "monthly": 149, "annual": 1484, "tokens": 500000 },
      "professional": { "monthly": 499, "annual": 4970, "tokens": 2000000 },
      "enterprise": { "monthly": 2500, "annual": 24900, "tokens": 10000000 }
    }
  },
  "analysis_request": "What specific analysis is needed",
  "evidence_tags": "See Evidence Tagging Protocol below"
}
```

## Evidence Tagging Protocol

Every claim in handoff documents MUST be tagged with one of:

| Tag | Definition | Example |
|-----|-----------|---------|
| `[FACT]` | Verified from code, database, or official source | "200 tables with RLS [FACT]" |
| `[INFERENCE]` | Logical conclusion from facts | "High compliance readiness implies gov market fit [INFERENCE]" |
| `[ESTIMATE]` | Quantitative projection with stated assumptions | "~$2M ARR at 150 customers [ESTIMATE: assumes 60% Professional tier]" |
| `[UNKNOWN]` | Information gap that needs research | "Competitor pricing for Capture2Proposal [UNKNOWN]" |
| `[BA-ASSUMPTION]` | Business Agent assumption for modeling | "5% monthly churn for Starter tier [BA-ASSUMPTION]" |

## Handoff Triggers

Agent 1 → Agent 2 handoff occurs when:
1. Pricing strategy needs validation against market data
2. Revenue projections required for investor materials
3. Go-to-market plan needs financial modeling
4. Feature prioritization needs business case analysis
5. Competitive analysis requires market research

Agent 2 → Agent 1 handoff occurs when:
1. Business recommendation requires technical feasibility check
2. Revenue model assumes features that may not exist
3. Market requirement translates to new sprint work
4. Pricing change requires schema/code modification

## Response Format

Agent 2 responses should include:

1. **Executive Summary** (3-5 bullets)
2. **Detailed Analysis** (with evidence tags)
3. **Recommendations** (prioritized, actionable)
4. **Assumptions Log** (all `[BA-ASSUMPTION]` items listed)
5. **Questions for Agent 1** (clarifications needed)
6. **Risk Register** (identified risks with severity)

---

**PROPRIETARY — Mission Meets Tech, LLC — February 2026**
