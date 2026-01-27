/**
 * MissionPulse Auth Guard
 * Sprint 7: Automatic authentication protection
 * 
 * This script auto-protects any page it's included on.
 * Just add: <script src="auth-guard.js"></script>
 * 
 * Features:
 * - Checks session on page load
 * - Redirects to login if not authenticated
 * - Provides global AuthState for React components
 * - Shows loading state while checking auth
 * 
 * © 2026 Mission Meets Tech
 */

(function(global) {
  'use strict';

  // Configuration
  const CONFIG = {
    loginUrl: 'login.html',
    checkTimeout: 5000,
    redirectKey: 'mp_redirect_after_login'
  };

  // Auth state
  let authState = {
    user: null,
    session: null,
    loading: true,
    checked: false
  };

  let authListeners = [];

  // Wait for MissionPulse client
  function waitForMissionPulse(timeout = CONFIG.checkTimeout) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const check = () => {
        if (global.MissionPulse && typeof global.MissionPulse.getSession === 'function') {
          resolve(global.MissionPulse);
          return;
        }
        
        if (Date.now() - startTime > timeout) {
          reject(new Error('MissionPulse client failed to load'));
          return;
        }
        
        setTimeout(check, 50);
      };
      
      check();
    });
  }

  // Notify listeners of auth state change
  function notifyListeners() {
    authListeners.forEach(cb => {
      try {
        cb({ ...authState });
      } catch (e) {
        console.error('[AuthGuard] Listener error:', e);
      }
    });
  }

  // Redirect to login
  function redirectToLogin() {
    sessionStorage.setItem(CONFIG.redirectKey, window.location.href);
    window.location.replace(CONFIG.loginUrl);
  }

  // Check authentication
  async function checkAuth() {
    try {
      const MissionPulse = await waitForMissionPulse();
      
      const { data: { session }, error } = await MissionPulse.getSession();
      
      if (error) {
        console.error('[AuthGuard] Session check error:', error);
        redirectToLogin();
        return;
      }
      
      if (!session) {
        console.log('[AuthGuard] No session, redirecting to login');
        redirectToLogin();
        return;
      }
      
      // Authenticated!
      authState = {
        user: session.user,
        session: session,
        loading: false,
        checked: true
      };
      
      console.log('[AuthGuard] Authenticated:', session.user.email);
      notifyListeners();
      
      // Set up auth state change listener
      MissionPulse.onAuthStateChange(({ event, session: newSession }) => {
        if (event === 'SIGNED_OUT' || !newSession) {
          authState = { user: null, session: null, loading: false, checked: true };
          notifyListeners();
          redirectToLogin();
        } else if (newSession) {
          authState = { user: newSession.user, session: newSession, loading: false, checked: true };
          notifyListeners();
        }
      });
      
    } catch (error) {
      console.error('[AuthGuard] Error:', error);
      redirectToLogin();
    }
  }

  // Sign out helper
  async function signOut() {
    try {
      await global.MissionPulse.signOut();
      redirectToLogin();
    } catch (error) {
      console.error('[AuthGuard] Sign out error:', error);
      redirectToLogin();
    }
  }

  // Subscribe to auth state changes
  function onAuthStateChange(callback) {
    authListeners.push(callback);
    
    // Immediately call with current state
    callback({ ...authState });
    
    // Return unsubscribe function
    return () => {
      const index = authListeners.indexOf(callback);
      if (index > -1) {
        authListeners.splice(index, 1);
      }
    };
  }

  // Export global AuthGuard
  global.AuthGuard = {
    getState: () => ({ ...authState }),
    onAuthStateChange,
    signOut,
    isAuthenticated: () => authState.user !== null && authState.session !== null,
    getUser: () => authState.user,
    getSession: () => authState.session
  };

  // Auto-check on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAuth);
  } else {
    checkAuth();
  }

  // Fallback timeout
  setTimeout(() => {
    if (authState.loading && !authState.checked) {
      console.log('[AuthGuard] Timeout, redirecting to login');
      redirectToLogin();
    }
  }, CONFIG.checkTimeout);

})(typeof window !== 'undefined' ? window : global);
