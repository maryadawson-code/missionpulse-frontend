# ============================================================
# MissionPulse Legacy File Cleanup Script
# Mission Meets Tech — Proprietary
# Date: 2026-02-19
# Purpose: Archive ~180 legacy/duplicate HTML files
# Safety: ARCHIVE ONLY — nothing is deleted
# ============================================================

# HARD GATE: Must be in the right directory
$repoPath = "C:\Users\MaryWomack\Desktop\missionpulse-frontend"
Set-Location $repoPath
Write-Host "`n=== MissionPulse Legacy Cleanup ===" -ForegroundColor Cyan
Write-Host "Repo: $repoPath" -ForegroundColor DarkGray

# ============================================================
# STEP 1: Build the CANONICAL file list (files that STAY)
# ============================================================

# --- A. Supporting pages (not in dashboard nav) ---
$supportingPages = @(
    "index.html",
    "login.html",
    "signup.html",
    "dashboard-v2.html",
    "404.html",
    "privacy.html",
    "terms.html",
    "reset-password.html",
    "accept-invite.html",
    "request-access.html"
)

# --- B. 28 modules delivered Feb 19 (linked from dashboard-v2.html) ---
$newModules = @(
    "pipeline-kanban.html",
    "capture-command.html",
    "win-theme-builder.html",
    "black-hat-review.html",
    "competitor-intel.html",
    "rfp-shredder.html",
    "compliance-checker.html",
    "compliance-matrix.html",
    "outline-builder.html",
    "section-writer.html",
    "past-performance.html",
    "document-library.html",
    "boe-builder.html",
    "pricing-calculator.html",
    "teaming-manager.html",
    "resume-matcher.html",
    "color-team-reviews.html",
    "hitl-queue.html",
    "orals-studio.html",
    "review-tracker.html",
    "pipeline-analytics.html",
    "win-loss-analysis.html",
    "token-usage.html",
    "agent-hub.html",
    "chat-console.html",
    "slide-generator.html",
    "audit-log.html",
    "admin-companies.html"
)

# --- C. Dynamic extraction: Parse dashboard-v2.html for ANY href we missed ---
$dashboardLinks = @()
if (Test-Path "dashboard-v2.html") {
    $content = Get-Content "dashboard-v2.html" -Raw
    $matches = [regex]::Matches($content, "href=['""]([^'""#]+\.html)['""]")
    foreach ($m in $matches) {
        $linked = $m.Groups[1].Value
        # Strip any path prefix, keep just filename
        $linked = Split-Path $linked -Leaf
        if ($linked -and $dashboardLinks -notcontains $linked) {
            $dashboardLinks += $linked
        }
    }
    Write-Host "Extracted $($dashboardLinks.Count) unique hrefs from dashboard-v2.html" -ForegroundColor Green
}

# --- D. JS/CSS/Config files (always keep) ---
$jsFiles = @(
    "supabase-client.js",
    "missionpulse-nav.js",
    "rbac-guard.js",
    "ai-chat-widget.js",
    "render-api-client.js"
)

$configFiles = @(
    "netlify.toml",
    "roles_permissions_config.json",
    "missionpulse_playbook.json",
    "rockit_playbook_v2.json",
    "tokens.json",
    "MISSIONPULSE_V12_DESIGN_SYSTEM.css",
    "MISSIONPULSE_V12_DEMO_DATA.json"
)

# --- E. Brand assets (keep all MMT_* and brand PDF) ---
# These are handled by wildcard below

# --- F. Compliance docs (keep all .docx, .xlsx, .mermaid) ---
# These are handled by extension below

# --- G. Backend files (keep all .py, .yml) ---
# These are handled by extension below

# ============================================================
# STEP 2: Merge into single KEEP set (case-insensitive)
# ============================================================

$keepFiles = @()
$keepFiles += $supportingPages
$keepFiles += $newModules
$keepFiles += $dashboardLinks
$keepFiles += $jsFiles
$keepFiles += $configFiles

# De-duplicate (case-insensitive)
$keepSet = $keepFiles | Sort-Object -Unique

