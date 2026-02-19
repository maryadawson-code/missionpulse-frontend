/**
 * MissionPulse Supabase Client Module
 * Sprint 47: Unified client with CRUD operations and real-time subscriptions
 * 
 * CREDENTIALS VERIFIED: https://djuviwarqdvlbgcfuupa.supabase.co
 * 
 * Provides MissionPulse namespace with:
 * - getOpportunities() - Fetch all opportunities
 * - getPipelineStats() - Aggregate statistics
 * - subscribeToOpportunities(callback) - Real-time updates
 * - createOpportunity(data) - Create new opportunity
 * - updateOpportunity(id, data) - Update existing opportunity
 * - deleteOpportunity(id) - Delete opportunity
 * - getOpportunitiesByPhase() - Grouped by Shipley phase
 * 
 * © 2026 Mission Meets Tech
 */

(function(global) {
  'use strict';

  // ============================================================
  // SUPABASE CONFIGURATION - VERIFIED PRODUCTION CREDENTIALS
  // ============================================================
  const SUPABASE_URL = 'https://djuviwarqdvlbgcfuupa.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqdXZpd2FycWR2bGJnY2Z1dXBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NDQ0NjUsImV4cCI6MjA4NTAyMDQ2NX0.3s8ufDDN2aWfkW0RBsAyJyacb2tjB7M550WSFIohHcA';

  // Initialize Supabase client
  let supabaseClient = null;
  let connectionStatus = 'disconnected';
  let connectionListeners = [];
  let initRetryCount = 0;
  const MAX_INIT_RETRIES = 3;

  function initSupabase() {
    if (typeof global.supabase !== 'undefined' && global.supabase.createClient) {
      try {
        supabaseClient = global.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
          auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true
          }
        });
        connectionStatus = 'connected';
        notifyConnectionListeners();
        console.log('[MissionPulse] Supabase client initialized - URL:', SUPABASE_URL);
        return true;
      } catch (error) {
        console.error('[MissionPulse] Failed to create Supabase client:', error);
        connectionStatus = 'error';
        notifyConnectionListeners();
        return false;
      }
    }
    
    // Retry initialization if library not yet loaded
    if (initRetryCount < MAX_INIT_RETRIES) {
      initRetryCount++;
      console.warn('[MissionPulse] Supabase library not loaded, retrying in 500ms... (attempt ' + initRetryCount + ')');
      setTimeout(initSupabase, 500);
      return false;
    }
    
    console.error('[MissionPulse] Supabase library failed to load after ' + MAX_INIT_RETRIES + ' attempts');
    connectionStatus = 'error';
    notifyConnectionListeners();
    return false;
  }

  function getClient() {
    if (!supabaseClient) {
      initSupabase();
    }
    return supabaseClient;
  }

  function notifyConnectionListeners() {
    connectionListeners.forEach(cb => {
      try {
        cb(connectionStatus);
      } catch (e) {
        console.error('[MissionPulse] Connection listener error:', e);
      }
    });
  }

  // ============================================================
  // FIELD MAPPING: snake_case (DB) <-> camelCase (Frontend)
  // ============================================================
  const fieldMapping = {
    // DB -> Frontend (matches actual Supabase schema)
    toFrontend: {
      id: 'id',
      title: 'name',
      nickname: 'nickname',
      agency: 'agency',
      ceiling: 'contractValue',
      priority: 'priority',
      stage: 'shipleyPhase',
      pwin: 'winProbability',
      solicitation_number: 'solicitationNumber',
      created_at: 'createdAt',
      updated_at: 'updatedAt',
      set_aside: 'setAside',
      contract_vehicle: 'contractVehicle',
      role: 'role',
      company_id: 'companyId',
      // Legacy aliases for backward compat
      name: 'name',
      contract_value: 'contractValue',
      shipley_phase: 'shipleyPhase',
      win_probability: 'winProbability'
    },
    // Frontend -> DB (maps to actual Supabase columns)
    toDatabase: {
      id: 'id',
      name: 'title',
      agency: 'agency',
      contractValue: 'ceiling',
      priority: 'priority',
      shipleyPhase: 'stage',
      winProbability: 'pwin',
      solicitationNumber: 'solicitation_number',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      description: 'description',
      setAside: 'set_aside',
      contractVehicle: 'contract_vehicle',
      nickname: 'nickname',
      role: 'role',
      companyId: 'company_id'
    }
  };

  // Map DB record to frontend format
  function mapToFrontend(record) {
    if (!record) return null;
    const mapped = {};
    Object.keys(record).forEach(key => {
      const frontendKey = fieldMapping.toFrontend[key] || key;
      mapped[frontendKey] = record[key];
    });
    
    // Compute derived fields
    if (mapped.dueDate) {
      const dueDate = new Date(mapped.dueDate);
      const today = new Date();
      const diffTime = dueDate - today;
      mapped.daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    
    // Map shipley_phase to display phase
    mapped.phase = mapShipleyPhaseToDisplay(mapped.shipleyPhase);
    
    // Format ceiling from contract_value
    mapped.ceiling = mapped.contractValue;
    
    // Map win_probability to pWin
    mapped.pWin = mapped.winProbability;
    
    return mapped;
  }

  // Map frontend data to DB format
  function mapToDatabase(data) {
    if (!data) return null;
    const mapped = {};
    Object.keys(data).forEach(key => {
      const dbKey = fieldMapping.toDatabase[key];
      if (dbKey) {
        mapped[dbKey] = data[key];
      }
    });
    return mapped;
  }

  // Shipley phase display mapping
  const SHIPLEY_PHASES = {
    'identified': { name: 'Identified', color: '#a78bfa', order: 0 },
    'capture': { name: 'Capture', color: '#38bdf8', order: 1 },
    'gate_1': { name: 'Gate 1', color: '#94a3b8', order: 2 },
    'blue_team': { name: 'Blue Team', color: '#60a5fa', order: 3 },
    'pink_team': { name: 'Pink Team', color: '#f472b6', order: 4 },
    'red_team': { name: 'Red Team', color: '#ef4444', order: 5 },
    'gold_team': { name: 'Gold Team', color: '#fbbf24', order: 6 },
    'submitted': { name: 'Submitted', color: '#22c55e', order: 7 },
    'awarded': { name: 'Awarded', color: '#8b5cf6', order: 8 },
    'lost': { name: 'Lost', color: '#64748b', order: 9 }
  };

  function mapShipleyPhaseToDisplay(phase) {
    if (!phase) return 'Gate 1';
    const phaseInfo = SHIPLEY_PHASES[phase];
    return phaseInfo ? phaseInfo.name : phase;
  }

  // ============================================================
  // AUTHENTICATION HELPERS
  // ============================================================
  
  /**
   * Get current authenticated user
   * @returns {Promise<{user: Object|null, error: Error|null}>}
   */
  async function getCurrentUser() {
    const client = getClient();
    if (!client) {
      return { user: null, error: new Error('Supabase not initialized') };
    }
    
    try {
      const { data: { user }, error } = await client.auth.getUser();
      return { user, error };
    } catch (error) {
      console.error('[MissionPulse] Error getting current user:', error);
      return { user: null, error };
    }
  }

  /**
   * Get current session
   * @returns {Promise<{session: Object|null, error: Error|null}>}
   */
  async function getSession() {
    const client = getClient();
    if (!client) {
      return { session: null, error: new Error('Supabase not initialized') };
    }
    
    try {
      const { data: { session }, error } = await client.auth.getSession();
      return { session, error };
    } catch (error) {
      console.error('[MissionPulse] Error getting session:', error);
      return { session: null, error };
    }
  }

  /**
   * Sign out current user
   * @returns {Promise<{error: Error|null}>}
   */
  async function signOut() {
    const client = getClient();
    if (!client) {
      return { error: new Error('Supabase not initialized') };
    }
    
    try {
      const { error } = await client.auth.signOut();
      localStorage.removeItem('missionpulse_user');
      return { error };
    } catch (error) {
      console.error('[MissionPulse] Error signing out:', error);
      return { error };
    }
  }

  // ============================================================
  // CRUD OPERATIONS
  // ============================================================

  /**
   * Fetch all opportunities
   * @param {Object} options - Query options
   * @param {string} options.orderBy - Field to order by
   * @param {boolean} options.ascending - Sort direction
   * @returns {Promise<{data: Array, error: Error|null}>}
   */
  async function getOpportunities(options = {}) {
    const client = getClient();
    if (!client) {
      return { data: null, error: new Error('Supabase not initialized') };
    }

    try {
      let query = client
        .from('opportunities')
        .select('*');

      // Apply ordering
      const orderBy = options.orderBy || 'created_at';
      const ascending = options.ascending !== undefined ? options.ascending : false;
      query = query.order(orderBy, { ascending });

      const { data, error } = await query;

      if (error) throw error;

      // Map all records to frontend format
      const mappedData = (data || []).map(mapToFrontend);
      
      return { data: mappedData, error: null };
    } catch (error) {
      console.error('[MissionPulse] Error fetching opportunities:', error);
      return { data: null, error };
    }
  }

  /**
   * Get pipeline statistics
   * @returns {Promise<{data: Object, error: Error|null}>}
   */
  async function getPipelineStats() {
    const client = getClient();
    if (!client) {
      return { data: null, error: new Error('Supabase not initialized') };
    }

    try {
      const { data, error } = await client
        .from('opportunities')
        .select('ceiling, pwin, created_at, stage');

      if (error) throw error;

      // Calculate stats
      const now = new Date();
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const stats = {
        totalCount: data.length,
        totalValue: data.reduce((sum, opp) => sum + (opp.ceiling || 0), 0),
        avgPwin: data.length > 0 
          ? Math.round(data.reduce((sum, opp) => sum + (opp.pwin || 0), 0) / data.length)
          : 0,
        dueThisMonth: data.filter(opp => {
          if (!opp.created_at) return false;
          const dueDate = new Date(opp.created_at);
          return dueDate >= now && dueDate <= monthEnd;
        }).length,
        byPhase: {}
      };

      // Group by phase
      data.forEach(opp => {
        const phase = opp.stage || 'gate_1';
        if (!stats.byPhase[phase]) {
          stats.byPhase[phase] = { count: 0, value: 0 };
        }
        stats.byPhase[phase].count++;
        stats.byPhase[phase].value += opp.ceiling || 0;
      });

      return { data: stats, error: null };
    } catch (error) {
      console.error('[MissionPulse] Error fetching pipeline stats:', error);
      return { data: null, error };
    }
  }

  /**
   * Get opportunities grouped by Shipley phase
   * @returns {Promise<{data: Object, error: Error|null}>}
   */
  async function getOpportunitiesByPhase() {
    const { data, error } = await getOpportunities({ orderBy: 'created_at', ascending: false });
    
    if (error) return { data: null, error };

    // Initialize all phases
    const grouped = {};
    Object.keys(SHIPLEY_PHASES).forEach(phase => {
      grouped[phase] = {
        ...SHIPLEY_PHASES[phase],
        phase: phase,
        items: []
      };
    });

    // Group opportunities
    (data || []).forEach(opp => {
      const phase = opp.shipleyPhase || 'gate_1';
      if (grouped[phase]) {
        grouped[phase].items.push(opp);
      } else {
        // Unknown phase - add to gate_1
        grouped.gate_1.items.push(opp);
      }
    });

    return { data: grouped, error: null };
  }

  /**
   * Create a new opportunity
   * @param {Object} opportunityData - Opportunity data in frontend format
   * @returns {Promise<{data: Object, error: Error|null}>}
   */
  async function createOpportunity(opportunityData) {
    const client = getClient();
    if (!client) {
      return { data: null, error: new Error('Supabase not initialized') };
    }

    try {
      // Map to database format
      const dbData = mapToDatabase(opportunityData);
      
      // Remove id if present (let DB generate it)
      delete dbData.id;
      
      // Set timestamps
      dbData.created_at = new Date().toISOString();
      dbData.updated_at = new Date().toISOString();

      const { data, error } = await client
        .from('opportunities')
        .insert([dbData])
        .select()
        .single();

      if (error) throw error;

      return { data: mapToFrontend(data), error: null };
    } catch (error) {
      console.error('[MissionPulse] Error creating opportunity:', error);
      return { data: null, error };
    }
  }

  /**
   * Update an existing opportunity
   * @param {string} id - Opportunity ID
   * @param {Object} updates - Fields to update in frontend format
   * @returns {Promise<{data: Object, error: Error|null}>}
   */
  async function updateOpportunity(id, updates) {
    const client = getClient();
    if (!client) {
      return { data: null, error: new Error('Supabase not initialized') };
    }

    try {
      // Map to database format
      const dbData = mapToDatabase(updates);
      
      // Always update timestamp
      dbData.updated_at = new Date().toISOString();

      const { data, error } = await client
        .from('opportunities')
        .update(dbData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return { data: mapToFrontend(data), error: null };
    } catch (error) {
      console.error('[MissionPulse] Error updating opportunity:', error);
      return { data: null, error };
    }
  }

  /**
   * Delete an opportunity
   * @param {string} id - Opportunity ID
   * @returns {Promise<{data: {success: boolean}, error: Error|null}>}
   */
  async function deleteOpportunity(id) {
    const client = getClient();
    if (!client) {
      return { data: null, error: new Error('Supabase not initialized') };
    }

    try {
      const { error } = await client
        .from('opportunities')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return { data: { success: true, id }, error: null };
    } catch (error) {
      console.error('[MissionPulse] Error deleting opportunity:', error);
      return { data: null, error };
    }
  }

  // ============================================================
  // REAL-TIME SUBSCRIPTIONS
  // ============================================================

  let opportunitySubscription = null;
  let opportunityCallbacks = [];

  /**
   * Subscribe to real-time opportunity changes
   * @param {Function} callback - Called on any change with { eventType, new, old }
   * @returns {Function} Unsubscribe function
   */
  function subscribeToOpportunities(callback) {
    const client = getClient();
    if (!client) {
      console.error('[MissionPulse] Cannot subscribe - Supabase not initialized');
      return () => {};
    }

    opportunityCallbacks.push(callback);

    // Create subscription if this is the first subscriber
    if (!opportunitySubscription) {
      opportunitySubscription = client
        .channel('opportunities-changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'opportunities' },
          (payload) => {
            const event = {
              eventType: payload.eventType,
              new: payload.new ? mapToFrontend(payload.new) : null,
              old: payload.old ? mapToFrontend(payload.old) : null
            };
            opportunityCallbacks.forEach(cb => {
              try {
                cb(event);
              } catch (e) {
                console.error('[MissionPulse] Subscription callback error:', e);
              }
            });
          }
        )
        .subscribe((status) => {
          console.log('[MissionPulse] Subscription status:', status);
          if (status === 'SUBSCRIBED') {
            connectionStatus = 'connected';
          } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            connectionStatus = 'disconnected';
          }
          notifyConnectionListeners();
        });
    }

    // Return unsubscribe function
    return () => {
      const index = opportunityCallbacks.indexOf(callback);
      if (index > -1) {
        opportunityCallbacks.splice(index, 1);
      }
      
      // Clean up subscription if no more callbacks
      if (opportunityCallbacks.length === 0 && opportunitySubscription) {
        opportunitySubscription.unsubscribe();
        opportunitySubscription = null;
      }
    };
  }

  /**
   * Subscribe to connection status changes
   * @param {Function} callback - Called with status string
   * @returns {Function} Unsubscribe function
   */
  function onConnectionChange(callback) {
    connectionListeners.push(callback);
    // Immediately call with current status
    callback(connectionStatus);
    
    return () => {
      const index = connectionListeners.indexOf(callback);
      if (index > -1) {
        connectionListeners.splice(index, 1);
      }
    };
  }

  /**
   * Get current connection status
   * @returns {string} 'connected' | 'disconnected' | 'connecting' | 'error'
   */
  function getConnectionStatus() {
    return connectionStatus;
  }

  // ============================================================
  // UTILITY FUNCTIONS
  // ============================================================

  /**
   * Format currency value
   * @param {number} value - Value in dollars
   * @returns {string} Formatted string like "$45.2M"
   */
  function formatCurrency(value) {
    if (!value) return '$0';
    if (value >= 1000000000) {
      return `$${(value / 1000000000).toFixed(1)}B`;
    }
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toLocaleString()}`;
  }

  /**
   * Get phase info by key
   * @param {string} phaseKey - Phase key like 'pink_team'
   * @returns {Object} Phase info with name, color, order
   */
  function getPhaseInfo(phaseKey) {
    return SHIPLEY_PHASES[phaseKey] || SHIPLEY_PHASES.gate_1;
  }

  /**
   * Get all Shipley phases
   * @returns {Array} Array of phase objects sorted by order
   */
  function getShipleyPhases() {
    return Object.entries(SHIPLEY_PHASES)
      .map(([key, value]) => ({ key, ...value }))
      .sort((a, b) => a.order - b.order);
  }

  /**
   * Test database connection
   * @returns {Promise<{success: boolean, error: Error|null}>}
   */
  async function testConnection() {
    const client = getClient();
    if (!client) {
      return { success: false, error: new Error('Supabase not initialized') };
    }
    
    try {
      const { error } = await client.from('opportunities').select('id').limit(1);
      if (error) throw error;
      return { success: true, error: null };
    } catch (error) {
      console.error('[MissionPulse] Connection test failed:', error);
      return { success: false, error };
    }
  }

  // ============================================================
  // EXPORT MissionPulse NAMESPACE
  // ============================================================
  global.MissionPulse = {
    // Auth
    getCurrentUser,
    getSession,
    signOut,
    
    // CRUD Operations
    getOpportunities,
    getPipelineStats,
    getOpportunitiesByPhase,
    createOpportunity,
    updateOpportunity,
    deleteOpportunity,

    // Real-time
    subscribeToOpportunities,
    onConnectionChange,
    getConnectionStatus,

    // Utilities
    formatCurrency,
    getPhaseInfo,
    getShipleyPhases,
    mapToFrontend,
    mapToDatabase,
    testConnection,

    // Constants
    SHIPLEY_PHASES,
    SUPABASE_URL,

    // Initialization
    init: initSupabase,
    getClient
  };

  // Auto-initialize when Supabase is available
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(initSupabase, 100);
    });
  } else {
    setTimeout(initSupabase, 100);
  }

})(typeof window !== 'undefined' ? window : global);
