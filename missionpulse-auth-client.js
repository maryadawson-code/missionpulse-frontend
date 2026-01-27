/**
 * MissionPulse Supabase Auth Client
 * Phase 3: Complete auth system with CRUD operations
 * 
 * Auth Functions:
 * - signIn(email, password) - Login with email/password
 * - signUp(email, password, metadata) - Register new user
 * - signOut() - Logout current user
 * - getSession() - Get current session
 * - getUser() - Get current user
 * - resetPassword(email) - Send password reset email
 * - updatePassword(newPassword) - Update password
 * - onAuthStateChange(callback) - Subscribe to auth changes
 * 
 * © 2026 Mission Meets Tech
 */

(function(global) {
  'use strict';

  // ============================================================
  // SUPABASE CONFIGURATION
  // ============================================================
  const SUPABASE_URL = 'https://djuviwarqdvlbgcfuupa.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqdXZpd2FycWR2bGJnY2Z1dXBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc4MzUyMjQsImV4cCI6MjA1MzQxMTIyNH0.pBPL9l2zL7LLd_A5I--hPBzw5YwG3ajPMtbYsqsxIgQ';

  let supabase = null;
  let connectionStatus = 'disconnected';
  let connectionListeners = [];
  let authListeners = [];

  function initSupabase() {
    if (typeof global.supabase !== 'undefined' && global.supabase.createClient) {
      supabase = global.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      connectionStatus = 'connected';
      notifyConnectionListeners();
      console.log('[MissionPulse] Supabase client initialized');
      
      // Set up auth state listener
      supabase.auth.onAuthStateChange((event, session) => {
        console.log('[MissionPulse] Auth state changed:', event);
        authListeners.forEach(cb => cb(event, session));
      });
      
      return true;
    }
    console.warn('[MissionPulse] Supabase library not loaded');
    return false;
  }

  function notifyConnectionListeners() {
    connectionListeners.forEach(cb => cb(connectionStatus));
  }

  // ============================================================
  // AUTHENTICATION FUNCTIONS
  // ============================================================

  /**
   * Sign in with email and password
   * @param {string} email 
   * @param {string} password 
   * @returns {Promise<{data: Object, error: Error|null}>}
   */
  async function signIn(email, password) {
    if (!supabase) {
      if (!initSupabase()) {
        return { data: null, error: new Error('Supabase not initialized') };
      }
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      console.log('[MissionPulse] User signed in:', data.user?.email);
      return { data, error: null };
    } catch (error) {
      console.error('[MissionPulse] Sign in error:', error);
      return { data: null, error };
    }
  }

  /**
   * Sign up new user
   * @param {string} email 
   * @param {string} password 
   * @param {Object} metadata - Optional user metadata {name, role, company_id}
   * @returns {Promise<{data: Object, error: Error|null}>}
   */
  async function signUp(email, password, metadata = {}) {
    if (!supabase) {
      if (!initSupabase()) {
        return { data: null, error: new Error('Supabase not initialized') };
      }
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: metadata.name || '',
            role: metadata.role || 'viewer',
            company_id: metadata.company_id || null
          }
        }
      });

      if (error) throw error;

      console.log('[MissionPulse] User signed up:', data.user?.email);
      return { data, error: null };
    } catch (error) {
      console.error('[MissionPulse] Sign up error:', error);
      return { data: null, error };
    }
  }

  /**
   * Sign out current user
   * @returns {Promise<{error: Error|null}>}
   */
  async function signOut() {
    if (!supabase) {
      return { error: new Error('Supabase not initialized') };
    }

    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      console.log('[MissionPulse] User signed out');
      return { error: null };
    } catch (error) {
      console.error('[MissionPulse] Sign out error:', error);
      return { error };
    }
  }

  /**
   * Get current session
   * @returns {Promise<{data: {session: Object}, error: Error|null}>}
   */
  async function getSession() {
    if (!supabase) {
      if (!initSupabase()) {
        return { data: { session: null }, error: new Error('Supabase not initialized') };
      }
    }

    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('[MissionPulse] Get session error:', error);
      return { data: { session: null }, error };
    }
  }

  /**
   * Get current user
   * @returns {Promise<{data: {user: Object}, error: Error|null}>}
   */
  async function getUser() {
    if (!supabase) {
      if (!initSupabase()) {
        return { data: { user: null }, error: new Error('Supabase not initialized') };
      }
    }

    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('[MissionPulse] Get user error:', error);
      return { data: { user: null }, error };
    }
  }

  /**
   * Send password reset email
   * @param {string} email 
   * @returns {Promise<{data: Object, error: Error|null}>}
   */
  async function resetPassword(email) {
    if (!supabase) {
      if (!initSupabase()) {
        return { data: null, error: new Error('Supabase not initialized') };
      }
    }

    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password.html`
      });

      if (error) throw error;

      console.log('[MissionPulse] Password reset email sent to:', email);
      return { data, error: null };
    } catch (error) {
      console.error('[MissionPulse] Reset password error:', error);
      return { data: null, error };
    }
  }

  /**
   * Update user password (requires active session)
   * @param {string} newPassword 
   * @returns {Promise<{data: Object, error: Error|null}>}
   */
  async function updatePassword(newPassword) {
    if (!supabase) {
      return { data: null, error: new Error('Supabase not initialized') };
    }

    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      console.log('[MissionPulse] Password updated');
      return { data, error: null };
    } catch (error) {
      console.error('[MissionPulse] Update password error:', error);
      return { data: null, error };
    }
  }

  /**
   * Subscribe to auth state changes
   * @param {Function} callback - Called with (event, session)
   * @returns {Function} Unsubscribe function
   */
  function onAuthStateChange(callback) {
    authListeners.push(callback);
    
    return () => {
      const index = authListeners.indexOf(callback);
      if (index > -1) {
        authListeners.splice(index, 1);
      }
    };
  }

  /**
   * Check if user is authenticated and redirect to login if not
   * @param {string} loginUrl - URL to redirect to if not authenticated
   * @returns {Promise<{authenticated: boolean, user: Object|null}>}
   */
  async function requireAuth(loginUrl = '/login.html') {
    const { data } = await getSession();
    
    if (!data.session) {
      console.log('[MissionPulse] Not authenticated, redirecting to login');
      window.location.href = loginUrl;
      return { authenticated: false, user: null };
    }
    
    return { 
      authenticated: true, 
      user: data.session.user 
    };
  }

  // ============================================================
  // FIELD MAPPING: snake_case (DB) <-> camelCase (Frontend)
  // ============================================================
  const fieldMapping = {
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
      primary_contact: 'primaryContact',
      // Additional fields
      title: 'title',
      nickname: 'nickname',
      ceiling: 'ceiling',
      company_id: 'companyId'
    },
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
      primaryContact: 'primary_contact',
      title: 'title',
      nickname: 'nickname',
      ceiling: 'ceiling',
      companyId: 'company_id'
    }
  };

  function mapToFrontend(record) {
    if (!record) return null;
    const mapped = {};
    Object.keys(record).forEach(key => {
      const frontendKey = fieldMapping.toFrontend[key] || key;
      mapped[frontendKey] = record[key];
    });
    
    // Computed fields
    if (mapped.dueDate) {
      const dueDate = new Date(mapped.dueDate);
      const today = new Date();
      const diffTime = dueDate - today;
      mapped.daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    
    mapped.phase = mapShipleyPhaseToDisplay(mapped.shipleyPhase);
    mapped.pWin = mapped.winProbability;
    
    return mapped;
  }

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

  // Shipley phases
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

  async function getOpportunities(options = {}) {
    if (!supabase) {
      if (!initSupabase()) {
        return { data: null, error: new Error('Supabase not initialized') };
      }
    }

    try {
      let query = supabase.from('opportunities').select('*');
      const orderBy = options.orderBy || 'created_at';
      const ascending = options.ascending !== undefined ? options.ascending : false;
      query = query.order(orderBy, { ascending });

      const { data, error } = await query;
      if (error) throw error;

      const mappedData = (data || []).map(mapToFrontend);
      return { data: mappedData, error: null };
    } catch (error) {
      console.error('[MissionPulse] Error fetching opportunities:', error);
      return { data: null, error };
    }
  }

  async function getCompetitors(options = {}) {
    if (!supabase) {
      if (!initSupabase()) {
        return { data: null, error: new Error('Supabase not initialized') };
      }
    }

    try {
      let query = supabase.from('competitors').select('*');
      const orderBy = options.orderBy || 'threat_level';
      query = query.order(orderBy, { ascending: false });

      const { data, error } = await query;
      if (error) throw error;

      return { data: data || [], error: null };
    } catch (error) {
      console.error('[MissionPulse] Error fetching competitors:', error);
      return { data: null, error };
    }
  }

  async function getComplianceRequirements(options = {}) {
    if (!supabase) {
      if (!initSupabase()) {
        return { data: null, error: new Error('Supabase not initialized') };
      }
    }

    try {
      let query = supabase.from('compliance_requirements').select('*');
      const orderBy = options.orderBy || 'risk_level';
      query = query.order(orderBy, { ascending: false });

      const { data, error } = await query;
      if (error) throw error;

      return { data: data || [], error: null };
    } catch (error) {
      console.error('[MissionPulse] Error fetching compliance requirements:', error);
      return { data: null, error };
    }
  }

  async function getTeamMembers(options = {}) {
    if (!supabase) {
      if (!initSupabase()) {
        return { data: null, error: new Error('Supabase not initialized') };
      }
    }

    try {
      let query = supabase.from('team_members').select('*');
      const orderBy = options.orderBy || 'name';
      query = query.order(orderBy, { ascending: true });

      const { data, error } = await query;
      if (error) throw error;

      return { data: data || [], error: null };
    } catch (error) {
      console.error('[MissionPulse] Error fetching team members:', error);
      return { data: null, error };
    }
  }

  async function getPipelineStats() {
    if (!supabase) {
      if (!initSupabase()) {
        return { data: null, error: new Error('Supabase not initialized') };
      }
    }

    try {
      const { data, error } = await supabase
        .from('opportunities')
        .select('ceiling, win_probability, created_at, shipley_phase');

      if (error) throw error;

      const stats = {
        totalCount: data.length,
        totalValue: data.reduce((sum, opp) => sum + (opp.ceiling || 0), 0),
        avgPwin: data.length > 0 
          ? Math.round(data.reduce((sum, opp) => sum + (opp.win_probability || 0), 0) / data.length)
          : 0,
        byPhase: {}
      };

      data.forEach(opp => {
        const phase = opp.shipley_phase || 'gate_1';
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

  async function createOpportunity(opportunityData) {
    if (!supabase) {
      if (!initSupabase()) {
        return { data: null, error: new Error('Supabase not initialized') };
      }
    }

    try {
      const dbData = mapToDatabase(opportunityData);
      delete dbData.id;
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

  async function updateOpportunity(id, updates) {
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

  // Real-time subscriptions
  let opportunitySubscription = null;
  let opportunityCallbacks = [];

  function subscribeToOpportunities(callback) {
    if (!supabase) {
      if (!initSupabase()) {
        console.error('[MissionPulse] Cannot subscribe - Supabase not initialized');
        return () => {};
      }
    }

    opportunityCallbacks.push(callback);

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
        .subscribe();
    }

    return () => {
      const index = opportunityCallbacks.indexOf(callback);
      if (index > -1) {
        opportunityCallbacks.splice(index, 1);
      }
      if (opportunityCallbacks.length === 0 && opportunitySubscription) {
        opportunitySubscription.unsubscribe();
        opportunitySubscription = null;
      }
    };
  }

  function onConnectionChange(callback) {
    connectionListeners.push(callback);
    callback(connectionStatus);
    return () => {
      const index = connectionListeners.indexOf(callback);
      if (index > -1) {
        connectionListeners.splice(index, 1);
      }
    };
  }

  function getConnectionStatus() {
    return connectionStatus;
  }

  // Utilities
  function formatCurrency(value) {
    if (!value) return '$0';
    if (value >= 1000000000) return `$${(value / 1000000000).toFixed(1)}B`;
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toLocaleString()}`;
  }

  function getPhaseInfo(phaseKey) {
    return SHIPLEY_PHASES[phaseKey] || SHIPLEY_PHASES.gate_1;
  }

  function getShipleyPhases() {
    return Object.entries(SHIPLEY_PHASES)
      .map(([key, value]) => ({ key, ...value }))
      .sort((a, b) => a.order - b.order);
  }

  // ============================================================
  // EXPORT MissionPulse NAMESPACE
  // ============================================================
  global.MissionPulse = {
    // Authentication
    signIn,
    signUp,
    signOut,
    getSession,
    getUser,
    resetPassword,
    updatePassword,
    onAuthStateChange,
    requireAuth,

    // CRUD Operations
    getOpportunities,
    getCompetitors,
    getComplianceRequirements,
    getTeamMembers,
    getPipelineStats,
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

    // Constants
    SHIPLEY_PHASES,
    SUPABASE_URL,

    // Initialization
    init: initSupabase
  };

  // Auto-initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(initSupabase, 100);
    });
  } else {
    setTimeout(initSupabase, 100);
  }

})(typeof window !== 'undefined' ? window : global);
