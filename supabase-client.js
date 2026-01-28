/**
 * MissionPulse Supabase Client Module
 * Sprint 14: Auth Unification + CRUD operations + Real-time subscriptions
 * 
 * AUTH METHODS:
 * - signIn(email, password) - Authenticate user
 * - signOut() - Sign out current user
 * - getSession() - Get current session
 * - getCurrentUser() - Get user with profile/role
 * - onAuthStateChange(callback) - Listen for auth changes
 * - requireAuth() - Redirect to login if not authenticated
 * 
 * CRUD METHODS:
 * - getOpportunities() - Fetch all opportunities
 * - getPipelineStats() - Aggregate statistics
 * - subscribeToOpportunities(callback) - Real-time updates
 * - createOpportunity(data) - Create new opportunity
 * - updateOpportunity(id, data) - Update existing opportunity
 * - deleteOpportunity(id) - Delete opportunity
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
  
  // Demo mode flag - set to false for production
  const DEMO_MODE = false;

  // Initialize Supabase client
  let supabase = null;
  let connectionStatus = 'disconnected';
  let connectionListeners = [];
  let currentUser = null;
  let currentProfile = null;

  function initSupabase() {
    if (typeof global.supabase !== 'undefined' && global.supabase.createClient) {
      supabase = global.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      connectionStatus = 'connected';
      notifyConnectionListeners();
      console.log('[MissionPulse] Supabase client initialized');
      
      // Set up auth state listener
      supabase.auth.onAuthStateChange((event, session) => {
        console.log('[MissionPulse] Auth state changed:', event);
        if (session?.user) {
          currentUser = session.user;
          fetchUserProfile(session.user.id);
        } else {
          currentUser = null;
          currentProfile = null;
        }
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
  // AUTHENTICATION METHODS
  // ============================================================

  /**
   * Sign in with email and password
   * @param {string} email 
   * @param {string} password 
   * @returns {Promise<{data, error}>}
   */
  async function signIn(email, password) {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not initialized' } };
    }
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      currentUser = data.user;
      await fetchUserProfile(data.user.id);
      
      // Store session indicator
      localStorage.setItem('missionpulse_authenticated', 'true');
      
      console.log('[MissionPulse] Sign in successful:', data.user.email);
      return { data: { user: currentUser, profile: currentProfile }, error: null };
      
    } catch (error) {
      console.error('[MissionPulse] Sign in error:', error);
      return { data: null, error };
    }
  }

  /**
   * Sign out current user
   * @returns {Promise<{error}>}
   */
  async function signOut() {
    if (!supabase) {
      return { error: { message: 'Supabase not initialized' } };
    }
    
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      currentUser = null;
      currentProfile = null;
      localStorage.removeItem('missionpulse_authenticated');
      localStorage.removeItem('missionpulse_user');
      
      console.log('[MissionPulse] Sign out successful');
      return { error: null };
      
    } catch (error) {
      console.error('[MissionPulse] Sign out error:', error);
      return { error };
    }
  }

  /**
   * Get current session
   * @returns {Promise<{data, error}>}
   */
  async function getSession() {
    if (!supabase) {
      return { data: { session: null }, error: null };
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
   * Get current user with profile
   * @returns {Promise<{user, profile, error}>}
   */
  async function getCurrentUser() {
    if (!supabase) {
      return { user: null, profile: null, error: { message: 'Supabase not initialized' } };
    }
    
    // Return cached if available
    if (currentUser && currentProfile) {
      return { user: currentUser, profile: currentProfile, error: null };
    }
    
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) throw error;
      if (!user) return { user: null, profile: null, error: null };
      
      currentUser = user;
      await fetchUserProfile(user.id);
      
      return { user: currentUser, profile: currentProfile, error: null };
      
    } catch (error) {
      console.error('[MissionPulse] Get current user error:', error);
      return { user: null, profile: null, error };
    }
  }

  /**
   * Fetch user profile from profiles table
   * @param {string} userId 
   */
  async function fetchUserProfile(userId) {
    if (!supabase || !userId) return null;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.warn('[MissionPulse] Profile fetch error:', error);
        // Create default profile object
        currentProfile = {
          id: userId,
          email: currentUser?.email,
          role: 'Partner',
          full_name: currentUser?.email?.split('@')[0]
        };
      } else {
        currentProfile = data;
      }
      
      // Cache in localStorage for quick access
      localStorage.setItem('missionpulse_user', JSON.stringify({
        id: userId,
        email: currentUser?.email,
        role: currentProfile?.role || 'Partner',
        fullName: currentProfile?.full_name
      }));
      
      console.log('[MissionPulse] Profile loaded:', currentProfile?.role);
      return currentProfile;
      
    } catch (error) {
      console.error('[MissionPulse] Profile fetch error:', error);
      return null;
    }
  }

  /**
   * Listen for auth state changes
   * @param {Function} callback - Called with (event, session)
   * @returns {Object} Subscription object with unsubscribe method
   */
  function onAuthStateChange(callback) {
    if (!supabase) {
      console.warn('[MissionPulse] Supabase not initialized');
      return { data: { subscription: { unsubscribe: () => {} } } };
    }
    
    return supabase.auth.onAuthStateChange(callback);
  }

  /**
   * Check if user is authenticated, redirect to login if not
   * @param {string} redirectUrl - URL to redirect to if not authenticated
   * @returns {Promise<boolean>}
   */
  async function requireAuth(redirectUrl = 'login.html') {
    // Demo mode bypass
    if (DEMO_MODE) {
      console.log('[MissionPulse] Demo mode - auth bypassed');
      currentProfile = {
        id: 'demo-user',
        email: 'demo@missionpulse.io',
        role: 'CEO',
        full_name: 'Demo User'
      };
      return true;
    }
    
    const { data } = await getSession();
    
    if (!data?.session) {
      console.log('[MissionPulse] No session, redirecting to login');
      window.location.href = redirectUrl;
      return false;
    }
    
    // Ensure profile is loaded
    if (!currentProfile) {
      await fetchUserProfile(data.session.user.id);
    }
    
    return true;
  }

  /**
   * Check if current user has required role
   * @param {string|string[]} requiredRoles - Role(s) required
   * @returns {boolean}
   */
  function hasRole(requiredRoles) {
    if (!currentProfile?.role) return false;
    
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    return roles.includes(currentProfile.role);
  }

  /**
   * Get current user's role
   * @returns {string|null}
   */
  function getUserRole() {
    return currentProfile?.role || null;
  }

  /**
   * Check if user can access a module based on role
   * @param {string} moduleName 
   * @returns {boolean}
   */
  function canAccessModule(moduleName) {
    const role = currentProfile?.role;
    if (!role) return false;
    
    // CEO and Admin have full access
    if (['CEO', 'COO', 'Admin'].includes(role)) return true;
    
    // Module access matrix
    const moduleAccess = {
      'pipeline': ['CAP', 'PM', 'SA', 'FIN', 'CON', 'DEL', 'QA'],
      'warroom': ['CAP', 'PM', 'SA', 'QA'],
      'strategy': ['CAP', 'SA'],
      'blackhat': ['CAP', 'SA'],
      'contracts': ['CON', 'PM'],
      'compliance': ['CON', 'SA', 'PM'],
      'pricing': ['FIN', 'PM'],
      'hitl': ['QA', 'CAP'],
      'orals': ['CAP', 'SA', 'PM'],
      'partners': ['DEL', 'PM'],
      'admin': [] // CEO/COO/Admin only
    };
    
    const allowedRoles = moduleAccess[moduleName];
    if (!allowedRoles) return true; // Unknown module = allow
    
    return allowedRoles.includes(role);
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
      primary_contact: 'primaryContact'
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
      primaryContact: 'primary_contact'
    }
  };

  function mapToFrontend(record) {
    if (!record) return null;
    const mapped = {};
    Object.keys(record).forEach(key => {
      const frontendKey = fieldMapping.toFrontend[key] || key;
      mapped[frontendKey] = record[key];
    });
    
    if (mapped.dueDate) {
      const dueDate = new Date(mapped.dueDate);
      const today = new Date();
      const diffTime = dueDate - today;
      mapped.daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    
    mapped.phase = mapShipleyPhaseToDisplay(mapped.shipleyPhase);
    mapped.ceiling = mapped.contractValue;
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

  async function getOpportunities() {
    if (!supabase) {
      console.warn('[MissionPulse] Supabase not initialized, using demo data');
      return { data: getDemoData(), error: null };
    }

    try {
      const { data, error } = await supabase
        .from('opportunities')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mapped = (data || []).map(mapToFrontend);
      return { data: mapped, error: null };
      
    } catch (error) {
      console.error('[MissionPulse] Get opportunities error:', error);
      if (DEMO_MODE) {
        return { data: getDemoData(), error: null };
      }
      return { data: [], error };
    }
  }

  async function getPipelineStats() {
    const { data: opportunities, error } = await getOpportunities();
    
    if (error) {
      return { data: null, error };
    }

    const stats = {
      totalOpportunities: opportunities.length,
      totalPipelineValue: opportunities.reduce((sum, opp) => sum + (opp.contractValue || 0), 0),
      avgWinProbability: opportunities.length > 0 
        ? Math.round(opportunities.reduce((sum, opp) => sum + (opp.winProbability || 0), 0) / opportunities.length)
        : 0,
      byPhase: {},
      byPriority: { critical: 0, high: 0, medium: 0, low: 0 }
    };

    opportunities.forEach(opp => {
      const phase = opp.shipleyPhase || 'gate_1';
      if (!stats.byPhase[phase]) {
        stats.byPhase[phase] = { count: 0, value: 0 };
      }
      stats.byPhase[phase].count++;
      stats.byPhase[phase].value += opp.contractValue || 0;

      const priority = (opp.priority || 'medium').toLowerCase();
      if (stats.byPriority[priority] !== undefined) {
        stats.byPriority[priority]++;
      }
    });

    return { data: stats, error: null };
  }

  async function getOpportunitiesByPhase() {
    const { data: opportunities, error } = await getOpportunities();
    
    if (error) {
      return { data: null, error };
    }

    const byPhase = {};
    Object.keys(SHIPLEY_PHASES).forEach(phase => {
      byPhase[phase] = [];
    });

    opportunities.forEach(opp => {
      const phase = opp.shipleyPhase || 'gate_1';
      if (byPhase[phase]) {
        byPhase[phase].push(opp);
      } else {
        byPhase['gate_1'].push(opp);
      }
    });

    return { data: byPhase, error: null };
  }

  async function createOpportunity(data) {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not initialized' } };
    }

    try {
      const dbData = mapToDatabase(data);
      const { data: created, error } = await supabase
        .from('opportunities')
        .insert([dbData])
        .select()
        .single();

      if (error) throw error;

      return { data: mapToFrontend(created), error: null };
    } catch (error) {
      console.error('[MissionPulse] Create opportunity error:', error);
      return { data: null, error };
    }
  }

  async function updateOpportunity(id, data) {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not initialized' } };
    }

    try {
      const dbData = mapToDatabase(data);
      const { data: updated, error } = await supabase
        .from('opportunities')
        .update(dbData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return { data: mapToFrontend(updated), error: null };
    } catch (error) {
      console.error('[MissionPulse] Update opportunity error:', error);
      return { data: null, error };
    }
  }

  async function deleteOpportunity(id) {
    if (!supabase) {
      return { error: { message: 'Supabase not initialized' } };
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
  // REAL-TIME SUBSCRIPTIONS
  // ============================================================

  function subscribeToOpportunities(callback) {
    if (!supabase) {
      console.warn('[MissionPulse] Supabase not initialized');
      return { unsubscribe: () => {} };
    }

    const channel = supabase
      .channel('opportunities_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'opportunities' },
        (payload) => {
          console.log('[MissionPulse] Real-time update:', payload.eventType);
          const mapped = payload.new ? mapToFrontend(payload.new) : null;
          callback({
            eventType: payload.eventType,
            old: payload.old,
            new: mapped
          });
        }
      )
      .subscribe();

    return {
      unsubscribe: () => {
        supabase.removeChannel(channel);
      }
    };
  }

  function onConnectionChange(callback) {
    connectionListeners.push(callback);
    callback(connectionStatus);
    return () => {
      connectionListeners = connectionListeners.filter(cb => cb !== callback);
    };
  }

  function getConnectionStatus() {
    return connectionStatus;
  }

  // ============================================================
  // UTILITIES
  // ============================================================

  function formatCurrency(value) {
    if (!value) return '$0';
    if (value >= 1000000000) {
      return '$' + (value / 1000000000).toFixed(1) + 'B';
    }
    if (value >= 1000000) {
      return '$' + (value / 1000000).toFixed(1) + 'M';
    }
    if (value >= 1000) {
      return '$' + (value / 1000).toFixed(0) + 'K';
    }
    return '$' + value.toLocaleString();
  }

  function getPhaseInfo(phase) {
    return SHIPLEY_PHASES[phase] || SHIPLEY_PHASES['gate_1'];
  }

  function getShipleyPhases() {
    return Object.entries(SHIPLEY_PHASES)
      .map(([key, value]) => ({ key, ...value }))
      .sort((a, b) => a.order - b.order);
  }

  // Demo data fallback
  function getDemoData() {
    return [
      { id: '1', name: 'DHA EHR Modernization', agency: 'DHA', contractValue: 125000000, priority: 'Critical', shipleyPhase: 'red_team', winProbability: 72, dueDate: '2026-02-15' },
      { id: '2', name: 'VA Claims Processing AI', agency: 'VA', contractValue: 85000000, priority: 'High', shipleyPhase: 'pink_team', winProbability: 65, dueDate: '2026-03-01' },
      { id: '3', name: 'CMS Data Analytics Platform', agency: 'CMS', contractValue: 45000000, priority: 'Medium', shipleyPhase: 'blue_team', winProbability: 58, dueDate: '2026-04-10' }
    ].map(mapToFrontend);
  }

  // ============================================================
  // EXPORT MissionPulse NAMESPACE
  // ============================================================
  global.MissionPulse = {
    // Authentication
    signIn,
    signOut,
    getSession,
    getCurrentUser,
    onAuthStateChange,
    requireAuth,
    hasRole,
    getUserRole,
    canAccessModule,
    
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

    // Constants
    SHIPLEY_PHASES,
    DEMO_MODE,

    // Direct Supabase access (for advanced usage)
    get supabase() { return supabase; },
    get currentUser() { return currentUser; },
    get currentProfile() { return currentProfile; },

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
