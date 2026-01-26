/**
 * MissionPulse Supabase Client Module
 * Sprint 2-3: Shared client with CRUD operations and real-time subscriptions
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
 * Â© 2026 Mission Meets Tech
 */

(function(global) {
  'use strict';

  // ============================================================
  // SUPABASE CONFIGURATION
  // ============================================================
  const SUPABASE_URL = 'https://djuviwarqdvlbgcfuupa.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqdXZpd2FycWR2bGJnY2Z1dXBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc4MzUyMjQsImV4cCI6MjA1MzQxMTIyNH0.pBPL9l2zL7LLd_A5I--hPBzw5YwG3ajPMtbYsqsxIgQ';

  // Initialize Supabase client
  let supabase = null;
  let connectionStatus = 'disconnected';
  let connectionListeners = [];

  function initSupabase() {
    if (typeof global.supabase !== 'undefined' && global.supabase.createClient) {
      supabase = global.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      connectionStatus = 'connected';
      notifyConnectionListeners();
      console.log('[MissionPulse] Supabase client initialized');
      return true;
    }
    console.warn('[MissionPulse] Supabase library not loaded');
    return false;
  }

  function notifyConnectionListeners() {
    connectionListeners.forEach(cb => cb(connectionStatus));
  }

  // ============================================================
  // FIELD MAPPING: snake_case (DB) <-> camelCase (Frontend)
  // ============================================================
  const fieldMapping = {
    // DB -> Frontend
    toFrontend: {
      id: 'id',
      name: 'name',
      agency: 'agency',
      contract_value: 'contractValue',
      priority: 'priority',
      shipley_phase: 'shipleyPhase',
      win_probability: 'winProbability',
      due_date: 'dueDate',
      solicitation_number: 'solicitationNumber',
      created_at: 'createdAt',
      updated_at: 'updatedAt',
      description: 'description',
      contract_type: 'contractType',
      set_aside: 'setAside',
      naics_code: 'naicsCode',
      primary_contact: 'primaryContact'
    },
    // Frontend -> DB
    toDatabase: {
      id: 'id',
      name: 'name',
      agency: 'agency',
      contractValue: 'contract_value',
      priority: 'priority',
      shipleyPhase: 'shipley_phase',
      winProbability: 'win_probability',
      dueDate: 'due_date',
      solicitationNumber: 'solicitation_number',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      description: 'description',
      contractType: 'contract_type',
      setAside: 'set_aside',
      naicsCode: 'naics_code',
      primaryContact: 'primary_contact'
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
    'gate_1': { name: 'Gate 1', color: '#94a3b8', order: 1 },
    'blue_team': { name: 'Blue Team', color: '#60a5fa', order: 2 },
    'pink_team': { name: 'Pink Team', color: '#f472b6', order: 3 },
    'red_team': { name: 'Red Team', color: '#ef4444', order: 4 },
    'gold_team': { name: 'Gold Team', color: '#fbbf24', order: 5 },
    'submitted': { name: 'Submitted', color: '#22c55e', order: 6 },
    'awarded': { name: 'Awarded', color: '#8b5cf6', order: 7 },
    'lost': { name: 'Lost', color: '#64748b', order: 8 }
  };

  function mapShipleyPhaseToDisplay(phase) {
    if (!phase) return 'Gate 1';
    const phaseInfo = SHIPLEY_PHASES[phase];
    return phaseInfo ? phaseInfo.name : phase;
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
    if (!supabase) {
      if (!initSupabase()) {
        return { data: null, error: new Error('Supabase not initialized') };
      }
    }

    try {
      let query = supabase
        .from('opportunities')
        .select('*');

      // Apply ordering
      const orderBy = options.orderBy || 'due_date';
      const ascending = options.ascending !== undefined ? options.ascending : true;
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
    if (!supabase) {
      if (!initSupabase()) {
        return { data: null, error: new Error('Supabase not initialized') };
      }
    }

    try {
      const { data, error } = await supabase
        .from('opportunities')
        .select('contract_value, win_probability, due_date, shipley_phase');

      if (error) throw error;

      // Calculate stats
      const now = new Date();
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const stats = {
        totalCount: data.length,
        totalValue: data.reduce((sum, opp) => sum + (opp.contract_value || 0), 0),
        avgPwin: data.length > 0 
          ? Math.round(data.reduce((sum, opp) => sum + (opp.win_probability || 0), 0) / data.length)
          : 0,
        dueThisMonth: data.filter(opp => {
          if (!opp.due_date) return false;
          const dueDate = new Date(opp.due_date);
          return dueDate >= now && dueDate <= monthEnd;
        }).length,
        byPhase: {}
      };

      // Group by phase
      data.forEach(opp => {
        const phase = opp.shipley_phase || 'gate_1';
        if (!stats.byPhase[phase]) {
          stats.byPhase[phase] = { count: 0, value: 0 };
        }
        stats.byPhase[phase].count++;
        stats.byPhase[phase].value += opp.contract_value || 0;
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
    const { data, error } = await getOpportunities({ orderBy: 'due_date', ascending: true });
    
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
      }
    });

    // Convert to array sorted by order
    const phasesArray = Object.values(grouped).sort((a, b) => a.order - b.order);

    return { data: phasesArray, error: null };
  }

  /**
   * Create a new opportunity
   * @param {Object} opportunityData - Opportunity data in frontend format
   * @returns {Promise<{data: Object, error: Error|null}>}
   */
  async function createOpportunity(opportunityData) {
    if (!supabase) {
      if (!initSupabase()) {
        return { data: null, error: new Error('Supabase not initialized') };
      }
    }

    try {
      // Map to database format
      const dbData = mapToDatabase(opportunityData);
      
      // Remove id if present (let DB generate it)
      delete dbData.id;
      
      // Set timestamps
      dbData.created_at = new Date().toISOString();
      dbData.updated_at = new Date().toISOString();

      const { data, error } = await supabase
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
    if (!supabase) {
      if (!initSupabase()) {
        return { data: null, error: new Error('Supabase not initialized') };
      }
    }

    try {
      // Map to database format
      const dbData = mapToDatabase(updates);
      
      // Always update timestamp
      dbData.updated_at = new Date().toISOString();

      const { data, error } = await supabase
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
    if (!supabase) {
      if (!initSupabase()) {
        return { data: null, error: new Error('Supabase not initialized') };
      }
    }

    try {
      const { error } = await supabase
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
  // ACTIVITY LOGGING OPERATIONS
  // ============================================================

  /**
   * Log an activity for an opportunity
   * @param {Object} activityData - Activity data
   * @param {string} activityData.opportunityId - Related opportunity ID
   * @param {string} activityData.action - Action type (created, updated, phase_changed, deleted)
   * @param {string} activityData.fieldChanged - Field that changed (optional)
   * @param {string} activityData.oldValue - Previous value (optional)
   * @param {string} activityData.newValue - New value (optional)
   * @param {string} activityData.userId - User who performed action (defaults to 'system')
   * @returns {Promise<{data: Object, error: Error|null}>}
   */
  async function logActivity(activityData) {
    if (!supabase) {
      if (!initSupabase()) {
        return { data: null, error: new Error('Supabase not initialized') };
      }
    }

    try {
      const dbData = {
        opportunity_id: activityData.opportunityId,
        action: activityData.action,
        field_changed: activityData.fieldChanged || null,
        old_value: activityData.oldValue || null,
        new_value: activityData.newValue || null,
        user_id: activityData.userId || 'system',
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('activity_log')
        .insert([dbData])
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.warn('[MissionPulse] Error logging activity:', error);
      return { data: null, error };
    }
  }

  /**
   * Get activities for a specific opportunity
   * @param {string} opportunityId - Opportunity ID
   * @param {Object} options - Query options
   * @param {number} options.limit - Max results (default 50)
   * @returns {Promise<{data: Array, error: Error|null}>}
   */
  async function getActivities(opportunityId, options = {}) {
    if (!supabase) {
      if (!initSupabase()) {
        return { data: null, error: new Error('Supabase not initialized') };
      }
    }

    try {
      let query = supabase
        .from('activity_log')
        .select('*')
        .eq('opportunity_id', opportunityId)
        .order('created_at', { ascending: false });

      if (options.limit) {
        query = query.limit(options.limit);
      } else {
        query = query.limit(50);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Map to frontend format
      const mappedData = (data || []).map(activity => ({
        id: activity.id,
        opportunityId: activity.opportunity_id,
        action: activity.action,
        fieldChanged: activity.field_changed,
        oldValue: activity.old_value,
        newValue: activity.new_value,
        userId: activity.user_id,
        createdAt: activity.created_at
      }));

      return { data: mappedData, error: null };
    } catch (error) {
      console.error('[MissionPulse] Error fetching activities:', error);
      return { data: null, error };
    }
  }

  /**
   * Get recent activities across all opportunities
   * @param {Object} options - Query options
   * @param {number} options.limit - Max results (default 20)
   * @param {string} options.action - Filter by action type
   * @returns {Promise<{data: Array, error: Error|null}>}
   */
  async function getRecentActivities(options = {}) {
    if (!supabase) {
      if (!initSupabase()) {
        return { data: null, error: new Error('Supabase not initialized') };
      }
    }

    try {
      let query = supabase
        .from('activity_log')
        .select(`
          *,
          opportunities (
            name,
            agency
          )
        `)
        .order('created_at', { ascending: false });

      if (options.action) {
        query = query.eq('action', options.action);
      }

      query = query.limit(options.limit || 20);

      const { data, error } = await query;

      if (error) throw error;

      // Map to frontend format with opportunity info
      const mappedData = (data || []).map(activity => ({
        id: activity.id,
        opportunityId: activity.opportunity_id,
        opportunityName: activity.opportunities?.name || 'Unknown',
        opportunityAgency: activity.opportunities?.agency || 'Unknown',
        action: activity.action,
        fieldChanged: activity.field_changed,
        oldValue: activity.old_value,
        newValue: activity.new_value,
        userId: activity.user_id,
        createdAt: activity.created_at
      }));

      return { data: mappedData, error: null };
    } catch (error) {
      console.error('[MissionPulse] Error fetching recent activities:', error);
      return { data: null, error };
    }
  }

  /**
   * Bulk update opportunities (for bulk phase change)
   * @param {Array<string>} ids - Array of opportunity IDs
   * @param {Object} updates - Fields to update
   * @returns {Promise<{data: Array, error: Error|null}>}
   */
  async function bulkUpdateOpportunities(ids, updates) {
    if (!supabase) {
      if (!initSupabase()) {
        return { data: null, error: new Error('Supabase not initialized') };
      }
    }

    try {
      const dbData = mapToDatabase(updates);
      dbData.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('opportunities')
        .update(dbData)
        .in('id', ids)
        .select();

      if (error) throw error;

      // Log activity for each
      for (const id of ids) {
        await logActivity({
          opportunityId: id,
          action: 'updated',
          fieldChanged: Object.keys(updates).join(', '),
          newValue: JSON.stringify(updates)
        });
      }

      return { data: (data || []).map(mapToFrontend), error: null };
    } catch (error) {
      console.error('[MissionPulse] Error bulk updating opportunities:', error);
      return { data: null, error };
    }
  }

  /**
   * Bulk delete opportunities
   * @param {Array<string>} ids - Array of opportunity IDs
   * @returns {Promise<{data: {success: boolean, count: number}, error: Error|null}>}
   */
  async function bulkDeleteOpportunities(ids) {
    if (!supabase) {
      if (!initSupabase()) {
        return { data: null, error: new Error('Supabase not initialized') };
      }
    }

    try {
      const { error } = await supabase
        .from('opportunities')
        .delete()
        .in('id', ids);

      if (error) throw error;

      return { data: { success: true, count: ids.length }, error: null };
    } catch (error) {
      console.error('[MissionPulse] Error bulk deleting opportunities:', error);
      return { data: null, error };
    }
  }

  /**
   * Get unique agencies from all opportunities (for filter dropdown)
   * @returns {Promise<{data: Array<string>, error: Error|null}>}
   */
  async function getUniqueAgencies() {
    if (!supabase) {
      if (!initSupabase()) {
        return { data: null, error: new Error('Supabase not initialized') };
      }
    }

    try {
      const { data, error } = await supabase
        .from('opportunities')
        .select('agency');

      if (error) throw error;

      // Get unique agencies
      const agencies = [...new Set((data || []).map(d => d.agency).filter(Boolean))].sort();
      
      return { data: agencies, error: null };
    } catch (error) {
      console.error('[MissionPulse] Error fetching agencies:', error);
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
    if (!supabase) {
      if (!initSupabase()) {
        console.error('[MissionPulse] Cannot subscribe - Supabase not initialized');
        return () => {};
      }
    }

    opportunityCallbacks.push(callback);

    // Create subscription if this is the first subscriber
    if (!opportunitySubscription) {
      opportunitySubscription = supabase
        .channel('opportunities-changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'opportunities' },
          (payload) => {
            const event = {
              eventType: payload.eventType,
              new: payload.new ? mapToFrontend(payload.new) : null,
              old: payload.old ? mapToFrontend(payload.old) : null
            };
            opportunityCallbacks.forEach(cb => cb(event));
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
   * @returns {string} 'connected' | 'disconnected' | 'connecting'
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

  // ============================================================
  // EXPORT MissionPulse NAMESPACE
  // ============================================================
  global.MissionPulse = {
    // CRUD Operations
    getOpportunities,
    getPipelineStats,
    getOpportunitiesByPhase,
    createOpportunity,
    updateOpportunity,
    deleteOpportunity,

    // Bulk Operations
    bulkUpdateOpportunities,
    bulkDeleteOpportunities,

    // Activity Logging
    logActivity,
    getActivities,
    getRecentActivities,

    // Filter Helpers
    getUniqueAgencies,

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

    // Constants
    SHIPLEY_PHASES,

    // Initialization
    init: initSupabase
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
