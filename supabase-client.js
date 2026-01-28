/**
 * MissionPulse Supabase Client Module
 * Updated Sprint 39: Fixed Supabase credentials
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
 * © 2025 Mission Meets Tech
 */

(function(global) {
  'use strict';

  // ============================================================
  // SUPABASE CONFIGURATION - CORRECTED CREDENTIALS
  // ============================================================
  const SUPABASE_URL = 'https://qdrtpnpnhkxvfmvfziop.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkcnRwbnBuaGt4dmZtdmZ6aW9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc0MTMwNjIsImV4cCI6MjA1Mjk4OTA2Mn0.gwBTnfAtsxSFDz96fDPL7HAIYdA5s_9hiv_l0ECWvYc';

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
    // Core opportunity fields
    id: 'id',
    title: 'title',
    nickname: 'nickname',
    description: 'description',
    agency: 'agency',
    sub_agency: 'subAgency',
    contract_type: 'contractType',
    naics: 'naics',
    set_aside: 'setAside',
    ceiling: 'ceiling',
    period_of_performance: 'periodOfPerformance',
    pwin: 'pwin',
    phase: 'phase',
    stage: 'stage',
    status: 'status',
    due_date: 'dueDate',
    rfp_date: 'rfpDate',
    submit_date: 'submitDate',
    award_date: 'awardDate',
    
    // Contacts
    contracting_officer: 'contractingOfficer',
    co_email: 'coEmail',
    co_phone: 'coPhone',
    program_manager: 'programManager',
    pm_email: 'pmEmail',
    capture_manager: 'captureManager',
    proposal_manager: 'proposalManager',
    
    // Strategy
    incumbent: 'incumbent',
    competition_type: 'competitionType',
    evaluation_criteria: 'evaluationCriteria',
    
    // URLs
    sam_url: 'samUrl',
    solicitation_url: 'solicitationUrl',
    
    // Metadata
    created_at: 'createdAt',
    updated_at: 'updatedAt',
    company_id: 'companyId'
  };

  // Convert DB record to frontend format
  function toFrontend(record) {
    if (!record) return null;
    const result = {};
    for (const [dbKey, frontendKey] of Object.entries(fieldMapping)) {
      if (record.hasOwnProperty(dbKey)) {
        result[frontendKey] = record[dbKey];
      }
    }
    // Keep any unmapped fields
    for (const key of Object.keys(record)) {
      if (!fieldMapping.hasOwnProperty(key)) {
        result[key] = record[key];
      }
    }
    return result;
  }

  // Convert frontend data to DB format
  function toDatabase(data) {
    if (!data) return null;
    const result = {};
    const reverseMapping = {};
    for (const [dbKey, frontendKey] of Object.entries(fieldMapping)) {
      reverseMapping[frontendKey] = dbKey;
    }
    for (const [key, value] of Object.entries(data)) {
      const dbKey = reverseMapping[key] || key;
      result[dbKey] = value;
    }
    return result;
  }

  // ============================================================
  // AUTHENTICATION FUNCTIONS
  // ============================================================
  async function signIn(email, password) {
    if (!supabase) {
      if (!initSupabase()) {
        return { data: null, error: { message: 'Supabase not initialized' } };
      }
    }
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('[MissionPulse] Sign in error:', error);
      return { data: null, error };
    }
  }

  async function signUp(email, password, metadata = {}) {
    if (!supabase) {
      if (!initSupabase()) {
        return { data: null, error: { message: 'Supabase not initialized' } };
      }
    }
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      });
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('[MissionPulse] Sign up error:', error);
      return { data: null, error };
    }
  }

  async function signOut() {
    if (!supabase) return { error: { message: 'Supabase not initialized' } };
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('[MissionPulse] Sign out error:', error);
      return { error };
    }
  }

  async function getSession() {
    if (!supabase) {
      if (!initSupabase()) {
        return { data: null, error: { message: 'Supabase not initialized' } };
      }
    }
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('[MissionPulse] Get session error:', error);
      return { data: null, error };
    }
  }

  async function getUser() {
    if (!supabase) {
      if (!initSupabase()) {
        return { data: null, error: { message: 'Supabase not initialized' } };
      }
    }
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      return { data: user, error: null };
    } catch (error) {
      console.error('[MissionPulse] Get user error:', error);
      return { data: null, error };
    }
  }

  function onAuthStateChange(callback) {
    if (!supabase) {
      if (!initSupabase()) {
        console.warn('[MissionPulse] Cannot set auth listener - Supabase not initialized');
        return { data: { subscription: { unsubscribe: () => {} } } };
      }
    }
    return supabase.auth.onAuthStateChange(callback);
  }

  // ============================================================
  // OPPORTUNITIES CRUD
  // ============================================================
  async function getOpportunities() {
    if (!supabase) {
      if (!initSupabase()) {
        return { data: [], error: { message: 'Supabase not initialized' } };
      }
    }
    try {
      const { data, error } = await supabase
        .from('opportunities')
        .select('*')
        .order('ceiling', { ascending: false });
      
      if (error) throw error;
      return { data: (data || []).map(toFrontend), error: null };
    } catch (error) {
      console.error('[MissionPulse] Get opportunities error:', error);
      return { data: [], error };
    }
  }

  async function getOpportunity(id) {
    if (!supabase) {
      if (!initSupabase()) {
        return { data: null, error: { message: 'Supabase not initialized' } };
      }
    }
    try {
      const { data, error } = await supabase
        .from('opportunities')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return { data: toFrontend(data), error: null };
    } catch (error) {
      console.error('[MissionPulse] Get opportunity error:', error);
      return { data: null, error };
    }
  }

  async function createOpportunity(opportunityData) {
    if (!supabase) {
      if (!initSupabase()) {
        return { data: null, error: { message: 'Supabase not initialized' } };
      }
    }
    try {
      const dbData = toDatabase(opportunityData);
      const { data, error } = await supabase
        .from('opportunities')
        .insert([dbData])
        .select()
        .single();
      
      if (error) throw error;
      return { data: toFrontend(data), error: null };
    } catch (error) {
      console.error('[MissionPulse] Create opportunity error:', error);
      return { data: null, error };
    }
  }

  async function updateOpportunity(id, updates) {
    if (!supabase) {
      if (!initSupabase()) {
        return { data: null, error: { message: 'Supabase not initialized' } };
      }
    }
    try {
      const dbData = toDatabase(updates);
      dbData.updated_at = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('opportunities')
        .update(dbData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return { data: toFrontend(data), error: null };
    } catch (error) {
      console.error('[MissionPulse] Update opportunity error:', error);
      return { data: null, error };
    }
  }

  async function deleteOpportunity(id) {
    if (!supabase) {
      if (!initSupabase()) {
        return { error: { message: 'Supabase not initialized' } };
      }
    }
    try {
      const { error } = await supabase
        .from('opportunities')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('[MissionPulse] Delete opportunity error:', error);
      return { error };
    }
  }

  // ============================================================
  // AGGREGATION & STATS
  // ============================================================
  async function getPipelineStats() {
    if (!supabase) {
      if (!initSupabase()) {
        return { data: null, error: { message: 'Supabase not initialized' } };
      }
    }
    try {
      const { data: opportunities, error } = await supabase
        .from('opportunities')
        .select('ceiling, pwin, phase, stage, status');
      
      if (error) throw error;
      
      const stats = {
        totalPipeline: 0,
        weightedPipeline: 0,
        opportunityCount: opportunities?.length || 0,
        byPhase: {},
        byStage: {},
        avgPwin: 0
      };
      
      let pwinSum = 0;
      let pwinCount = 0;
      
      (opportunities || []).forEach(opp => {
        const ceiling = opp.ceiling || 0;
        const pwin = opp.pwin || 0;
        
        stats.totalPipeline += ceiling;
        stats.weightedPipeline += ceiling * (pwin / 100);
        
        if (pwin > 0) {
          pwinSum += pwin;
          pwinCount++;
        }
        
        // Group by phase
        const phase = opp.phase || 'Unknown';
        if (!stats.byPhase[phase]) {
          stats.byPhase[phase] = { count: 0, value: 0 };
        }
        stats.byPhase[phase].count++;
        stats.byPhase[phase].value += ceiling;
        
        // Group by stage
        const stage = opp.stage || 'Unknown';
        if (!stats.byStage[stage]) {
          stats.byStage[stage] = { count: 0, value: 0 };
        }
        stats.byStage[stage].count++;
        stats.byStage[stage].value += ceiling;
      });
      
      stats.avgPwin = pwinCount > 0 ? Math.round(pwinSum / pwinCount) : 0;
      
      return { data: stats, error: null };
    } catch (error) {
      console.error('[MissionPulse] Get pipeline stats error:', error);
      return { data: null, error };
    }
  }

  async function getOpportunitiesByPhase() {
    if (!supabase) {
      if (!initSupabase()) {
        return { data: {}, error: { message: 'Supabase not initialized' } };
      }
    }
    try {
      const { data, error } = await supabase
        .from('opportunities')
        .select('*')
        .order('ceiling', { ascending: false });
      
      if (error) throw error;
      
      const grouped = {};
      (data || []).forEach(opp => {
        const phase = opp.phase || 'Unassigned';
        if (!grouped[phase]) {
          grouped[phase] = [];
        }
        grouped[phase].push(toFrontend(opp));
      });
      
      return { data: grouped, error: null };
    } catch (error) {
      console.error('[MissionPulse] Get opportunities by phase error:', error);
      return { data: {}, error };
    }
  }

  // ============================================================
  // REAL-TIME SUBSCRIPTIONS
  // ============================================================
  function subscribeToOpportunities(callback) {
    if (!supabase) {
      if (!initSupabase()) {
        console.warn('[MissionPulse] Cannot subscribe - Supabase not initialized');
        return { unsubscribe: () => {} };
      }
    }
    
    const channel = supabase
      .channel('opportunities-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'opportunities' },
        (payload) => {
          const event = {
            type: payload.eventType,
            data: payload.new ? toFrontend(payload.new) : null,
            oldData: payload.old ? toFrontend(payload.old) : null
          };
          callback(event);
        }
      )
      .subscribe();
    
    return {
      unsubscribe: () => {
        supabase.removeChannel(channel);
      }
    };
  }

  // ============================================================
  // PROFILES
  // ============================================================
  async function getProfile(userId) {
    if (!supabase) {
      if (!initSupabase()) {
        return { data: null, error: { message: 'Supabase not initialized' } };
      }
    }
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('[MissionPulse] Get profile error:', error);
      return { data: null, error };
    }
  }

  async function updateProfile(userId, updates) {
    if (!supabase) {
      if (!initSupabase()) {
        return { data: null, error: { message: 'Supabase not initialized' } };
      }
    }
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('[MissionPulse] Update profile error:', error);
      return { data: null, error };
    }
  }

  // ============================================================
  // GENERIC TABLE OPERATIONS
  // ============================================================
  async function query(table, options = {}) {
    if (!supabase) {
      if (!initSupabase()) {
        return { data: [], error: { message: 'Supabase not initialized' } };
      }
    }
    try {
      let q = supabase.from(table).select(options.select || '*');
      
      if (options.eq) {
        for (const [key, value] of Object.entries(options.eq)) {
          q = q.eq(key, value);
        }
      }
      if (options.order) {
        q = q.order(options.order.column, { ascending: options.order.ascending ?? true });
      }
      if (options.limit) {
        q = q.limit(options.limit);
      }
      
      const { data, error } = await q;
      if (error) throw error;
      return { data: data || [], error: null };
    } catch (error) {
      console.error(`[MissionPulse] Query ${table} error:`, error);
      return { data: [], error };
    }
  }

  async function insert(table, data) {
    if (!supabase) {
      if (!initSupabase()) {
        return { data: null, error: { message: 'Supabase not initialized' } };
      }
    }
    try {
      const { data: result, error } = await supabase
        .from(table)
        .insert(Array.isArray(data) ? data : [data])
        .select();
      
      if (error) throw error;
      return { data: result, error: null };
    } catch (error) {
      console.error(`[MissionPulse] Insert ${table} error:`, error);
      return { data: null, error };
    }
  }

  async function update(table, id, updates) {
    if (!supabase) {
      if (!initSupabase()) {
        return { data: null, error: { message: 'Supabase not initialized' } };
      }
    }
    try {
      const { data, error } = await supabase
        .from(table)
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error(`[MissionPulse] Update ${table} error:`, error);
      return { data: null, error };
    }
  }

  async function remove(table, id) {
    if (!supabase) {
      if (!initSupabase()) {
        return { error: { message: 'Supabase not initialized' } };
      }
    }
    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error(`[MissionPulse] Delete ${table} error:`, error);
      return { error };
    }
  }

  // ============================================================
  // CONNECTION STATUS
  // ============================================================
  function getConnectionStatus() {
    return connectionStatus;
  }

  function onConnectionChange(callback) {
    connectionListeners.push(callback);
    // Return unsubscribe function
    return () => {
      connectionListeners = connectionListeners.filter(cb => cb !== callback);
    };
  }

  async function testConnection() {
    if (!supabase) {
      if (!initSupabase()) {
        return { connected: false, error: 'Supabase not initialized' };
      }
    }
    try {
      const { data, error } = await supabase
        .from('opportunities')
        .select('id')
        .limit(1);
      
      if (error) throw error;
      connectionStatus = 'connected';
      notifyConnectionListeners();
      return { connected: true, error: null };
    } catch (error) {
      connectionStatus = 'error';
      notifyConnectionListeners();
      return { connected: false, error: error.message };
    }
  }

  // ============================================================
  // RAW SUPABASE ACCESS
  // ============================================================
  function getClient() {
    if (!supabase) {
      initSupabase();
    }
    return supabase;
  }

  function getConfig() {
    return { url: SUPABASE_URL, anonKey: SUPABASE_ANON_KEY };
  }

  // ============================================================
  // EXPORT TO GLOBAL NAMESPACE
  // ============================================================
  global.MissionPulse = {
    // Auth
    signIn,
    signUp,
    signOut,
    getSession,
    getUser,
    onAuthStateChange,
    
    // Opportunities
    getOpportunities,
    getOpportunity,
    createOpportunity,
    updateOpportunity,
    deleteOpportunity,
    getPipelineStats,
    getOpportunitiesByPhase,
    subscribeToOpportunities,
    
    // Profiles
    getProfile,
    updateProfile,
    
    // Generic
    query,
    insert,
    update,
    remove,
    
    // Connection
    getConnectionStatus,
    onConnectionChange,
    testConnection,
    
    // Raw access
    getClient,
    getConfig,
    
    // Utils
    toFrontend,
    toDatabase
  };

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSupabase);
  } else {
    initSupabase();
  }

})(typeof window !== 'undefined' ? window : global);
