# MissionPulse Codebase Cleanup Script
# Fixes: rockITdata branding, Supabase URLs, CUI markings
# Run from: C:\Users\MaryWomack\Desktop\missionpulse-frontend
# Date: January 30, 2026

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "MissionPulse Codebase Cleanup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Navigate to project directory
Set-Location "C:\Users\MaryWomack\Desktop\missionpulse-frontend"
Write-Host "`nWorking directory: $(Get-Location)" -ForegroundColor Green

# ============================================================
# STEP 1: Move fixed files from Downloads
# ============================================================
Write-Host "`n[STEP 1] Moving fixed files from Downloads..." -ForegroundColor Yellow

$downloads = "$env:USERPROFILE\Downloads"

# Move fixed supabase-client.js
if (Test-Path "$downloads\supabase-client.js") {
    Move-Item "$downloads\supabase-client.js" . -Force
    Write-Host "  ✓ supabase-client.js updated" -ForegroundColor Green
} else {
    Write-Host "  ! supabase-client.js not found in Downloads" -ForegroundColor Red
}

# Move fixed tokens.json
if (Test-Path "$downloads\tokens.json") {
    Move-Item "$downloads\tokens.json" . -Force
    Write-Host "  ✓ tokens.json updated" -ForegroundColor Green
} else {
    Write-Host "  ! tokens.json not found in Downloads" -ForegroundColor Red
}

# ============================================================
# STEP 2: Replace rockITdata with Mission Meets Tech
# ============================================================
Write-Host "`n[STEP 2] Replacing 'rockITdata' branding..." -ForegroundColor Yellow

$files = Get-ChildItem -Path . -Include "*.html","*.js","*.json","*.py","*.md" -Recurse -File
$replaceCount = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
    if ($content -match "rockITdata") {
        $newContent = $content -replace "rockITdata", "Mission Meets Tech"
        Set-Content -Path $file.FullName -Value $newContent -NoNewline
        $replaceCount++
        Write-Host "  ✓ Fixed: $($file.Name)" -ForegroundColor Green
    }
}
Write-Host "  Total files updated: $replaceCount" -ForegroundColor Cyan

# ============================================================
# STEP 3: Fix Supabase URLs in HTML files
# ============================================================
Write-Host "`n[STEP 3] Fixing Supabase URLs..." -ForegroundColor Yellow

$correctUrl = "https://qdrtpnpnhkxvfmvfziop.supabase.co"
$correctKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkcnRwbnBuaGt4dmZtdmZ6aW9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY3MTcyNjUsImV4cCI6MjA1MjI5MzI2NX0.DACT1xnVtJeHx5tL7_K8y1hOx9NyJE7B6UBhPqwHHx8"

$htmlFiles = Get-ChildItem -Path . -Filter "*.html" -File
$urlFixCount = 0

foreach ($file in $htmlFiles) {
    $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
    $modified = $false
    
    # Replace old Supabase URLs
    if ($content -match "qlbvbfaprymzdqywcsiq\.supabase\.co") {
        $content = $content -replace "https://qlbvbfaprymzdqywcsiq\.supabase\.co", $correctUrl
        $modified = $true
    }
    if ($content -match "djuviwarqdvlbgcfuupa\.supabase\.co") {
        $content = $content -replace "https://djuviwarqdvlbgcfuupa\.supabase\.co", $correctUrl
        $modified = $true
    }
    
    if ($modified) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        $urlFixCount++
        Write-Host "  ✓ Fixed URL: $($file.Name)" -ForegroundColor Green
    }
}
Write-Host "  Total HTML files with URL fixes: $urlFixCount" -ForegroundColor Cyan

# ============================================================
# STEP 4: Rename legacy playbook file
# ============================================================
Write-Host "`n[STEP 4] Renaming legacy files..." -ForegroundColor Yellow

if (Test-Path "rockit_playbook_v2.json") {
    Rename-Item "rockit_playbook_v2.json" "missionpulse_playbook_v2.json" -Force
    Write-Host "  ✓ Renamed: rockit_playbook_v2.json → missionpulse_playbook_v2.json" -ForegroundColor Green
} else {
    Write-Host "  - rockit_playbook_v2.json not found (may already be renamed)" -ForegroundColor Gray
}

# ============================================================
# STEP 5: Git commit and push
# ============================================================
Write-Host "`n[STEP 5] Committing changes..." -ForegroundColor Yellow

git add .
git commit -m "Codebase cleanup: MMT branding, Supabase URLs, tokens refresh"
git push origin main

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Cleanup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

# ============================================================
# VERIFICATION
# ============================================================
Write-Host "`n[VERIFICATION] Checking for remaining issues..." -ForegroundColor Yellow

$remaining = Select-String -Path "*.html","*.js","*.json","*.py" -Pattern "rockITdata" -SimpleMatch 2>$null
if ($remaining) {
    Write-Host "  ! Warning: Some rockITdata references may remain:" -ForegroundColor Red
    $remaining | ForEach-Object { Write-Host "    - $($_.Filename):$($_.LineNumber)" -ForegroundColor Red }
} else {
    Write-Host "  ✓ No rockITdata references found" -ForegroundColor Green
}

$wrongUrls = Select-String -Path "*.html","*.js" -Pattern "qlbvbfaprymzdqywcsiq|djuviwarqdvlbgcfuupa" 2>$null
if ($wrongUrls) {
    Write-Host "  ! Warning: Some old Supabase URLs may remain:" -ForegroundColor Red
    $wrongUrls | ForEach-Object { Write-Host "    - $($_.Filename):$($_.LineNumber)" -ForegroundColor Red }
} else {
    Write-Host "  ✓ All Supabase URLs updated" -ForegroundColor Green
}

Write-Host "`nDone! Check https://missionpulse.netlify.app after Netlify deploys." -ForegroundColor Cyan
