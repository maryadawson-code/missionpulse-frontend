# Performance Baseline — Core Web Vitals

Captured after Sprint 35 performance optimizations.

## Core Web Vitals Targets

| Metric | Target | Rating Threshold (Good / NI) |
|--------|--------|------------------------------|
| CLS    | ≤ 0.1  | ≤ 0.1 / ≤ 0.25              |
| INP    | ≤ 200ms| ≤ 200ms / ≤ 500ms           |
| LCP    | ≤ 2.5s | ≤ 2500ms / ≤ 4000ms         |
| FCP    | ≤ 1.8s | ≤ 1800ms / ≤ 3000ms         |
| TTFB   | ≤ 800ms| ≤ 800ms / ≤ 1800ms          |

## Lighthouse CI Budgets

| Category | Min Score |
|----------|-----------|
| Performance | ≥ 80 |
| Accessibility | ≥ 90 |
| Best Practices | ≥ 90 |
| SEO | ≥ 90 |

## Resource Budgets

| Resource | Max Size (compressed) |
|----------|----------------------|
| Total JS | ≤ 500 KB |
| Total CSS | ≤ 100 KB |
| First Load JS (shared) | 163 KB (current) |

## Sprint 35 Optimizations Applied

| Optimization | Ticket | Impact |
|-------------|--------|--------|
| Code splitting (8 components via next/dynamic) | T-35.1 | Reduced per-route JS |
| Image optimization (next/image + remotePatterns) | T-35.2 | Auto WebP/AVIF, responsive |
| Data fetching (Promise.all, N+1 fix) | T-35.3 | Reduced server response time |
| Loading skeletons (20 routes) | T-35.4 | Eliminated blank screens, reduced CLS |
| Lighthouse CI enforcement | T-35.5 | Regression prevention |

## Environment

- **Date:** 2026-02-28
- **Build:** next build (production)
- **Lighthouse:** Desktop preset, 3 runs median
- **CI:** `npm run lighthouse` via @lhci/cli

## Notes

Run `npm run lighthouse` after building to capture actual scores.
Lighthouse CI runs against `/login` and `/plans` (public pages, no auth required).
Authenticated pages require manual testing or Playwright-based Lighthouse integration.
