# ============================================================
# MISSIONPULSE v12 - COMPREHENSIVE QA FIX SCRIPT
# ============================================================
# Run from: C:\Users\MaryWomack\Desktop\missionpulse-frontend
# ============================================================

Write-Host "=============================================="
Write-Host "MISSIONPULSE v12 QA FIX - Phase 26"
Write-Host "=============================================="
Write-Host ""

# Track changes
$fixes = @{
    "nav_removed" = 0
    "encoding_fixed" = 0
    "colors_fixed" = 0
    "plainlang_fixed" = 0
}

# ============================================================
# FIX 1: Remove shared-nav.js from modules with built-in nav
# ============================================================
Write-Host "FIX 1: Removing duplicate navigation..." -ForegroundColor Cyan

$modulesWithBuiltInNav = @(
    "missionpulse-m2-warroom-enhanced.html",
    "missionpulse-m3-swimlane-board.html",
    "missionpulse-m6-iron-dome.html",
    "missionpulse-m7-blackhat-enhanced.html",
    "missionpulse-m8-pricing.html",
    "missionpulse-m9-hitl-enhanced.html",
    "missionpulse-m11-frenemy-protocol.html",
    "missionpulse-m14-post-award.html",
    "missionpulse-m15-lessons-playbook.html"
)

foreach ($file in $modulesWithBuiltInNav) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        if ($content -match 'shared-nav\.js') {
            $content = $content -replace '<script src="shared-nav.js"></script>', ''
            Set-Content $file $content -NoNewline
            Write-Host "  Removed shared-nav.js from: $file" -ForegroundColor Green
            $fixes["nav_removed"]++
        }
    }
}

# ============================================================
# FIX 2: Fix character encoding (emoji replacements)
# ============================================================
Write-Host ""
Write-Host "FIX 2: Fixing character encoding..." -ForegroundColor Cyan

$emojiReplacements = @{
    "ðŸ'¼" = "briefcase"
    "ðŸ'"" = "necktie"
    "ðŸ"Š" = "chart"
    "ðŸŽ¯" = "target"
    "ðŸ"‹" = "clipboard"
    "ðŸ"§" = "wrench"
    "ðŸ'°" = "money"
    "ðŸ"œ" = "scroll"
    "ðŸ¤" = "handshake"
    "ðŸ›¡" = "shield"
    "ðŸš€" = "rocket"
    "â€¢" = "•"
    "â†'" = "→"
    "â†" = "←"
    "âœ"" = "✓"
    "âœ—" = "✗"
    "â‰¥" = ">="
    "â‰¤" = "<="
}

# For icons, replace with text or SVG reference
$files = Get-ChildItem -Name "missionpulse-m*.html"
foreach ($file in $files) {
    $content = Get-Content $file -Raw
    $changed = $false
    
    # Replace broken bullet points and arrows
    if ($content -match "â€¢") {
        $content = $content -replace "â€¢", "•"
        $changed = $true
    }
    if ($content -match "â†'") {
        $content = $content -replace "â†'", "→"
        $changed = $true
    }
    if ($content -match "âœ"") {
        $content = $content -replace "âœ"", "✓"
        $changed = $true
    }
    
    # Replace broken emoji icons with initials/text (safer than trying to fix encoding)
    # This replaces emoji avatar icons with simple text initials
    $content = $content -replace "icon: 'ðŸ[^']*'", "icon: '●'"
    $content = $content -replace "avatar: 'ðŸ[^']*'", "avatar: '●'"
    
    if ($changed -or $content -match "ðŸ") {
        Set-Content $file $content -NoNewline
        Write-Host "  Fixed encoding in: $file" -ForegroundColor Green
        $fixes["encoding_fixed"]++
    }
}

# ============================================================
# FIX 3: Standardize Primary Cyan color
# ============================================================
Write-Host ""
Write-Host "FIX 3: Standardizing Primary Cyan #00E5FA..." -ForegroundColor Cyan

