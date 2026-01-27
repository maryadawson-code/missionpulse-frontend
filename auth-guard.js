/**
 * MissionPulse Auth Guard
 * =======================
 * Protects pages with authentication and RBAC checks
 * Include this script on every protected page AFTER supabase-client.js
 * 
 * Usage:
 *   <script src="supabase-client.js"></script>
 *   <script src="auth-guard.js" data-required-roles="CEO,COO,Admin"></script>
 * 
 * @version 1.0.0
 * @author Mission Meets Tech
 */

(async function() {
    'use strict';

    // ============================================
    // CONFIGURATION
    // ============================================
    const AUTH_CONFIG = {
        loginPage: 'login.html',
        dashboardPage: 'index.html',
        unauthorizedPage: 'unauthorized.html',
        sessionCheckInterval: 60000, // Check session every minute
        maxIdleTime: 30 * 60 * 1000  // 30 minutes idle timeout
    };

    // Get required roles from script tag data attribute
    const currentScript = document.currentScript;
    const requiredRoles = currentScript?.dataset?.requiredRoles?.split(',').map(r => r.trim()) || [];
    const requiredPermissions = currentScript?.dataset?.requiredPermissions?.split(',').map(p => p.trim()) || [];
    const isPublicPage = currentScript?.dataset?.public === 'true';

    // ============================================
    // LOADING OVERLAY
    // ============================================
    function showLoadingOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'auth-loading-overlay';
        overlay.innerHTML = `
            <style>
                #auth-loading-overlay {
                    position: fixed;
                    inset: 0;
                    background: #00050F;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 99999;
                    transition: opacity 0.3s ease;
                }
                #auth-loading-overlay.fade-out {
                    opacity: 0;
                    pointer-events: none;
                }
                .auth-spinner {
                    width: 48px;
                    height: 48px;
                    border: 3px solid #1e3a5f;
                    border-top-color: #00E5FA;
                    border-radius: 50%;
                    animation: auth-spin 0.8s linear infinite;
                }
                @keyframes auth-spin {
                    to { transform: rotate(360deg); }
                }
            </style>
            <div class="auth-spinner"></div>
        `;
        document.body.prepend(overlay);
    }

    function hideLoadingOverlay() {
        const overlay = document.getElementById('auth-loading-overlay');
        if (overlay) {
            overlay.classList.add('fade-out');
            setTimeout(() => overlay.remove(), 300);
        }
    }

    // ============================================
    // AUTH CHECK FUNCTIONS
    // ============================================
    async function checkAuthentication() {
        try {
            const user = await MissionPulse.getCurrentUser();
            return user;
        } catch (error) {
            console.error('Auth check failed:', error);
            return null;
        }
    }

    async function checkAuthorization(user) {
        if (!user) return false;
        if (requiredRoles.length === 0 && requiredPermissions.length === 0) return true;

        try {
            const profile = await MissionPulse.getUserProfile();
            if (!profile) return false;

            // Check roles
            if (requiredRoles.length > 0) {
                const hasRole = requiredRoles.includes(profile.role?.name);
                if (!hasRole) return false;
            }

            // Check permissions
            if (requiredPermissions.length > 0) {
                for (const permission of requiredPermissions) {
                    const hasPerm = await MissionPulse.hasPermission(permission);
                    if (!hasPerm) return false;
                }
            }

            return true;
        } catch (error) {
            console.error('Authorization check failed:', error);
            return false;
        }
    }

    // ============================================
    // REDIRECT HELPERS
    // ============================================
    function redirectToLogin() {
        const currentPath = window.location.pathname + window.location.search;
        const returnUrl = encodeURIComponent(currentPath);
        window.location.href = `${AUTH_CONFIG.loginPage}?returnUrl=${returnUrl}`;
    }

    function redirectToUnauthorized() {
        window.location.href = AUTH_CONFIG.unauthorizedPage;
    }

    function redirectToDashboard() {
        window.location.href = AUTH_CONFIG.dashboardPage;
    }

    // ============================================
    // IDLE TIMEOUT TRACKING
    // ============================================
    let lastActivity = Date.now();

    function updateActivity() {
        lastActivity = Date.now();
    }

    function checkIdleTimeout() {
        const idleTime = Date.now() - lastActivity;
        if (idleTime > AUTH_CONFIG.maxIdleTime) {
            console.log('Session timed out due to inactivity');
            MissionPulse.signOut();
        }
    }

    function setupIdleTracking() {
        // Track user activity
        ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(event => {
            document.addEventListener(event, updateActivity, { passive: true });
        });

        // Check idle timeout periodically
        setInterval(checkIdleTimeout, 60000);
    }

    // ============================================
    // SESSION MONITORING
    // ============================================
    function setupSessionMonitoring() {
        // Listen for auth state changes
        MissionPulse.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
                if (event === 'SIGNED_OUT' && !isPublicPage) {
                    redirectToLogin();
                }
            }
        });

        // Periodic session check
        setInterval(async () => {
            const session = await MissionPulse.getSession();
            if (!session && !isPublicPage) {
                redirectToLogin();
            }
        }, AUTH_CONFIG.sessionCheckInterval);
    }

    // ============================================
    // INJECT USER INFO INTO PAGE
    // ============================================
    async function injectUserInfo() {
        const profile = await MissionPulse.getUserProfile();
        if (!profile) return;

        // Find and update user display elements
        const userNameEl = document.querySelector('[data-user-name]');
        const userEmailEl = document.querySelector('[data-user-email]');
        const userAvatarEl = document.querySelector('[data-user-avatar]');
        const userRoleEl = document.querySelector('[data-user-role]');
        const companyNameEl = document.querySelector('[data-company-name]');

        if (userNameEl) userNameEl.textContent = profile.full_name || profile.email;
        if (userEmailEl) userEmailEl.textContent = profile.email;
        if (userRoleEl) userRoleEl.textContent = profile.role?.name || 'User';
        if (companyNameEl) companyNameEl.textContent = profile.company?.name || '';

        if (userAvatarEl) {
            if (profile.avatar_url) {
                userAvatarEl.src = profile.avatar_url;
            } else {
                // Generate initials avatar
                const initials = (profile.full_name || profile.email)
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2);
                userAvatarEl.src = `https://ui-avatars.com/api/?name=${initials}&background=00E5FA&color=00050F&bold=true`;
            }
        }

        // Store user info for other scripts
        window.currentUser = profile;

        // Dispatch custom event
        window.dispatchEvent(new CustomEvent('userLoaded', { detail: profile }));
    }

    // ============================================
    // RBAC UI CONTROL
    // ============================================
    async function applyRBAC() {
        const profile = await MissionPulse.getUserProfile();
        if (!profile) return;

        // Hide elements based on role
        document.querySelectorAll('[data-require-role]').forEach(async el => {
            const roles = el.dataset.requireRole.split(',').map(r => r.trim());
            if (!roles.includes(profile.role?.name)) {
                el.remove(); // Invisible RBAC - remove entirely
            }
        });

        // Hide elements based on permission
        document.querySelectorAll('[data-require-permission]').forEach(async el => {
            const perms = el.dataset.requirePermission.split(',').map(p => p.trim());
            let hasAll = true;
            for (const perm of perms) {
                const has = await MissionPulse.hasPermission(perm);
                if (!has) {
                    hasAll = false;
                    break;
                }
            }
            if (!hasAll) {
                el.remove(); // Invisible RBAC
            }
        });

        // Show elements for specific roles
        document.querySelectorAll('[data-show-for-role]').forEach(el => {
            const roles = el.dataset.showForRole.split(',').map(r => r.trim());
            if (!roles.includes(profile.role?.name)) {
                el.style.display = 'none';
            }
        });

        // Dispatch event when RBAC is applied
        window.dispatchEvent(new CustomEvent('rbacApplied', { detail: profile }));
    }

    // ============================================
    // LOGOUT BUTTON SETUP
    // ============================================
    function setupLogoutButtons() {
        document.querySelectorAll('[data-logout]').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                await MissionPulse.signOut();
            });
        });
    }

    // ============================================
    // MAIN GUARD EXECUTION
    // ============================================
    async function runAuthGuard() {
        // Skip for public pages
        if (isPublicPage) {
            hideLoadingOverlay();
            return;
        }

        // Check authentication
        const user = await checkAuthentication();
        
        if (!user) {
            redirectToLogin();
            return;
        }

        // Check authorization (roles/permissions)
        const authorized = await checkAuthorization(user);
        
        if (!authorized) {
            redirectToUnauthorized();
            return;
        }

        // User is authenticated and authorized
        await injectUserInfo();
        await applyRBAC();
        setupLogoutButtons();
        setupIdleTracking();
        setupSessionMonitoring();

        // Hide loading overlay
        hideLoadingOverlay();

        // Dispatch ready event
        window.dispatchEvent(new CustomEvent('authReady'));
    }

    // ============================================
    // INITIALIZE
    // ============================================
    
    // Show loading immediately
    if (!isPublicPage) {
        showLoadingOverlay();
    }

    // Wait for DOM and MissionPulse to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runAuthGuard);
    } else {
        runAuthGuard();
    }

})();

// ============================================
// GLOBAL HELPER FUNCTIONS
// ============================================

/**
 * Check if current user has role (synchronous check using cached data)
 * @param {string} role 
 * @returns {boolean}
 */
function userHasRole(role) {
    return window.currentUser?.role?.name === role;
}

/**
 * Check if current user is in list of roles
 * @param {string[]} roles 
 * @returns {boolean}
 */
function userInRoles(roles) {
    return roles.includes(window.currentUser?.role?.name);
}

/**
 * Get current user's company ID
 * @returns {string|null}
 */
function getCurrentCompanyId() {
    return window.currentUser?.company_id || null;
}

/**
 * Get current user's role name
 * @returns {string|null}
 */
function getCurrentRole() {
    return window.currentUser?.role?.name || null;
}
