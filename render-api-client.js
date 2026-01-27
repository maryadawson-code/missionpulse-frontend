/**
 * MissionPulse Render API Client
 * Connects frontend to FastAPI backend on Render
 * 
 * Provides MissionPulseAPI namespace with:
 * - agents.list() / agents.get(id) / agents.chat(id, message)
 * - dashboard.health() / summary() / pipeline() / activities() / workload()
 * - trainingData.* - Company profile, win themes, competitors, etc.
 * - system.health() / version() / contextStatus()
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
   * @param {string} endpoint - API endpoint (e.g., '/api/agents')
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
    },

    /**
     * Get context injection status
     * @returns {Promise<{data: Object, error: Error|null}>}
     */
    async contextStatus() {
      return get('/api/context/status');
    }
  };

  // ============================================================
  // AI AGENTS ENDPOINTS
  // ============================================================

  const agents = {
    /**
     * List all available agents (filtered by RBAC)
     * @returns {Promise<{data: Array, error: Error|null}>}
     */
    async list() {
      return get('/api/agents');
    },

    /**
     * Get a specific agent's details
     * @param {string} agentId - Agent ID (capture, strategy, blackhat, etc.)
     * @returns {Promise<{data: Object, error: Error|null}>}
     */
    async get(agentId) {
      return get(`/api/agents/${agentId}`);
    },

    /**
     * Chat with an AI agent
     * @param {string} agentId - Agent ID
     * @param {string} message - User message
     * @param {Object} options - Additional options
     * @param {string} options.opportunityId - Context opportunity ID
     * @param {boolean} options.includePlaybook - Include golden examples
     * @param {string} options.userRole - User's role for RBAC
     * @returns {Promise<{data: Object, error: Error|null}>}
     */
    async chat(agentId, message, options = {}) {
      const body = {
        message,
        opportunity_id: options.opportunityId || null,
        include_playbook: options.includePlaybook !== false,
        user_role: options.userRole || 'standard'
      };
      
      // Longer timeout for AI responses
      return post(`/api/agents/${agentId}/chat`, body, { timeout: 60000 });
    },

    /**
     * Get agent IDs by restriction level
     * @param {Array} agentList - List of agents from list()
     * @returns {Object} { public: [], restricted: [] }
     */
    categorize(agentList) {
      if (!agentList) return { public: [], restricted: [] };
      return {
        public: agentList.filter(a => !a.restricted).map(a => a.id),
        restricted: agentList.filter(a => a.restricted).map(a => a.id)
      };
    }
  };

  // ============================================================
  // DASHBOARD ENDPOINTS
  // ============================================================

  const dashboard = {
    /**
     * Dashboard health check
     * @returns {Promise<{data: Object, error: Error|null}>}
     */
    async health() {
      return get('/api/dashboard/health');
    },

    /**
     * Get dashboard summary (KPIs, stats)
     * @returns {Promise<{data: Object, error: Error|null}>}
     */
    async summary() {
      return get('/api/dashboard/summary');
    },

    /**
     * Get pipeline data
     * @returns {Promise<{data: Object, error: Error|null}>}
     */
    async pipeline() {
      return get('/api/dashboard/pipeline');
    },

    /**
     * Get recent activities
     * @returns {Promise<{data: Array, error: Error|null}>}
     */
    async activities() {
      return get('/api/dashboard/activities');
    },

    /**
     * Get workload distribution
     * @returns {Promise<{data: Object, error: Error|null}>}
     */
    async workload() {
      return get('/api/dashboard/workload');
    },

    /**
     * Get all dashboard data in parallel
     * @returns {Promise<{data: Object, error: Error|null}>}
     */
    async getAll() {
      try {
        const [summaryRes, pipelineRes, activitiesRes, workloadRes] = await Promise.all([
          this.summary(),
          this.pipeline(),
          this.activities(),
          this.workload()
        ]);

        // Check for any errors
        const errors = [summaryRes, pipelineRes, activitiesRes, workloadRes]
          .filter(r => r.error)
          .map(r => r.error.message);

        if (errors.length > 0) {
          return { data: null, error: new Error(errors.join(', ')) };
        }

        return {
          data: {
            summary: summaryRes.data,
            pipeline: pipelineRes.data,
            activities: activitiesRes.data,
            workload: workloadRes.data
          },
          error: null
        };
      } catch (error) {
        return { data: null, error };
      }
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
    async getCompanyProfile() {
      return get('/api/company-profile');
    },

    async createCompanyProfile(profile) {
      return post('/api/company-profile', profile);
    },

    // --- Win Themes ---
    async getWinThemes() {
      return get('/api/win-themes');
    },

    async createWinTheme(theme) {
      return post('/api/win-themes', theme);
    },

    async deleteWinTheme(themeId) {
      return del(`/api/win-themes/${themeId}`);
    },

    // --- Competitors ---
    async getCompetitors() {
      return get('/api/competitors');
    },

    async createCompetitor(competitor) {
      return post('/api/competitors', competitor);
    },

    async deleteCompetitor(competitorId) {
      return del(`/api/competitors/${competitorId}`);
    },

    // --- Labor Categories ---
    async getLaborCategories() {
      return get('/api/labor-categories');
    },

    async createLaborCategory(category) {
      return post('/api/labor-categories', category);
    },

    async deleteLaborCategory(categoryId) {
      return del(`/api/labor-categories/${categoryId}`);
    },

    // --- Past Performance ---
    async getPastPerformance() {
      return get('/api/past-performance');
    },

    async createPastPerformance(pastPerf) {
      return post('/api/past-performance', pastPerf);
    },

    async deletePastPerformance(ppId) {
      return del(`/api/past-performance/${ppId}`);
    },

    // --- Teaming Partners ---
    async getTeamingPartners() {
      return get('/api/teaming-partners');
    },

    async createTeamingPartner(partner) {
      return post('/api/teaming-partners', partner);
    },

    async deleteTeamingPartner(partnerId) {
      return del(`/api/teaming-partners/${partnerId}`);
    },

    /**
     * Get all training data in parallel
     * @returns {Promise<{data: Object, error: Error|null}>}
     */
    async getAll() {
      try {
        const [
          profileRes,
          themesRes,
          competitorsRes,
          lcatsRes,
          pastPerfRes,
          partnersRes
        ] = await Promise.all([
          this.getCompanyProfile(),
          this.getWinThemes(),
          this.getCompetitors(),
          this.getLaborCategories(),
          this.getPastPerformance(),
          this.getTeamingPartners()
        ]);

        return {
          data: {
            companyProfile: profileRes.data,
            winThemes: themesRes.data,
            competitors: competitorsRes.data,
            laborCategories: lcatsRes.data,
            pastPerformance: pastPerfRes.data,
            teamingPartners: partnersRes.data
          },
          error: null
        };
      } catch (error) {
        return { data: null, error };
      }
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

  const RESTRICTED_AGENTS = ['strategy', 'blackhat', 'pricing'];
  const PUBLIC_AGENTS = ['capture', 'compliance', 'writer', 'contracts', 'orals'];

  // ============================================================
  // EXPORT MissionPulseAPI NAMESPACE
  // ============================================================

  global.MissionPulseAPI = {
    // Namespaces
    system,
    agents,
    dashboard,
    trainingData,

    // Connection utilities
    checkConnection,
    onConnectionChange,
    getConnectionStatus,

    // Constants
    AGENT_IDS,
    RESTRICTED_AGENTS,
    PUBLIC_AGENTS,
    API_BASE_URL,

    // Direct access to request helpers (for custom endpoints)
    request: {
      get,
      post,
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
