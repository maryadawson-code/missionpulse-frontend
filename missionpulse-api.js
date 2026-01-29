/**
 * FILE: missionpulse-api.js
 * ROLE: System
 * SECURITY: Uses supabase-client.js credentials
 * SPRINT: 49 - Data Wiring Batch 1
 * 
 * MissionPulse Data API - Live Supabase Integration
 * Modules: M1 Pipeline, M2 War Room, M3 Swimlane
 */

const MissionPulse = {
  // ============================================
  // OPPORTUNITIES (M1 Pipeline, M3 Swimlane)
  // ============================================
  
  async getOpportunities(filters = {}) {
    try {
      let query = supabase
        .from('opportunities')
        .select(`
          *,
          company:companies(name, logo_url),
          team_assignments(
            id,
            role,
            user:profiles(id, email, full_name, role)
          )
        `)
        .order('response_date', { ascending: true });

      // Apply filters
      if (filters.phase) {
        query = query.eq('phase', filters.phase);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.minValue) {
        query = query.gte('value', filters.minValue);
      }
      if (filters.maxValue) {
        query = query.lte('value', filters.maxValue);
      }
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,nickname.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('[MissionPulse] getOpportunities error:', err);
      return [];
    }
  },

  async getOpportunityById(id) {
    try {
      const { data, error } = await supabase
        .from('opportunities')
        .select(`
          *,
          company:companies(name, logo_url),
          team_assignments(
            id,
            role,
            user:profiles(id, email, full_name, role)
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('[MissionPulse] getOpportunityById error:', err);
      return null;
    }
  },

  async createOpportunity(opportunity) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user?.id)
        .single();

      const newOpp = {
        ...opportunity,
        company_id: profile?.company_id || opportunity.company_id,
        created_at: new Date().toISOString(),
        status: opportunity.status || 'active',
        phase: opportunity.phase || 'Phase 0 - Market Intel'
      };

      const { data, error } = await supabase
        .from('opportunities')
        .insert([newOpp])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('[MissionPulse] createOpportunity error:', err);
      throw err;
    }
  },

  async updateOpportunity(id, updates) {
    try {
      const { data, error } = await supabase
        .from('opportunities')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('[MissionPulse] updateOpportunity error:', err);
      throw err;
    }
  },

  async deleteOpportunity(id) {
    try {
      const { error } = await supabase
        .from('opportunities')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('[MissionPulse] deleteOpportunity error:', err);
      throw err;
    }
  },

  // Update phase (M3 Swimlane drag-drop)
  async updateOpportunityPhase(id, newPhase) {
    try {
      const { data, error } = await supabase
        .from('opportunities')
        .update({
          phase: newPhase,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      console.log(`[MissionPulse] Phase updated: ${id} → ${newPhase}`);
      return data;
    } catch (err) {
      console.error('[MissionPulse] updateOpportunityPhase error:', err);
      throw err;
    }
  },

  // ============================================
  // TEAM ASSIGNMENTS (M2 War Room)
  // ============================================

  async getTeamAssignments(opportunityId) {
    try {
      let query = supabase
        .from('team_assignments')
        .select(`
          *,
          user:profiles(id, email, full_name, role),
          opportunity:opportunities(id, name, nickname)
        `)
        .eq('status', 'active');

      if (opportunityId) {
        query = query.eq('opportunity_id', opportunityId);
      }

      query = query.order('assigned_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('[MissionPulse] getTeamAssignments error:', err);
      return [];
    }
  },

  async assignTeamMember(opportunityId, userId, role, hoursAllocated = 0) {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('team_assignments')
        .upsert([{
          opportunity_id: opportunityId,
          user_id: userId,
          role: role,
          hours_allocated: hoursAllocated,
          assigned_by: user?.id,
          assigned_at: new Date().toISOString(),
          status: 'active'
        }], {
          onConflict: 'opportunity_id,user_id,role'
        })
        .select(`
          *,
          user:profiles(id, email, full_name, role)
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('[MissionPulse] assignTeamMember error:', err);
      throw err;
    }
  },

  async removeTeamMember(assignmentId) {
    try {
      const { error } = await supabase
        .from('team_assignments')
        .update({ status: 'removed' })
        .eq('id', assignmentId);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('[MissionPulse] removeTeamMember error:', err);
      throw err;
    }
  },

  async updateTeamAssignment(assignmentId, updates) {
    try {
      const { data, error } = await supabase
        .from('team_assignments')
        .update(updates)
        .eq('id', assignmentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('[MissionPulse] updateTeamAssignment error:', err);
      throw err;
    }
  },

  // ============================================
  // PIPELINE STATISTICS
  // ============================================

  async getPipelineStats() {
    try {
      const opps = await this.getOpportunities();
      
      const stats = {
        totalOpportunities: opps.length,
        totalValue: opps.reduce((sum, o) => sum + (parseInt(o.value) || 0), 0),
        avgPwin: opps.length > 0 
          ? Math.round(opps.reduce((sum, o) => sum + (parseInt(o.pwin) || 0), 0) / opps.length) 
          : 0,
        byPhase: {},
        byStatus: {},
        upcoming: opps.filter(o => {
          const dueDate = new Date(o.response_date);
          const now = new Date();
          const daysOut = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
          return daysOut > 0 && daysOut <= 30;
        }).length
      };

      // Group by phase
      opps.forEach(o => {
        const phase = o.phase || 'Unknown';
        if (!stats.byPhase[phase]) {
          stats.byPhase[phase] = { count: 0, value: 0 };
        }
        stats.byPhase[phase].count++;
        stats.byPhase[phase].value += parseInt(o.value) || 0;
      });

      // Group by status
      opps.forEach(o => {
        const status = o.status || 'active';
        if (!stats.byStatus[status]) {
          stats.byStatus[status] = 0;
        }
        stats.byStatus[status]++;
      });

      return stats;
    } catch (err) {
      console.error('[MissionPulse] getPipelineStats error:', err);
      return {
        totalOpportunities: 0,
        totalValue: 0,
        avgPwin: 0,
        byPhase: {},
        byStatus: {},
        upcoming: 0
      };
    }
  },

  // ============================================
  // USER & PROFILE
  // ============================================

  async getCurrentUser() {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) return null;

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*, company:companies(name, logo_url)')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.warn('[MissionPulse] Profile not found, using auth data');
        return {
          id: user.id,
          email: user.email,
          role: 'viewer',
          full_name: user.email?.split('@')[0] || 'User'
        };
      }

      return profile;
    } catch (err) {
      console.error('[MissionPulse] getCurrentUser error:', err);
      return null;
    }
  },

  async getTeamMembers() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.company_id) return [];

      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, role')
        .eq('company_id', profile.company_id)
        .order('full_name');

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('[MissionPulse] getTeamMembers error:', err);
      return [];
    }
  },

  // ============================================
  // REAL-TIME SUBSCRIPTIONS
  // ============================================

  subscribeToOpportunities(callback) {
    return supabase
      .channel('opportunities-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'opportunities' },
        payload => {
          console.log('[MissionPulse] Opportunity change:', payload.eventType);
          callback(payload);
        }
      )
      .subscribe();
  },

  subscribeToTeamAssignments(opportunityId, callback) {
    return supabase
      .channel(`team-${opportunityId}`)
      .on('postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'team_assignments',
          filter: `opportunity_id=eq.${opportunityId}`
        },
        payload => {
          console.log('[MissionPulse] Team assignment change:', payload.eventType);
          callback(payload);
        }
      )
      .subscribe();
  },

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================

  formatCurrency(value) {
    const num = parseInt(value) || 0;
    if (num >= 1000000000) {
      return `$${(num / 1000000000).toFixed(1)}B`;
    }
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `$${(num / 1000).toFixed(0)}K`;
    }
    return `$${num}`;
  },

  getDaysUntil(dateString) {
    if (!dateString) return null;
    const target = new Date(dateString);
    const now = new Date();
    return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
  },

  getPhaseColor(phase) {
    const colors = {
      'Phase 0 - Market Intel': '#6366f1',
      'Phase 1 - Opportunity ID': '#8b5cf6',
      'Phase 2 - Capture Planning': '#a855f7',
      'Phase 3 - Proposal Development': '#00E5FA',
      'Phase 4 - Proposal Submission': '#22c55e',
      'Phase 5 - Post-Submission': '#eab308',
      'Phase 6 - Award/Debrief': '#ef4444'
    };
    return colors[phase] || '#6b7280';
  },

  getPwinColor(pwin) {
    const p = parseInt(pwin) || 0;
    if (p >= 70) return '#22c55e';
    if (p >= 50) return '#eab308';
    if (p >= 30) return '#f97316';
    return '#ef4444';
  }
};

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MissionPulse;
}

console.log('[MissionPulse API] v49 loaded - Pipeline, War Room, Swimlane ready');
