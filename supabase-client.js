/**
 * MissionPulse Supabase Client
 * Handles all database and authentication operations
 * Version: 1.0.0
 */

// Supabase Configuration
const SUPABASE_URL = 'https://djuviwarqdvlbgcfuupa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqdXZpd2FycWR2bGJnY2Z1dXBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NDQ0NjUsImV4cCI6MjA4NTAyMDQ2NX0.3s8ufDDN2aWfkW0RBsAyJyacb2tjB7M550WSFIohHcA';

// Initialize Supabase Client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// =============================================================================
// AUTH HELPER FUNCTIONS
// =============================================================================

/**
 * Sign up a new user with email and password
 * @param {string} email - User's email address
 * @param {string} password - User's password (min 6 characters)
 * @param {object} metadata - Additional user metadata (name, role, etc.)
 * @returns {Promise<object>} - User object or error
 */
async function signUpUser(email, password, metadata = {}) {
    try {
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: metadata,
                emailRedirectTo: `${window.location.origin}/login.html`
            }
        });
        
        if (error) throw error;
        
        console.log('✅ Sign up successful:', data.user?.email);
        return { success: true, user: data.user, session: data.session };
    } catch (error) {
        console.error('❌ Sign up error:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Sign in existing user with email and password
 * @param {string} email - User's email address
 * @param {string} password - User's password
 * @returns {Promise<object>} - Session object or error
 */
async function signInUser(email, password) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) throw error;
        
        console.log('✅ Sign in successful:', data.user?.email);
        return { success: true, user: data.user, session: data.session };
    } catch (error) {
        console.error('❌ Sign in error:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Sign out current user
 * @returns {Promise<object>} - Success status
 */
async function signOutUser() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        
        console.log('✅ Sign out successful');
        window.location.href = '/login.html';
        return { success: true };
    } catch (error) {
        console.error('❌ Sign out error:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Get current session
 * @returns {Promise<object|null>} - Current session or null
 */
async function getCurrentSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    return session;
}

/**
 * Get current user
 * @returns {Promise<object|null>} - Current user or null
 */
async function getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    return user;
}

/**
 * Send password reset email
 * @param {string} email - User's email address
 * @returns {Promise<object>} - Success status
 */
async function resetPassword(email) {
    try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password.html`
        });
        
        if (error) throw error;
        
        console.log('✅ Password reset email sent');
        return { success: true };
    } catch (error) {
        console.error('❌ Password reset error:', error.message);
        return { success: false, error: error.message };
    }
}

// =============================================================================
// DATABASE HELPER FUNCTIONS
// =============================================================================

/**
 * Fetch user profile from database
 * @param {string} userId - User's UUID
 * @returns {Promise<object|null>} - User profile or null
 */
async function getUserProfile(userId) {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*, companies(name, logo_url)')
            .eq('id', userId)
            .single();
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('❌ Get user profile error:', error.message);
        return null;
    }
}

/**
 * Create or update user profile after signup
 * @param {string} userId - User's UUID from auth
 * @param {object} profileData - Profile information
 * @returns {Promise<object>} - Success status
 */
async function upsertUserProfile(userId, profileData) {
    try {
        const { data, error } = await supabase
            .from('users')
            .upsert({
                id: userId,
                ...profileData,
                updated_at: new Date().toISOString()
            }, { onConflict: 'id' });
        
        if (error) throw error;
        
        console.log('✅ User profile updated');
        return { success: true, data };
    } catch (error) {
        console.error('❌ Upsert profile error:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Fetch all opportunities for a company
 * @param {string} companyId - Company UUID
 * @returns {Promise<array>} - Array of opportunities
 */
async function getOpportunities(companyId = null) {
    try {
        let query = supabase
            .from('opportunities')
            .select('*')
            .order('due_date', { ascending: true });
        
        if (companyId) {
            query = query.eq('company_id', companyId);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('❌ Get opportunities error:', error.message);
        return [];
    }
}

/**
 * Fetch single opportunity with details
 * @param {string} opportunityId - Opportunity UUID
 * @returns {Promise<object|null>} - Opportunity object or null
 */
async function getOpportunityById(opportunityId) {
    try {
        const { data, error } = await supabase
            .from('opportunities')
            .select('*')
            .eq('id', opportunityId)
            .single();
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('❌ Get opportunity error:', error.message);
        return null;
    }
}

/**
 * Fetch compliance requirements for an opportunity
 * @param {string} opportunityId - Opportunity UUID
 * @returns {Promise<array>} - Array of compliance requirements
 */
async function getComplianceRequirements(opportunityId = null) {
    try {
        let query = supabase
            .from('compliance_requirements')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (opportunityId) {
            query = query.eq('opportunity_id', opportunityId);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('❌ Get compliance requirements error:', error.message);
        return [];
    }
}

/**
 * Fetch lessons learned
 * @param {string} companyId - Company UUID (optional)
 * @returns {Promise<array>} - Array of lessons
 */
async function getLessonsLearned(companyId = null) {
    try {
        let query = supabase
            .from('lessons_learned')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (companyId) {
            query = query.eq('company_id', companyId);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('❌ Get lessons learned error:', error.message);
        return [];
    }
}

/**
 * Fetch team assignments for an opportunity
 * @param {string} opportunityId - Opportunity UUID
 * @returns {Promise<array>} - Array of team assignments with user details
 */
async function getTeamAssignments(opportunityId) {
    try {
        const { data, error } = await supabase
            .from('team_assignments')
            .select('*, users(id, full_name, email, role, avatar_url)')
            .eq('opportunity_id', opportunityId);
        
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('❌ Get team assignments error:', error.message);
        return [];
    }
}

/**
 * Fetch chat history for an opportunity
 * @param {string} opportunityId - Opportunity UUID
 * @param {number} limit - Number of messages to fetch
 * @returns {Promise<array>} - Array of chat messages
 */
async function getChatHistory(opportunityId, limit = 50) {
    try {
        const { data, error } = await supabase
            .from('chat_history')
            .select('*, users(full_name, avatar_url)')
            .eq('opportunity_id', opportunityId)
            .order('created_at', { ascending: false })
            .limit(limit);
        
        if (error) throw error;
        return (data || []).reverse();
    } catch (error) {
        console.error('❌ Get chat history error:', error.message);
        return [];
    }
}

/**
 * Save chat message
 * @param {object} message - Message object
 * @returns {Promise<object>} - Saved message or error
 */
async function saveChatMessage(message) {
    try {
        const { data, error } = await supabase
            .from('chat_history')
            .insert(message)
            .select()
            .single();
        
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('❌ Save chat message error:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Log audit event
 * @param {object} event - Audit event details
 * @returns {Promise<object>} - Success status
 */
async function logAuditEvent(event) {
    try {
        const { error } = await supabase
            .from('audit_log')
            .insert({
                ...event,
                created_at: new Date().toISOString()
            });
        
        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('❌ Log audit event error:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Get company details
 * @param {string} companyId - Company UUID
 * @returns {Promise<object|null>} - Company object or null
 */
async function getCompany(companyId) {
    try {
        const { data, error } = await supabase
            .from('companies')
            .select('*')
            .eq('id', companyId)
            .single();
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('❌ Get company error:', error.message);
        return null;
    }
}

/**
 * Get all companies (for admin)
 * @returns {Promise<array>} - Array of companies
 */
async function getAllCompanies() {
    try {
        const { data, error } = await supabase
            .from('companies')
            .select('*')
            .order('name', { ascending: true });
        
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('❌ Get all companies error:', error.message);
        return [];
    }
}

/**
 * Fetch notifications for user
 * @param {string} userId - User UUID
 * @returns {Promise<array>} - Array of notifications
 */
async function getNotifications(userId) {
    try {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(20);
        
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('❌ Get notifications error:', error.message);
        return [];
    }
}

/**
 * Mark notification as read
 * @param {string} notificationId - Notification UUID
 * @returns {Promise<object>} - Success status
 */
async function markNotificationRead(notificationId) {
    try {
        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('id', notificationId);
        
        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('❌ Mark notification read error:', error.message);
        return { success: false, error: error.message };
    }
}

// =============================================================================
// RBAC HELPER FUNCTIONS
// =============================================================================

/**
 * Check if user has specific permission
 * @param {string} role - User's role
 * @param {string} permission - Permission to check
 * @returns {boolean} - Whether user has permission
 */
function hasPermission(role, permission) {
    const permissions = {
        'admin': ['all'],
        'ceo': ['view_all', 'go_nogo', 'approve_pricing', 'view_financials', 'manage_partners'],
        'coo': ['view_all', 'manage_captures', 'assign_resources', 'view_financials'],
        'capture_manager': ['view_captures', 'manage_proposals', 'assign_team', 'black_hat'],
        'proposal_manager': ['view_proposals', 'edit_sections', 'compliance', 'schedule'],
        'solution_architect': ['edit_technical', 'edit_management', 'pricing_support'],
        'finance': ['view_financials', 'pricing', 'boe'],
        'contracts': ['compliance', 'far_dfars', 'terms'],
        'delivery': ['staffing', 'resumes', 'past_performance'],
        'qa': ['review_all', 'compliance_check', 'quality_gate'],
        'partner': ['view_assigned', 'edit_assigned'],
        'viewer': ['view_only']
    };
    
    const userPerms = permissions[role] || ['view_only'];
    return userPerms.includes('all') || userPerms.includes(permission);
}

/**
 * Get visible menu items based on role
 * @param {string} role - User's role
 * @returns {array} - Array of visible menu items
 */
function getVisibleMenuItems(role) {
    const allItems = [
        { id: 'dashboard', label: 'Dashboard', icon: 'home', roles: ['all'] },
        { id: 'opportunities', label: 'Opportunities', icon: 'target', roles: ['all'] },
        { id: 'proposals', label: 'Proposals', icon: 'document', roles: ['admin', 'ceo', 'coo', 'capture_manager', 'proposal_manager'] },
        { id: 'pricing', label: 'Pricing', icon: 'calculator', roles: ['admin', 'ceo', 'coo', 'finance'] },
        { id: 'compliance', label: 'Compliance', icon: 'shield', roles: ['admin', 'ceo', 'coo', 'contracts', 'qa'] },
        { id: 'team', label: 'Team', icon: 'users', roles: ['admin', 'ceo', 'coo', 'capture_manager'] },
        { id: 'partners', label: 'Partners', icon: 'handshake', roles: ['admin', 'ceo', 'coo'] },
        { id: 'analytics', label: 'Analytics', icon: 'chart', roles: ['admin', 'ceo', 'coo'] },
        { id: 'settings', label: 'Settings', icon: 'settings', roles: ['admin'] }
    ];
    
    return allItems.filter(item => 
        item.roles.includes('all') || item.roles.includes(role)
    );
}

// =============================================================================
// AUTH STATE LISTENER
// =============================================================================

/**
 * Listen for auth state changes
 * @param {function} callback - Callback function to handle state changes
 */
function onAuthStateChange(callback) {
    supabase.auth.onAuthStateChange((event, session) => {
        console.log('🔐 Auth state changed:', event);
        callback(event, session);
    });
}

// =============================================================================
// REALTIME SUBSCRIPTIONS
// =============================================================================

/**
 * Subscribe to opportunity updates
 * @param {string} opportunityId - Opportunity UUID
 * @param {function} callback - Callback for updates
 * @returns {object} - Subscription object
 */
function subscribeToOpportunity(opportunityId, callback) {
    return supabase
        .channel(`opportunity:${opportunityId}`)
        .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'opportunities', filter: `id=eq.${opportunityId}` },
            callback
        )
        .subscribe();
}

/**
 * Subscribe to chat messages
 * @param {string} opportunityId - Opportunity UUID
 * @param {function} callback - Callback for new messages
 * @returns {object} - Subscription object
 */
function subscribeToChatMessages(opportunityId, callback) {
    return supabase
        .channel(`chat:${opportunityId}`)
        .on('postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'chat_history', filter: `opportunity_id=eq.${opportunityId}` },
            callback
        )
        .subscribe();
}

/**
 * Unsubscribe from channel
 * @param {object} subscription - Subscription to remove
 */
function unsubscribe(subscription) {
    if (subscription) {
        supabase.removeChannel(subscription);
    }
}

// Export for global access
window.mpSupabase = {
    client: supabase,
    auth: {
        signUp: signUpUser,
        signIn: signInUser,
        signOut: signOutUser,
        getSession: getCurrentSession,
        getUser: getCurrentUser,
        resetPassword: resetPassword,
        onStateChange: onAuthStateChange
    },
    db: {
        getUserProfile,
        upsertUserProfile,
        getOpportunities,
        getOpportunityById,
        getComplianceRequirements,
        getLessonsLearned,
        getTeamAssignments,
        getChatHistory,
        saveChatMessage,
        logAuditEvent,
        getCompany,
        getAllCompanies,
        getNotifications,
        markNotificationRead
    },
    rbac: {
        hasPermission,
        getVisibleMenuItems
    },
    realtime: {
        subscribeToOpportunity,
        subscribeToChatMessages,
        unsubscribe
    }
};

console.log('✅ MissionPulse Supabase Client initialized');
