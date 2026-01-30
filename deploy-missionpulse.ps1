# MissionPulse V3 Production Deployment Script
# Run this from PowerShell after downloading all files to Downloads folder

$repo = "C:\Users\MaryWomack\Desktop\missionpulse-frontend"
$downloads = "$env:USERPROFILE\Downloads"

Write-Host "🚀 MissionPulse V3 Deployment Starting..." -ForegroundColor Cyan

# Navigate to repo
Set-Location $repo

# Core files (required)
$coreFiles = @("index.html", "login.html", "agent-hub.html")
foreach ($file in $coreFiles) {
    $src = Join-Path $downloads $file
    if (Test-Path $src) {
        Move-Item $src $repo -Force
        Write-Host "✓ Deployed: $file" -ForegroundColor Green
    }
}

# V2 Module files (optional - unified index.html has everything)
$v2Files = Get-ChildItem "$downloads\missionpulse-*.html" -ErrorAction SilentlyContinue
foreach ($file in $v2Files) {
    Move-Item $file.FullName $repo -Force
    Write-Host "✓ Deployed: $($file.Name)" -ForegroundColor Green
}

# Git commit and push
Write-Host "`n📦 Committing to Git..." -ForegroundColor Cyan
git add .
git commit -m "MissionPulse V3 Production - Complete deployment"
git push origin main

Write-Host "`n✅ Deployment Complete!" -ForegroundColor Green
Write-Host "🌐 Live at: https://missionpulse.netlify.app" -ForegroundColor Yellow
Write-Host "⏱️ Wait 60 seconds for Netlify to build`n" -ForegroundColor Gray
