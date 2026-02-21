# MissionPulse v1.1 + v1.2 Roadmap Extension

**From Launch to Market Leader**
9 Sprints • ~42 Tickets • Phases G–H

Supersedes nothing — extends MissionPulse_v2_Master_Roadmap.docx (S3–S18)
Sprint numbering continues from S18. Ticket numbering continues from T-18.4.

**PROPRIETARY — Mission Meets Tech, LLC — February 2026**

---

## 1. Strategic Overview

### 1.1 Where We Are

v1.0 is live. All 16 modules production-ready. 8 AI agents operational via AskSage gateway. Track-changes UX deployed. SAM.gov and HubSpot connected. Solo Mode shipping. Dark mode default. RBAC enforced across 12 roles × 14 modules. Audit trail immutable.

HEAD: d2b5e13 on main. Both branches synced. Build: CLEAR — 0 errors, 0 type errors, 0 security flags.

### 1.2 Where We're Going

v1.1 delivers the integrations and performance layer. v1.2 delivers real-time collaboration, proactive AI, and the advanced intelligence features that create competitive moats.

### 1.3 Phase Map

| Phase | Sprints | What Ships |
|-------|---------|------------|
| G: Integrations & Performance (v1.1) | S19–S23 | Redis caching, advanced doc gen (PPTX/XLSX/DOCX), Salesforce, GovWin IQ, M365, Slack, Playbook v2, model analytics |
| H: Collaboration & Proactive AI (v1.2) | S24–S27 | USAspending/FPDS, Google Workspace, DocuSign, advanced RAG, proactive AI, real-time collab, Teams, model fine-tuning |

### 1.4 Sprint Cadence

| Parameter | Value |
|-----------|-------|
| Sprint Length | Maximize delivery per sprint. No fixed time constraint. |
| Tickets per Sprint | 4–5 (packed for throughput) |
| Validation | npm run build must pass for every ticket |
| Branch | All work on v2-development. Merge to main per release. |
| Deploy | Staging auto-deploys on push. Production = manual merge. |
| v1.1 Target | Q3 2026 |
| v1.2 Target | Q4 2026 |

### 1.5 Execution Rules

- One ticket at a time. Build must pass before moving to the next.
- Complete files only — no partials, no stubs.
- Commit each ticket: `git commit -m "feat(sprint-N): T-N.X — [title]"`
- Read AGENTS.md and database.types.ts before writing any code.
- Any new tables require SQL migration + `supabase gen types` to update database.types.ts.
- After each sprint: push to v2-development, run /verify, report status.

---

## 2. PHASE G: Integrations, Docs & Performance (v1.1)

Goal: Connect MissionPulse to every tool GovCon teams already use. Generate publication-ready documents. Make the platform fast enough that teams forget they're using a web app.

---

### SPRINT 19 — Performance & Analytics Foundation

*Redis semantic caching. Supabase connection pooling. Model usage analytics. Performance monitoring baseline.*

#### T-19.1 Redis Caching Layer

Upstash Redis (serverless, edge-compatible) for semantic caching of AI responses. Cache key = hash of prompt + model + classification level. TTL configurable per agent. Cache-hit bypasses AskSage entirely, cutting token costs and latency.

**Acceptance Criteria:**
- [ ] Upstash Redis client configured in lib/cache/redis.ts
- [ ] Semantic cache: hash prompt + model + classification → cache key
- [ ] Cache hit returns stored response (skip AskSage call)
- [ ] TTL configurable per agent (default 24hr, Black Hat = 1hr)
- [ ] Cache invalidation on Playbook update (stale boilerplate prevention)
- [ ] Cache hit/miss metrics exposed to analytics dashboard
- [ ] npm run build passes

**Depends on:** T-10.1 (AskSage gateway)
**Files:** lib/cache/redis.ts, lib/cache/semantic-cache.ts, lib/ai/gateway.ts (modify)

---

#### T-19.2 Connection Pooling & Query Optimization

Enable Supabase pgBouncer for connection pooling. Audit slow queries from v1.0 usage. Add database indexes for high-traffic patterns (opportunity listing, proposal search, audit log queries).

**Acceptance Criteria:**
- [ ] pgBouncer connection string configured for production
- [ ] Connection pool size tuned (max 20 per serverless function)
- [ ] Index audit: add indexes for opportunities(phase, status), proposals(opportunity_id), audit_logs(created_at, user_id)
- [ ] Slow query log enabled (>500ms threshold)
- [ ] npm run build passes

**Depends on:** Supabase dashboard access
**Files:** lib/supabase/server.ts (pooling config), SQL migration file

---

#### T-19.3 Model Usage Analytics Dashboard

Admin-facing dashboard showing: token consumption by model, cost per proposal, cost per agent, cache hit rate, model distribution over time. Reads from ai_usage_logs table.

