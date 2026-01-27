/**
 * MissionPulse Supabase Client Module
 * Sprint 8: Authentication + CRUD + Real-time + All Tables
 * 
 * Provides MissionPulse namespace with:
 * 
 * AUTH OPERATIONS:
 * - signIn(email, password) - Login with credentials
 * - signUp(email, password, metadata) - Register new user
 * - signOut() - Logout current user
 * - getUser() - Get current authenticated user
 * - getSession() - Get current session
 * - onAuthStateChange(callback) - Listen to auth changes
 * - resetPassword(email) - Send password reset email
 * - updatePassword(newPassword) - Update user password
 * 
 * OPPORTUNITIES:
 * - getOpportunities() - Fetch all opportunities
 * - getPipelineStats() - Aggregate statistics
 * - subscribeToOpportunities(callback) - Real-time updates
 * - createOpportunity(data) - Create new opportunity
 * - updateOpportunity(id, data) - Update existing opportunity
 * - deleteOpportunity(id) - Delete opportunity
 * - getOpportunitiesByPhase() - Grouped by Shipley phase
 * 
 * COMPLIANCE (M4):
 * - getComplianceRequirements(opportunityId?) - Fetch requirements
 * - createComplianceRequirement(data) - Create new requirement
 * - updateComplianceRequirement(id, data) - Update requirement
 * 
 * COMPETITORS (M7 Black Hat):
 * - getCompetitors(opportunityId?) - Fetch competitor intel
 * - createCompetitor(data) - Create competitor record
 * - updateCompetitor(id, data) - Update competitor
 * 
 * PARTNERS (M11 Frenemy):
 * - getPartners(companyId?) - Fetch partners
 * - createPartner(data) - Create partner
 * - updatePartner(id, data) - Update partner
 * 
 * © 2026 Mission Meets Tech
 */