Write-Host "`nCanonical file count: $($keepSet.Count)" -ForegroundColor Cyan

# ============================================================
# STEP 3: Extensions that are ALWAYS kept (never archived)
# ============================================================

$keepExtensions = @(".py", ".yml", ".yaml", ".docx", ".xlsx", ".mermaid", ".pdf", ".png", ".json", ".css", ".toml")

# ============================================================
# STEP 4: Identify files to ARCHIVE
# ============================================================

$allFiles = Get-ChildItem -File | Where-Object { $_.Name -ne ".gitignore" -and $_.Name -ne ".git" }
$archiveList = @()
$keepList = @()

foreach ($file in $allFiles) {
    $ext = $file.Extension.ToLower()
    $name = $file.Name
    
    # Always keep: non-HTML/JS extensions (Python, docs, images, config)
    if ($keepExtensions -contains $ext) {
        $keepList += $name
        continue
    }
    
    # Always keep: files in the canonical set
    if ($keepSet -contains $name) {
        $keepList += $name
        continue
    }
    
    # Always keep: JS files in the canonical JS list
    if ($ext -eq ".js" -and $jsFiles -contains $name) {
        $keepList += $name
        continue
    }
    
    # Always keep: JSX files (React components)
    if ($ext -eq ".jsx") {
        $keepList += $name
        continue
    }
    
    # Everything else → ARCHIVE
    $archiveList += $name
}

# ============================================================
# STEP 5: Pre-flight report (DRY RUN)
# ============================================================

Write-Host "`n=== PRE-FLIGHT REPORT ===" -ForegroundColor Yellow
Write-Host "Total files in repo:     $($allFiles.Count)" -ForegroundColor White
Write-Host "Files to KEEP:           $($keepList.Count)" -ForegroundColor Green
Write-Host "Files to ARCHIVE:        $($archiveList.Count)" -ForegroundColor Red

Write-Host "`n--- FILES TO ARCHIVE ---" -ForegroundColor Red
$archiveList | ForEach-Object { Write-Host "  $_" -ForegroundColor DarkRed }

Write-Host "`n--- FILES TO KEEP ---" -ForegroundColor Green
$keepList | ForEach-Object { Write-Host "  $_" -ForegroundColor DarkGreen }

# ============================================================
# STEP 6: Confirm before executing
# ============================================================

$confirm = Read-Host "`nArchive $($archiveList.Count) files to /archive/legacy/? (y/n)"
if ($confirm -ne "y") {
    Write-Host "Aborted. No files moved." -ForegroundColor Yellow
    exit
}

# ============================================================
# STEP 7: Execute archive
# ============================================================

$archiveDir = Join-Path $repoPath "archive\legacy"
if (-not (Test-Path $archiveDir)) {
    New-Item -ItemType Directory -Path $archiveDir -Force | Out-Null
    Write-Host "Created: $archiveDir" -ForegroundColor Cyan
}

$moved = 0
foreach ($file in $archiveList) {
    $src = Join-Path $repoPath $file
    $dst = Join-Path $archiveDir $file
    if (Test-Path $src) {
        Move-Item -Path $src -Destination $dst -Force
        $moved++
    }
}

Write-Host "`n=== CLEANUP COMPLETE ===" -ForegroundColor Green
Write-Host "Files archived: $moved" -ForegroundColor Green
Write-Host "Archive location: $archiveDir" -ForegroundColor DarkGray

# ============================================================
# STEP 8: Git commit
# ============================================================

$commitConfirm = Read-Host "Commit and push? (y/n)"
if ($commitConfirm -eq "y") {
    git add -A
    git commit -m "CLEANUP: Archive $moved legacy files to /archive/legacy/ — zero canonical files touched"
    git push origin (git rev-parse --abbrev-ref HEAD)
    Write-Host "Pushed." -ForegroundColor Green
}

Write-Host "`n--- Done. AI GENERATED - REQUIRES HUMAN REVIEW ---" -ForegroundColor DarkGray