**Acceptance Criteria:**
- [ ] Analytics page at /dashboard/analytics/ai-usage
- [ ] Charts: token cost by model (bar), cost per proposal (line), agent distribution (donut)
- [ ] Date range filter (7d, 30d, 90d, custom)
- [ ] Cache hit rate displayed as percentage with trend
- [ ] Export to CSV
- [ ] RBAC: executive, operations, admin only (shouldRender check)
- [ ] npm run build passes

**Depends on:** T-10.1, T-19.1
**Files:** app/(dashboard)/analytics/ai-usage/page.tsx, components/features/analytics/*.tsx

---

#### T-19.4 Performance Monitoring Baseline

Instrument key user flows with timing metrics. Page load, AI response time, search latency, document generation time. Store in performance_metrics table. Alert threshold configuration.

**Acceptance Criteria:**
- [ ] lib/utils/perf-monitor.ts with timing utilities
- [ ] Instrument: dashboard load, pipeline query, AI chat response, doc generation
- [ ] Metrics stored in performance_metrics table
- [ ] Admin alert when p95 exceeds threshold (configurable)
- [ ] SQL migration for performance_metrics table (requires supabase gen types after)
- [ ] npm run build passes

**Depends on:** T-4.1 (Dashboard shell)
**Files:** lib/utils/perf-monitor.ts, SQL migration

---

### SPRINT 20 — Advanced Document Generation

*PPTX generation for orals and gate decks. XLSX export for compliance matrices and cost models. DOCX generation for technical volumes. Enhanced binder assembly.*

#### T-20.1 PPTX Generation Engine

Generate PowerPoint decks from structured data. Two templates: Orals Prep deck (slides + speaker notes + Q&A) and Gate Decision deck (Go/No-Go recommendation with metrics). Shield & Pulse branding baked into templates.

**Acceptance Criteria:**
- [ ] lib/docgen/pptx-engine.ts with PptxGenerator class
- [ ] Orals template: title slide, agenda, section slides with speaker notes, Q&A appendix
- [ ] Gate Decision template: recommendation slide, metrics dashboard, risk factors, next steps
- [ ] MMT branding: Primary Cyan headers, Deep Navy backgrounds, Inter font
- [ ] Download button in Orals Prep and Launch Control modules
- [ ] Generated files pass PowerPoint validation
- [ ] npm run build passes

**Depends on:** T-13.1 (Orals Prep), T-14.2 (Launch Control)
**Files:** lib/docgen/pptx-engine.ts, lib/docgen/templates/orals.ts, lib/docgen/templates/gate-decision.ts

---

#### T-20.2 XLSX Generation Engine

Export structured data to formatted Excel workbooks. Three outputs: Compliance Matrix (from Iron Dome), Cost Model (from Pricing module), Red Team Scorecard (from Black Hat). Formatted headers, conditional formatting, freeze panes.

**Acceptance Criteria:**
- [ ] lib/docgen/xlsx-engine.ts with XlsxGenerator class
- [ ] Compliance Matrix: requirement ID, text, status, assignee, evidence, eval factor mapping
- [ ] Cost Model: CLIN structure, LCATs, rates, wrap rates, totals with formulas
- [ ] Red Team Scorecard: criteria, scores, weaknesses, recommended fixes
- [ ] Conditional formatting: green/yellow/red status cells
- [ ] CUI banner on Pricing and Black Hat exports
- [ ] npm run build passes

**Depends on:** T-8.2 (Iron Dome), T-12.2 (Pricing Agent), T-12.4 (Black Hat Agent)
**Files:** lib/docgen/xlsx-engine.ts, lib/docgen/templates/compliance-matrix.ts, lib/docgen/templates/cost-model.ts

---

#### T-20.3 DOCX Generation Engine

Generate Word documents from AI-drafted content. Technical Volume (formatted per RFP instructions with CUI banners), Key Personnel resumes (RFP-templated), FAR Risk Memo (clause analysis with risk ratings). Track-changes preserved in output.

**Acceptance Criteria:**
- [ ] lib/docgen/docx-engine.ts with DocxGenerator class
- [ ] Technical Volume: section headers per RFP, page numbers, CUI portion marks
- [ ] Key Personnel: standardized resume format matching common RFP templates
- [ ] FAR Risk Memo: clause ID, risk level, plain-language summary, recommendation
- [ ] All outputs include 'AI GENERATED — REQUIRES HUMAN REVIEW' watermark
- [ ] npm run build passes

**Depends on:** T-11.1 (Writer Agent), T-8.1 (Contract Scanner)
**Files:** lib/docgen/docx-engine.ts, lib/docgen/templates/tech-volume.ts, lib/docgen/templates/key-personnel.ts

---

#### T-20.4 Enhanced Binder Assembly

Upgrade one-click binder assembly to use new doc gen engines. ZIP contains formatted DOCX volumes, XLSX compliance matrix, PPTX gate deck, and a generated table of contents. CUI markings on all applicable files.

**Acceptance Criteria:**
- [ ] Binder ZIP includes: Tech Volume (.docx), Management Volume (.docx), Cost Volume (.xlsx), Compliance Matrix (.xlsx), Gate Deck (.pptx)
- [ ] Master TOC document listing all files with page counts
- [ ] CUI banners on Pricing and Black Hat artifacts
- [ ] File naming convention: [OpportunityTitle]_[Volume]_[Date].ext
- [ ] npm run build passes

**Depends on:** T-14.2 (Launch Control), T-20.1, T-20.2, T-20.3
**Files:** lib/utils/binder-assembly.ts (rewrite), lib/docgen/binder-toc.ts

---

### SPRINT 21 — Salesforce + GovWin IQ

*Bi-directional CRM sync. Competitor intelligence feed. Pipeline auto-enrichment.*

#### T-21.1 Salesforce OAuth + Field Mapping

OAuth 2.0 connection to Salesforce. Admin-configurable field mapping: MissionPulse opportunity fields ↔ Salesforce deal properties. Mapping stored in integration_configs table.

**Acceptance Criteria:**
- [ ] OAuth 2.0 flow via Integrations Hub (T-15.1 card)
- [ ] Field mapping UI: drag-drop MissionPulse fields to Salesforce fields
- [ ] Default mapping provided (title→Name, ceiling→Amount, pwin→Probability, phase→Stage)
- [ ] Custom field support (user can map to custom Salesforce fields)
- [ ] Connection test button with success/failure indicator
- [ ] npm run build passes

**Depends on:** T-15.1 (Integrations Hub Shell)
**Files:** lib/integrations/salesforce/auth.ts, lib/integrations/salesforce/field-mapping.ts, app/(dashboard)/integrations/salesforce/page.tsx

---

#### T-21.2 Salesforce Bi-directional Sync

Sync engine: MissionPulse → Salesforce, Salesforce → MissionPulse, or bidirectional. Conflict resolution: last-write-wins with audit log entry on every conflict. Webhook-based real-time + manual sync button.

**Acceptance Criteria:**
- [ ] Sync direction configurable: push, pull, or bidirectional
- [ ] Real-time sync via Salesforce webhooks (outbound messages)
- [ ] Manual sync button with progress indicator
- [ ] Conflict resolution: last-write-wins, conflicts logged to audit_logs
- [ ] De-duplicate: match on Salesforce ID or opportunity title
- [ ] Shipley phase changes auto-update Salesforce deal stage
- [ ] npm run build passes

**Depends on:** T-21.1, T-5.3 (opportunity CRUD)
**Files:** lib/integrations/salesforce/sync-engine.ts, lib/integrations/salesforce/webhooks.ts

---

#### T-21.3 Salesforce Contact Sync

Sync contacts between Salesforce and opportunity stakeholder records. Map Salesforce contacts to MissionPulse opportunity_contacts. Role mapping (Decision Maker, Influencer, Technical POC).

**Acceptance Criteria:**
- [ ] Contact sync from Salesforce → opportunity_contacts table
- [ ] Role mapping: Salesforce contact role → MissionPulse stakeholder type
- [ ] Contact deduplication by email address
- [ ] Sync runs on opportunity sync (piggybacks on T-21.2)
- [ ] npm run build passes

**Depends on:** T-21.2
**Files:** lib/integrations/salesforce/contact-sync.ts

---

#### T-21.4 GovWin IQ Integration

OAuth connection to GovWin IQ. Pull opportunity alerts matching NAICS codes and agency focus. Competitor tracking feed showing who's bidding. Agency intel summaries (budget forecasts, acquisition timelines).

**Acceptance Criteria:**
- [ ] OAuth connection via Integrations Hub
- [ ] Opportunity alerts: filter by NAICS, agency, set-aside, dollar threshold
- [ ] Import to Pipeline with one click (creates opportunity record)
- [ ] Competitor tracking: list known bidders per opportunity from GovWin data
- [ ] Agency intel card on opportunity detail page (budget, timeline, incumbents)
- [ ] Daily sync via Supabase Edge Function (cron)
- [ ] npm run build passes

**Depends on:** T-15.1, T-5.3
**Files:** lib/integrations/govwin/client.ts, lib/integrations/govwin/sync.ts, app/(dashboard)/integrations/govwin/page.tsx, components/features/pipeline/GovWinIntel.tsx

---

### SPRINT 22 — Microsoft 365 + Slack

*OneDrive doc collaboration. Outlook calendar sync. Slack channel notifications. Gate approvals via Slack.*

#### T-22.1 Microsoft 365 OAuth + OneDrive

OAuth 2.0 via Microsoft identity platform (MSAL). OneDrive integration: save generated documents directly to user's OneDrive. Open proposal volumes in Word Online for collaborative editing. Bi-directional file sync.

**Acceptance Criteria:**
- [ ] MSAL OAuth flow via Integrations Hub
- [ ] Save to OneDrive button on all document generation outputs
- [ ] Open in Word Online link for DOCX files
- [ ] File sync: changes in OneDrive reflected in MissionPulse document list
- [ ] Folder structure: /MissionPulse/[OpportunityTitle]/[Volume]/
- [ ] npm run build passes

**Depends on:** T-15.1, T-20.3
**Files:** lib/integrations/m365/auth.ts, lib/integrations/m365/onedrive.ts, app/(dashboard)/integrations/m365/page.tsx

---

#### T-22.2 Outlook Calendar + SharePoint

Push MissionPulse deadlines (gate reviews, color teams, submission dates) to Outlook calendar. SharePoint document library as alternative to OneDrive for team-level storage.

**Acceptance Criteria:**
- [ ] Calendar event creation for: gate review dates, color team sessions, submission deadline
- [ ] Events include: title, attendees (from opportunity team), description with MissionPulse link
- [ ] Calendar sync is push-only (MissionPulse → Outlook)
- [ ] SharePoint site/library picker for document storage
- [ ] npm run build passes

**Depends on:** T-22.1
**Files:** lib/integrations/m365/calendar.ts, lib/integrations/m365/sharepoint.ts

---

#### T-22.3 Slack OAuth + Channel Notifications

Slack OAuth. Create or link a Slack channel per opportunity. Push notifications for: gate approvals needed, deadline warnings (48hr/24hr), HITL queue items, pWin changes >10%, new team assignments.

**Acceptance Criteria:**
- [ ] Slack OAuth via Integrations Hub
- [ ] Channel linking: select existing channel or auto-create per opportunity
- [ ] Notification types: gate approval, deadline warning, HITL pending, pWin change, assignment
- [ ] Rich message format with action buttons (Approve/Reject for gate decisions)
- [ ] User-configurable notification preferences (which types, which channels)
- [ ] npm run build passes

**Depends on:** T-15.1, T-14.4 (Notification System)
**Files:** lib/integrations/slack/auth.ts, lib/integrations/slack/notify.ts, app/(dashboard)/integrations/slack/page.tsx

---

#### T-22.4 Slack Gate Approval Workflows

Interactive Slack messages for gate approvals. Exec receives message with opportunity summary, pWin, compliance %, and Approve/Reject buttons. Response writes to gate_decisions table and triggers downstream notifications.

**Acceptance Criteria:**
- [ ] Interactive message with: opportunity title, phase, pWin, compliance %, team summary
- [ ] Approve/Reject buttons trigger Server Action via Slack webhook
- [ ] Decision recorded in gate_decisions table with slack_message_id for audit
- [ ] Downstream notification sent to opportunity channel on decision
- [ ] RBAC enforced: only users with canEdit on proposals can approve via Slack
- [ ] npm run build passes

**Depends on:** T-22.3, T-14.2 (Launch Control)
**Files:** lib/integrations/slack/gate-approval.ts, lib/integrations/slack/webhook-handler.ts

---

### SPRINT 23 — Playbook v2 + v1.1 Hardening

*Anti-homogenization engine. Quality scoring. Integration regression testing. Performance benchmarking.*

#### T-23.1 Playbook v2 Anti-Homogenization Engine

Company voice fingerprinting: analyze uploaded past proposals to extract writing patterns, vocabulary, sentence structure, and domain-specific terminology. AI outputs are filtered through the voice profile to prevent generic "AI-sounding" text. Addresses Lohfeld's "regression to average" concern.

**Acceptance Criteria:**
- [ ] Voice fingerprint generator: analyzes 3+ uploaded docs to create style profile
- [ ] Style profile stored in company_voice_profiles table (JSONB)
- [ ] Writer Agent applies voice profile to all generated content
- [ ] A/B display: show "generic" vs "voice-matched" output to demonstrate value
- [ ] Voice profile editable by executive, operations roles
- [ ] npm run build passes

**Depends on:** T-9.1 (Playbook module), T-11.1 (Writer Agent)
**Files:** lib/ai/voice-fingerprint.ts, lib/ai/agents/writer.ts (modify), app/(dashboard)/playbook/voice-profile/page.tsx

---

#### T-23.2 Playbook Quality Scoring

Score every Playbook entry on: relevance to current opportunities, freshness (days since last use), win correlation (entries used in won proposals score higher). Surface highest-quality entries first in AI retrieval.

**Acceptance Criteria:**
- [ ] Quality score algorithm: relevance (pgvector similarity) × freshness decay × win multiplier
- [ ] Scores recalculated nightly via Edge Function
- [ ] Playbook UI shows quality score badge per entry
- [ ] AI retrieval prioritizes high-quality entries
- [ ] Manual override: user can pin/boost entries
- [ ] npm run build passes

**Depends on:** T-9.1, T-14.3 (Post-Award — win/loss data)
**Files:** lib/playbook/quality-scorer.ts, supabase/functions/playbook-scoring/index.ts

---

#### T-23.3 v1.1 Integration Regression Testing

End-to-end test suite covering all v1.1 integrations. Verify: OAuth flows, sync operations, notification delivery, document generation, cache behavior. Mock external APIs for CI reliability.

**Acceptance Criteria:**
- [ ] Playwright tests for: Salesforce sync, GovWin import, M365 save, Slack notification
- [ ] Mock API server for external services (no live API calls in CI)
- [ ] Document generation tests: verify PPTX/XLSX/DOCX output validity
- [ ] Cache tests: verify hit/miss behavior, TTL expiry, invalidation
- [ ] All tests pass in CI pipeline
- [ ] npm run build passes

**Depends on:** All S19–S22 tickets
**Files:** tests/integrations/*.spec.ts, tests/mocks/*.ts

---

#### T-23.4 v1.1 Performance Benchmarking

Benchmark all key flows against v1.0 baseline. Target: 40% improvement in AI response time (cache hits), <2s page loads, <500ms search. Optimize any flow exceeding thresholds.

**Acceptance Criteria:**
- [ ] Benchmark report: v1.0 vs v1.1 for dashboard load, pipeline query, AI chat, doc gen
- [ ] Cache hit rate >60% for repeated AI queries
- [ ] All page loads <2s at p95
- [ ] Search queries <500ms at p95
- [ ] Optimization pass on any metric exceeding threshold
- [ ] npm run build passes

**Depends on:** T-19.4
**Files:** tests/benchmarks/*.ts, docs/v1.1-benchmark-report.md

---

## 3. PHASE H: Collaboration, Proactive AI & Deep Integrations (v1.2)

Goal: Make MissionPulse the place where proposals are written, not just managed. Real-time collaboration. AI that warns before problems happen. Every federal data source connected.

---

### SPRINT 24 — Federal Data Sources + Data Migration

*USAspending award intelligence. FPDS contract actions. Bulk data import for new customers.*

#### T-24.1 USAspending API Integration

Connect to USAspending.gov API. Pull award history, prime/sub relationships, spending trends by agency. Enrich opportunity records with historical award data for the same agency/NAICS.

**Acceptance Criteria:**
- [ ] USAspending API client in lib/integrations/usaspending/client.ts
- [ ] Search by: agency, NAICS, recipient, keyword
- [ ] Award history card on opportunity detail page (past 5 years)
- [ ] Prime/sub relationship visualization (who teamed with whom)
- [ ] Spending trend chart by agency + NAICS code
- [ ] Auto-fetch runs on opportunity creation (background, non-blocking)
- [ ] npm run build passes

**Depends on:** T-15.1, T-5.1
**Files:** lib/integrations/usaspending/client.ts, components/features/pipeline/AwardHistory.tsx, components/features/pipeline/SpendingTrends.tsx

---

#### T-24.2 FPDS API Integration

Connect to FPDS (Federal Procurement Data System). Pull contract actions, vendor history, pricing benchmarks. Feed pricing data into Pricing Agent for price-to-win analysis.

**Acceptance Criteria:**
- [ ] FPDS API client in lib/integrations/fpds/client.ts
- [ ] Contract action search by: agency, vendor, NAICS, date range
- [ ] Vendor history: past contract values, performance ratings
- [ ] Pricing benchmarks: average contract value by NAICS + agency
- [ ] Data feeds into Pricing Agent context for price-to-win
- [ ] npm run build passes

**Depends on:** T-15.1, T-12.2 (Pricing Agent)
**Files:** lib/integrations/fpds/client.ts, lib/ai/agents/pricing.ts (modify)

---

#### T-24.3 Data Migration Tools

Import wizard for new customers migrating from Excel, Deltek, or manual tracking. CSV/XLSX import for: opportunities, contacts, past performance narratives. Bulk document upload for Playbook seeding. Validation + preview before commit.

**Acceptance Criteria:**
- [ ] Import wizard at /dashboard/settings/import
- [ ] CSV/XLSX upload with column mapping UI (drag-drop headers to MissionPulse fields)
- [ ] Import types: opportunities, contacts, past performance
- [ ] Validation: type checking, required fields, de-duplication warnings
- [ ] Preview: show first 10 rows as they'll appear in MissionPulse
- [ ] Bulk document upload: drag-drop folder of PDFs/DOCXs for Playbook indexing
- [ ] Undo: mark imported batch, allow rollback within 24hr
- [ ] npm run build passes

**Depends on:** T-15.4 (Settings), T-9.1 (Playbook)
**Files:** app/(dashboard)/settings/import/page.tsx, lib/migration/csv-parser.ts, lib/migration/xlsx-parser.ts, lib/migration/validator.ts

---

### SPRINT 25 — Google Workspace + DocuSign

*Google Drive doc collaboration. Calendar deadlines. Gmail notifications. E-signature for gate decisions and NDAs.*

#### T-25.1 Google Workspace Integration

OAuth to Google Workspace. Google Drive for document collaboration (alternative to M365). Calendar event push for deadlines. Gmail notification dispatch.

**Acceptance Criteria:**
- [ ] Google OAuth via Integrations Hub
- [ ] Save to Google Drive button on document outputs
- [ ] Open in Google Docs link for proposal volumes
- [ ] Folder structure: MissionPulse/[OpportunityTitle]/
- [ ] Calendar event creation for gate reviews and deadlines
- [ ] Gmail notification option in notification preferences (alternative to native email)
- [ ] npm run build passes

**Depends on:** T-15.1, T-20.3, T-14.4
**Files:** lib/integrations/google/auth.ts, lib/integrations/google/drive.ts, lib/integrations/google/calendar.ts, app/(dashboard)/integrations/google/page.tsx

---

#### T-25.2 DocuSign Integration

OAuth to DocuSign. Route documents for e-signature: gate decision approvals (Go/No-Go), NDA/Teaming Agreement signatures for partners, certification attestations. Signed documents stored with audit trail.

**Acceptance Criteria:**
- [ ] DocuSign OAuth via Integrations Hub
- [ ] Send for Signature button on gate decision documents
- [ ] NDA template routing for partner/subcontractor onboarding
- [ ] Signature status tracking (Pending, Signed, Declined) visible in UI
- [ ] Signed documents auto-attached to opportunity record
- [ ] Signature events logged to audit_logs
- [ ] npm run build passes

**Depends on:** T-15.1, T-14.2 (Launch Control)
**Files:** lib/integrations/docusign/auth.ts, lib/integrations/docusign/envelope.ts, app/(dashboard)/integrations/docusign/page.tsx

---

### SPRINT 26 — Advanced RAG + Proactive AI

*Smarter retrieval. Cross-proposal knowledge. AI that warns before deadlines slip and sections go missing.*

#### T-26.1 Advanced RAG Pipeline

Upgrade pgvector retrieval: semantic chunking (respect document structure, not fixed token windows), hybrid search (vector + keyword TF-IDF), re-ranking with cross-encoder model via AskSage. Measurably better retrieval quality for Playbook and past performance matching.

**Acceptance Criteria:**
- [ ] Semantic chunking: split by document headers/sections, not fixed token count
- [ ] Hybrid search: combine pgvector cosine similarity with pg_trgm keyword matching
- [ ] Re-ranking: top-20 candidates re-scored by cross-encoder via AskSage
- [ ] A/B metrics: retrieval precision improvement vs v1.1 baseline
- [ ] Chunk metadata preserved: source doc, section, page number
- [ ] npm run build passes

**Depends on:** T-9.1 (Playbook), T-10.1 (AskSage gateway)
**Files:** lib/rag/chunker.ts, lib/rag/hybrid-search.ts, lib/rag/reranker.ts

---

#### T-26.2 Cross-Proposal Knowledge Graph

Entity extraction from uploaded proposals: agencies, contract vehicles, key personnel, technologies, past performance references. Relationship mapping stored in knowledge_graph table. Powers: "Show me every proposal where we mentioned FHIR integration."

**Acceptance Criteria:**
- [ ] Entity extraction via AskSage (Sonnet) on document upload
- [ ] Entity types: agency, contract_vehicle, person, technology, requirement, past_performance
- [ ] Relationships: appeared_in, related_to, succeeded_by
- [ ] Knowledge graph queryable from AI Chat ("where did we use X?")
- [ ] Visual graph explorer (optional, stretch goal)
- [ ] npm run build passes

**Depends on:** T-26.1, T-12.1 (AI Chat)
**Files:** lib/rag/entity-extractor.ts, lib/rag/knowledge-graph.ts, SQL migration for knowledge_graph table

---

#### T-26.3 Proactive AI — Deadline Risk Alerts

AI monitors proposal timelines and flags at-risk sections. Inputs: section due dates, current completion %, historical velocity. Output: risk score per section with recommended actions. Alerts push to War Room and notifications.

**Acceptance Criteria:**
- [ ] Risk assessment runs daily via Edge Function
- [ ] Inputs: due_date, completion_pct, historical_days_per_section
- [ ] Risk levels: On Track (green), At Risk (yellow), Critical (red)
- [ ] At Risk trigger: projected completion > due date at current velocity
- [ ] Alert includes: section name, days behind, suggested reallocation
- [ ] Alerts appear in War Room feed + notification system
- [ ] npm run build passes

**Depends on:** T-6.2 (War Room), T-14.4 (Notifications)
**Files:** lib/ai/proactive/deadline-risk.ts, supabase/functions/deadline-monitor/index.ts

---

#### T-26.4 Proactive AI — Missing Section Detection

AI scans compliance matrix against proposal document tree. Detects: requirements with no assigned section, sections with no content, orphan sections not tied to any requirement. Alerts push as HITL queue items.

**Acceptance Criteria:**
- [ ] Scan triggered: on compliance matrix update, on section creation/deletion, daily cron
- [ ] Detect: unassigned requirements, empty sections, orphan sections
- [ ] Gap report accessible from Iron Dome module
- [ ] Each gap creates HITL queue item with suggested fix
- [ ] npm run build passes

**Depends on:** T-7.3 (RFP Shredder compliance matrix), T-8.2 (Iron Dome)
**Files:** lib/ai/proactive/section-detector.ts, components/features/compliance/GapReport.tsx

---

#### T-26.5 Model Fine-tuning Pipeline

Prepare company-specific training data from Playbook library. Export prompt/completion pairs from accepted AI outputs. Integration with AskSage fine-tuning API (when available) or direct provider fine-tune endpoints. Admin UI to trigger fine-tuning jobs and monitor progress.

**Acceptance Criteria:**
- [ ] Training data exporter: accepted AI outputs → JSONL prompt/completion pairs
- [ ] Data quality filter: minimum confidence score, human-accepted only
- [ ] Fine-tune job trigger from admin UI
- [ ] Job progress tracking: queued, training, completed, failed
- [ ] Model selector updated with fine-tuned model option
- [ ] RBAC: executive only for fine-tune trigger
- [ ] npm run build passes

**Depends on:** T-23.1 (Playbook v2), T-10.1 (AskSage gateway)
**Files:** lib/ai/fine-tune/data-exporter.ts, lib/ai/fine-tune/job-manager.ts, app/(dashboard)/admin/fine-tune/page.tsx

---

### SPRINT 27 — Real-time Collaboration + Teams + v1.2 Ship

*Concurrent editing. In-app commenting. Microsoft Teams deep integration. v1.2 regression testing and production deploy.*

#### T-27.1 Real-time Collaboration

Presence indicators showing who's viewing/editing each section. Section-level locking (user claims a section, others see it as locked). Optimistic UI with conflict resolution on save.

**Acceptance Criteria:**
- [ ] Presence: avatar + name indicator on active sections (Supabase Realtime channels)
- [ ] Section locking: click to claim, auto-release after 30min idle
- [ ] Lock indicator: section shows editor name + "Editing..." badge
- [ ] Conflict resolution: if two users edit same section, last-save-wins with diff view
- [ ] Realtime status: connected/disconnected indicator in header
- [ ] npm run build passes

**Depends on:** T-6.3 (Swimlane)
**Files:** lib/realtime/presence.ts, lib/realtime/section-lock.ts, components/features/proposals/SectionLock.tsx, components/layout/PresenceIndicator.tsx

---

#### T-27.2 In-app Commenting

Threaded comments on proposal sections. Role-tagged (@capture_manager, @contracts). Comment notifications via existing notification system. Resolve/unresolve workflow.

**Acceptance Criteria:**
- [ ] Comment panel on proposal section detail view
- [ ] Threaded replies (1 level deep)
- [ ] Role mentions: @role triggers notification to all users with that role
- [ ] Resolve button marks thread as resolved (collapsed but visible)
- [ ] Comment count badge on section cards in Swimlane
- [ ] Comments stored in section_comments table with RLS
- [ ] npm run build passes

**Depends on:** T-6.3, T-14.4
**Files:** components/features/proposals/CommentPanel.tsx, lib/comments/actions.ts, SQL migration for section_comments

---

#### T-27.3 Microsoft Teams Deep Integration

Beyond Slack-style notifications: Teams tab app showing opportunity dashboard, meeting scheduling for color team reviews, channel sync bidirectional with War Room activity feed.

**Acceptance Criteria:**
- [ ] Teams tab app: embed MissionPulse opportunity dashboard in Teams channel tab
- [ ] Meeting scheduling: create Teams meeting for gate review from MissionPulse
- [ ] Activity feed sync: War Room updates → Teams channel messages
- [ ] Adaptive cards for gate approval (similar to Slack T-22.4 pattern)
- [ ] npm run build passes

**Depends on:** T-22.1 (M365 OAuth), T-6.2 (War Room)
**Files:** lib/integrations/m365/teams.ts, lib/integrations/m365/teams-tab.ts

---

#### T-27.4 v1.2 Regression Testing + Security Audit

Full regression suite covering all v1.1 + v1.2 features. Security audit of all new OAuth integrations, data flows, and API surfaces. Penetration test prep documentation.

**Acceptance Criteria:**
- [ ] Playwright E2E tests for all new integrations
- [ ] Realtime collaboration test: multi-user presence + locking
- [ ] OAuth security review: token storage, refresh handling, scope minimization
- [ ] No service-role key in any client-accessible code
- [ ] All RLS policies verified for new tables (section_comments, knowledge_graph, etc.)
- [ ] Pen test checklist document generated
- [ ] npm run build passes

**Depends on:** All S24–S27 tickets
**Files:** tests/e2e/*.spec.ts, docs/security-audit-v1.2.md

---

#### T-27.5 v1.2 Production Deploy + Documentation

Merge v2-development to main. DNS cutover verification for missionpulse.io. Update user documentation. Release notes. Marketing changelog for customers.

**Acceptance Criteria:**
- [ ] v2-development merged to main via PR with full CI pass
- [ ] Production deploy verified at missionpulse.io
- [ ] User docs updated: new integrations, collaboration features, proactive AI
- [ ] Release notes document: v1.2 changelog with screenshots
- [ ] npm run build passes on main branch

**Depends on:** T-27.4
**Files:** docs/release-notes-v1.2.md, docs/user-guide/ (updates)

---

## 4. Schema Additions Required

New tables needed for v1.1/v1.2. All require RLS policies, audit triggers, and `supabase gen types` after migration.

| Table | Sprint | Purpose |
|-------|--------|---------|
| integration_configs | S21 | OAuth tokens, field mappings, sync preferences per integration per company |
| integration_sync_log | S21 | Audit trail for sync operations (direction, record count, errors, duration) |
| company_voice_profiles | S23 | JSONB voice fingerprint per company for anti-homogenization |
| knowledge_graph | S26 | Entity-relationship store (entity_type, name, relationships JSONB) |
| section_comments | S27 | Threaded comments on proposal sections (parent_id for threading) |
| performance_metrics | S19 | Page load, query time, AI response time metrics |
| fine_tune_jobs | S26 | Fine-tuning job status tracking (status, model, training_data_ref, metrics) |

---

## 5. Dependency Chain

| Ticket | Blocks | Risk |
|--------|--------|------|
| T-15.1 (Integrations Hub Shell) | T-21.1, T-22.1, T-22.3, T-24.1, T-25.1, T-25.2 | Must exist before ANY new integration. Already shipped in v1.0 S15. |
| T-10.1 (AskSage Gateway) | T-19.1 (cache), T-19.3 (analytics), T-26.1 (RAG), T-26.5 (fine-tune) | All AI features depend on gateway. Already shipped in v1.0 S10. |
| T-19.1 (Redis Cache) | T-19.3 (analytics dashboard), T-23.4 (benchmarking) | Cache metrics feed analytics. Build cache first. |
| T-20.1/20.2/20.3 (Doc Gen) | T-20.4 (binder), T-22.1 (OneDrive save) | Binder needs all three engines. OneDrive needs DOCX output. |
| T-22.1 (M365 OAuth) | T-22.2 (Calendar/SharePoint), T-27.3 (Teams) | All M365 features share one OAuth connection. |
| T-26.1 (Advanced RAG) | T-26.2 (knowledge graph), T-26.5 (fine-tune data) | Knowledge graph needs chunking pipeline. Fine-tune needs quality retrieval. |

---

## 6. Risk Register

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Third-party API changes (Salesforce, GovWin, M365) | Integration breaks | Medium | Adapter pattern per integration. Version-pin APIs. Health check endpoints. |
| OAuth token management complexity | Auth failures, data loss | Medium | Centralized token refresh in lib/integrations/oauth-manager.ts. Retry with exponential backoff. |
| Real-time collaboration conflicts | Data loss on concurrent edits | High | Section locking (not character-level). Last-save-wins with diff view. Supabase Realtime for presence. |
| Fine-tuning API availability via AskSage | Feature delayed | Medium | Fallback to direct provider fine-tune APIs. Feature flagged for progressive rollout. |
| Scope creep from customer feedback post-launch | Sprint delays | High | v1.1/v1.2 scope locked. Customer requests go to v2.0 backlog unless critical bug. |
| GovWin IQ API access/pricing changes | Integration blocked | Low | SAM.gov as fallback intel source. GovWin is enhancement, not dependency. |

---

**PROPRIETARY — Mission Meets Tech, LLC — February 2026**
