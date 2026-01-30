/**
 * MissionPulse Auth Guard
 * Include this script on any page that requires authentication
 * 
 * Usage:
 *   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
 *   <script src="supabase-client.js"></script>
 *   <script src="auth-guard.js"></script>
 * 
 * Or as a module:
 *   <script type="module">
 *     import { requireAuth, getCurrentUser } from './auth-guard.js';
 *     const user = await requireAuth();
 *   </script>
 */

(function() {
  'use strict';

  // ============================================================
  // CONFIGURATION
  // ============================================================
  const CONFIG = {
    loginUrl: '/login.html',
    dashboardUrl: '/index.html',
    sessionCheckInterval: 60000, // Check session every 60 seconds
    showLoadingOverlay: true
  };

  // ============================================================
  // LOADING OVERLAY
  // ============================================================
  function showLoadingOverlay() {
    if (!CONFIG.showLoadingOverlay) return;
    
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
          opacity: 1;
          transition: opacity 0.3s ease-out;
        }
        #auth-loading-overlay.fade-out {
          opacity: 0;
        }
        .auth-loader {
          text-align: center;
        }
        .auth-loader-icon {
          width: 48px;
          height: 48px;
          margin: 0 auto 16px;
          background: linear-gradient(135deg, #00E5FA, #00BDAE);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 32px rgba(0, 229, 250, 0.3);
        }
        .auth-loader-icon svg {
          width: 28px;
          height: 28px;
          color: white;
        }
        .auth-loader-text {
          color: #94a3b8;
          font-family: 'Inter', sans-serif;
          font-size: 14px;
        }
        .auth-loader-spinner {
          width: 24px;
          height: 24px;
          border: 2px solid rgba(0, 229, 250, 0.2);
          border-top-color: #00E5FA;
          border-radius: 50%;
          animation: auth-spin 0.8s linear infinite;
          margin: 16px auto 0;
        }
        @keyframes auth-spin {
          to { transform: rotate(360deg); }
        }
      </style>
      <div class="auth-loader">
        <div class="auth-loader-icon">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <div class="auth-loader-text">Verifying authentication...</div>
        <div class="auth-loader-spinner"></div>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  function hideLoadingOverlay() {
    const overlay = document.getElementById('auth-loading-overlay');
    if (overlay) {
      overlay.classList.add('fade-out');
      setTimeout(() => overlay.remove(), 300);
    }
  }

  // ============================================================
  // AUTH CHECK
  // ============================================================
  async function checkAuth() {
    // Make sure supabase is available
    if (typeof window.supabase === 'undefined') {
      console.error('Supabase client not found. Include supabase-client.js first.');
      return null;
    }

    try {
      const { data: { session }, error } = await window.supabase.auth.getSession();
      
      if (error) {
        console.error('Auth check error:', error);
        return null;
      }
      
      return session;
    } catch (err) {
      console.error('Auth check exception:', err);
      return null;
    }
  }

  // ============================================================
  // REQUIRE AUTH (Main function)
  // ============================================================
  async function requireAuth() {
    showLoadingOverlay();
    
    const session = await checkAuth();
    
    if (!session) {
      // Store the intended destination
      const currentPath = window.location.pathname + window.location.search;
      if (currentPath !== CONFIG.loginUrl) {
        sessionStorage.setItem('auth_redirect', currentPath);
      }
      
      // Redirect to login
      window.location.href = CONFIG.loginUrl;
      return null;
    }
    
    hideLoadingOverlay();
    return session.user;
  }

  // ============================================================
  // GET CURRENT USER (with profile)
  // ============================================================
  async function getCurrentUser() {
    if (typeof window.MP !== 'undefined' && window.MP.db) {
      const { data, error } = await window.MP.db.getUserProfile();
      if (error) {
        console.warn('Could not fetch user profile:', error);
        const session = await checkAuth();
        return session?.user || null;
      }
      return data;
    }
    
    // Fallback to basic auth user
    const session = await checkAuth();
    return session?.user || null;
  }

  // ============================================================
  // SESSION MONITOR
  // ============================================================
  function startSessionMonitor() {
    // Check session periodically
    setInterval(async () => {
      const session = await checkAuth();
      if (!session) {
        console.log('Session expired, redirecting to login...');
        window.location.href = CONFIG.loginUrl;
      }
    }, CONFIG.sessionCheckInterval);
    
    // Listen for auth state changes
    if (typeof window.supabase !== 'undefined') {
      window.supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED' && !session) {
          window.location.href = CONFIG.loginUrl;
        }
      });
    }
  }

  // ============================================================
  // REDIRECT AFTER LOGIN
  // ============================================================
  function handlePostLoginRedirect() {
    const redirect = sessionStorage.getItem('auth_redirect');
    if (redirect && redirect !== CONFIG.loginUrl) {
      sessionStorage.removeItem('auth_redirect');
      window.location.href = redirect;
      return true;
    }
    return false;
  }

  // ============================================================
  // ROLE-BASED ACCESS CONTROL
  // ============================================================
  const ROLE_PERMISSIONS = {
    CEO: ['*'],
    COO: ['*'],
    CAP: ['strategy', 'intelligence', 'delivery', 'command'],
    PM: ['delivery', 'command'],
    SA: ['delivery'],
    FIN: ['pricing', 'contracts'],
    CON: ['compliance', 'contracts'],
    DEL: ['delivery', 'staffing'],
    QA: ['review', 'compliance'],
    Partner: ['assigned_sections_only'],
    Admin: ['admin', 'users', 'settings', '*']
  };

  function canAccess(userRole, module) {
    const permissions = ROLE_PERMISSIONS[userRole] || [];
    if (permissions.includes('*')) return true;
    return permissions.some(p => module.toLowerCase().includes(p.toLowerCase()));
  }

  function requireRole(allowedRoles) {
    return async function() {
      const user = await getCurrentUser();
      if (!user) {
        window.location.href = CONFIG.loginUrl;
        return false;
      }
      
      const userRole = user.role || 'Member';
      if (!allowedRoles.includes(userRole) && !['CEO', 'COO', 'Admin'].includes(userRole)) {
        console.warn(`Access denied. Required roles: ${allowedRoles.join(', ')}, User role: ${userRole}`);
        // Could redirect to access denied page or show error
        return false;
      }
      
      return true;
    };
  }

  // ============================================================
  // AUTO-INIT
  // ============================================================
  async function init() {
    // Skip auth check on login page
    const isLoginPage = window.location.pathname.includes('login');
    
    if (!isLoginPage) {
      await requireAuth();
      startSessionMonitor();
    }
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ============================================================
  // EXPORTS
  // ============================================================
  window.AuthGuard = {
    requireAuth,
    getCurrentUser,
    checkAuth,
    canAccess,
    requireRole,
    handlePostLoginRedirect,
    config: CONFIG
  };

  console.log('✅ MissionPulse Auth Guard loaded');
})();
