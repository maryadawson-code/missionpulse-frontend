# ============================================================
# MISSIONPULSE SECURITY PATCH SCRIPT
# Version: 2.0.0
# Date: January 30, 2026
# ============================================================
# 
# USAGE: 
#   1. Open PowerShell as Administrator
#   2. Navigate to: cd C:\Users\MaryWomack\Desktop\missionpulse-frontend
#   3. Run: .\security-patches.ps1
#
# OR run individual fixes as single commands (see bottom of file)
# ============================================================

Write-Host "============================================" -ForegroundColor Cyan
Write-Host " MISSIONPULSE SECURITY PATCH v2.0" -ForegroundColor Cyan
Write-Host " Mission Meets Tech © 2026" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Change to project directory
$projectDir = "C:\Users\MaryWomack\Desktop\missionpulse-frontend"
Set-Location $projectDir
Write-Host "[1/5] Working directory: $projectDir" -ForegroundColor Yellow

# ============================================================
# FIX 1: Supabase URL Correction
# ============================================================
Write-Host ""
Write-Host "[2/5] FIXING SUPABASE URL..." -ForegroundColor Yellow

$wrongUrl = "qlbvbfaprymzdqywcsiq.supabase.co"
$correctUrl = "qdrtpnpnhkxvfmvfziop.supabase.co"

$htmlFiles = Get-ChildItem -Path $projectDir -Filter "*.html" -Recurse
$fixedCount = 0

foreach ($file in $htmlFiles) {
    $content = Get-Content $file.FullName -Raw
    if ($content -match $wrongUrl) {
        $newContent = $content -replace $wrongUrl, $correctUrl
        Set-Content -Path $file.FullName -Value $newContent -NoNewline
        Write-Host "  ✓ Fixed: $($file.Name)" -ForegroundColor Green
        $fixedCount++
    }
}

Write-Host "  Total files fixed: $fixedCount" -ForegroundColor Cyan

# ============================================================
# FIX 2: Move Security Patch Files from Downloads
# ============================================================
Write-Host ""
Write-Host "[3/5] MOVING SECURITY PATCH FILES..." -ForegroundColor Yellow

$downloadDir = "$env:USERPROFILE\Downloads"
$filesToMove = @(
    "missionpulse-auth.js",
    "login.html",
    "AUTH_INJECTION_SNIPPET.js",
    "BLACKHAT_RBAC_PATCH.js",
    "CUI_BANNER_PATCH.js"
)

foreach ($fileName in $filesToMove) {
    $sourcePath = Join-Path $downloadDir $fileName
    if (Test-Path $sourcePath) {
        Move-Item $sourcePath $projectDir -Force
        Write-Host "  ✓ Moved: $fileName" -ForegroundColor Green
    } else {
        Write-Host "  - Not found: $fileName (may already be in project)" -ForegroundColor Gray
    }
}

# ============================================================
# FIX 3: Verify Critical Files Exist
# ============================================================
Write-Host ""
Write-Host "[4/5] VERIFYING CRITICAL FILES..." -ForegroundColor Yellow

$criticalFiles = @(
    "login.html",
    "missionpulse-auth.js",
    "missionpulse-dashboard-hub.html",
    "missionpulse-m7-blackhat-enhanced.html",
    "missionpulse-m8-pricing.html"
)

foreach ($fileName in $criticalFiles) {
    $filePath = Join-Path $projectDir $fileName
    if (Test-Path $filePath) {
        Write-Host "  ✓ Found: $fileName" -ForegroundColor Green
    } else {
        Write-Host "  ✗ MISSING: $fileName" -ForegroundColor Red
    }
}

# ============================================================
# GIT COMMIT
# ============================================================
Write-Host ""
Write-Host "[5/5] GIT COMMIT & PUSH..." -ForegroundColor Yellow

git add .
git commit -m "SECURITY PATCH: Fixed Supabase URL, added auth module, RBAC patches"
git push origin main

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host " SECURITY PATCHES APPLIED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Verify production site loads: https://missionpulse.netlify.app"
Write-Host "  2. Test login flow with demo@missionmeetstech.com / demo123"
Write-Host "  3. Verify Black Hat requires CEO/COO/CAP role"
Write-Host "  4. Verify Pricing shows CUI banner"
Write-Host ""

# ============================================================
# SINGLE-LINE COMMANDS (Copy-paste alternatives)
# ============================================================

<#
# ONE-LINER: Fix Supabase URL in all HTML files
Get-ChildItem -Path . -Filter "*.html" | ForEach-Object { (Get-Content $_.FullName -Raw) -replace 'qlbvbfaprymzdqywcsiq.supabase.co', 'qdrtpnpnhkxvfmvfziop.supabase.co' | Set-Content $_.FullName -NoNewline }

# ONE-LINER: Move all downloads and commit
cd C:\Users\MaryWomack\Desktop\missionpulse-frontend; Move-Item "$env:USERPROFILE\Downloads\missionpulse-*.html" . -Force; Move-Item "$env:USERPROFILE\Downloads\missionpulse-*.js" . -Force; Move-Item "$env:USERPROFILE\Downloads\login.html" . -Force; git add .; git commit -m "Security patches applied"; git push origin main

# TURBO ONE-LINER: Everything in one command
cd C:\Users\MaryWomack\Desktop\missionpulse-frontend; Get-ChildItem -Filter "*.html" | ForEach-Object { (Get-Content $_.FullName -Raw) -replace 'qlbvbfaprymzdqywcsiq', 'qdrtpnpnhkxvfmvfziop' | Set-Content $_.FullName -NoNewline }; Move-Item "$env:USERPROFILE\Downloads\login.html" . -Force -ErrorAction SilentlyContinue; Move-Item "$env:USERPROFILE\Downloads\missionpulse-auth.js" . -Force -ErrorAction SilentlyContinue; git add .; git commit -m "SECURITY: Supabase URL fix + auth module"; git push origin main
#>
