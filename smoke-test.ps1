# MissionPulse Production Smoke Test Script
# Run in PowerShell: .\smoke-test.ps1
# Date: January 30, 2026

$baseUrl = "https://missionpulse.netlify.app"
$results = @()

# URL List
$urls = @(
    # Auth
    @{name="Login"; path="/login.html"},
    @{name="Signup"; path="/signup.html"},
    @{name="Reset Password"; path="/reset-password.html"},
    @{name="Request Access"; path="/request-access.html"},
    
    # Core
    @{name="Dashboard"; path="/index.html"},
    @{name="Dashboard V12"; path="/missionpulse-dashboard-v12.html"},
    @{name="Pipeline V2"; path="/missionpulse-pipeline-v2.html"},
    @{name="War Room V2"; path="/missionpulse-warroom-v2.html"},
    @{name="Swimlane V2"; path="/missionpulse-swimlane-v2.html"},
    @{name="Win Themes V2"; path="/missionpulse-winthemes-v2.html"},
    @{name="Playbook V2"; path="/missionpulse-playbook-v2.html"},
    
    # Intelligence
    @{name="RFP Shredder V2"; path="/missionpulse-rfpshredder-v2.html"},
    @{name="Black Hat V2"; path="/missionpulse-blackhat-v2.html"},
    @{name="Contracts V2"; path="/missionpulse-contracts-v2.html"},
    @{name="Compliance V2"; path="/missionpulse-compliance-v2.html"},
    @{name="Teaming V2"; path="/missionpulse-teaming-v2.html"},
    
    # Proposal
    @{name="Iron Dome V2"; path="/missionpulse-irondome-v2.html"},
    @{name="Pricing V2"; path="/missionpulse-pricing-v2.html"},
    @{name="Orals V2"; path="/missionpulse-orals-v2.html"},
    @{name="Past Perf V2"; path="/missionpulse-pastperf-v2.html"},
    @{name="HITL V2"; path="/missionpulse-hitl-v2.html"},
    
    # Operations
    @{name="Launch ROI V2"; path="/missionpulse-launchroi-v2.html"},
    @{name="Post-Award V2"; path="/missionpulse-postaward-v2.html"},
    @{name="Lessons V2"; path="/missionpulse-lessons-v2.html"},
    @{name="Reports V2"; path="/missionpulse-reports-v2.html"},
    
    # Admin
    @{name="Settings V2"; path="/missionpulse-settings-v2.html"},
    @{name="Audit V2"; path="/missionpulse-audit-v2.html"},
    @{name="Profile V2"; path="/missionpulse-profile-v2.html"},
    @{name="Agent Hub"; path="/missionpulse-agent-hub.html"},
    @{name="Health Check"; path="/missionpulse-health-check.html"},
    @{name="404 Page"; path="/404.html"},
    
    # Legacy
    @{name="M1 Enhanced"; path="/missionpulse-m1-enhanced.html"},
    @{name="M2 War Room"; path="/missionpulse-m2-warroom-enhanced.html"},
    @{name="M3 Swimlane"; path="/missionpulse-m3-swimlane-board.html"},
    @{name="M5 Contracts"; path="/missionpulse-m5-contracts-enhanced.html"},
    @{name="M6 Iron Dome"; path="/missionpulse-m6-iron-dome.html"},
    @{name="M7 Black Hat"; path="/missionpulse-m7-blackhat-enhanced.html"},
    @{name="M8 Pricing"; path="/missionpulse-m8-pricing.html"},
    @{name="M9 HITL"; path="/missionpulse-m9-hitl-enhanced.html"},
    @{name="M11 Frenemy"; path="/missionpulse-m11-frenemy-protocol.html"},
    @{name="M13 Launch"; path="/missionpulse-m13-launch-roi.html"},
    @{name="M14 Post-Award"; path="/missionpulse-m14-post-award.html"},
    @{name="M15 Lessons"; path="/missionpulse-m15-lessons-playbook.html"},
    @{name="V12 Complete"; path="/missionpulse-v12-complete.html"},
    @{name="V12 Ultimate"; path="/missionpulse-v12-ULTIMATE.html"},
    @{name="V12 Production"; path="/missionpulse-v12-PRODUCTION.html"},
    @{name="Task16 RBAC"; path="/missionpulse-task16-rbac.html"},
    @{name="Task17 Complete"; path="/missionpulse-v12-task17-complete.html"}
)

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " MissionPulse Production Smoke Test" -ForegroundColor Cyan
Write-Host " Base URL: $baseUrl" -ForegroundColor Cyan
Write-Host " Modules: $($urls.Count)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$passed = 0
$failed = 0

foreach ($url in $urls) {
    $fullUrl = "$baseUrl$($url.path)"
    try {
        $response = Invoke-WebRequest -Uri $fullUrl -Method Head -TimeoutSec 10 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Host "[PASS] $($url.name)" -ForegroundColor Green
            $passed++
        } else {
            Write-Host "[FAIL] $($url.name) - Status: $($response.StatusCode)" -ForegroundColor Red
            $failed++
        }
    } catch {
        # Check if it's a 404 or other error
        if ($_.Exception.Response.StatusCode -eq 404) {
            Write-Host "[MISS] $($url.name) - 404 Not Found" -ForegroundColor Yellow
        } else {
            Write-Host "[FAIL] $($url.name) - Error: $($_.Exception.Message)" -ForegroundColor Red
        }
        $failed++
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " RESULTS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Passed: $passed" -ForegroundColor Green
Write-Host " Failed: $failed" -ForegroundColor $(if($failed -gt 0){"Red"}else{"Green"})
Write-Host " Total:  $($urls.Count)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if ($failed -eq 0) {
    Write-Host ""
    Write-Host " ALL TESTS PASSED - READY FOR LAUNCH!" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host ""
    Write-Host " ISSUES DETECTED - Review failed modules" -ForegroundColor Red
    Write-Host ""
}

# Test API Health
Write-Host "Testing API Backend..." -ForegroundColor Cyan
try {
    $apiResponse = Invoke-WebRequest -Uri "https://missionpulse-api.onrender.com/health" -TimeoutSec 10 -UseBasicParsing
    Write-Host "[PASS] Render API Health Check" -ForegroundColor Green
} catch {
    Write-Host "[FAIL] Render API - $($_.Exception.Message)" -ForegroundColor Red
}

# Test Supabase
Write-Host "Testing Supabase Connection..." -ForegroundColor Cyan
try {
    $supabaseResponse = Invoke-WebRequest -Uri "https://qdrtpnpnhkxvfmvfziop.supabase.co/rest/v1/" -TimeoutSec 10 -UseBasicParsing -Headers @{"apikey"="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkcnRwbnBuaGt4dmZtdmZ6aW9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY3MTcyNjUsImV4cCI6MjA1MjI5MzI2NX0.DACT1xnVtJeHx5tL7_K8y1hOx9NyJE7B6UBhPqwHHx8"}
    Write-Host "[PASS] Supabase Connection" -ForegroundColor Green
} catch {
    Write-Host "[FAIL] Supabase - $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Smoke test complete." -ForegroundColor Cyan
