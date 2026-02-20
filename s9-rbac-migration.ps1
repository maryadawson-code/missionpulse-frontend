# S9: RBAC Migration — rbac-guard.js → mp-rbac.js
# Run from: C:\Users\MaryWomack\Desktop\missionpulse-frontend
# WHAT THIS DOES:
#   1. Fixes missionpulse-nav.js mismatched anon key
#   2. Removes rbac-guard.js from public pages
#   3. Removes duplicate rbac-guard.js from pipeline-kanban
#   4. Replaces rbac-guard.js → mp-rbac.js on module pages
#   5. Adds mp-trial-banner.js to all authenticated pages
#   6. Single commit + push

Write-Host "`n=== S9: RBAC MIGRATION ===" -ForegroundColor Cyan

# ── SAFETY: Confirm directory ──
$expectedDir = "C:\Users\MaryWomack\Desktop\missionpulse-frontend"
if ((Get-Location).Path -ne $expectedDir) {
    Write-Host "[ERROR] Not in missionpulse-frontend! Run: cd $expectedDir" -ForegroundColor Red
    exit 1
}

# ── STEP 1: Fix missionpulse-nav.js anon key ──
Write-Host "`n[1/6] Fixing missionpulse-nav.js anon key..." -ForegroundColor Yellow
if (Test-Path "missionpulse-nav.js") {
    $navContent = Get-Content "missionpulse-nav.js" -Raw
    # Replace wrong Supabase URL + key with correct ones
    $navContent = $navContent -replace 'https://qdrtpnpnhkxvfmvfziop\.supabase\.co', 'https://djuviwarqdvlbgcfuupa.supabase.co'
    # Replace the qdrt anon key JWT with the djuvi anon key JWT
    $navContent = $navContent -replace 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkcnRwbnBuaGt4dmZtdmZ6aW9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc1NTc1OTYsImV4cCI6MjA1MzEzMzU5Nn0\.[A-Za-z0-9_-]+', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqdXZpd2FycWR2bGJnY2Z1dXBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc4MzUyMjQsImV4cCI6MjA1MzQxMTIyNH0.pBPL9l2zL7LLd_A5I--hPBzw5YwG3ajPMtbYsqsxIgQ'
    Set-Content "missionpulse-nav.js" $navContent -NoNewline
    Write-Host "  Fixed anon key in missionpulse-nav.js" -ForegroundColor Green
} else {
    Write-Host "  [SKIP] missionpulse-nav.js not found" -ForegroundColor Yellow
}

# ── STEP 2: Remove RBAC from public pages ──
Write-Host "`n[2/6] Removing RBAC scripts from public pages..." -ForegroundColor Yellow
$publicPages = @('login.html','signup.html','reset-password.html','404.html','privacy.html','terms.html','accept-invite.html','request-access.html','demo-guide.html')
foreach ($page in $publicPages) {
    if (Test-Path $page) {
        $content = Get-Content $page -Raw
        $original = $content
        # Remove any rbac-guard.js or mp-rbac.js script tags
        $content = $content -replace '<script\s+src="rbac-guard\.js"[^>]*></script>\s*\n?', ''
        $content = $content -replace '<script\s+src="mp-rbac\.js"[^>]*></script>\s*\n?', ''
        if ($content -ne $original) {
            Set-Content $page $content -NoNewline
            Write-Host "  Cleaned: $page" -ForegroundColor Green
        }
    }
}

# ── STEP 3: Fix pipeline-kanban.html duplicate ──
Write-Host "`n[3/6] Fixing pipeline-kanban.html duplicate RBAC..." -ForegroundColor Yellow
if (Test-Path "pipeline-kanban.html") {
    $content = Get-Content "pipeline-kanban.html" -Raw
    # Remove all rbac-guard.js references (it already has mp-rbac.js)
    $content = $content -replace '<script\s+src="rbac-guard\.js"[^>]*></script>\s*\n?', ''
    Set-Content "pipeline-kanban.html" $content -NoNewline
    Write-Host "  Cleaned pipeline-kanban.html" -ForegroundColor Green
}

# ── STEP 4: Replace rbac-guard.js → mp-rbac.js on all module pages ──
Write-Host "`n[4/6] Migrating rbac-guard.js → mp-rbac.js..." -ForegroundColor Yellow
$migrated = 0
$htmlFiles = Get-ChildItem -Path . -Filter "*.html" -File |
    Where-Object { $publicPages -notcontains $_.Name }

foreach ($file in $htmlFiles) {
    $content = Get-Content $file.FullName -Raw
    if ($content -match 'rbac-guard\.js') {
        $content = $content -replace 'rbac-guard\.js', 'mp-rbac.js'
        Set-Content $file.FullName $content -NoNewline
        $migrated++
        Write-Host "  Migrated: $($file.Name)" -ForegroundColor Green
    }
}
Write-Host "  Total migrated: $migrated files" -ForegroundColor Cyan

# ── STEP 5: Add mp-trial-banner.js to authenticated pages ──
Write-Host "`n[5/6] Deploying mp-trial-banner.js to authenticated pages..." -ForegroundColor Yellow
$bannerAdded = 0
foreach ($file in $htmlFiles) {
    $content = Get-Content $file.FullName -Raw
    # Skip if already has trial banner
    if ($content -match 'mp-trial-banner\.js') { continue }
    # Skip public pages (already excluded above)
    # Add before </body> if the page has mp-rbac.js (authenticated page)
    if ($content -match 'mp-rbac\.js') {
        $content = $content -replace '</body>', '  <script src="mp-trial-banner.js"></script>`n</body>'
        Set-Content $file.FullName $content -NoNewline
        $bannerAdded++
    }
}
Write-Host "  Added trial banner to $bannerAdded files" -ForegroundColor Green

# ── STEP 6: Commit + Push ──
Write-Host "`n[6/6] Committing..." -ForegroundColor Yellow
git add -A
git commit -m "S9: RBAC migration — rbac-guard.js to mp-rbac.js, nav key fix, trial banner deploy"
git push origin main

# ── SUMMARY ──
Write-Host "`n=== S9 COMPLETE ===" -ForegroundColor Green
Write-Host "  Nav key fixed: missionpulse-nav.js"
Write-Host "  Public pages cleaned: $($publicPages.Count)"
Write-Host "  Module pages migrated: $migrated"
Write-Host "  Trial banner deployed: $bannerAdded"
Write-Host "`nRun s9-diagnostic.ps1 to verify.`n"
