/**
 * MissionPulse Auth Guard
 * Protects pages and manages session state
 * Version: 1.0.0
 */

(function() {
    'use strict';
    
    // Pages that don't require authentication
    const PUBLIC_PAGES = [
        '/login.html',
        '/reset-password.html',
        '/accept-invite.html',
        '/404.html'
    ];
    
    // Current page path
    const currentPath = window.location.pathname;
    
    // Check if current page is public
    const isPublicPage = PUBLIC_PAGES.some(page => currentPath.endsWith(page));
    
    /**
     * Initialize auth guard
     */
    async function initAuthGuard() {
        console.log('🛡️ Auth Guard initializing...');
        
        // Wait for Supabase to be ready
        if (!window.mpSupabase) {
            console.error('❌ Supabase client not found. Make sure supabase-client.js is loaded first.');
            return;
        }
        
        try {
            // Check current session
            const session = await window.mpSupabase.auth.getSession();
            
            if (session) {
                console.log('✅ User authenticated:', session.user.email);
                
                // If on public page, redirect to dashboard
                if (isPublicPage && !currentPath.includes('reset-password')) {
                    window.location.href = '/index.html';
                    return;
                }
                
                // Load user profile and set global state
                await loadUserState(session.user);
                
                // Setup auth state listener for changes
                setupAuthListener();
                
            } else {
                console.log('⚠️ No active session');
                
                // If on protected page, redirect to login
                if (!isPublicPage) {
                    console.log('🔒 Redirecting to login...');
                    const returnUrl = encodeURIComponent(window.location.href);
                    window.location.href = `/login.html?returnUrl=${returnUrl}`;
                    return;
                }
            }
            
            // Dispatch event that auth check is complete
            document.dispatchEvent(new CustomEvent('mp:authReady', { 
                detail: { authenticated: !!session, user: session?.user || null }
            }));
            
        } catch (error) {
            console.error('❌ Auth guard error:', error);
            
            // On error, redirect to login for protected pages
            if (!isPublicPage) {
                window.location.href = '/login.html';
            }
        }
    }
    
    /**
     * Load user state and profile
     */
    async function loadUserState(authUser) {
        try {
            // Get user profile from database
            const profile = await window.mpSupabase.db.getUserProfile(authUser.id);
            
            // Create global user state
            window.mpUser = {
                id: authUser.id,
                email: authUser.email,
                fullName: profile?.full_name || authUser.user_metadata?.full_name || 'User',
                role: profile?.role || 'viewer',
                companyId: profile?.company_id || null,
                companyName: profile?.companies?.name || null,
                avatarUrl: profile?.avatar_url || null,
                permissions: getPermissionsForRole(profile?.role || 'viewer')
            };
            
            console.log('👤 User state loaded:', window.mpUser.fullName, '|', window.mpUser.role);
            
            // Update UI with user info
            updateUserUI();
            
            // Check role-based access for current page
            checkPageAccess();
            
        } catch (error) {
            console.error('❌ Error loading user state:', error);
        }
    }
    
    /**
     * Get permissions array for role
     */
    function getPermissionsForRole(role) {
        const rolePermissions = {
            'admin': ['all'],
            'ceo': ['view_all', 'go_nogo', 'approve_pricing', 'view_financials', 'manage_partners'],
            'coo': ['view_all', 'manage_captures', 'assign_resources', 'view_financials'],
            'capture_manager': ['view_captures', 'manage_proposals', 'assign_team', 'black_hat'],
            'proposal_manager': ['view_proposals', 'edit_sections', 'compliance', 'schedule'],
            'solution_architect': ['edit_technical', 'edit_management', 'pricing_support'],
            'finance': ['view_financials', 'pricing', 'boe'],
            'contracts': ['compliance', 'far_dfars', 'terms'],
            'delivery': ['staffing', 'resumes', 'past_performance'],
            'qa': ['review_all', 'compliance_check', 'quality_gate'],
            'partner': ['view_assigned', 'edit_assigned'],
            'viewer': ['view_only']
        };
        
        return rolePermissions[role] || ['view_only'];
    }
    
    /**
     * Update UI elements with user info
     */
    function updateUserUI() {
        if (!window.mpUser) return;
        
        // Update user name displays
        document.querySelectorAll('[data-mp-user-name]').forEach(el => {
            el.textContent = window.mpUser.fullName;
        });
        
        // Update user email displays
        document.querySelectorAll('[data-mp-user-email]').forEach(el => {
            el.textContent = window.mpUser.email;
        });
        
        // Update user role displays
        document.querySelectorAll('[data-mp-user-role]').forEach(el => {
            el.textContent = formatRole(window.mpUser.role);
        });
        
        // Update user avatar displays
        document.querySelectorAll('[data-mp-user-avatar]').forEach(el => {
            if (window.mpUser.avatarUrl) {
                el.src = window.mpUser.avatarUrl;
            } else {
                // Generate initials avatar
                el.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(window.mpUser.fullName)}&background=00E5FA&color=00050F&bold=true`;
            }
        });
        
        // Update company name displays
        document.querySelectorAll('[data-mp-company-name]').forEach(el => {
            el.textContent = window.mpUser.companyName || 'No Company';
        });
        
        // Handle role-based element visibility
        document.querySelectorAll('[data-mp-role]').forEach(el => {
            const allowedRoles = el.dataset.mpRole.split(',').map(r => r.trim());
            const hasAccess = allowedRoles.includes(window.mpUser.role) || 
                              allowedRoles.includes('all') ||
                              window.mpUser.role === 'admin';
            
            if (!hasAccess) {
                el.style.display = 'none';
            }
        });
        
        // Handle permission-based element visibility
        document.querySelectorAll('[data-mp-permission]').forEach(el => {
            const requiredPermission = el.dataset.mpPermission;
            const hasPermission = window.mpUser.permissions.includes('all') ||
                                  window.mpUser.permissions.includes(requiredPermission);
            
            if (!hasPermission) {
                el.style.display = 'none';
            }
        });
    }
    
    /**
     * Format role for display
     */
    function formatRole(role) {
        const roleLabels = {
            'admin': 'Administrator',
            'ceo': 'CEO',
            'coo': 'COO',
            'capture_manager': 'Capture Manager',
            'proposal_manager': 'Proposal Manager',
            'solution_architect': 'Solution Architect',
            'finance': 'Finance',
            'contracts': 'Contracts',
            'delivery': 'Delivery',
            'qa': 'Quality Assurance',
            'partner': 'Partner',
            'viewer': 'Viewer'
        };
        
        return roleLabels[role] || role;
    }
    
    /**
     * Check if user has access to current page
     */
    function checkPageAccess() {
        // Get page-required roles from body data attribute
        const requiredRoles = document.body.dataset.mpRequiredRoles;
        
        if (!requiredRoles) return; // No restrictions
        
        const allowedRoles = requiredRoles.split(',').map(r => r.trim());
        const hasAccess = allowedRoles.includes(window.mpUser.role) || 
                          window.mpUser.role === 'admin';
        
        if (!hasAccess) {
            console.warn('🚫 Access denied to this page');
            window.location.href = '/index.html?access=denied';
        }
    }
    
    /**
     * Setup auth state change listener
     */
    function setupAuthListener() {
        window.mpSupabase.auth.onStateChange((event, session) => {
            console.log('🔐 Auth event:', event);
            
            if (event === 'SIGNED_OUT') {
                // Clear user state
                window.mpUser = null;
                
                // Redirect to login
                window.location.href = '/login.html';
            }
            
            if (event === 'TOKEN_REFRESHED') {
                console.log('🔄 Session token refreshed');
            }
            
            if (event === 'USER_UPDATED') {
                // Reload user state
                if (session?.user) {
                    loadUserState(session.user);
                }
            }
        });
    }
    
    /**
     * Logout helper function
     */
    window.mpLogout = async function() {
        try {
            await window.mpSupabase.auth.signOut();
        } catch (error) {
            console.error('❌ Logout error:', error);
            // Force redirect even on error
            window.location.href = '/login.html';
        }
    };
    
    /**
     * Check permission helper
     */
    window.mpHasPermission = function(permission) {
        if (!window.mpUser) return false;
        return window.mpUser.permissions.includes('all') || 
               window.mpUser.permissions.includes(permission);
    };
    
    /**
     * Check role helper
     */
    window.mpHasRole = function(role) {
        if (!window.mpUser) return false;
        if (window.mpUser.role === 'admin') return true;
        return window.mpUser.role === role;
    };
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAuthGuard);
    } else {
        initAuthGuard();
    }
    
})();

console.log('✅ MissionPulse Auth Guard loaded');
