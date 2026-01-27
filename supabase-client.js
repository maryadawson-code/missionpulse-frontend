/**
 * MissionPulse Supabase Client Module v2.0
 * Complete Auth + CRUD + Real-time + RBAC
 * 
 * Provides MissionPulse namespace with:
 * 
 * AUTH:
 * - signIn(email, password) - Authenticate user
 * - signUp(email, password, metadata) - Register new user
 * - signOut() - End session
 * - getCurrentUser() - Get authenticated user with profile
 * - onAuthStateChange(callback) - Subscribe to auth events
 * - resetPassword(email) - Send password reset email
 * 
 * RBAC:
 * - hasPermission(permission) - Check user permission
 * - canAccessModule(moduleId) - Check module access
 * - getUserRole() - Get current user's role
 * 
 * CRUD:
 * - getOpportunities() - Fetch all opportunities
 * - getPipelineStats() - Aggregate statistics
 * - createOpportunity(data) - Create new opportunity
 * - updateOpportunity(id, data) - Update existing
 * - deleteOpportunity(id) - Delete opportunity
 * - getOpportunitiesByPhase() - Grouped by Shipley phase
 * 
 * REAL-TIME:
 * - subscribeToOpportunities(callback) - Real-time updates
 * - onConnectionChange(callback) - Connection status
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
  let currentUser = null;
  let currentUserProfile = null;

  function initSupabase() {
    if (typeof global.supabase !== 'undefined' && global.supabase.createClient) {
      supabase = global.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      connectionStatus = 'connected';
      notifyConnectionListeners();
      console.log('[MissionPulse] Supabase client initialized');
      
      // Check for existing session
      checkExistingSession();
      return true;
    }
    console.warn('[MissionPulse] Supabase library not loaded');
    return false;
  }

  function getClient() {
    if (!supabase) {
      initSupabase();
    }
    return supabase;
  }

  function notifyConnectionListeners() {
    connectionListeners.forEach(cb => cb(connectionStatus));
  }

  // ============================================================
  // AUTHENTICATION SYSTEM
  // ============================================================

  /**
   * Check for existing session on page load
   */
  async function checkExistingSession() {
    try {
      const { data: { session } } = await getClient().auth.getSession();
      if (session?.user) {
        currentUser = session.user;
        await loadUserProfile(session.user.email);
      }
    } catch (error) {
      console.warn('[MissionPulse] Session check failed:', error.message);
    }
  }

  /**
   * Load user profile from users table
   * @param {string} email - User email
   */
  async function loadUserProfile(email) {
    try {
      const { data, error } = await getClient()
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error) {
        console.warn('[MissionPulse] Profile load failed:', error.message);
        return null;
      }

      currentUserProfile = mapUserFromDB(data);
      return currentUserProfile;
    } catch (error) {
      console.error('[MissionPulse] Profile load error:', error);
      return null;
    }
  }

  /**
   * Sign in with email and password
   * @param {string} email 
   * @param {string} password 
   * @returns {Promise<{data: Object, error: Error|null}>}
   */
  async function signIn(email, password) {
    try {
      const { data, error } = await getClient().auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      currentUser = data.user;
      await loadUserProfile(email);

      // Update last login
      if (currentUserProfile?.id) {
        await getClient()
          .from('users')
          .update({ last_login: new Date().toISOString() })
          .eq('id', currentUserProfile.id);
      }

      return { 
        data: { 
          user: currentUser, 
          profile: currentUserProfile,
          session: data.session 
        }, 
        error: null 
      };
    } catch (error) {
      console.error('[MissionPulse] Sign in error:', error);
      return { data: null, error };
    }
  }

  /**
   * Sign up new user
   * @param {string} email 
   * @param {string} password 
   * @param {Object} metadata - { fullName, roleId }
   * @returns {Promise<{data: Object, error: Error|null}>}
   */
  async function signUp(email, password, metadata = {}) {
    try {
      const { data, error } = await getClient().auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: metadata.fullName || '',
            role_id: metadata.roleId || 'Partner'
          }
        }
      });

      if (error) throw error;

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
    try {
      const { error } = await getClient().auth.signOut();
      if (error) throw error;
      
      currentUser = null;
      currentUserProfile = null;
      
      return { error: null };
    } catch (error) {
      console.error('[MissionPulse] Sign out error:', error);
      return { error };
    }
  }

  /**
   * Get current authenticated user with profile
   * @returns {Promise<{data: Object|null, error: Error|null}>}
   */
  async function getCurrentUser() {
    try {
      const { data: { user } } = await getClient().auth.getUser();
      
      if (!user) {
        return { data: null, error: null };
      }

      currentUser = user;
      
      if (!currentUserProfile || currentUserProfile.email !== user.email) {
        await loadUserProfile(user.email);
      }

      return { 
        data: { 
          ...user, 
          profile: currentUserProfile 
        }, 
        error: null 
      };
    } catch (error) {
      console.error('[MissionPulse] Get current user error:', error);
      return { data: null, error };
    }
  }

  /**
   * Subscribe to auth state changes
   * @param {Function} callback - (event, session) => void
   * @returns {Object} Subscription object with unsubscribe method
   */
  function onAuthStateChange(callback) {
    return getClient().auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        currentUser = session.user;
        await loadUserProfile(session.user.email);
      } else if (event === 'SIGNED_OUT') {
        currentUser = null;
        currentUserProfile = null;
      }
      callback(event, session);
    });
  }

  /**
   * Send password reset email
   * @param {string} email 
   * @returns {Promise<{data: Object, error: Error|null}>}
   */
  async function resetPassword(email) {
    try {
      const { data, error } = await getClient().auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password.html`
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('[MissionPulse] Password reset error:', error);
      return { data: null, error };
    }
  }

  // ============================================================
  // ROLE-BASED ACCESS CONTROL (RBAC)
  // ============================================================

  /**
   * Role definitions with permissions and module access
   */
  const ROLES = {
    CEO: {
      name: 'Chief Executive Officer',
      level: 100,
      modules: ['*'],
      permissions: ['*']
    },
    COO: {
      name: 'Chief Operating Officer',
      level: 90,
      modules: ['dashboard', 'pipeline', 'warroom', 'compliance', 'pricing', 'partners', 'reports'],
      permissions: ['view_all', 'edit_all', 'approve_gonogo', 'manage_team']
    },
    Admin: {
      name: 'System Administrator',
      level: 95,
      modules: ['*'],
      permissions: ['*', 'manage_users', 'manage_system']
    },
    CAP: {
      name: 'Capture Manager',
      level: 70,
      modules: ['dashboard', 'pipeline', 'warroom', 'blackhat', 'partners', 'orals'],
      permissions: ['view_all', 'edit_capture', 'manage_competitors']
    },
    PM: {
      name: 'Proposal Manager',
      level: 70,
      modules: ['dashboard', 'pipeline', 'warroom', 'compliance', 'schedule', 'documents'],
      permissions: ['view_all', 'edit_proposal', 'manage_schedule']
    },
    SA: {
      name: 'Solution Architect',
      level: 60,
      modules: ['dashboard', 'compliance', 'technical', 'documents'],
      permissions: ['view_assigned', 'edit_technical']
    },
    FIN: {
      name: 'Financial Analyst',
      level: 60,
      modules: ['dashboard', 'pricing', 'staffing', 'reports'],
      permissions: ['view_financial', 'edit_pricing']
    },
    CON: {
      name: 'Contracts Specialist',
      level: 60,
      modules: ['dashboard', 'compliance', 'irondome', 'contracts'],
      permissions: ['view_compliance', 'edit_compliance']
    },
    DEL: {
      name: 'Delivery Lead',
      level: 60,
      modules: ['dashboard', 'staffing', 'partners', 'schedule'],
      permissions: ['view_staffing', 'edit_staffing']
    },
    QA: {
      name: 'Quality Assurance',
      level: 50,
      modules: ['dashboard', 'compliance', 'reviews', 'documents'],
      permissions: ['view_all', 'edit_reviews']
    },
    Partner: {
      name: 'Teaming Partner',
      level: 20,
      modules: ['dashboard', 'assigned'],
      permissions: ['view_assigned']
    }
  };

  /**
   * Module definitions for navigation
   */
  const MODULES = {
    dashboard: { name: 'Dashboard', icon: 'home', path: '/index.html' },
    pipeline: { name: 'Pipeline', icon: 'chart-bar', path: '/pipeline.html' },
    warroom: { name: 'War Room', icon: 'users', path: '/warroom.html' },
    compliance: { name: 'Compliance', icon: 'shield-check', path: '/compliance.html' },
    irondome: { name: 'Iron Dome', icon: 'shield', path: '/irondome.html' },
    blackhat: { name: 'Black Hat', icon: 'eye', path: '/blackhat.html' },
    pricing: { name: 'Pricing', icon: 'currency-dollar', path: '/pricing.html' },
    staffing: { name: 'Staffing', icon: 'user-group', path: '/staffing.html' },
    partners: { name: 'Partners', icon: 'link', path: '/partners.html' },
    orals: { name: 'Orals Studio', icon: 'presentation', path: '/orals.html' },
    documents: { name: 'Documents', icon: 'document', path: '/documents.html' },
    reports: { name: 'Reports', icon: 'chart-pie', path: '/reports.html' },
    admin: { name: 'Admin', icon: 'cog', path: '/admin.html' }
  };

  /**
   * Get current user's role ID
   * @returns {string|null}
   */
  function getUserRole() {
    return currentUserProfile?.roleId || null;
  }

  /**
   * Get current user's role definition
   * @returns {Object|null}
   */
  function getUserRoleDefinition() {
    const roleId = getUserRole();
    return roleId ? ROLES[roleId] : null;
  }

  /**
   * Check if user has a specific permission
   * @param {string} permission 
   * @returns {boolean}
   */
  function hasPermission(permission) {
    const role = getUserRoleDefinition();
    if (!role) return false;
    
    // Wildcard permissions
    if (role.permissions.includes('*')) return true;
    
    return role.permissions.includes(permission);
  }

  /**
   * Check if user can access a specific module
   * @param {string} moduleId 
   * @returns {boolean}
   */
  function canAccessModule(moduleId) {
    const role = getUserRoleDefinition();
    if (!role) return false;
    
    // Wildcard access
    if (role.modules.includes('*')) return true;
    
    return role.modules.includes(moduleId);
  }

  /**
   * Get all accessible modules for current user
   * @returns {Array<Object>}
   */
  function getAccessibleModules() {
    const role = getUserRoleDefinition();
    if (!role) return [];

    if (role.modules.includes('*')) {
      return Object.entries(MODULES).map(([id, module]) => ({ id, ...module }));
    }

    return role.modules
      .filter(id => MODULES[id])
      .map(id => ({ id, ...MODULES[id] }));
  }

  /**
   * Check if current user is authenticated
   * @returns {boolean}
   */
  function isAuthenticated() {
    return currentUser !== null;
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
      companyId: 'company_id'
    }
  };

  const userFieldMapping = {
    toFrontend: {
      id: 'id',
      company_id: 'companyId',
      email: 'email',
      full_name: 'fullName',
      role_id: 'roleId',
      avatar_url: 'avatarUrl',
      phone: 'phone',
      is_active: 'isActive',
      last_login: 'lastLogin',
      preferences: 'preferences',
      created_at: 'createdAt'
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

  function mapUserFromDB(record) {
    if (!record) return null;
    const mapped = {};
    Object.keys(record).forEach(key => {
      const frontendKey = userFieldMapping.toFrontend[key] || key;
      mapped[frontendKey] = record[key];
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

  async function getOpportunities(options = {}) {
    if (!getClient()) {
      return { data: null, error: new Error('Supabase not initialized') };
    }

    try {
      let query = getClient()
        .from('opportunities')
        .select('*');

      const orderBy = options.orderBy || 'due_date';
      const ascending = options.ascending !== undefined ? options.ascending : true;
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

  async function getPipelineStats() {
    if (!getClient()) {
      return { data: null, error: new Error('Supabase not initialized') };
    }

    try {
      const { data, error } = await getClient()
        .from('opportunities')
        .select('contract_value, win_probability, due_date, shipley_phase');

      if (error) throw error;

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

  async function getOpportunitiesByPhase() {
    const { data, error } = await getOpportunities({ orderBy: 'due_date', ascending: true });
    
    if (error) return { data: null, error };

    const grouped = {};
    Object.keys(SHIPLEY_PHASES).forEach(phase => {
      grouped[phase] = {
        ...SHIPLEY_PHASES[phase],
        phase: phase,
        items: []
      };
    });

    (data || []).forEach(opp => {
      const phase = opp.shipleyPhase || 'gate_1';
      if (grouped[phase]) {
        grouped[phase].items.push(opp);
      }
    });

    return { data: grouped, error: null };
  }

  async function createOpportunity(opportunityData) {
    if (!getClient()) {
      return { data: null, error: new Error('Supabase not initialized') };
    }

    try {
      const dbData = mapToDatabase(opportunityData);
      delete dbData.id;
      dbData.created_at = new Date().toISOString();
      dbData.updated_at = new Date().toISOString();

      // Add company_id from current user
      if (currentUserProfile?.companyId) {
        dbData.company_id = currentUserProfile.companyId;
      }

      const { data, error } = await getClient()
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
    if (!getClient()) {
      return { data: null, error: new Error('Supabase not initialized') };
    }

    try {
      const dbData = mapToDatabase(updates);
      dbData.updated_at = new Date().toISOString();

      const { data, error } = await getClient()
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
    if (!getClient()) {
      return { data: null, error: new Error('Supabase not initialized') };
    }

    try {
      const { error } = await getClient()
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

  function subscribeToOpportunities(callback) {
    if (!getClient()) {
      console.error('[MissionPulse] Cannot subscribe - Supabase not initialized');
      return () => {};
    }

    opportunityCallbacks.push(callback);

    if (!opportunitySubscription) {
      opportunitySubscription = getClient()
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

  // ============================================================
  // UTILITY FUNCTIONS
  // ============================================================

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
    getCurrentUser,
    onAuthStateChange,
    resetPassword,
    isAuthenticated,

    // RBAC
    getUserRole,
    getUserRoleDefinition,
    hasPermission,
    canAccessModule,
    getAccessibleModules,
    ROLES,
    MODULES,

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

    // Initialization
    init: initSupabase,
    
    // Config (read-only)
    config: {
      url: SUPABASE_URL,
      initialized: () => supabase !== null
    }
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
