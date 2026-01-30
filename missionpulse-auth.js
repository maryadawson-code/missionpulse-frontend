/**
 * MissionPulse Auth Helper
 * Include this in all protected pages for session management
 * 
 * Usage:
 * <script src="missionpulse-auth.js"></script>
 * <script>
 *   // Check auth on page load
 *   const user = MissionPulseAuth.requireAuth();
 *   // Or for optional auth (demo mode allowed)
 *   const user = MissionPulseAuth.getUser();
 * </script>
 */

const MissionPulseAuth = (function() {
    // =========================================================================
    // CONFIGURATION
    // =========================================================================
    const SUPABASE_URL = 'https://qdrtpnpnhkxvfmvfziop.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkcnRwbnBuaGt4dmZtdmZ6aW9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc1NjcyNTAsImV4cCI6MjA1MzE0MzI1MH0.gVLpPz-EdNICBxkSh6l4_dlUHgfmwHcGLgv-OL1gkIA';
    const LOGIN_PAGE = 'missionpulse-login.html';
    const DASHBOARD_PAGE = 'missionpulse-dashboard-hub.html';

    let supabaseClient = null;
    let currentUser = null;

    // =========================================================================
    // INITIALIZE SUPABASE
    // =========================================================================
    function initSupabase() {
        if (!supabaseClient && window.supabase) {
            supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        }
        return supabaseClient;
    }

    // =========================================================================
    // GET CURRENT USER
    // =========================================================================
    function getUser() {
        // Check localStorage for user info (works for both real auth and demo mode)
        const stored = localStorage.getItem('missionpulse_user');
        if (stored) {
            try {
                currentUser = JSON.parse(stored);
                return currentUser;
            } catch (e) {
                console.error('Failed to parse stored user:', e);
            }
        }
        return null;
    }

    // =========================================================================
    // CHECK IF DEMO MODE
    // =========================================================================
    function isDemoMode() {
        return localStorage.getItem('missionpulse_demo_mode') === 'true';
    }

    // =========================================================================
    // REQUIRE AUTH (Redirect if not logged in)
    // =========================================================================
    function requireAuth(options = {}) {
        const { allowDemo = true, requiredRoles = [] } = options;
        
        const user = getUser();
        
        // No user found
        if (!user) {
            console.log('No user found, redirecting to login');
            window.location.href = LOGIN_PAGE;
            return null;
        }

        // Demo mode check
        if (user.isDemo && !allowDemo) {
            console.log('Demo mode not allowed for this page');
            window.location.href = LOGIN_PAGE;
            return null;
        }

        // Role check
        if (requiredRoles.length > 0) {
            const userRole = (user.role || '').toLowerCase();
            const hasRole = requiredRoles.some(r => r.toLowerCase() === userRole);
            
            if (!hasRole) {
                console.log('User does not have required role');
                // Don't redirect, just return null - let the page handle it
                return null;
            }
        }

        return user;
    }

    // =========================================================================
    // CHECK ROLE ACCESS (for RBAC)
    // =========================================================================
    function hasRole(allowedRoles) {
        const user = getUser();
        if (!user) return false;
        
        const userRole = (user.role || '').toLowerCase();
        return allowedRoles.some(r => r.toLowerCase() === userRole);
    }

    // =========================================================================
    // ROLE-BASED ACCESS CONTROL HELPERS
    // =========================================================================
    const RBAC = {
        // CUI-restricted modules (Pricing, sensitive data)
        CUI_ROLES: ['ceo', 'coo', 'fin', 'admin'],
        
        // Black Hat / Competitive Intel
        BLACK_HAT_ROLES: ['ceo', 'coo', 'cap', 'admin'],
        
        // HITL Approval Queue
        HITL_ROLES: ['ceo', 'coo', 'cap', 'pm', 'qa', 'admin'],
        
        // Admin functions
        ADMIN_ROLES: ['ceo', 'coo', 'admin'],
        
        // All standard roles
        ALL_ROLES: ['ceo', 'coo', 'cap', 'pm', 'sa', 'fin', 'con', 'del', 'qa', 'partner', 'admin'],

        canAccessCUI: () => hasRole(RBAC.CUI_ROLES),
        canAccessBlackHat: () => hasRole(RBAC.BLACK_HAT_ROLES),
        canAccessHITL: () => hasRole(RBAC.HITL_ROLES),
        canAccessAdmin: () => hasRole(RBAC.ADMIN_ROLES),
        isAuthenticated: () => getUser() !== null
    };

    // =========================================================================
    // LOGOUT
    // =========================================================================
    async function logout() {
        try {
            const client = initSupabase();
            if (client) {
                await client.auth.signOut();
            }
        } catch (e) {
            console.error('Logout error:', e);
        }
        
        // Clear local storage
        localStorage.removeItem('missionpulse_user');
        localStorage.removeItem('missionpulse_demo_mode');
        
        // Redirect to login
        window.location.href = LOGIN_PAGE;
    }

    // =========================================================================
    // GET SESSION FROM SUPABASE
    // =========================================================================
    async function getSession() {
        try {
            const client = initSupabase();
            if (!client) return null;
            
            const { data: { session } } = await client.auth.getSession();
            return session;
        } catch (e) {
            console.error('Get session error:', e);
            return null;
        }
    }

    // =========================================================================
    // REFRESH SESSION
    // =========================================================================
    async function refreshSession() {
        try {
            const client = initSupabase();
            if (!client) return null;
            
            const { data: { session }, error } = await client.auth.refreshSession();
            if (error) throw error;
            
            if (session) {
                localStorage.setItem('missionpulse_user', JSON.stringify({
                    id: session.user.id,
                    email: session.user.email,
                    role: session.user.user_metadata?.role || 'user',
                    name: session.user.user_metadata?.name || session.user.email.split('@')[0]
                }));
            }
            
            return session;
        } catch (e) {
            console.error('Refresh session error:', e);
            return null;
        }
    }

    // =========================================================================
    // RENDER USER MENU (Utility for pages)
    // =========================================================================
    function renderUserMenu(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const user = getUser();
        const isDemo = isDemoMode();

        container.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="text-right hidden md:block">
                    <div class="text-sm font-medium text-white">${user?.name || 'Guest'}</div>
                    <div class="text-xs text-slate-400">${user?.role?.toUpperCase() || 'USER'}${isDemo ? ' (Demo)' : ''}</div>
                </div>
                <div class="relative">
                    <button 
                        onclick="MissionPulseAuth.toggleUserDropdown()"
                        class="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center text-slate-900 font-bold"
                    >
                        ${(user?.name || 'U')[0].toUpperCase()}
                    </button>
                    <div id="user-dropdown" class="hidden absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50">
                        <div class="p-3 border-b border-slate-700">
                            <div class="text-sm font-medium text-white">${user?.email || 'guest@demo.com'}</div>
                            <div class="text-xs text-slate-400">${user?.role?.toUpperCase() || 'USER'}</div>
                        </div>
                        <a href="missionpulse-settings.html" class="block px-4 py-2 text-sm text-slate-300 hover:bg-slate-700">⚙️ Settings</a>
                        <button onclick="MissionPulseAuth.logout()" class="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-slate-700">🚪 Sign Out</button>
                    </div>
                </div>
            </div>
        `;
    }

    function toggleUserDropdown() {
        const dropdown = document.getElementById('user-dropdown');
        if (dropdown) {
            dropdown.classList.toggle('hidden');
        }
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        const dropdown = document.getElementById('user-dropdown');
        if (dropdown && !e.target.closest('#user-dropdown') && !e.target.closest('button')) {
            dropdown.classList.add('hidden');
        }
    });

    // =========================================================================
    // PUBLIC API
    // =========================================================================
    return {
        // Core auth functions
        getUser,
        requireAuth,
        logout,
        getSession,
        refreshSession,
        
        // Status checks
        isDemoMode,
        hasRole,
        
        // RBAC helpers
        RBAC,
        
        // UI helpers
        renderUserMenu,
        toggleUserDropdown,
        
        // Supabase access
        getSupabase: initSupabase,
        
        // Constants
        SUPABASE_URL,
        LOGIN_PAGE,
        DASHBOARD_PAGE
    };
})();

// Auto-initialize on load
if (typeof window !== 'undefined') {
    window.MissionPulseAuth = MissionPulseAuth;
}
