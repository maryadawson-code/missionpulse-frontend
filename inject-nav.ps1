# MissionPulse QA Fix - Add Navigation Script Tag
# Run from: C:\Users\MaryWomack\Desktop\missionpulse-frontend

$files = Get-ChildItem -Name "missionpulse-m*.html"
$updated = 0

foreach ($file in $files) {
    $content = Get-Content $file -Raw
    
    # Skip if already has shared-nav
    if ($content -match 'shared-nav\.js') {
        Write-Host "SKIP: $file (already has nav)" -ForegroundColor Yellow
        continue
    }
    
    # Add script tag before </body>
    $content = $content -replace '</body>', '<script src="shared-nav.js"></script></body>'
    
    Set-Content $file $content -NoNewline
    Write-Host "UPDATED: $file" -ForegroundColor Green
    $updated++
}

Write-Host "`nUpdated $updated files" -ForegroundColor Cyan
