/**
 * MissionPulse Auth Guard
 * Sprint 14: Include this script in protected pages to enforce authentication
 * 
 * Usage: Add before </body> in any protected page:
 * <script src="auth-guard.js"></script>
 * 
 * © 2026 Mission Meets Tech
 */

(function() {
  'use strict';

  // Configuration
  const LOGIN_URL = 'login.html';
  const CHECK_INTERVAL = 100; // ms to wait for MissionPulse to load
  const MAX_ATTEMPTS = 50; // 5 seconds max wait

  let attempts = 0;

  function checkAuth() {
    attempts++;

    // Wait for MissionPulse to be available
    if (typeof window.MissionPulse === 'undefined') {
      if (attempts < MAX_ATTEMPTS) {
        setTimeout(checkAuth, CHECK_INTERVAL);
      } else {
        console.error('[AuthGuard] MissionPulse not loaded, redirecting to login');
        redirectToLogin();
      }
      return;
    }

    // Demo mode bypass
    if (window.MissionPulse.DEMO_MODE) {
      console.log('[AuthGuard] Demo mode active, skipping auth check');
      showContent();
      return;
    }

    // Check session
    window.MissionPulse.getSession().then(({ data }) => {
      if (data?.session) {
        console.log('[AuthGuard] Session valid:', data.session.user.email);
        
        // Load profile if not cached
        if (!window.MissionPulse.currentProfile) {
          window.MissionPulse.getCurrentUser().then(() => {
            showContent();
            updateUserDisplay();
          });
        } else {
          showContent();
          updateUserDisplay();
        }
      } else {
        console.log('[AuthGuard] No session, redirecting to login');
        redirectToLogin();
      }
    }).catch(error => {
      console.error('[AuthGuard] Session check error:', error);
      redirectToLogin();
    });
  }

  function redirectToLogin() {
    // Store intended destination
    const currentUrl = window.location.href;
    if (!currentUrl.includes(LOGIN_URL)) {
      sessionStorage.setItem('missionpulse_redirect', currentUrl);
    }
    window.location.href = LOGIN_URL;
  }

  function showContent() {
    // Remove any loading overlay
    const loadingOverlay = document.getElementById('auth-loading-overlay');
    if (loadingOverlay) {
      loadingOverlay.style.opacity = '0';
      setTimeout(() => loadingOverlay.remove(), 300);
    }

    // Show main content
    document.body.classList.remove('auth-loading');
    document.body.classList.add('auth-ready');
  }

  function updateUserDisplay() {
    const profile = window.MissionPulse.currentProfile;
    if (!profile) return;

    // Update user name displays
    document.querySelectorAll('[data-user-name]').forEach(el => {
      el.textContent = profile.full_name || profile.email?.split('@')[0] || 'User';
    });

    // Update user email displays
    document.querySelectorAll('[data-user-email]').forEach(el => {
      el.textContent = profile.email || '';
    });

    // Update user role displays
    document.querySelectorAll('[data-user-role]').forEach(el => {
      el.textContent = profile.role || 'Partner';
    });

    // Update user avatar (initials)
    document.querySelectorAll('[data-user-avatar]').forEach(el => {
      const name = profile.full_name || profile.email || 'U';
      const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
      el.textContent = initials;
    });

    // Apply RBAC - hide elements user can't access
    applyRBAC(profile.role);
  }

  function applyRBAC(role) {
    // Hide elements based on required roles
    document.querySelectorAll('[data-require-role]').forEach(el => {
      const requiredRoles = el.dataset.requireRole.split(',').map(r => r.trim());
      if (!requiredRoles.includes(role) && !['CEO', 'COO', 'Admin'].includes(role)) {
        el.style.display = 'none';
      }
    });

    // Show elements for specific roles only
    document.querySelectorAll('[data-show-role]').forEach(el => {
      const showRoles = el.dataset.showRole.split(',').map(r => r.trim());
      if (showRoles.includes(role)) {
        el.style.display = '';
      } else {
        el.style.display = 'none';
      }
    });

    // Hide admin-only elements
    document.querySelectorAll('[data-admin-only]').forEach(el => {
      if (!['CEO', 'COO', 'Admin'].includes(role)) {
        el.style.display = 'none';
      }
    });
  }

  // Add loading styles
  const style = document.createElement('style');
  style.textContent = `
    body.auth-loading > *:not(#auth-loading-overlay) {
      visibility: hidden;
    }
    #auth-loading-overlay {
      position: fixed;
      inset: 0;
      background: linear-gradient(135deg, #0a0f1a 0%, #0d1526 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      transition: opacity 0.3s ease;
    }
    #auth-loading-overlay .spinner {
      width: 48px;
      height: 48px;
      border: 3px solid rgba(0, 229, 250, 0.2);
      border-top-color: #00E5FA;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);

  // Add loading overlay
  document.body.classList.add('auth-loading');
  const overlay = document.createElement('div');
  overlay.id = 'auth-loading-overlay';
  overlay.innerHTML = '<div class="spinner"></div>';
  document.body.appendChild(overlay);

  // Start auth check
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAuth);
  } else {
    checkAuth();
  }

  // Expose logout function globally
  window.missionPulseLogout = async function() {
    await window.MissionPulse.signOut();
    window.location.href = LOGIN_URL;
  };

})();
