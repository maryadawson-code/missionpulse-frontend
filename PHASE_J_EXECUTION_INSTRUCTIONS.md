# Phase J Upload & Execution Instructions

## What This Is

`ROADMAP_v1_3_DOC_COLLAB.md` defines Phase J: Document Collaboration Loop (v1.3).
3 sprints (S29–S31), 14 tickets (T-29.1 through T-31.4), plus 3 amendments to existing tickets.

This extends the existing roadmap chain:
- Master Roadmap (S3–S18) → v1.0
- ROADMAP_v1_1_v1_2.md (S19–S28) → v1.1 + v1.2
- ROADMAP_GTM_EXTENSION.md (S-GTM-1 through S-GTM-3) → GTM parallel track
- **ROADMAP_v1_3_DOC_COLLAB.md (S29–S31) → v1.3** ← NEW

---

## Step 1: Add to Repository

Run these commands one at a time from your repo root (`~/Desktop/missionpulse-frontend`):

```powershell
git checkout v2-development
```

```powershell
git pull origin v2-development
```

```powershell
cp ~/Downloads/ROADMAP_v1_3_DOC_COLLAB.md ./ROADMAP_v1_3_DOC_COLLAB.md
```

```powershell
git add ROADMAP_v1_3_DOC_COLLAB.md
```

```powershell
git commit -m "docs: add v1.3 Document Collaboration Loop roadmap (S29-S31)"
```

```powershell
git push origin v2-development
```

---

## Step 2: Add to Claude Project Knowledge

Upload `ROADMAP_v1_3_DOC_COLLAB.md` to the MissionPulse.io Builder project knowledge.
This ensures Forge can read the roadmap when executing tickets.

---

## Step 3: Update AGENTS.md

Add this entry to the "Roadmap Files" section of AGENTS.md:

```markdown
### ROADMAP_v1_3_DOC_COLLAB.md
Phase J: Document Collaboration Loop. Sprints 29–31. Depends on S21 (doc gen), S23 (M365), S26 (Google), S28 (collab).
Covers: bidirectional content sync, cross-doc coordination, cloud binder, parallel artifact view, version diffing, proposal timeline, work breakdown board.
7 new tables: document_sync_state, sync_conflicts, coordination_rules, coordination_log, document_versions, proposal_milestones, section_assignments.
```

---

## Step 4: Execute with Claude Code

Phase J depends on S21, S23, S26, and S28 being complete. Execute S29–S31 AFTER those sprints ship.

When ready, open a Claude Code session and say:

```
Execute Sprint 29, starting with ticket T-29.1. 
Read ROADMAP_v1_3_DOC_COLLAB.md for ticket definitions.
Read AGENTS.md and database.types.ts before writing code.
```

For each ticket, Claude Code will:
1. Read the ticket from the roadmap
2. Execute the agent loop (Research → Plan → Implement → Verify → Report)
3. Output complete files with `// filepath:` comments
4. Provide validation command (`npm run build`)

After each ticket passes build:
```powershell
git add .
```
```powershell
git commit -m "feat(sprint-29): T-29.1 — Bidirectional Content Sync Engine"
```
```powershell
git push origin v2-development
```

Then say: `T-29.1 complete. Next ticket.`

---

## Step 5: Process Amendments

The three amendments (A-J1, A-J2, A-J3) modify existing tickets in ROADMAP_v1_1_v1_2.md.
When executing S23 and S26, tell Claude Code:

```
Execute T-23.1 with amendment A-J1 from ROADMAP_v1_3_DOC_COLLAB.md.
Include webhook registration acceptance criteria.
```

```
Execute T-26.1 with amendment A-J2 from ROADMAP_v1_3_DOC_COLLAB.md.
Include Drive push notification acceptance criteria.
```

```
Execute T-21.4 with amendment A-J3 from ROADMAP_v1_3_DOC_COLLAB.md.
Include cloud source option acceptance criteria.
```

---

## Sprint Execution Order

| Sprint | Tickets | Prereqs |
|--------|---------|---------|
| S29 | T-29.1 → T-29.2 → T-29.3 → T-29.4 → T-29.5 | S21, S23+A-J1, S26+A-J2 complete |
| S30 | T-30.1 → T-30.2 → T-30.3 → T-30.4 | S29 complete |
| S31 | T-31.1 → T-31.2 → T-31.3 → T-31.4 | S30 complete, T-28.1 complete |

---

## Schema Migrations

Each sprint introduces new tables. Before the first ticket in each sprint, run:

**Sprint 29:** Create `document_sync_state` and `sync_conflicts` tables
**Sprint 30:** Create `coordination_rules`, `coordination_log`, and `document_versions` tables
**Sprint 31:** Create `proposal_milestones` and `section_assignments` tables

After each migration: `supabase gen types typescript --project-id [ID] > database.types.ts`

Claude Code will include the migration SQL in the first ticket of each sprint.

---

## Verification Checklist

After all Phase J tickets complete:

- [ ] `npm run build` passes with 0 errors
- [ ] All 7 new tables exist with RLS policies
- [ ] Bidirectional sync works for Word, Excel, PPT, Google Docs
- [ ] Cross-document cascade updates correctly (Excel rate → Word + PPT)
- [ ] Cloud binder pulls latest synced versions
- [ ] CUI markings verified on round-trip through all cloud tools
- [ ] Version history tracks all sync events
- [ ] Timeline and work breakdown views render correctly
- [ ] All regression tests pass
- [ ] No service-role keys in client code
- [ ] Staging verified at v2-development--missionpulse-io.netlify.app
