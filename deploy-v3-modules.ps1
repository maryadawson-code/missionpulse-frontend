# MissionPulse V3 Module Deployment Script
# Mission Meets Tech © 2026
# Run this AFTER downloading all 15 V3 modules to Downloads folder

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  MissionPulse V3 Module Deployment" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

# Step 1: Navigate to frontend directory
cd C:\Users\MaryWomack\Desktop\missionpulse-frontend

# Step 2: Move V3 modules from Downloads
Write-Host "`n[1/4] Moving V3 modules from Downloads..." -ForegroundColor Yellow
$v3Files = @(
    "missionpulse-warroom-v3.html",
    "missionpulse-pricing-v3.html",
    "missionpulse-blackhat-v3.html",
    "missionpulse-hitl-v3.html",
    "missionpulse-swimlane-v3.html",
    "missionpulse-rfpshredder-v3.html",
    "missionpulse-irondome-v3.html",
    "missionpulse-orals-v3.html",
    "missionpulse-contracts-v3.html",
    "missionpulse-frenemy-v3.html",
    "missionpulse-lessons-v3.html",
    "missionpulse-postaward-v3.html",
    "missionpulse-audit-v3.html",
    "missionpulse-settings-v3.html",
    "missionpulse-launch-v3.html"
)

$moved = 0
foreach ($file in $v3Files) {
    $source = "$env:USERPROFILE\Downloads\$file"
    if (Test-Path $source) {
        Move-Item $source . -Force
        $moved++
        Write-Host "  ✓ $file" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $file not found in Downloads" -ForegroundColor Red
    }
}
Write-Host "Moved $moved of 15 V3 modules" -ForegroundColor $(if ($moved -eq 15) {"Green"} else {"Yellow"})

# Step 3: Verify correct Supabase URL
Write-Host "`n[2/4] Verifying Supabase URLs..." -ForegroundColor Yellow
$oldUrls = Select-String -Path "missionpulse-*-v3.html" -Pattern "qlbvbfaprymzdqywcsiq|djuviwarqdvlbgcfuupa" 2>$null
if ($oldUrls) {
    Write-Host "  ✗ Found old Supabase URLs - please check files" -ForegroundColor Red
} else {
    Write-Host "  ✓ All V3 modules have correct Supabase URL" -ForegroundColor Green
}

# Step 4: Git commit and push
Write-Host "`n[3/4] Committing V3 modules..." -ForegroundColor Yellow
git add missionpulse-*-v3.html
git commit -m "Add 15 V3 modules with correct Supabase URLs and MMT branding"
git push origin main

# Step 5: Summary
Write-Host "`n[4/4] Deployment Summary" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan
$v3Count = (Get-ChildItem -Filter "missionpulse-*-v3.html").Count
Write-Host "V3 Modules in repo: $v3Count" -ForegroundColor $(if ($v3Count -ge 15) {"Green"} else {"Yellow"})
Write-Host "Netlify auto-deploying now..." -ForegroundColor Cyan
Write-Host "`nVerify at: https://missionpulse.netlify.app" -ForegroundColor White
Write-Host "============================================" -ForegroundColor Cyan
