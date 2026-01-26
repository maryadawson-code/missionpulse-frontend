// ═══════════════════════════════════════════════════════════════
// MISSIONPULSE SUPABASE CLIENT MODULE v1.0
// Shared database connectivity for all frontend pages
// © 2026 Mission Meets Tech
// ═══════════════════════════════════════════════════════════════

(function(global) {
  'use strict';

  // ─────────────────────────────────────────────────────────────
  // CONFIGURATION
  // ─────────────────────────────────────────────────────────────
  const CONFIG = {
    SUPABASE_URL: 'https://djuviwarqdvlbgcfuupa.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqdXZpd2FycWR2bGJnY2Z1dXBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NDQ0NjUsImV4cCI6MjA4NTAyMDQ2NX0.3s8ufDDN2aWfkW0RBsAyJyacb2tjB7M550WSFIohHcA',
    DEFAULT_COMPANY_ID: '11111111-1111-1111-1111-111111111111',
    DEBUG: false
  };

  // ─────────────────────────────────────────────────────────────
  // SUPABASE CLIENT INITIALIZATION
  // ─────────────────────────────────────────────────────────────
  let client = null;

  function getClient() {
    if (!client) {
      if (typeof supabase === 'undefined') {
        throw new Error('Supabase JS library not loaded. Include the CDN script first.');
      }
      client = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
      if (CONFIG.DEBUG) console.log('[MissionPulse] Supabase client initialized');
    }
    return client;
  }

  // ─────────────────────────────────────────────────────────────
  // UTILITY FUNCTIONS
  // ─────────────────────────────────────────────────────────────
  
  function calculateDaysRemaining(dueDate) {
    if (!dueDate) return null;
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }

  function formatCurrency(value) {
    if (!value) return '$0';
    if (value >= 1000000000) return '$' + (value / 1000000000).toFixed(1) + 'B';
    if (value >= 1000000) return '$' + (value / 1000000).toFixed(1) + 'M';
    if (value >= 1000) return '$' + (value / 1000).toFixed(0) + 'K';
    return '$' + value.toLocaleString();
  }

  function formatDate(dateStr) {
    if (!dateStr) return 'TBD';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function log(message, data) {
    if (CONFIG.DEBUG) {
      console.log(`[MissionPulse] ${message}`, data || '');
    }
  }

  function handleError(operation, error) {
    console.error(`[MissionPulse] ${operation} failed:`, error);
    return { data: null, error: error.message || 'Unknown error occurred' };
  }

  // ─────────────────────────────────────────────────────────────
  // FIELD MAPPING: Database → Frontend
  // ─────────────────────────────────────────────────────────────
  
  function mapOpportunityFromDB(dbRow) {
    return {
      id: dbRow.id,
      name: dbRow.title,
      nickname: dbRow.nickname || dbRow.title,
      description: dbRow.description,
      agency: dbRow.agency,
      solicitation: dbRow.solicitation_number,
      ceiling: dbRow.estimated_value,
      ceilingFormatted: formatCurrency(dbRow.estimated_value),
      contractType: dbRow.contract_type,
      phase: dbRow.phase,
      pWin: dbRow.pwin,
      priority: dbRow.priority,
      goNoGo: dbRow.go_no_go,
      dueDate: dbRow.proposal_due,
      daysRemaining: calculateDaysRemaining(dbRow.proposal_due),
      naicsCode: dbRow.naics_code,
      setAside: dbRow.set_aside,
      periodOfPerformance: dbRow.period_of_performance,
      releaseDate: dbRow.release_date,
      currentGate: dbRow.current_gate,
      isArchived: dbRow.is_archived,
      createdAt: dbRow.created_at,
      _raw: CONFIG.DEBUG ? dbRow : undefined
    };
  }

  function mapOpportunityToDB(frontendObj) {
    const dbObj = {};
    if (frontendObj.name !== undefined) dbObj.title = frontendObj.name;
    if (frontendObj.nickname !== undefined) dbObj.nickname = frontendObj.nickname;
    if (frontendObj.description !== undefined) dbObj.description = frontendObj.description;
    if (frontendObj.agency !== undefined) dbObj.agency = frontendObj.agency;
    if (frontendObj.solicitation !== undefined) dbObj.solicitation_number = frontendObj.solicitation;
    if (frontendObj.ceiling !== undefined) dbObj.estimated_value = frontendObj.ceiling;
    if (frontendObj.contractType !== undefined) dbObj.contract_type = frontendObj.contractType;
    if (frontendObj.phase !== undefined) dbObj.phase = frontendObj.phase;
    if (frontendObj.pWin !== undefined) dbObj.pwin = frontendObj.pWin;
    if (frontendObj.priority !== undefined) dbObj.priority = frontendObj.priority;
    if (frontendObj.goNoGo !== undefined) dbObj.go_no_go = frontendObj.goNoGo;
    if (frontendObj.dueDate !== undefined) dbObj.proposal_due = frontendObj.dueDate;
    if (frontendObj.naicsCode !== undefined) dbObj.naics_code = frontendObj.naicsCode;
    if (frontendObj.setAside !== undefined) dbObj.set_aside = frontendObj.setAside;
    if (frontendObj.isArchived !== undefined) dbObj.is_archived = frontendObj.isArchived;
    return dbObj;
  }

  function mapUserFromDB(dbRow) {
    return {
      id: dbRow.id,
      email: dbRow.email,
      fullName: dbRow.full_name,
      roleId: dbRow.role_id,
      avatarUrl: dbRow.avatar_url,
      isActive: dbRow.is_active,
      companyId: dbRow.company_id
    };
  }

  function mapCompetitorFromDB(dbRow) {
    return {
      id: dbRow.id,
      opportunityId: dbRow.opportunity_id,
      companyName: dbRow.company_name,
      threatLevel: dbRow.threat_level,
      isIncumbent: dbRow.incumbent,
      strengths: dbRow.strengths || [],
      weaknesses: dbRow.weaknesses || [],
      ghostStrategy: dbRow.ghost_strategy,
      confidenceScore: dbRow.confidence_score
    };
  }

  function mapComplianceFromDB(dbRow) {
    return {
      id: dbRow.id,
      opportunityId: dbRow.opportunity_id,
      pwsReference: dbRow.pws_reference,
      requirementText: dbRow.requirement_text,
      status: dbRow.status,
      riskLevel: dbRow.risk_level,
      assignedTo: dbRow.assigned_to,
      sectionAssignment: dbRow.section_assignment,
      responseOutline: dbRow.response_outline,
      proofPoints: dbRow.proof_points || [],
      dueDate: dbRow.due_date
    };
  }

  function mapPartnerFromDB(dbRow) {
    return {
      id: dbRow.id,
      partnerName: dbRow.partner_name,
      partnerType: dbRow.partner_type,
      contactName: dbRow.contact_name,
      contactEmail: dbRow.contact_email,
      socioeconomicStatus: dbRow.socioeconomic_status || [],
      capabilities: dbRow.capabilities || [],
      trustScore: dbRow.trust_score,
      ndaStatus: dbRow.nda_status,
      teamingAgreementStatus: dbRow.teaming_agreement_status
    };
  }

  function mapLessonFromDB(dbRow) {
    return {
      id: dbRow.id,
      opportunityId: dbRow.opportunity_id,
      category: dbRow.category,
      title: dbRow.title,
      lessonText: dbRow.lesson_text,
      context: dbRow.context,
      outcome: dbRow.outcome,
      impactScore: dbRow.impact_score,
      isGoldenExample: dbRow.is_golden_example,
      tags: dbRow.tags || [],
      createdBy: dbRow.created_by,
      createdAt: dbRow.created_at
    };
  }

  // ─────────────────────────────────────────────────────────────
  // CRUD: OPPORTUNITIES
  // ─────────────────────────────────────────────────────────────
  
  async function getOpportunities(options = {}) {
    try {
      let query = getClient().from('opportunities').select('*');
      
      if (!options.includeArchived) {
        query = query.eq('is_archived', false);
      }
      if (options.phase) {
        query = query.eq('phase', options.phase);
      }
      if (options.companyId) {
        query = query.eq('company_id', options.companyId);
      }
      
      query = query.order(options.orderBy || 'estimated_value', { 
        ascending: options.ascending || false 
      });
      
      if (options.limit) {
        query = query.limit(options.limit);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      log('Fetched opportunities', { count: data.length });
      return { data: data.map(mapOpportunityFromDB), error: null };
    } catch (error) {
      return handleError('getOpportunities', error);
    }
  }

  async function getOpportunityById(id) {
    try {
      const { data, error } = await getClient()
        .from('opportunities')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return { data: mapOpportunityFromDB(data), error: null };
    } catch (error) {
      return handleError('getOpportunityById', error);
    }
  }

  async function createOpportunity(opportunity) {
    try {
      const dbData = mapOpportunityToDB(opportunity);
      dbData.company_id = opportunity.companyId || CONFIG.DEFAULT_COMPANY_ID;
      
      const { data, error } = await getClient()
        .from('opportunities')
        .insert(dbData)
        .select()
        .single();
      
      if (error) throw error;
      log('Created opportunity', data.id);
      return { data: mapOpportunityFromDB(data), error: null };
    } catch (error) {
      return handleError('createOpportunity', error);
    }
  }

  async function updateOpportunity(id, updates) {
    try {
      const dbData = mapOpportunityToDB(updates);
      
      const { data, error } = await getClient()
        .from('opportunities')
        .update(dbData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      log('Updated opportunity', id);
      return { data: mapOpportunityFromDB(data), error: null };
    } catch (error) {
      return handleError('updateOpportunity', error);
    }
  }

  async function deleteOpportunity(id, soft = true) {
    try {
      if (soft) {
        return updateOpportunity(id, { isArchived: true });
      }
      
      const { error } = await getClient()
        .from('opportunities')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      log('Deleted opportunity', id);
      return { data: { id }, error: null };
    } catch (error) {
      return handleError('deleteOpportunity', error);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // CRUD: USERS
  // ─────────────────────────────────────────────────────────────
  
  async function getUsers(options = {}) {
    try {
      let query = getClient()
        .from('users')
        .select('*')
        .eq('is_active', true);
      
      if (options.roleId) {
        query = query.eq('role_id', options.roleId);
      }
      if (options.companyId) {
        query = query.eq('company_id', options.companyId);
      }
      
      const { data, error } = await query.order('full_name');
      if (error) throw error;
      
      return { data: data.map(mapUserFromDB), error: null };
    } catch (error) {
      return handleError('getUsers', error);
    }
  }

  async function getUserByEmail(email) {
    try {
      const { data, error } = await getClient()
        .from('users')
        .select('*')
        .eq('email', email)
        .single();
      
      if (error) throw error;
      return { data: mapUserFromDB(data), error: null };
    } catch (error) {
      return handleError('getUserByEmail', error);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // CRUD: COMPETITORS
  // ─────────────────────────────────────────────────────────────
  
  async function getCompetitors(opportunityId) {
    try {
      const { data, error } = await getClient()
        .from('competitors')
        .select('*')
        .eq('opportunity_id', opportunityId)
        .order('threat_level', { ascending: false });
      
      if (error) throw error;
      return { data: data.map(mapCompetitorFromDB), error: null };
    } catch (error) {
      return handleError('getCompetitors', error);
    }
  }

  async function createCompetitor(competitor) {
    try {
      const { data, error } = await getClient()
        .from('competitors')
        .insert({
          opportunity_id: competitor.opportunityId,
          company_name: competitor.companyName,
          threat_level: competitor.threatLevel || 'Medium',
          incumbent: competitor.isIncumbent || false,
          strengths: competitor.strengths || [],
          weaknesses: competitor.weaknesses || [],
          ghost_strategy: competitor.ghostStrategy
        })
        .select()
        .single();
      
      if (error) throw error;
      return { data: mapCompetitorFromDB(data), error: null };
    } catch (error) {
      return handleError('createCompetitor', error);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // CRUD: COMPLIANCE
  // ─────────────────────────────────────────────────────────────
  
  async function getComplianceRequirements(opportunityId) {
    try {
      const { data, error } = await getClient()
        .from('compliance_requirements')
        .select('*')
        .eq('opportunity_id', opportunityId)
        .order('pws_reference');
      
      if (error) throw error;
      return { data: data.map(mapComplianceFromDB), error: null };
    } catch (error) {
      return handleError('getComplianceRequirements', error);
    }
  }

  async function updateComplianceStatus(id, status, riskLevel) {
    try {
      const updateData = { status };
      if (riskLevel) updateData.risk_level = riskLevel;
      
      const { data, error } = await getClient()
        .from('compliance_requirements')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return { data: mapComplianceFromDB(data), error: null };
    } catch (error) {
      return handleError('updateComplianceStatus', error);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // CRUD: PARTNERS
  // ─────────────────────────────────────────────────────────────
  
  async function getPartners(companyId) {
    try {
      const { data, error } = await getClient()
        .from('partners')
        .select('*')
        .eq('company_id', companyId || CONFIG.DEFAULT_COMPANY_ID)
        .order('trust_score', { ascending: false });
      
      if (error) throw error;
      return { data: data.map(mapPartnerFromDB), error: null };
    } catch (error) {
      return handleError('getPartners', error);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // CRUD: PLAYBOOK LESSONS
  // ─────────────────────────────────────────────────────────────
  
  async function getPlaybookLessons(options = {}) {
    try {
      let query = getClient()
        .from('playbook_lessons')
        .select('*')
        .eq('company_id', options.companyId || CONFIG.DEFAULT_COMPANY_ID);
      
      if (options.category) {
        query = query.eq('category', options.category);
      }
      if (options.goldenOnly) {
        query = query.eq('is_golden_example', true);
      }
      if (options.opportunityId) {
        query = query.eq('opportunity_id', options.opportunityId);
      }
      
      const { data, error } = await query.order('impact_score', { ascending: false });
      if (error) throw error;
      
      return { data: data.map(mapLessonFromDB), error: null };
    } catch (error) {
      return handleError('getPlaybookLessons', error);
    }
  }

  async function createPlaybookLesson(lesson) {
    try {
      const { data, error } = await getClient()
        .from('playbook_lessons')
        .insert({
          company_id: lesson.companyId || CONFIG.DEFAULT_COMPANY_ID,
          opportunity_id: lesson.opportunityId,
          category: lesson.category,
          title: lesson.title,
          lesson_text: lesson.lessonText,
          context: lesson.context,
          outcome: lesson.outcome,
          impact_score: lesson.impactScore || 5,
          is_golden_example: lesson.isGoldenExample || false,
          tags: lesson.tags || [],
          created_by: lesson.createdBy
        })
        .select()
        .single();
      
      if (error) throw error;
      return { data: mapLessonFromDB(data), error: null };
    } catch (error) {
      return handleError('createPlaybookLesson', error);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // CRUD: GATE REVIEWS
  // ─────────────────────────────────────────────────────────────
  
  async function getGateReviews(opportunityId) {
    try {
      const { data, error } = await getClient()
        .from('gate_reviews')
        .select('*')
        .eq('opportunity_id', opportunityId)
        .order('gate_number');
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return handleError('getGateReviews', error);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // CRUD: TEAM MEMBERS
  // ─────────────────────────────────────────────────────────────
  
  async function getTeamMembers(opportunityId) {
    try {
      const { data, error } = await getClient()
        .from('team_members')
        .select('*, users(full_name, email)')
        .eq('opportunity_id', opportunityId)
        .order('is_key_personnel', { ascending: false });
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return handleError('getTeamMembers', error);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // AGGREGATE QUERIES
  // ─────────────────────────────────────────────────────────────
  
  async function getPipelineStats(companyId) {
    try {
      const { data: opportunities, error } = await getClient()
        .from('opportunities')
        .select('estimated_value, pwin, phase, is_archived, priority')
        .eq('is_archived', false);
      
      if (error) throw error;
      
      const stats = {
        totalOpportunities: opportunities.length,
        totalValue: opportunities.reduce((sum, o) => sum + (o.estimated_value || 0), 0),
        totalValueFormatted: '',
        activeCount: opportunities.filter(o => !['Won', 'Lost'].includes(o.phase)).length,
        avgPwin: opportunities.length > 0 
          ? Math.round(opportunities.reduce((sum, o) => sum + (o.pwin || 0), 0) / opportunities.length)
          : 0,
        byPhase: {},
        byPriority: {},
        highValueCount: opportunities.filter(o => o.estimated_value >= 50000000).length
      };
      
      stats.totalValueFormatted = formatCurrency(stats.totalValue);
      
      opportunities.forEach(o => {
        stats.byPhase[o.phase] = (stats.byPhase[o.phase] || 0) + 1;
        stats.byPriority[o.priority] = (stats.byPriority[o.priority] || 0) + 1;
      });
      
      return { data: stats, error: null };
    } catch (error) {
      return handleError('getPipelineStats', error);
    }
  }

  async function getComplianceStats(opportunityId) {
    try {
      const { data: requirements, error } = await getClient()
        .from('compliance_requirements')
        .select('status, risk_level')
        .eq('opportunity_id', opportunityId);
      
      if (error) throw error;
      
      const total = requirements.length;
      const stats = {
        total,
        compliant: requirements.filter(r => r.status === 'Compliant').length,
        partial: requirements.filter(r => r.status === 'Partial').length,
        highRisk: requirements.filter(r => r.status === 'High Risk').length,
        inProgress: requirements.filter(r => r.status === 'In Progress').length,
        notStarted: requirements.filter(r => r.status === 'Not Started').length,
        complianceRate: 0,
        riskBreakdown: {
          green: requirements.filter(r => r.risk_level === 'Green').length,
          yellow: requirements.filter(r => r.risk_level === 'Yellow').length,
          red: requirements.filter(r => r.risk_level === 'Red').length
        }
      };
      
      stats.complianceRate = total > 0 ? Math.round((stats.compliant / total) * 100) : 0;
      
      return { data: stats, error: null };
    } catch (error) {
      return handleError('getComplianceStats', error);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // REAL-TIME SUBSCRIPTIONS
  // ─────────────────────────────────────────────────────────────
  
  function subscribeToOpportunities(callback) {
    const channel = getClient()
      .channel('opportunities-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'opportunities' },
        (payload) => {
          log('Realtime update', payload);
          callback(payload);
        }
      )
      .subscribe();
    
    return () => {
      channel.unsubscribe();
    };
  }

  function subscribeToTable(tableName, callback) {
    const channel = getClient()
      .channel(`${tableName}-changes`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: tableName },
        (payload) => {
          log(`Realtime update on ${tableName}`, payload);
          callback(payload);
        }
      )
      .subscribe();
    
    return () => {
      channel.unsubscribe();
    };
  }

  // ─────────────────────────────────────────────────────────────
  // ACTIVITY LOGGING
  // ─────────────────────────────────────────────────────────────
  
  async function logActivity(actionType, entityType, entityId, metadata = {}) {
    try {
      await getClient()
        .from('activity_log')
        .insert({
          company_id: CONFIG.DEFAULT_COMPANY_ID,
          action_type: actionType,
          entity_type: entityType,
          entity_id: entityId,
          metadata
        });
    } catch (error) {
      console.warn('[MissionPulse] Activity logging failed:', error);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // EXPORT PUBLIC API
  // ─────────────────────────────────────────────────────────────
  
  global.MissionPulse = {
    // Configuration
    config: CONFIG,
    getClient,
    
    // Utilities
    formatCurrency,
    formatDate,
    calculateDaysRemaining,
    
    // Mappers (for custom queries)
    mappers: {
      opportunityFromDB: mapOpportunityFromDB,
      opportunityToDB: mapOpportunityToDB,
      userFromDB: mapUserFromDB,
      competitorFromDB: mapCompetitorFromDB,
      complianceFromDB: mapComplianceFromDB,
      partnerFromDB: mapPartnerFromDB,
      lessonFromDB: mapLessonFromDB
    },
    
    // Opportunities
    getOpportunities,
    getOpportunityById,
    createOpportunity,
    updateOpportunity,
    deleteOpportunity,
    
    // Users
    getUsers,
    getUserByEmail,
    
    // Competitors
    getCompetitors,
    createCompetitor,
    
    // Compliance
    getComplianceRequirements,
    updateComplianceStatus,
    
    // Partners
    getPartners,
    
    // Playbook
    getPlaybookLessons,
    createPlaybookLesson,
    
    // Gate Reviews
    getGateReviews,
    
    // Team Members
    getTeamMembers,
    
    // Aggregates
    getPipelineStats,
    getComplianceStats,
    
    // Realtime
    subscribeToOpportunities,
    subscribeToTable,
    
    // Activity
    logActivity
  };

  log('MissionPulse module loaded v1.0');

})(typeof window !== 'undefined' ? window : global);
