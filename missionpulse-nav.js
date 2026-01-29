/**
 * MissionPulse Navigation Component
 * v2.1 - Sprint 41: Added Competitor Intel Tracker (m27)
 * © 2026 Mission Meets Tech
 */

(function() {
    'use strict';

    // Module definitions - 27 total
    var modules = [
        { id: 'dashboard', icon: '📊', label: 'Dashboard', href: 'index.html', category: 'core' },
        { id: 'pipeline', icon: '🎯', label: 'Pipeline', href: 'missionpulse-executive-dashboard.html', category: 'core' },
        
        // Capture & Strategy
        { id: 'capture', icon: '🔍', label: 'Capture Board', href: 'missionpulse-m1-enhanced.html', category: 'capture' },
        { id: 'blackhat', icon: '🎭', label: 'Black Hat Analysis', href: 'missionpulse-m7-blackhat-live.html', category: 'capture' },
        { id: 'intel', icon: '🔍', label: 'Intel Tracker', href: 'missionpulse-m27-intel-live.html', category: 'capture', isNew: true },
        { id: 'winthemes', icon: '🏆', label: 'Win Themes', href: 'missionpulse-m12-winthemes-live.html', category: 'capture' },
        { id: 'teaming', icon: '🤝', label: 'Teaming Partners', href: 'missionpulse-m18-teaming-live.html', category: 'capture' },
        
        // Proposal Development
        { id: 'compliance', icon: '✅', label: 'Compliance Matrix', href: 'missionpulse-m6-compliance-live.html', category: 'proposal' },
        { id: 'checklist', icon: '📋', label: 'Compliance Checklist', href: 'missionpulse-m16-compliance-checklist-live.html', category: 'proposal' },
        { id: 'outline', icon: '📑', label: 'Proposal Outline', href: 'missionpulse-m21-outline-live.html', category: 'proposal' },
        { id: 'writer', icon: '✍️', label: 'Proposal Writer', href: 'missionpulse-m10-writer-live.html', category: 'proposal' },
        { id: 'graphics', icon: '🎨', label: 'Graphics Tracker', href: 'missionpulse-m22-graphics-live.html', category: 'proposal' },
        
        // Pricing & Contracts
        { id: 'pricing', icon: '💰', label: 'Pricing & BOE', href: 'missionpulse-m8-pricing-live.html', category: 'pricing' },
        { id: 'contracts', icon: '📄', label: 'Contracts Library', href: 'missionpulse-m5-contracts-live.html', category: 'pricing' },
        
        // Reviews & Quality
        { id: 'colorteam', icon: '🎨', label: 'Color Team Reviews', href: 'missionpulse-m19-colorteam-live.html', category: 'reviews' },
        { id: 'hitl', icon: '👤', label: 'HITL Queue', href: 'missionpulse-m9-hitl-live.html', category: 'reviews' },
        { id: 'questions', icon: '❓', label: 'Questions to Gov', href: 'missionpulse-m23-questions-live.html', category: 'reviews' },
        { id: 'amendments', icon: '📝', label: 'RFP Amendments', href: 'missionpulse-m20-amendments-live.html', category: 'reviews' },
        
        // Team & Schedule
        { id: 'teams', icon: '👥', label: 'Team Assignments', href: 'missionpulse-m15-teams-live.html', category: 'team' },
        { id: 'calendar', icon: '📅', label: 'Proposal Calendar', href: 'missionpulse-m24-calendar-live.html', category: 'team' },
        { id: 'risks', icon: '⚠️', label: 'Risk Register', href: 'missionpulse-m14-risks-live.html', category: 'team' },
        
        // Knowledge & Orals
        { id: 'orals', icon: '🎤', label: 'Orals Prep', href: 'missionpulse-m11-orals-live.html', category: 'knowledge' },
        { id: 'pastperf', icon: '📈', label: 'Past Performance', href: 'missionpulse-m17-pastperformance-live.html', category: 'knowledge' },
        { id: 'lessons', icon: '💡', label: 'Lessons Learned', href: 'missionpulse-m13-lessons-live.html', category: 'knowledge' },
        
        // Reports & Admin
        { id: 'reports', icon: '📊', label: 'Reports & Export', href: 'missionpulse-m26-reports-live.html', category: 'admin' },
        { id: 'executive', icon: '📈', label: 'Executive Dashboard', href: 'missionpulse-m25-executive-live.html', category: 'admin' },
        { id: 'modules', icon: '🧩', label: 'All Modules', href: 'missionpulse-module-index.html', category: 'admin' }
    ];

    var categories = {
        core: { label: 'Overview', collapsed: false },
        capture: { label: 'Capture & Strategy', collapsed: false },
        proposal: { label: 'Proposal Development', collapsed: false },
        pricing: { label: 'Pricing & Contracts', collapsed: true },
        reviews: { label: 'Reviews & Quality', collapsed: true },
        team: { label: 'Team & Schedule', collapsed: true },
        knowledge: { label: 'Knowledge Base', collapsed: true },
        admin: { label: 'Reports & Admin', collapsed: true }
    };

    function getCurrentPage() {
        var sidebar = document.getElementById('missionpulse-sidebar');
        if (sidebar && sidebar.dataset.currentPage) {
            return sidebar.dataset.currentPage;
        }
        var path = window.location.pathname;
        var filename = path.split('/').pop() || 'index.html';
        var match = modules.find(function(m) { return m.href === filename; });
        return match ? match.id : 'dashboard';
    }

    function renderNav() {
        var container = document.getElementById('missionpulse-sidebar');
        if (!container) return;

        var currentPage = getCurrentPage();
        var profile = null;
        try {
            profile = JSON.parse(localStorage.getItem('missionpulse_profile') || '{}');
        } catch (e) {}

        var html = '';
        html += '<div style="position: fixed; top: 0; left: 0; width: 256px; height: 100vh; background: linear-gradient(180deg, #000a14 0%, #00050F 100%); border-right: 1px solid rgba(0, 229, 250, 0.2); overflow-y: auto; z-index: 40;">';
        
        // Header
        html += '<div style="padding: 20px; border-bottom: 1px solid rgba(0, 229, 250, 0.1);">';
        html += '  <a href="index.html" style="display: flex; align-items: center; gap: 12px; text-decoration: none;">';
        html += '    <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #00E5FA 0%, #0088cc 100%); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px;">🚀</div>';
        html += '    <div>';
        html += '      <div style="font-weight: 700; font-size: 18px; color: white;">MissionPulse</div>';
        html += '      <div style="font-size: 11px; color: #00E5FA;">Mission Meets Tech</div>';
        html += '    </div>';
        html += '  </a>';
        html += '</div>';

        // User info
        if (profile && profile.full_name) {
            html += '<div style="padding: 12px 20px; border-bottom: 1px solid rgba(0, 229, 250, 0.1); display: flex; align-items: center; gap: 10px;">';
            html += '  <div style="width: 32px; height: 32px; background: rgba(0, 229, 250, 0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #00E5FA; font-size: 14px;">' + (profile.full_name.charAt(0) || 'U') + '</div>';
            html += '  <div>';
            html += '    <div style="font-size: 13px; color: white;">' + escapeHtml(profile.full_name) + '</div>';
            html += '    <div style="font-size: 11px; color: #00E5FA;">' + (profile.role || 'User') + '</div>';
            html += '  </div>';
            html += '</div>';
        }

        // Navigation sections
        html += '<nav style="padding: 12px 0;">';
        
        Object.keys(categories).forEach(function(catId) {
            var cat = categories[catId];
            var catModules = modules.filter(function(m) { return m.category === catId; });
            if (catModules.length === 0) return;

            html += '<div style="margin-bottom: 8px;">';
            html += '  <div style="padding: 8px 20px; font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.5px;">' + cat.label + '</div>';
            
            catModules.forEach(function(mod) {
                var isActive = mod.id === currentPage;
                var bgStyle = isActive ? 'background: rgba(0, 229, 250, 0.15); border-right: 3px solid #00E5FA;' : '';
                var textColor = isActive ? '#00E5FA' : 'rgba(255,255,255,0.7)';
                
                html += '<a href="' + mod.href + '" style="display: flex; align-items: center; gap: 10px; padding: 10px 20px; text-decoration: none; color: ' + textColor + '; transition: all 0.2s; ' + bgStyle + '" onmouseover="this.style.background=\'rgba(0,229,250,0.1)\'" onmouseout="this.style.background=\'' + (isActive ? 'rgba(0,229,250,0.15)' : 'transparent') + '\'">';
                html += '  <span style="font-size: 16px;">' + mod.icon + '</span>';
                html += '  <span style="font-size: 14px;">' + mod.label + '</span>';
                if (mod.isNew) {
                    html += '  <span style="background: #00E5FA; color: #00050F; font-size: 9px; padding: 2px 6px; border-radius: 9999px; font-weight: 600;">NEW</span>';
                }
                html += '</a>';
            });
            
            html += '</div>';
        });

        html += '</nav>';

        // Footer
        html += '<div style="position: absolute; bottom: 0; left: 0; right: 0; padding: 16px 20px; border-top: 1px solid rgba(0, 229, 250, 0.1); background: #00050F;">';
        html += '  <a href="#" onclick="handleLogout(); return false;" style="display: flex; align-items: center; gap: 8px; color: rgba(255,255,255,0.5); text-decoration: none; font-size: 13px;" onmouseover="this.style.color=\'#ef4444\'" onmouseout="this.style.color=\'rgba(255,255,255,0.5)\'">';
        html += '    <svg style="width: 16px; height: 16px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>';
        html += '    Sign Out';
        html += '  </a>';
        html += '</div>';

        html += '</div>';

        container.innerHTML = html;
    }

    function handleLogout() {
        localStorage.removeItem('missionpulse_session');
        localStorage.removeItem('missionpulse_user');
        localStorage.removeItem('missionpulse_profile');
        window.location.href = 'login.html';
    }

    function escapeHtml(text) {
        if (!text) return '';
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Expose logout globally
    window.handleLogout = handleLogout;

    // Render on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', renderNav);
    } else {
        renderNav();
    }
})();
