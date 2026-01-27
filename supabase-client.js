/**
 * MissionPulse Supabase Client Module
 * Sprint 16: Shared client with auth, CRUD operations, and real-time subscriptions
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

  async function signIn(email, password) {
    if (!supabase) {
      if (!initSupabase()) {
        return { data: null, error: new Error('Supabase not initialized') };
      }
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password
      });

      if (error) {
        console.error('[MissionPulse] Sign in error:', error);
        return { data: null, error };
      }

      console.log('[MissionPulse] Sign in successful:', data.user?.email);
      return { data, error: null };
    } catch (error) {
      console.error('[MissionPulse] Sign in exception:', error);
      return { data: null, error };
    }
  }

  async function signOut() {
    if (!supabase) {
      return { error: new Error('Supabase not initialized') };
    }

    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('[MissionPulse] Sign out error:', error);
        return { error };
      }
      
      localStorage.removeItem('mp_user');
      console.log('[MissionPulse] Sign out successful');
      return { error: null };
    } catch (error) {
      console.error('[MissionPulse] Sign out exception:', error);
      return { error };
    }
  }

  async function getSession() {
    if (!supabase) {
      if (!initSupabase()) {
        return { data: { session: null }, error: new Error('Supabase not initialized') };
      }
    }

    try {
      const { data, error } = await supabase.auth.getSession();
      return { data, error };
    } catch (error) {
      console.error('[MissionPulse] Get session exception:', error);
      return { data: { session: null }, error };
    }
  }

  async function getCurrentUser() {
    if (!supabase) {
      if (!initSupabase()) {
        return { data: { user: null }, error: new Error('Supabase not initialized') };
      }
    }

    try {
      const { data, error } = await supabase.auth.getUser();
      return { data, error };
    } catch (error) {
      console.error('[MissionPulse] Get user exception:', error);
      return { data: { user: null }, error };
    }
  }

  async function getUserProfile(userId) {
    if (!supabase) {
      if (!initSupabase()) {
        return { data: null, error: new Error('Supabase not initialized') };
      }
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, role, is_active, company_id')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('[MissionPulse] Get user profile error:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('[MissionPulse] Get user profile exception:', error);
      return { data: null, error };
    }
  }

  function onAuthStateChange(callback) {
    authListeners.push(callback);
    
    return () => {
      const index = authListeners.indexOf(callback);
      if (index > -1) {
        authListeners.splice(index, 1);
      }
    };
  }

  async function requireAuth(loginUrl = 'login.html') {
    const { data: { session }, error } = await getSession();
    
    if (error || !session) {
      console.log('[MissionPulse] Not authenticated, redirecting to login');
      window.location.href = loginUrl;
      return null;
    }
    
    return session;
  }

  // ============================================================
  // FIELD MAPPING
  // ============================================================
  const fieldMapping = {
    toFrontend: {
      id: 'id', name: 'name', agency: 'agency', contract_value: 'contractValue',
      priority: 'priority', shipley_phase: 'shipleyPhase', win_probability: 'winProbability',
      due_date: 'dueDate', solicitation_number: 'solicitationNumber', created_at: 'createdAt',
      updated_at: 'updatedAt', description: 'description', contract_type: 'contractType',
      set_aside: 'setAside', naics_code: 'naicsCode', primary_contact: 'primaryContact'
    },
    toDatabase: {
      id: 'id', name: 'name', agency: 'agency', contractValue: 'contract_value',
      priority: 'priority', shipleyPhase: 'shipley_phase', winProbability: 'win_probability',
      dueDate: 'due_date', solicitationNumber: 'solicitation_number', createdAt: 'created_at',
      updatedAt: 'updated_at', description: 'description', contractType: 'contract_type',
      setAside: 'set_aside', naicsCode: 'naics_code', primaryContact: 'primary_contact'
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
      grouped[phase] = { ...SHIPLEY_PHASES[phase], phase: phase, items: [] };
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
      const { error } = await supabase.from('opportunities').delete().eq('id', id);
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
  // UTILITIES
  // ============================================================

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

  function getClient() {
    if (!supabase) initSupabase();
    return supabase;
  }

  // ============================================================
  // EXPORT
  // ============================================================
  global.MissionPulse = {
    signIn, signOut, getSession, getCurrentUser, getUserProfile,
    onAuthStateChange, requireAuth,
    getOpportunities, getPipelineStats, getOpportunitiesByPhase,
    createOpportunity, updateOpportunity, deleteOpportunity,
    subscribeToOpportunities, onConnectionChange, getConnectionStatus,
    formatCurrency, getPhaseInfo, getShipleyPhases, mapToFrontend, mapToDatabase, getClient,
    SHIPLEY_PHASES, SUPABASE_URL,
    init: initSupabase
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(initSupabase, 100));
  } else {
    setTimeout(initSupabase, 100);
  }

})(typeof window !== 'undefined' ? window : global);
