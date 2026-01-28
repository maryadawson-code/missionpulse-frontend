// FILE: missionpulse-nav.js
// ROLE: All Users
// SECURITY: No secrets, client-side navigation only
// VERSION: 2.0 - Updated Sprint 38 with 26 modules

const MissionPulseNav = {
    modules: [
        // Core
        { id: 'dashboard', name: 'Dashboard', icon: '🎯', href: 'index.html', category: 'core' },
        { id: 'executive', name: 'Executive View', icon: '📊', href: 'missionpulse-m25-executive-live.html', category: 'core' },
        { id: 'agents', name: 'AI Agent Hub', icon: '🤖', href: 'missionpulse-agent-hub.html', category: 'core' },
        
        // Capture
        { id: 'contracts', name: 'Contracts Library', icon: '📋', href: 'missionpulse-m5-contracts-live.html', category: 'capture' },
        { id: 'pastperf', name: 'Past Performance', icon: '📈', href: 'missionpulse-m17-pastperformance-live.html', category: 'capture' },
        { id: 'teaming', name: 'Teaming Partners', icon: '🤝', href: 'missionpulse-m18-teaming-live.html', category: 'capture' },
        { id: 'amendments', name: 'RFP Amendments', icon: '📝', href: 'missionpulse-m20-amendments-live.html', category: 'capture' },
        { id: 'questions', name: 'Questions to Gov', icon: '❓', href: 'missionpulse-m23-questions-live.html', category: 'capture' },
        
        // Strategy
        { id: 'blackhat', name: 'Black Hat Analysis', icon: '🎭', href: 'missionpulse-m7-blackhat-live.html', category: 'strategy' },
        { id: 'winthemes', name: 'Win Themes', icon: '🏆', href: 'missionpulse-m12-winthemes-live.html', category: 'strategy' },
        { id: 'risks', name: 'Risk Register', icon: '⚠️', href: 'missionpulse-m14-risks-live.html', category: 'strategy' },
        
        // Compliance
        { id: 'compliance', name: 'Compliance Matrix', icon: '✅', href: 'missionpulse-m6-compliance-live.html', category: 'compliance' },
        { id: 'checklist', name: 'L/M Checklist', icon: '☑️', href: 'missionpulse-m16-compliance-checklist-live.html', category: 'compliance' },
        
        // Pricing
        { id: 'pricing', name: 'Pricing & BOE', icon: '💰', href: 'missionpulse-m8-pricing-live.html', category: 'pricing' },
        
        // Writing
        { id: 'writer', name: 'Proposal Writer', icon: '✍️', href: 'missionpulse-m10-writer-live.html', category: 'writing' },
        { id: 'outline', name: 'Proposal Outline', icon: '🗂️', href: 'missionpulse-m21-outline-live.html', category: 'writing' },
        { id: 'graphics', name: 'Graphics & Exhibits', icon: '🎨', href: 'missionpulse-m22-graphics-live.html', category: 'writing' },
        
        // Review
        { id: 'hitl', name: 'HITL Queue', icon: '👁️', href: 'missionpulse-m9-hitl-live.html', category: 'review' },
        { id: 'colorteam', name: 'Color Reviews', icon: '🔴', href: 'missionpulse-m19-colorteam-live.html', category: 'review' },
        
        // Management
        { id: 'teams', name: 'Team Assignments', icon: '👥', href: 'missionpulse-m15-teams-live.html', category: 'management' },
        { id: 'calendar', name: 'Proposal Calendar', icon: '📅', href: 'missionpulse-m24-calendar-live.html', category: 'management' },
        
        // Orals
        { id: 'orals', name: 'Orals Prep', icon: '🎤', href: 'missionpulse-m11-orals-live.html', category: 'orals' },
        
        // Knowledge
        { id: 'lessons', name: 'Lessons Learned', icon: '📚', href: 'missionpulse-m13-lessons-live.html', category: 'knowledge' },
        
        // Tools
        { id: 'reports', name: 'Reports & Export', icon: '📑', href: 'missionpulse-m26-reports-live.html', category: 'tools' }
    ],

    categories: {
        core: { name: 'Core', color: '#00E5FA', icon: '⚡' },
        capture: { name: 'Capture', color: '#10B981', icon: '🎯' },
        strategy: { name: 'Strategy', color: '#F59E0B', icon: '♟️' },
        compliance: { name: 'Compliance', color: '#06B6D4', icon: '✅' },
        pricing: { name: 'Pricing', color: '#8B5CF6', icon: '💰' },
        writing: { name: 'Writing', color: '#EC4899', icon: '✍️' },
        review: { name: 'Review', color: '#EF4444', icon: '👁️' },
        management: { name: 'Management', color: '#6366F1', icon: '📋' },
        orals: { name: 'Orals', color: '#F97316', icon: '🎤' },
        knowledge: { name: 'Knowledge', color: '#14B8A6', icon: '📚' },
        tools: { name: 'Tools', color: '#78716C', icon: '🔧' }
    },

    currentPage: null,
    isCollapsed: false,

    init(currentPageId) {
        this.currentPage = currentPageId;
        this.loadState();
        this.renderSidebar();
        this.renderMobileMenu();
    },

    loadState() {
        try {
            const saved = localStorage.getItem('missionpulse-nav-collapsed');
            this.isCollapsed = saved === 'true';
        } catch (e) {}
    },

    saveState() {
        try {
            localStorage.setItem('missionpulse-nav-collapsed', this.isCollapsed);
        } catch (e) {}
    },

    renderSidebar() {
        const sidebar = document.getElementById('missionpulse-sidebar');
        if (!sidebar) return;

        const grouped = this.groupByCategory();
        const width = this.isCollapsed ? '64px' : '260px';
        
        let html = `
            <div class="sidebar-header" style="padding: 1rem; border-bottom: 1px solid rgba(0, 229, 250, 0.2); display: flex; align-items: center; justify-content: space-between;">
                <a href="index.html" style="display: flex; align-items: center; gap: 0.75rem; text-decoration: none; overflow: hidden;">
                    <img src="MMT_icon_transparent.png" alt="MMT" style="width: 32px; height: 32px; flex-shrink: 0;" onerror="this.style.display='none'">
                    ${!this.isCollapsed ? `
                    <div style="white-space: nowrap;">
                        <div style="font-size: 1rem; font-weight: 700; color: #00E5FA;">MissionPulse</div>
                        <div style="font-size: 0.5rem; color: rgba(255,255,255,0.4); letter-spacing: 0.05em;">MISSION MEETS TECH</div>
                    </div>
                    ` : ''}
                </a>
                <button onclick="MissionPulseNav.toggleCollapse()" style="background: none; border: none; color: rgba(255,255,255,0.5); cursor: pointer; padding: 0.25rem; font-size: 1rem;" title="${this.isCollapsed ? 'Expand' : 'Collapse'}">
                    ${this.isCollapsed ? '→' : '←'}
                </button>
            </div>
            <nav class="sidebar-nav" style="padding: 0.75rem; overflow-y: auto; flex: 1;">
        `;

        for (const [catKey, modules] of Object.entries(grouped)) {
            const cat = this.categories[catKey];
            html += `
                <div class="nav-category" style="margin-bottom: 1rem;">
                    ${!this.isCollapsed ? `
                    <div style="font-size: 0.625rem; font-weight: 600; color: ${cat.color}; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.375rem; padding-left: 0.5rem; display: flex; align-items: center; gap: 0.375rem;">
                        <span>${cat.icon}</span> ${cat.name}
                    </div>
                    ` : `
                    <div style="text-align: center; margin-bottom: 0.25rem; font-size: 0.75rem; color: ${cat.color};" title="${cat.name}">${cat.icon}</div>
                    `}
            `;
            
            for (const mod of modules) {
                const isActive = mod.id === this.currentPage;
                html += `
                    <a href="${mod.href}" class="nav-link ${isActive ? 'active' : ''}" style="
                        display: flex;
                        align-items: center;
                        ${this.isCollapsed ? 'justify-content: center;' : 'gap: 0.625rem;'}
                        padding: ${this.isCollapsed ? '0.5rem' : '0.5rem 0.625rem'};
                        border-radius: 0.375rem;
                        text-decoration: none;
                        color: ${isActive ? '#00E5FA' : 'rgba(255,255,255,0.6)'};
                        background: ${isActive ? 'rgba(0, 229, 250, 0.1)' : 'transparent'};
                        border-left: ${this.isCollapsed ? 'none' : (isActive ? '2px solid #00E5FA' : '2px solid transparent')};
                        font-size: 0.8125rem;
                        transition: all 0.15s;
                        margin-bottom: 0.125rem;
                    " onmouseover="this.style.background='rgba(0, 229, 250, 0.05)'; this.style.color='#00E5FA';"
                       onmouseout="this.style.background='${isActive ? 'rgba(0, 229, 250, 0.1)' : 'transparent'}'; this.style.color='${isActive ? '#00E5FA' : 'rgba(255,255,255,0.6)}';"
                       title="${mod.name}">
                        <span style="font-size: 0.875rem;">${mod.icon}</span>
                        ${!this.isCollapsed ? `<span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${mod.name}</span>` : ''}
                    </a>
                `;
            }
            html += `</div>`;
        }

        html += `
            </nav>
            <div class="sidebar-footer" style="padding: 0.75rem; border-top: 1px solid rgba(0, 229, 250, 0.2); font-size: 0.5625rem; color: rgba(255,255,255,0.3); text-align: center;">
                ${!this.isCollapsed ? `
                <div id="nav-connection-status" style="margin-bottom: 0.25rem;">Checking...</div>
                <div>© 2025 Mission Meets Tech</div>
                ` : `
                <div id="nav-connection-status" title="Connection status">●</div>
                `}
            </div>
        `;

        sidebar.innerHTML = html;
        sidebar.style.cssText = `
            width: ${width};
            height: 100vh;
            position: fixed;
            left: 0;
            top: 0;
            background: linear-gradient(180deg, #000510 0%, #00050F 100%);
            border-right: 1px solid rgba(0, 229, 250, 0.2);
            display: flex;
            flex-direction: column;
            z-index: 1000;
            transition: width 0.2s ease;
        `;

        // Update main content margin
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.style.marginLeft = width;
            mainContent.style.transition = 'margin-left 0.2s ease';
        }

        this.checkConnection();
    },

    toggleCollapse() {
        this.isCollapsed = !this.isCollapsed;
        this.saveState();
        this.renderSidebar();
    },

    renderMobileMenu() {
        let mobileBtn = document.getElementById('mobile-menu-btn');
        if (!mobileBtn) {
            mobileBtn = document.createElement('button');
            mobileBtn.id = 'mobile-menu-btn';
            mobileBtn.innerHTML = '☰';
            mobileBtn.style.cssText = `
                display: none;
                position: fixed;
                top: 1rem;
                left: 1rem;
                z-index: 1001;
                background: rgba(0, 229, 250, 0.1);
                border: 1px solid rgba(0, 229, 250, 0.3);
                color: #00E5FA;
                font-size: 1.25rem;
                padding: 0.5rem 0.75rem;
                border-radius: 0.5rem;
                cursor: pointer;
            `;
            mobileBtn.onclick = () => this.toggleMobile();
            document.body.appendChild(mobileBtn);
        }

        // Responsive styles
        if (!document.getElementById('missionpulse-nav-styles')) {
            const style = document.createElement('style');
            style.id = 'missionpulse-nav-styles';
            style.textContent = `
                @media (max-width: 1024px) {
                    #missionpulse-sidebar {
                        transform: translateX(-100%);
                        transition: transform 0.3s ease;
                    }
                    #missionpulse-sidebar.open {
                        transform: translateX(0);
                    }
                    #mobile-menu-btn {
                        display: block !important;
                    }
                    .main-content {
                        margin-left: 0 !important;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    },

    toggleMobile() {
        const sidebar = document.getElementById('missionpulse-sidebar');
        if (sidebar) {
            sidebar.classList.toggle('open');
        }
    },

    groupByCategory() {
        const grouped = {};
        const order = ['core', 'capture', 'strategy', 'compliance', 'pricing', 'writing', 'review', 'management', 'orals', 'knowledge', 'tools'];
        
        for (const cat of order) {
            grouped[cat] = [];
        }
        
        for (const mod of this.modules) {
            if (grouped[mod.category]) {
                grouped[mod.category].push(mod);
            }
        }
        
        // Remove empty categories
        for (const cat of Object.keys(grouped)) {
            if (grouped[cat].length === 0) delete grouped[cat];
        }
        
        return grouped;
    },

    async checkConnection() {
        const statusEl = document.getElementById('nav-connection-status');
        if (!statusEl) return;

        try {
            if (typeof supabase !== 'undefined') {
                const { data, error } = await supabase.from('opportunities').select('id').limit(1);
                if (!error) {
                    statusEl.innerHTML = this.isCollapsed ? 
                        '<span style="color: #10B981;">●</span>' : 
                        '<span style="color: #10B981;">● Live Database</span>';
                    return;
                }
            }
            statusEl.innerHTML = this.isCollapsed ? 
                '<span style="color: #F59E0B;">●</span>' : 
                '<span style="color: #F59E0B;">● Demo Mode</span>';
        } catch (e) {
            statusEl.innerHTML = this.isCollapsed ? 
                '<span style="color: #F59E0B;">●</span>' : 
                '<span style="color: #F59E0B;">● Demo Mode</span>';
        }
    },

    // Get module by ID
    getModule(id) {
        return this.modules.find(m => m.id === id);
    },

    // Get modules by category
    getModulesByCategory(category) {
        return this.modules.filter(m => m.category === category);
    }
};

// Auto-init
document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('missionpulse-sidebar');
    if (sidebar) {
        const pageId = sidebar.dataset.currentPage || 'dashboard';
        MissionPulseNav.init(pageId);
    }
});
