# AskSage Deployment Verification Script
# Run after Render deploy completes (~3 min)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  MissionPulse AskSage Verification    " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Health Check
Write-Host "[1/4] Testing API Health..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "https://missionpulse-api.onrender.com/health" -Method GET
    Write-Host "  ✓ API Online: $($health.status)" -ForegroundColor Green
} catch {
    Write-Host "  ✗ API Offline - Render may still be deploying" -ForegroundColor Red
}

# Test 2: AskSage Status
Write-Host "[2/4] Testing AskSage Agent Status..." -ForegroundColor Yellow
try {
    $status = Invoke-RestMethod -Uri "https://missionpulse-api.onrender.com/agents/asksage/status" -Method GET
    Write-Host "  ✓ AskSage Ready: $($status.status)" -ForegroundColor Green
    Write-Host "    Security Level: $($status.security_level)" -ForegroundColor Gray
} catch {
    Write-Host "  ✗ AskSage endpoint not responding" -ForegroundColor Red
}

# Test 3: AskSage Chat
Write-Host "[3/4] Testing AskSage Chat Endpoint..." -ForegroundColor Yellow
try {
    $body = @{
        message = "What is CMMC 2.0 Level 2?"
        user_role = "ceo"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "https://missionpulse-api.onrender.com/agents/asksage/chat" -Method POST -Body $body -ContentType "application/json"
    Write-Host "  ✓ Chat Response Received" -ForegroundColor Green
    Write-Host "    Preview: $($response.response.Substring(0, [Math]::Min(100, $response.response.Length)))..." -ForegroundColor Gray
} catch {
    Write-Host "  ✗ Chat endpoint error: $_" -ForegroundColor Red
}

# Test 4: All Agents Status
Write-Host "[4/4] Verifying All 9 Agents..." -ForegroundColor Yellow
$agents = @("capture", "strategy", "blackhat", "pricing", "compliance", "writer", "contracts", "orals", "asksage")
foreach ($agent in $agents) {
    try {
        $agentStatus = Invoke-RestMethod -Uri "https://missionpulse-api.onrender.com/agents/$agent/status" -Method GET -ErrorAction SilentlyContinue
        Write-Host "  ✓ $agent - Ready" -ForegroundColor Green
    } catch {
        Write-Host "  ○ $agent - Endpoint pending" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Verification Complete                " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Frontend URL: https://missionpulse.netlify.app" -ForegroundColor White
Write-Host "Agent Hub:    https://missionpulse.netlify.app/missionpulse-agent-hub.html" -ForegroundColor White
Write-Host "Backend API:  https://missionpulse-api.onrender.com" -ForegroundColor White
