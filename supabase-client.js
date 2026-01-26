/**
 * MissionPulse - Supabase Client
 * Centralized authentication and database access
 * 
 * Usage:
 *   <script src="https://unpkg.com/@supabase/supabase-js@2"></script>
 *   <script src="supabase-client.js"></script>
 *   
 *   // Then use:
 *   await MP.auth.getUser();
 *   await MP.db.getOpportunities();
 */

const MP = (function() {
  // ===========================================
  // CONFIGURATION
  // ===========================================
  const SUPABASE_URL = 'https://djuviwarqdvlbgcfuupa.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqdXZpd2FycWR2bGJnY2Z1dXBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NDQ0NjUsImV4cCI6MjA4NTAyMDQ2NX0.3s8ufDDN2aWfkW0RBsAyJyacb2tjB7M550WSFIohHcA';
  
  // Initialize Supabase client
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  // Cache for user data
  let _currentUser = null;
  let _currentCompany = null;
  
  // ===========================================
  // AUTHENTICATION MODULE
  // ===========================================
  const auth = {
    /**
     * Get current session
     */
    async getSession() {
      const { data: { session }, error } = await supabase.auth.getSession();
      return { session, error };
    },
    
    /**
     * Get current user with profile data
     */
    async getUser() {
      if (_currentUser) return _currentUser;
      
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) return null;
      
      // Get user profile from our users table
      const { data: profile } = await supabase
        .from('users')
        .select('*, companies(*)')
        .eq('id', user.id)
        .single();
      
      if (profile) {
        _currentUser = {
          id: user.id,
          email: user.email,
          ...profile
        };
        _currentCompany = profile.companies;
      }
      
      return _currentUser;
    },
    
    /**
     * Get current company
     */
    async getCompany() {
      if (_currentCompany) return _currentCompany;
      await this.getUser();
      return _currentCompany;
    },
    
    /**
     * Check if user is logged in
     */
    async isAuthenticated() {
      const { session } = await this.getSession();
      return !!session;
    },
    
    /**
     * Sign out
     */
    async signOut() {
      _currentUser = null;
      _currentCompany = null;
      const { error } = await supabase.auth.signOut();
      if (!error) {
        window.location.href = 'login.html';
      }
      return { error };
    },
    
    /**
     * Require authentication - redirect to login if not authenticated
     */
    async requireAuth() {
      const isAuth = await this.isAuthenticated();
      if (!isAuth) {
        window.location.href = 'login.html';
        return false;
      }
      return true;
    },
    
    /**
     * Check if user has required role
     */
    async hasRole(allowedRoles) {
      const user = await this.getUser();
      if (!user) return false;
      
      if (Array.isArray(allowedRoles)) {
        return allowedRoles.includes(user.role);
      }
      return user.role === allowedRoles;
    },
    
    /**
     * RBAC role hierarchy
     */
    roleHierarchy: {
      'CEO': ['*'],
      'COO': ['*'],
      'CAP': ['strategy', 'intelligence', 'pricing', 'delivery', 'compliance'],
      'PM': ['delivery', 'compliance', 'team'],
      'SA': ['delivery', 'technical'],
      'FIN': ['pricing', 'contracts'],
      'CON': ['compliance', 'contracts'],
      'DEL': ['delivery', 'staffing'],
      'QA': ['review', 'compliance'],
      'Partner': ['assigned_only'],
      'Admin': ['admin', 'users', 'settings']
    },
    
    /**
     * Check if user can access a module
     */
    async canAccessModule(module) {
      const user = await this.getUser();
      if (!user) return false;
      
      const permissions = this.roleHierarchy[user.role] || [];
      if (permissions.includes('*')) return true;
      
      // Module to permission mapping
      const modulePermissions = {
        'pipeline': ['strategy', '*'],
        'warroom': ['strategy', 'delivery', '*'],
        'swimlane': ['delivery', '*'],
        'contracts': ['contracts', 'compliance', '*'],
        'irondome': ['delivery', '*'],
        'blackhat': ['strategy', '*'],  // RESTRICTED
        'pricing': ['pricing', '*'],     // RESTRICTED
        'hitl': ['review', '*'],
        'orals': ['strategy', '*'],      // RESTRICTED
        'frenemy': ['strategy', '*'],    // RESTRICTED
        'dashboard': ['*'],
        'roi': ['strategy', '*'],
        'postaward': ['delivery', '*'],
        'lessons': ['*'],
        'rbac': ['admin', '*']           // ADMIN ONLY
      };
      
      const requiredPerms = modulePermissions[module] || ['*'];
      return requiredPerms.some(p => permissions.includes(p) || permissions.includes('*'));
    }
  };
  
  // ===========================================
  // DATABASE MODULE
  // ===========================================
  const db = {
    /**
     * Get all opportunities for current company
     */
    async getOpportunities(filters = {}) {
      const company = await auth.getCompany();
      if (!company) return { data: [], error: 'Not authenticated' };
      
      let query = supabase
        .from('opportunities')
        .select('*')
        .eq('company_id', company.id)
        .order('submission_deadline', { ascending: true });
      
      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.phase) {
        query = query.eq('shipley_phase', filters.phase);
      }
      if (filters.priority) {
        query = query.eq('priority', filters.priority);
      }
      
      const { data, error } = await query;
      return { data: data || [], error };
    },
    
    /**
     * Get single opportunity by ID
     */
    async getOpportunity(id) {
      const { data, error } = await supabase
        .from('opportunities')
        .select('*, capture_manager:users!capture_manager_id(*), proposal_manager:users!proposal_manager_id(*)')
        .eq('id', id)
        .single();
      
      return { data, error };
    },
    
    /**
     * Create new opportunity
     */
    async createOpportunity(opportunity) {
      const company = await auth.getCompany();
      const user = await auth.getUser();
      if (!company || !user) return { data: null, error: 'Not authenticated' };
      
      const { data, error } = await supabase
        .from('opportunities')
        .insert({
          ...opportunity,
          company_id: company.id
        })
        .select()
        .single();
      
      // Log to audit
      if (data) {
        await this.logAudit('create', 'opportunity', data.id, data.title);
      }
      
      return { data, error };
    },
    
    /**
     * Update opportunity
     */
    async updateOpportunity(id, updates) {
      const { data, error } = await supabase
        .from('opportunities')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (data) {
        await this.logAudit('update', 'opportunity', id, data.title);
      }
      
      return { data, error };
    },
    
    /**
     * Get proposal sections for an opportunity
     */
    async getProposalSections(opportunityId) {
      const { data, error } = await supabase
        .from('proposal_sections')
        .select('*, assigned_to:users!assigned_to(*)')
        .eq('opportunity_id', opportunityId)
        .order('volume')
        .order('section_number');
      
      return { data: data || [], error };
    },
    
    /**
     * Get compliance requirements for an opportunity
     */
    async getComplianceRequirements(opportunityId) {
      const { data, error } = await supabase
        .from('compliance_requirements')
        .select('*')
        .eq('opportunity_id', opportunityId)
        .order('requirement_id');
      
      return { data: data || [], error };
    },
    
    /**
     * Get team assignments for an opportunity
     */
    async getTeamAssignments(opportunityId) {
      const { data, error } = await supabase
        .from('team_assignments')
        .select('*, user:users(*)')
        .eq('opportunity_id', opportunityId);
      
      return { data: data || [], error };
    },
    
    /**
     * Get company users
     */
    async getCompanyUsers() {
      const company = await auth.getCompany();
      if (!company) return { data: [], error: 'Not authenticated' };
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('company_id', company.id)
        .order('full_name');
      
      return { data: data || [], error };
    },
    
    /**
     * Get lessons learned / playbook entries
     */
    async getLessonsLearned(filters = {}) {
      const company = await auth.getCompany();
      if (!company) return { data: [], error: 'Not authenticated' };
      
      let query = supabase
        .from('lessons_learned')
        .select('*')
        .eq('company_id', company.id)
        .order('created_at', { ascending: false });
      
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      if (filters.starred) {
        query = query.eq('is_starred', true);
      }
      
      const { data, error } = await query;
      return { data: data || [], error };
    },
    
    /**
     * Save to playbook
     */
    async saveToPlaybook(entry) {
      const company = await auth.getCompany();
      const user = await auth.getUser();
      if (!company || !user) return { data: null, error: 'Not authenticated' };
      
      const { data, error } = await supabase
        .from('lessons_learned')
        .insert({
          ...entry,
          company_id: company.id,
          created_by: user.id
        })
        .select()
        .single();
      
      return { data, error };
    },
    
    /**
     * Get chat history
     */
    async getChatHistory(agentName = null, opportunityId = null) {
      const user = await auth.getUser();
      if (!user) return { data: [], error: 'Not authenticated' };
      
      let query = supabase
        .from('chat_history')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      
      if (agentName) {
        query = query.eq('agent_name', agentName);
      }
      if (opportunityId) {
        query = query.eq('opportunity_id', opportunityId);
      }
      
      const { data, error } = await query.limit(50);
      return { data: data || [], error };
    },
    
    /**
     * Save chat message
     */
    async saveChatMessage(agentName, messages, opportunityId = null) {
      const user = await auth.getUser();
      const company = await auth.getCompany();
      if (!user || !company) return { data: null, error: 'Not authenticated' };
      
      // Check if there's an existing chat session for this agent/opportunity
      let query = supabase
        .from('chat_history')
        .select('*')
        .eq('user_id', user.id)
        .eq('agent_name', agentName);
      
      if (opportunityId) {
        query = query.eq('opportunity_id', opportunityId);
      }
      
      const { data: existing } = await query.order('created_at', { ascending: false }).limit(1);
      
      if (existing && existing.length > 0) {
        // Update existing chat
        const { data, error } = await supabase
          .from('chat_history')
          .update({
            messages: messages,
            message_count: messages.length
          })
          .eq('id', existing[0].id)
          .select()
          .single();
        
        return { data, error };
      } else {
        // Create new chat
        const { data, error } = await supabase
          .from('chat_history')
          .insert({
            user_id: user.id,
            company_id: company.id,
            agent_name: agentName,
            opportunity_id: opportunityId,
            messages: messages,
            message_count: messages.length
          })
          .select()
          .single();
        
        return { data, error };
      }
    },
    
    /**
     * Get notifications
     */
    async getNotifications(unreadOnly = false) {
      const user = await auth.getUser();
      if (!user) return { data: [], error: 'Not authenticated' };
      
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (unreadOnly) {
        query = query.eq('is_read', false);
      }
      
      const { data, error } = await query.limit(50);
      return { data: data || [], error };
    },
    
    /**
     * Mark notification as read
     */
    async markNotificationRead(notificationId) {
      const { data, error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);
      
      return { data, error };
    },
    
    /**
     * Log audit event
     */
    async logAudit(action, resourceType, resourceId, resourceName = null) {
      const user = await auth.getUser();
      const company = await auth.getCompany();
      if (!company) return;
      
      await supabase.from('audit_log').insert({
        company_id: company.id,
        user_id: user?.id,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        resource_name: resourceName
      });
    },
    
    /**
     * Get dashboard stats
     */
    async getDashboardStats() {
      const company = await auth.getCompany();
      if (!company) return null;
      
      const { data: opportunities } = await this.getOpportunities({ status: 'active' });
      
      if (!opportunities) return null;
      
      const stats = {
        totalOpportunities: opportunities.length,
        totalPipelineValue: opportunities.reduce((sum, o) => sum + (o.estimated_value || 0), 0),
        avgPwin: Math.round(opportunities.reduce((sum, o) => sum + (o.pwin || 0), 0) / (opportunities.length || 1)),
        byPhase: {},
        byPriority: {},
        upcomingDeadlines: []
      };
      
      // Count by phase
      opportunities.forEach(o => {
        stats.byPhase[o.shipley_phase] = (stats.byPhase[o.shipley_phase] || 0) + 1;
        stats.byPriority[o.priority] = (stats.byPriority[o.priority] || 0) + 1;
      });
      
      // Get upcoming deadlines (next 30 days)
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      
      stats.upcomingDeadlines = opportunities
        .filter(o => o.submission_deadline && new Date(o.submission_deadline) <= thirtyDaysFromNow)
        .sort((a, b) => new Date(a.submission_deadline) - new Date(b.submission_deadline))
        .slice(0, 5);
      
      return stats;
    }
  };
  
  // ===========================================
  // UTILITY FUNCTIONS
  // ===========================================
  const utils = {
    /**
     * Format currency
     */
    formatCurrency(cents) {
      if (!cents) return '$0';
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(cents / 100);
    },
    
    /**
     * Format date
     */
    formatDate(dateString) {
      if (!dateString) return 'N/A';
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    },
    
    /**
     * Days until deadline
     */
    daysUntil(dateString) {
      if (!dateString) return null;
      const deadline = new Date(dateString);
      const today = new Date();
      const diffTime = deadline - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    },
    
    /**
     * Shipley phase display name
     */
    phaseDisplayName(phase) {
      const names = {
        'gate1': 'Gate 1',
        'blue': 'Blue Team',
        'kickoff': 'Kickoff',
        'pink': 'Pink Team',
        'red': 'Red Team',
        'gold': 'Gold Team',
        'white': 'White Glove',
        'submit': 'Submitted',
        'awarded': 'Awarded',
        'lost': 'Lost'
      };
      return names[phase] || phase;
    },
    
    /**
     * Phase color
     */
    phaseColor(phase) {
      const colors = {
        'gate1': 'gray',
        'blue': 'blue',
        'kickoff': 'purple',
        'pink': 'pink',
        'red': 'red',
        'gold': 'yellow',
        'white': 'white',
        'submit': 'green',
        'awarded': 'emerald',
        'lost': 'slate'
      };
      return colors[phase] || 'gray';
    }
  };
  
  // ===========================================
  // EXPOSE PUBLIC API
  // ===========================================
  return {
    supabase,  // Direct access to Supabase client if needed
    auth,
    db,
    utils
  };
})();

// Make available globally
window.MP = MP;
