/**
 * MissionPulse Supabase Client v2.1
 * Matched to ACTUAL database schema (Jan 29 audit)
 * 
 * © 2026 Mission Meets Tech
 * AI GENERATED - REQUIRES HUMAN REVIEW
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

  function initSupabase() {
    if (typeof global.supabase !== 'undefined' && global.supabase.createClient) {
      supabase = global.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      connectionStatus = 'connected';
      notifyConnectionListeners();
      console.log('[MissionPulse] Supabase client v2.1 initialized');
      return true;
    }
    console.warn('[MissionPulse] Supabase library not loaded');
    return false;
  }

  function notifyConnectionListeners() {
    connectionListeners.forEach(cb => cb(connectionStatus));
  }

  function ensureClient() {
    if (!supabase) {
      if (!initSupabase()) {
        throw new Error('Supabase not initialized');
      }
    }
    return supabase;
  }

  // ============================================================
  // GENERIC CRUD FACTORY
  // ============================================================
  function createCRUD(tableName) {
    return {
      async getAll(options = {}) {
        try {
          const client = ensureClient();
          let query = client.from(tableName).select(options.select || '*');
          
          if (options.filter) {
            Object.entries(options.filter).forEach(([key, value]) => {
              query = query.eq(key, value);
            });
          }
          if (options.orderBy) {
            query = query.order(options.orderBy, { ascending: options.ascending ?? true });
          }
          if (options.limit) {
            query = query.limit(options.limit);
          }
          
          const { data, error } = await query;
          if (error) throw error;
          
          return { data: data || [], error: null };
        } catch (error) {
          console.error(`[MissionPulse] Error fetching ${tableName}:`, error);
          return { data: [], error };
        }
      },

      async getById(id) {
        try {
          const client = ensureClient();
          const { data, error } = await client
            .from(tableName)
            .select('*')
            .eq('id', id)
            .single();
          
          if (error) throw error;
          return { data, error: null };
        } catch (error) {
          console.error(`[MissionPulse] Error fetching ${tableName} by id:`, error);
          return { data: null, error };
        }
      },

      async getByOpportunity(opportunityId, options = {}) {
        try {
          const client = ensureClient();
          let query = client
            .from(tableName)
            .select(options.select || '*')
            .eq('opportunity_id', opportunityId);
          
          if (options.orderBy) {
            query = query.order(options.orderBy, { ascending: options.ascending ?? true });
          }
          
          const { data, error } = await query;
          if (error) throw error;
          
          return { data: data || [], error: null };
        } catch (error) {
          console.error(`[MissionPulse] Error fetching ${tableName} by opportunity:`, error);
          return { data: [], error };
        }
      },

      async create(record) {
        try {
          const client = ensureClient();
          const dbRecord = { ...record };
          delete dbRecord.id;
          
          const { data, error } = await client
            .from(tableName)
            .insert([dbRecord])
            .select()
            .single();
          
          if (error) throw error;
          return { data, error: null };
        } catch (error) {
          console.error(`[MissionPulse] Error creating ${tableName}:`, error);
          return { data: null, error };
        }
      },

      async update(id, updates) {
        try {
          const client = ensureClient();
          const { data, error } = await client
            .from(tableName)
            .update(updates)
            .eq('id', id)
            .select()
            .single();
          
          if (error) throw error;
          return { data, error: null };
        } catch (error) {
          console.error(`[MissionPulse] Error updating ${tableName}:`, error);
          return { data: null, error };
        }
      },

      async delete(id) {
        try {
          const client = ensureClient();
          const { error } = await client
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

      async upsert(record, conflictColumns = ['id']) {
        try {
          const client = ensureClient();
          const { data, error } = await client
            .from(tableName)
            .upsert(record, { onConflict: conflictColumns.join(',') })
            .select()
            .single();
          
          if (error) throw error;
          return { data, error: null };
        } catch (error) {
          console.error(`[MissionPulse] Error upserting ${tableName}:`, error);
          return { data: null, error };
        }
      },

      subscribe(callback, filter = {}) {
        try {
          const client = ensureClient();
          const channel = client
            .channel(`${tableName}-changes-${Date.now()}`)
            .on('postgres_changes',
              { event: '*', schema: 'public', table: tableName, ...filter },
              (payload) => {
                callback({
                  eventType: payload.eventType,
                  new: payload.new,
                  old: payload.old
                });
              }
            )
            .subscribe();
          
          return () => channel.unsubscribe();
        } catch (error) {
          console.error(`[MissionPulse] Error subscribing to ${tableName}:`, error);
          return () => {};
        }
      }
    };
  }

  // ============================================================
  // TABLE CRUD INSTANCES (Matching actual schema)
  // ============================================================
  
  // Core tables
  const opportunities = createCRUD('opportunities');
  const users = createCRUD('users');
  const profiles = createCRUD('profiles');
  const companies = createCRUD('companies');
  
  // Team & Assignments
  const teamAssignments = createCRUD('team_assignments');
  const teamMembers = createCRUD('team_members');
  const opportunityAssignments = createCRUD('opportunity_assignments');
  
  // Competitive Intel
  const competitors = createCRUD('competitors');
  const competitorGhosts = createCRUD('competitor_ghosts');
  const competitorIntelHistory = createCRUD('competitor_intel_history');
  
  // Partners & Teaming
  const partners = createCRUD('partners');
  const partnerAccess = createCRUD('partner_access');
  const teamingPartners = createCRUD('teaming_partners');
  const teamingPartnerContacts = createCRUD('teaming_partner_contacts');
  const teamingPartnerCapabilities = createCRUD('teaming_partner_capabilities');
  
  // Compliance & Contracts
  const complianceItems = createCRUD('compliance_items');
  const complianceChecklists = createCRUD('compliance_checklists');
  const complianceChecklistItems = createCRUD('compliance_checklist_items');
  const complianceRequirements = createCRUD('compliance_requirements');
  const contractClauses = createCRUD('contract_clauses');
  const contracts = createCRUD('contracts');
  
  // Pricing & BOE
  const pricingItems = createCRUD('pricing_items');
  const pricingModels = createCRUD('pricing_models');
  const laborCategories = createCRUD('labor_categories');
  const opportunityBoe = createCRUD('opportunity_boe');
  const priceToWin = createCRUD('price_to_win');
  
  // AI & HITL
  const aiApprovals = createCRUD('ai_approvals');
  const aiInteractions = createCRUD('ai_interactions');
  const hitlQueue = createCRUD('hitl_queue');
  const hitlReviews = createCRUD('hitl_reviews');
  const agentConversations = createCRUD('agent_conversations');
  const agentOutputs = createCRUD('agent_outputs');
  
  // Orals & Reviews
  const oralsDecks = createCRUD('orals_decks');
  const oralsSessions = createCRUD('orals_sessions');
  const oralsQuestions = createCRUD('orals_questions');
  const colorTeamReviews = createCRUD('color_team_reviews');
  const reviewComments = createCRUD('review_comments');
  const reviewAssignments = createCRUD('review_assignments');
  
  // Playbook & Lessons
  const playbookItems = createCRUD('playbook_items');
  const playbookLessons = createCRUD('playbook_lessons');
  const lessonsLearned = createCRUD('lessons_learned');
  
  // Launch & Post-Award
  const launchChecklists = createCRUD('launch_checklists');
  const launchChecklistItems = createCRUD('launch_checklist_items');
  const postAwardActions = createCRUD('post_award_actions');
  const submissions = createCRUD('submissions');
  
  // Documents & Files
  const proposalDocuments = createCRUD('proposal_documents');
  const rfpDocuments = createCRUD('rfp_documents');
  const fileAttachments = createCRUD('file_attachments');
  
  // Proposal Structure
  const proposalSections = createCRUD('proposal_sections');
  const proposalOutlines = createCRUD('proposal_outlines');
  const outlineSections = createCRUD('outline_sections');
  const proposalMilestones = createCRUD('proposal_milestones');
  const sectionVersions = createCRUD('section_versions');
  
  // Strategy & Themes
  const winThemes = createCRUD('win_themes');
  const discriminators = createCRUD('discriminators');
  const risks = createCRUD('risks');
  const riskMitigations = createCRUD('risk_mitigations');
  const gateReviews = createCRUD('gate_reviews');
  
  // Intel & Knowledge
  const intelCollection = createCRUD('intel_collection');
  const intelRecordings = createCRUD('intel_recordings');
  const knowledgeDocuments = createCRUD('knowledge_documents');
  const knowledgeChunks = createCRUD('knowledge_chunks');
  
  // RFP & Amendments
  const rfpAmendments = createCRUD('rfp_amendments');
  const amendmentImpacts = createCRUD('amendment_impacts');
  const governmentQuestions = createCRUD('government_questions');
  
  // Audit & Logs
  const auditLogs = createCRUD('audit_logs');
  const activityLog = createCRUD('activity_log');
  const chatHistory = createCRUD('chat_history');
  
  // Admin & Config
  const notifications = createCRUD('notifications');
  const invitations = createCRUD('invitations');
  const integrations = createCRUD('integrations');
  const featureSuggestions = createCRUD('feature_suggestions');

  // ============================================================
  // SPECIALIZED QUERIES
  // ============================================================
  
  // Pipeline Statistics
  async function getPipelineStats() {
    const { data, error } = await opportunities.getAll();
    if (error) return { data: null, error };
    
    const now = new Date();
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const stats = {
      totalCount: data.length,
      totalValue: data.reduce((sum, opp) => sum + (parseFloat(opp.contract_value) || parseFloat(opp.estimated_value) || 0), 0),
      avgPwin: data.length > 0 
        ? Math.round(data.reduce((sum, opp) => sum + (opp.win_probability || opp.pwin || 0), 0) / data.length)
        : 0,
      dueThisMonth: data.filter(opp => {
        const dueDate = opp.due_date || opp.proposal_due;
        if (!dueDate) return false;
        const due = new Date(dueDate);
        return due >= now && due <= monthEnd;
      }).length,
      byPhase: {},
      byAgency: {},
      byPriority: {}
    };
    
    data.forEach(opp => {
      const phase = opp.shipley_phase || opp.phase || 'gate_1';
      const value = parseFloat(opp.contract_value) || parseFloat(opp.estimated_value) || 0;
      
      if (!stats.byPhase[phase]) stats.byPhase[phase] = { count: 0, value: 0 };
      stats.byPhase[phase].count++;
      stats.byPhase[phase].value += value;
      
      const agency = opp.agency || 'Unknown';
      if (!stats.byAgency[agency]) stats.byAgency[agency] = { count: 0, value: 0 };
      stats.byAgency[agency].count++;
      stats.byAgency[agency].value += value;
      
      const priority = opp.priority || 'P-2';
      if (!stats.byPriority[priority]) stats.byPriority[priority] = { count: 0, value: 0 };
      stats.byPriority[priority].count++;
      stats.byPriority[priority].value += value;
    });
    
    return { data: stats, error: null };
  }

  // Opportunities by Phase (for Swimlane/Kanban)
  async function getOpportunitiesByPhase() {
    const { data, error } = await opportunities.getAll({ orderBy: 'due_date' });
    if (error) return { data: null, error };
    
    const PHASES = ['gate_1', 'blue_team', 'pink_team', 'red_team', 'gold_team', 'submitted', 'awarded', 'lost'];
    const grouped = {};
    
    PHASES.forEach(phase => {
      grouped[phase] = {
        phase,
        name: phase.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        items: []
      };
    });
    
    data.forEach(opp => {
      const phase = (opp.shipley_phase || opp.phase || 'gate_1').toLowerCase().replace(/ /g, '_');
      if (grouped[phase]) {
        grouped[phase].items.push(opp);
      } else {
        grouped['gate_1'].items.push(opp);
      }
    });
    
    return { data: grouped, error: null };
  }

  // HITL Pending Approvals
  async function getPendingApprovals(options = {}) {
    return aiApprovals.getAll({
      filter: { status: 'pending' },
      orderBy: 'created_at',
      ascending: false,
      ...options
    });
  }

  // Compliance Summary by Opportunity
  async function getComplianceSummary(opportunityId) {
    const { data, error } = await complianceItems.getByOpportunity(opportunityId);
    if (error) return { data: null, error };
    
    const summary = {
      total: data.length,
      compliant: data.filter(r => r.status === 'compliant' || r.status === 'complete').length,
      partial: data.filter(r => r.status === 'partial' || r.status === 'in_progress').length,
      pending: data.filter(r => r.status === 'pending' || r.status === 'not_started').length,
      highRisk: data.filter(r => r.confidence && r.confidence < 50).length,
      items: data,
      bySection: {}
    };
    
    summary.complianceScore = summary.total > 0 
      ? Math.round((summary.compliant / summary.total) * 100)
      : 0;
    
    data.forEach(item => {
      const section = item.section || 'Other';
      if (!summary.bySection[section]) summary.bySection[section] = { total: 0, compliant: 0 };
      summary.bySection[section].total++;
      if (item.status === 'compliant' || item.status === 'complete') {
        summary.bySection[section].compliant++;
      }
    });
    
    return { data: summary, error: null };
  }

  // Pricing Rollup
  async function getPricingRollup(opportunityId) {
    const { data, error } = await pricingItems.getByOpportunity(opportunityId);
    if (error) return { data: null, error };
    
    const rollup = {
      items: data,
      totalHours: 0,
      totalCost: 0,
      byYear: {},
      byLaborCategory: {}
    };
    
    data.forEach(item => {
      const hours = item.hours || 0;
      const rate = parseFloat(item.rate) || 0;
      const cost = hours * rate;
      
      rollup.totalHours += hours;
      rollup.totalCost += cost;
      
      // Group by Year
      const year = item.year || 'Base';
      if (!rollup.byYear[year]) rollup.byYear[year] = { hours: 0, cost: 0 };
      rollup.byYear[year].hours += hours;
      rollup.byYear[year].cost += cost;
      
      // Group by Labor Category
      const lcat = item.labor_category || 'Other';
      if (!rollup.byLaborCategory[lcat]) rollup.byLaborCategory[lcat] = { hours: 0, cost: 0 };
      rollup.byLaborCategory[lcat].hours += hours;
      rollup.byLaborCategory[lcat].cost += cost;
    });
    
    return { data: rollup, error: null };
  }

  // Team Roster by Opportunity
  async function getTeamRoster(opportunityId) {
    try {
      const client = ensureClient();
      const { data, error } = await client
        .from('team_assignments')
        .select('*')
        .eq('opportunity_id', opportunityId)
        .order('role');
      
      if (error) throw error;
      return { data: data || [], error: null };
    } catch (error) {
      console.error('[MissionPulse] Error fetching team roster:', error);
      return { data: [], error };
    }
  }

  // Competitor Analysis
  async function getCompetitorAnalysis(opportunityId) {
    const { data, error } = await competitors.getByOpportunity(opportunityId);
    if (error) return { data: null, error };
    
    const analysis = {
      competitors: data,
      threatMatrix: {
        high: data.filter(c => c.threat_level === 'high' || c.threat_level === 'High'),
        medium: data.filter(c => c.threat_level === 'medium' || c.threat_level === 'Medium'),
        low: data.filter(c => c.threat_level === 'low' || c.threat_level === 'Low')
      },
      incumbents: data.filter(c => c.incumbent === true),
      totalCompetitors: data.length
    };
    
    return { data: analysis, error: null };
  }

  // Audit Trail
  async function logAudit(action, resourceType, resourceId, details = {}, userId = null) {
    return auditLogs.create({
      user_id: userId,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      details,
      module: details.module || 'unknown'
    });
  }

  // Golden Examples from Playbook
  async function getGoldenExamples(category = null, limit = 5) {
    try {
      const client = ensureClient();
      let query = client
        .from('playbook_items')
        .select('*')
        .order('score', { ascending: false })
        .limit(limit);
      
      if (category) {
        query = query.eq('category', category);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return { data: data || [], error: null };
    } catch (error) {
      console.error('[MissionPulse] Error fetching golden examples:', error);
      return { data: [], error };
    }
  }

  // ============================================================
  // UTILITIES
  // ============================================================
  function formatCurrency(value) {
    if (!value) return '$0';
    const num = parseFloat(value);
    if (num >= 1000000000) return `$${(num / 1000000000).toFixed(1)}B`;
    if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `$${(num / 1000).toFixed(0)}K`;
    return `$${num.toLocaleString()}`;
  }

  function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  function calculateDaysRemaining(dueDate) {
    if (!dueDate) return null;
    const due = new Date(dueDate);
    const today = new Date();
    return Math.ceil((due - today) / (1000 * 60 * 60 * 24));
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

  function getPhaseInfo(phaseKey) {
    const key = (phaseKey || 'gate_1').toLowerCase().replace(/ /g, '_');
    return SHIPLEY_PHASES[key] || SHIPLEY_PHASES.gate_1;
  }

  function getShipleyPhases() {
    return Object.entries(SHIPLEY_PHASES)
      .map(([key, value]) => ({ key, ...value }))
      .sort((a, b) => a.order - b.order);
  }

  // Connection management
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
  // EXPORT MissionPulse NAMESPACE
  // ============================================================
  global.MissionPulse = {
    // Core tables
    opportunities,
    users,
    profiles,
    companies,

    // Team & Assignments
    teamAssignments,
    teamMembers,
    opportunityAssignments,

    // Competitive Intel
    competitors,
    competitorGhosts,
    competitorIntelHistory,

    // Partners & Teaming
    partners,
    partnerAccess,
    teamingPartners,
    teamingPartnerContacts,
    teamingPartnerCapabilities,

    // Compliance & Contracts
    complianceItems,
    complianceChecklists,
    complianceChecklistItems,
    complianceRequirements,
    contractClauses,
    contracts,

    // Pricing & BOE
    pricingItems,
    pricingModels,
    laborCategories,
    opportunityBoe,
    priceToWin,

    // AI & HITL
    aiApprovals,
    aiInteractions,
    hitlQueue,
    hitlReviews,
    agentConversations,
    agentOutputs,

    // Orals & Reviews
    oralsDecks,
    oralsSessions,
    oralsQuestions,
    colorTeamReviews,
    reviewComments,
    reviewAssignments,

    // Playbook & Lessons
    playbookItems,
    playbookLessons,
    lessonsLearned,

    // Launch & Post-Award
    launchChecklists,
    launchChecklistItems,
    postAwardActions,
    submissions,

    // Documents & Files
    proposalDocuments,
    rfpDocuments,
    fileAttachments,

    // Proposal Structure
    proposalSections,
    proposalOutlines,
    outlineSections,
    proposalMilestones,
    sectionVersions,

    // Strategy & Themes
    winThemes,
    discriminators,
    risks,
    riskMitigations,
    gateReviews,

    // Intel & Knowledge
    intelCollection,
    intelRecordings,
    knowledgeDocuments,
    knowledgeChunks,

    // RFP & Amendments
    rfpAmendments,
    amendmentImpacts,
    governmentQuestions,

    // Audit & Logs
    auditLogs,
    activityLog,
    chatHistory,

    // Admin & Config
    notifications,
    invitations,
    integrations,
    featureSuggestions,

    // Specialized queries
    getPipelineStats,
    getOpportunitiesByPhase,
    getPendingApprovals,
    getComplianceSummary,
    getPricingRollup,
    getTeamRoster,
    getCompetitorAnalysis,
    getGoldenExamples,
    logAudit,

    // Legacy compatibility
    getOpportunities: () => opportunities.getAll({ orderBy: 'due_date' }),
    createOpportunity: (data) => opportunities.create(data),
    updateOpportunity: (id, data) => opportunities.update(id, data),
    deleteOpportunity: (id) => opportunities.delete(id),
    subscribeToOpportunities: (cb) => opportunities.subscribe(cb),

    // Utilities
    formatCurrency,
    formatDate,
    calculateDaysRemaining,
    getPhaseInfo,
    getShipleyPhases,
    SHIPLEY_PHASES,

    // Connection
    onConnectionChange,
    getConnectionStatus,
    init: initSupabase
  };

  // Auto-initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(initSupabase, 100));
  } else {
    setTimeout(initSupabase, 100);
  }

})(typeof window !== 'undefined' ? window : global);