$colorReplacements = @{
    "#0891B2" = "#00E5FA"  # Tailwind cyan-600
    "#0891b2" = "#00E5FA"
    "#06B6D4" = "#00E5FA"  # Tailwind cyan-500
    "#06b6d4" = "#00E5FA"
    "#22D3EE" = "#33EBFB"  # Tailwind cyan-400 -> MMT cyan-light
    "#22d3ee" = "#33EBFB"
    "cyan-500" = "[#00E5FA]"
    "cyan-600" = "[#00E5FA]"
    "from-cyan-500" = "from-[#00E5FA]"
    "to-cyan-500" = "to-[#00E5FA]"
    "border-cyan-500" = "border-[#00E5FA]"
    "text-cyan-500" = "text-[#00E5FA]"
    "bg-cyan-500" = "bg-[#00E5FA]"
}

foreach ($file in $files) {
    $content = Get-Content $file -Raw
    $changed = $false
    
    foreach ($old in $colorReplacements.Keys) {
        if ($content -match [regex]::Escape($old)) {
            $content = $content -replace [regex]::Escape($old), $colorReplacements[$old]
            $changed = $true
        }
    }
    
    if ($changed) {
        Set-Content $file $content -NoNewline
        Write-Host "  Fixed colors in: $file" -ForegroundColor Green
        $fixes["colors_fixed"]++
    }
}

# ============================================================
# FIX 4: Plain Language Updates
# ============================================================
Write-Host ""
Write-Host "FIX 4: Applying plain language updates..." -ForegroundColor Cyan

$plainLanguage = @{
    # UI labels only (not variable names)
    "'>pWin<'" = "'>Win Probability<'"
    "'pWin'" = "'Win Probability'"
    '"pWin"' = '"Win Probability"'
    "label: 'pWin'" = "label: 'Win Prob'"
    ">pWin</span>" = ">Win Prob</span>"
    ">FTE</span>" = ">Staff</span>"
    "'>FTE<'" = "'>Staff Needed<'"
    "label: 'FTE'" = "label: 'Staff'"
    "'>BOE<'" = "'>Price Breakdown<'"
    "label: 'BOE'" = "label: 'Price Breakdown'"
    "'>LCAT<'" = "'>Job Category<'"
    "label: 'LCAT'" = "label: 'Job Category'"
}

foreach ($file in $files) {
    $content = Get-Content $file -Raw
    $changed = $false
    
    foreach ($old in $plainLanguage.Keys) {
        if ($content -match [regex]::Escape($old)) {
            $content = $content -replace [regex]::Escape($old), $plainLanguage[$old]
            $changed = $true
        }
    }
    
    if ($changed) {
        Set-Content $file $content -NoNewline
        Write-Host "  Applied plain language to: $file" -ForegroundColor Green
        $fixes["plainlang_fixed"]++
    }
}

# ============================================================
# FIX 5: Update shared-nav.js with better detection
# ============================================================
Write-Host ""
Write-Host "FIX 5: Updating shared-nav.js with better nav detection..." -ForegroundColor Cyan

$sharedNavContent = @'
/**
 * MissionPulse Unified Navigation v3
 * Auto-injects navigation ONLY for pages without built-in nav
 */
