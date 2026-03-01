# Changelog

All notable changes to MissionPulse are documented in this file.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
This project adheres to [Semantic Versioning](https://semver.org/).

## [1.6.0] — 2026-02-28 (Production Polish)

### Added
- 178 new unit tests (277 → 455 total) across 14 new test files
- RBAC hooks tests (useRole, useModuleAccess, useVisibleNav) with fail-closed verification
- Role × module permission matrix spot-checks (internal/external boundary, CUI watermark, gate authority)
- Integration test stubs: Salesforce sync, Slack notifications, GovWin import
- Utility tests: validation schemas, activity helpers, structured logger
- Semantic cache company isolation tests (CMMC SC-4)
- Dependabot grouped updates (major/minor separation) + GitHub Actions ecosystem monitoring
- Weekly CI cron schedule for health checks

### Changed
- Semantic cache keys now include companyId to prevent cross-tenant cache hits (CMMC SC-4)
- Cron daily route rewritten: N+1 queries → batched Promise.all with .in() (6 queries vs 7×N)
- revalidatePath('/') replaced with targeted paths across 5 files (11 occurrences)
- 8 legacy test files migrated from custom async runner to Vitest format
- Stripe webhook console.error migrated to structured logger
- vitest.config.ts tsconfigPaths fixed to resolve @/ aliases in tests/ directory

### Security
- Cache isolation: companyId is first segment of all AI cache keys (SC-4 compliance)
- All external roles verified: no admin, no pipeline, forced CUI watermark, 1hr session timeout
- SQL injection in role strings safely resolves to 'partner' (most restrictive)

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
