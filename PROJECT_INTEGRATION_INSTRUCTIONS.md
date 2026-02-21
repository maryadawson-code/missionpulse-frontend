# Project Integration Instructions — GTM Extension

**How to install the GTM extension into the MissionPulse project.**

---

## Prerequisites

1. v1.0 complete (S3–S18 all done, build passing)
2. `ROADMAP_v1.1_v1.2.md` present in `docs/`
3. `ROADMAP_GTM_EXTENSION.md` present in repo root
4. Branch: `v2-development`

## Step 1: Register GTM Roadmap

Place `ROADMAP_GTM_EXTENSION.md` in the repo root. This file defines 3 parallel sprints (S-GTM-1 through S-GTM-3) with 14 tickets.

## Step 2: Apply Amendments to Existing Tickets

When executing Sprint 20 tickets, apply these amendments from `ROADMAP_GTM_EXTENSION.md`:

| Amendment | Ticket | Change |
|-----------|--------|--------|
| A-1 | T-20.1 | Pricing → $149/$499/$2,500 monthly. Add `annual_price` column. |
| A-2 | T-20.4 | Annual billing = "2 months free" framing (17% discount). |
| A-3 | T-20.3 | Decoy pricing: Enterprise anchor, Professional highlighted. |

## Step 3: Update Environment Variables

Add to `.env.example` and `.env.local`:

```env
# AI Provider Configuration (GTM Extension — T-GTM-1.1)
AI_PRIMARY_PROVIDER=asksage
AI_FALLBACK_PROVIDER=anthropic
ANTHROPIC_API_KEY=
OPENAI_API_KEY=

# Stripe (Sprint 20 — T-20.4)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Marketing Analytics (S-GTM-3.5)
NEXT_PUBLIC_GA4_ID=
```

## Step 4: Execution Order

GTM sprints slot alongside Phase G/H like this:

```
Week:  1    2    3    4    5    6    7    8    9    10
       ├────┼────┼────┼────┼────┼────┼────┼────┼────┤
S19    ████                                          Performance
S20         ████                                     Billing (apply A-1, A-2, A-3)
S21              ████                                Doc Gen
S22                   ████                           Salesforce/GovWin
GTM-1       ████████                                 AI Abstraction (parallel)
S23                        ████                      M365/Slack
S24                             ████                 Playbook v2
GTM-2            ████████████                        Pilot Infra (after S20)
S25                                  ████            Federal Data
S26                                       ████       Google/DocuSign
S27                                            ████  RAG/Proactive AI
S28                                                 ████ Collab/Teams
GTM-3                 ████████████████               Marketing (independent)
```

**Key dependencies:**
- S-GTM-1 can start after S19 (needs AI pipeline understanding)
- S-GTM-2 depends on S20 (needs billing tables)
- S-GTM-3 has no dependencies (can start any time)

## Step 5: Verify Integration

After installing:

1. `npm run build` — must pass with 0 errors
2. All existing routes still compile
3. New files don't conflict with existing imports
4. `database.types.ts` includes `subscription_plans`, `company_subscriptions`, `token_ledger`

## Step 6: Update Truth Files

After GTM tickets execute:
- Update `CURRENT_STATE.md` with GTM sprint status
- Update `AGENTS.md` with new file paths
- Run `supabase gen types` after SQL migrations

---

**PROPRIETARY — Mission Meets Tech, LLC — February 2026**
