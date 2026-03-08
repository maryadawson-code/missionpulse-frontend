# MissionPulse Testing Notes

## Test Stack
- **Unit/Integration**: Vitest 4.x with jsdom environment
- **E2E**: Playwright (configured, `tests/e2e/`)
- **Coverage**: @vitest/coverage-v8 with lcov/json-summary reporters

## Commands
```bash
npx vitest run              # All unit/integration tests
npx vitest run --coverage   # With coverage report
npx tsc --noEmit            # Type check
npm run build               # Production build
npm run lint                # ESLint
npx playwright test         # E2E (requires running dev server)
```

## Test Strategy by Layer

### Unit Tests (tests/)
Pure functions, validators, formatters, parsers, deterministic transforms, RBAC config resolution.
- `tests/rbac/permissions.test.ts` — 109 tests covering all role/module/permission combinations
- `tests/utils/` — formatters, storage, exports, CUI watermarks
- `tests/api/schemas-extended.test.ts` — Zod schema validation
- `tests/billing/ledger.test.ts` — Token threshold logic

### Integration Tests (tests/)
Route handlers, server actions, RBAC enforcement, billing state, provider contracts.
- `tests/rbac/server.test.ts` — Server-side RBAC with mocked Supabase (redirect behavior)
- `tests/api/` — Route handler tests with mocked DB
- `tests/billing/` — Checkout, stripe, token gating
- `tests/integrations/` — GovWin, M365, Slack adapter contracts

### E2E Tests (tests/e2e/)
Real user workflows through browser automation.
- Playwright config: `playwright.config.ts`
- Single Chromium project, sequential auth tests

## Coverage Policy

### Scope: `lib/**`
Coverage measures all files under `lib/` except explicitly excluded items.

### Justified Exclusions (vitest.config.ts)
Each exclusion must be one of:
- **Generated code**: `lib/supabase/database.types.ts`, `lib/supabase/types.ts`
- **Framework glue with no business logic**: `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/rbac/index.ts`
- **Thin external-service wrappers**: `lib/ai/providers/{anthropic,asksage,openai,health}.ts`, `lib/integrations/m365/**`, etc.
- **Infrastructure/monitoring**: `lib/monitoring/**`, `lib/testing/**`
- **React context (needs render tests)**: `lib/rbac/RoleContext.tsx`

### NOT excluded (intentionally in scope)
- `lib/rbac/server.ts` — Server-side RBAC enforcement (security-critical)
- `lib/rbac/custom-roles.ts` — Custom role management
- `lib/sync/coordination-engine.ts` — Cross-document sync transforms
- `lib/sync/version-tracker.ts` — Version management
- `lib/onboarding/**` — User onboarding state machine
- `lib/rag/reranker.ts` — Search reranking
- `lib/utils/xml-extractor.ts` — Parser

### Thresholds
- Lines: 50%, Functions: 45%, Branches: 35%
- These reflect honest measurement with business-critical code in scope
- Previously inflated to 60/55/50 by excluding important files

## Known Test Patterns

### Supabase Mock Chain
Tests mock `createClient()` with chained query builder methods:
```typescript
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: ..., error: null }),
    })),
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: ... }, error: null }) },
  }),
}))
```

### vi.mock() Hoisting
`vi.mock()` factories are hoisted above all imports. You cannot reference `const` variables declared outside the factory. Use inline values or `vi.hoisted()`.

## Highest-Risk Modules
1. `lib/billing/ledger.ts` — Token TOCTOU race condition (documented, needs DB-level fix)
2. `lib/rbac/server.ts` — Permission enforcement (well-tested)
3. `app/api/billing/checkout/route.ts` — Now has RBAC gate
4. `app/api/v1/proposals/[id]/route.ts` — Now has tenant scoping
5. `app/api/v1/compliance/[opportunityId]/route.ts` — Now has tenant scoping
