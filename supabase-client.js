/**
 * MissionPulse Supabase Client v2.0
 * Full CRUD for all tables + Render API AI integration
 * © 2026 Mission Meets Tech
 */
(function(global) {
  'use strict';

  const SUPABASE_URL = 'https://djuviwarqdvlbgcfuupa.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqdXZpd2FycWR2bGJnY2Z1dXBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc4MzUyMjQsImV4cCI6MjA1MzQxMTIyNH0.pBPL9l2zL7LLd_A5I--hPBzw5YwG3ajPMtbYsqsxIgQ';
  const RENDER_API_URL = 'https://missionpulse-api.onrender.com';

  let supabase = null;
  let connectionStatus = 'disconnected';
  let connectionListeners = [];

  function initSupabase() {
    if (typeof global.supabase !== 'undefined' && global.supabase.createClient) {
      supabase = global.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      connectionStatus = 'connected';
      notifyConnectionListeners();
      console.log('[MissionPulse] Supabase initialized');
      return true;
    }
    console.warn('[MissionPulse] Supabase library not loaded');
    return false;
  }

  function notifyConnectionListeners() {
    connectionListeners.forEach(cb => cb(connectionStatus));
  }

  const SHIPLEY_PHASES = {
    'qualify': { name: 'Qualify', color: '#64748b', order: 0 },
    'capture': { name: 'Capture', color: '#8b5cf6', order: 1 },
    'blue_team': { name: 'Blue Team', color: '#3b82f6', order: 2 },
    'pink_team': { name: 'Pink Team', color: '#ec4899', order: 3 },
    'red_team': { name: 'Red Team', color: '#ef4444', order: 4 },
    'gold_team': { name: 'Gold Team', color: '#f59e0b', order: 5 },
    'white_glove': { name: 'White Glove', color: '#10b981', order: 6 },
    'submitted': { name: 'Submit', color: '#22d3ee', order: 7 }
  };

  function mapPhase(phase) {
    if (!phase) return 'Qualify';
    const key = phase.toLowerCase().replace(/ /g, '_');
    return SHIPLEY_PHASES[key]?.name || phase;
  }

  // OPPORTUNITIES CRUD
  async function getOpportunities(options = {}) {
    if (!supabase && !initSupabase()) return { data: null, error: new Error('Not initialized') };
    try {
      let query = supabase.from('opportunities').select('*');
      query = query.order(options.orderBy || 'created_at', { ascending: options.ascending ?? false });
      const { data, error } = await query;
      if (error) throw error;
      return {
        data: (data || []).map(r => ({
          id: r.id, name: r.name, nickname: r.name?.split(' ').slice(0, 3).join(' ') || 'Unnamed',
          title: r.description || r.name, agency: r.agency, ceiling: r.contract_value,
          contractValue: r.contract_value, phase: mapPhase(r.shipley_phase), shipleyPhase: r.shipley_phase,
          pWin: r.win_probability || 50, winProbability: r.win_probability,
          days: r.due_date ? Math.max(0, Math.ceil((new Date(r.due_date) - new Date()) / 86400000)) : 999,
          dueDate: r.due_date, priority: r.priority || 'P-1', naics: r.naics_code, setAside: r.set_aside,
          solicitationNumber: r.solicitation_number, description: r.description, createdAt: r.created_at
        })), error: null
      };
    } catch (error) { return { data: null, error }; }
  }

  async function getOpportunityById(id) {
    if (!supabase && !initSupabase()) return { data: null, error: new Error('Not initialized') };
    try {
      const { data, error } = await supabase.from('opportunities').select('*').eq('id', id).single();
      if (error) throw error;
      return { data, error: null };
    } catch (error) { return { data: null, error }; }
  }

  async function createOpportunity(opp) {
    if (!supabase && !initSupabase()) return { data: null, error: new Error('Not initialized') };
    try {
      const dbData = {
        name: opp.name, agency: opp.agency, contract_value: opp.contractValue || opp.ceiling,
        priority: opp.priority, shipley_phase: opp.shipleyPhase || 'qualify',
        win_probability: opp.winProbability || opp.pWin || 50, due_date: opp.dueDate,
        solicitation_number: opp.solicitationNumber, description: opp.description || opp.title,
        set_aside: opp.setAside, naics_code: opp.naics,
        created_at: new Date().toISOString(), updated_at: new Date().toISOString()
      };
      const { data, error } = await supabase.from('opportunities').insert([dbData]).select().single();
      if (error) throw error;
      return { data, error: null };
    } catch (error) { return { data: null, error }; }
  }

  async function updateOpportunity(id, updates) {
    if (!supabase && !initSupabase()) return { data: null, error: new Error('Not initialized') };
    try {
      const dbData = { updated_at: new Date().toISOString() };
      if (updates.name) dbData.name = updates.name;
      if (updates.agency) dbData.agency = updates.agency;
      if (updates.contractValue || updates.ceiling) dbData.contract_value = updates.contractValue || updates.ceiling;
      if (updates.shipleyPhase) dbData.shipley_phase = updates.shipleyPhase;
      if (updates.winProbability || updates.pWin) dbData.win_probability = updates.winProbability || updates.pWin;
      if (updates.dueDate) dbData.due_date = updates.dueDate;
      if (updates.priority) dbData.priority = updates.priority;
      const { data, error } = await supabase.from('opportunities').update(dbData).eq('id', id).select().single();
      if (error) throw error;
      return { data, error: null };
    } catch (error) { return { data: null, error }; }
  }

  async function deleteOpportunity(id) {
    if (!supabase && !initSupabase()) return { data: null, error: new Error('Not initialized') };
    try {
      const { error } = await supabase.from('opportunities').delete().eq('id', id);
      if (error) throw error;
      return { data: { id }, error: null };
    } catch (error) { return { data: null, error }; }
  }

  async function getPipelineStats() {
    if (!supabase && !initSupabase()) return { data: null, error: new Error('Not initialized') };
    try {
      const { data, error } = await supabase.from('opportunities').select('contract_value, win_probability, due_date, shipley_phase');
      if (error) throw error;
      const now = new Date();
      const weekFromNow = new Date(now.getTime() + 7 * 86400000);
      return {
        data: {
          totalCount: data.length,
          totalValue: data.reduce((s, o) => s + (o.contract_value || 0), 0),
          avgPwin: data.length ? Math.round(data.reduce((s, o) => s + (o.win_probability || 0), 0) / data.length) : 0,
          dueThisWeek: data.filter(o => o.due_date && new Date(o.due_date) <= weekFromNow && new Date(o.due_date) >= now).length
        }, error: null
      };
    } catch (error) { return { data: null, error }; }
  }

  // COMPETITORS CRUD
  async function getCompetitors(opportunityId = null) {
    if (!supabase && !initSupabase()) return { data: null, error: new Error('Not initialized') };
    try {
      let query = supabase.from('competitors').select('*');
      if (opportunityId) query = query.eq('opportunity_id', opportunityId);
      const { data, error } = await query.order('threat_level', { ascending: false });
      if (error) throw error;
      return {
        data: (data || []).map(r => ({
          id: r.id, name: r.company_name, threat: r.threat_level, strengths: r.strengths || [],
          weaknesses: r.weaknesses || [], ghostStrategy: r.ghost_strategy,
          opportunityId: r.opportunity_id, createdAt: r.created_at
        })), error: null
      };
    } catch (error) { return { data: null, error }; }
  }

  async function createCompetitor(comp) {
    if (!supabase && !initSupabase()) return { data: null, error: new Error('Not initialized') };
    try {
      const dbData = {
        company_name: comp.name, threat_level: comp.threat || 'medium',
        strengths: comp.strengths || [], weaknesses: comp.weaknesses || [],
        ghost_strategy: comp.ghostStrategy, opportunity_id: comp.opportunityId,
        created_at: new Date().toISOString()
      };
      const { data, error } = await supabase.from('competitors').insert([dbData]).select().single();
      if (error) throw error;
      return { data, error: null };
    } catch (error) { return { data: null, error }; }
  }

  async function updateCompetitor(id, updates) {
    if (!supabase && !initSupabase()) return { data: null, error: new Error('Not initialized') };
    try {
      const dbData = {};
      if (updates.name) dbData.company_name = updates.name;
      if (updates.threat) dbData.threat_level = updates.threat;
      if (updates.strengths) dbData.strengths = updates.strengths;
      if (updates.weaknesses) dbData.weaknesses = updates.weaknesses;
      if (updates.ghostStrategy) dbData.ghost_strategy = updates.ghostStrategy;
      const { data, error } = await supabase.from('competitors').update(dbData).eq('id', id).select().single();
      if (error) throw error;
      return { data, error: null };
    } catch (error) { return { data: null, error }; }
  }

  async function deleteCompetitor(id) {
    if (!supabase && !initSupabase()) return { data: null, error: new Error('Not initialized') };
    try {
      const { error } = await supabase.from('competitors').delete().eq('id', id);
      if (error) throw error;
      return { data: { id }, error: null };
    } catch (error) { return { data: null, error }; }
  }

  // PARTNERS CRUD
  async function getPartners() {
    if (!supabase && !initSupabase()) return { data: null, error: new Error('Not initialized') };
    try {
      const { data, error } = await supabase.from('partners').select('*').order('trust_score', { ascending: false });
      if (error) throw error;
      return {
        data: (data || []).map(r => ({
          id: r.id, name: r.partner_name, status: r.status || 'Active',
          capabilities: r.capabilities || [], trustScore: r.trust_score || 80,
          socio: r.socioeconomic_status, email: r.contact_email,
          assigned: r.assigned_opportunities || [], createdAt: r.created_at
        })), error: null
      };
    } catch (error) { return { data: null, error }; }
  }

  async function createPartner(partner) {
    if (!supabase && !initSupabase()) return { data: null, error: new Error('Not initialized') };
    try {
      const dbData = {
        partner_name: partner.name, status: partner.status || 'Pending',
        capabilities: partner.capabilities || [], trust_score: partner.trustScore || 75,
        socioeconomic_status: partner.socio, contact_email: partner.email,
        assigned_opportunities: partner.assigned || [], created_at: new Date().toISOString()
      };
      const { data, error } = await supabase.from('partners').insert([dbData]).select().single();
      if (error) throw error;
      return { data, error: null };
    } catch (error) { return { data: null, error }; }
  }

  async function updatePartner(id, updates) {
    if (!supabase && !initSupabase()) return { data: null, error: new Error('Not initialized') };
    try {
      const dbData = {};
      if (updates.name) dbData.partner_name = updates.name;
      if (updates.status) dbData.status = updates.status;
      if (updates.capabilities) dbData.capabilities = updates.capabilities;
      if (updates.trustScore !== undefined) dbData.trust_score = updates.trustScore;
      if (updates.socio) dbData.socioeconomic_status = updates.socio;
      if (updates.assigned) dbData.assigned_opportunities = updates.assigned;
      const { data, error } = await supabase.from('partners').update(dbData).eq('id', id).select().single();
      if (error) throw error;
      return { data, error: null };
    } catch (error) { return { data: null, error }; }
  }

  async function deletePartner(id) {
    if (!supabase && !initSupabase()) return { data: null, error: new Error('Not initialized') };
    try {
      const { error } = await supabase.from('partners').delete().eq('id', id);
      if (error) throw error;
      return { data: { id }, error: null };
    } catch (error) { return { data: null, error }; }
  }

  // COMPLIANCE REQUIREMENTS CRUD
  async function getComplianceRequirements(opportunityId = null) {
    if (!supabase && !initSupabase()) return { data: null, error: new Error('Not initialized') };
    try {
      let query = supabase.from('compliance_requirements').select('*');
      if (opportunityId) query = query.eq('opportunity_id', opportunityId);
      const { data, error } = await query.order('reference', { ascending: true });
      if (error) throw error;
      return {
        data: (data || []).map(r => ({
          id: r.id, ref: r.reference, title: r.title, section: r.section,
          status: r.status || 'draft', owner: r.owner, confidence: r.confidence || 0,
          opportunityId: r.opportunity_id
        })), error: null
      };
    } catch (error) { return { data: null, error }; }
  }

  async function createComplianceRequirement(req) {
    if (!supabase && !initSupabase()) return { data: null, error: new Error('Not initialized') };
    try {
      const dbData = {
        reference: req.ref, title: req.title, section: req.section,
        status: req.status || 'draft', owner: req.owner, confidence: req.confidence || 0,
        opportunity_id: req.opportunityId, created_at: new Date().toISOString()
      };
      const { data, error } = await supabase.from('compliance_requirements').insert([dbData]).select().single();
      if (error) throw error;
      return { data, error: null };
    } catch (error) { return { data: null, error }; }
  }

  async function updateComplianceRequirement(id, updates) {
    if (!supabase && !initSupabase()) return { data: null, error: new Error('Not initialized') };
    try {
      const dbData = {};
      if (updates.status) dbData.status = updates.status;
      if (updates.owner) dbData.owner = updates.owner;
      if (updates.confidence !== undefined) dbData.confidence = updates.confidence;
      const { data, error } = await supabase.from('compliance_requirements').update(dbData).eq('id', id).select().single();
      if (error) throw error;
      return { data, error: null };
    } catch (error) { return { data: null, error }; }
  }

  async function deleteComplianceRequirement(id) {
    if (!supabase && !initSupabase()) return { data: null, error: new Error('Not initialized') };
    try {
      const { error } = await supabase.from('compliance_requirements').delete().eq('id', id);
      if (error) throw error;
      return { data: { id }, error: null };
    } catch (error) { return { data: null, error }; }
  }

  // CONTRACTS CRUD
  async function getContracts() {
    if (!supabase && !initSupabase()) return { data: null, error: new Error('Not initialized') };
    try {
      const { data, error } = await supabase.from('contracts').select('*').order('expiry_date', { ascending: true });
      if (error) throw error;
      return {
        data: (data || []).map(r => ({
          id: r.id, vehicle: r.vehicle_name, type: r.contract_type,
          risk: r.risk_level || 'low', clauses: r.clause_count || 0,
          findings: r.findings || 0, expiry: r.expiry_date
        })), error: null
      };
    } catch (error) { return { data: null, error }; }
  }

  async function createContract(contract) {
    if (!supabase && !initSupabase()) return { data: null, error: new Error('Not initialized') };
    try {
      const dbData = {
        vehicle_name: contract.vehicle, contract_type: contract.type,
        risk_level: contract.risk || 'low', clause_count: contract.clauses || 0,
        findings: contract.findings || 0, expiry_date: contract.expiry,
        created_at: new Date().toISOString()
      };
      const { data, error } = await supabase.from('contracts').insert([dbData]).select().single();
      if (error) throw error;
      return { data, error: null };
    } catch (error) { return { data: null, error }; }
  }

  // SUBMISSIONS CRUD
  async function getSubmissions() {
    if (!supabase && !initSupabase()) return { data: null, error: new Error('Not initialized') };
    try {
      const { data, error } = await supabase.from('submissions').select('*').order('submitted_date', { ascending: false });
      if (error) throw error;
      return {
        data: (data || []).map(r => ({
          id: r.id, name: r.name, status: r.status, value: r.value,
          submitted: r.submitted_date, result: r.result_date,
          roi: r.roi_percent, opportunityId: r.opportunity_id
        })), error: null
      };
    } catch (error) { return { data: null, error }; }
  }

  async function createSubmission(sub) {
    if (!supabase && !initSupabase()) return { data: null, error: new Error('Not initialized') };
    try {
      const dbData = {
        name: sub.name, status: sub.status || 'Pending', value: sub.value,
        submitted_date: sub.submitted || new Date().toISOString().split('T')[0],
        result_date: sub.result, roi_percent: sub.roi,
        opportunity_id: sub.opportunityId, created_at: new Date().toISOString()
      };
      const { data, error } = await supabase.from('submissions').insert([dbData]).select().single();
      if (error) throw error;
      return { data, error: null };
    } catch (error) { return { data: null, error }; }
  }

  async function updateSubmission(id, updates) {
    if (!supabase && !initSupabase()) return { data: null, error: new Error('Not initialized') };
    try {
      const dbData = {};
      if (updates.status) dbData.status = updates.status;
      if (updates.result) dbData.result_date = updates.result;
      if (updates.roi !== undefined) dbData.roi_percent = updates.roi;
      const { data, error } = await supabase.from('submissions').update(dbData).eq('id', id).select().single();
      if (error) throw error;
      return { data, error: null };
    } catch (error) { return { data: null, error }; }
  }

  // PLAYBOOK LESSONS CRUD
  async function getPlaybookLessons(category = null) {
    if (!supabase && !initSupabase()) return { data: null, error: new Error('Not initialized') };
    try {
      let query = supabase.from('playbook_lessons').select('*');
      if (category) query = query.eq('category', category);
      const { data, error } = await query.order('quality_score', { ascending: false });
      if (error) throw error;
      return {
        data: (data || []).map(r => ({
          id: r.id, title: r.title, category: r.category,
          score: r.quality_score || 85, uses: r.use_count || 0, content: r.content
        })), error: null
      };
    } catch (error) { return { data: null, error }; }
  }

  async function createPlaybookLesson(lesson) {
    if (!supabase && !initSupabase()) return { data: null, error: new Error('Not initialized') };
    try {
      const dbData = {
        title: lesson.title, category: lesson.category,
        quality_score: lesson.score || 85, use_count: 0,
        content: lesson.content, created_at: new Date().toISOString()
      };
      const { data, error } = await supabase.from('playbook_lessons').insert([dbData]).select().single();
      if (error) throw error;
      return { data, error: null };
    } catch (error) { return { data: null, error }; }
  }

  async function deletePlaybookLesson(id) {
    if (!supabase && !initSupabase()) return { data: null, error: new Error('Not initialized') };
    try {
      const { error } = await supabase.from('playbook_lessons').delete().eq('id', id);
      if (error) throw error;
      return { data: { id }, error: null };
    } catch (error) { return { data: null, error }; }
  }

  async function incrementLessonUse(id) {
    if (!supabase && !initSupabase()) return { data: null, error: new Error('Not initialized') };
    try {
      const { data: current } = await supabase.from('playbook_lessons').select('use_count').eq('id', id).single();
      const { data, error } = await supabase.from('playbook_lessons').update({ use_count: (current?.use_count || 0) + 1 }).eq('id', id).select().single();
      if (error) throw error;
      return { data, error: null };
    } catch (error) { return { data: null, error }; }
  }

  // ACTIVITY LOG
  async function getActivityLog(filters = {}) {
    if (!supabase && !initSupabase()) return { data: null, error: new Error('Not initialized') };
    try {
      let query = supabase.from('activity_log').select('*');
      if (filters.action) query = query.eq('action', filters.action);
      const { data, error } = await query.order('timestamp', { ascending: false }).limit(100);
      if (error) throw error;
      return {
        data: (data || []).map(r => ({
          id: r.id, action: r.action, user: r.user_name, role: r.user_role,
          ip: r.ip_address, ts: r.timestamp, details: r.details
        })), error: null
      };
    } catch (error) { return { data: null, error }; }
  }

  async function logActivity(action, details = {}) {
    if (!supabase && !initSupabase()) return { data: null, error: new Error('Not initialized') };
    try {
      const user = JSON.parse(localStorage.getItem('MP_USER') || '{}');
      const dbData = {
        action, user_name: user.name || user.email || 'Unknown',
        user_role: user.role || 'User', ip_address: '0.0.0.0',
        timestamp: new Date().toISOString(), details: JSON.stringify(details)
      };
      const { data, error } = await supabase.from('activity_log').insert([dbData]).select().single();
      if (error) throw error;
      return { data, error: null };
    } catch (error) { return { data: null, error }; }
  }

  // AI INTEGRATION
  async function sendToAI(agent, message, context = {}) {
    try {
      const response = await fetch(`${RENDER_API_URL}/api/chat`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent, message,
          context: { ...context, user: JSON.parse(localStorage.getItem('MP_USER') || '{}'), timestamp: new Date().toISOString() }
        })
      });
      if (!response.ok) throw new Error(`AI API error: ${response.status}`);
      const data = await response.json();
      return { data: data.response || data.content || data, error: null };
    } catch (error) { return { data: null, error }; }
  }

  async function streamAIResponse(agent, message, context, onChunk) {
    try {
      const response = await fetch(`${RENDER_API_URL}/api/chat/stream`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent, message, context })
      });
      if (!response.ok) throw new Error(`AI API error: ${response.status}`);
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        fullResponse += chunk;
        if (onChunk) onChunk(chunk, fullResponse);
      }
      return { data: fullResponse, error: null };
    } catch (error) { return { data: null, error }; }
  }

  async function generateContent(sectionType, prompt, oppContext = {}) {
    return sendToAI('writer', prompt, { sectionType, opportunity: oppContext, requestType: 'content_generation' });
  }

  async function analyzeCompetitor(competitor, oppContext = {}) {
    return sendToAI('blackhat', `Analyze competitor: ${competitor.name}`, { competitor, opportunity: oppContext });
  }

  async function checkCompliance(requirements, docText) {
    return sendToAI('compliance', 'Check compliance against requirements', { requirements, documentText: docText });
  }

  async function generateOralsSlide(slideTitle, oppContext = {}) {
    return sendToAI('orals', `Generate orals slide: ${slideTitle}`, { slideTitle, opportunity: oppContext });
  }

  async function analyzePricing(lcats, targetMargin = 15) {
    return sendToAI('pricing', 'Analyze pricing competitiveness', { lcats, targetMargin });
  }

  // REAL-TIME SUBSCRIPTIONS
  function subscribeToTable(table, callback) {
    if (!supabase && !initSupabase()) return () => {};
    const channel = supabase.channel(`${table}-changes`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => {
        callback({ eventType: payload.eventType, new: payload.new, old: payload.old });
      }).subscribe();
    return () => channel.unsubscribe();
  }

  function subscribeToOpportunities(callback) { return subscribeToTable('opportunities', callback); }
  function subscribeToCompetitors(callback) { return subscribeToTable('competitors', callback); }
  function subscribeToPartners(callback) { return subscribeToTable('partners', callback); }

  // UTILITIES
  function onConnectionChange(callback) {
    connectionListeners.push(callback);
    callback(connectionStatus);
    return () => { const i = connectionListeners.indexOf(callback); if (i > -1) connectionListeners.splice(i, 1); };
  }
  function getConnectionStatus() { return connectionStatus; }
  function formatCurrency(v) {
    if (!v) return '$0';
    if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
    if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
    if (v >= 1e3) return `$${(v / 1e3).toFixed(0)}K`;
    return `$${v.toLocaleString()}`;
  }
  function getPhaseInfo(key) { return SHIPLEY_PHASES[key] || SHIPLEY_PHASES.qualify; }
  function getShipleyPhases() {
    return Object.entries(SHIPLEY_PHASES).map(([k, v]) => ({ key: k, ...v })).sort((a, b) => a.order - b.order);
  }

  // EXPORT
  global.MissionPulse = {
    init: initSupabase,
    getOpportunities, getOpportunityById, createOpportunity, updateOpportunity, deleteOpportunity, getPipelineStats,
    getCompetitors, createCompetitor, updateCompetitor, deleteCompetitor,
    getPartners, createPartner, updatePartner, deletePartner,
    getComplianceRequirements, createComplianceRequirement, updateComplianceRequirement, deleteComplianceRequirement,
    getContracts, createContract,
    getSubmissions, createSubmission, updateSubmission,
    getPlaybookLessons, createPlaybookLesson, deletePlaybookLesson, incrementLessonUse,
    getActivityLog, logActivity,
    sendToAI, streamAIResponse, generateContent, analyzeCompetitor, checkCompliance, generateOralsSlide, analyzePricing,
    subscribeToOpportunities, subscribeToCompetitors, subscribeToPartners, subscribeToTable,
    onConnectionChange, getConnectionStatus, formatCurrency, getPhaseInfo, getShipleyPhases,
    SHIPLEY_PHASES, SUPABASE_URL, RENDER_API_URL
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(initSupabase, 100));
  } else { setTimeout(initSupabase, 100); }

})(typeof window !== 'undefined' ? window : global);