(function(global) {
  'use strict';

  // ============================================================
  // SUPABASE CONFIGURATION
  // ============================================================
  const SUPABASE_URL = 'https://djuviwarqdvlbgcfuupa.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqdXZpd2FycWR2bGJnY2Z1dXBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NDQ0NjUsImV4cCI6MjA4NTAyMDQ2NX0.3s8ufDDN2aWfkW0RBsAyJyacb2tjB7M550WSFIohHcA';

  // Initialize Supabase client
  let supabase = null;
  let connectionStatus = 'disconnected';
  let connectionListeners = [];
  let authListeners = [];
  let currentUser = null;
  let currentSession = null;

  function initSupabase() {
    if (typeof global.supabase !== 'undefined' && global.supabase.createClient) {
      supabase = global.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          storage: window.localStorage
        }
      });
      connectionStatus = 'connected';
      notifyConnectionListeners();
      console.log('[MissionPulse] Supabase client initialized');
      
      // Set up auth state listener
      setupAuthListener();
      
      return true;
    }
    console.warn('[MissionPulse] Supabase library not loaded');
    return false;
  }

  function setupAuthListener() {
    if (!supabase) return;
    
    supabase.auth.onAuthStateChange((event, session) => {
      console.log('[MissionPulse] Auth state changed:', event);
      currentSession = session;
      currentUser = session?.user || null;
      
      // Notify all auth listeners
      authListeners.forEach(cb => {
        try {
          cb({ event, session, user: currentUser });
        } catch (e) {
          console.error('[MissionPulse] Auth listener error:', e);
        }
      });
    });
    
    // Check initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('[MissionPulse] Error getting initial session:', error);
        return;
      }
      currentSession = session;
      currentUser = session?.user || null;
      console.log('[MissionPulse] Initial auth state:', currentUser ? 'Logged in' : 'Not logged in');
    });
  }

  function notifyConnectionListeners() {
    connectionListeners.forEach(cb => cb(connectionStatus));
  }

  // ============================================================
  // AUTHENTICATION OPERATIONS
  // ============================================================

  /**
   * Sign in with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<{data: {user, session}, error: Error|null}>}
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

      currentUser = data.user;
      currentSession = data.session;
      
      console.log('[MissionPulse] Sign in successful:', data.user.email);
      return { data, error: null };
    } catch (error) {
      console.error('[MissionPulse] Sign in error:', error.message);
      return { data: null, error };
    }
  }

  /**
   * Sign up with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {Object} metadata - Additional user metadata (name, role, etc.)
   * @returns {Promise<{data: {user, session}, error: Error|null}>}
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
          data: metadata
        }
      });

      if (error) throw error;

      console.log('[MissionPulse] Sign up successful:', data.user?.email);
      return { data, error: null };
    } catch (error) {
      console.error('[MissionPulse] Sign up error:', error.message);
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

      currentUser = null;
      currentSession = null;
      
      console.log('[MissionPulse] Sign out successful');
      return { error: null };
    } catch (error) {
      console.error('[MissionPulse] Sign out error:', error.message);
      return { error };
    }
  }

  /**
   * Get current authenticated user
   * @returns {Promise<{data: {user}, error: Error|null}>}
   */
  async function getUser() {
    if (!supabase) {
      if (!initSupabase()) {
        return { data: { user: null }, error: new Error('Supabase not initialized') };
      }
    }

    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) throw error;

      currentUser = user;
      return { data: { user }, error: null };
    } catch (error) {
      console.error('[MissionPulse] Get user error:', error.message);
      return { data: { user: null }, error };
    }
  }

  /**
   * Get current session
   * @returns {Promise<{data: {session}, error: Error|null}>}
   */
  async function getSession() {
    if (!supabase) {
      if (!initSupabase()) {
        return { data: { session: null }, error: new Error('Supabase not initialized') };
      }
    }

    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) throw error;

      currentSession = session;
      currentUser = session?.user || null;
      return { data: { session }, error: null };
    } catch (error) {
      console.error('[MissionPulse] Get session error:', error.message);
      return { data: { session: null }, error };
    }
  }

  /**
   * Subscribe to auth state changes
   * @param {Function} callback - Called with { event, session, user }
   * @returns {Function} Unsubscribe function
   */
  function onAuthStateChange(callback) {
    authListeners.push(callback);
    
    // Immediately call with current state if available
    if (currentUser || currentSession) {
      callback({ event: 'INITIAL', session: currentSession, user: currentUser });
    }
    
    return () => {
      const index = authListeners.indexOf(callback);
      if (index > -1) {
        authListeners.splice(index, 1);
      }
    };
  }

  /**
   * Send password reset email
   * @param {string} email - User email
   * @returns {Promise<{data, error: Error|null}>}
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

      console.log('[MissionPulse] Password reset email sent');
      return { data, error: null };
    } catch (error) {
      console.error('[MissionPulse] Password reset error:', error.message);
      return { data: null, error };
    }
  }

  /**
   * Update user password (requires user to be logged in)
   * @param {string} newPassword - New password
   * @returns {Promise<{data, error: Error|null}>}
   */
  async function updatePassword(newPassword) {
    if (!supabase) {
      if (!initSupabase()) {
        return { data: null, error: new Error('Supabase not initialized') };
      }
    }

    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      console.log('[MissionPulse] Password updated successfully');
      return { data, error: null };
    } catch (error) {
      console.error('[MissionPulse] Password update error:', error.message);
      return { data: null, error };
    }
  }

  /**
   * Check if user is authenticated
   * @returns {boolean}
   */
  function isAuthenticated() {
    return currentUser !== null && currentSession !== null;
  }

  /**
   * Get current user synchronously (may be null if not checked yet)
   * @returns {Object|null}
   */
  function getCurrentUser() {
    return currentUser;
  }

  /**
   * Require authentication - redirect to login if not authenticated
   * @param {string} loginUrl - URL to redirect to
   */
  async function requireAuth(loginUrl = '/login.html') {
    const { data: { session } } = await getSession();
    
    if (!session) {
      // Store intended destination
      sessionStorage.setItem('mp_redirect_after_login', window.location.href);
      window.location.href = loginUrl;
      return false;
    }
    
    return true;
  }

  /**
   * Handle post-login redirect
   * @param {string} defaultUrl - Default URL if no redirect stored
   */
  function handlePostLoginRedirect(defaultUrl = '/missionpulse-v12-task17-complete.html') {
    const redirectUrl = sessionStorage.getItem('mp_redirect_after_login');
    sessionStorage.removeItem('mp_redirect_after_login');
    window.location.href = redirectUrl || defaultUrl;
  }

  // ============================================================
  // FIELD MAPPING: snake_case (DB) <-> camelCase (Frontend)
  // ============================================================
  const fieldMapping = {
    // DB -> Frontend
    toFrontend: {
      id: 'id',
      name: 'name',
      title: 'name', // Map title to name for compatibility
      agency: 'agency',
      contract_value: 'contractValue',
      ceiling: 'contractValue', // Map ceiling to contractValue
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
      nickname: 'nickname'
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
    
    // Handle title -> name mapping (DB uses title, frontend expects name)
    if (record.title && !mapped.name) {
      mapped.name = record.title;
    }
    
    // Handle ceiling -> contractValue mapping
    if (record.ceiling && !mapped.contractValue) {
      mapped.contractValue = record.ceiling;
    }
    
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

      // Apply ordering - use created_at as default since due_date may not exist
      const orderBy = options.orderBy || 'created_at';
      const ascending = options.ascending !== undefined ? options.ascending : false;
      query = query.order(orderBy, { ascending });

      const { data, error } = await query;

      if (error) throw error;

      // Map all records to frontend format
      const mappedData = (data || []).map(mapToFrontend);
      
      console.log('[MissionPulse] Fetched opportunities:', mappedData.length);
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
        .select('ceiling, contract_value, win_probability, created_at, shipley_phase');

      if (error) throw error;

      // Calculate stats - handle both ceiling and contract_value
      const now = new Date();
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const stats = {
        totalCount: data.length,
        totalValue: data.reduce((sum, opp) => sum + (opp.ceiling || opp.contract_value || 0), 0),
        avgPwin: data.length > 0 
          ? Math.round(data.reduce((sum, opp) => sum + (opp.win_probability || 0), 0) / data.length)
          : 0,
        dueThisMonth: 0, // Simplified since due_date column doesn't exist
        byPhase: {}
      };

      // Group by phase
      data.forEach(opp => {
        const phase = opp.shipley_phase || 'gate_1';
        if (!stats.byPhase[phase]) {
          stats.byPhase[phase] = { count: 0, value: 0 };
        }
        stats.byPhase[phase].count++;
        stats.byPhase[phase].value += opp.ceiling || opp.contract_value || 0;
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
  // COMPLIANCE REQUIREMENTS (M4)
  // ============================================================

  /**
   * Fetch compliance requirements
   * @param {string} opportunityId - Optional filter by opportunity
   * @returns {Promise<{data: Array, error: Error|null}>}
   */
  async function getComplianceRequirements(opportunityId = null) {
    if (!supabase) {
      if (!initSupabase()) {
        return { data: null, error: new Error('Supabase not initialized') };
      }
    }

    try {
      let query = supabase
        .from('compliance_requirements')
        .select('*')
        .order('created_at', { ascending: false });

      if (opportunityId) {
        query = query.eq('opportunity_id', opportunityId);
      }

      const { data, error } = await query;
      if (error) throw error;

      console.log('[MissionPulse] Fetched compliance requirements:', data?.length || 0);
      return { data: data || [], error: null };
    } catch (error) {
      console.error('[MissionPulse] Error fetching compliance:', error);
      return { data: null, error };
    }
  }

  /**
   * Create compliance requirement
   * @param {Object} reqData - Requirement data
   * @returns {Promise<{data: Object, error: Error|null}>}
   */
  async function createComplianceRequirement(reqData) {
    if (!supabase) {
      if (!initSupabase()) {
        return { data: null, error: new Error('Supabase not initialized') };
      }
    }

    try {
      const { data, error } = await supabase
        .from('compliance_requirements')
        .insert([{ ...reqData, created_at: new Date().toISOString() }])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('[MissionPulse] Error creating compliance req:', error);
      return { data: null, error };
    }
  }

  /**
   * Update compliance requirement
   * @param {string} id - Requirement ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<{data: Object, error: Error|null}>}
   */
  async function updateComplianceRequirement(id, updates) {
    if (!supabase) {
      if (!initSupabase()) {
        return { data: null, error: new Error('Supabase not initialized') };
      }
    }

    try {
      const { data, error } = await supabase
        .from('compliance_requirements')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('[MissionPulse] Error updating compliance req:', error);
      return { data: null, error };
    }
  }

  // ============================================================
  // COMPETITORS (M7 Black Hat)
  // ============================================================

  /**
   * Fetch competitors
   * @param {string} opportunityId - Optional filter by opportunity
   * @returns {Promise<{data: Array, error: Error|null}>}
   */
  async function getCompetitors(opportunityId = null) {
    if (!supabase) {
      if (!initSupabase()) {
        return { data: null, error: new Error('Supabase not initialized') };
      }
    }

    try {
      let query = supabase
        .from('competitors')
        .select('*')
        .order('threat_level', { ascending: false });

      if (opportunityId) {
        query = query.eq('opportunity_id', opportunityId);
      }

      const { data, error } = await query;
      if (error) throw error;

      console.log('[MissionPulse] Fetched competitors:', data?.length || 0);
      return { data: data || [], error: null };
    } catch (error) {
      console.error('[MissionPulse] Error fetching competitors:', error);
      return { data: null, error };
    }
  }

  /**
   * Create competitor record
   * @param {Object} compData - Competitor data
   * @returns {Promise<{data: Object, error: Error|null}>}
   */
  async function createCompetitor(compData) {
    if (!supabase) {
      if (!initSupabase()) {
        return { data: null, error: new Error('Supabase not initialized') };
      }
    }

    try {
      const { data, error } = await supabase
        .from('competitors')
        .insert([{ ...compData, created_at: new Date().toISOString() }])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('[MissionPulse] Error creating competitor:', error);
      return { data: null, error };
    }
  }

  /**
   * Update competitor
   * @param {string} id - Competitor ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<{data: Object, error: Error|null}>}
   */
  async function updateCompetitor(id, updates) {
    if (!supabase) {
      if (!initSupabase()) {
        return { data: null, error: new Error('Supabase not initialized') };
      }
    }

    try {
      const { data, error } = await supabase
        .from('competitors')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('[MissionPulse] Error updating competitor:', error);
      return { data: null, error };
    }
  }

  // ============================================================
  // PARTNERS (M11 Frenemy)
  // ============================================================

  /**
   * Fetch partners
   * @param {string} companyId - Optional filter by company
   * @returns {Promise<{data: Array, error: Error|null}>}
   */
  async function getPartners(companyId = null) {
    if (!supabase) {
      if (!initSupabase()) {
        return { data: null, error: new Error('Supabase not initialized') };
      }
    }

    try {
      let query = supabase
        .from('partners')
        .select('*')
        .order('trust_score', { ascending: false });

      if (companyId) {
        query = query.eq('company_id', companyId);
      }

      const { data, error } = await query;
      if (error) throw error;

      console.log('[MissionPulse] Fetched partners:', data?.length || 0);
      return { data: data || [], error: null };
    } catch (error) {
      console.error('[MissionPulse] Error fetching partners:', error);
      return { data: null, error };
    }
  }

  /**
   * Create partner
   * @param {Object} partnerData - Partner data
   * @returns {Promise<{data: Object, error: Error|null}>}
   */
  async function createPartner(partnerData) {
    if (!supabase) {
      if (!initSupabase()) {
        return { data: null, error: new Error('Supabase not initialized') };
      }
    }

    try {
      const { data, error } = await supabase
        .from('partners')
        .insert([{ ...partnerData, created_at: new Date().toISOString() }])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('[MissionPulse] Error creating partner:', error);
      return { data: null, error };
    }
  }

  /**
   * Update partner
   * @param {string} id - Partner ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<{data: Object, error: Error|null}>}
   */
  async function updatePartner(id, updates) {
    if (!supabase) {
      if (!initSupabase()) {
        return { data: null, error: new Error('Supabase not initialized') };
      }
    }

    try {
      const { data, error } = await supabase
        .from('partners')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('[MissionPulse] Error updating partner:', error);
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
    // Authentication
    signIn,
    signUp,
    signOut,
    getUser,
    getSession,
    onAuthStateChange,
    resetPassword,
    updatePassword,
    isAuthenticated,
    getCurrentUser,
    requireAuth,
    handlePostLoginRedirect,

    // Opportunities
    getOpportunities,
    getPipelineStats,
    getOpportunitiesByPhase,
    createOpportunity,
    updateOpportunity,
    deleteOpportunity,

    // Compliance (M4)
    getComplianceRequirements,
    createComplianceRequirement,
    updateComplianceRequirement,

    // Competitors (M7 Black Hat)
    getCompetitors,
    createCompetitor,
    updateCompetitor,

    // Partners (M11 Frenemy)
    getPartners,
    createPartner,
    updatePartner,

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
