/**
 * MissionPulse Core Library v1.0
 * ================================
 * Shared utilities for all MissionPulse v12 modules
 * 
 * Features:
 * - API Client with automatic error handling
 * - Toast notification system
 * - Loading state management
 * - Connection monitor
 * - Error boundary utilities
 * - RBAC helpers
 * 
 * Mission Meets Tech - "Mission. Technology. Transformation."
 * 
 * Usage:
 *   <script src="missionpulse-core.js"></script>
 *   Then access via window.MissionPulse or MP shorthand
 */

(function(global) {
  'use strict';

  // ============================================================================
  // CONFIGURATION
  // ============================================================================
  
  const CONFIG = {
    API_BASE: 'https://missionpulse-api.onrender.com',
    API_TIMEOUT: 30000, // 30 seconds
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000, // 1 second
    HEALTH_CHECK_INTERVAL: 30000, // 30 seconds
    TOAST_DURATION: 4000, // 4 seconds
    VERSION: '1.0.0'
  };

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  /**
   * Sleep utility for delays
   */
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  /**
   * Generate unique ID
   */
  const generateId = () => `mp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  /**
   * Safe JSON parse with fallback
   */
  const safeJsonParse = (str, fallback = null) => {
    try {
      return JSON.parse(str);
    } catch (e) {
      return fallback;
    }
  };

  // ============================================================================
  // CONNECTION STATE MANAGER
  // ============================================================================

  const ConnectionManager = {
    _isOnline: true,
    _isApiHealthy: true,
    _listeners: [],
    _healthCheckTimer: null,

    /**
     * Get current connection state
     */
    getState() {
      return {
        isOnline: this._isOnline,
        isApiHealthy: this._isApiHealthy,
        isFullyConnected: this._isOnline && this._isApiHealthy
      };
    },

    /**
     * Subscribe to connection changes
     */
    subscribe(callback) {
      this._listeners.push(callback);
      return () => {
        this._listeners = this._listeners.filter(cb => cb !== callback);
      };
    },

    /**
     * Notify all listeners of state change
     */
    _notify() {
      const state = this.getState();
      this._listeners.forEach(cb => cb(state));
    },

    /**
     * Check API health
     */
    async checkApiHealth() {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(`${CONFIG.API_BASE}/api/health`, {
          method: 'GET',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        const wasHealthy = this._isApiHealthy;
        this._isApiHealthy = response.ok;
        
        if (wasHealthy !== this._isApiHealthy) {
          this._notify();
        }
        
        return this._isApiHealthy;
      } catch (error) {
        const wasHealthy = this._isApiHealthy;
        this._isApiHealthy = false;
        
        if (wasHealthy !== this._isApiHealthy) {
          this._notify();
        }
        
        return false;
      }
    },

    /**
     * Start monitoring connection
     */
    startMonitoring() {
      // Browser online/offline events
      window.addEventListener('online', () => {
        this._isOnline = true;
        this._notify();
        this.checkApiHealth();
      });
      
      window.addEventListener('offline', () => {
        this._isOnline = false;
        this._notify();
      });

      // Initial check
      this._isOnline = navigator.onLine;
      this.checkApiHealth();

      // Periodic health checks
      this._healthCheckTimer = setInterval(() => {
        if (this._isOnline) {
          this.checkApiHealth();
        }
      }, CONFIG.HEALTH_CHECK_INTERVAL);
    },

    /**
     * Stop monitoring
     */
    stopMonitoring() {
      if (this._healthCheckTimer) {
        clearInterval(this._healthCheckTimer);
        this._healthCheckTimer = null;
      }
    }
  };

  // ============================================================================
  // TOAST NOTIFICATION SYSTEM
  // ============================================================================

  const ToastManager = {
    _container: null,
    _toasts: [],

    /**
     * Initialize toast container
     */
    init() {
      if (this._container) return;
      
      this._container = document.createElement('div');
      this._container.id = 'mp-toast-container';
      this._container.style.cssText = `
        position: fixed;
        top: 16px;
        right: 16px;
        z-index: 10000;
        display: flex;
        flex-direction: column;
        gap: 8px;
        pointer-events: none;
      `;
      document.body.appendChild(this._container);
    },

    /**
     * Show a toast notification
     */
    show(message, type = 'info', duration = CONFIG.TOAST_DURATION) {
      this.init();
      
      const id = generateId();
      const toast = document.createElement('div');
      toast.id = id;
      toast.style.cssText = `
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        border-radius: 8px;
        font-family: 'Inter', system-ui, sans-serif;
        font-size: 14px;
        font-weight: 500;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4);
        backdrop-filter: blur(8px);
        pointer-events: auto;
        animation: mpToastSlideIn 0.3s ease-out;
        max-width: 400px;
      `;
      
      // Type-specific styles
      const styles = {
        success: { bg: 'rgba(16, 185, 129, 0.2)', border: 'rgba(16, 185, 129, 0.5)', color: '#34D399', icon: '✓' },
        error: { bg: 'rgba(239, 68, 68, 0.2)', border: 'rgba(239, 68, 68, 0.5)', color: '#F87171', icon: '✕' },
        warning: { bg: 'rgba(245, 158, 11, 0.2)', border: 'rgba(245, 158, 11, 0.5)', color: '#FBBF24', icon: '⚠' },
        info: { bg: 'rgba(0, 229, 250, 0.2)', border: 'rgba(0, 229, 250, 0.5)', color: '#00E5FA', icon: 'ℹ' }
      };
      
      const s = styles[type] || styles.info;
      toast.style.backgroundColor = s.bg;
      toast.style.border = `1px solid ${s.border}`;
      toast.style.color = s.color;
      
      toast.innerHTML = `
        <span style="font-size: 18px;">${s.icon}</span>
        <span style="flex: 1; color: #E2E8F0;">${message}</span>
        <button onclick="MissionPulse.Toast.dismiss('${id}')" style="
          background: none;
          border: none;
          color: #94A3B8;
          cursor: pointer;
          padding: 4px;
          font-size: 16px;
          line-height: 1;
        ">×</button>
      `;
      
      this._container.appendChild(toast);
      this._toasts.push({ id, element: toast });
      
      // Auto dismiss
      if (duration > 0) {
        setTimeout(() => this.dismiss(id), duration);
      }
      
      return id;
    },

    /**
     * Dismiss a toast
     */
    dismiss(id) {
      const toastData = this._toasts.find(t => t.id === id);
      if (!toastData) return;
      
      toastData.element.style.animation = 'mpToastSlideOut 0.2s ease-in forwards';
      setTimeout(() => {
        toastData.element.remove();
        this._toasts = this._toasts.filter(t => t.id !== id);
      }, 200);
    },

    /**
     * Convenience methods
     */
    success(message, duration) { return this.show(message, 'success', duration); },
    error(message, duration) { return this.show(message, 'error', duration); },
    warning(message, duration) { return this.show(message, 'warning', duration); },
    info(message, duration) { return this.show(message, 'info', duration); }
  };

  // ============================================================================
  // API CLIENT
  // ============================================================================

  const ApiClient = {
    /**
     * Make an API request with automatic error handling and retries
     */
    async request(endpoint, options = {}) {
      const {
        method = 'GET',
        body = null,
        headers = {},
        timeout = CONFIG.API_TIMEOUT,
        retries = CONFIG.RETRY_ATTEMPTS,
        showErrorToast = true
      } = options;

      const url = endpoint.startsWith('http') ? endpoint : `${CONFIG.API_BASE}${endpoint}`;
      
      let lastError = null;
      
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), timeout);
          
          const fetchOptions = {
            method,
            headers: {
              'Content-Type': 'application/json',
              ...headers
            },
            signal: controller.signal
          };
          
          if (body && method !== 'GET') {
            fetchOptions.body = JSON.stringify(body);
          }
          
          const response = await fetch(url, fetchOptions);
          clearTimeout(timeoutId);
          
          // Parse response
          const contentType = response.headers.get('content-type');
          let data;
          
          if (contentType && contentType.includes('application/json')) {
            data = await response.json();
          } else {
            data = await response.text();
          }
          
          // Handle non-OK responses
          if (!response.ok) {
            const errorMessage = data?.message || data?.error || `HTTP ${response.status}`;
            throw new ApiError(errorMessage, response.status, data);
          }
          
          return {
            ok: true,
            status: response.status,
            data
          };
          
        } catch (error) {
          lastError = error;
          
          // Don't retry on client errors (4xx) or abort
          if (error.name === 'AbortError') {
            lastError = new ApiError('Request timed out', 408);
            break;
          }
          
          if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
            break;
          }
          
          // Wait before retry (exponential backoff)
          if (attempt < retries) {
            await sleep(CONFIG.RETRY_DELAY * attempt);
          }
        }
      }
      
      // All retries failed
      const errorMessage = lastError?.message || 'An unexpected error occurred';
      
      if (showErrorToast) {
        ToastManager.error(errorMessage);
      }
      
      return {
        ok: false,
        status: lastError?.status || 500,
        error: errorMessage,
        data: lastError?.data || null
      };
    },

    /**
     * Convenience methods
     */
    async get(endpoint, options = {}) {
      return this.request(endpoint, { ...options, method: 'GET' });
    },

    async post(endpoint, body, options = {}) {
      return this.request(endpoint, { ...options, method: 'POST', body });
    },

    async put(endpoint, body, options = {}) {
      return this.request(endpoint, { ...options, method: 'PUT', body });
    },

    async delete(endpoint, options = {}) {
      return this.request(endpoint, { ...options, method: 'DELETE' });
    },

    /**
     * Stream a response (for AI chat)
     */
    async stream(endpoint, body, onChunk, options = {}) {
      const { headers = {}, timeout = 60000 } = options;
      const url = endpoint.startsWith('http') ? endpoint : `${CONFIG.API_BASE}${endpoint}`;
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...headers
          },
          body: JSON.stringify(body),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new ApiError(errorData.message || `HTTP ${response.status}`, response.status);
        }
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullText = '';
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          fullText += chunk;
          
          if (onChunk) {
            onChunk(chunk, fullText);
          }
        }
        
        return { ok: true, data: fullText };
        
      } catch (error) {
        const errorMessage = error.message || 'Stream connection failed';
        ToastManager.error(errorMessage);
        return { ok: false, error: errorMessage };
      }
    }
  };

  /**
   * Custom API Error class
   */
  class ApiError extends Error {
    constructor(message, status = 500, data = null) {
      super(message);
      this.name = 'ApiError';
      this.status = status;
      this.data = data;
    }
  }

  // ============================================================================
  // LOADING STATE MANAGER
  // ============================================================================

  const LoadingManager = {
    _states: new Map(),
    _listeners: new Map(),

    /**
     * Set loading state for a key
     */
    setLoading(key, isLoading) {
      this._states.set(key, isLoading);
      this._notifyListeners(key);
    },

    /**
     * Get loading state
     */
    isLoading(key) {
      return this._states.get(key) || false;
    },

    /**
     * Subscribe to loading state changes
     */
    subscribe(key, callback) {
      if (!this._listeners.has(key)) {
        this._listeners.set(key, []);
      }
      this._listeners.get(key).push(callback);
      
      return () => {
        const listeners = this._listeners.get(key) || [];
        this._listeners.set(key, listeners.filter(cb => cb !== callback));
      };
    },

    /**
     * Notify listeners of a key
     */
    _notifyListeners(key) {
      const listeners = this._listeners.get(key) || [];
      const isLoading = this.isLoading(key);
      listeners.forEach(cb => cb(isLoading));
    },

    /**
     * Wrap an async function with loading state
     */
    async withLoading(key, asyncFn) {
      this.setLoading(key, true);
      try {
        return await asyncFn();
      } finally {
        this.setLoading(key, false);
      }
    }
  };

  // ============================================================================
  // RBAC HELPERS
  // ============================================================================

  const RBAC = {
    // Role definitions matching backend
    ROLES: {
      CEO: { level: 100, label: 'Chief Executive Officer', color: '#F59E0B' },
      COO: { level: 90, label: 'Chief Operating Officer', color: '#8B5CF6' },
      CAP: { level: 80, label: 'Capture Manager', color: '#00E5FA' },
      PM: { level: 70, label: 'Program Manager', color: '#10B981' },
      SA: { level: 60, label: 'Solution Architect', color: '#3B82F6' },
      FIN: { level: 50, label: 'Finance Lead', color: '#EC4899' },
      CON: { level: 50, label: 'Contracts Manager', color: '#F97316' },
      DEL: { level: 40, label: 'Delivery Lead', color: '#14B8A6' },
      SME: { level: 30, label: 'Subject Matter Expert', color: '#6366F1' },
      WRITER: { level: 20, label: 'Proposal Writer', color: '#84CC16' },
      VIEWER: { level: 10, label: 'Viewer', color: '#64748B' }
    },

    // Current user role (set by module)
    _currentRole: 'VIEWER',

    /**
     * Set current user role
     */
    setRole(role) {
      if (this.ROLES[role]) {
        this._currentRole = role;
      } else {
        console.warn(`Unknown role: ${role}`);
      }
    },

    /**
     * Get current role
     */
    getRole() {
      return this._currentRole;
    },

    /**
     * Check if current user has required role
     */
    hasRole(requiredRole) {
      const currentLevel = this.ROLES[this._currentRole]?.level || 0;
      const requiredLevel = this.ROLES[requiredRole]?.level || 0;
      return currentLevel >= requiredLevel;
    },

    /**
     * Check if current user has any of the specified roles
     */
    hasAnyRole(roles) {
      return roles.some(role => this.hasRole(role));
    },

    /**
     * Get role badge HTML
     */
    getRoleBadge(role) {
      const r = this.ROLES[role];
      if (!r) return '';
      return `<span style="
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 2px 8px;
        border-radius: 9999px;
        font-size: 11px;
        font-weight: 600;
        background: ${r.color}20;
        color: ${r.color};
        border: 1px solid ${r.color}40;
      ">${role}</span>`;
    },

    /**
     * Module access permissions
     */
    MODULE_ACCESS: {
      'M1-pipeline': ['CEO', 'COO', 'CAP', 'PM', 'SA', 'FIN', 'CON', 'DEL', 'SME', 'WRITER', 'VIEWER'],
      'M2-warroom': ['CEO', 'COO', 'CAP', 'PM', 'SA', 'FIN', 'CON', 'DEL', 'SME', 'WRITER'],
      'M3-swimlane': ['CEO', 'COO', 'CAP', 'PM', 'DEL'],
      'M4-compliance': ['CEO', 'COO', 'CAP', 'PM', 'SA', 'CON'],
      'M5-contracts': ['CEO', 'COO', 'CAP', 'PM', 'CON'],
      'M6-irondome': ['CEO', 'COO', 'CAP', 'PM', 'SA', 'WRITER'],
      'M7-blackhat': ['CEO', 'COO', 'CAP'], // Restricted!
      'M8-pricing': ['CEO', 'COO', 'FIN'], // Restricted!
      'M9-hitl': ['CEO', 'COO', 'CAP', 'PM', 'SA', 'WRITER'],
      'M10-orals': ['CEO', 'COO', 'CAP', 'PM', 'SA', 'SME'],
      'M11-frenemy': ['CEO', 'COO', 'CAP', 'CON'],
      'M12-dashboard': ['CEO', 'COO', 'CAP', 'PM', 'SA', 'FIN', 'CON', 'DEL', 'SME', 'WRITER', 'VIEWER'],
      'M13-roi': ['CEO', 'COO', 'FIN'],
      'M14-postaward': ['CEO', 'COO', 'PM', 'DEL'],
      'M15-playbook': ['CEO', 'COO', 'CAP', 'PM']
    },

    /**
     * Check if current user can access a module
     */
    canAccessModule(moduleId) {
      const allowedRoles = this.MODULE_ACCESS[moduleId] || [];
      return allowedRoles.includes(this._currentRole);
    }
  };

  // ============================================================================
  // REACT COMPONENTS (for modules using React)
  // ============================================================================

  const Components = {
    /**
     * Get skeleton loader CSS
     */
    getSkeletonStyles() {
      return `
        .mp-skeleton {
          background: linear-gradient(90deg, 
            rgba(71, 85, 105, 0.3) 25%, 
            rgba(71, 85, 105, 0.5) 50%, 
            rgba(71, 85, 105, 0.3) 75%
          );
          background-size: 200% 100%;
          animation: mpSkeletonShimmer 1.5s infinite;
          border-radius: 4px;
        }
        .mp-skeleton-text {
          height: 16px;
          margin-bottom: 8px;
        }
        .mp-skeleton-title {
          height: 24px;
          width: 60%;
          margin-bottom: 12px;
        }
        .mp-skeleton-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
        }
        .mp-skeleton-card {
          height: 120px;
          border-radius: 8px;
        }
      `;
    },

    /**
     * Create skeleton HTML
     */
    skeleton(type = 'text', width = '100%') {
      const classes = {
        text: 'mp-skeleton mp-skeleton-text',
        title: 'mp-skeleton mp-skeleton-title',
        avatar: 'mp-skeleton mp-skeleton-avatar',
        card: 'mp-skeleton mp-skeleton-card'
      };
      return `<div class="${classes[type] || classes.text}" style="width: ${width}"></div>`;
    },

    /**
     * Connection banner HTML
     */
    connectionBanner(state) {
      if (state.isFullyConnected) return '';
      
      const message = !state.isOnline 
        ? 'You are offline. Please check your internet connection.'
        : 'Unable to connect to MissionPulse API. Some features may be unavailable.';
      
      const bgColor = !state.isOnline ? 'rgba(239, 68, 68, 0.9)' : 'rgba(245, 158, 11, 0.9)';
      
      return `
        <div id="mp-connection-banner" style="
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 9999;
          padding: 12px 16px;
          background: ${bgColor};
          color: white;
          font-family: 'Inter', system-ui, sans-serif;
          font-size: 14px;
          font-weight: 500;
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          backdrop-filter: blur(8px);
        ">
          <span style="font-size: 18px;">${!state.isOnline ? '📡' : '⚠️'}</span>
          <span>${message}</span>
          <button onclick="MissionPulse.Connection.checkApiHealth().then(() => location.reload())" style="
            margin-left: 16px;
            padding: 4px 12px;
            background: rgba(255,255,255,0.2);
            border: 1px solid rgba(255,255,255,0.3);
            border-radius: 4px;
            color: white;
            cursor: pointer;
            font-size: 12px;
          ">Retry</button>
        </div>
      `;
    },

    /**
     * Error fallback UI
     */
    errorFallback(error, resetFn) {
      return `
        <div style="
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px;
          text-align: center;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 12px;
          margin: 24px;
        ">
          <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
          <h3 style="color: #F87171; font-size: 20px; font-weight: 600; margin-bottom: 8px;">
            Something went wrong
          </h3>
          <p style="color: #94A3B8; font-size: 14px; margin-bottom: 24px; max-width: 400px;">
            ${error?.message || 'An unexpected error occurred. Please try again.'}
          </p>
          <div style="display: flex; gap: 12px;">
            <button onclick="${resetFn || 'location.reload()'}" style="
              padding: 10px 20px;
              background: #00E5FA;
              color: #00050F;
              border: none;
              border-radius: 8px;
              font-weight: 600;
              cursor: pointer;
            ">Try Again</button>
            <button onclick="location.href='/'" style="
              padding: 10px 20px;
              background: transparent;
              color: #94A3B8;
              border: 1px solid #475569;
              border-radius: 8px;
              font-weight: 500;
              cursor: pointer;
            ">Go to Dashboard</button>
          </div>
          <p style="color: #64748B; font-size: 11px; margin-top: 24px;">
            AI GENERATED - REQUIRES HUMAN REVIEW
          </p>
        </div>
      `;
    },

    /**
     * Empty state UI
     */
    emptyState(title, description, actionLabel, actionFn) {
      return `
        <div style="
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px;
          text-align: center;
        ">
          <div style="
            width: 64px;
            height: 64px;
            background: rgba(0, 229, 250, 0.1);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 16px;
          ">
            <span style="font-size: 28px;">📋</span>
          </div>
          <h3 style="color: #E2E8F0; font-size: 18px; font-weight: 600; margin-bottom: 8px;">
            ${title}
          </h3>
          <p style="color: #94A3B8; font-size: 14px; margin-bottom: 24px; max-width: 300px;">
            ${description}
          </p>
          ${actionLabel ? `
            <button onclick="${actionFn}" style="
              padding: 10px 20px;
              background: #00E5FA;
              color: #00050F;
              border: none;
              border-radius: 8px;
              font-weight: 600;
              cursor: pointer;
            ">${actionLabel}</button>
          ` : ''}
        </div>
      `;
    }
  };

  // ============================================================================
  // GLOBAL STYLES INJECTION
  // ============================================================================

  const injectStyles = () => {
    if (document.getElementById('mp-core-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'mp-core-styles';
    style.textContent = `
      @keyframes mpToastSlideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes mpToastSlideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
      @keyframes mpSkeletonShimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
      @keyframes mpSpinner {
        to { transform: rotate(360deg); }
      }
      .mp-spinner {
        width: 20px;
        height: 20px;
        border: 2px solid rgba(0, 229, 250, 0.2);
        border-top-color: #00E5FA;
        border-radius: 50%;
        animation: mpSpinner 0.8s linear infinite;
      }
      ${Components.getSkeletonStyles()}
    `;
    document.head.appendChild(style);
  };

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  const init = () => {
    injectStyles();
    ConnectionManager.startMonitoring();
    
    // Update connection banner on state change
    ConnectionManager.subscribe((state) => {
      const existingBanner = document.getElementById('mp-connection-banner');
      if (existingBanner) {
        existingBanner.remove();
      }
      
      if (!state.isFullyConnected) {
        document.body.insertAdjacentHTML('afterbegin', Components.connectionBanner(state));
      }
    });
    
    console.log(`%c🛡️ MissionPulse Core v${CONFIG.VERSION} loaded`, 'color: #00E5FA; font-weight: bold;');
  };

  // Auto-init when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  const MissionPulse = {
    VERSION: CONFIG.VERSION,
    CONFIG,
    
    // Core modules
    Api: ApiClient,
    Toast: ToastManager,
    Loading: LoadingManager,
    Connection: ConnectionManager,
    RBAC,
    Components,
    
    // Utilities
    utils: {
      sleep,
      generateId,
      safeJsonParse
    },
    
    // Convenience re-exports
    get: ApiClient.get.bind(ApiClient),
    post: ApiClient.post.bind(ApiClient),
    put: ApiClient.put.bind(ApiClient),
    delete: ApiClient.delete.bind(ApiClient),
    stream: ApiClient.stream.bind(ApiClient),
    
    toast: ToastManager.show.bind(ToastManager),
    success: ToastManager.success.bind(ToastManager),
    error: ToastManager.error.bind(ToastManager),
    warning: ToastManager.warning.bind(ToastManager),
    info: ToastManager.info.bind(ToastManager)
  };

  // Expose globally
  global.MissionPulse = MissionPulse;
  global.MP = MissionPulse; // Shorthand

})(typeof window !== 'undefined' ? window : this);
