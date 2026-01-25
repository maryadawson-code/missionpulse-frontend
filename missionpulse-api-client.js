/**
 * ================================================================================
 * MISSIONPULSE - FRONTEND API CLIENT
 * ================================================================================
 * Handles communication with the MissionPulse FastAPI backend.
 * Includes error handling, loading states, and demo data fallback.
 * 
 * Usage:
 *   import { MissionPulseAPI, useDashboardData } from './api-client.js';
 *   
 *   // In React component:
 *   const { data, loading, error } = useDashboardData('summary');
 * 
 * Author: Mission Meets Tech
 * Version: 1.0.0
 * Phase: 2.5 (API Integration)
 * ================================================================================
 */

// =============================================================================
// CONFIGURATION
// =============================================================================

const API_CONFIG = {
  // Production API endpoint on Render
  baseUrl: 'https://missionpulse-api.onrender.com',
  
  // Timeout for requests (Render cold start can take 30s)
  timeout: 45000,
  
  // Retry configuration
  maxRetries: 2,
  retryDelay: 1000,
  
  // Enable demo mode fallback when API unavailable
  enableDemoFallback: true,
  
  // Debug logging
  debug: true
};

// =============================================================================
// DEMO DATA (Fallback when API unavailable)
// =============================================================================

const DEMO_DATA = {
  summary: {
    pipeline_count: { label: "Active Pipeline", value: "6", trend: "up", change: "+2 this month", icon: "📊" },
    pipeline_value: { label: "Pipeline Value", value: "$412.1M", trend: "up", change: "+$48M", icon: "💰" },
    avg_pwin: { label: "Avg Win Probability", value: "63%", trend: "up", change: "+5%", icon: "🎯" },
    urgent_deadlines: { label: "Urgent Deadlines", value: "4", trend: "neutral", change: "< 30 days", icon: "⚠️" },
    generated_at: new Date().toISOString(),
    _source: "demo"
  },
  
  pipeline: {
    stages: [
      { stage_name: "GATE_1", stage_label: "Gate 1", count: 1, total_value: 156200000, opportunities: [] },
      { stage_name: "BLUE_TEAM", stage_label: "Blue Team", count: 1, total_value: 42800000, opportunities: [] },
      { stage_name: "KICKOFF", stage_label: "Kickoff", count: 1, total_value: 98450210, opportunities: [] },
      { stage_name: "PINK_TEAM", stage_label: "Pink Team (30%)", count: 1, total_value: 28300000, opportunities: [] },
      { stage_name: "RED_TEAM", stage_label: "Red Team (70%)", count: 1, total_value: 67400000, opportunities: [] },
      { stage_name: "GOLD_TEAM", stage_label: "Gold Team (90%)", count: 1, total_value: 18900000, opportunities: [] }
    ],
    total_opportunities: 6,
    total_value: 412050210,
    generated_at: new Date().toISOString(),
    _source: "demo"
  },
  
  activities: {
    activities: [
      { id: "ACT-001", timestamp: new Date().toISOString(), action: "PWIN_CALCULATED", description: "Win probability updated to 72%", user: "AI Agent", module: "M1", module_label: "Capture Intel", severity: "SUCCESS" },
      { id: "ACT-002", timestamp: new Date(Date.now() - 3600000).toISOString(), action: "GATE_DECISION", description: "Blue Team: CONDITIONAL GO", user: "Sarah Chen", module: "M2", module_label: "War Room", severity: "WARNING" },
      { id: "ACT-003", timestamp: new Date(Date.now() - 7200000).toISOString(), action: "COMPLIANCE_CHECK", description: "12 new requirements extracted", user: "AI Agent", module: "M6", module_label: "Iron Dome", severity: "INFO" }
    ],
    total_count: 3,
    page: 1,
    page_size: 10,
    has_more: false,
    generated_at: new Date().toISOString(),
    _source: "demo"
  },
  
  workload: {
    team_members: [
      { id: "USR-001", name: "Maria Santos", role: "CAP", role_label: "Capture Manager", avatar_initials: "MS", active_opportunities: 3, capacity_percent: 95, status: "RED" },
      { id: "USR-002", name: "James Wong", role: "SA", role_label: "Solution Architect", avatar_initials: "JW", active_opportunities: 4, capacity_percent: 110, status: "RED" },
      { id: "USR-003", name: "Diana Ross", role: "CON", role_label: "Contracts Lead", avatar_initials: "DR", active_opportunities: 5, capacity_percent: 75, status: "GREEN" }
    ],
    total_assignments: 35,
    overloaded_count: 2,
    generated_at: new Date().toISOString(),
    _source: "demo"
  }
};

// =============================================================================
// LOGGING UTILITY
// =============================================================================

function log(level, message, data = null) {
  if (!API_CONFIG.debug) return;
  
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  const prefix = `[MissionPulse API ${timestamp}]`;
  
  switch (level) {
    case 'info':
      console.log(`${prefix} ℹ️ ${message}`, data || '');
      break;
    case 'warn':
      console.warn(`${prefix} ⚠️ ${message}`, data || '');
      break;
    case 'error':
      console.error(`${prefix} ❌ ${message}`, data || '');
      break;
    case 'success':
      console.log(`${prefix} ✅ ${message}`, data || '');
      break;
  }
}

// =============================================================================
// API CLIENT CLASS
// =============================================================================

class MissionPulseAPIClient {
  constructor(config = {}) {
    this.baseUrl = config.baseUrl || API_CONFIG.baseUrl;
    this.timeout = config.timeout || API_CONFIG.timeout;
    this.maxRetries = config.maxRetries || API_CONFIG.maxRetries;
    this.retryDelay = config.retryDelay || API_CONFIG.retryDelay;
    this.enableDemoFallback = config.enableDemoFallback ?? API_CONFIG.enableDemoFallback;
    
    // Track API health
    this.isAPIHealthy = null;
    this.lastHealthCheck = null;
  }
  
