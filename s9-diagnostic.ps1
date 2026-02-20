# S9 RBAC Migration Diagnostic
# Run from: C:\Users\MaryWomack\Desktop\missionpulse-frontend

Write-Host "`n=== S9 RBAC MIGRATION STATUS CHECK ===" -ForegroundColor Cyan
Write-Host "$(Get-Date -Format 'yyyy-MM-dd HH:mm')`n"

# 1. Check rbac-guard.js references (should be ZERO after S9)
$rbacGuardFiles = Get-ChildItem -Path . -Filter "*.html" -Recurse |
    Where-Object { $_.DirectoryName -eq (Get-Location).Path } |
    Select-String -Pattern 'rbac-guard\.js' -List |
    Select-Object -ExpandProperty Filename
$count1 = ($rbacGuardFiles | Measure-Object).Count
if ($count1 -eq 0) {
    Write-Host "[PASS] rbac-guard.js references: 0" -ForegroundColor Green
} else {
    Write-Host "[FAIL] rbac-guard.js still in $count1 files:" -ForegroundColor Red
    $rbacGuardFiles | ForEach-Object { Write-Host "  - $_" -ForegroundColor Yellow }
}

# 2. Check mp-rbac.js references (should be ~31+ after S9)
$mpRbacFiles = Get-ChildItem -Path . -Filter "*.html" -Recurse |
    Where-Object { $_.DirectoryName -eq (Get-Location).Path } |
    Select-String -Pattern 'mp-rbac\.js' -List |
    Select-Object -ExpandProperty Filename
$count2 = ($mpRbacFiles | Measure-Object).Count
Write-Host "`n[INFO] mp-rbac.js references: $count2 files" -ForegroundColor $(if($count2 -ge 30){"Green"}else{"Yellow"})

# 3. Check mp-trial-banner.js references (should be ~38 after S9)
$trialFiles = Get-ChildItem -Path . -Filter "*.html" -Recurse |
    Where-Object { $_.DirectoryName -eq (Get-Location).Path } |
    Select-String -Pattern 'mp-trial-banner\.js' -List |
    Select-Object -ExpandProperty Filename
$count3 = ($trialFiles | Measure-Object).Count
Write-Host "[INFO] mp-trial-banner.js references: $count3 files" -ForegroundColor $(if($count3 -ge 30){"Green"}else{"Yellow"})

# 4. Check public pages have NO RBAC (should be clean)
$publicPages = @('login.html','signup.html','reset-password.html','404.html','privacy.html','terms.html','accept-invite.html','request-access.html','demo-guide.html')
$publicWithRbac = @()
foreach ($page in $publicPages) {
    if (Test-Path $page) {
        $content = Get-Content $page -Raw -ErrorAction SilentlyContinue
        if ($content -match 'rbac-guard\.js|mp-rbac\.js') {
            $publicWithRbac += $page
        }
    }
}
if ($publicWithRbac.Count -eq 0) {
    Write-Host "[PASS] Public pages have no RBAC scripts" -ForegroundColor Green
} else {
    Write-Host "[FAIL] Public pages with RBAC scripts:" -ForegroundColor Red
    $publicWithRbac | ForEach-Object { Write-Host "  - $_" -ForegroundColor Yellow }
}

# 5. Check missionpulse-nav.js anon key
if (Test-Path "missionpulse-nav.js") {
    $navContent = Get-Content "missionpulse-nav.js" -Raw
    if ($navContent -match 'qdrtpnpnhkxvfmvfziop') {
        Write-Host "`n[FAIL] missionpulse-nav.js still has WRONG anon key (qdrt)" -ForegroundColor Red
    } elseif ($navContent -match 'djuviwarqdvlbgcfuupa') {
        Write-Host "`n[PASS] missionpulse-nav.js has CORRECT anon key (djuvi)" -ForegroundColor Green
    } else {
        Write-Host "`n[WARN] missionpulse-nav.js - could not detect anon key" -ForegroundColor Yellow
    }
}

# 6. Check dashboard-v2.html Supabase project
if (Test-Path "dashboard-v2.html") {
    $dashContent = Get-Content "dashboard-v2.html" -Raw
    if ($dashContent -match 'qdrtpnpnhkxvfmvfziop') {
        Write-Host "[FAIL] dashboard-v2.html points to WRONG Supabase (qdrt)" -ForegroundColor Red
    } elseif ($dashContent -match 'djuviwarqdvlbgcfuupa') {
        Write-Host "[PASS] dashboard-v2.html points to CORRECT Supabase (djuvi)" -ForegroundColor Green
    }
}

# 7. Check pipeline-kanban.html for duplicate RBAC
if (Test-Path "pipeline-kanban.html") {
    $pkContent = Get-Content "pipeline-kanban.html" -Raw
    $rbacMatches = [regex]::Matches($pkContent, 'rbac-guard\.js|mp-rbac\.js')
    if ($rbacMatches.Count -gt 1) {
        Write-Host "[FAIL] pipeline-kanban.html has $($rbacMatches.Count) RBAC script refs (should be 1)" -ForegroundColor Red
    } elseif ($rbacMatches.Count -eq 1) {
        Write-Host "[PASS] pipeline-kanban.html has exactly 1 RBAC script ref" -ForegroundColor Green
    }
}

# Summary
Write-Host "`n=== VERDICT ===" -ForegroundColor Cyan
if ($count1 -eq 0 -and $count2 -ge 30 -and $publicWithRbac.Count -eq 0) {
    Write-Host "S9 MIGRATION: COMPLETE" -ForegroundColor Green
} elseif ($count1 -gt 0) {
    Write-Host "S9 MIGRATION: NOT RUN (or incomplete)" -ForegroundColor Red
    Write-Host "Action: Run or regenerate s9-rbac-migration.ps1" -ForegroundColor Yellow
} else {
    Write-Host "S9 MIGRATION: PARTIAL — manual review needed" -ForegroundColor Yellow
}
Write-Host ""
