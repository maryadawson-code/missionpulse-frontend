// FILE: missionpulse-auth.js
// ROLE: System
// SECURITY: Client-side auth helper - validates localStorage session
// VERSION: 2.0.0
// UPDATED: January 30, 2026

/**
 * MissionPulse Authentication Module
 * Provides consistent auth checking across all module pages
 * 
 * USAGE: Include via <script src="missionpulse-auth.js"></script>
 * Then call: const user = MPAuth.check();
 */

const MPAuth = (function() {
  'use strict';

  // ===========================================
  // CONFIGURATION
  // ===========================================
  const CONFIG = {
    SESSION_KEY: 'MP_SESSION',
    USER_KEY: 'MP_USER',
    LOGIN_PAGE: 'login.html',
    DASHBOARD_PAGE: 'missionpulse-dashboard-hub.html',
    SESSION_TIMEOUT: 8 * 60 * 60 * 1000, // 8 hours
    DEMO_USER: {
      email: 'demo@missionmeetstech.com',
      name: 'Demo User',
      role: 'CEO',
      company: 'Mission Meets Tech',
      isDemo: true
    }
  };

  // ===========================================
  // ROLE-BASED ACCESS CONTROL
  // ===========================================
  const RBAC = {
    // Modules requiring specific roles (invisible RBAC - redirect without message)
    RESTRICTED_MODULES: {
      'blackhat': ['CEO', 'COO', 'CAP', 'Admin'],
      'pricing': ['CEO', 'COO', 'FIN', 'Admin'],
      'admin': ['Admin'],
      'audit': ['CEO', 'Admin'],
      'security-admin': ['Admin'],
      'leads-admin': ['CEO', 'COO', 'Admin'],
      'user-management': ['Admin']
    },

    // Check if role has access to module
    hasAccess: function(role, moduleId) {
      const allowedRoles = this.RESTRICTED_MODULES[moduleId];
      if (!allowedRoles) return true; // Unrestricted module
      return allowedRoles.includes(role);
    },

    // Get current module ID from URL
    getCurrentModule: function() {
      const path = window.location.pathname;
      const filename = path.split('/').pop().replace('.html', '');
      
      // Extract module identifier
      if (filename.includes('blackhat')) return 'blackhat';
      if (filename.includes('pricing')) return 'pricing';
      if (filename.includes('admin')) return 'admin';
      if (filename.includes('audit')) return 'audit';
      if (filename.includes('security')) return 'security-admin';
      if (filename.includes('leads')) return 'leads-admin';
      if (filename.includes('user-management')) return 'user-management';
      
      return filename;
    }
  };

  // ===========================================
  // CORE AUTH FUNCTIONS
  // ===========================================
  
  /**
   * Check authentication status
   * Redirects to login if not authenticated
   * @param {Object} options - { allowDemo: true, requireRole: null }
   * @returns {Object|null} User object or null
   */
  function check(options = {}) {
    const { allowDemo = true, requireRole = null } = options;

    const session = localStorage.getItem(CONFIG.SESSION_KEY);
    const userStr = localStorage.getItem(CONFIG.USER_KEY);

    // No session - redirect to login
    if (!session || !userStr) {
      if (allowDemo) {
        // Set demo session for development
        setDemoSession();
        return CONFIG.DEMO_USER;
      }
      redirectToLogin();
      return null;
    }

    // Validate session timestamp
    try {
      const sessionData = JSON.parse(session);
      if (sessionData.expires && Date.now() > sessionData.expires) {
        console.warn('[MPAuth] Session expired');
        logout();
        return null;
      }
    } catch (e) {
      // Legacy session format - still valid
    }

    // Parse user data
    let user;
    try {
      user = JSON.parse(userStr);
    } catch (e) {
      console.error('[MPAuth] Invalid user data');
      logout();
      return null;
    }

    // Check RBAC for current module
    const currentModule = RBAC.getCurrentModule();
    if (!RBAC.hasAccess(user.role, currentModule)) {
      console.warn(`[MPAuth] Access denied to ${currentModule} for role ${user.role}`);
      redirectToDashboard();
      return null;
    }

    // Check specific role requirement
    if (requireRole && user.role !== requireRole && user.role !== 'Admin') {
      console.warn(`[MPAuth] Role ${requireRole} required, user has ${user.role}`);
      redirectToDashboard();
      return null;
    }

    return user;
  }

  /**
   * Set demo session for development/testing
   */
  function setDemoSession() {
    const sessionData = {
      created: Date.now(),
      expires: Date.now() + CONFIG.SESSION_TIMEOUT,
      isDemo: true
    };
    localStorage.setItem(CONFIG.SESSION_KEY, JSON.stringify(sessionData));
    localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(CONFIG.DEMO_USER));
  }

  /**
   * Logout - clear all session data
   */
  function logout() {
    localStorage.removeItem(CONFIG.SESSION_KEY);
    localStorage.removeItem(CONFIG.USER_KEY);
    localStorage.removeItem('MP_ROLE');
    localStorage.removeItem('MP_PERMISSIONS');
    redirectToLogin();
  }

  /**
   * Redirect to login page
   */
  function redirectToLogin() {
    if (!window.location.pathname.includes('login')) {
      window.location.href = CONFIG.LOGIN_PAGE;
    }
  }

  /**
   * Redirect to dashboard (for RBAC denials)
   */
  function redirectToDashboard() {
    window.location.href = CONFIG.DASHBOARD_PAGE;
  }

  /**
   * Get current user without redirect
   * @returns {Object|null} User object or null
   */
  function getUser() {
    const userStr = localStorage.getItem(CONFIG.USER_KEY);
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  /**
   * Check if user has specific role
   * @param {string|string[]} roles - Role(s) to check
   * @returns {boolean}
   */
  function hasRole(roles) {
    const user = getUser();
    if (!user) return false;
    
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(user.role) || user.role === 'Admin';
  }

  /**
   * Update user role (for role switcher)
   * @param {string} newRole - New role ID
   */
  function switchRole(newRole) {
    const user = getUser();
    if (!user) return;
    
    user.role = newRole;
    localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(user));
    
    // Re-check RBAC for current page
    const currentModule = RBAC.getCurrentModule();
    if (!RBAC.hasAccess(newRole, currentModule)) {
      redirectToDashboard();
    }
  }

  /**
   * Log audit event
   * @param {string} action - Action performed
   * @param {Object} details - Additional details
   */
  function logAudit(action, details = {}) {
    const user = getUser();
    const auditEntry = {
      timestamp: new Date().toISOString(),
      user: user?.email || 'anonymous',
      role: user?.role || 'none',
      action: action,
      module: RBAC.getCurrentModule(),
      details: details,
      userAgent: navigator.userAgent
    };
    
    // Store locally (for sync to server later)
    const auditLog = JSON.parse(localStorage.getItem('MP_AUDIT_LOG') || '[]');
    auditLog.push(auditEntry);
    
    // Keep only last 100 entries locally
    if (auditLog.length > 100) {
      auditLog.shift();
    }
    localStorage.setItem('MP_AUDIT_LOG', JSON.stringify(auditLog));
    
    // Also log to console in development
    console.log('[MPAuth Audit]', auditEntry);
  }

  // ===========================================
  // PUBLIC API
  // ===========================================
  return {
    check: check,
    logout: logout,
    getUser: getUser,
    hasRole: hasRole,
    switchRole: switchRole,
    logAudit: logAudit,
    RBAC: RBAC,
    CONFIG: CONFIG
  };

})();

// Auto-check on page load (can be disabled by setting window.MP_SKIP_AUTH_CHECK = true)
document.addEventListener('DOMContentLoaded', function() {
  if (window.MP_SKIP_AUTH_CHECK) return;
  
  // Skip auth check on login page
  if (window.location.pathname.includes('login')) return;
  
  // Check auth with demo mode allowed
  MPAuth.check({ allowDemo: true });
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MPAuth;
}
