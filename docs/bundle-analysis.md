# Bundle Analysis — MissionPulse

**Date:** 2026-02-28
**Sprint:** S35 T-35.1

## How to Run

```bash
npm run analyze
```

Opens browser tabs with client and server bundle analysis (via `@next/bundle-analyzer`).

## Baseline (Post Code-Splitting)

### First Load JS Shared by All Routes: 163 KB

### Code-Split Components

| Component | Library | Lazy-Loaded From | Benefit |
|-----------|---------|-----------------|---------|
| KanbanView | @hello-pangea/dnd | pipeline/page.tsx | Only loads on `?view=kanban` |
| SwimlaneBoard | @hello-pangea/dnd | swimlane/page.tsx | Only loads on swimlane route |
| AnalyticsDashboard | recharts | analytics/page.tsx | Charts only load on analytics |
| ActivityLog | supabase realtime | war-room/[id]/page.tsx | Deferred realtime subscription |
| GanttTimeline | — | proposals/[id]/timeline/page.tsx | Isolated to timeline route |
| WorkBreakdownMatrix | — | proposals/[id]/breakdown/page.tsx | Isolated to breakdown route |
| RfpUploader | — | shredder/page.tsx | Isolated to shredder route |
| RfpDocumentList | — | shredder/page.tsx | Isolated to shredder route |

### Top Route Sizes (First Load JS)

| Route | Size | Shared |
|-------|------|--------|
| /pipeline | 4.51 KB | 163 KB |
| /war-room/[id] | 6.33 KB | 163 KB |
| /analytics | 3.70 KB | 163 KB |
| /pipeline/[id]/swimlane | 5.36 KB | 163 KB |
| /proposals/[id]/timeline | 4.99 KB | 163 KB |
| /proposals/[id]/breakdown | 4.08 KB | 163 KB |

## Notes

- All dynamically imported components include skeleton loading fallbacks
- `@hello-pangea/dnd` is the heaviest client dependency — only loaded on Kanban/Swimlane pages
- `recharts` is only loaded on analytics pages via AnalyticsDashboard
- Shared chunk (163 KB) includes React, Next.js runtime, and common UI components