  /**
   * Make a fetch request with timeout and retry logic
   */
  async _fetch(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    
    try {
      log('info', `Fetching: ${endpoint}`);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...options.headers
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      data._source = 'api';
      data._fetchedAt = new Date().toISOString();
      
      log('success', `Received: ${endpoint}`, { status: response.status });
      return { success: true, data, error: null };
      
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        log('error', `Timeout: ${endpoint} (${this.timeout}ms)`);
        return { success: false, data: null, error: 'Request timed out. The API may be starting up.' };
      }
      
      log('error', `Failed: ${endpoint}`, error.message);
      return { success: false, data: null, error: error.message };
    }
  }
  
  /**
   * Fetch with retry logic
   */
  async _fetchWithRetry(endpoint, options = {}, retries = 0) {
    const result = await this._fetch(endpoint, options);
    
    if (result.success) {
      this.isAPIHealthy = true;
      return result;
    }
    
    if (retries < this.maxRetries) {
      log('warn', `Retrying ${endpoint} (${retries + 1}/${this.maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, this.retryDelay * (retries + 1)));
      return this._fetchWithRetry(endpoint, options, retries + 1);
    }
    
    this.isAPIHealthy = false;
    return result;
  }
  
  /**
   * Get data with demo fallback
   */
  async _getWithFallback(endpoint, demoKey) {
    const result = await this._fetchWithRetry(endpoint);
    
    if (result.success) {
      return result.data;
    }
    
    if (this.enableDemoFallback && DEMO_DATA[demoKey]) {
      log('warn', `Using demo data for: ${demoKey}`);
      return { ...DEMO_DATA[demoKey], _fallback: true, _error: result.error };
    }
    
    throw new Error(result.error || 'API request failed');
  }
  
  // ===========================================================================
  // PUBLIC API METHODS
  // ===========================================================================
  
  /**
   * Check API health
   */
  async checkHealth() {
    const result = await this._fetch('/api/health');
    this.isAPIHealthy = result.success;
    this.lastHealthCheck = new Date();
    return result;
  }
  
  /**
   * Get dashboard KPI summary
   */
  async getDashboardSummary() {
    return this._getWithFallback('/api/dashboard/summary', 'summary');
  }
  
  /**
   * Get pipeline data by Shipley stage
   */
  async getPipeline(filters = {}) {
    let endpoint = '/api/dashboard/pipeline';
    const params = new URLSearchParams();
    
    if (filters.priority) params.append('priority', filters.priority);
    if (filters.agency) params.append('agency', filters.agency);
    
    if (params.toString()) {
      endpoint += `?${params.toString()}`;
    }
    
    return this._getWithFallback(endpoint, 'pipeline');
  }
  
  /**
   * Get activity feed
   */
  async getActivities(options = {}) {
    const { page = 1, pageSize = 10, module, severity } = options;
    let endpoint = `/api/dashboard/activities?page=${page}&page_size=${pageSize}`;
    
    if (module) endpoint += `&module=${module}`;
    if (severity) endpoint += `&severity=${severity}`;
    
    return this._getWithFallback(endpoint, 'activities');
  }
  
  /**
   * Get team workload
   */
  async getWorkload(filters = {}) {
    let endpoint = '/api/dashboard/workload';
    
    if (filters.role) {
      endpoint += `?role=${filters.role}`;
    }
    
    return this._getWithFallback(endpoint, 'workload');
  }
  
  /**
   * Get API version info
   */
  async getVersion() {
    return this._fetchWithRetry('/api/version');
  }
  
  /**
   * Get available agents
   */
  async getAgents() {
    return this._fetchWithRetry('/api/agents');
  }
}

// =============================================================================
// REACT HOOK (for use in dashboard)
// =============================================================================

/**
 * React hook for fetching dashboard data with loading/error states
 * 
 * @param {string} dataType - 'summary' | 'pipeline' | 'activities' | 'workload'
 * @param {object} options - Optional filters/params
 * @returns {object} { data, loading, error, refetch }
 */
function useDashboardData(dataType, options = {}) {
  const [state, setState] = React.useState({
    data: null,
    loading: true,
    error: null
  });
  
  const api = React.useMemo(() => new MissionPulseAPIClient(), []);
  
  const fetchData = React.useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      let data;
      switch (dataType) {
        case 'summary':
          data = await api.getDashboardSummary();
          break;
        case 'pipeline':
          data = await api.getPipeline(options);
          break;
        case 'activities':
          data = await api.getActivities(options);
          break;
        case 'workload':
          data = await api.getWorkload(options);
          break;
        default:
          throw new Error(`Unknown data type: ${dataType}`);
      }
      
      setState({ data, loading: false, error: null });
    } catch (error) {
      setState({ data: null, loading: false, error: error.message });
    }
  }, [dataType, JSON.stringify(options)]);
  
  React.useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  return { ...state, refetch: fetchData };
}

// =============================================================================
// EXPORTS
// =============================================================================

// Create singleton instance
const MissionPulseAPI = new MissionPulseAPIClient();

// Export for use in HTML <script> tags
if (typeof window !== 'undefined') {
  window.MissionPulseAPI = MissionPulseAPI;
  window.MissionPulseAPIClient = MissionPulseAPIClient;
  window.useDashboardData = useDashboardData;
  window.API_CONFIG = API_CONFIG;
  window.DEMO_DATA = DEMO_DATA;
}

// ES Module exports
export { 
  MissionPulseAPI, 
  MissionPulseAPIClient, 
  useDashboardData,
  API_CONFIG,
  DEMO_DATA
};
