# MissionPulse SEO Agent Strategy
**Version:** 1.0.0
**Last updated by agent:** 2026-03-04
**Run count:** 0
**Total fixes applied:** 0
**Pages tracked:** [auto-populated on first run]

---

## Target Audience

GovCon BD and capture professionals at small-to-mid-size federal contractors:
- Business Development Directors building opportunity pipelines
- Capture Managers running Shipley-based pursuits
- Proposal Managers coordinating color team reviews
- Pricing Managers developing cost volumes
- Contract compliance officers managing FAR/DFARS requirements
- Small business owners in 8(a), SDVOSB, WOSB, HUBZone programs
- Healthcare IT contractors (DHA, VA, CMS, IHS vehicles)

NOT: general software buyers, consumer audience, federal agency employees.

---

## Competitive Positioning

Primary competitor: GovDash
MissionPulse advantages to emphasize in copy proposals:
- Shipley BD Lifecycle is built-in architecture, not a template overlay
- AskSage routing (FedRAMP High/IL5) — the only GovCon proposal tool with
  an IL5-compliant AI path
- 12-role RBAC with invisible module enforcement (competitors show "access denied")
- AI outputs carry "AI GENERATED - REQUIRES HUMAN REVIEW" — audit-ready, not a black box
- Accessible entry pricing ($149 Starter vs GovDash enterprise-only pricing)
- Solo Mode — single BD operator can run the full lifecycle

Agent tracks keyword ranking gaps vs GovDash. When Plausible shows a competitor
referral or a GovDash-adjacent search term driving traffic, note it.

---

## Active Keyword Targets

Agent updates this table after each run. Grades and rankings from observed data.

| Page | Primary Keyword | Secondary Keywords | CTA Goal | Current Grade | Last Updated |
|------|-----------------|--------------------|----------|---------------|-------------|
| / | federal proposal management software | GovCon proposal AI, government contractor BD platform | Demo request | [AUDIT] | [DATE] |
| /features | AI capture management | Shipley proposal automation, pWin analysis tool, proposal pipeline software | Feature exploration → Demo | [AUDIT] | [DATE] |
| /pricing | proposal management software pricing | GovCon SaaS pricing, BD software cost, federal contractor tools | Plan selection | [AUDIT] | [DATE] |
| /about | MissionPulse AI proposal platform | Mission Meets Tech, federal health IT contractor tools | Trust / Newsletter signup | [AUDIT] | [DATE] |
| /demo | federal proposal software demo | MissionPulse demo, GovCon AI demo | Demo booking | [AUDIT] | [DATE] |
| /blog | [auto-populated from discovered posts] | | Thought leadership → Demo | [AUDIT] | [DATE] |

---

## GovCon SEO Signals (high-value, low-competition terms)

These are domain-specific terms GovDash ranks weakly for. Prioritize in copy proposals.

- "Shipley proposal management software"
- "IL5 compliant proposal AI"
- "FedRAMP proposal management"
- "pWin analysis tool for GovCon"
- "8(a) proposal management software"
- "DHA proposal management"
- "VA IT proposal software"
- "CMMC 2.0 proposal compliance"
- "color team review software"
- "federal capture management AI"

---

## Schema Map (canonical — agent enforces these types)

| Page | Required Schema Types | Notes |
|------|-----------------------|-------|
| / | SoftwareApplication + Organization | SoftwareApplication is critical for SaaS discoverability |
| /features | SoftwareApplication + ItemList (feature list) | ItemList schema indexes individual features |
| /pricing | SoftwareApplication + PriceSpecification + FAQPage | FAQPage for common pricing questions |
| /about | Organization + Person (Mary Womack, Founder) | No employer — MMT is the org |
| /demo | WebPage + Event (if scheduled demos exist) | |
| /blog/* | BlogPosting + BreadcrumbList | Per-post schema |
| sitemap.xml | All canonical pages + lastmod | |

CRITICAL: SoftwareApplication schema on / and /features is the #1 SEO priority.
Google treats pages with SoftwareApplication schema differently for B2B SaaS queries.

---

## Trust Signal Audit (check on every run)

These items affect conversion and indirectly affect SEO (dwell time, bounce rate):
- [ ] Social proof (customer count, pilot firms, testimonials) present on /?
- [ ] Security badges (FedRAMP, CMMC, NIST, IL5) present on relevant pages?
- [ ] "AI GENERATED - REQUIRES HUMAN REVIEW" compliance signal visible?
- [ ] Pricing page includes annual discount (17%) and plan comparison table?
- [ ] Demo page has clear booking mechanism (Calendly, form, or email)?

These are PROPOSE-ONLY — never auto-change copy or layout.

---

## What Is Working (agent-maintained)

<!-- Agent appends observations here after each run -->

---

## What Is Not Working (agent-maintained)

<!-- Agent appends observations here when fixes don't correlate with traffic lift -->

---

## Standing Rules (agent learns and adds rules here)

Initial rules:
- Do not optimize for consumer health or general "proposal software" — too broad
- GovCon acronyms (IDIQ, SDVOSB, pWin, FAR/DFARS, Shipley) are features, not jargon
  — use them with brief plain-English parentheticals for SEO lift
- CSP blocks inline JavaScript — JSON-LD schema in <script type='application/ld+json'>
  is data, not code — safe to add freely
- Plausible is the only analytics source — never add Google Analytics
- Pricing is canonical: Starter $149 / Professional $499 / Enterprise $2,500
  Never deviate from PRICING_DECISION.md values in any copy proposal
- MMT sells TO GovCon firms, not to the federal government
  Never write copy positioning MMT as a federal agency vendor or set-aside holder

Agent-learned rules (appended after runs):
<!-- Agent writes here -->

---

## Fix Priority Order (agent reorders based on impact data)

Initial priority (will evolve from observed data):
1. SoftwareApplication schema — missing on most GovCon SaaS sites; high ranking signal
2. Missing meta descriptions — direct indexing impact
3. Missing/duplicate title tags — direct ranking impact
4. FAQPage schema on /pricing — captures "how much does X cost" queries
5. Missing canonical tags — prevents duplicate content dilution
6. Missing or misconfigured OG tags — affects LinkedIn/Slack share previews
   (GovCon buyers share links in Slack frequently)
7. Missing H1 or multiple H1s — structural signal
8. Missing image alt text — accessibility + ranking
9. Missing sitemap entries — crawl coverage
10. Internal link gaps — page authority distribution
11. Trust signal gaps (propose only — no auto-apply)
12. Copy quality: title/description (propose only — no auto-apply)

---

## Plausible Traffic Baselines (agent-maintained)

| Date | Page | Unique Visitors (30d) | Pageviews (30d) | Top Source | Notes |
|------|----|---|---|---|---|
<!-- Agent writes here -->
