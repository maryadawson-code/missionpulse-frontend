// FILE: missionpulse-nav.js
// ROLE: All Users  
// VERSION: 2.2 - Complete with all 26 modules
// © 2025 Mission Meets Tech

const MissionPulseNav = {
    modules: [
        // Core
        { id: 'dashboard', name: 'Dashboard', icon: '🎯', href: 'index.html', category: 'core' },
        { id: 'executive', name: 'Executive Dashboard', icon: '📊', href: 'missionpulse-m25-executive-live.html', category: 'core' },
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
        try { this.isCollapsed = localStorage.getItem('missionpulse-nav-collapsed') === 'true'; } catch (e) {}
    },

    saveState() {
        try { localStorage.setItem('missionpulse-nav-collapsed', this.isCollapsed); } catch (e) {}
    },

    renderSidebar() {
        const sidebar = document.getElementById('missionpulse-sidebar');
        if (!sidebar) return;
        const grouped = this.groupByCategory();
        const width = this.isCollapsed ? '64px' : '260px';
        
        let html = `
            <div style="padding: 1rem; border-bottom: 1px solid rgba(0, 229, 250, 0.2); display: flex; align-items: center; justify-content: space-between;">
                <a href="index.html" style="display: flex; align-items: center; gap: 0.75rem; text-decoration: none;">
                    <img src="MMT_icon_transparent.png" alt="MMT" style="width: 32px; height: 32px;" onerror="this.style.display='none'">
                    ${!this.isCollapsed ? `<div><div style="font-size: 1rem; font-weight: 700; color: #00E5FA;">MissionPulse</div><div style="font-size: 0.5rem; color: rgba(255,255,255,0.4);">MISSION MEETS TECH</div></div>` : ''}
                </a>
                <button onclick="MissionPulseNav.toggleCollapse()" style="background: none; border: none; color: rgba(255,255,255,0.5); cursor: pointer;">${this.isCollapsed ? '→' : '←'}</button>
            </div>
            <nav style="padding: 0.75rem; overflow-y: auto; flex: 1;">
        `;

        for (const [catKey, modules] of Object.entries(grouped)) {
            const cat = this.categories[catKey];
            if (!cat) continue;
            html += `<div style="margin-bottom: 1rem;">`;
            if (!this.isCollapsed) {
                html += `<div style="font-size: 0.625rem; font-weight: 600; color: ${cat.color}; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.375rem; padding-left: 0.5rem;">${cat.icon} ${cat.name}</div>`;
            } else {
                html += `<div style="text-align: center; margin-bottom: 0.25rem; font-size: 0.75rem; color: ${cat.color};" title="${cat.name}">${cat.icon}</div>`;
            }
            for (const mod of modules) {
                const isActive = mod.id === this.currentPage;
                html += `<a href="${mod.href}" style="display: flex; align-items: center; ${this.isCollapsed ? 'justify-content: center;' : 'gap: 0.625rem;'} padding: ${this.isCollapsed ? '0.5rem' : '0.5rem 0.625rem'}; border-radius: 0.375rem; text-decoration: none; color: ${isActive ? '#00E5FA' : 'rgba(255,255,255,0.6)'}; background: ${isActive ? 'rgba(0, 229, 250, 0.1)' : 'transparent'}; border-left: ${this.isCollapsed ? 'none' : (isActive ? '2px solid #00E5FA' : '2px solid transparent')}; font-size: 0.8125rem; margin-bottom: 0.125rem;" title="${mod.name}"><span style="font-size: 0.875rem;">${mod.icon}</span>${!this.isCollapsed ? `<span>${mod.name}</span>` : ''}</a>`;
            }
            html += `</div>`;
        }

        html += `</nav><div style="padding: 0.75rem; border-top: 1px solid rgba(0, 229, 250, 0.2); font-size: 0.5625rem; color: rgba(255,255,255,0.3); text-align: center;">${!this.isCollapsed ? '<div id="nav-connection-status">Checking...</div><div>© 2025 Mission Meets Tech</div>' : '<div id="nav-connection-status">●</div>'}</div>`;

        sidebar.innerHTML = html;
        sidebar.style.cssText = `width: ${width}; height: 100vh; position: fixed; left: 0; top: 0; background: linear-gradient(180deg, #000510 0%, #00050F 100%); border-right: 1px solid rgba(0, 229, 250, 0.2); display: flex; flex-direction: column; z-index: 1000; transition: width 0.2s;`;
        
        const main = document.querySelector('.main-content');
        if (main) { main.style.marginLeft = width; main.style.transition = 'margin-left 0.2s'; }
        this.checkConnection();
    },

    toggleCollapse() { this.isCollapsed = !this.isCollapsed; this.saveState(); this.renderSidebar(); },

    renderMobileMenu() {
        if (document.getElementById('mobile-menu-btn')) return;
        const btn = document.createElement('button');
        btn.id = 'mobile-menu-btn';
        btn.innerHTML = '☰';
        btn.style.cssText = 'display: none; position: fixed; top: 1rem; left: 1rem; z-index: 1001; background: rgba(0, 229, 250, 0.1); border: 1px solid rgba(0, 229, 250, 0.3); color: #00E5FA; font-size: 1.25rem; padding: 0.5rem 0.75rem; border-radius: 0.5rem; cursor: pointer;';
        btn.onclick = () => document.getElementById('missionpulse-sidebar')?.classList.toggle('open');
        document.body.appendChild(btn);
        if (!document.getElementById('missionpulse-nav-styles')) {
            const style = document.createElement('style');
            style.id = 'missionpulse-nav-styles';
            style.textContent = '@media (max-width: 1024px) { #missionpulse-sidebar { transform: translateX(-100%); } #missionpulse-sidebar.open { transform: translateX(0); } #mobile-menu-btn { display: block !important; } .main-content { margin-left: 0 !important; } }';
            document.head.appendChild(style);
        }
    },

    groupByCategory() {
        const grouped = {}, order = ['core', 'capture', 'strategy', 'compliance', 'pricing', 'writing', 'review', 'management', 'orals', 'knowledge', 'tools'];
        for (const cat of order) grouped[cat] = [];
        for (const mod of this.modules) if (grouped[mod.category]) grouped[mod.category].push(mod);
        for (const cat of Object.keys(grouped)) if (!grouped[cat].length) delete grouped[cat];
        return grouped;
    },

    async checkConnection() {
        const el = document.getElementById('nav-connection-status');
        if (!el) return;
        try {
            if (typeof supabase !== 'undefined') {
                const { error } = await supabase.from('opportunities').select('id').limit(1);
                el.innerHTML = error ? (this.isCollapsed ? '<span style="color: #F59E0B;">●</span>' : '<span style="color: #F59E0B;">● Demo Mode</span>') : (this.isCollapsed ? '<span style="color: #10B981;">●</span>' : '<span style="color: #10B981;">● Live Database</span>');
                return;
            }
        } catch (e) {}
        el.innerHTML = this.isCollapsed ? '<span style="color: #F59E0B;">●</span>' : '<span style="color: #F59E0B;">● Demo Mode</span>';
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('missionpulse-sidebar');
    if (sidebar) MissionPulseNav.init(sidebar.dataset.currentPage || 'dashboard');
});
