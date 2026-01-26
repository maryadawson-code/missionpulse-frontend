/**
 * MissionPulse Supabase Client Helper
 * Provides MP.auth and MP.db namespaces for common operations
 * 
 * Usage:
 *   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
 *   <script src="supabase-client.js"></script>
 *   
 *   // Then use:
 *   await MP.auth.login(email, password);
 *   await MP.db.getOpportunities();
 */

// ============================================================
// CONFIGURATION
// ============================================================
const SUPABASE_URL = 'https://djuviwarqdvlbgcfuupa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqdXZpd2FycWR2bGJnY2Z1dXBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NDQ0NjUsImV4cCI6MjA4NTAyMDQ2NX0.3s8ufDDN2aWfkW0RBsAyJyacb2tjB7M550WSFIohHcA';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================================
// MISSIONPULSE NAMESPACE
// ============================================================
const MP = {
  // Direct access to supabase client
  client: supabase,
  
  // ============================================================
  // AUTH NAMESPACE
  // ============================================================
  auth: {
    /**
     * Get current session
     * @returns {Promise<{session: Object|null, error: Error|null}>}
     */
    async getSession() {
      const { data, error } = await supabase.auth.getSession();
      return { session: data?.session, error };
    },
    
    /**
     * Get current user
     * @returns {Promise<{user: Object|null, error: Error|null}>}
     */
    async getUser() {
      const { data, error } = await supabase.auth.getUser();
      return { user: data?.user, error };
    },
    
    /**
     * Login with email and password
     * @param {string} email 
     * @param {string} password 
     * @returns {Promise<{user: Object|null, session: Object|null, error: Error|null}>}
     */
    async login(email, password) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      return { user: data?.user, session: data?.session, error };
    },
    
    /**
     * Sign up with email and password
     * @param {string} email 
     * @param {string} password 
     * @param {Object} metadata - Additional user metadata (full_name, etc.)
     * @returns {Promise<{user: Object|null, session: Object|null, error: Error|null}>}
     */
    async signup(email, password, metadata = {}) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: metadata }
      });
      return { user: data?.user, session: data?.session, error };
    },
    
    /**
     * Logout current user
     * @returns {Promise<{error: Error|null}>}
     */
    async logout() {
      const { error } = await supabase.auth.signOut();
      return { error };
    },
    
    /**
     * Send password reset email
     * @param {string} email 
     * @returns {Promise<{error: Error|null}>}
     */
    async resetPassword(email) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password.html'
      });
      return { error };
    },
    
    /**
     * OAuth sign in
     * @param {string} provider - 'google' or 'azure'
     * @returns {Promise<{error: Error|null}>}
     */
    async oauthLogin(provider) {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: window.location.origin + '/index.html' }
      });
      return { error };
    },
    
    /**
     * Listen for auth state changes
     * @param {Function} callback - (event, session) => void
     * @returns {Object} subscription object with unsubscribe method
     */
    onAuthStateChange(callback) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
      return subscription;
    },
    
    /**
     * Check if user is authenticated, redirect if not
     * @param {string} redirectUrl - URL to redirect to if not authenticated
     * @returns {Promise<{user: Object|null, session: Object|null}>}
     */
    async requireAuth(redirectUrl = '/login.html') {
      const { session, error } = await this.getSession();
      if (error || !session) {
        window.location.href = redirectUrl;
        return { user: null, session: null };
      }
      return { user: session.user, session };
    }
  },
  
  // ============================================================
  // DATABASE NAMESPACE
  // ============================================================
  db: {
    /**
     * Get current user's company ID
     * @returns {Promise<string|null>}
     */
    async getCompanyId() {
      const { user } = await MP.auth.getUser();
      if (!user) return null;
      
      const { data } = await supabase
        .from('users')
        .select('company_id')
        .eq('id', user.id)
        .single();
      
      return data?.company_id || null;
    },
    
    /**
     * Get current user's profile with company
     * @returns {Promise<{data: Object|null, error: Error|null}>}
     */
    async getUserProfile() {
      const { user } = await MP.auth.getUser();
      if (!user) return { data: null, error: new Error('Not authenticated') };
      
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          companies (
            id,
            name,
            domain,
            cage_code,
            duns_number,
            naics_codes,
            set_aside_status
          )
        `)
        .eq('id', user.id)
        .single();
      
      return { data, error };
    },
    
    /**
     * Get all opportunities for current user's company
     * @param {Object} options - Filter options
     * @param {string} options.phase - Shipley phase filter
     * @param {string} options.priority - Priority filter
     * @param {string} options.status - Status filter (default: 'active')
     * @param {string} options.orderBy - Column to order by
     * @param {boolean} options.ascending - Sort direction
     * @returns {Promise<{data: Array, error: Error|null}>}
     */
    async getOpportunities(options = {}) {
      const companyId = await this.getCompanyId();
      if (!companyId) return { data: [], error: new Error('No company ID') };
      
      let query = supabase
        .from('opportunities')
        .select('*')
        .eq('company_id', companyId);
      
      if (options.phase && options.phase !== 'all') {
        query = query.eq('shipley_phase', options.phase);
      }
      
      if (options.priority && options.priority !== 'all') {
        query = query.eq('priority', options.priority);
      }
      
      if (options.status) {
        query = query.eq('status', options.status);
      }
      
      query = query.order(options.orderBy || 'submission_deadline', { 
        ascending: options.ascending ?? true 
      });
      
      const { data, error } = await query;
      return { data: data || [], error };
    },
    
    /**
     * Get single opportunity by ID
     * @param {string} id 
     * @returns {Promise<{data: Object|null, error: Error|null}>}
     */
    async getOpportunity(id) {
      const { data, error } = await supabase
        .from('opportunities')
        .select(`
          *,
          proposal_sections (*),
          compliance_requirements (*),
          team_assignments (
            *,
            users (id, full_name, email, role)
          )
        `)
        .eq('id', id)
        .single();
      
      return { data, error };
    },
    
    /**
     * Create new opportunity
     * @param {Object} opportunity 
     * @returns {Promise<{data: Object|null, error: Error|null}>}
     */
    async createOpportunity(opportunity) {
      const companyId = await this.getCompanyId();
      if (!companyId) return { data: null, error: new Error('No company ID') };
      
      const { data, error } = await supabase
        .from('opportunities')
        .insert({ ...opportunity, company_id: companyId })
        .select()
        .single();
      
      return { data, error };
    },
    
    /**
     * Update opportunity
     * @param {string} id 
     * @param {Object} updates 
     * @returns {Promise<{data: Object|null, error: Error|null}>}
     */
    async updateOpportunity(id, updates) {
      const { data, error } = await supabase
        .from('opportunities')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      return { data, error };
    },
    
    /**
     * Delete opportunity
     * @param {string} id 
     * @returns {Promise<{error: Error|null}>}
     */
    async deleteOpportunity(id) {
      const { error } = await supabase
        .from('opportunities')
        .delete()
        .eq('id', id);
      
      return { error };
    },
    
    /**
     * Get company users
     * @returns {Promise<{data: Array, error: Error|null}>}
     */
    async getCompanyUsers() {
      const companyId = await this.getCompanyId();
      if (!companyId) return { data: [], error: new Error('No company ID') };
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('company_id', companyId)
        .order('full_name');
      
      return { data: data || [], error };
    },
    
    /**
     * Get chat history for an opportunity
     * @param {string} opportunityId 
     * @param {number} limit 
     * @returns {Promise<{data: Array, error: Error|null}>}
     */
    async getChatHistory(opportunityId, limit = 50) {
      const { data, error } = await supabase
        .from('chat_history')
        .select(`
          *,
          users (id, full_name)
        `)
        .eq('opportunity_id', opportunityId)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      return { data: (data || []).reverse(), error };
    },
    
    /**
     * Save chat message
     * @param {Object} message 
     * @returns {Promise<{data: Object|null, error: Error|null}>}
     */
    async saveChatMessage(message) {
      const companyId = await this.getCompanyId();
      const { user } = await MP.auth.getUser();
      
      const { data, error } = await supabase
        .from('chat_history')
        .insert({
          ...message,
          company_id: companyId,
          user_id: user?.id
        })
        .select()
        .single();
      
      return { data, error };
    },
    
    /**
     * Log audit event
     * @param {Object} event 
     * @returns {Promise<{error: Error|null}>}
     */
    async logAudit(event) {
      const companyId = await this.getCompanyId();
      const { user } = await MP.auth.getUser();
      
      const { error } = await supabase
        .from('audit_log')
        .insert({
          ...event,
          company_id: companyId,
          user_id: user?.id
        });
      
      return { error };
    }
  },
  
  // ============================================================
  // REALTIME NAMESPACE
  // ============================================================
  realtime: {
    /**
     * Subscribe to opportunity changes
     * @param {string} companyId 
     * @param {Function} callback - (payload) => void
     * @returns {Object} channel object
     */
    subscribeToOpportunities(companyId, callback) {
      return supabase
        .channel('opportunities-changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'opportunities',
          filter: `company_id=eq.${companyId}`
        }, callback)
        .subscribe();
    },
    
    /**
     * Subscribe to notifications
     * @param {string} userId 
     * @param {Function} callback 
     * @returns {Object} channel object
     */
    subscribeToNotifications(userId, callback) {
      return supabase
        .channel('notifications')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        }, callback)
        .subscribe();
    },
    
    /**
     * Unsubscribe from a channel
     * @param {Object} channel 
     */
    unsubscribe(channel) {
      if (channel) {
        supabase.removeChannel(channel);
      }
    }
  },
  
  // ============================================================
  // STORAGE NAMESPACE
  // ============================================================
  storage: {
    /**
     * Upload file
     * @param {string} bucket 
     * @param {string} path 
     * @param {File} file 
     * @returns {Promise<{data: Object|null, error: Error|null}>}
     */
    async uploadFile(bucket, path, file) {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      return { data, error };
    },
    
    /**
     * Get file URL
     * @param {string} bucket 
     * @param {string} path 
     * @returns {string}
     */
    getFileUrl(bucket, path) {
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      return data?.publicUrl;
    },
    
    /**
     * Delete file
     * @param {string} bucket 
     * @param {string} path 
     * @returns {Promise<{error: Error|null}>}
     */
    async deleteFile(bucket, path) {
      const { error } = await supabase.storage.from(bucket).remove([path]);
      return { error };
    },
    
    /**
     * List files in a folder
     * @param {string} bucket 
     * @param {string} folder 
     * @returns {Promise<{data: Array, error: Error|null}>}
     */
    async listFiles(bucket, folder) {
      const { data, error } = await supabase.storage.from(bucket).list(folder);
      return { data: data || [], error };
    }
  }
};

// Export for use in other scripts
window.MP = MP;
window.supabase = supabase;

console.log('✅ MissionPulse Supabase Client loaded');
