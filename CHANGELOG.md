# Changelog

All notable changes to MissionPulse are documented in this file.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
This project adheres to [Semantic Versioning](https://semver.org/).

## [1.5.0] — 2026-02-28 (Ship-Readiness)

### Added
- GitHub Actions CI pipeline (build, lint, test, Lighthouse)
- 133 new unit tests (140 → 273 total) covering server actions, security, AI, middleware, collaboration
- 11 new E2E specs (RBAC, API routes, error boundaries, sessions)
- Coverage reporting with v8 + lcov + Codecov integration
- Route boundaries (loading/error) for 5 deeply nested routes
- ARCHITECTURE.md, CONTRIBUTING.md, DEPLOYMENT.md, CHANGELOG.md

### Changed
- ESLint zero-warning enforcement (48 warnings → 0)
- Sentry migrated from sentry.client.config.ts → instrumentation-client.ts (Turbopack ready)
- Dependabot configured with grouped updates

### Security
- All console.* in AI modules migrated to structured logger

## [1.4.0] — 2026-02-27 (Production Hardening)

### Added
- Sentry error tracking + structured logging
- Web Vitals monitoring + performance budget
- Redis rate limiting (tiered) + CSP headers + brute force protection
- Input sanitization (DOMPurify)
- Vitest test framework + 140 initial tests
- Accessibility audit + WCAG 2.1 AA fixes
- Code splitting + dynamic imports
- Lighthouse CI performance budgets

### Security
- Content Security Policy with nonce-based scripts
- CUI data scrubbed from Sentry events

## [1.3.0] — 2026-02-25 (Document Collaboration)

### Added
- Track changes with accept/reject workflow
- Real-time document co-editing
- Version history with diff viewer
- Comment threading with @mentions

## [1.2.0] — 2026-02-21 (Data & AI)

### Added
- USAspending + FPDS data integration
- Data migration toolkit
- Google Workspace integration
- DocuSign integration
- RAG pipeline with embeddings
- Knowledge graph
- Proactive AI suggestions
- Fine-tuning pipeline
- Real-time collaboration (presence + section locks)
- Comment system
- Microsoft Teams integration

## [1.1.0] — 2026-02-19 (Integrations)

### Added
- Redis caching layer
- Token billing + usage tracking
- Stripe payment integration (subscriptions + one-time)
- Document generation (PPTX, XLSX, DOCX)
- Salesforce CRM sync
- GovWin opportunity import
- Microsoft 365 integration
- Slack notifications
- Playbook v2 (templates + automation)

## [1.0.0] — 2026-02-17 (Foundation)

### Added
- 16 GovCon modules (Dashboard, Pipeline, War Room, Compliance, Proposals, etc.)
- 8 AI agents (Strategy, Compliance, Writer, Capture, Pricing, Contracts, Orals, BlackHat)
- Supabase Auth (JWT) with auto-profile creation
- RBAC system (12 roles × 14 modules)
- Pipeline Kanban + DataTable views
- RFP Shredder (PDF upload, requirements extraction)
- Compliance Matrix with Iron Dome dashboard
- Contract Scanner with clause analysis
- Dual audit trail (immutable + user-visible)
