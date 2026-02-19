<#
.SYNOPSIS
  Injects rbac-guard.js into all MissionPulse HTML files.
.DESCRIPTION
  Adds <script src="rbac-guard.js"></script> before </head> in every .html file
  that doesn't already have it. Run from repo root.
.EXAMPLE
  cd C:\Users\MaryWomack\Desktop\missionpulse-frontend
  .\inject-rbac.ps1
  .\inject-rbac.ps1 -DryRun   # preview only
#>
param([switch]$DryRun)

$scriptTag = '<script src="rbac-guard.js"></script>'
$files = Get-ChildItem -Path "." -Filter "*.html" -File
$injected = 0
$skipped = 0
$errors = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
    if (-not $content) { $errors++; Write-Host "ERROR: Cannot read $($file.Name)" -ForegroundColor Red; continue }

    # Skip if already injected
    if ($content -match 'rbac-guard\.js') {
        $skipped++
        if ($DryRun) { Write-Host "SKIP: $($file.Name) (already has rbac-guard.js)" -ForegroundColor Yellow }
        continue
    }

    # Skip if no </head> tag
    if ($content -notmatch '</head>') {
        $skipped++
        if ($DryRun) { Write-Host "SKIP: $($file.Name) (no </head> tag)" -ForegroundColor Yellow }
        continue
    }

    if ($DryRun) {
        Write-Host "WOULD INJECT: $($file.Name)" -ForegroundColor Cyan
        $injected++
        continue
    }

    # Inject before </head>
    $newContent = $content -replace '</head>', "  $scriptTag`n</head>"
    Set-Content -Path $file.FullName -Value $newContent -NoNewline
    $injected++
    Write-Host "INJECTED: $($file.Name)" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== RBAC INJECTION COMPLETE ===" -ForegroundColor Cyan
Write-Host "Injected: $injected" -ForegroundColor Green
Write-Host "Skipped:  $skipped" -ForegroundColor Yellow
Write-Host "Errors:   $errors" -ForegroundColor Red

if ($DryRun) { Write-Host "`n(DRY RUN - no files were modified)" -ForegroundColor Magenta }
