/**
 * MissionPulse Render API Client
 * Connects frontend to FastAPI backend on Render
 * 
 * Provides MissionPulseAPI namespace with:
 * - agents.list() / agents.get(id) / agents.chat(id, message)
 * - analytics.summary() / pipeline() / dashboard()
 * - trainingData.* - Company profile, win themes, competitors, etc.
 * - context.loadDemo() / status() / opportunities()
 * - system.health() / version()
 * 
 * © 2026 Mission Meets Tech
 */

(function(global) {
  'use strict';

  // ============================================================
  // CONFIGURATION
  // ============================================================
  const API_BASE_URL = 'https://missionpulse-api.onrender.com';
  const API_TIMEOUT = 30000; // 30 seconds for AI responses

  // ============================================================
  // HTTP UTILITIES
  // ============================================================

  /**
   * Make an API request with error handling
   * @param {string} endpoint - API endpoint (e.g., '/api/agents-live')
   * @param {Object} options - Fetch options
   * @returns {Promise<{data: any, error: Error|null}>}
   */
  async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    const config = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers
      }
    };

    // Add timeout via AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout || API_TIMEOUT);
    config.signal = controller.signal;

    try {
      console.log(`[MissionPulseAPI] ${config.method || 'GET'} ${endpoint}`);
      
      const response = await fetch(url, config);
      clearTimeout(timeoutId);

      // Handle non-JSON responses
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        const errorMessage = data?.detail || data?.message || `HTTP ${response.status}`;
        throw new Error(errorMessage);
      }

      return { data, error: null };
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        console.error(`[MissionPulseAPI] Request timeout: ${endpoint}`);
        return { data: null, error: new Error('Request timed out') };
      }
      
      console.error(`[MissionPulseAPI] Error: ${endpoint}`, error);
      return { data: null, error };
    }
  }

  /**
   * GET request helper
   */
  async function get(endpoint, options = {}) {
    return apiRequest(endpoint, { method: 'GET', ...options });
  }

  /**
   * POST request helper
   */
  async function post(endpoint, body, options = {}) {
    return apiRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
      ...options
    });
  }

  /**
   * PUT request helper
   */
  async function put(endpoint, body, options = {}) {
    return apiRequest(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
      ...options
    });
  }

  /**
   * DELETE request helper
   */
  async function del(endpoint, options = {}) {
    return apiRequest(endpoint, { method: 'DELETE', ...options });
  }

  // ============================================================
  // SYSTEM / HEALTH ENDPOINTS
  // ============================================================

  const system = {
    /**
     * Health check
     * @returns {Promise<{data: Object, error: Error|null}>}
     */
    async health() {
      return get('/api/health');
    },

    /**
     * Get API version
     * @returns {Promise<{data: Object, error: Error|null}>}
     */
    async version() {
      return get('/api/version');
    }
  };

  // ============================================================
  // CONTEXT MANAGEMENT ENDPOINTS
  // ============================================================

  const context = {
    /**
     * Load demo data
     * @returns {Promise<{data: Object, error: Error|null}>}
     */
    async loadDemo() {
      return post('/api/context/load-demo', {});
    },

    /**
     * Get context status
     * @returns {Promise<{data: Object, error: Error|null}>}
     */
    async status() {
      return get('/api/context/status');
    },

    /**
     * Get agent context
     * @param {string} agentType - Agent type (capture, strategy, etc.)
     * @returns {Promise<{data: Object, error: Error|null}>}
     */
    async getAgentContext(agentType) {
      return get(`/api/context/agent/${agentType}`);
    },

    /**
     * Get opportunities
     * @returns {Promise<{data: Array, error: Error|null}>}
     */
    async opportunities() {
      return get('/api/context/opportunities');
    },

    /**
     * Get competitors
     * @returns {Promise<{data: Array, error: Error|null}>}
     */
    async competitors() {
      return get('/api/context/competitors');
    },

    /**
     * Clear cache
     * @returns {Promise<{data: Object, error: Error|null}>}
     */
    async clearCache() {
      return post('/api/context/cache/clear', {});
    },

    /**
     * Context health check
     * @returns {Promise<{data: Object, error: Error|null}>}
     */
    async health() {
      return get('/api/context/health');
    }
  };

  // ============================================================
  // AI AGENTS ENDPOINTS (LIVE)
  // ============================================================

  const agents = {
    /**
     * List all available agents
     * @returns {Promise<{data: Array, error: Error|null}>}
     */
    async list() {
      return get('/api/agents-live');
    },

    /**
     * Get a specific agent's details
     * @param {string} agentId - Agent ID (capture, strategy, blackhat, etc.)
     * @returns {Promise<{data: Object, error: Error|null}>}
     */
    async get(agentId) {
      return get(`/api/agents-live/${agentId}`);
    },

    /**
     * Chat with an AI agent
     * @param {string} agentId - Agent ID
     * @param {string} message - User message
     * @param {Object} options - Additional options
     * @returns {Promise<{data: Object, error: Error|null}>}
     */
    async chat(agentId, message, options = {}) {
      const body = {
        message,
        opportunity_id: options.opportunityId || null,
        include_context: options.includeContext !== false,
        stream: options.stream || false
      };
      
      // Longer timeout for AI responses
      return post(`/api/agents-live/${agentId}/chat`, body, { timeout: 60000 });
    },

    /**
     * Analyze content with an agent
     * @param {string} agentId - Agent ID
     * @param {Object} data - Data to analyze
     * @returns {Promise<{data: Object, error: Error|null}>}
     */
    async analyze(agentId, data) {
      return post(`/api/agents-live/${agentId}/analyze`, data, { timeout: 60000 });
    },

    /**
     * Get agent usage stats
     * @param {string} agentId - Agent ID
     * @returns {Promise<{data: Object, error: Error|null}>}
     */
    async usage(agentId) {
      return get(`/api/agents-live/${agentId}/usage`);
    },

    /**
     * Health check for live agents
     * @returns {Promise<{data: Object, error: Error|null}>}
     */
    async health() {
      return get('/api/agents-live/health/live');
    }
  };

  // ============================================================
  // ANALYTICS ENDPOINTS (Dashboard)
  // ============================================================

  const analytics = {
    /**
     * Get analytics summary
     * @returns {Promise<{data: Object, error: Error|null}>}
     */
    async summary() {
      return get('/api/analytics/summary');
    },

    /**
     * Get pipeline metrics
     * @returns {Promise<{data: Object, error: Error|null}>}
     */
    async pipeline() {
      return get('/api/analytics/pipeline');
    },

    /**
     * Get win rate metrics
     * @returns {Promise<{data: Object, error: Error|null}>}
     */
    async winRate() {
      return get('/api/analytics/win-rate');
    },

    /**
     * Get agent usage metrics
     * @returns {Promise<{data: Object, error: Error|null}>}
     */
    async agentUsage() {
      return get('/api/analytics/agents');
    },

    /**
     * Get token usage trends
     * @returns {Promise<{data: Object, error: Error|null}>}
     */
    async tokenTrends() {
      return get('/api/analytics/tokens');
    },

    /**
     * Get priority distribution
     * @returns {Promise<{data: Object, error: Error|null}>}
     */
    async priorityDistribution() {
      return get('/api/analytics/priority');
    },

    /**
     * Get full dashboard data
     * @returns {Promise<{data: Object, error: Error|null}>}
     */
    async dashboard() {
      return get('/api/analytics/dashboard');
    },

    /**
     * Analytics health check
     * @returns {Promise<{data: Object, error: Error|null}>}
     */
    async health() {
      return get('/api/analytics/health');
    }
  };

  // ============================================================
  // TRAINING DATA ENDPOINTS
  // ============================================================

  const trainingData = {
    /**
     * Get training data summary
     * @returns {Promise<{data: Object, error: Error|null}>}
     */
    async summary() {
      return get('/api/training-data/summary');
    },

    // --- Company Profile ---
    async getCompanyProfiles() {
      return get('/api/training-data/company-profile');
    },

    async createCompanyProfile(profile) {
      return post('/api/training-data/company-profile', profile);
    },

    async updateCompanyProfile(recordId, profile) {
      return put(`/api/training-data/company-profile/${recordId}`, profile);
    },

    async deleteCompanyProfile(recordId) {
      return del(`/api/training-data/company-profile/${recordId}`);
    },

    // --- Labor Categories ---
    async getLaborCategories() {
      return get('/api/training-data/labor-categories');
    },

    async createLaborCategory(category) {
      return post('/api/training-data/labor-categories', category);
    },

    async updateLaborCategory(recordId, category) {
      return put(`/api/training-data/labor-categories/${recordId}`, category);
    },

    async deleteLaborCategory(recordId) {
      return del(`/api/training-data/labor-categories/${recordId}`);
    },

    // --- Past Performance ---
    async getPastPerformance() {
      return get('/api/training-data/past-performance');
    },

    async createPastPerformance(pastPerf) {
      return post('/api/training-data/past-performance', pastPerf);
    },

    async updatePastPerformance(recordId, pastPerf) {
      return put(`/api/training-data/past-performance/${recordId}`, pastPerf);
    },

    async deletePastPerformance(recordId) {
      return del(`/api/training-data/past-performance/${recordId}`);
    },

    // --- Competitor Intel ---
    async getCompetitorIntel() {
      return get('/api/training-data/competitor-intel');
    },

    async createCompetitorIntel(competitor) {
      return post('/api/training-data/competitor-intel', competitor);
    },

    async updateCompetitorIntel(recordId, competitor) {
      return put(`/api/training-data/competitor-intel/${recordId}`, competitor);
    },

    async deleteCompetitorIntel(recordId) {
      return del(`/api/training-data/competitor-intel/${recordId}`);
    },

    // --- Win Themes ---
    async getWinThemes() {
      return get('/api/training-data/win-themes');
    },

    async createWinTheme(theme) {
      return post('/api/training-data/win-themes', theme);
    },

    async updateWinTheme(recordId, theme) {
      return put(`/api/training-data/win-themes/${recordId}`, theme);
    },

    async deleteWinTheme(recordId) {
      return del(`/api/training-data/win-themes/${recordId}`);
    },

    // --- Teaming Partners ---
    async getTeamingPartners() {
      return get('/api/training-data/teaming-partners');
    },

    async createTeamingPartner(partner) {
      return post('/api/training-data/teaming-partners', partner);
    },

    async updateTeamingPartner(recordId, partner) {
      return put(`/api/training-data/teaming-partners/${recordId}`, partner);
    },

    async deleteTeamingPartner(recordId) {
      return del(`/api/training-data/teaming-partners/${recordId}`);
    },

    // --- Export ---
    async exportCategory(category) {
      return get(`/api/training-data/export/${category}`);
    }
  };

  // ============================================================
  // CONNECTION UTILITIES
  // ============================================================

  let connectionStatus = 'unknown';
  let connectionListeners = [];

  /**
   * Check if API is reachable
   * @returns {Promise<boolean>}
   */
  async function checkConnection() {
    const { error } = await system.health();
    const isConnected = !error;
    
    const newStatus = isConnected ? 'connected' : 'disconnected';
    if (newStatus !== connectionStatus) {
      connectionStatus = newStatus;
      connectionListeners.forEach(cb => cb(connectionStatus));
    }
    
    return isConnected;
  }

  /**
   * Subscribe to connection status changes
   * @param {Function} callback - Called with status string
   * @returns {Function} Unsubscribe function
   */
  function onConnectionChange(callback) {
    connectionListeners.push(callback);
    callback(connectionStatus);
    
    return () => {
      const index = connectionListeners.indexOf(callback);
      if (index > -1) connectionListeners.splice(index, 1);
    };
  }

  /**
   * Get current connection status
   * @returns {string} 'connected' | 'disconnected' | 'unknown'
   */
  function getConnectionStatus() {
    return connectionStatus;
  }

  // ============================================================
  // CONSTANTS
  // ============================================================

  const AGENT_IDS = {
    CAPTURE: 'capture',
    STRATEGY: 'strategy',
    BLACKHAT: 'blackhat',
    PRICING: 'pricing',
    COMPLIANCE: 'compliance',
    WRITER: 'writer',
    CONTRACTS: 'contracts',
    ORALS: 'orals'
  };

  // ============================================================
  // EXPORT MissionPulseAPI NAMESPACE
  // ============================================================

  global.MissionPulseAPI = {
    // Namespaces
    system,
    context,
    agents,
    analytics,
    trainingData,

    // Connection utilities
    checkConnection,
    onConnectionChange,
    getConnectionStatus,

    // Constants
    AGENT_IDS,
    API_BASE_URL,

    // Direct access to request helpers (for custom endpoints)
    request: {
      get,
      post,
      put,
      delete: del
    }
  };

  // Auto-check connection on load
  if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(checkConnection, 500);
      });
    } else {
      setTimeout(checkConnection, 500);
    }
  }

  console.log('[MissionPulseAPI] Render API client loaded');
  console.log(`[MissionPulseAPI] Backend: ${API_BASE_URL}`);

})(typeof window !== 'undefined' ? window : global);
