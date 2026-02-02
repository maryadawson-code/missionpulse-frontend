/**
 * MissionPulse Supabase CRUD Module v2.0
 * Comprehensive data layer for all MissionPulse tables
 * 
 * Features:
 * - All table CRUD operations
 * - Demo data fallback when offline
 * - Retry logic for transient failures
 * - Field mapping (snake_case <-> camelCase)
 * - Real-time subscriptions
 * - Connection status monitoring
 * 
 * © 2026 Mission Meets Tech
 */

(function(global) {
  'use strict';

  // ============================================================
  // SUPABASE CONFIGURATION
  // ============================================================
  const SUPABASE_URL = 'https://qdrtpnpnhkxvfmvfziop.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkcnRwbnBuaGt4dmZtdmZ6aW9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc4MzUyMjQsImV4cCI6MjA1MzQxMTIyNH0.placeholder_key';
  
  const RETRY_ATTEMPTS = 3;
  const RETRY_DELAY_MS = 1000;
  const USE_DEMO_FALLBACK = true;

  // Initialize Supabase client
  let supabase = null;
  let connectionStatus = 'disconnected';
  let connectionListeners = [];

  // ============================================================
  // DEMO DATA FALLBACK
  // ============================================================
  const DEMO_DATA = {
    opportunities: [
      { id: 'opp-001', title: 'DHA MHS Genesis Support', agency: 'DHA', estimated_value: 45000000, pwin: 72, phase: 'pink_team', status: 'active', due_date: '2026-03-15', priority: 'high', solicitation_number: 'HT0011-26-R-0001', set_aside: 'SDVOSB', contract_type: 'IDIQ' },
      { id: 'opp-002', title: 'VA EHR Modernization', agency: 'VA', estimated_value: 125000000, pwin: 45, phase: 'blue_team', status: 'active', due_date: '2026-04-20', priority: 'high', solicitation_number: '36C10X26R0015', set_aside: 'Full & Open', contract_type: 'FFP' },
      { id: 'opp-003', title: 'CMS Data Analytics Platform', agency: 'CMS', estimated_value: 32000000, pwin: 65, phase: 'gate_1', status: 'active', due_date: '2026-05-01', priority: 'medium', solicitation_number: 'CMS-26-R-0042', set_aside: '8(a)', contract_type: 'T&M' },
      { id: 'opp-004', title: 'IHS Telehealth Expansion', agency: 'IHS', estimated_value: 18000000, pwin: 78, phase: 'red_team', status: 'active', due_date: '2026-02-28', priority: 'critical', solicitation_number: 'IHS-26-Q-0008', set_aside: 'SDVOSB', contract_type: 'BPA' },
      { id: 'opp-005', title: 'NIH Research Portal', agency: 'NIH', estimated_value: 22000000, pwin: 55, phase: 'gold_team', status: 'active', due_date: '2026-02-15', priority: 'high', solicitation_number: 'NIH-26-R-0033', set_aside: 'HUBZone', contract_type: 'CPFF' },
      { id: 'opp-006', title: 'SAMHSA Crisis Hotline', agency: 'SAMHSA', estimated_value: 8500000, pwin: 82, phase: 'submitted', status: 'active', due_date: '2026-01-31', priority: 'medium', solicitation_number: 'SAMHSA-26-R-0011', set_aside: 'WOSB', contract_type: 'FFP' }
    ],
    competitors: [
      { id: 'comp-001', opportunity_id: 'opp-001', name: 'Leidos', strengths: 'Incumbent, deep DHA relationships', weaknesses: 'Cost overruns on previous task orders', incumbent: true, threat_level: 'high', pwin_estimate: 65 },
      { id: 'comp-002', opportunity_id: 'opp-001', name: 'GDIT', strengths: 'Strong technical bench', weaknesses: 'No MHS Genesis experience', incumbent: false, threat_level: 'medium', pwin_estimate: 45 },
      { id: 'comp-003', opportunity_id: 'opp-002', name: 'Cerner', strengths: 'EHR platform owner', weaknesses: 'VA relationship challenges', incumbent: true, threat_level: 'high', pwin_estimate: 55 },
      { id: 'comp-004', opportunity_id: 'opp-004', name: 'Cognosante', strengths: 'IHS past performance', weaknesses: 'Smaller scale operations', incumbent: false, threat_level: 'medium', pwin_estimate: 50 }
    ],
    teaming_partners: [
      { id: 'partner-001', opportunity_id: 'opp-001', name: 'Accenture Federal', role: 'Subcontractor', status: 'active', cage_code: '1ABC2', certifications: ['ISO 27001', 'CMMI Level 3'] },
      { id: 'partner-002', opportunity_id: 'opp-001', name: 'Booz Allen Hamilton', role: 'Subcontractor', status: 'pending', cage_code: '2DEF3', certifications: ['FedRAMP High', 'SOC 2'] },
      { id: 'partner-003', opportunity_id: 'opp-002', name: 'Deloitte', role: 'Mentor', status: 'active', cage_code: '3GHI4', certifications: ['CMMC Level 2', 'ISO 9001'] }
    ],
    team_assignments: [
      { id: 'assign-001', opportunity_id: 'opp-001', user_id: 'user-001', role: 'CAP', assigned_at: '2026-01-15' },
      { id: 'assign-002', opportunity_id: 'opp-001', user_id: 'user-002', role: 'PM', assigned_at: '2026-01-15' },
      { id: 'assign-003', opportunity_id: 'opp-001', user_id: 'user-003', role: 'SA', assigned_at: '2026-01-16' },
      { id: 'assign-004', opportunity_id: 'opp-002', user_id: 'user-001', role: 'CAP', assigned_at: '2026-01-20' }
    ],
    users: [
      { id: 'user-001', email: 'maryadawson@gmail.com', full_name: 'Mary Womack', role: 'CEO', company_id: 'mmt-001', is_active: true },
      { id: 'user-002', email: 'jsmith@missionmeetstech.com', full_name: 'John Smith', role: 'PM', company_id: 'mmt-001', is_active: true },
      { id: 'user-003', email: 'agarcia@missionmeetstech.com', full_name: 'Ana Garcia', role: 'SA', company_id: 'mmt-001', is_active: true },
      { id: 'user-004', email: 'bwilson@missionmeetstech.com', full_name: 'Brian Wilson', role: 'FIN', company_id: 'mmt-001', is_active: true }
    ],
    pricing_items: [
      { id: 'price-001', opportunity_id: 'opp-001', category: 'Labor', description: 'Program Manager', quantity: 1, unit_price: 185000, total: 185000, cui_marked: true },
      { id: 'price-002', opportunity_id: 'opp-001', category: 'Labor', description: 'Senior Developer', quantity: 4, unit_price: 155000, total: 620000, cui_marked: true },
      { id: 'price-003', opportunity_id: 'opp-001', category: 'ODC', description: 'Cloud Infrastructure', quantity: 1, unit_price: 250000, total: 250000, cui_marked: false }
    ],
    compliance_items: [
      { id: 'compl-001', opportunity_id: 'opp-001', requirement: 'CMMC Level 2', status: 'compliant', evidence: 'CMMC Certificate #12345', due_date: '2026-02-01' },
      { id: 'compl-002', opportunity_id: 'opp-001', requirement: 'FedRAMP Moderate', status: 'in_progress', evidence: 'SSP v2.1 submitted', due_date: '2026-02-15' },
      { id: 'compl-003', opportunity_id: 'opp-002', requirement: 'Section 508', status: 'compliant', evidence: 'VPAT completed', due_date: '2026-03-01' }
    ],
    rfp_requirements: [
      { id: 'req-001', opportunity_id: 'opp-001', section: 'L.5.1', requirement: 'Technical Approach', priority: 'high', status: 'mapped', notes: 'Section 3 of Tech Volume' },
      { id: 'req-002', opportunity_id: 'opp-001', section: 'L.5.2', requirement: 'Management Approach', priority: 'high', status: 'mapped', notes: 'Section 2 of Mgmt Volume' },
      { id: 'req-003', opportunity_id: 'opp-001', section: 'L.6.1', requirement: 'Past Performance', priority: 'medium', status: 'in_progress', notes: '3 citations required' }
    ],
    proposal_sections: [
      { id: 'sect-001', opportunity_id: 'opp-001', volume: 'Technical', section_number: '3.1', title: 'Technical Approach Overview', status: 'draft', word_count: 1250, page_limit: 5 },
      { id: 'sect-002', opportunity_id: 'opp-001', volume: 'Technical', section_number: '3.2', title: 'Solution Architecture', status: 'review', word_count: 2100, page_limit: 8 },
      { id: 'sect-003', opportunity_id: 'opp-001', volume: 'Management', section_number: '2.1', title: 'Program Management', status: 'final', word_count: 1800, page_limit: 6 }
    ],
    audit_logs: [
      { id: 'audit-001', user_id: 'user-001', action: 'UPDATE', table_name: 'opportunities', record_id: 'opp-001', old_values: { pwin: 68 }, new_values: { pwin: 72 }, ip_address: '192.168.1.1', created_at: '2026-02-02T10:30:00Z' },
      { id: 'audit-002', user_id: 'user-002', action: 'INSERT', table_name: 'proposal_sections', record_id: 'sect-001', old_values: null, new_values: { title: 'Technical Approach Overview' }, ip_address: '192.168.1.2', created_at: '2026-02-02T11:15:00Z' }
    ],
    lcat_rates: [
      { id: 'lcat-001', title: 'Program Manager', hourly_rate: 195.00, annual_rate: 405600, labor_category: 'PM', site: 'On-site', clearance: 'Secret', cui_marked: true },
      { id: 'lcat-002', title: 'Senior Software Engineer', hourly_rate: 165.00, annual_rate: 343200, labor_category: 'SWE-III', site: 'Hybrid', clearance: 'Public Trust', cui_marked: true },
      { id: 'lcat-003', title: 'Cloud Architect', hourly_rate: 185.00, annual_rate: 384800, labor_category: 'CA-II', site: 'Remote', clearance: 'Secret', cui_marked: true },
      { id: 'lcat-004', title: 'Data Analyst', hourly_rate: 125.00, annual_rate: 260000, labor_category: 'DA-II', site: 'On-site', clearance: 'Public Trust', cui_marked: true }
    ],
    playbook_items: [
      { id: 'play-001', phase: 'Gate 1', title: 'Opportunity Qualification', description: 'Assess strategic fit and win probability', checklist: ['Review solicitation', 'Identify key requirements', 'Assess competition'], methodology: 'Shipley' },
      { id: 'play-002', phase: 'Blue Team', title: 'Solution Development', description: 'Develop technical approach and win themes', checklist: ['Draft solution architecture', 'Identify discriminators', 'Review with SMEs'], methodology: 'Shipley' },
      { id: 'play-003', phase: 'Pink Team', title: 'Compliance Review', description: 'Ensure RFP compliance and section mapping', checklist: ['Map all L&M requirements', 'Verify page counts', 'Check formatting'], methodology: 'Shipley' }
    ],
    orals_presentations: [
      { id: 'oral-001', opportunity_id: 'opp-001', title: 'DHA Technical Presentation', status: 'draft', slide_count: 24, duration_minutes: 45, scheduled_date: '2026-03-20' },
      { id: 'oral-002', opportunity_id: 'opp-005', title: 'NIH Solution Demo', status: 'final', slide_count: 18, duration_minutes: 30, scheduled_date: '2026-02-18' }
    ],
    launch_checklist: [
      { id: 'launch-001', opportunity_id: 'opp-004', item: 'Final PDF compilation', status: 'complete', owner: 'user-002', due_date: '2026-02-26' },
      { id: 'launch-002', opportunity_id: 'opp-004', item: 'Executive summary review', status: 'complete', owner: 'user-001', due_date: '2026-02-25' },
      { id: 'launch-003', opportunity_id: 'opp-004', item: 'Pricing validation', status: 'in_progress', owner: 'user-004', due_date: '2026-02-27' },
      { id: 'launch-004', opportunity_id: 'opp-004', item: 'SAM.gov submission', status: 'pending', owner: 'user-002', due_date: '2026-02-28' }
    ]
  };

  // ============================================================
  // INITIALIZATION & CONNECTION
  // ============================================================
  
  function initSupabase() {
    if (typeof global.supabase !== 'undefined' && global.supabase.createClient) {
      supabase = global.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      connectionStatus = 'connected';
      notifyConnectionListeners();
      console.log('[MissionPulse] Supabase client initialized');
      return true;
    }
    console.warn('[MissionPulse] Supabase library not loaded - using demo mode');
    connectionStatus = 'demo';
    notifyConnectionListeners();
    return false;
  }

  function notifyConnectionListeners() {
    connectionListeners.forEach(cb => cb(connectionStatus));
  }

  function onConnectionChange(callback) {
    connectionListeners.push(callback);
    callback(connectionStatus);
    return () => {
      const idx = connectionListeners.indexOf(callback);
      if (idx > -1) connectionListeners.splice(idx, 1);
    };
  }

  function getConnectionStatus() {
    return connectionStatus;
  }

  // ============================================================
  // RETRY LOGIC
  // ============================================================
  
  async function withRetry(operation, attempts = RETRY_ATTEMPTS) {
    for (let i = 0; i < attempts; i++) {
      try {
        return await operation();
      } catch (error) {
        if (i === attempts - 1) throw error;
        console.warn(`[MissionPulse] Retry ${i + 1}/${attempts}:`, error.message);
        await new Promise(r => setTimeout(r, RETRY_DELAY_MS * (i + 1)));
      }
    }
  }

  // ============================================================
  // FIELD MAPPING
  // ============================================================
  
  function snakeToCamel(str) {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  }

  function camelToSnake(str) {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  function mapRecordToFrontend(record) {
    if (!record) return null;
    const mapped = {};
    Object.keys(record).forEach(key => {
      mapped[snakeToCamel(key)] = record[key];
    });
    return mapped;
  }

  function mapRecordToDatabase(data) {
    if (!data) return null;
    const mapped = {};
    Object.keys(data).forEach(key => {
      // Skip computed/derived fields
      if (['daysRemaining', 'phase'].includes(key)) return;
      mapped[camelToSnake(key)] = data[key];
    });
    return mapped;
  }

  // ============================================================
  // GENERIC CRUD FACTORY
  // ============================================================
  
  function createCrudOperations(tableName, demoKey) {
    return {
      /**
       * Fetch all records
       */
      async getAll(options = {}) {
        // Demo fallback
        if (connectionStatus === 'demo' || !supabase) {
          const data = DEMO_DATA[demoKey] || [];
          return { data: data.map(mapRecordToFrontend), error: null, isDemo: true };
        }

        try {
          return await withRetry(async () => {
            let query = supabase.from(tableName).select('*');
            
            if (options.orderBy) {
              query = query.order(options.orderBy, { ascending: options.ascending !== false });
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
            return { data: (data || []).map(mapRecordToFrontend), error: null, isDemo: false };
          });
        } catch (error) {
          console.error(`[MissionPulse] Error fetching ${tableName}:`, error);
          if (USE_DEMO_FALLBACK) {
            const data = DEMO_DATA[demoKey] || [];
            return { data: data.map(mapRecordToFrontend), error, isDemo: true };
          }
          return { data: null, error, isDemo: false };
        }
      },

      /**
       * Fetch single record by ID
       */
      async getById(id) {
        if (connectionStatus === 'demo' || !supabase) {
          const record = (DEMO_DATA[demoKey] || []).find(r => r.id === id);
          return { data: mapRecordToFrontend(record), error: null, isDemo: true };
        }

        try {
          return await withRetry(async () => {
            const { data, error } = await supabase
              .from(tableName)
              .select('*')
              .eq('id', id)
              .single();
            if (error) throw error;
            return { data: mapRecordToFrontend(data), error: null, isDemo: false };
          });
        } catch (error) {
          console.error(`[MissionPulse] Error fetching ${tableName} by ID:`, error);
          return { data: null, error, isDemo: false };
        }
      },

      /**
       * Fetch records by foreign key
       */
      async getByForeignKey(foreignKey, foreignValue) {
        if (connectionStatus === 'demo' || !supabase) {
          const data = (DEMO_DATA[demoKey] || []).filter(r => r[foreignKey] === foreignValue);
          return { data: data.map(mapRecordToFrontend), error: null, isDemo: true };
        }

        try {
          return await withRetry(async () => {
            const { data, error } = await supabase
              .from(tableName)
              .select('*')
              .eq(foreignKey, foreignValue);
            if (error) throw error;
            return { data: (data || []).map(mapRecordToFrontend), error: null, isDemo: false };
          });
        } catch (error) {
          console.error(`[MissionPulse] Error fetching ${tableName} by FK:`, error);
          if (USE_DEMO_FALLBACK) {
            const data = (DEMO_DATA[demoKey] || []).filter(r => r[foreignKey] === foreignValue);
            return { data: data.map(mapRecordToFrontend), error, isDemo: true };
          }
          return { data: null, error, isDemo: false };
        }
      },

      /**
       * Create new record
       */
      async create(recordData) {
        if (connectionStatus === 'demo' || !supabase) {
          const newRecord = { id: `demo-${Date.now()}`, ...recordData, created_at: new Date().toISOString() };
          DEMO_DATA[demoKey] = DEMO_DATA[demoKey] || [];
          DEMO_DATA[demoKey].push(newRecord);
          return { data: mapRecordToFrontend(newRecord), error: null, isDemo: true };
        }

        try {
          return await withRetry(async () => {
            const dbData = mapRecordToDatabase(recordData);
            delete dbData.id;
            dbData.created_at = new Date().toISOString();
            dbData.updated_at = new Date().toISOString();

            const { data, error } = await supabase
              .from(tableName)
              .insert([dbData])
              .select()
              .single();
            if (error) throw error;
            return { data: mapRecordToFrontend(data), error: null, isDemo: false };
          });
        } catch (error) {
          console.error(`[MissionPulse] Error creating ${tableName}:`, error);
          return { data: null, error, isDemo: false };
        }
      },

      /**
       * Update existing record
       */
      async update(id, updates) {
        if (connectionStatus === 'demo' || !supabase) {
          const idx = (DEMO_DATA[demoKey] || []).findIndex(r => r.id === id);
          if (idx > -1) {
            DEMO_DATA[demoKey][idx] = { ...DEMO_DATA[demoKey][idx], ...updates, updated_at: new Date().toISOString() };
            return { data: mapRecordToFrontend(DEMO_DATA[demoKey][idx]), error: null, isDemo: true };
          }
          return { data: null, error: new Error('Record not found'), isDemo: true };
        }

        try {
          return await withRetry(async () => {
            const dbData = mapRecordToDatabase(updates);
            dbData.updated_at = new Date().toISOString();

            const { data, error } = await supabase
              .from(tableName)
              .update(dbData)
              .eq('id', id)
              .select()
              .single();
            if (error) throw error;
            return { data: mapRecordToFrontend(data), error: null, isDemo: false };
          });
        } catch (error) {
          console.error(`[MissionPulse] Error updating ${tableName}:`, error);
          return { data: null, error, isDemo: false };
        }
      },

      /**
       * Delete record
       */
      async delete(id) {
        if (connectionStatus === 'demo' || !supabase) {
          const idx = (DEMO_DATA[demoKey] || []).findIndex(r => r.id === id);
          if (idx > -1) {
            DEMO_DATA[demoKey].splice(idx, 1);
            return { data: { success: true, id }, error: null, isDemo: true };
          }
          return { data: null, error: new Error('Record not found'), isDemo: true };
        }

        try {
          return await withRetry(async () => {
            const { error } = await supabase
              .from(tableName)
              .delete()
              .eq('id', id);
            if (error) throw error;
            return { data: { success: true, id }, error: null, isDemo: false };
          });
        } catch (error) {
          console.error(`[MissionPulse] Error deleting ${tableName}:`, error);
          return { data: null, error, isDemo: false };
        }
      }
    };
  }

  // ============================================================
  // TABLE-SPECIFIC CRUD INSTANCES
  // ============================================================
  
  const opportunities = createCrudOperations('opportunities', 'opportunities');
  const competitors = createCrudOperations('competitors', 'competitors');
  const teamingPartners = createCrudOperations('teaming_partners', 'teaming_partners');
  const teamAssignments = createCrudOperations('team_assignments', 'team_assignments');
  const users = createCrudOperations('users', 'users');
  const pricingItems = createCrudOperations('pricing_items', 'pricing_items');
  const complianceItems = createCrudOperations('compliance_items', 'compliance_items');
  const rfpRequirements = createCrudOperations('rfp_requirements', 'rfp_requirements');
  const proposalSections = createCrudOperations('proposal_sections', 'proposal_sections');
  const auditLogs = createCrudOperations('audit_logs', 'audit_logs');
  const lcatRates = createCrudOperations('lcat_rates', 'lcat_rates');
  const playbookItems = createCrudOperations('playbook_items', 'playbook_items');
  const oralsPresentations = createCrudOperations('orals_presentations', 'orals_presentations');
  const launchChecklist = createCrudOperations('launch_checklist', 'launch_checklist');

  // ============================================================
  // SPECIALIZED QUERIES
  // ============================================================
  
  /**
   * Get pipeline statistics
   */
  async function getPipelineStats() {
    const { data, error, isDemo } = await opportunities.getAll();
    if (error && !data) return { data: null, error, isDemo };

    const now = new Date();
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const stats = {
      totalCount: data.length,
      totalValue: data.reduce((sum, opp) => sum + (opp.estimatedValue || opp.contractValue || 0), 0),
      avgPwin: data.length > 0 
        ? Math.round(data.reduce((sum, opp) => sum + (opp.pwin || opp.winProbability || 0), 0) / data.length)
        : 0,
      dueThisMonth: data.filter(opp => {
        if (!opp.dueDate) return false;
        const dueDate = new Date(opp.dueDate);
        return dueDate >= now && dueDate <= monthEnd;
      }).length,
      byPhase: {},
      byPriority: { critical: 0, high: 0, medium: 0, low: 0 },
      byStatus: { active: 0, won: 0, lost: 0, 'no-bid': 0 }
    };

    data.forEach(opp => {
      const phase = opp.phase || opp.shipleyPhase || 'gate_1';
      if (!stats.byPhase[phase]) stats.byPhase[phase] = { count: 0, value: 0 };
      stats.byPhase[phase].count++;
      stats.byPhase[phase].value += opp.estimatedValue || opp.contractValue || 0;

      const priority = (opp.priority || 'medium').toLowerCase();
      if (stats.byPriority[priority] !== undefined) stats.byPriority[priority]++;

      const status = (opp.status || 'active').toLowerCase();
      if (stats.byStatus[status] !== undefined) stats.byStatus[status]++;
    });

    return { data: stats, error: null, isDemo };
  }

  /**
   * Get opportunities grouped by Shipley phase
   */
  async function getOpportunitiesByPhase() {
    const { data, error, isDemo } = await opportunities.getAll({ orderBy: 'due_date' });
    if (error && !data) return { data: null, error, isDemo };

    const PHASES = ['gate_1', 'blue_team', 'pink_team', 'red_team', 'gold_team', 'submitted', 'awarded', 'lost'];
    const grouped = {};
    PHASES.forEach(phase => {
      grouped[phase] = { phase, name: formatPhaseName(phase), items: [] };
    });

    data.forEach(opp => {
      const phase = opp.phase || opp.shipleyPhase || 'gate_1';
      if (grouped[phase]) grouped[phase].items.push(opp);
    });

    return { data: grouped, error: null, isDemo };
  }

  /**
   * Get full opportunity details with related data
   */
  async function getOpportunityWithDetails(opportunityId) {
    const [oppResult, compResult, partnerResult, teamResult, pricingResult, complianceResult, reqResult] = await Promise.all([
      opportunities.getById(opportunityId),
      competitors.getByForeignKey('opportunity_id', opportunityId),
      teamingPartners.getByForeignKey('opportunity_id', opportunityId),
      teamAssignments.getByForeignKey('opportunity_id', opportunityId),
      pricingItems.getByForeignKey('opportunity_id', opportunityId),
      complianceItems.getByForeignKey('opportunity_id', opportunityId),
      rfpRequirements.getByForeignKey('opportunity_id', opportunityId)
    ]);

    return {
      data: {
        opportunity: oppResult.data,
        competitors: compResult.data || [],
        partners: partnerResult.data || [],
        team: teamResult.data || [],
        pricing: pricingResult.data || [],
        compliance: complianceResult.data || [],
        requirements: reqResult.data || []
      },
      error: oppResult.error,
      isDemo: oppResult.isDemo
    };
  }

  // ============================================================
  // REAL-TIME SUBSCRIPTIONS
  // ============================================================
  
  function subscribeToTable(tableName, callback) {
    if (!supabase || connectionStatus === 'demo') {
      console.warn('[MissionPulse] Real-time not available in demo mode');
      return () => {};
    }

    const subscription = supabase
      .channel(`${tableName}-changes`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: tableName },
        (payload) => {
          callback({
            eventType: payload.eventType,
            new: mapRecordToFrontend(payload.new),
            old: mapRecordToFrontend(payload.old)
          });
        }
      )
      .subscribe();

    return () => subscription.unsubscribe();
  }

  // ============================================================
  // UTILITY FUNCTIONS
  // ============================================================
  
  function formatCurrency(value) {
    if (!value) return '$0';
    if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(0)}K`;
    return `$${value.toLocaleString()}`;
  }

  function formatPhaseName(phase) {
    const names = {
      'gate_1': 'Gate 1', 'blue_team': 'Blue Team', 'pink_team': 'Pink Team',
      'red_team': 'Red Team', 'gold_team': 'Gold Team', 'submitted': 'Submitted',
      'awarded': 'Awarded', 'lost': 'Lost'
    };
    return names[phase] || phase;
  }

  function getPhaseColor(phase) {
    const colors = {
      'gate_1': '#94a3b8', 'blue_team': '#60a5fa', 'pink_team': '#f472b6',
      'red_team': '#ef4444', 'gold_team': '#fbbf24', 'submitted': '#22c55e',
      'awarded': '#8b5cf6', 'lost': '#64748b'
    };
    return colors[phase] || '#94a3b8';
  }

  // ============================================================
  // EXPORT MissionPulse NAMESPACE
  // ============================================================
  
  global.MissionPulse = {
    // Connection
    init: initSupabase,
    getConnectionStatus,
    onConnectionChange,

    // Table CRUD
    opportunities,
    competitors,
    teamingPartners,
    teamAssignments,
    users,
    pricingItems,
    complianceItems,
    rfpRequirements,
    proposalSections,
    auditLogs,
    lcatRates,
    playbookItems,
    oralsPresentations,
    launchChecklist,

    // Specialized Queries
    getPipelineStats,
    getOpportunitiesByPhase,
    getOpportunityWithDetails,

    // Real-time
    subscribeToTable,

    // Utilities
    formatCurrency,
    formatPhaseName,
    getPhaseColor,
    mapRecordToFrontend,
    mapRecordToDatabase,

    // Demo data (for testing)
    DEMO_DATA
  };

  // Auto-initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(initSupabase, 100));
  } else {
    setTimeout(initSupabase, 100);
  }

})(typeof window !== 'undefined' ? window : global);
