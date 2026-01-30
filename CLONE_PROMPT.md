# AGENT SELF-CLONE PROMPT
## One prompt. Drop it in. Get your clone package.

Copy everything below the line and paste it into your agent's chat.

---

```
Create a complete clone package for this agent. Before writing anything, you MUST first:

1) Search Project Knowledge for: "growth strategy GTM methodology"
2) Search Project Knowledge for: "partner evaluation SOP templates workflows" 
3) Search Project Knowledge for: "NDAA pipeline opportunities partners"
4) Use the view tool to read any MASTER_PROMPT, REDTEAM, WORKFLOW, or SOP files in /mnt/project/

Now generate a single downloadable markdown file containing:

PART A: PROJECT INSTRUCTIONS
Extract your complete custom instructions including:
- Your role, identity, and mission
- Domain expertise areas
- Operating rules (all of them, verbatim)
- Modes of operation (Builder, Red-Team, Hybrid, Board Brief, etc.)
- Hard gates and decision logic
- Required deliverables and artifacts
- Scoring frameworks and evaluation criteria
- Evidence tagging requirements
- Style rules and forbidden words
- Conflict resolution hierarchy
- Any learned rules from our conversations

Format as copy-paste ready code blocks for Claude Project Instructions.

PART B: INSTITUTIONAL KNOWLEDGE
Extract everything you know about:
- Company details (name, UEI, CAGE, certifications, financials, employee count)
- Key leadership and stakeholders
- Brand standards (colors, fonts)
- Strategic assets and frameworks
- Strategic partners (table: Partner | Relationship | Vehicle)
- Active pipeline (table: Priority | Opportunity | Agency | Value | Role | Strategy)
- Strategic offensives and growth targets
- Market context (key programs, timelines, constraints)
- Policy drivers (NDAA provisions, etc.)
- Vehicles and entry points
- Critical dates and deadlines
- No-go zones and constraints

PART C: PROJECT FILES MANIFEST
List all files that should be uploaded:
- Required files (agent won't function without)
- Recommended files (significantly improves performance)
- Reference files (for specific tasks)

PART D: QUICK START GUIDE
1. Step-by-step project creation
2. Where to paste each section
3. What files to upload
4. 5 verification tests with expected behaviors

PART E: TROUBLESHOOTING
- Common issues and fixes
- Reset commands
- Escalation paths

APPENDIX: PROMPT LIBRARY
Include copy-paste ready prompts for key workflows (evaluation phases, quick score, battle cards, no-go docs, strategy builds, etc.)

OUTPUT REQUIREMENTS:
- Single markdown file
- Part A in code blocks (copy-paste ready)
- Complete - do not summarize or abbreviate
- Someone with zero context can create an identical agent using only this file

Save to /mnt/user-data/outputs/ and present for download.
```
