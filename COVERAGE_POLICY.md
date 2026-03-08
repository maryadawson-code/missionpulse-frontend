# COVERAGE_POLICY.md
**Status:** AUTHORITATIVE
**Version:** 1.0
**Date:** 2026-03-08
**Scope:** MissionPulse -- all test suites on `v2-development` and `main`
**Enforced by:** `vitest.config.ts` thresholds + CI/CD gate on every PR
**Author:** Forge (Autonomous DevSecOps Agent)

---

## 1. Purpose

This document defines the coverage standards for MissionPulse. It serves as the
enforceable policy that governs what test coverage thresholds are required, how those
thresholds are measured, which areas are exempt from coverage requirements, and what the
escalation path is when thresholds are violated. It replaces informal coverage discussions
and any prior ad-hoc conventions.

---

## 2. Current Coverage State (as of 2026-03-08)

The following numbers come from the `npx vitest run --coverage` command run against HEAD
`d4e426b` on `v2-development`. These are command-output facts, not estimates.

Test files executed: 139
Total test cases: 1546
Failures: 0
Skipped: 0

Coverage was raised from 8% to 67% during the testing sprint that produced commit
`97cf1bd`. The delta reflects 78 new test files written to cover billing, RBAC, API
routes, server actions, and library utilities that had no previous coverage.

---

## 3. Coverage Thresholds (Enforced)

The following thresholds are enforced in `vitest.config.ts` under the `coverage.thresholds`
block. A build that falls below any threshold fails the CI step and blocks merge.

| Metric | Threshold | Rationale |
|--------|-----------|-----------|
| Statements | 65% | Ensures the majority of executable code paths are exercised |
| Branches | 60% | Guards against untested conditional logic (the most common bug surface) |
| Functions | 65% | Catches exported functions that are dead code or silently untested |
| Lines | 65% | Correlates with statement coverage; provides a human-readable sanity check |

These thresholds represent the minimum acceptable floor, not a target. The roadmap target
for v1.1 GA is 80% across all four metrics. The path to 80% is defined in Section 6.

---

## 4. Coverage Tool and Configuration

Coverage is collected using `@vitest/coverage-v8`, which uses V8's native coverage
instrumentation. V8 coverage is more accurate than Istanbul-based instrumentation for
modern TypeScript with complex generics because it measures actual bytecode execution
rather than transpiled source maps.

The provider is configured explicitly in `vitest.config.ts`:

```typescript
// vitest.config.ts (excerpt)
coverage: {
  provider: 'v8',
  reporter: ['text', 'lcov', 'html'],
  thresholds: {
    statements: 65,
    branches: 60,
    functions: 65,
    lines: 65,
  },
  exclude: [
    'node_modules/**',
    '.next/**',
    'coverage/**',
    '**/*.config.{ts,js}',
    '**/*.d.ts',
    'types/**',
    'migrations/**',
    'scripts/**',
    'tests/**',
    'supabase/**',
  ],
},
```

The `lcov` reporter output is consumed by Codecov (or a compatible tool) for pull request
coverage delta reporting. The `html` reporter produces the browseable coverage report
at `coverage/index.html` for local inspection.

---

## 5. Coverage Exemptions

Not every file warrants coverage measurement. The following categories are formally exempt
because requiring coverage on them produces noise without safety signal.

**Configuration files** (`*.config.ts`, `*.config.js`): These files configure tooling, not
application logic. They are tested implicitly by the fact that the build and test suite
run successfully.

**Type declaration files** (`*.d.ts`, `types/**`): Type-only files produce no runtime
code. V8 coverage would report them as 0% because there is no bytecode to execute.

**Database migrations** (`migrations/**`): SQL migrations are tested by running them
against the Supabase staging project and observing schema correctness. Unit tests are
the wrong tool here.

**Generated code** (`database.types.ts`, `.next/**`): These files are outputs of external
processes (`supabase gen types`, `next build`). Testing them would be testing the external
tool, not MissionPulse logic.

**Supabase edge functions** (`supabase/**`): Edge functions run in the Deno runtime and
are tested via the Supabase CLI test harness, not Vitest.

---

## 6. Coverage Roadmap to 80%

The gap between 67% today and 80% target represents approximately 200-300 additional test
cases. The highest-leverage areas -- those with the most uncovered branches per file --
are the following, ordered by risk impact.

**Tier 1 -- Security-critical paths (target: 100%)**

The authentication flow in `app/(auth)/`, the invitation action in
`app/(auth)/join/[token]/actions.ts`, and the session refresh logic in `middleware.ts`
should have 100% branch coverage. These paths were responsible for VULN-001, and any
regression here would be a critical release blocker. The invitation bypass fix added
tests for the happy path; tests for the rejection branches (used invitation, wrong company)
should be added before v1.1 GA.

**Tier 2 -- Billing and token metering (target: 90%)**

The `lib/billing/` directory handles subscription state, token ledger operations, and
pilot-to-annual conversions. Bugs here directly impact revenue. Coverage in this area
should be raised to 90% with explicit tests for boundary conditions: zero balance, exact
balance, balance minus one, concurrent decrement attempts (mocked).

**Tier 3 -- Server actions for core modules (target: 75%)**

The pipeline, proposals, and pricing server actions (`app/(dashboard)/**/actions.ts`) were
the source of VULN-002 and VULN-003. Each action needs at minimum: an authenticated success
test, an unauthenticated rejection test, and a cross-tenant rejection test. This pattern
should be applied uniformly across all 15 modules.

**Tier 4 -- AI query routing (target: 70%)**

The `app/api/v1/ai/query/route.ts` handler routes between AskSage (FedRAMP High CUI) and
the Anthropic fallback. This routing logic needs explicit tests for the CUI detection
branch, the fallback branch, and the rate-limit rejection branch. Mocking both AI clients
in the test environment is straightforward with `vi.mock()`.

---

## 7. Test Conventions

These conventions apply to all test files in the `tests/` directory. They are enforced
by code review, not tooling, so every contributor must internalize them.

Every test file must import the subject under test by its real module path, not a mock.
Use `vi.mock()` only at the boundary (external APIs, Supabase client, environment
variables). Testing the real module against a real interface is what makes tests meaningful.

Every test file for a server action must include at minimum three test cases: one for the
success path, one for the unauthenticated path (where `supabase.auth.getUser()` returns
no user), and one for the authorization failure path (where the user exists but lacks
permission or tenant scope). The cross-tenant test is now mandatory for all actions that
operate on rows scoped to `company_id`, following the pattern established by VULN-002 and
VULN-003 fixes.

Tests must not depend on external network calls, live Supabase connections, or real AI
providers. All external dependencies must be mocked. The test suite must be runnable
offline.

Test descriptions must describe behavior, not implementation. Write
`it('rejects requests from users outside the company')`, not
`it('checks company_id before returning data')`. The first tells you what the system
should do; the second tells you how it currently does it. When the implementation changes
and the behavior is preserved, behavior-described tests continue to pass correctly.

---

## 8. CI/CD Enforcement

Coverage thresholds are enforced automatically on every pull request targeting `main` or
`v2-development`. The CI step that runs `npx vitest run --coverage` will exit with a
non-zero code if any threshold is violated, blocking the merge. This is not advisory.

If a legitimate change causes coverage to drop below a threshold, the correct response
is to write tests for the new code before opening the pull request, not to lower the
threshold. Threshold changes require explicit approval in the PR description with a
written rationale explaining why the lower floor is acceptable.

---

## 9. Version History

| Version | Date | Author | Change |
|---------|------|--------|--------|
| 1.0 | 2026-03-08 | Forge | Initial coverage policy document |
