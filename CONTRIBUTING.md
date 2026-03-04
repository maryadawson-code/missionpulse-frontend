# Contributing to MissionPulse

Thank you for contributing to **MissionPulse** -- the GovCon proposal management platform by Mission Meets Tech. This guide covers everything you need to get started.

---

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | 20+ | `node -v` to check |
| npm | 10+ | Ships with Node 20. **Do not use yarn or pnpm.** |
| Playwright browsers | latest | `npx playwright install` (Chromium is the only E2E target) |

You will also need a **Supabase** project with the MissionPulse schema loaded. Ask the project owner for the anon key and service role key.

---

## Getting Started

```bash
# 1. Clone the repo
git clone https://github.com/mission-meets-tech/missionpulse-frontend.git
cd missionpulse-frontend

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Open .env.local and fill in the required values (Supabase URL, keys, etc.)

# 4. Install Playwright browsers (needed for E2E tests)
npx playwright install

# 5. Start the development server
npm run dev
# Open http://localhost:3000
```

---

## Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `npm run dev` | Start Next.js dev server on port 3000 |
| `build` | `npm run build` | Production build |
| `start` | `npm run start` | Serve the production build |
| `lint` | `npm run lint` | ESLint (next lint) |
| `test` | `npm test` | Run Vitest in watch mode |
| `test:coverage` | `npm run test:coverage` | Vitest with V8 coverage report |
| `test:ui` | `npm run test:ui` | Vitest browser UI |
| `test:e2e` | `npm run test:e2e` | Playwright E2E tests |
| `analyze` | `npm run analyze` | Next.js bundle analyzer |
| `lighthouse` | `npm run lighthouse` | Lighthouse CI audit (requires production build) |

---

## Branch Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Production -- auto-deploys to Vercel |

### Working on a feature or fix

1. Create a branch from `main`.
2. Use the naming convention below.
3. Push and open a PR back to `main`.
4. CI must pass before merge.

### Branch naming

```
feat/short-description     # New feature
fix/short-description      # Bug fix
chore/short-description    # Maintenance / tooling
docs/short-description     # Documentation only
```

---

## Code Conventions

### General

- **Server Components by default.** Only add `'use client'` when the component needs hooks, event handlers, or browser APIs.
- **`'use server'`** at the top of every server action file.
- **TypeScript strict** -- no `as any`. Types are derived from `Database['public']['Tables']` in `lib/supabase/database.types.ts`.
- **Tailwind CSS** for all styling. Use the `cn()` helper from `lib/utils.ts` (clsx + tailwind-merge) to merge class names.
- **Brand colors:** navy `#00050F`, cyan `#00E5FA`.

### Components

- **shadcn/ui** components live in `components/ui/`. Use them as building blocks.
- Shared feature components (DataTable, FormModal, ConfirmModal, StatusBadge, PhaseIndicator, ActivityLog) are documented in the project memory.
- Use `DataTable<T>` for any tabular data -- it handles sorting, search, filtering, pagination, and skeleton loading.
- Use `FormModal` with Zod v4 schemas for create/edit dialogs.

### Zod v4

This project uses **Zod v4**. Key differences from v3:

- Import the type guard from `zod/v4/core`: `import type { $ZodType } from 'zod/v4/core'`
- Schema type parameters use `$ZodType<T, T>` (not `z.ZodSchema<T>`).
- Do **not** chain `.optional().default()` -- use plain `.trim()` or required fields for FormModal compatibility.

### Imports

- Use `@/` path aliases (configured in tsconfig.json).
- Group imports: React/Next, third-party, local (`@/lib`, `@/components`), types.

---

## Testing

### Unit Tests (Vitest)

- **Config:** `vitest.config.ts` -- jsdom environment, V8 coverage, `@testing-library/jest-dom` matchers.
- **Setup file:** `tests/setup.ts` -- auto-mocks `next/navigation`, `next/cache`, and `@supabase/ssr`.
- **File pattern:** `**/*.test.ts` and `**/*.test.tsx`
- **Run:** `npx vitest run` (single pass) or `npm test` (watch mode).
- **Coverage:** `npm run test:coverage` -- reports to `coverage/` in text, lcov, and json-summary formats.

```bash
# Run all unit tests
npx vitest run

# Run a specific test file
npx vitest run lib/security/__tests__/sanitize.test.ts

# Run with coverage
npm run test:coverage
```

#### Writing unit tests

- Place tests next to the source in a `__tests__/` directory or co-locate as `*.test.ts`.
- Use `vi.mock()` **before** imports when mocking modules.
- Supabase clients are automatically mocked in the setup file -- no real DB calls in unit tests.

### E2E Tests (Playwright)

