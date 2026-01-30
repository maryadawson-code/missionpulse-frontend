# ============================================================
# MISSIONPULSE PRODUCTION DEPLOYMENT SCRIPT
# Version: 2.0.0 FULL PACKAGE
# Date: January 30, 2026
# ============================================================
#
# This script:
# 1. Fixes Supabase URL in ALL existing files
# 2. Moves new production files from Downloads
# 3. Commits and deploys to production
#
# USAGE:
#   cd C:\Users\MaryWomack\Desktop\missionpulse-frontend
#   .\deploy-production.ps1
#
# ============================================================

param(
    [switch]$SkipGit,
    [switch]$DryRun
)

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   MISSIONPULSE PRODUCTION DEPLOYMENT                     ║" -ForegroundColor Cyan
Write-Host "║   Mission Meets Tech © 2026                              ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Configuration
$projectDir = "C:\Users\MaryWomack\Desktop\missionpulse-frontend"
$downloadDir = "$env:USERPROFILE\Downloads"
$wrongSupabaseUrl = "qlbvbfaprymzdqywcsiq"
$correctSupabaseUrl = "qdrtpnpnhkxvfmvfziop"

# Files to deploy
$productionFiles = @(
    "login.html",
    "missionpulse-auth.js",
    "missionpulse-dashboard-hub.html",
    "missionpulse-m7-blackhat-enhanced.html",
    "missionpulse-m8-pricing.html",
    "missionpulse-m1-enhanced.html",
    "missionpulse-m2-warroom-enhanced.html",
    "missionpulse-m3-swimlane-board.html",
    "missionpulse-m5-contracts-enhanced.html",
    "missionpulse-m6-iron-dome.html",
    "missionpulse-m9-hitl-enhanced.html",
    "missionpulse-m11-frenemy-protocol.html",
    "missionpulse-m13-launch-roi.html",
    "missionpulse-m14-post-award.html",
    "missionpulse-m15-lessons-playbook.html",
    "missionpulse-task16-rbac.html",
    "missionpulse-agent-hub.html",
    "missionpulse-orals-v2.html"
)

# ============================================================
# STEP 1: Change to project directory
# ============================================================
Write-Host "[1/5] Setting working directory..." -ForegroundColor Yellow
if (Test-Path $projectDir) {
    Set-Location $projectDir
    Write-Host "  ✓ Working in: $projectDir" -ForegroundColor Green
} else {
    Write-Host "  ✗ ERROR: Project directory not found!" -ForegroundColor Red
    exit 1
}

# ============================================================
# STEP 2: Fix Supabase URL in ALL HTML files
# ============================================================
Write-Host ""
Write-Host "[2/5] Fixing Supabase URL in existing files..." -ForegroundColor Yellow

$htmlFiles = Get-ChildItem -Path $projectDir -Filter "*.html" -File
$fixedCount = 0

foreach ($file in $htmlFiles) {
    $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
    if ($content -and $content.Contains($wrongSupabaseUrl)) {
        if (-not $DryRun) {
            $newContent = $content -replace $wrongSupabaseUrl, $correctSupabaseUrl
            Set-Content -Path $file.FullName -Value $newContent -NoNewline
        }
        Write-Host "  ✓ Fixed: $($file.Name)" -ForegroundColor Green
        $fixedCount++
    }
}

# Also fix JS files
$jsFiles = Get-ChildItem -Path $projectDir -Filter "*.js" -File
foreach ($file in $jsFiles) {
    $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
    if ($content -and $content.Contains($wrongSupabaseUrl)) {
        if (-not $DryRun) {
            $newContent = $content -replace $wrongSupabaseUrl, $correctSupabaseUrl
            Set-Content -Path $file.FullName -Value $newContent -NoNewline
        }
        Write-Host "  ✓ Fixed: $($file.Name)" -ForegroundColor Green
        $fixedCount++
    }
}

Write-Host "  Total files patched: $fixedCount" -ForegroundColor Cyan

# ============================================================
# STEP 3: Move new production files from Downloads
# ============================================================
Write-Host ""
Write-Host "[3/5] Moving production files from Downloads..." -ForegroundColor Yellow

$movedCount = 0
$notFoundCount = 0

foreach ($fileName in $productionFiles) {
    $sourcePath = Join-Path $downloadDir $fileName
    $destPath = Join-Path $projectDir $fileName
    
    if (Test-Path $sourcePath) {
        if (-not $DryRun) {
            Move-Item $sourcePath $destPath -Force
        }
        Write-Host "  ✓ Deployed: $fileName" -ForegroundColor Green
        $movedCount++
    } else {
        # Check if already in project
        if (Test-Path $destPath) {
            Write-Host "  ○ Exists: $fileName" -ForegroundColor DarkGray
        } else {
            Write-Host "  - Missing: $fileName" -ForegroundColor Yellow
            $notFoundCount++
        }
    }
}

