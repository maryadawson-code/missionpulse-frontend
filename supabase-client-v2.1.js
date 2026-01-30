/**
 * MissionPulse Supabase Client v2.1
 * Enterprise-grade data layer with multi-table support
 * 
 * TABLES SUPPORTED:
 * - opportunities (Pipeline, Dashboard, Swimlane)
 * - orals_sessions (Orals Prep)
 * - teaming_partners (Teaming)
 * - win_themes (Win Themes)
 * - past_performance (Past Performance)
 * - compliance_items (Compliance)
 * - pricing_items (Pricing)
 * - ai_approvals (HITL)
 * - competitors (Black Hat)
 * - team_assignments (War Room)
 * - reports (Reports)
 * - audit_logs (System)
 * 
 * © 2026 Mission Meets Tech | Shield & Pulse UX v8.0
 */

(function(global) {
  'use strict';

  // ============================================================
  // SUPABASE CONFIGURATION
  // ============================================================
  const SUPABASE_URL = 'https://qdrtpnpnhkxvfmvfziop.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqdXZpd2FycWR2bGJnY2Z1dXBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc4MzUyMjQsImV4cCI6MjA1MzQxMTIyNH0.pBPL9l2zL7LLd_A5I--hPBzw5YwG3ajPMtbYsqsxIgQ';

  let supabase = null;
  let connectionStatus = 'disconnected';
  let connectionListeners = [];
  let subscriptions = {};

  // ============================================================
  // INITIALIZATION
  // ============================================================
  function initSupabase() {
    if (typeof global.supabase !== 'undefined' && global.supabase.createClient) {
      supabase = global.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      connectionStatus = 'connected';
      notifyConnectionListeners();
      console.log('[MissionPulse v2.1] Supabase connected ✓');
      return true;
    }
    console.warn('[MissionPulse v2.1] Supabase library not loaded');
    return false;
  }

  function notifyConnectionListeners() {
    connectionListeners.forEach(cb => cb(connectionStatus));
  }

  function ensureConnection() {
    if (!supabase) {
      if (!initSupabase()) {
        throw new Error('Supabase not initialized');
      }
    }
    return true;
  }

  // ============================================================
  // GENERIC TABLE OPERATIONS FACTORY
  // ============================================================
  function createTableOperations(tableName, fieldMapping = {}) {
    
    // Map DB record to frontend format
    function mapToFrontend(record) {
      if (!record) return null;
      const mapped = {};
      Object.keys(record).forEach(key => {
        const frontendKey = fieldMapping.toFrontend?.[key] || key;
        mapped[frontendKey] = record[key];
      });
      return mapped;
    }

    // Map frontend data to DB format
    function mapToDatabase(data) {
      if (!data) return null;
      const mapped = {};
      Object.keys(data).forEach(key => {
        const dbKey = fieldMapping.toDatabase?.[key] || key;
        mapped[dbKey] = data[key];
      });
      return mapped;
    }

    return {
      /**
       * Get all records from table
       */
      async getAll(options = {}) {
        try {
          ensureConnection();
          let query = supabase.from(tableName).select('*');
          
          if (options.orderBy) {
            query = query.order(options.orderBy, { ascending: options.ascending ?? true });
          }
          if (options.filter) {
            Object.entries(options.filter).forEach(([key, value]) => {
              query = query.eq(key, value);
            });
          }
          if (options.limit) {
            query = query.limit(options.limit);
          }

          const { data, error } = await query;
          if (error) throw error;
          return { data: (data || []).map(mapToFrontend), error: null };
        } catch (error) {
          console.error(`[MissionPulse] Error fetching ${tableName}:`, error);
          return { data: null, error };
        }
      },

      /**
       * Get single record by ID
       */
      async getById(id) {
        try {
          ensureConnection();
          const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .eq('id', id)
            .single();
          if (error) throw error;
          return { data: mapToFrontend(data), error: null };
        } catch (error) {
          console.error(`[MissionPulse] Error fetching ${tableName} by ID:`, error);
          return { data: null, error };
        }
      },

      /**
       * Get records by foreign key
       */
      async getByField(field, value) {
        try {
          ensureConnection();
          const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .eq(field, value);
          if (error) throw error;
          return { data: (data || []).map(mapToFrontend), error: null };
        } catch (error) {
          console.error(`[MissionPulse] Error fetching ${tableName} by field:`, error);
          return { data: null, error };
        }
      },

      /**
       * Create new record
       */
      async create(recordData) {
        try {
          ensureConnection();
          const dbData = mapToDatabase(recordData);
          delete dbData.id;
          dbData.created_at = new Date().toISOString();
          dbData.updated_at = new Date().toISOString();

          const { data, error } = await supabase
            .from(tableName)
            .insert([dbData])
            .select()
            .single();
          if (error) throw error;
          return { data: mapToFrontend(data), error: null };
        } catch (error) {
          console.error(`[MissionPulse] Error creating ${tableName}:`, error);
          return { data: null, error };
        }
      },

      /**
       * Update existing record
       */
      async update(id, updates) {
        try {
          ensureConnection();
          const dbData = mapToDatabase(updates);
          dbData.updated_at = new Date().toISOString();

          const { data, error } = await supabase
            .from(tableName)
            .update(dbData)
            .eq('id', id)
            .select()
            .single();
          if (error) throw error;
          return { data: mapToFrontend(data), error: null };
        } catch (error) {
          console.error(`[MissionPulse] Error updating ${tableName}:`, error);
          return { data: null, error };
        }
      },

      /**
       * Delete record
       */
      async delete(id) {
        try {
          ensureConnection();
          const { error } = await supabase
            .from(tableName)
            .delete()
            .eq('id', id);
          if (error) throw error;
          return { data: { success: true, id }, error: null };
        } catch (error) {
          console.error(`[MissionPulse] Error deleting ${tableName}:`, error);
          return { data: null, error };
        }
      },

      /**
       * Subscribe to real-time changes
       */
      subscribe(callback) {
        try {
          ensureConnection();
          const channelName = `${tableName}-changes-${Date.now()}`;
          
          const channel = supabase
            .channel(channelName)
            .on('postgres_changes',
              { event: '*', schema: 'public', table: tableName },
              (payload) => {
                callback({
                  eventType: payload.eventType,
                  new: payload.new ? mapToFrontend(payload.new) : null,
                  old: payload.old ? mapToFrontend(payload.old) : null
                });
              }
            )
            .subscribe();

          subscriptions[channelName] = channel;
          
          return () => {
            channel.unsubscribe();
            delete subscriptions[channelName];
          };
        } catch (error) {
          console.error(`[MissionPulse] Error subscribing to ${tableName}:`, error);
          return () => {};
        }
      },

      /**
       * Bulk insert records
       */
      async bulkCreate(records) {
        try {
          ensureConnection();
          const dbRecords = records.map(r => {
            const dbData = mapToDatabase(r);
            delete dbData.id;
            dbData.created_at = new Date().toISOString();
            dbData.updated_at = new Date().toISOString();
            return dbData;
          });

          const { data, error } = await supabase
            .from(tableName)
            .insert(dbRecords)
            .select();
          if (error) throw error;
          return { data: (data || []).map(mapToFrontend), error: null };
        } catch (error) {
          console.error(`[MissionPulse] Error bulk creating ${tableName}:`, error);
          return { data: null, error };
        }
      },

      /**
       * Count records
       */
      async count(filter = {}) {
        try {
          ensureConnection();
          let query = supabase.from(tableName).select('*', { count: 'exact', head: true });
          Object.entries(filter).forEach(([key, value]) => {
            query = query.eq(key, value);
          });
          const { count, error } = await query;
          if (error) throw error;
          return { data: count, error: null };
        } catch (error) {
          console.error(`[MissionPulse] Error counting ${tableName}:`, error);
          return { data: null, error };
        }
      }
    };
  }

  // ============================================================
  // FIELD MAPPINGS BY TABLE
  // ============================================================
  const opportunityMapping = {
    toFrontend: {
      contract_value: 'contractValue',
      shipley_phase: 'shipleyPhase',
      win_probability: 'winProbability',
      due_date: 'dueDate',
      solicitation_number: 'solicitationNumber',
      created_at: 'createdAt',
      updated_at: 'updatedAt',
      contract_type: 'contractType',
      set_aside: 'setAside',
      naics_code: 'naicsCode',
      primary_contact: 'primaryContact'
    },
    toDatabase: {
      contractValue: 'contract_value',
      shipleyPhase: 'shipley_phase',
      winProbability: 'win_probability',
      dueDate: 'due_date',
      solicitationNumber: 'solicitation_number',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      contractType: 'contract_type',
      setAside: 'set_aside',
      naicsCode: 'naics_code',
      primaryContact: 'primary_contact'
    }
  };

  const oralsMapping = {
    toFrontend: {
      opportunity_id: 'opportunityId',
      session_date: 'sessionDate',
      session_type: 'sessionType',
      presenter_name: 'presenterName',
      presenter_role: 'presenterRole',
      time_limit_minutes: 'timeLimitMinutes',
      qa_bank: 'qaBank',
      recording_url: 'recordingUrl',
      ai_feedback: 'aiFeedback',
      confidence_score: 'confidenceScore',
      created_at: 'createdAt',
      updated_at: 'updatedAt'
    },
    toDatabase: {
      opportunityId: 'opportunity_id',
      sessionDate: 'session_date',
      sessionType: 'session_type',
      presenterName: 'presenter_name',
      presenterRole: 'presenter_role',
      timeLimitMinutes: 'time_limit_minutes',
      qaBank: 'qa_bank',
      recordingUrl: 'recording_url',
      aiFeedback: 'ai_feedback',
      confidenceScore: 'confidence_score',
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  };

  const teamingMapping = {
    toFrontend: {
      opportunity_id: 'opportunityId',
      partner_name: 'partnerName',
      partner_type: 'partnerType',
      set_aside_status: 'setAsideStatus',
      cage_code: 'cageCode',
      duns_number: 'dunsNumber',
      nda_signed: 'ndaSigned',
      nda_expiry: 'ndaExpiry',
      ta_signed: 'taSigned',
      ta_expiry: 'taExpiry',
      capability_areas: 'capabilityAreas',
      past_performance_refs: 'pastPerformanceRefs',
      contact_name: 'contactName',
      contact_email: 'contactEmail',
      contact_phone: 'contactPhone',
      workshare_percent: 'worksharePercent',
      created_at: 'createdAt',
      updated_at: 'updatedAt'
    },
    toDatabase: {
      opportunityId: 'opportunity_id',
      partnerName: 'partner_name',
      partnerType: 'partner_type',
      setAsideStatus: 'set_aside_status',
      cageCode: 'cage_code',
      dunsNumber: 'duns_number',
      ndaSigned: 'nda_signed',
      ndaExpiry: 'nda_expiry',
      taSigned: 'ta_signed',
      taExpiry: 'ta_expiry',
      capabilityAreas: 'capability_areas',
      pastPerformanceRefs: 'past_performance_refs',
      contactName: 'contact_name',
      contactEmail: 'contact_email',
      contactPhone: 'contact_phone',
      worksharePercent: 'workshare_percent',
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  };

  const winThemesMapping = {
    toFrontend: {
      opportunity_id: 'opportunityId',
      theme_title: 'themeTitle',
      theme_description: 'themeDescription',
      discriminator_type: 'discriminatorType',
      proof_points: 'proofPoints',
      volume_section: 'volumeSection',
      ai_generated: 'aiGenerated',
      approved_by: 'approvedBy',
      approved_at: 'approvedAt',
      created_at: 'createdAt',
      updated_at: 'updatedAt'
    },
    toDatabase: {
      opportunityId: 'opportunity_id',
      themeTitle: 'theme_title',
      themeDescription: 'theme_description',
      discriminatorType: 'discriminator_type',
      proofPoints: 'proof_points',
      volumeSection: 'volume_section',
      aiGenerated: 'ai_generated',
      approvedBy: 'approved_by',
      approvedAt: 'approved_at',
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  };

  const pastPerformanceMapping = {
    toFrontend: {
      contract_name: 'contractName',
      contract_number: 'contractNumber',
      contracting_agency: 'contractingAgency',
      contract_value: 'contractValue',
      period_of_performance: 'periodOfPerformance',
      start_date: 'startDate',
      end_date: 'endDate',
      relevance_score: 'relevanceScore',
      cpars_rating: 'cparsRating',
      poc_name: 'pocName',
      poc_email: 'pocEmail',
      poc_phone: 'pocPhone',
      scope_description: 'scopeDescription',
      key_accomplishments: 'keyAccomplishments',
      created_at: 'createdAt',
      updated_at: 'updatedAt'
    },
    toDatabase: {
      contractName: 'contract_name',
      contractNumber: 'contract_number',
      contractingAgency: 'contracting_agency',
      contractValue: 'contract_value',
      periodOfPerformance: 'period_of_performance',
      startDate: 'start_date',
      endDate: 'end_date',
      relevanceScore: 'relevance_score',
      cparsRating: 'cpars_rating',
      pocName: 'poc_name',
      pocEmail: 'poc_email',
      pocPhone: 'poc_phone',
      scopeDescription: 'scope_description',
      keyAccomplishments: 'key_accomplishments',
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  };

  const reportsMapping = {
    toFrontend: {
      report_type: 'reportType',
      report_name: 'reportName',
      generated_by: 'generatedBy',
      generated_at: 'generatedAt',
      date_range_start: 'dateRangeStart',
      date_range_end: 'dateRangeEnd',
      report_data: 'reportData',
      export_format: 'exportFormat',
      file_url: 'fileUrl',
      created_at: 'createdAt',
      updated_at: 'updatedAt'
    },
    toDatabase: {
      reportType: 'report_type',
      reportName: 'report_name',
      generatedBy: 'generated_by',
      generatedAt: 'generated_at',
      dateRangeStart: 'date_range_start',
      dateRangeEnd: 'date_range_end',
      reportData: 'report_data',
      exportFormat: 'export_format',
      fileUrl: 'file_url',
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  };

  // ============================================================
  // SHIPLEY PHASES
  // ============================================================
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

  // ============================================================
  // UTILITY FUNCTIONS
  // ============================================================
  function formatCurrency(value) {
    if (!value) return '$0';
    if (value >= 1000000000) return `$${(value / 1000000000).toFixed(1)}B`;
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toLocaleString()}`;
  }

  function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', { 
      month: 'short', day: 'numeric', year: 'numeric' 
    });
  }

  function getPhaseInfo(phaseKey) {
    return SHIPLEY_PHASES[phaseKey] || SHIPLEY_PHASES.gate_1;
  }

  function getShipleyPhases() {
    return Object.entries(SHIPLEY_PHASES)
      .map(([key, value]) => ({ key, ...value }))
      .sort((a, b) => a.order - b.order);
  }

  function calculateDaysRemaining(dueDate) {
    if (!dueDate) return null;
    const due = new Date(dueDate);
    const today = new Date();
    return Math.ceil((due - today) / (1000 * 60 * 60 * 24));
  }

  // ============================================================
  // CONNECTION MANAGEMENT
  // ============================================================
  function onConnectionChange(callback) {
    connectionListeners.push(callback);
    callback(connectionStatus);
    return () => {
      const index = connectionListeners.indexOf(callback);
      if (index > -1) connectionListeners.splice(index, 1);
    };
  }

  function getConnectionStatus() {
    return connectionStatus;
  }

  function cleanup() {
    Object.values(subscriptions).forEach(sub => sub.unsubscribe());
    subscriptions = {};
  }

  // ============================================================
  // EXPORT MissionPulse NAMESPACE
  // ============================================================
  global.MissionPulse = {
    // Table Operations
    opportunities: createTableOperations('opportunities', opportunityMapping),
    oralsSessions: createTableOperations('orals_sessions', oralsMapping),
    teamingPartners: createTableOperations('teaming_partners', teamingMapping),
    winThemes: createTableOperations('win_themes', winThemesMapping),
    pastPerformance: createTableOperations('past_performance', pastPerformanceMapping),
    reports: createTableOperations('reports', reportsMapping),
    complianceItems: createTableOperations('compliance_items'),
    pricingItems: createTableOperations('pricing_items'),
    aiApprovals: createTableOperations('ai_approvals'),
    competitors: createTableOperations('competitors'),
    teamAssignments: createTableOperations('team_assignments'),
    auditLogs: createTableOperations('audit_logs'),
    
    // Legacy compatibility aliases
    getOpportunities: () => createTableOperations('opportunities', opportunityMapping).getAll(),
    getPipelineStats: async () => {
      const { data } = await createTableOperations('opportunities', opportunityMapping).getAll();
      if (!data) return { data: null, error: new Error('No data') };
      const stats = {
        totalCount: data.length,
        totalValue: data.reduce((sum, o) => sum + (o.contractValue || 0), 0),
        avgPwin: data.length ? Math.round(data.reduce((sum, o) => sum + (o.winProbability || 0), 0) / data.length) : 0,
        byPhase: {}
      };
      data.forEach(o => {
        const phase = o.shipleyPhase || 'gate_1';
        if (!stats.byPhase[phase]) stats.byPhase[phase] = { count: 0, value: 0 };
        stats.byPhase[phase].count++;
        stats.byPhase[phase].value += o.contractValue || 0;
      });
      return { data: stats, error: null };
    },

    // Connection
    onConnectionChange,
    getConnectionStatus,
    cleanup,
    init: initSupabase,

    // Utilities
    formatCurrency,
    formatDate,
    getPhaseInfo,
    getShipleyPhases,
    calculateDaysRemaining,
    SHIPLEY_PHASES,

    // Version
    VERSION: '2.1.0'
  };

  // Auto-initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(initSupabase, 100));
  } else {
    setTimeout(initSupabase, 100);
  }

})(typeof window !== 'undefined' ? window : global);
