# MissionPulse Performance Baseline

**Date:** 2026-03-01
**Next.js Version:** 15.x
**Build Command:** `npm run build`
**Analyzer:** `@next/bundle-analyzer` (run via `npm run analyze`)

---

## First Load JS Budget

| Metric | Value | Budget |
|--------|-------|--------|
| First Load JS shared by all | 165 kB | 200 kB |
| Middleware | 160 kB | 200 kB |

---

## Per-Route Bundle Sizes (First Load JS)

### Core Pages

| Route | Page JS | First Load JS | Status |
|-------|---------|---------------|--------|
| /dashboard | 5.0 kB | 181 kB | OK |
| /pipeline | 7.02 kB | 212 kB | OVER |
| /war-room | 0.42 kB | 168 kB | OK |
| /war-room/[id] | 6.33 kB | 227 kB | OVER |
| /compliance | 0.42 kB | 168 kB | OK |
| /proposals | 6.82 kB | 211 kB | OVER |
| /proposals/[id] | 7.32 kB | 183 kB | OK |
| /documents | 7.5 kB | 209 kB | OVER |

### Admin Pages

| Route | Page JS | First Load JS | Status |
|-------|---------|---------------|--------|
| /admin | 2.29 kB | 170 kB | OK |
| /admin/users | 6.59 kB | 212 kB | OVER |
| /admin/settings | 4.41 kB | 178 kB | OK |
| /admin/system-health | 4.98 kB | 179 kB | OK |
| /admin/ai-usage | 4.55 kB | 289 kB | OVER |

### Analytics & AI

| Route | Page JS | First Load JS | Status |
|-------|---------|---------------|--------|
| /analytics | 4.33 kB | 293 kB | OVER |
| /analytics/ai-usage | 2.83 kB | 290 kB | OVER |
| /ai-chat | 12.3 kB | 188 kB | OK |
| /audit | 4.5 kB | 206 kB | OVER |

### Pipeline Detail Pages

| Route | Page JS | First Load JS | Status |
|-------|---------|---------------|--------|
| /pipeline/[id] | 7.47 kB | 212 kB | OVER |
| /pipeline/[id]/compliance | 6.68 kB | 210 kB | OVER |
| /pipeline/[id]/swimlane | 5.38 kB | 239 kB | OVER |
| /pipeline/[id]/team | 5.96 kB | 258 kB | OVER |
| /pipeline/[id]/shredder | 7.5 kB | 209 kB | OVER |
| /pipeline/[id]/strategy | 7.13 kB | 186 kB | OK |

### Public Pages

| Route | Page JS | First Load JS | Status |
|-------|---------|---------------|--------|
| /login | 1.42 kB | 169 kB | OK |
| /signup | 1.53 kB | 169 kB | OK |
| /plans | 3.42 kB | 171 kB | OK |
| /8a-toolkit | 0.74 kB | 168 kB | OK |

---

## Budget Rules

- **Budget:** 200 kB gzipped first-load JS per route
- **OVER:** Routes exceeding 200 kB are flagged for investigation
- **Shared chunk:** 165 kB is the baseline shared by all routes — route-specific JS is the delta

---

## Routes Exceeding 200 kB Budget

| Route | First Load JS | Primary Contributor |
|-------|---------------|---------------------|
| /analytics | 293 kB | Chart.js / recharts bundle |
| /analytics/ai-usage | 290 kB | Chart.js / recharts bundle |
| /admin/ai-usage | 289 kB | Chart.js / recharts bundle |
| /pipeline/[id]/team | 258 kB | Team management + invite modal |
| /pipeline/[id]/swimlane | 239 kB | @hello-pangea/dnd DnD library |
| /war-room/[id] | 227 kB | Combined war room features |
| /pipeline | 212 kB | DataTable + KanbanView + DnD |
| /pipeline/[id] | 212 kB | Detail layout + sub-navigation |
| /admin/users | 212 kB | DataTable + user management |
| /proposals | 211 kB | DataTable + proposal features |
| /pipeline/[id]/compliance | 210 kB | Compliance matrix DataTable |
| /pipeline/[id]/shredder | 209 kB | PDF parser + requirements UI |
| /documents | 209 kB | Document upload + list |
| /audit | 206 kB | Audit log DataTable |

**14 of 60+ routes exceed the 200 kB budget.** Primary contributors are charting libraries (recharts), DnD (@hello-pangea/dnd), and DataTable (@tanstack/react-table). These are expected for data-heavy pages.

---

## Recommendations

1. **Analytics pages (290+ kB):** Consider dynamic import for chart components
2. **DnD pages (239 kB):** Already memoized with React.memo (T-44.3); DnD library is the floor
3. **DataTable pages (206–212 kB):** @tanstack/react-table is already tree-shakeable; these are near optimal
4. **Shared chunk (165 kB):** Monitor for growth — React + Next.js runtime is the bulk

---

**Run `npm run analyze` to generate an interactive bundle visualization.**
