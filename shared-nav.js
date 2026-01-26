/**
 * MissionPulse Unified Navigation
 * Auto-injects navigation bar into all module pages
 * Include via: <script src="shared-nav.js"></script> before </body>
 */

(function() {
  // Module detection from URL
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
    'm14': { name: 'Post-Award Transition', code: 'M14' },
    'm15': { name: 'Lessons Playbook', code: 'M15' }
  };

  // Detect current module from URL
  const path = window.location.pathname;
  let currentModule = null;
  
  for (const key in moduleMap) {
    if (path.toLowerCase().includes(key)) {
      currentModule = moduleMap[key];
      break;
    }
  }

  // Don't inject on hub, dashboard, or index pages
  if (path.includes('hub') || path.includes('dashboard') || path.endsWith('index.html') || path === '/') {
    return;
  }

  // If no module detected, use generic
  if (!currentModule) {
    currentModule = { name: 'Module', code: 'MX' };
  }

  // Create navigation HTML
  const navHTML = `
    <div id="mp-unified-nav" style="
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 9999;
      background: rgba(15, 23, 42, 0.95);
      backdrop-filter: blur(8px);
      border-bottom: 1px solid rgba(51, 65, 85, 0.5);
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    ">
      <div style="
        max-width: 1400px;
        margin: 0 auto;
        padding: 12px 24px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      ">
        <div style="display: flex; align-items: center; gap: 16px;">
          <a href="missionpulse-hub.html" style="
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 6px 12px;
            color: #94a3b8;
            text-decoration: none;
            font-size: 14px;
            border-radius: 8px;
            transition: all 0.2s;
          " onmouseover="this.style.color='#00E5FA'; this.style.background='rgba(30,41,59,0.5)'" 
             onmouseout="this.style.color='#94a3b8'; this.style.background='transparent'">
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
            </svg>
            Hub
          </a>
          <div style="height: 16px; width: 1px; background: #334155;"></div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="
              font-size: 11px;
              font-family: monospace;
              color: #00E5FA;
              background: rgba(0,229,250,0.1);
              padding: 2px 8px;
              border-radius: 4px;
            ">${currentModule.code}</span>
            <span style="font-size: 14px; font-weight: 500; color: #fff;">${currentModule.name}</span>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 12px;">
          <a href="missionpulse-dashboard.html" style="
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 6px 12px;
            color: #94a3b8;
            text-decoration: none;
            font-size: 14px;
            border-radius: 8px;
            transition: all 0.2s;
          " onmouseover="this.style.color='#fff'; this.style.background='rgba(30,41,59,0.5)'" 
             onmouseout="this.style.color='#94a3b8'; this.style.background='transparent'">
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"/>
            </svg>
            Dashboard
          </a>
          <span style="color: #475569; font-size: 12px;">|</span>
          <span style="color: #475569; font-size: 12px;">MissionPulse v12</span>
        </div>
      </div>
    </div>
  `;

  // Inject navigation
  document.body.insertAdjacentHTML('afterbegin', navHTML);

  // Add padding to body to account for fixed nav
  document.body.style.paddingTop = '60px';

  // Also try to add padding to first major container
  const rootEl = document.getElementById('root');
  if (rootEl) {
    const observer = new MutationObserver(() => {
      const firstChild = rootEl.firstElementChild;
      if (firstChild && !firstChild.dataset.navPadded) {
        firstChild.dataset.navPadded = 'true';
        // Don't double-pad if body already has padding
      }
    });
    observer.observe(rootEl, { childList: true });
  }

  console.log('[MissionPulse Nav] Injected for', currentModule.code, '-', currentModule.name);
})();
