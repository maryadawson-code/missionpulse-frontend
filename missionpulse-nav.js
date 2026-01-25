/**
 * MissionPulse Unified Navigation Component
 * Version: 1.0.0
 * 
 * Usage: Add this to any module HTML file:
 * <script src="missionpulse-nav.js"></script>
 * 
 * The nav will auto-inject at the top of <body>
 * RBAC role persists via localStorage key: missionpulse_role
 */

(function() {
    'use strict';

    // ==================== CONFIGURATION ====================
    
    const ROLES = {
        EXEC: { id: 'EXEC', label: 'Executive (CEO/COO)', icon: '👔' },
        CAP: { id: 'CAP', label: 'Capture Manager', icon: '🎯' },
        PM: { id: 'PM', label: 'Proposal Manager', icon: '📋' },
        SA: { id: 'SA', label: 'Solution Architect', icon: '🏗️' },
        SME: { id: 'SME', label: 'Subject Matter Expert', icon: '🧠' },
        WRITER: { id: 'WRITER', label: 'Proposal Writer', icon: '✍️' },
        REVIEWER: { id: 'REVIEWER', label: 'Reviewer (Color Team)', icon: '🔍' },
        PRICE: { id: 'PRICE', label: 'Pricing Analyst', icon: '💰' },
        CONTRACTS: { id: 'CONTRACTS', label: 'Contracts Specialist', icon: '📜' },
        GRAPHICS: { id: 'GRAPHICS', label: 'Graphics Lead', icon: '🎨' },
        ADMIN: { id: 'ADMIN', label: 'System Administrator', icon: '⚙️' }
    };

    const MODULES = [
        { id: 'M1', name: 'Opportunity Intake', icon: '📥', phase: 'capture', url: 'missionpulse-m1-enhanced.html' },
        { id: 'M2', name: 'War Room', icon: '🎖️', phase: 'capture', url: 'missionpulse-m2-warroom-enhanced.html' },
        { id: 'M3', name: 'Swimlane Board', icon: '📊', phase: 'proposal', url: 'missionpulse-m3-swimlane-board.html' },
        { id: 'M5', name: 'Contracts Analysis', icon: '📜', phase: 'compliance', url: 'missionpulse-m5-contracts-enhanced.html' },
        { id: 'M6', name: 'Iron Dome', icon: '🛡️', phase: 'compliance', url: 'missionpulse-m6-iron-dome.html' },
        { id: 'M7', name: 'Black Hat Intel', icon: '🎩', phase: 'strategy', url: 'missionpulse-m7-blackhat-enhanced.html', isPrivate: true },
        { id: 'M8', name: 'Pricing Intelligence', icon: '💰', phase: 'pricing', url: 'missionpulse-m8-pricing.html', isPrivate: true },
        { id: 'M9', name: 'HITL Review', icon: '👁️', phase: 'review', url: 'missionpulse-m9-hitl-enhanced.html' },
        { id: 'M10', name: 'Orals Simulator', icon: '🎤', phase: 'orals', url: 'missionpulse-m10-orals-studio.html' },
        { id: 'M11', name: 'Frenemy Protocol', icon: '🤝', phase: 'capture', url: 'missionpulse-m11-frenemy-protocol.html' },
        { id: 'M13', name: 'ROI Dashboard', icon: '📈', phase: 'analytics', url: 'missionpulse-m13-launch-roi.html' },
        { id: 'M14', name: 'Post-Award', icon: '🏆', phase: 'post-award', url: 'missionpulse-m14-post-award.html' }
    ];

    const PHASES = {
        capture: { label: 'Capture', icon: '🎯' },
        strategy: { label: 'Strategy', icon: '♟️' },
        proposal: { label: 'Proposal', icon: '📝' },
        compliance: { label: 'Compliance', icon: '🛡️' },
        pricing: { label: 'Pricing', icon: '💰' },
        review: { label: 'Review', icon: '🔍' },
        orals: { label: 'Orals', icon: '🎤' },
        analytics: { label: 'Analytics', icon: '📊' },
        'post-award': { label: 'Post-Award', icon: '🏆' }
    };

    // ==================== STYLES ====================
    
    const STYLES = `
        .mp-nav {
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            background: linear-gradient(180deg, #0a1628 0%, #00050F 100%);
            border-bottom: 1px solid rgba(0, 229, 250, 0.2);
            position: sticky;
            top: 0;
            z-index: 9999;
            padding: 0 16px;
        }
        .mp-nav * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        .mp-nav-inner {
            max-width: 1400px;
            margin: 0 auto;
            display: flex;
            align-items: center;
            justify-content: space-between;
            height: 56px;
        }
        .mp-nav-left {
            display: flex;
            align-items: center;
            gap: 16px;
        }
        .mp-nav-logo {
            display: flex;
            align-items: center;
            gap: 10px;
            text-decoration: none;
        }
        .mp-nav-logo svg {
            width: 32px;
            height: 32px;
        }
        .mp-nav-logo-text {
            color: #00E5FA;
            font-weight: 700;
            font-size: 16px;
        }
        .mp-nav-divider {
            width: 1px;
            height: 24px;
            background: rgba(0, 229, 250, 0.2);
        }
        .mp-nav-current {
            display: flex;
            align-items: center;
            gap: 8px;
            color: #fff;
            font-size: 14px;
        }
        .mp-nav-current-icon {
            font-size: 18px;
        }
        .mp-nav-current-label {
            color: rgba(255,255,255,0.6);
        }
        .mp-nav-right {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .mp-nav-dropdown {
            position: relative;
        }
        .mp-nav-dropdown-btn {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 6px 12px;
            background: rgba(0, 229, 250, 0.1);
            border: 1px solid rgba(0, 229, 250, 0.3);
            border-radius: 8px;
            color: #fff;
            font-size: 13px;
            cursor: pointer;
            transition: all 0.2s;
        }
        .mp-nav-dropdown-btn:hover {
            background: rgba(0, 229, 250, 0.2);
            border-color: rgba(0, 229, 250, 0.5);
        }
        .mp-nav-dropdown-btn svg {
            width: 14px;
            height: 14px;
            color: rgba(255,255,255,0.5);
        }
        .mp-nav-dropdown-menu {
            position: absolute;
            top: 100%;
            right: 0;
            margin-top: 8px;
            background: #142240;
            border: 1px solid rgba(0, 229, 250, 0.2);
            border-radius: 12px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.5);
            min-width: 280px;
            max-height: 400px;
            overflow-y: auto;
            display: none;
            padding: 8px;
        }
        .mp-nav-dropdown-menu.open {
            display: block;
        }
        .mp-nav-dropdown-menu::-webkit-scrollbar {
            width: 6px;
        }
        .mp-nav-dropdown-menu::-webkit-scrollbar-track {
            background: transparent;
        }
        .mp-nav-dropdown-menu::-webkit-scrollbar-thumb {
            background: rgba(0, 229, 250, 0.3);
            border-radius: 3px;
        }
        .mp-nav-phase-label {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: rgba(255,255,255,0.4);
            padding: 8px 12px 4px;
        }
        .mp-nav-module-link {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 8px 12px;
            border-radius: 8px;
            text-decoration: none;
            color: rgba(255,255,255,0.8);
            font-size: 13px;
            transition: all 0.2s;
        }
        .mp-nav-module-link:hover {
            background: rgba(0, 229, 250, 0.1);
            color: #00E5FA;
        }
        .mp-nav-module-link.active {
            background: rgba(0, 229, 250, 0.15);
            color: #00E5FA;
        }
        .mp-nav-module-icon {
            font-size: 16px;
        }
        .mp-nav-module-name {
            flex: 1;
        }
        .mp-nav-private-badge {
            font-size: 9px;
            padding: 2px 6px;
            background: rgba(139, 92, 246, 0.2);
            color: #a78bfa;
            border-radius: 4px;
        }
        .mp-nav-role-btn {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 6px 12px;
            background: #00050F;
            border: 1px solid rgba(0, 229, 250, 0.3);
            border-radius: 8px;
            color: #fff;
            font-size: 13px;
            cursor: pointer;
            transition: all 0.2s;
        }
        .mp-nav-role-btn:hover {
            border-color: rgba(0, 229, 250, 0.6);
        }
        .mp-nav-role-icon {
            font-size: 16px;
        }
        .mp-nav-role-menu {
            position: absolute;
            top: 100%;
            right: 0;
            margin-top: 8px;
            background: #142240;
            border: 1px solid rgba(0, 229, 250, 0.2);
            border-radius: 12px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.5);
            width: 260px;
            max-height: 400px;
            overflow-y: auto;
            display: none;
            padding: 8px;
        }
        .mp-nav-role-menu.open {
            display: block;
        }
        .mp-nav-role-option {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 8px 12px;
            border-radius: 8px;
            cursor: pointer;
            color: rgba(255,255,255,0.7);
            font-size: 13px;
            transition: all 0.2s;
            border: none;
            background: none;
            width: 100%;
            text-align: left;
        }
        .mp-nav-role-option:hover {
            background: rgba(0, 229, 250, 0.1);
            color: #fff;
        }
        .mp-nav-role-option.active {
            background: rgba(0, 229, 250, 0.2);
            color: #00E5FA;
        }
        .mp-nav-role-check {
            margin-left: auto;
            color: #00E5FA;
        }
        .mp-nav-hub-link {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 6px 12px;
            background: transparent;
            border: 1px solid rgba(0, 229, 250, 0.2);
            border-radius: 8px;
            color: rgba(255,255,255,0.7);
            font-size: 13px;
            text-decoration: none;
            transition: all 0.2s;
        }
        .mp-nav-hub-link:hover {
            background: rgba(0, 229, 250, 0.1);
            color: #00E5FA;
            border-color: rgba(0, 229, 250, 0.4);
        }
        .mp-nav-backdrop {
            position: fixed;
            inset: 0;
            z-index: 9998;
            display: none;
        }
        .mp-nav-backdrop.open {
            display: block;
        }
        @media (max-width: 640px) {
            .mp-nav-current-label,
            .mp-nav-role-btn span:not(.mp-nav-role-icon) {
                display: none;
            }
            .mp-nav-dropdown-btn span {
                display: none;
            }
        }
    `;

    // ==================== HELPER FUNCTIONS ====================

    function getCurrentModule() {
        const path = window.location.pathname;
        const filename = path.split('/').pop();
        return MODULES.find(m => m.url === filename) || null;
    }

    function getRole() {
        return localStorage.getItem('missionpulse_role') || 'PM';
    }

    function setRole(roleId) {
        localStorage.setItem('missionpulse_role', roleId);
    }

    function groupModulesByPhase() {
        const grouped = {};
        MODULES.forEach(mod => {
            if (!grouped[mod.phase]) grouped[mod.phase] = [];
            grouped[mod.phase].push(mod);
        });
        return grouped;
    }

    // ==================== RENDER ====================

    function renderNav() {
        const currentModule = getCurrentModule();
        const currentRole = getRole();
        const roleInfo = ROLES[currentRole];
        const modulesByPhase = groupModulesByPhase();

        // Inject styles
        const styleEl = document.createElement('style');
        styleEl.textContent = STYLES;
        document.head.appendChild(styleEl);

        // Create nav HTML
        const nav = document.createElement('nav');
        nav.className = 'mp-nav';
        nav.innerHTML = `
            <div class="mp-nav-inner">
                <div class="mp-nav-left">
                    <a href="missionpulse-hub.html" class="mp-nav-logo">
                        <svg viewBox="0 0 100 100">
                            <defs>
                                <linearGradient id="mpNavShieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stop-color="#00E5FA" />
                                    <stop offset="100%" stop-color="#00B8C8" />
                                </linearGradient>
                            </defs>
                            <path d="M50 5 L90 20 L90 50 C90 75 70 90 50 95 C30 90 10 75 10 50 L10 20 Z" fill="url(#mpNavShieldGrad)"/>
                            <path d="M50 15 L80 27 L80 50 C80 70 65 82 50 86 C35 82 20 70 20 50 L20 27 Z" fill="#00050F"/>
                            <circle cx="50" cy="45" r="8" fill="#00E5FA"/>
                            <path d="M50 55 L50 70" stroke="#00E5FA" stroke-width="4" stroke-linecap="round"/>
                            <path d="M35 60 L50 70 L65 60" stroke="#00E5FA" stroke-width="3" fill="none" stroke-linecap="round"/>
                        </svg>
                        <span class="mp-nav-logo-text">MissionPulse</span>
                    </a>
                    ${currentModule ? `
                        <div class="mp-nav-divider"></div>
                        <div class="mp-nav-current">
                            <span class="mp-nav-current-icon">${currentModule.icon}</span>
                            <span class="mp-nav-current-label">${currentModule.id}:</span>
                            <span>${currentModule.name}</span>
                        </div>
                    ` : ''}
                </div>
                <div class="mp-nav-right">
                    <a href="missionpulse-hub.html" class="mp-nav-hub-link">
                        🏠 <span>Hub</span>
                    </a>
                    
                    <!-- Modules Dropdown -->
                    <div class="mp-nav-dropdown" id="mp-modules-dropdown">
                        <button class="mp-nav-dropdown-btn" id="mp-modules-btn">
                            📦 <span>Modules</span>
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                            </svg>
                        </button>
                        <div class="mp-nav-dropdown-menu" id="mp-modules-menu">
                            ${Object.entries(modulesByPhase).map(([phaseKey, mods]) => `
                                <div class="mp-nav-phase-label">${PHASES[phaseKey]?.icon || ''} ${PHASES[phaseKey]?.label || phaseKey}</div>
                                ${mods.map(mod => `
                                    <a href="${mod.url}" class="mp-nav-module-link ${currentModule?.id === mod.id ? 'active' : ''}">
                                        <span class="mp-nav-module-icon">${mod.icon}</span>
                                        <span class="mp-nav-module-name">${mod.name}</span>
                                        ${mod.isPrivate ? '<span class="mp-nav-private-badge">Private</span>' : ''}
                                    </a>
                                `).join('')}
                            `).join('')}
                        </div>
                    </div>
                    
                    <!-- Role Selector -->
                    <div class="mp-nav-dropdown" id="mp-role-dropdown">
                        <button class="mp-nav-role-btn" id="mp-role-btn">
                            <span class="mp-nav-role-icon">${roleInfo.icon}</span>
                            <span>${roleInfo.label}</span>
                            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                            </svg>
                        </button>
                        <div class="mp-nav-role-menu" id="mp-role-menu">
                            ${Object.values(ROLES).map(role => `
                                <button class="mp-nav-role-option ${currentRole === role.id ? 'active' : ''}" data-role="${role.id}">
                                    <span>${role.icon}</span>
                                    <span>${role.label}</span>
                                    ${currentRole === role.id ? '<span class="mp-nav-role-check">✓</span>' : ''}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
            <div class="mp-nav-backdrop" id="mp-nav-backdrop"></div>
        `;

        // Insert at top of body
        document.body.insertBefore(nav, document.body.firstChild);

        // Event listeners
        const modulesBtn = document.getElementById('mp-modules-btn');
        const modulesMenu = document.getElementById('mp-modules-menu');
        const roleBtn = document.getElementById('mp-role-btn');
        const roleMenu = document.getElementById('mp-role-menu');
        const backdrop = document.getElementById('mp-nav-backdrop');

        function closeAll() {
            modulesMenu.classList.remove('open');
            roleMenu.classList.remove('open');
            backdrop.classList.remove('open');
        }

        modulesBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = modulesMenu.classList.contains('open');
            closeAll();
            if (!isOpen) {
                modulesMenu.classList.add('open');
                backdrop.classList.add('open');
            }
        });

        roleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = roleMenu.classList.contains('open');
            closeAll();
            if (!isOpen) {
                roleMenu.classList.add('open');
                backdrop.classList.add('open');
            }
        });

        backdrop.addEventListener('click', closeAll);

        // Role selection
        roleMenu.querySelectorAll('.mp-nav-role-option').forEach(option => {
            option.addEventListener('click', () => {
                const newRole = option.dataset.role;
                setRole(newRole);
                // Refresh to apply new role
                window.location.reload();
            });
        });

        // Close on escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeAll();
        });
    }

    // ==================== INIT ====================
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', renderNav);
    } else {
        renderNav();
    }

    // Expose to global scope for external access if needed
    window.MissionPulseNav = {
        getRole,
        setRole,
        getCurrentModule,
        ROLES,
        MODULES
    };

})();