Write-Host "  Files deployed: $movedCount | Already existed: $($productionFiles.Count - $movedCount - $notFoundCount) | Missing: $notFoundCount" -ForegroundColor Cyan

# ============================================================
# STEP 4: Verify critical files
# ============================================================
Write-Host ""
Write-Host "[4/5] Verifying critical files..." -ForegroundColor Yellow

$criticalFiles = @(
    @{ Name = "login.html"; Required = $true },
    @{ Name = "missionpulse-dashboard-hub.html"; Required = $true },
    @{ Name = "missionpulse-auth.js"; Required = $true },
    @{ Name = "missionpulse-m7-blackhat-enhanced.html"; Required = $true },
    @{ Name = "missionpulse-m8-pricing.html"; Required = $true },
    @{ Name = "index.html"; Required = $false }
)

$allCriticalPresent = $true
foreach ($file in $criticalFiles) {
    $filePath = Join-Path $projectDir $file.Name
    if (Test-Path $filePath) {
        $fileSize = (Get-Item $filePath).Length / 1KB
        Write-Host "  ✓ $($file.Name) ($('{0:N1}' -f $fileSize) KB)" -ForegroundColor Green
    } elseif ($file.Required) {
        Write-Host "  ✗ MISSING: $($file.Name)" -ForegroundColor Red
        $allCriticalPresent = $false
    } else {
        Write-Host "  - Optional: $($file.Name)" -ForegroundColor DarkGray
    }
}

# ============================================================
# STEP 5: Git commit and push
# ============================================================
Write-Host ""
Write-Host "[5/5] Git commit and deploy..." -ForegroundColor Yellow

if ($SkipGit) {
    Write-Host "  - Skipping git operations (--SkipGit flag)" -ForegroundColor Yellow
} elseif ($DryRun) {
    Write-Host "  - Dry run: Would commit and push" -ForegroundColor Yellow
} else {
    git add .
    $commitMessage = "PRODUCTION DEPLOY: Security patches + Full module suite - $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
    git commit -m $commitMessage
    git push origin main
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ Deployed to production!" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ Git push may have had issues - check manually" -ForegroundColor Yellow
    }
}

# ============================================================
# SUMMARY
# ============================================================
Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║   DEPLOYMENT COMPLETE                                    ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "Summary:" -ForegroundColor White
Write-Host "  • Supabase URL fixed in $fixedCount files"
Write-Host "  • Production files deployed: $movedCount"
Write-Host "  • Critical files verified: $(if($allCriticalPresent){'All present'}else{'SOME MISSING'})"
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Wait 1-2 minutes for Netlify to deploy"
Write-Host "  2. Test: https://missionpulse.netlify.app"
Write-Host "  3. Login: demo@missionmeetstech.com / demo123"
Write-Host "  4. Verify Black Hat requires CEO/COO/CAP role"
Write-Host "  5. Verify Pricing shows CUI banner"
Write-Host ""

if ($DryRun) {
    Write-Host "NOTE: This was a DRY RUN - no changes were made" -ForegroundColor Yellow
}

# ============================================================
# QUICK REFERENCE - SINGLE LINE COMMANDS
# ============================================================
<#
# TURBO ONE-LINER (Copy this entire line):
cd C:\Users\MaryWomack\Desktop\missionpulse-frontend; Get-ChildItem -Filter "*.html" | ForEach-Object { (Get-Content $_.FullName -Raw) -replace 'qlbvbfaprymzdqywcsiq', 'qdrtpnpnhkxvfmvfziop' | Set-Content $_.FullName -NoNewline }; Get-ChildItem "$env:USERPROFILE\Downloads" -Filter "missionpulse-*.html" | Move-Item -Destination . -Force; Get-ChildItem "$env:USERPROFILE\Downloads" -Filter "*.js" | Where-Object { $_.Name -like "missionpulse*" } | Move-Item -Destination . -Force; Move-Item "$env:USERPROFILE\Downloads\login.html" . -Force -ErrorAction SilentlyContinue; git add .; git commit -m "PRODUCTION: Full security patch deployment"; git push origin main

# FIX SUPABASE ONLY:
cd C:\Users\MaryWomack\Desktop\missionpulse-frontend; Get-ChildItem -Filter "*.html" | ForEach-Object { (Get-Content $_.FullName -Raw) -replace 'qlbvbfaprymzdqywcsiq', 'qdrtpnpnhkxvfmvfziop' | Set-Content $_.FullName -NoNewline }; git add .; git commit -m "FIX: Supabase URL corrected"; git push origin main

# MOVE ALL DOWNLOADS:
cd C:\Users\MaryWomack\Desktop\missionpulse-frontend; Move-Item "$env:USERPROFILE\Downloads\missionpulse-*.html" . -Force; Move-Item "$env:USERPROFILE\Downloads\missionpulse-*.js" . -Force; Move-Item "$env:USERPROFILE\Downloads\login.html" . -Force
#>
