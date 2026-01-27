/**
 * MissionPulse Supabase Client
 * ============================
 * Authentication and data access layer for MissionPulse
 * 
 * @version 1.0.0
 * @author Mission Meets Tech
 */

// ============================================
// CONFIGURATION
// ============================================
const SUPABASE_URL = 'https://djuviwarqdvlbgcfuupa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqdXZpd2FycWR2bGJnY2Z1dXBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc4MzUyMjQsImV4cCI6MjA1MzQxMTIyNH0.pBPL9l2zL7LLd_A5I--hPBzw5YwG3ajPMtbYsqsxIgQ';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================
// MISSIONPULSE GLOBAL OBJECT
// ============================================
const MissionPulse = {
    // Expose supabase client for direct access if needed
    client: supabase,

    // ========================================
    // AUTHENTICATION METHODS
    // ========================================

    /**
     * Sign in with email and password
     * @param {string} email 
     * @param {string} password 
     * @returns {Promise<{data, error}>}
     */
    async signIn(email, password) {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (!error && data?.user) {
            // Log auth event
            await this.logAuthEvent('signin', data.user.id);
            // Update last login
            await supabase
                .from('users')
                .update({ last_login: new Date().toISOString() })
                .eq('id', data.user.id);
        }

        return { data, error };
    },

    /**
     * Sign up with email and password
     * @param {string} email 
     * @param {string} password 
     * @param {Object} metadata - Additional user data (full_name, company_name)
     * @returns {Promise<{data, error}>}
     */
    async signUp(email, password, metadata = {}) {
        // First create the auth user
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: metadata.full_name,
                    company_name: metadata.company_name
                },
                emailRedirectTo: `${window.location.origin}/login.html`
            }
        });

        if (!error && data?.user && metadata.company_name) {
            // Create company for new user
            const { data: company, error: companyError } = await supabase
                .from('companies')
                .insert({
                    name: metadata.company_name,
                    subscription_tier: 'starter'
                })
                .select()
                .single();

            if (company) {
                // Link user to company and set as Admin
                await supabase
                    .from('users')
                    .update({
                        company_id: company.id,
                        role_id: 11 // Admin role
                    })
                    .eq('id', data.user.id);
            }
        }

        return { data, error };
    },

    /**
     * Sign in with OAuth provider
     * @param {string} provider - 'google' or 'azure'
     * @returns {Promise<{data, error}>}
     */
    async signInWithProvider(provider) {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: `${window.location.origin}/index.html`
            }
        });

        return { data, error };
    },

    /**
     * Sign out current user
     * @returns {Promise<{error}>}
     */
    async signOut() {
        const user = await this.getCurrentUser();
        if (user) {
            await this.logAuthEvent('signout', user.id);
        }
        
        const { error } = await supabase.auth.signOut();
        
        if (!error) {
            // Clear any cached data
            sessionStorage.clear();
            window.location.href = 'login.html';
        }

        return { error };
    },

    /**
     * Send password reset email
     * @param {string} email 
     * @returns {Promise<{data, error}>}
     */
    async resetPassword(email) {
        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/login.html?reset=true`
        });

        return { data, error };
    },

    /**
     * Update user password
     * @param {string} newPassword 
     * @returns {Promise<{data, error}>}
     */
    async updatePassword(newPassword) {
        const { data, error } = await supabase.auth.updateUser({
            password: newPassword
        });

        return { data, error };
    },

    /**
     * Get current authenticated user
     * @returns {Promise<Object|null>}
     */
    async getCurrentUser() {
        const { data: { user } } = await supabase.auth.getUser();
        return user;
    },

    /**
     * Get current session
     * @returns {Promise<Object|null>}
     */
    async getSession() {
        const { data: { session } } = await supabase.auth.getSession();
        return session;
    },

    /**
     * Get full user profile with company and role
     * @returns {Promise<Object|null>}
     */
    async getUserProfile() {
        const user = await this.getCurrentUser();
        if (!user) return null;

        const { data, error } = await supabase
            .from('users')
            .select(`
                *,
                company:companies(*),
                role:roles(*)
            `)
            .eq('id', user.id)
            .single();

        return error ? null : data;
    },

    /**
     * Listen for auth state changes
     * @param {Function} callback 
     * @returns {Object} subscription
     */
    onAuthStateChange(callback) {
        return supabase.auth.onAuthStateChange((event, session) => {
            callback(event, session);
        });
    },

    // ========================================
    // USER MANAGEMENT METHODS
    // ========================================

    /**
     * Update current user's profile
     * @param {Object} updates 
     * @returns {Promise<{data, error}>}
     */
    async updateProfile(updates) {
        const user = await this.getCurrentUser();
        if (!user) return { error: { message: 'Not authenticated' } };

        const { data, error } = await supabase
            .from('users')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', user.id)
            .select()
            .single();

        return { data, error };
    },

    /**
     * Get all users in current company (Admin only)
     * @returns {Promise<{data, error}>}
     */
    async getCompanyUsers() {
        const { data, error } = await supabase
            .from('users')
            .select(`
                *,
                role:roles(name, description)
            `)
            .order('created_at', { ascending: false });

        return { data, error };
    },

    /**
     * Invite user to company
     * @param {string} email 
     * @param {number} roleId 
     * @returns {Promise<{data, error}>}
     */
    async inviteUser(email, roleId) {
        const profile = await this.getUserProfile();
        if (!profile?.company_id) return { error: { message: 'No company found' } };

        const { data, error } = await supabase
            .from('invitations')
            .insert({
                company_id: profile.company_id,
                email,
                role_id: roleId,
                invited_by: profile.id
            })
            .select()
            .single();

        // TODO: Send invitation email via Edge Function

        return { data, error };
    },

    /**
     * Update user role (Admin only)
     * @param {string} userId 
     * @param {number} roleId 
     * @returns {Promise<{data, error}>}
     */
    async updateUserRole(userId, roleId) {
        const { data, error } = await supabase
            .from('users')
            .update({ role_id: roleId })
            .eq('id', userId)
            .select()
            .single();

        await this.logActivity('user_role_updated', 'user', userId, { roleId });

        return { data, error };
    },

    /**
     * Deactivate user (Admin only)
     * @param {string} userId 
     * @returns {Promise<{data, error}>}
     */
    async deactivateUser(userId) {
        const { data, error } = await supabase
            .from('users')
            .update({ is_active: false })
            .eq('id', userId)
            .select()
            .single();

        await this.logActivity('user_deactivated', 'user', userId);

        return { data, error };
    },

    // ========================================
    // RBAC / PERMISSIONS METHODS
    // ========================================

    /**
     * Check if current user has specific permission
     * @param {string} permission 
     * @returns {Promise<boolean>}
     */
    async hasPermission(permission) {
        const profile = await this.getUserProfile();
        if (!profile?.role) return false;

        const perms = profile.role.permissions;
        return perms?.all === true || perms?.[permission] === true;
    },

    /**
     * Check if current user has one of the specified roles
     * @param {string[]} roles 
     * @returns {Promise<boolean>}
     */
    async hasRole(roles) {
        const profile = await this.getUserProfile();
        if (!profile?.role) return false;

        return roles.includes(profile.role.name);
    },

    /**
     * Get all available roles
     * @returns {Promise<{data, error}>}
     */
    async getRoles() {
        const { data, error } = await supabase
            .from('roles')
            .select('*')
            .order('id');

        return { data, error };
    },

    // ========================================
    // OPPORTUNITIES METHODS
    // ========================================

    /**
     * Get all opportunities for current company
     * @param {Object} filters 
     * @returns {Promise<{data, error}>}
     */
    async getOpportunities(filters = {}) {
        let query = supabase
            .from('opportunities')
            .select('*')
            .order('created_at', { ascending: false });

        // Apply filters
        if (filters.shipley_phase) {
            query = query.eq('shipley_phase', filters.shipley_phase);
        }
        if (filters.priority) {
            query = query.eq('priority', filters.priority);
        }
        if (filters.status) {
            query = query.eq('status', filters.status);
        }

        const { data, error } = await query;
        return { data, error };
    },

    /**
     * Get single opportunity by ID
     * @param {string} id 
     * @returns {Promise<{data, error}>}
     */
    async getOpportunity(id) {
        const { data, error } = await supabase
            .from('opportunities')
            .select(`
                *,
                assignments:opportunity_assignments(*),
                comments:opportunity_comments(*)
            `)
            .eq('id', id)
            .single();

        return { data, error };
    },

    /**
     * Create new opportunity
     * @param {Object} opportunity 
     * @returns {Promise<{data, error}>}
     */
    async createOpportunity(opportunity) {
        const profile = await this.getUserProfile();
        
        const { data, error } = await supabase
            .from('opportunities')
            .insert({
                ...opportunity,
                company_id: profile?.company_id,
                created_by: profile?.id
            })
            .select()
            .single();

        if (data) {
            await this.logActivity('opportunity_created', 'opportunity', data.id);
        }

        return { data, error };
    },

    /**
     * Update opportunity
     * @param {string} id 
     * @param {Object} updates 
     * @returns {Promise<{data, error}>}
     */
    async updateOpportunity(id, updates) {
        const { data, error } = await supabase
            .from('opportunities')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (data) {
            await this.logActivity('opportunity_updated', 'opportunity', id, updates);
        }

        return { data, error };
    },

    /**
     * Delete opportunity
     * @param {string} id 
     * @returns {Promise<{error}>}
     */
    async deleteOpportunity(id) {
        await this.logActivity('opportunity_deleted', 'opportunity', id);

        const { error } = await supabase
            .from('opportunities')
            .delete()
            .eq('id', id);

        return { error };
    },

    // ========================================
    // DASHBOARD / ANALYTICS METHODS
    // ========================================

    /**
     * Get dashboard KPIs
     * @returns {Promise<Object>}
     */
    async getDashboardKPIs() {
        const { data: opportunities } = await this.getOpportunities();
        
        if (!opportunities) return null;

        const activeOpps = opportunities.filter(o => o.status === 'active');
        const totalValue = activeOpps.reduce((sum, o) => sum + (o.value || 0), 0);
        const avgPwin = activeOpps.length > 0 
            ? activeOpps.reduce((sum, o) => sum + (o.pwin || 0), 0) / activeOpps.length 
            : 0;

        // Group by phase
        const byPhase = {};
        opportunities.forEach(o => {
            const phase = o.shipley_phase || 'Unknown';
            byPhase[phase] = (byPhase[phase] || 0) + 1;
        });

        // Upcoming deadlines (next 30 days)
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        const upcomingDeadlines = opportunities.filter(o => {
            if (!o.due_date) return false;
            const due = new Date(o.due_date);
            return due >= new Date() && due <= thirtyDaysFromNow;
        }).length;

        return {
            totalOpportunities: opportunities.length,
            activeOpportunities: activeOpps.length,
            pipelineValue: totalValue,
            averagePwin: Math.round(avgPwin),
            upcomingDeadlines,
            byPhase
        };
    },

    // ========================================
    // TEAM MEMBERS (BOE/Pricing)
    // ========================================

    /**
     * Get team members for an opportunity
     * @param {string} opportunityId 
     * @returns {Promise<{data, error}>}
     */
    async getTeamMembers(opportunityId) {
        const { data, error } = await supabase
            .from('team_members')
            .select('*')
            .eq('opportunity_id', opportunityId)
            .order('created_at');

        return { data, error };
    },

    /**
     * Create team member
     * @param {Object} member 
     * @returns {Promise<{data, error}>}
     */
    async createTeamMember(member) {
        const { data, error } = await supabase
            .from('team_members')
            .insert(member)
            .select()
            .single();

        return { data, error };
    },

    /**
     * Update team member
     * @param {string} id 
     * @param {Object} updates 
     * @returns {Promise<{data, error}>}
     */
    async updateTeamMember(id, updates) {
        const { data, error } = await supabase
            .from('team_members')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        return { data, error };
    },

    /**
     * Delete team member
     * @param {string} id 
     * @returns {Promise<{error}>}
     */
    async deleteTeamMember(id) {
        const { error } = await supabase
            .from('team_members')
            .delete()
            .eq('id', id);

        return { error };
    },

    // ========================================
    // PLAYBOOK / LESSONS LEARNED
    // ========================================

    /**
     * Get playbook lessons
     * @param {Object} filters 
     * @returns {Promise<{data, error}>}
     */
    async getPlaybookLessons(filters = {}) {
        let query = supabase
            .from('playbook_lessons')
            .select('*')
            .order('created_at', { ascending: false });

        if (filters.category) {
            query = query.eq('category', filters.category);
        }
        if (filters.is_golden) {
            query = query.eq('is_golden', true);
        }

        const { data, error } = await query;
        return { data, error };
    },

    /**
     * Create playbook lesson
     * @param {Object} lesson 
     * @returns {Promise<{data, error}>}
     */
    async createPlaybookLesson(lesson) {
        const profile = await this.getUserProfile();

        const { data, error } = await supabase
            .from('playbook_lessons')
            .insert({
                ...lesson,
                company_id: profile?.company_id,
                created_by: profile?.id
            })
            .select()
            .single();

        return { data, error };
    },

    /**
     * Toggle lesson golden status
     * @param {string} id 
     * @param {boolean} isGolden 
     * @returns {Promise<{data, error}>}
     */
    async toggleGoldenLesson(id, isGolden) {
        const { data, error } = await supabase
            .from('playbook_lessons')
            .update({ is_golden: isGolden })
            .eq('id', id)
            .select()
            .single();

        return { data, error };
    },

    // ========================================
    // ACTIVITY LOGGING
    // ========================================

    /**
     * Log user activity
     * @param {string} action 
     * @param {string} entityType 
     * @param {string} entityId 
     * @param {Object} metadata 
     */
    async logActivity(action, entityType, entityId, metadata = {}) {
        const user = await this.getCurrentUser();
        
        await supabase.from('activity_log').insert({
            user_id: user?.id,
            action,
            entity_type: entityType,
            entity_id: entityId,
            metadata,
            created_at: new Date().toISOString()
        });
    },

    /**
     * Log auth event
     * @param {string} eventType 
     * @param {string} userId 
     */
    async logAuthEvent(eventType, userId) {
        await supabase.from('auth_audit_log').insert({
            user_id: userId,
            event_type: eventType,
            ip_address: null, // Would need server-side to capture
            user_agent: navigator.userAgent,
            metadata: {
                timestamp: new Date().toISOString()
            }
        });
    },

    /**
     * Get activity log
     * @param {Object} filters 
     * @returns {Promise<{data, error}>}
     */
    async getActivityLog(filters = {}) {
        let query = supabase
            .from('activity_log')
            .select(`
                *,
                user:users(full_name, email)
            `)
            .order('created_at', { ascending: false })
            .limit(filters.limit || 50);

        if (filters.entityType) {
            query = query.eq('entity_type', filters.entityType);
        }
        if (filters.entityId) {
            query = query.eq('entity_id', filters.entityId);
        }

        const { data, error } = await query;
        return { data, error };
    },

    // ========================================
    // REAL-TIME SUBSCRIPTIONS
    // ========================================

    /**
     * Subscribe to opportunity changes
     * @param {Function} callback 
     * @returns {Object} subscription
     */
    subscribeToOpportunities(callback) {
        return supabase
            .channel('opportunities-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'opportunities' },
                callback
            )
            .subscribe();
    },

    /**
     * Subscribe to notifications
     * @param {Function} callback 
     * @returns {Object} subscription
     */
    subscribeToNotifications(callback) {
        return supabase
            .channel('notifications-changes')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'notifications' },
                callback
            )
            .subscribe();
    },

    /**
     * Unsubscribe from channel
     * @param {Object} subscription 
     */
    unsubscribe(subscription) {
        if (subscription) {
            supabase.removeChannel(subscription);
        }
    }
};

// Make MissionPulse globally available
window.MissionPulse = MissionPulse;

// ============================================
// AUTO-INITIALIZE ON LOAD
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    // Set up auth state listener
    MissionPulse.onAuthStateChange((event, session) => {
        console.log('Auth state changed:', event);
        
        if (event === 'SIGNED_OUT') {
            // Clear any cached data
            sessionStorage.clear();
        }
    });
});
