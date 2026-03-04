# MissionPulse Security Audit

**Date:** 2026-03-01
**Auditor:** Automated + manual triage
**npm version:** See `package-lock.json`
**Node version:** See `.nvmrc` or `engines` field

---

## Summary

| Severity | Count | Actionable |
|----------|-------|------------|
| Critical | 0 | — |
| High | 9 | 0 |
| Low | 4 | 0 |
| **Total** | **13** | **0** |

**Result: 0 actionable vulnerabilities.** All remaining HIGHs are transitive dependencies from framework packages (`next`, `eslint-config-next`, `@sentry/nextjs`, `@lhci/cli`) where the fix requires a breaking major version upgrade. The vulnerable code paths are either not reachable from MissionPulse or mitigated by existing configuration.

**Previous:** 14 HIGHs before v1.7. The `xlsx` (SheetJS) package contributed 5 HIGHs and was removed in T-44.1, replaced by ExcelJS (already installed for writing).

---

## HIGH Vulnerabilities — Detailed Triage

### 1. glob — Command Injection via -c/--cmd (GHSA-5j98-mcp5-4vw2)

| Field | Value |
|-------|-------|
| Package | `glob` 10.2.0–10.4.5 |
| Path | `eslint-config-next` → `@next/eslint-plugin-next` → `glob` |
| CVE | GHSA-5j98-mcp5-4vw2 |
| Severity | HIGH |
| Fix available | `eslint-config-next@16.x` (breaking) |
| Reachable | **No** — MissionPulse never invokes `glob` CLI with `-c/--cmd` flags. The `glob` package is used programmatically by ESLint plugin for file pattern matching only. The vulnerable CLI entry point is not called. |
| Risk Assessment | **Accepted** |
| NIST Controls | RA-5 (Vulnerability Monitoring), SI-2 (Flaw Remediation) |
| Mitigation | Upgrade `eslint-config-next` to v16+ when Next.js 16 migration occurs. ESLint only runs in CI/dev, never in production. |

**Contributes 3 HIGH counts** (glob + @next/eslint-plugin-next + eslint-config-next form one chain).

---

### 2. next — Image Optimizer DoS (GHSA-9g9p-9gw9-jx7f)

| Field | Value |
|-------|-------|
| Package | `next` 10.0.0–15.5.9 |
| CVE | GHSA-9g9p-9gw9-jx7f |
| Severity | HIGH |
| Fix available | `next@16.x` (breaking) |
| Reachable | **Mitigated** — Requires self-hosted deployment with `remotePatterns` misconfiguration. MissionPulse deploys on Vercel (managed hosting) where Image Optimizer is handled by Vercel's infrastructure, not the application server. `remotePatterns` is explicitly configured in `next.config.js`. |
| Risk Assessment | **Mitigated** |
| NIST Controls | RA-5, SI-2, SC-5 (Denial of Service Protection) |
| Mitigation | Vercel-managed deployment. Upgrade to Next.js 16 when stable. |

---

### 3. next — HTTP Request Deserialization DoS (GHSA-h25m-26qc-wcjf)

| Field | Value |
|-------|-------|
| Package | `next` 10.0.0–15.5.9 |
| CVE | GHSA-h25m-26qc-wcjf |
| Severity | HIGH |
| Fix available | `next@16.x` (breaking) |
| Reachable | **Mitigated** — Requires "insecure React Server Components" usage pattern. MissionPulse RSC components do not deserialize untrusted user input directly. All user input goes through validated server actions with Zod schemas. |
| Risk Assessment | **Mitigated** |
| NIST Controls | RA-5, SI-2, SI-10 (Information Input Validation) |
| Mitigation | Zod validation on all server action inputs. Upgrade to Next.js 16 when stable. |

**next contributes 2 HIGH counts** (two separate CVEs in the same package).

---

### 4. serialize-javascript — RCE via RegExp.flags (GHSA-5c6j-r48x-rmvq)

| Field | Value |
|-------|-------|
| Package | `serialize-javascript` <=7.0.2 |
| Path | `@sentry/nextjs` → `@sentry/webpack-plugin` → `webpack` → `terser-webpack-plugin` → `serialize-javascript` |
| CVE | GHSA-5c6j-r48x-rmvq |
| Severity | HIGH |
| Fix available | `@sentry/nextjs@7.x` (breaking downgrade — not viable) |
| Reachable | **No** — The vulnerability requires the attacker to control input to `serialize-javascript`. In this dependency chain, `serialize-javascript` is used by `terser-webpack-plugin` during build-time minification to serialize webpack module output. No user-controlled input reaches `serialize-javascript` at build time. |
| Risk Assessment | **Accepted** |
| NIST Controls | RA-5, SI-2 |
| Mitigation | Build-time only dependency. No runtime exposure. Monitor `@sentry/nextjs` releases for patched transitive dependency. |

**Contributes 4 HIGH counts** (serialize-javascript + terser-webpack-plugin + webpack + @sentry/webpack-plugin + @sentry/nextjs form one chain).

---

### 5. tmp — Arbitrary File Write via Symlink (GHSA-52f5-9888-hmc6)

| Field | Value |
|-------|-------|
| Package | `tmp` <=0.2.3 |
| Path | `@lhci/cli` → `inquirer` → `external-editor` → `tmp` |
| CVE | GHSA-52f5-9888-hmc6 |
| Severity | HIGH (counted as LOW by some scanners) |
| Fix available | `@lhci/cli@0.1.0` (breaking downgrade — not viable) |
| Reachable | **No** — `@lhci/cli` is a devDependency used for Lighthouse CI in the CI pipeline. The `tmp` package is used by `external-editor` (interactive editor launcher) which is a feature of `inquirer` (interactive CLI prompts). MissionPulse never invokes `inquirer` interactive prompts — Lighthouse CI runs in non-interactive mode in GitHub Actions. |
| Risk Assessment | **Accepted** |
| NIST Controls | RA-5, SI-2 |
| Mitigation | devDependency only. CI-only usage. Non-interactive mode. Monitor `@lhci/cli` for updated `inquirer` dependency. |

**Contributes 2 HIGH counts** (two `tmp` instances in node_modules).

---

## LOW Vulnerabilities

4 LOW severity vulnerabilities exist in transitive dependencies. These are informational and do not require immediate action.

---

## Remediation Plan

| Action | Timeline | Blocker |
|--------|----------|---------|
| Upgrade `next` to v16 (fixes glob + next HIGHs) | When Next.js 16 is stable | Breaking API changes require migration |
| Upgrade `eslint-config-next` to v16 (fixes glob chain) | Bundled with Next.js 16 upgrade | Same as above |
| Monitor `@sentry/nextjs` releases | Ongoing | Upstream fix for serialize-javascript |
| Monitor `@lhci/cli` releases | Ongoing | Upstream fix for tmp/inquirer |
| Remove `xlsx` package | **DONE** (T-44.1) | — |

---

## NIST Control Mapping

| Control | Description | Status |
|---------|-------------|--------|
| RA-5 | Vulnerability Monitoring | Implemented — `npm audit` in CI, documented triage |
| SI-2 | Flaw Remediation | Implemented — actionable vulns fixed, non-actionable documented |
| SI-10 | Information Input Validation | Implemented — Zod schemas on all server actions |
| SC-4 | Information in Shared Resources | Implemented — cache isolation by companyId (T-43.3) |
| SC-5 | Denial of Service Protection | Mitigated — Vercel-managed hosting, rate limiting |
| SC-13 | Cryptographic Protection | Implemented — Supabase JWT auth, HTTPS enforced |

---

**PROPRIETARY — Mission Meets Tech, LLC — March 2026**
