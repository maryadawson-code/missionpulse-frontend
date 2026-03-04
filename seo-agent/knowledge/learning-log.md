# MissionPulse SEO Agent Learning Log
**Purpose:** Run-by-run observations. Agent reads this before each new run
to avoid repeating mistakes and build on what worked.

---

## How Agent Uses This File

At the start of each run:
1. Read the last 5 entries
2. Extract standing observations and what-not-to-repeat patterns
3. Adjust fix priority order in strategy.md if traffic data supports it
4. Check for newly discovered pages (new blog posts, landing pages)
5. Proceed with updated strategy

---

## Log Entries

### 2026-03-04 Run #1 (Installation Baseline)

**Pages audited:** /, /plans, /8a-toolkit, /login, /signup
**New pages discovered:** /plans, /8a-toolkit (from sitemap.xml — not in original known-pages list)
**Fixes applied:** 0 (baseline run — observation only)
**Proposals created:** 0
**Plausible data available:** no (PLAUSIBLE_API_KEY not set)
**Regressions detected:** no

**What was found:**
- Homepage (/) grades A (9/10) — SoftwareApplication + Organization schema already present, title 52 chars, description 160 chars, canonical correct, single H1
- Homepage missing og:image — only OG gap. 4 of 5 OG tags present (og:title, og:description, og:url, og:site_name) but no og:image
- /plans grades B — has SoftwareApplication schema, good title/description/canonical/H1, but missing 3 OG tags (og:description, og:url, og:image) and no FAQPage schema
- /8a-toolkit grades B — same OG gaps as /plans, no FAQPage schema
- /features, /pricing, /about, /demo all redirect 307 to /login — these are dashboard routes, NOT public pages
- The public pricing page is /plans, not /pricing — strategy.md keyword table needs updating
- /8a-toolkit is a high-value landing page for "8(a) proposal management software" — not in original keyword targets
- sitemap.xml and robots.txt both properly configured
- No images on homepage (0 <img> tags) — likely CSS backgrounds or SVG inline

**What was fixed this run:**
- Nothing — baseline observation run

**Traffic correlation from prior run:** N/A (first run)

**Competitive signal:** none observed

**Strategy updates made:**
- Page inventory corrected: public pages are /, /plans, /8a-toolkit, /login, /signup
- /features, /pricing, /about, /demo are behind auth — removed from active audit targets

**What to prioritize next run:**
- Add og:image to all public pages (/, /plans, /8a-toolkit)
- Complete OG tag set on /plans and /8a-toolkit (og:description, og:url missing)
- Add FAQPage schema to /plans if FAQ content exists on the page
- Add /8a-toolkit to keyword targets in strategy.md
- Set up Plausible API key for traffic correlation

**New standing rule:**
- /plans is the public pricing page, not /pricing — always check /plans for pricing SEO
- /8a-toolkit exists as a dedicated landing page for 8(a) small business audience — high GovCon SEO value

---

### 2026-03-04 Run #1 Follow-up (Pre-approved Fixes)

**Pages audited:** /, /plans, /8a-toolkit (code review — not curl-based)
**New pages discovered:** none
**Fixes applied:** 3
**Proposals created:** 2 (FAQ section for /plans, og-image.png asset)
**Plausible data available:** no
**Regressions detected:** no

**What was found:**
- Baseline audit over-reported OG gaps on /plans and /8a-toolkit. The curl-based audit missed og:description and og:url because Next.js renders them server-side during hydration. The actual source code already had og:title, og:description, and og:url in the metadata export. Only og:image was truly missing on all three public pages.
- No og-image.png asset exists anywhere in the repo or on the live site. /logo.png referenced in Organization schema also returns 404.
- /plans has no FAQ-style Q&A content — only trust badges and a sales contact link. Cannot construct FAQPage schema without fabricating questions.

**What was fixed this run:**
- og:image added to app/layout.tsx (root — inherits to all pages) — commit 5da462c
- og:image added to app/(public)/plans/page.tsx — commit 5da462c
- og:image added to app/(public)/8a-toolkit/page.tsx — commit 5da462c

**Traffic correlation from prior run:** N/A (first fixes, no 30-day baseline)

**Competitive signal:** none observed

**Strategy updates made:**
- /plans grade upgraded B → A (OG tags now complete)
- /8a-toolkit grade upgraded B → A (OG tags now complete)

**What to prioritize next run:**
- Create og-image.png (1200x630) — og:image tags point to it but the file doesn't exist
- Fix /logo.png 404 — referenced in Organization schema but returns 404
- Add FAQ section + FAQPage schema to /plans (proposal created, awaiting approval)
- Set up Plausible API key for traffic correlation

**New standing rule:**
- curl-based audits can miss Next.js metadata that's only rendered at SSR time. Always verify OG gaps by reading the source code metadata export, not just curling the HTML.
- og:image is structurally the most impactful OG fix for LinkedIn/Slack shares — GovCon buyers share links frequently in these channels.