(function() {
  // Skip hub, dashboard, index pages
  const path = window.location.pathname.toLowerCase();
  const skipPages = ['hub', 'dashboard', 'index', 'agent-hub'];
  if (skipPages.some(page => path.includes(page))) return;

  // Wait for page to load, then check for existing nav
  window.addEventListener('DOMContentLoaded', function() {
    // Check for existing navigation
    const hasHeader = document.querySelector('header');
    const hasNav = document.querySelector('nav, [class*="TopNav"], [class*="navbar"]');
    const hasMPHeader = document.body.innerHTML.includes('MissionPulse v12');
    
    if (hasHeader || hasNav || hasMPHeader) {
      console.log('[MissionPulse Nav] Skipped - page has built-in navigation');
      return;
    }

    // Detect module from URL
    const moduleMap = {
      'm1': { name: 'Pipeline Intelligence', code: 'M1' },
      'm2': { name: 'War Room', code: 'M2' },
      'm3': { name: 'Swimlane Board', code: 'M3' },
      'm4': { name: 'RFP Shredder', code: 'M4' },
      'm5': { name: 'Contracts Analyzer', code: 'M5' },
      'm6': { name: 'Iron Dome Writer', code: 'M6' },
      'm7': { name: 'Black Hat Intel', code: 'M7' },
      'm8': { name: 'Pricing Engine', code: 'M8' },
      'm9': { name: 'HITL Review Queue', code: 'M9' },
      'm10': { name: 'Orals Studio', code: 'M10' },
      'm11': { name: 'Frenemy Protocol', code: 'M11' },
      'm13': { name: 'Launch & ROI', code: 'M13' },
      'm14': { name: 'Post-Award', code: 'M14' },
      'm15': { name: 'Lessons Playbook', code: 'M15' }
    };

    let currentModule = { name: 'Module', code: 'MX' };
    for (const key in moduleMap) {
      if (path.includes(key)) {
        currentModule = moduleMap[key];
        break;
      }
    }

    // Inject navigation
    const navHTML = `
      <div id="mp-unified-nav" style="
        position: fixed; top: 0; left: 0; right: 0; z-index: 9999;
        background: rgba(10, 15, 26, 0.95); backdrop-filter: blur(8px);
        border-bottom: 1px solid rgba(0, 229, 250, 0.2);
        font-family: 'Inter', -apple-system, sans-serif;
      ">
        <div style="max-width: 1400px; margin: 0 auto; padding: 12px 24px;
          display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 16px;">
            <a href="missionpulse-hub.html" style="
              display: flex; align-items: center; gap: 8px; padding: 6px 12px;
              color: #94a3b8; text-decoration: none; font-size: 14px;
              border-radius: 8px; transition: all 0.2s;
            " onmouseover="this.style.color='#00E5FA'; this.style.background='rgba(0,229,250,0.1)'"
               onmouseout="this.style.color='#94a3b8'; this.style.background='transparent'">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
              </svg>
              Hub
            </a>
            <div style="height: 16px; width: 1px; background: rgba(0,229,250,0.3);"></div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 11px; font-family: monospace; color: #00E5FA;
                background: rgba(0,229,250,0.1); padding: 2px 8px; border-radius: 4px;">
                ${currentModule.code}
              </span>
              <span style="font-size: 14px; font-weight: 500; color: #fff;">
                ${currentModule.name}
              </span>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 12px;">
            <a href="missionpulse-dashboard.html" style="
              display: flex; align-items: center; gap: 8px; padding: 6px 12px;
              color: #94a3b8; text-decoration: none; font-size: 14px;
              border-radius: 8px; transition: all 0.2s;
            " onmouseover="this.style.color='#fff'; this.style.background='rgba(0,229,250,0.1)'"
               onmouseout="this.style.color='#94a3b8'; this.style.background='transparent'">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5z
                     M4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z
                     M16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"/>
              </svg>
              Dashboard
            </a>
            <span style="color: rgba(0,229,250,0.5); font-size: 12px;">|</span>
            <span style="color: rgba(0,229,250,0.7); font-size: 12px; font-weight: 500;">
              MissionPulse v12
            </span>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('afterbegin', navHTML);
    document.body.style.paddingTop = '56px';
    console.log('[MissionPulse Nav] Injected for', currentModule.code);
  });
})();
'@

Set-Content "shared-nav.js" $sharedNavContent -NoNewline
Write-Host "  Updated shared-nav.js with v3 smart detection" -ForegroundColor Green

# ============================================================
# SUMMARY
# ============================================================
Write-Host ""
Write-Host "=============================================="
Write-Host "QA FIX COMPLETE"
Write-Host "=============================================="
Write-Host ""
Write-Host "Changes made:" -ForegroundColor Cyan
Write-Host "  Navigation removed: $($fixes['nav_removed']) files"
Write-Host "  Encoding fixed: $($fixes['encoding_fixed']) files"
Write-Host "  Colors standardized: $($fixes['colors_fixed']) files"
Write-Host "  Plain language applied: $($fixes['plainlang_fixed']) files"
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Review changes with: git diff"
Write-Host "  2. Commit: git add -A; git commit -m 'P26: Comprehensive QA fixes'"
Write-Host "  3. Push: git push origin main"
Write-Host "  4. Test: Wait 60s then verify at missionpulsefrontend.netlify.app"
Write-Host ""
