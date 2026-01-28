/**
 * MissionPulse Supabase Client Module v2.0
 * Sprint 15: Added User Management + CSV Upload Support
 * 
 * Provides MissionPulse namespace with:
 * - Opportunities CRUD + Real-time
 * - User Management (profiles, invitations)
 * - Access Requests
 * - Audit Logging
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

  // Initialize Supabase client
  let supabase = null;
  let connectionStatus = 'disconnected';
  let connectionListeners = [];

  function initSupabase() {
    if (typeof global.supabase !== 'undefined' && global.supabase.createClient) {
      supabase = global.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      connectionStatus = 'connected';
      notifyConnectionListeners();
      console.log('[MissionPulse] Supabase client initialized v2.0');
      return true;
    }
    console.warn('[MissionPulse] Supabase library not loaded');
    return false;
  }

  function notifyConnectionListeners() {
    connectionListeners.forEach(cb => cb(connectionStatus));
  }

  function getClient() {
    if (!supabase) initSupabase();
    return supabase;
  }

  // ============================================================
  // SHIPLEY ROLES CONFIGURATION
  // ============================================================
  const SHIPLEY_ROLES = [
    { key: 'CEO', name: 'CEO', description: 'Executive Leadership - Final Go/No-Go authority', color: '#a78bfa' },
    { key: 'COO', name: 'COO', description: 'Operations Leadership - Capture oversight', color: '#60a5fa' },
    { key: 'CAP', name: 'Capture Manager', description: 'Win strategy development', color: '#f472b6' },
    { key: 'PM', name: 'Project Manager', description: 'Schedule and delivery', color: '#4ade80' },
    { key: 'SA', name: 'Solution Architect', description: 'Technical approach', color: '#fb923c' },
    { key: 'FIN', name: 'Finance', description: 'Pricing and cost analysis', color: '#22d3ee' },
    { key: 'CON', name: 'Contracts', description: 'FAR/DFARS compliance', color: '#f87171' },
    { key: 'DEL', name: 'Delivery', description: 'Staffing and resources', color: '#a78bfa' },
    { key: 'QA', name: 'Quality Assurance', description: 'Review and validation', color: '#4ade80' },
    { key: 'Partner', name: 'Partner', description: 'External team member (auto-revoke on submit)', color: '#fbbf24' },
    { key: 'Admin', name: 'Admin', description: 'System administration', color: '#f87171' }
  ];

  const ADMIN_ROLES = ['CEO', 'COO', 'Admin'];

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
  // OPPORTUNITIES CRUD
  // ============================================================

  async function getOpportunities(options = {}) {
    if (!supabase) {
      if (!initSupabase()) {
        return { data: null, error: new Error('Supabase not initialized') };
      }
    }

    try {
      let query = supabase.from('opportunities').select('*');
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

  // ============================================================
  // USER MANAGEMENT (Sprint 15)
  // ============================================================

  /**
   * Get all users (profiles)
   * @param {Object} options - Query options
   * @returns {Promise<{data: Array, error: Error|null}>}
   */
  async function getUsers(options = {}) {
    if (!supabase) {
      if (!initSupabase()) {
        return { data: null, error: new Error('Supabase not initialized') };
      }
    }

    try {
      let query = supabase.from('profiles').select('*');
      
      if (options.role) {
        query = query.eq('role', options.role);
      }
      if (options.isActive !== undefined) {
        query = query.eq('is_active', options.isActive);
      }
      
      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;

      return { data: data || [], error: null };
    } catch (error) {
      console.error('[MissionPulse] Error fetching users:', error);
      return { data: null, error };
    }
  }

  /**
   * Get current user profile
   * @returns {Promise<{data: Object, error: Error|null}>}
   */
  async function getCurrentUser() {
    if (!supabase) {
      if (!initSupabase()) {
        return { data: null, error: new Error('Supabase not initialized') };
      }
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { data: null, error: new Error('Not authenticated') };
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error) throw error;
      return { data: { ...data, email: session.user.email }, error: null };
    } catch (error) {
      console.error('[MissionPulse] Error fetching current user:', error);
      return { data: null, error };
    }
  }

  /**
   * Update user profile
   * @param {string} userId - User ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<{data: Object, error: Error|null}>}
   */
  async function updateUser(userId, updates) {
    if (!supabase) {
      if (!initSupabase()) {
        return { data: null, error: new Error('Supabase not initialized') };
      }
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('[MissionPulse] Error updating user:', error);
      return { data: null, error };
    }
  }

  /**
   * Check if current user has admin access
   * @returns {Promise<boolean>}
   */
  async function isAdmin() {
    const { data: user } = await getCurrentUser();
    return user && ADMIN_ROLES.includes(user.role);
  }

  // ============================================================
  // USER INVITATIONS (Sprint 15)
  // ============================================================

  /**
   * Get all pending invitations
   * @returns {Promise<{data: Array, error: Error|null}>}
   */
  async function getInvitations(options = {}) {
    if (!supabase) {
      if (!initSupabase()) {
        return { data: null, error: new Error('Supabase not initialized') };
      }
    }

    try {
      let query = supabase
        .from('user_invitations')
        .select('*, inviter:profiles!invited_by(full_name, email)');
      
      if (options.status) {
        query = query.eq('status', options.status);
      }
      
      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;

      return { data: data || [], error: null };
    } catch (error) {
      console.error('[MissionPulse] Error fetching invitations:', error);
      return { data: null, error };
    }
  }

  /**
   * Create new user invitation
   * @param {Object} invitation - Invitation data
   * @returns {Promise<{data: Object, error: Error|null}>}
   */
  async function createInvitation(invitation) {
    if (!supabase) {
      if (!initSupabase()) {
        return { data: null, error: new Error('Supabase not initialized') };
      }
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { data: null, error: new Error('Not authenticated') };
      }

      const { data, error } = await supabase
        .from('user_invitations')
        .insert({
          full_name: invitation.fullName,
          email: invitation.email.toLowerCase(),
          role: invitation.role,
          invited_by: session.user.id,
          status: 'pending',
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('[MissionPulse] Error creating invitation:', error);
      return { data: null, error };
    }
  }

  /**
   * Bulk create invitations from CSV data
   * @param {Array} users - Array of user objects
   * @returns {Promise<{success: number, failed: number, errors: Array}>}
   */
  async function bulkInviteUsers(users) {
    const results = { success: 0, failed: 0, errors: [] };

    for (const user of users) {
      const { error } = await createInvitation({
        fullName: user.full_name,
        email: user.email,
        role: user.role
      });

      if (error) {
        results.failed++;
        results.errors.push({ email: user.email, error: error.message });
      } else {
        results.success++;
      }
    }

    return results;
  }

  /**
   * Revoke an invitation
   * @param {string} invitationId - Invitation ID
   * @returns {Promise<{data: Object, error: Error|null}>}
   */
  async function revokeInvitation(invitationId) {
    if (!supabase) {
      if (!initSupabase()) {
        return { data: null, error: new Error('Supabase not initialized') };
      }
    }

    try {
      const { data, error } = await supabase
        .from('user_invitations')
        .update({ status: 'revoked', updated_at: new Date().toISOString() })
        .eq('id', invitationId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('[MissionPulse] Error revoking invitation:', error);
      return { data: null, error };
    }
  }

  // ============================================================
  // ACCESS REQUESTS (Sprint 14A + 15)
  // ============================================================

  /**
   * Get all access requests
   * @returns {Promise<{data: Array, error: Error|null}>}
   */
  async function getAccessRequests(options = {}) {
    if (!supabase) {
      if (!initSupabase()) {
        return { data: null, error: new Error('Supabase not initialized') };
      }
    }

    try {
      let query = supabase.from('access_requests').select('*');
      
      if (options.status) {
        query = query.eq('status', options.status);
      }
      
      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;

      return { data: data || [], error: null };
    } catch (error) {
      console.error('[MissionPulse] Error fetching access requests:', error);
      return { data: null, error };
    }
  }

  /**
   * Submit a new access request (public)
   * @param {Object} request - Request data
   * @returns {Promise<{data: Object, error: Error|null}>}
   */
  async function submitAccessRequest(request) {
    if (!supabase) {
      if (!initSupabase()) {
        return { data: null, error: new Error('Supabase not initialized') };
      }
    }

    try {
      const { data, error } = await supabase
        .from('access_requests')
        .insert({
          full_name: request.fullName,
          email: request.email.toLowerCase(),
          company_name: request.companyName,
          job_title: request.jobTitle || null,
          phone: request.phone || null,
          message: request.message || null,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('[MissionPulse] Error submitting access request:', error);
      return { data: null, error };
    }
  }

  /**
   * Update access request status (admin only)
   * @param {string} requestId - Request ID
   * @param {string} status - New status
   * @param {string} notes - Optional notes
   * @returns {Promise<{data: Object, error: Error|null}>}
   */
  async function updateAccessRequest(requestId, status, notes) {
    if (!supabase) {
      if (!initSupabase()) {
        return { data: null, error: new Error('Supabase not initialized') };
      }
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const { data, error } = await supabase
        .from('access_requests')
        .update({
          status,
          notes: notes || null,
          reviewed_by: session?.user?.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', requestId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('[MissionPulse] Error updating access request:', error);
      return { data: null, error };
    }
  }

  // ============================================================
  // AUDIT LOG (Sprint 15)
  // ============================================================

  /**
   * Log an audit action
   * @param {string} action - Action type
   * @param {string} targetUserId - Target user ID (optional)
   * @param {string} targetEmail - Target email (optional)
   * @param {Object} details - Additional details
   * @returns {Promise<{data: Object, error: Error|null}>}
   */
  async function logAuditAction(action, targetUserId, targetEmail, details = {}) {
    if (!supabase) {
      if (!initSupabase()) {
        return { data: null, error: new Error('Supabase not initialized') };
      }
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const { data, error } = await supabase
        .from('user_audit_log')
        .insert({
          action,
          target_user_id: targetUserId || null,
          target_email: targetEmail || null,
          performed_by: session?.user?.id,
          details
        })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('[MissionPulse] Error logging audit action:', error);
      return { data: null, error };
    }
  }

  /**
   * Get audit log entries
   * @param {Object} options - Query options
   * @returns {Promise<{data: Array, error: Error|null}>}
   */
  async function getAuditLog(options = {}) {
    if (!supabase) {
      if (!initSupabase()) {
        return { data: null, error: new Error('Supabase not initialized') };
      }
    }

    try {
      let query = supabase
        .from('user_audit_log')
        .select('*, performer:profiles!performed_by(full_name, email)');
      
      if (options.action) {
        query = query.eq('action', options.action);
      }
      if (options.targetUserId) {
        query = query.eq('target_user_id', options.targetUserId);
      }
      
      query = query.order('created_at', { ascending: false });
      
      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;
      if (error) throw error;

      return { data: data || [], error: null };
    } catch (error) {
      console.error('[MissionPulse] Error fetching audit log:', error);
      return { data: null, error };
    }
  }

  // ============================================================
  // REAL-TIME SUBSCRIPTIONS
  // ============================================================

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

  function getRoleInfo(roleKey) {
    return SHIPLEY_ROLES.find(r => r.key === roleKey) || { key: roleKey, name: roleKey, color: '#94a3b8' };
  }

  function getShipleyRoles() {
    return SHIPLEY_ROLES;
  }

  // ============================================================
  // CSV PARSING UTILITY
  // ============================================================

  function parseCSV(csvText) {
    const lines = csvText.split('\n').filter(l => l.trim());
    if (lines.length < 2) {
      return { data: null, error: new Error('CSV must have header row and at least one data row') };
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));
    const required = ['full_name', 'email', 'role'];
    const missing = required.filter(r => !headers.includes(r));
    
    if (missing.length > 0) {
      return { data: null, error: new Error(`Missing required columns: ${missing.join(', ')}`) };
    }

    const data = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length >= headers.length) {
        const row = {};
        headers.forEach((h, idx) => row[h] = values[idx]?.trim() || '');
        
        // Validate
        const roleKeys = SHIPLEY_ROLES.map(r => r.key);
        if (!roleKeys.includes(row.role)) {
          row._valid = false;
          row._error = `Invalid role: ${row.role}. Valid roles: ${roleKeys.join(', ')}`;
        } else if (!row.email || !row.email.includes('@')) {
          row._valid = false;
          row._error = 'Invalid email address';
        } else if (!row.full_name) {
          row._valid = false;
          row._error = 'Full name required';
        } else {
          row._valid = true;
        }
        
        data.push(row);
      }
    }

    return { data, error: null };
  }

  function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  }

  function generateCSVTemplate() {
    return 'full_name,email,role\nJohn Smith,john@example.com,PM\nJane Doe,jane@example.com,SA\nBob Wilson,bob@example.com,FIN\n';
  }

  // ============================================================
  // EXPORT MissionPulse NAMESPACE
  // ============================================================
  global.MissionPulse = {
    // Core
    init: initSupabase,
    getClient,
    
    // Opportunities CRUD
    getOpportunities,
    getPipelineStats,
    getOpportunitiesByPhase,
    createOpportunity,
    updateOpportunity,
    deleteOpportunity,

    // User Management (Sprint 15)
    getUsers,
    getCurrentUser,
    updateUser,
    isAdmin,
    
    // Invitations (Sprint 15)
    getInvitations,
    createInvitation,
    bulkInviteUsers,
    revokeInvitation,
    
    // Access Requests
    getAccessRequests,
    submitAccessRequest,
    updateAccessRequest,
    
    // Audit Log
    logAuditAction,
    getAuditLog,

    // Real-time
    subscribeToOpportunities,
    onConnectionChange,
    getConnectionStatus,

    // Utilities
    formatCurrency,
    getPhaseInfo,
    getShipleyPhases,
    getRoleInfo,
    getShipleyRoles,
    mapToFrontend,
    mapToDatabase,
    parseCSV,
    generateCSVTemplate,

    // Constants
    SHIPLEY_PHASES,
    SHIPLEY_ROLES,
    ADMIN_ROLES
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