- **Config:** `playwright.config.ts` -- Chromium only, sequential (auth tests depend on order), auto-starts dev server.
- **Test directory:** `tests/e2e/`
- **File pattern:** `*.spec.ts`
- **Run:** `npx playwright test`

```bash
# Run all E2E tests
npx playwright test

# Run with visible browser
npx playwright test --headed

# View HTML report
npx playwright show-report
```

### Lighthouse CI

```bash
# Requires a production build first
npm run build
npm run lighthouse
```

Budgets enforced: performance >= 0.8, accessibility >= 0.9, best-practices >= 0.9, SEO >= 0.9. Core Web Vitals: LCP < 2.5s, CLS < 0.1, TBT < 200ms.

---

## PR Process

1. **Create a feature branch** from `main`.
2. **Make your changes.** Keep commits focused and atomic.
3. **Run the full check locally:**
   ```bash
   npm run lint && npx vitest run && npm run build
   ```
4. **Open a PR** with a clear description of what changed and why.
5. **CI runs automatically:** build, lint (0 warnings), unit tests, E2E tests, Lighthouse audit.
6. **Code review** -- at least one approval required.
7. **Merge** via squash or merge commit.

---

## Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/) format:

```
feat(pipeline): add bulk status update action
fix(auth): handle expired refresh token redirect
chore: upgrade @supabase/ssr to 0.8.0
docs: add deployment troubleshooting section
refactor(rbac): extract permission resolver to shared util
test(sanitize): add XSS edge case coverage
```

### Prefixes

| Prefix | Use for |
|--------|---------|
| `feat(module)` | New feature or capability |
| `fix(module)` | Bug fix |
| `chore` | Dependencies, tooling, config |
| `docs` | Documentation only |
| `refactor(module)` | Code restructuring (no behavior change) |
| `test(module)` | Adding or updating tests |
| `perf(module)` | Performance improvement |

The `(module)` scope is optional but encouraged. Common scopes: `pipeline`, `auth`, `rbac`, `war-room`, `shredder`, `compliance`, `ai`, `billing`, `integrations`.

---

## Security Checklist

Before submitting a PR that touches data reads or writes, verify:

- [ ] **Input sanitized** -- all user-provided strings pass through `sanitizeHtml()` or `sanitizePlainText()` (from `lib/security/sanitize.ts`) at write boundaries
- [ ] **RBAC enforced** -- module permission checked via `getModulePermission()` or `useModuleAccess()` before rendering data or executing actions
- [ ] **Audit trail** -- mutations call `logAudit()` (immutable `audit_logs` table) and `logActivity()` (user-visible `activity_log` table) from `lib/actions/audit.ts`
- [ ] **No CUI leakage** -- controlled unclassified information never appears in error messages, client-side logs, or Sentry events
- [ ] **No secrets in code** -- API keys, tokens, and credentials live in `.env.local` only (never committed)
- [ ] **RLS active** -- any new Supabase tables have Row Level Security enabled

---

## Project Structure

```
app/
  (dashboard)/          # Authenticated routes (layout enforces auth + RBAC)
    pipeline/           # Opportunity pipeline (table, kanban, detail)
    war-room/           # Proposal war room (swimlane, team, activity)
    admin/              # Admin-only pages
  (auth)/               # Login, signup, reset-password
  api/                  # API routes (cron, webhooks, auth callback)
components/
  ui/                   # shadcn/ui base + shared components (DataTable, FormModal, etc.)
  layout/               # Sidebar, DashboardHeader, SessionTimeoutGuard
  features/             # Feature-specific components organized by domain
lib/
  supabase/             # Supabase clients (server, client, admin) + database types
  rbac/                 # RBAC config, helpers, hooks
  actions/              # Server actions (CRUD, audit)
  security/             # Sanitization, rate limiting, CSP
  ai/                   # AI provider clients and routing
  billing/              # Stripe checkout and webhooks
  integrations/         # Third-party integrations (Salesforce, M365, Slack, etc.)
  types/                # Domain types derived from database schema
  utils/                # Shared utilities (validation, activity, perf)
tests/
  e2e/                  # Playwright E2E specs
  setup.ts              # Vitest global setup (mocks)
```

---

## Environment Variables

See `.env.example` for the full list with descriptions. At minimum you need:

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (server-side only) |
| `NEXT_PUBLIC_SITE_URL` | Yes | Canonical site URL |

All other variables (Stripe, AI providers, integrations) are optional and enable their respective features when set.

---

## Need Help?

- Check `ARCHITECTURE.md` for system design details.
- Check `DEPLOYMENT.md` for deploy and infrastructure guidance.
- Open an issue or reach out to the project owner.
