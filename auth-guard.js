/**
 * MissionPulse Auth Guard v2.0
 * Route protection and session management
 * 
 * Features:
 * - Automatic redirect to login for unauthenticated users
 * - Role-based page access control
 * - Session persistence check
 * - Loading state management
 * - Invisible RBAC (unavailable features don't render)
 * 
 * Usage:
 * Include this script AFTER supabase-client.js on protected pages:
 * <script src="supabase-client.js"></script>
 * <script src="auth-guard.js"></script>
 * 
 * Configure via data attributes:
 * <body data-require-auth="true" data-require-role="CEO,COO,Admin">
 * 
 * © 2026 Mission Meets Tech
 */

(function() {
  'use strict';

  // ============================================================
  // CONFIGURATION
  // ============================================================
  
  const CONFIG = {
    loginPage: '/login.html',
    dashboardPage: '/index.html',
    sessionCheckTimeout: 5000,
    debugMode: false
  };

  // Pages that don't require authentication
  const PUBLIC_PAGES = [
    '/login.html',
    '/signup.html',
    '/reset-password.html',
    '/forgot-password.html',
    '/404.html',
    '/maintenance.html'
  ];

  // ============================================================
  // UTILITY FUNCTIONS
  // ============================================================

  function log(...args) {
    if (CONFIG.debugMode) {
      console.log('[AuthGuard]', ...args);
    }
  }

  function getCurrentPage() {
    const path = window.location.pathname;
    // Handle both /page.html and /page/ formats
    if (path === '/' || path === '') return '/index.html';
    return path;
  }

  function isPublicPage() {
    const currentPage = getCurrentPage();
    return PUBLIC_PAGES.some(page => 
      currentPage === page || 
      currentPage.endsWith(page)
    );
  }

  function redirectTo(url) {
    if (window.location.pathname !== url) {
      log('Redirecting to:', url);
      window.location.href = url;
    }
  }

  function getRequiredRoles() {
    const body = document.body;
    const roleAttr = body?.getAttribute('data-require-role');
    if (!roleAttr) return null;
    return roleAttr.split(',').map(r => r.trim());
  }

  function getModuleId() {
    const body = document.body;
    return body?.getAttribute('data-module-id') || null;
  }

  // ============================================================
  // LOADING STATE MANAGEMENT
  // ============================================================

  function showLoadingOverlay() {
    // Don't show overlay on public pages
    if (isPublicPage()) return;

    // Check if overlay already exists
    if (document.getElementById('mp-auth-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'mp-auth-overlay';
    overlay.innerHTML = `
      <style>
        #mp-auth-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: #00050F;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          z-index: 99999;
          transition: opacity 0.3s ease;
        }
        #mp-auth-overlay.fade-out {
          opacity: 0;
          pointer-events: none;
        }
        .mp-loader {
          width: 48px;
          height: 48px;
          border: 3px solid rgba(0, 229, 250, 0.2);
          border-top-color: #00E5FA;
          border-radius: 50%;
          animation: mp-spin 1s linear infinite;
        }
        .mp-loader-text {
          margin-top: 16px;
          color: #94A3B8;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          font-size: 14px;
        }
        @keyframes mp-spin {
          to { transform: rotate(360deg); }
        }
      </style>
      <div class="mp-loader"></div>
      <div class="mp-loader-text">Verifying access...</div>
    `;
    
    document.body.appendChild(overlay);
  }

  function hideLoadingOverlay() {
    const overlay = document.getElementById('mp-auth-overlay');
    if (overlay) {
      overlay.classList.add('fade-out');
      setTimeout(() => overlay.remove(), 300);
    }
  }

  // ============================================================
  // AUTH CHECK LOGIC
  // ============================================================

  async function checkAuth() {
    log('Checking authentication...');
    
    // Skip auth check for public pages
    if (isPublicPage()) {
      log('Public page - skipping auth check');
      return true;
    }

    showLoadingOverlay();

    // Wait for MissionPulse to be available
    let attempts = 0;
    while (typeof MissionPulse === 'undefined' && attempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }

    if (typeof MissionPulse === 'undefined') {
      console.error('[AuthGuard] MissionPulse not loaded');
      hideLoadingOverlay();
      redirectTo(CONFIG.loginPage);
      return false;
    }

    try {
      const { data: user, error } = await MissionPulse.getCurrentUser();

      if (error || !user) {
        log('No authenticated user');
        hideLoadingOverlay();
        
        // Store intended destination for post-login redirect
        sessionStorage.setItem('mp_redirect_after_login', window.location.href);
        
        redirectTo(CONFIG.loginPage);
        return false;
      }

      log('User authenticated:', user.email);
      log('Profile:', user.profile);

      // Check role requirements
      const requiredRoles = getRequiredRoles();
      if (requiredRoles && requiredRoles.length > 0) {
        const userRole = user.profile?.roleId;
        
        if (!userRole || !requiredRoles.includes(userRole)) {
          log('Role check failed. Required:', requiredRoles, 'User has:', userRole);
          hideLoadingOverlay();
          
          // Show access denied or redirect to dashboard
          showAccessDenied();
          return false;
        }
        
        log('Role check passed:', userRole);
      }

      // Check module access
      const moduleId = getModuleId();
      if (moduleId) {
        const canAccess = MissionPulse.canAccessModule(moduleId);
        if (!canAccess) {
          log('Module access denied:', moduleId);
          hideLoadingOverlay();
          showAccessDenied();
          return false;
        }
        log('Module access granted:', moduleId);
      }

      // All checks passed
      hideLoadingOverlay();
      initializeUserContext(user);
      return true;

    } catch (error) {
      console.error('[AuthGuard] Auth check error:', error);
      hideLoadingOverlay();
      redirectTo(CONFIG.loginPage);
      return false;
    }
  }

  // ============================================================
  // ACCESS DENIED HANDLING
  // ============================================================

  function showAccessDenied() {
    const overlay = document.getElementById('mp-auth-overlay');
    if (overlay) {
      overlay.innerHTML = `
        <style>
          .mp-access-denied {
            text-align: center;
            padding: 40px;
          }
          .mp-access-denied h2 {
            color: #EF4444;
            font-size: 24px;
            margin-bottom: 16px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          }
          .mp-access-denied p {
            color: #94A3B8;
            margin-bottom: 24px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          }
          .mp-back-btn {
            background: linear-gradient(135deg, #00E5FA, #00B8C8);
            color: #00050F;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            transition: transform 0.2s;
          }
          .mp-back-btn:hover {
            transform: scale(1.05);
          }
        </style>
        <div class="mp-access-denied">
          <h2>🔒 Access Restricted</h2>
          <p>Your role doesn't have permission to access this module.</p>
          <button class="mp-back-btn" onclick="window.location.href='${CONFIG.dashboardPage}'">
            Return to Dashboard
          </button>
        </div>
      `;
    }
  }

  // ============================================================
  // USER CONTEXT INITIALIZATION
  // ============================================================

  function initializeUserContext(user) {
    // Make user data available globally
    window.MP_USER = user;
    window.MP_PROFILE = user.profile;

    // Dispatch custom event for components to react
    const event = new CustomEvent('mp:auth:ready', {
      detail: { user, profile: user.profile }
    });
    document.dispatchEvent(event);

    // Update any user display elements
    updateUserDisplay(user.profile);
    
    // Apply RBAC to navigation
    applyNavigationRBAC();

    log('User context initialized');
  }

  function updateUserDisplay(profile) {
    if (!profile) return;

    // Update user name displays
    const nameElements = document.querySelectorAll('[data-mp-user-name]');
    nameElements.forEach(el => {
      el.textContent = profile.fullName || profile.email;
    });

    // Update user role displays
    const roleElements = document.querySelectorAll('[data-mp-user-role]');
    roleElements.forEach(el => {
      const roleInfo = MissionPulse.ROLES[profile.roleId];
      el.textContent = roleInfo?.name || profile.roleId;
    });

    // Update user avatar displays
    const avatarElements = document.querySelectorAll('[data-mp-user-avatar]');
    avatarElements.forEach(el => {
      if (profile.avatarUrl) {
        el.src = profile.avatarUrl;
      } else {
        // Generate initials avatar
        const initials = (profile.fullName || 'U')
          .split(' ')
          .map(n => n[0])
          .join('')
          .substring(0, 2)
          .toUpperCase();
        el.alt = initials;
      }
    });

    // Update user email displays
    const emailElements = document.querySelectorAll('[data-mp-user-email]');
    emailElements.forEach(el => {
      el.textContent = profile.email;
    });
  }

  // ============================================================
  // RBAC NAVIGATION FILTERING
  // ============================================================

  function applyNavigationRBAC() {
    // Get all navigation items with module requirements
    const navItems = document.querySelectorAll('[data-require-module]');
    
    navItems.forEach(item => {
      const moduleId = item.getAttribute('data-require-module');
      const canAccess = MissionPulse.canAccessModule(moduleId);
      
      if (!canAccess) {
        // Invisible RBAC - remove instead of disable
        item.style.display = 'none';
        item.setAttribute('aria-hidden', 'true');
      }
    });

    // Handle permission-based elements
    const permElements = document.querySelectorAll('[data-require-permission]');
    
    permElements.forEach(item => {
      const permission = item.getAttribute('data-require-permission');
      const hasAccess = MissionPulse.hasPermission(permission);
      
      if (!hasAccess) {
        item.style.display = 'none';
        item.setAttribute('aria-hidden', 'true');
      }
    });

    log('Navigation RBAC applied');
  }

  // ============================================================
  // AUTH STATE CHANGE LISTENER
  // ============================================================

  function setupAuthListener() {
    if (typeof MissionPulse !== 'undefined') {
      MissionPulse.onAuthStateChange((event, session) => {
        log('Auth state changed:', event);

        if (event === 'SIGNED_OUT') {
          // Clear user context
          window.MP_USER = null;
          window.MP_PROFILE = null;
          
          // Redirect to login
          if (!isPublicPage()) {
            redirectTo(CONFIG.loginPage);
          }
        }

        if (event === 'SIGNED_IN' && session) {
          // Refresh the page to reinitialize with new user
          if (isPublicPage()) {
            const redirect = sessionStorage.getItem('mp_redirect_after_login');
            sessionStorage.removeItem('mp_redirect_after_login');
            redirectTo(redirect || CONFIG.dashboardPage);
          }
        }
      });
    }
  }

  // ============================================================
  // LOGOUT HANDLER
  // ============================================================

  window.mpLogout = async function() {
    try {
      await MissionPulse.signOut();
      redirectTo(CONFIG.loginPage);
    } catch (error) {
      console.error('[AuthGuard] Logout error:', error);
      // Force redirect anyway
      redirectTo(CONFIG.loginPage);
    }
  };

  // ============================================================
  // INITIALIZATION
  // ============================================================

  function init() {
    log('Initializing AuthGuard...');
    
    // Run auth check
    checkAuth().then(authenticated => {
      if (authenticated) {
        setupAuthListener();
      }
    });
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Export for manual use
  window.MPAuthGuard = {
    checkAuth,
    isPublicPage,
    getCurrentPage,
    config: CONFIG
  };

})();
