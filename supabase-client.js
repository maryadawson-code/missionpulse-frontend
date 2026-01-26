// ═══════════════════════════════════════════════════════════════════════════════
// MISSIONPULSE SUPABASE CLIENT MODULE v1.0
// Shared database connectivity for all frontend pages
// ═══════════════════════════════════════════════════════════════════════════════
// Usage: Include after Supabase CDN script in any HTML file
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
// <script src="supabase-client.js"></script>
// ═══════════════════════════════════════════════════════════════════════════════

(function(global) {
  'use strict';

  // ─────────────────────────────────────────────────────────────────────────────
  // CONFIGURATION
  // ─────────────────────────────────────────────────────────────────────────────
  const CONFIG = {
    SUPABASE_URL: 'https://djuviwarqdvlbgcfuupa.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqdXZpd2FycWR2bGJnY2Z1dXBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NDQ0NjUsImV4cCI6MjA4NTAyMDQ2NX0.3s8ufDDN2aWfkW0RBsAyJyacb2tjB7M550WSFIohHcA',
    DEFAULT_COMPANY_ID: '11111111-1111-1111-1111-111111111111',
    DEBUG: false
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // SUPABASE CLIENT INITIALIZATION
  // ─────────────────────────────────────────────────────────────────────────────
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

  // ─────────────────────────────────────────────────────────────────────────────
  // FIELD MAPPING: Frontend ↔ Database
  // Frontend uses camelCase, Database uses snake_case
  // ─────────────────────────────────────────────────────────────────────────────
  
  // Calculate days remaining from a date
  function calculateDaysRemaining(dueDate) {
    if (!dueDate) return null;
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }

  // Map database opportunity to frontend format
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
      // Keep raw for debugging
      _raw: CONFIG.DEBUG ? dbRow : undefined
    };
  }

  // Map frontend opportunity to database format
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

  // Map database user to frontend format
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

  // Map database competitor to frontend format
  function mapCompetitorFromDB(dbRow) {
    return {
      id: dbRow.id,
      opportunityId: dbRow.opportunity_id,
      companyName: dbRow.company_name,
      threatLevel: dbRow.threat_level,
      isIncumbent: dbRow.incumbent,
      strengths: dbRow.strengths || [],
      weaknesses: dbRow.weaknesses || [],
      discriminators: dbRow.discriminators || [],
      ghostStrategy: dbRow.ghost_strategy,
      confidenceScore: dbRow.confidence_score,
      intelSource: dbRow.intel_source,
      notes: dbRow.notes
    };
  }

  // Map frontend competitor to database format
  function mapCompetitorToDB(frontendObj) {
    const dbObj = {};
    
    if (frontendObj.opportunityId !== undefined) dbObj.opportunity_id = frontendObj.opportunityId;
    if (frontendObj.companyName !== undefined) dbObj.company_name = frontendObj.companyName;
    if (frontendObj.threatLevel !== undefined) dbObj.threat_level = frontendObj.threatLevel;
    if (frontendObj.isIncumbent !== undefined) dbObj.incumbent = frontendObj.isIncumbent;
    if (frontendObj.strengths !== undefined) dbObj.strengths = frontendObj.strengths;
    if (frontendObj.weaknesses !== undefined) dbObj.weaknesses = frontendObj.weaknesses;
    if (frontendObj.discriminators !== undefined) dbObj.discriminators = frontendObj.discriminators;
    if (frontendObj.ghostStrategy !== undefined) dbObj.ghost_strategy = frontendObj.ghostStrategy;
    if (frontendObj.confidenceScore !== undefined) dbObj.confidence_score = frontendObj.confidenceScore;
    
    return dbObj;
  }

  // Map database compliance requirement to frontend format
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
      dueDate: dbRow.due_date,
      completedAt: dbRow.completed_at,
      notes: dbRow.notes
    };
  }

  // Map frontend compliance to database format
  function mapComplianceToDB(frontendObj) {
    const dbObj = {};
    
    if (frontendObj.opportunityId !== undefined) dbObj.opportunity_id = frontendObj.opportunityId;
    if (frontendObj.pwsReference !== undefined) dbObj.pws_reference = frontendObj.pwsReference;
    if (frontendObj.requirementText !== undefined) dbObj.requirement_text = frontendObj.requirementText;
    if (frontendObj.status !== undefined) dbObj.status = frontendObj.status;
    if (frontendObj.riskLevel !== undefined) dbObj.risk_level = frontendObj.riskLevel;
    if (frontendObj.assignedTo !== undefined) dbObj.assigned_to = frontendObj.assignedTo;
    if (frontendObj.sectionAssignment !== undefined) dbObj.section_assignment = frontendObj.sectionAssignment;
    if (frontendObj.responseOutline !== undefined) dbObj.response_outline = frontendObj.responseOutline;
    if (frontendObj.proofPoints !== undefined) dbObj.proof_points = frontendObj.proofPoints;
    
    return dbObj;
  }

  // Map database partner to frontend format
  function mapPartnerFromDB(dbRow) {
    return {
      id: dbRow.id,
      companyId: dbRow.company_id,
      name: dbRow.name,
      contactName: dbRow.contact_name,
      contactEmail: dbRow.contact_email,
      contactPhone: dbRow.contact_phone,
      socioeconomicStatus: dbRow.socioeconomic_status || [],
      capabilities: dbRow.capabilities || [],
      pastPerformance: dbRow.past_performance || [],
      trustScore: dbRow.trust_score,
      ndaStatus: dbRow.nda_status,
      ndaExpiration: dbRow.nda_expiration,
      notes: dbRow.notes
    };
  }

  // Map database team member to frontend format
  function mapTeamMemberFromDB(dbRow) {
    return {
      id: dbRow.id,
      opportunityId: dbRow.opportunity_id,
      userId: dbRow.user_id,
      roleTitle: dbRow.role_title,
      laborCategory: dbRow.labor_category,
      hourlyRate: dbRow.hourly_rate,
      allocatedHours: dbRow.allocated_hours,
      isKeyPersonnel: dbRow.is_key_personnel,
      resumePath: dbRow.resume_path,
      clearanceLevel: dbRow.clearance_level
    };
  }

  // Map database lesson to frontend format
  function mapLessonFromDB(dbRow) {
    return {
      id: dbRow.id,
      companyId: dbRow.company_id,
      opportunityId: dbRow.opportunity_id,
      category: dbRow.category,
      title: dbRow.title,
      description: dbRow.description,
      outcome: dbRow.outcome,
      impactScore: dbRow.impact_score,
      isGoldenExample: dbRow.is_golden_example,
      tags: dbRow.tags || [],
      createdBy: dbRow.created_by,
      createdAt: dbRow.created_at
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // UTILITY FUNCTIONS
  // ─────────────────────────────────────────────────────────────────────────────
  
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

  // ─────────────────────────────────────────────────────────────────────────────
  // CRUD OPERATIONS: OPPORTUNITIES
  // ─────────────────────────────────────────────────────────────────────────────
  
  async function getOpportunities(options = {}) {
    try {
      let query = getClient()
        .from('opportunities')
        .select('*');
      
      if (!options.includeArchived) {
        query = query.eq('is_archived', false);
      }
      
      if (options.phase) {
        query = query.eq('phase', options.phase);
      }
      
      if (options.companyId) {
        query = query.eq('company_id', options.companyId);
      }
      
      if (options.orderBy) {
        query = query.order(options.orderBy, { ascending: options.ascending || false });
      } else {
        query = query.order('estimated_value', { ascending: false });
      }
      
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

  // ─────────────────────────────────────────────────────────────────────────────
  // CRUD OPERATIONS: USERS
  // ─────────────────────────────────────────────────────────────────────────────
  
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
      } else {
        query = query.eq('company_id', CONFIG.DEFAULT_COMPANY_ID);
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

  async function getUserById(id) {
    try {
      const { data, error } = await getClient()
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      return { data: mapUserFromDB(data), error: null };
    } catch (error) {
      return handleError('getUserById', error);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CRUD OPERATIONS: COMPETITORS
  // ─────────────────────────────────────────────────────────────────────────────
  
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
      const dbData = mapCompetitorToDB(competitor);
      
      const { data, error } = await getClient()
        .from('competitors')
        .insert(dbData)
        .select()
        .single();
      
      if (error) throw error;
      
      log('Created competitor', data.id);
      return { data: mapCompetitorFromDB(data), error: null };
    } catch (error) {
      return handleError('createCompetitor', error);
    }
  }

  async function updateCompetitor(id, updates) {
    try {
      const dbData = mapCompetitorToDB(updates);
      
      const { data, error } = await getClient()
        .from('competitors')
        .update(dbData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      return { data: mapCompetitorFromDB(data), error: null };
    } catch (error) {
      return handleError('updateCompetitor', error);
    }
  }

  async function deleteCompetitor(id) {
    try {
      const { error } = await getClient()
        .from('competitors')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      return { data: { id }, error: null };
    } catch (error) {
      return handleError('deleteCompetitor', error);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CRUD OPERATIONS: COMPLIANCE
  // ─────────────────────────────────────────────────────────────────────────────
  
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

  async function createComplianceRequirement(requirement) {
    try {
      const dbData = mapComplianceToDB(requirement);
      
      const { data, error } = await getClient()
        .from('compliance_requirements')
        .insert(dbData)
        .select()
        .single();
      
      if (error) throw error;
      
      return { data: mapComplianceFromDB(data), error: null };
    } catch (error) {
      return handleError('createComplianceRequirement', error);
    }
  }

  async function updateComplianceStatus(id, status, riskLevel) {
    try {
      const updateData = { status };
      if (riskLevel) updateData.risk_level = riskLevel;
      if (status === 'Compliant') updateData.completed_at = new Date().toISOString();
      
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

  async function updateComplianceRequirement(id, updates) {
    try {
      const dbData = mapComplianceToDB(updates);
      
      const { data, error } = await getClient()
        .from('compliance_requirements')
        .update(dbData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      return { data: mapComplianceFromDB(data), error: null };
    } catch (error) {
      return handleError('updateComplianceRequirement', error);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CRUD OPERATIONS: PARTNERS
  // ─────────────────────────────────────────────────────────────────────────────
  
  async function getPartners(options = {}) {
    try {
      let query = getClient()
        .from('partners')
        .select('*')
        .eq('company_id', options.companyId || CONFIG.DEFAULT_COMPANY_ID);
      
      const { data, error } = await query.order('trust_score', { ascending: false });
      
      if (error) throw error;
      
      return { data: data.map(mapPartnerFromDB), error: null };
    } catch (error) {
      return handleError('getPartners', error);
    }
  }

  async function getPartnersForOpportunity(opportunityId) {
    try {
      const { data, error } = await getClient()
        .from('partner_opportunities')
        .select(`
          *,
          partners (*)
        `)
        .eq('opportunity_id', opportunityId);
      
      if (error) throw error;
      
      return { 
        data: data.map(po => ({
          ...mapPartnerFromDB(po.partners),
          role: po.role,
          workShare: po.work_share_percentage,
          accessLevel: po.access_level,
          accessExpires: po.access_expires
        })), 
        error: null 
      };
    } catch (error) {
      return handleError('getPartnersForOpportunity', error);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CRUD OPERATIONS: TEAM MEMBERS
  // ─────────────────────────────────────────────────────────────────────────────
  
  async function getTeamMembers(opportunityId) {
    try {
      const { data, error } = await getClient()
        .from('team_members')
        .select(`
          *,
          users (full_name, email, role_id)
        `)
        .eq('opportunity_id', opportunityId)
        .order('labor_category');
      
      if (error) throw error;
      
      return { 
        data: data.map(tm => ({
          ...mapTeamMemberFromDB(tm),
          user: tm.users ? mapUserFromDB(tm.users) : null
        })), 
        error: null 
      };
    } catch (error) {
      return handleError('getTeamMembers', error);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CRUD OPERATIONS: PLAYBOOK LESSONS
  // ─────────────────────────────────────────────────────────────────────────────
  
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

  async function createLesson(lesson) {
    try {
      const { data, error } = await getClient()
        .from('playbook_lessons')
        .insert({
          company_id: lesson.companyId || CONFIG.DEFAULT_COMPANY_ID,
          opportunity_id: lesson.opportunityId,
          category: lesson.category,
          title: lesson.title,
          description: lesson.description,
          outcome: lesson.outcome,
          impact_score: lesson.impactScore || 50,
          is_golden_example: lesson.isGoldenExample || false,
          tags: lesson.tags || [],
          created_by: lesson.createdBy
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return { data: mapLessonFromDB(data), error: null };
    } catch (error) {
      return handleError('createLesson', error);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CRUD OPERATIONS: GATE REVIEWS
  // ─────────────────────────────────────────────────────────────────────────────
  
  async function getGateReviews(opportunityId) {
    try {
      const { data, error } = await getClient()
        .from('gate_reviews')
        .select(`
          *,
          conducted_by_user:users!gate_reviews_conducted_by_fkey (full_name, role_id)
        `)
        .eq('opportunity_id', opportunityId)
        .order('gate_number');
      
      if (error) throw error;
      
      return { 
        data: data.map(gr => ({
          id: gr.id,
          opportunityId: gr.opportunity_id,
          gateNumber: gr.gate_number,
          gateName: gr.gate_name,
          status: gr.status,
          decision: gr.decision,
          conductedBy: gr.conducted_by,
          conductedByUser: gr.conducted_by_user,
          scheduledDate: gr.scheduled_date,
          completedDate: gr.completed_date,
          notes: gr.notes,
          actionItems: gr.action_items || []
        })), 
        error: null 
      };
    } catch (error) {
      return handleError('getGateReviews', error);
    }
  }

  async function updateGateReview(id, updates) {
    try {
      const dbData = {};
      if (updates.status !== undefined) dbData.status = updates.status;
      if (updates.decision !== undefined) dbData.decision = updates.decision;
      if (updates.notes !== undefined) dbData.notes = updates.notes;
      if (updates.actionItems !== undefined) dbData.action_items = updates.actionItems;
      if (updates.completedDate !== undefined) dbData.completed_date = updates.completedDate;
      if (updates.conductedBy !== undefined) dbData.conducted_by = updates.conductedBy;
      
      const { data, error } = await getClient()
        .from('gate_reviews')
        .update(dbData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      return { data, error: null };
    } catch (error) {
      return handleError('updateGateReview', error);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CRUD OPERATIONS: DOCUMENTS
  // ─────────────────────────────────────────────────────────────────────────────
  
  async function getDocuments(opportunityId) {
    try {
      const { data, error } = await getClient()
        .from('documents')
        .select(`
          *,
          uploaded_by_user:users!documents_uploaded_by_fkey (full_name)
        `)
        .eq('opportunity_id', opportunityId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return { 
        data: data.map(doc => ({
          id: doc.id,
          opportunityId: doc.opportunity_id,
          fileName: doc.file_name,
          fileType: doc.file_type,
          storagePath: doc.storage_path,
          portionMarking: doc.portion_marking,
          uploadedBy: doc.uploaded_by,
          uploadedByUser: doc.uploaded_by_user,
          createdAt: doc.created_at
        })), 
        error: null 
      };
    } catch (error) {
      return handleError('getDocuments', error);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CRUD OPERATIONS: ACTIVITY LOG
  // ─────────────────────────────────────────────────────────────────────────────
  
  async function logActivity(action, entityType, entityId, metadata = {}) {
    try {
      const { error } = await getClient()
        .from('activity_log')
        .insert({
          company_id: CONFIG.DEFAULT_COMPANY_ID,
          user_id: metadata.userId || null,
          opportunity_id: entityType === 'opportunity' ? entityId : null,
          action_type: action,
          entity_type: entityType,
          entity_id: entityId,
          metadata: metadata
        });
      
      if (error) {
        console.warn('Activity logging failed:', error);
      }
    } catch (error) {
      console.warn('Activity logging failed:', error);
    }
  }

  async function getActivityLog(options = {}) {
    try {
      let query = getClient()
        .from('activity_log')
        .select(`
          *,
          users (full_name)
        `)
        .eq('company_id', options.companyId || CONFIG.DEFAULT_COMPANY_ID);
      
      if (options.opportunityId) {
        query = query.eq('opportunity_id', options.opportunityId);
      }
      
      if (options.userId) {
        query = query.eq('user_id', options.userId);
      }
      
      if (options.entityType) {
        query = query.eq('entity_type', options.entityType);
      }
      
      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(options.limit || 50);
      
      if (error) throw error;
      
      return { data, error: null };
    } catch (error) {
      return handleError('getActivityLog', error);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // AGGREGATE QUERIES
  // ─────────────────────────────────────────────────────────────────────────────
  
  async function getPipelineStats(options = {}) {
    try {
      const { data: opportunities, error } = await getClient()
        .from('opportunities')
        .select('estimated_value, pwin, phase, is_archived, priority')
        .eq('is_archived', false);
      
      if (error) throw error;
      
      const stats = {
        totalOpportunities: opportunities.length,
        totalValue: opportunities.reduce((sum, o) => sum + (o.estimated_value || 0), 0),
        totalValueFormatted: formatCurrency(opportunities.reduce((sum, o) => sum + (o.estimated_value || 0), 0)),
        activeCount: opportunities.filter(o => !['Won', 'Lost', 'No-Go'].includes(o.phase)).length,
        avgPwin: opportunities.length > 0 
          ? Math.round(opportunities.reduce((sum, o) => sum + (o.pwin || 0), 0) / opportunities.length)
          : 0,
        byPhase: {},
        byPriority: {},
        weightedPipeline: 0
      };
      
      // Count by phase
      opportunities.forEach(o => {
        stats.byPhase[o.phase] = (stats.byPhase[o.phase] || 0) + 1;
        stats.byPriority[o.priority || 'Unassigned'] = (stats.byPriority[o.priority || 'Unassigned'] || 0) + 1;
        // Weighted pipeline = sum of (value * pWin/100)
        stats.weightedPipeline += (o.estimated_value || 0) * (o.pwin || 0) / 100;
      });
      
      stats.weightedPipelineFormatted = formatCurrency(stats.weightedPipeline);
      
      return { data: stats, error: null };
    } catch (error) {
      return handleError('getPipelineStats', error);
    }
  }

  async function getComplianceStats(opportunityId) {
    try {
      const { data, error } = await getClient()
        .from('compliance_requirements')
        .select('status, risk_level')
        .eq('opportunity_id', opportunityId);
      
      if (error) throw error;
      
      const stats = {
        total: data.length,
        byStatus: {},
        byRisk: {},
        compliancePercentage: 0
      };
      
      data.forEach(r => {
        stats.byStatus[r.status] = (stats.byStatus[r.status] || 0) + 1;
        stats.byRisk[r.risk_level] = (stats.byRisk[r.risk_level] || 0) + 1;
      });
      
      const compliant = stats.byStatus['Compliant'] || 0;
      stats.compliancePercentage = stats.total > 0 
        ? Math.round((compliant / stats.total) * 100) 
        : 0;
      
      return { data: stats, error: null };
    } catch (error) {
      return handleError('getComplianceStats', error);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // REAL-TIME SUBSCRIPTIONS
  // ─────────────────────────────────────────────────────────────────────────────
  
  function subscribeToOpportunities(callback) {
    const channel = getClient()
      .channel('opportunities-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'opportunities' },
        (payload) => {
          log('Realtime update - opportunities', payload);
          const mappedPayload = {
            ...payload,
            new: payload.new ? mapOpportunityFromDB(payload.new) : null,
            old: payload.old ? mapOpportunityFromDB(payload.old) : null
          };
          callback(mappedPayload);
        }
      )
      .subscribe();
    
    return () => {
      channel.unsubscribe();
      log('Unsubscribed from opportunities');
    };
  }

  function subscribeToCompetitors(opportunityId, callback) {
    const channel = getClient()
      .channel(`competitors-${opportunityId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'competitors',
          filter: `opportunity_id=eq.${opportunityId}`
        },
        (payload) => {
          log('Realtime update - competitors', payload);
          callback(payload);
        }
      )
      .subscribe();
    
    return () => channel.unsubscribe();
  }

  function subscribeToCompliance(opportunityId, callback) {
    const channel = getClient()
      .channel(`compliance-${opportunityId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'compliance_requirements',
          filter: `opportunity_id=eq.${opportunityId}`
        },
        (payload) => {
          log('Realtime update - compliance', payload);
          callback(payload);
        }
      )
      .subscribe();
    
    return () => channel.unsubscribe();
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // AUTHENTICATION HELPERS (for Sprint 7)
  // ─────────────────────────────────────────────────────────────────────────────
  
  async function getCurrentUser() {
    try {
      const { data: { session }, error } = await getClient().auth.getSession();
      
      if (error || !session) {
        return { data: null, error: error?.message || 'No active session' };
      }
      
      // Get user profile from users table
      const { data: profile, error: profileError } = await getClient()
        .from('users')
        .select('*')
        .eq('email', session.user.email)
        .single();
      
      if (profileError) {
        return { data: { session, profile: null }, error: null };
      }
      
      return { 
        data: { 
          session, 
          profile: mapUserFromDB(profile) 
        }, 
        error: null 
      };
    } catch (error) {
      return handleError('getCurrentUser', error);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // DEBUG HELPERS
  // ─────────────────────────────────────────────────────────────────────────────
  
  function enableDebug() {
    CONFIG.DEBUG = true;
    console.log('[MissionPulse] Debug mode enabled');
  }

  function disableDebug() {
    CONFIG.DEBUG = false;
    console.log('[MissionPulse] Debug mode disabled');
  }

  async function testConnection() {
    try {
      const { data, error } = await getClient()
        .from('opportunities')
        .select('count')
        .limit(1);
      
      if (error) throw error;
      
      console.log('[MissionPulse] ✅ Connection successful');
      return { success: true, error: null };
    } catch (error) {
      console.error('[MissionPulse] ❌ Connection failed:', error);
      return { success: false, error: error.message };
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // EXPORT PUBLIC API
  // ─────────────────────────────────────────────────────────────────────────────
  
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
      teamMemberFromDB: mapTeamMemberFromDB,
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
    getUserById,
    getCurrentUser,
    
    // Competitors
    getCompetitors,
    createCompetitor,
    updateCompetitor,
    deleteCompetitor,
    
    // Compliance
    getComplianceRequirements,
    createComplianceRequirement,
    updateComplianceStatus,
    updateComplianceRequirement,
    
    // Partners
    getPartners,
    getPartnersForOpportunity,
    
    // Team Members
    getTeamMembers,
    
    // Playbook
    getPlaybookLessons,
    createLesson,
    
    // Gate Reviews
    getGateReviews,
    updateGateReview,
    
    // Documents
    getDocuments,
    
    // Activity Log
    logActivity,
    getActivityLog,
    
    // Aggregates
    getPipelineStats,
    getComplianceStats,
    
    // Realtime Subscriptions
    subscribeToOpportunities,
    subscribeToCompetitors,
    subscribeToCompliance,
    
    // Debug Helpers
    enableDebug,
    disableDebug,
    testConnection
  };

  log('MissionPulse module loaded v1.0');

})(typeof window !== 'undefined' ? window : global);

// ═══════════════════════════════════════════════════════════════════════════════
// AI GENERATED - REQUIRES HUMAN REVIEW
// MissionPulse Supabase Client Module v1.0
// © 2026 Mission Meets Tech - Mission. Technology. Transformation.
// ═══════════════════════════════════════════════════════════════════════════════
