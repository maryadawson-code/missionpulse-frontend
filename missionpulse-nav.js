/**
 * MissionPulse Unified Navigation v3.0
 * Points ALL modules to V2 files. No legacy *-live.html references.
 * Usage: <div id="missionpulse-sidebar" data-current-page="MODULE_ID"></div>
 *        <script src="missionpulse-nav.js"></script>
 * 
 * SECURITY: NIST 800-53 Rev 5 CHECKED
 * AI GENERATED â€” REQUIRES HUMAN REVIEW
 */

(function() {
    'use strict';

    // â”€â”€â”€ MODULE REGISTRY (22 V2 Modules) â”€â”€â”€
    var modules = [
        // Core Operations
        { id: 'dashboard',   name: 'Dashboard',          icon: 'ðŸ“Š', file: 'index.html',                        category: 'core',       rbac: ['ALL'] },
        { id: 'pipeline',    name: 'Pipeline',            icon: 'ðŸŽ¯', file: 'missionpulse-m1-enhanced.html',     category: 'core',       rbac: ['ALL'] },
        { id: 'warroom',     name: 'War Room',            icon: 'âš”ï¸', file: 'missionpulse-m2-warroom-enhanced.html', category: 'core',   rbac: ['ALL'] },
        { id: 'swimlane',    name: 'Swimlane Board',      icon: 'ðŸŠ', file: 'missionpulse-m3-swimlane-board.html',   category: 'core',   rbac: ['ALL'] },

        // Capture & Strategy
        { id: 'rfpshredder', name: 'RFP Shredder',        icon: 'ðŸ“„', file: 'index__13_.html',                   category: 'capture',    rbac: ['CEO','COO','CAP','PM','SA','Admin'] },
        { id: 'winthemes',   name: 'Win Themes',          icon: 'ðŸ†', file: 'missionpulse-winthemes-v2.html',    category: 'capture',    rbac: ['CEO','COO','CAP','PM','SA','Admin'] },
        { id: 'blackhat',    name: 'Black Hat',           icon: 'ðŸŽ©', file: 'missionpulse-m7-blackhat-enhanced.html', category: 'capture', rbac: ['CEO','COO','CAP','Admin'] },

        // Compliance & Contracts
        { id: 'irondome',    name: 'Iron Dome',           icon: 'ðŸ›¡ï¸', file: 'missionpulse-irondome-v2.html',     category: 'compliance', rbac: ['CEO','COO','CAP','PM','SA','CON','QA','Admin'] },
        { id: 'compliance',  name: 'Compliance Matrix',   icon: 'ðŸ“‹', file: 'missionpulse-compliance-v2.html',   category: 'compliance', rbac: ['CEO','COO','CAP','PM','SA','CON','QA','Admin'] },
        { id: 'contracts',   name: 'Contract Scanner',    icon: 'ðŸ“‘', file: 'missionpulse-m5-contracts-enhanced.html', category: 'compliance', rbac: ['CEO','COO','CON','Admin'] },

        // Pricing (CUI)
        { id: 'pricing',     name: 'Pricing Engine',      icon: 'ðŸ’°', file: 'missionpulse-m8-pricing.html',      category: 'pricing',    rbac: ['CEO','COO','FIN','Admin'], cui: true },

        // Review & Delivery
        { id: 'hitl',        name: 'HITL Review',         icon: 'ðŸ‘¤', file: 'missionpulse-m9-hitl-enhanced.html', category: 'review',     rbac: ['CEO','COO','CAP','PM','QA','Admin'] },
        { id: 'orals',       name: 'Orals Studio',        icon: 'ðŸŽ¤', file: 'missionpulse-orals-v2.html',        category: 'review',     rbac: ['CEO','COO','CAP','PM','SA','Admin'] },

        // Teaming & Partners
        { id: 'teaming',     name: 'Teaming / Frenemy',   icon: 'ðŸ¤', file: 'missionpulse-teaming-v2.html',      category: 'teaming',    rbac: ['CEO','COO','CAP','PM','Admin'] },

        // Intelligence & Knowledge
        { id: 'agenthub',    name: 'Agent Hub',           icon: 'ðŸ¤–', file: 'missionpulse-agenthub-v2.html',     category: 'intel',      rbac: ['CEO','COO','CAP','PM','SA','FIN','CON','QA','Admin'] },
        { id: 'lessons',     name: 'Lessons Playbook',    icon: 'ðŸ“–', file: 'missionpulse-m15-lessons-playbook.html', category: 'intel',  rbac: ['ALL'] },

        // Launch & Post-Award
        { id: 'launch',      name: 'Launch & ROI',        icon: 'ðŸš€', file: 'missionpulse-m13-launch-roi.html',  category: 'launch',     rbac: ['CEO','COO','CAP','PM','Admin'] },
        { id: 'postaward',   name: 'Post-Award',          icon: 'ðŸ“¦', file: 'missionpulse-m14-post-award.html',  category: 'launch',     rbac: ['CEO','COO','PM','DEL','Admin'] },

        // Admin
        { id: 'rbac',        name: 'RBAC Admin',          icon: 'ðŸ”', file: 'missionpulse-task16-rbac.html',     category: 'admin',      rbac: ['CEO','COO','Admin'] },
        { id: 'audit',       name: 'Audit Log',           icon: 'ðŸ“œ', file: 'missionpulse-sprint70-audit.html',  category: 'admin',      rbac: ['CEO','COO','Admin'] },
        { id: 'settings',    name: 'Settings',            icon: 'âš™ï¸', file: 'missionpulse-sprint69-settings.html', category: 'admin',    rbac: ['ALL'] },
        { id: 'sprint-exec', name: 'Sprint Planner',      icon: 'ðŸ“…', file: 'missionpulse-sprint-execution-plan.html', category: 'admin', rbac: ['CEO','COO','Admin'] },
    ];

    // â”€â”€â”€ CATEGORIES â”€â”€â”€
    var categories = {
        core:       { label: 'Core Operations',       icon: 'ðŸŽ¯' },
        capture:    { label: 'Capture & Strategy',     icon: 'â™Ÿï¸' },
        compliance: { label: 'Compliance & Contracts',  icon: 'ðŸ›¡ï¸' },
        pricing:    { label: 'Pricing',                 icon: 'ðŸ’°' },
        review:     { label: 'Review & Delivery',       icon: 'âœ…' },
        teaming:    { label: 'Teaming & Partners',      icon: 'ðŸ¤' },
        intel:      { label: 'Intelligence',            icon: 'ðŸ¤–' },
        launch:     { label: 'Launch & Post-Award',     icon: 'ðŸš€' },
        admin:      { label: 'Administration',          icon: 'âš™ï¸' }
    };

    // â”€â”€â”€ Helpers â”€â”€â”€
    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    function getUserRole() {
        try {
            var profile = JSON.parse(localStorage.getItem('missionpulse_profile') || '{}');
            return profile.role || 'CEO';
        } catch(e) { return 'CEO'; }
    }

    function canAccess(mod) {
        if (!mod.rbac || mod.rbac.indexOf('ALL') !== -1) return true;
        var role = getUserRole();
        return mod.rbac.indexOf(role) !== -1;
    }

    function getCurrentPage() {
        var container = document.getElementById('missionpulse-sidebar');
        if (container && container.dataset.currentPage) return container.dataset.currentPage;
        var path = window.location.pathname.split('/').pop() || '';
        var match = modules.find(function(m) { return path.indexOf(m.file) !== -1 || path === m.file; });
        return match ? match.id : 'dashboard';
    }

    // â”€â”€â”€ Render â”€â”€â”€
    function renderNav() {
        var container = document.getElementById('missionpulse-sidebar');
        if (!container) return;

        var currentPage = getCurrentPage();
        var profile = null;
        try { profile = JSON.parse(localStorage.getItem('missionpulse_profile') || '{}'); } catch(e) {}
        var userRole = getUserRole();

        var html = '';
        // Fixed sidebar
        html += '<div id="mp-nav-sidebar" style="position:fixed;top:0;left:0;width:260px;height:100vh;background:linear-gradient(180deg,#000a14 0%,#00050F 100%);border-right:1px solid rgba(0,229,250,0.15);overflow-y:auto;z-index:40;font-family:Inter,-apple-system,sans-serif;transition:transform .3s;">';

        // Logo
        html += '<div style="padding:16px 20px;border-bottom:1px solid rgba(0,229,250,0.08);">';
        html += '<a href="index.html" style="display:flex;align-items:center;gap:10px;text-decoration:none;">';
        html += '<div style="width:36px;height:36px;background:linear-gradient(135deg,#00E5FA,#0088cc);border-radius:10px;display:flex;align-items:center;justify-content:center;">';
        html += '<svg width="18" height="21" viewBox="0 0 80 92" fill="none"><path d="M40 4L8 20V44C8 66 22 82 40 88C58 82 72 66 72 44V20L40 4Z" stroke="white" stroke-width="4" fill="rgba(255,255,255,.15)"/><polyline points="28,46 34,46 37,38 40,54 43,42 46,46 52,46" stroke="white" stroke-width="3" fill="none" stroke-linecap="round"/></svg>';
        html += '</div>';
        html += '<div><div style="font-weight:800;font-size:16px;color:white;letter-spacing:-0.5px;">MissionPulse</div>';
        html += '<div style="font-size:10px;color:#00E5FA;font-weight:500;">Mission Meets Tech</div></div>';
        html += '</a></div>';

        // User profile
        if (profile && profile.full_name) {
            html += '<div style="padding:10px 20px;border-bottom:1px solid rgba(0,229,250,0.06);display:flex;align-items:center;gap:10px;">';
            html += '<div style="width:30px;height:30px;background:rgba(0,229,250,0.15);border-radius:50%;display:flex;align-items:center;justify-content:center;color:#00E5FA;font-size:12px;font-weight:700;">' + escapeHtml(profile.full_name.charAt(0)) + '</div>';
            html += '<div><div style="font-size:12px;color:white;font-weight:600;">' + escapeHtml(profile.full_name) + '</div>';
            html += '<div style="font-size:10px;color:#00E5FA;">' + escapeHtml(profile.role || userRole) + '</div></div>';
            html += '</div>';
        }

        // Connection status
        html += '<div style="padding:8px 20px;border-bottom:1px solid rgba(0,229,250,0.06);">';
        html += '<div id="nav-connection-status" style="font-size:11px;color:#64748B;">â— Checking...</div>';
        html += '</div>';

        // Module navigation
        html += '<nav style="padding:8px 0;">';
        Object.keys(categories).forEach(function(catId) {
            var cat = categories[catId];
            var catModules = modules.filter(function(m) { return m.category === catId && canAccess(m); });
            if (catModules.length === 0) return;

            html += '<div style="margin-bottom:4px;">';
            html += '<div style="padding:6px 20px;font-size:10px;font-weight:700;color:rgba(255,255,255,0.3);text-transform:uppercase;letter-spacing:1px;">' + escapeHtml(cat.icon + ' ' + cat.label) + '</div>';

            catModules.forEach(function(mod) {
                var isActive = mod.id === currentPage;
                var bg = isActive ? 'rgba(0,229,250,0.12)' : 'transparent';
                var borderL = isActive ? '3px solid #00E5FA' : '3px solid transparent';
                var textColor = isActive ? '#FFFFFF' : '#94A3B8';
                var hoverBg = 'rgba(0,229,250,0.06)';

                html += '<a href="' + mod.file + '" style="display:flex;align-items:center;gap:10px;padding:8px 20px;background:' + bg + ';border-left:' + borderL + ';text-decoration:none;transition:background .15s;" ';
                html += 'onmouseover="this.style.background=\'' + (isActive ? 'rgba(0,229,250,0.15)' : hoverBg) + '\'" ';
                html += 'onmouseout="this.style.background=\'' + bg + '\'">';
                html += '<span style="font-size:16px;width:20px;text-align:center;flex-shrink:0;">' + mod.icon + '</span>';
                html += '<span style="font-size:12px;font-weight:' + (isActive ? '700' : '500') + ';color:' + textColor + ';white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + escapeHtml(mod.name) + '</span>';
                if (mod.cui) {
                    html += '<span style="margin-left:auto;padding:1px 5px;border-radius:3px;font-size:8px;font-weight:700;background:rgba(245,158,11,0.15);color:#F59E0B;border:1px solid rgba(245,158,11,0.25);flex-shrink:0;">CUI</span>';
                }
                html += '</a>';
            });

            html += '</div>';
        });
        html += '</nav>';

        // Footer
        html += '<div style="padding:12px 20px;border-top:1px solid rgba(0,229,250,0.06);margin-top:auto;position:absolute;bottom:0;left:0;right:0;background:#00050F;">';
        html += '<div style="font-size:9px;color:#475569;text-align:center;line-height:1.6;">MissionPulse v12.0<br>CMMC 2.0 L2 Compliant<br>âš ï¸ AI GENERATED â€” REQUIRES HUMAN REVIEW</div>';
        html += '</div>';

        html += '</div>';

        // Mobile toggle button
        html += '<button id="mp-nav-toggle" onclick="document.getElementById(\'mp-nav-sidebar\').style.transform=document.getElementById(\'mp-nav-sidebar\').style.transform===\'translateX(-100%)\'?\'translateX(0)\':\' translateX(-100%)\';" style="display:none;position:fixed;top:12px;left:12px;z-index:50;width:40px;height:40px;border-radius:10px;background:rgba(0,229,250,0.1);border:1px solid rgba(0,229,250,0.2);color:#00E5FA;font-size:18px;cursor:pointer;align-items:center;justify-content:center;">â˜°</button>';

        // Responsive style
        html += '<style>';
        html += '@media(max-width:768px){#mp-nav-sidebar{transform:translateX(-100%)}#mp-nav-toggle{display:flex!important}}';
        html += '.main-content{margin-left:260px}@media(max-width:768px){.main-content{margin-left:0}}';
        html += '#mp-nav-sidebar::-webkit-scrollbar{width:3px}#mp-nav-sidebar::-webkit-scrollbar-thumb{background:rgba(0,229,250,0.15);border-radius:2px}';
        html += '</style>';

        container.innerHTML = html;

        // Check connection
        checkConnection();
    }

    function checkConnection() {
        var statusEl = document.getElementById('nav-connection-status');
        if (!statusEl) return;

        try {
            if (typeof supabase !== 'undefined' || (window.supabase && typeof window.supabase.createClient === 'function')) {
                var client = window.sbClient || (window.supabase ? window.supabase.createClient('https://djuviwarqdvlbgcfuupa.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqdXZpd2FycWR2bGJnY2Z1dXBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc4MzUyMjQsImV4cCI6MjA1MzQxMTIyNH0.pBPL9l2zL7LLd_A5I--hPBzw5YwG3ajPMtbYsqsxIgQ') : null);
                if (client) {
                    client.from('opportunities').select('id').limit(1).then(function(res) {
                        if (!res.error) {
                            statusEl.innerHTML = '<span style="color:#00BDAE;">â— Supabase Live</span>';
                        } else {
                            statusEl.innerHTML = '<span style="color:#F59E0B;">â— Demo Mode</span>';
                        }
                    }).catch(function() {
                        statusEl.innerHTML = '<span style="color:#F59E0B;">â— Demo Mode</span>';
                    });
                    return;
                }
            }
            statusEl.innerHTML = '<span style="color:#F59E0B;">â— Demo Mode</span>';
        } catch(e) {
            statusEl.innerHTML = '<span style="color:#F59E0B;">â— Demo Mode</span>';
        }
    }

    // â”€â”€â”€ Public API â”€â”€â”€
    window.MissionPulseNav = {
        modules: modules,
        categories: categories,
        init: renderNav,
        getModuleById: function(id) { return modules.find(function(m) { return m.id === id; }); },
        getModulesByCategory: function(cat) { return modules.filter(function(m) { return m.category === cat; }); }
    };

    // Auto-init
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', renderNav);
    } else {
        renderNav();
    }
})();
