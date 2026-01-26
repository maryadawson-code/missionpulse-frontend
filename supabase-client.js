/**
 * MissionPulse Supabase Client
 * Handles all database and authentication operations
 * Version: 1.0.1 - Fixed CDN initialization
 */

// Supabase Configuration
const SUPABASE_URL = 'https://djuviwarqdvlbgcfuupa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqdXZpd2FycWR2bGJnY2Z1dXBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NDQ0NjUsImV4cCI6MjA4NTAyMDQ2NX0.3s8ufDDN2aWfkW0RBsAyJyacb2tjB7M550WSFIohHcA';

// Initialize Supabase Client - Handle both CDN and module imports
let supabaseClient = null;

try {
    // CDN version exports to window.supabase or just supabase
    if (typeof supabase !== 'undefined' && supabase.createClient) {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('✅ Supabase client initialized (global)');
    } else if (typeof window !== 'undefined' && window.supabase && window.supabase.createClient) {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('✅ Supabase client initialized (window)');
    } else {
        console.error('❌ Supabase library not found! Make sure the CDN script is loaded first.');
    }
} catch (error) {
    console.error('❌ Failed to initialize Supabase:', error);
}

// =============================================================================
// AUTH HELPER FUNCTIONS
// =============================================================================

/**
 * Sign up a new user with email and password
 */
async function signUpUser(email, password, metadata = {}) {
    if (!supabaseClient) {
        console.error('❌ Supabase client not initialized');
        return { success: false, error: 'Supabase client not initialized' };
    }
    
    try {
        console.log('📝 Attempting signup for:', email);
        const { data, error } = await supabaseClient.auth.signUp({
            email: email,
            password: password,
            options: {
                data: metadata,
                emailRedirectTo: `${window.location.origin}/login.html`
            }
        });
        
        if (error) {
            console.error('❌ Signup error:', error.message);
            throw error;
        }
        
        console.log('✅ Sign up successful:', data.user?.email);
        return { success: true, user: data.user, session: data.session };
    } catch (error) {
        console.error('❌ Sign up error:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Sign in existing user with email and password
 */
async function signInUser(email, password) {
    if (!supabaseClient) {
        console.error('❌ Supabase client not initialized');
        return { success: false, error: 'Supabase client not initialized' };
    }
    
    try {
        console.log('🔐 Attempting signin for:', email);
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) {
            console.error('❌ Signin error:', error.message);
            throw error;
        }
        
        console.log('✅ Sign in successful:', data.user?.email);
        return { success: true, user: data.user, session: data.session };
    } catch (error) {
        console.error('❌ Sign in error:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Sign out current user
 */
async function signOutUser() {
    if (!supabaseClient) {
        return { success: false, error: 'Supabase client not initialized' };
    }
    
    try {
        const { error } = await supabaseClient.auth.signOut();
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
 */
async function getCurrentSession() {
    if (!supabaseClient) return null;
    
    try {
        const { data: { session }, error } = await supabaseClient.auth.getSession();
        return session;
    } catch (error) {
        console.error('❌ Get session error:', error);
        return null;
    }
}

/**
 * Get current user
 */
async function getCurrentUser() {
    if (!supabaseClient) return null;
    
    try {
        const { data: { user }, error } = await supabaseClient.auth.getUser();
        return user;
    } catch (error) {
        console.error('❌ Get user error:', error);
        return null;
    }
}

/**
 * Send password reset email
 */
async function resetPassword(email) {
    if (!supabaseClient) {
        return { success: false, error: 'Supabase client not initialized' };
    }
    
    try {
        const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
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
 */
async function getUserProfile(userId) {
    if (!supabaseClient) return null;
    
    try {
        const { data, error } = await supabaseClient
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
 * Fetch all opportunities for a company
 */
async function getOpportunities(companyId = null) {
    if (!supabaseClient) return [];
    
    try {
        let query = supabaseClient
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
 */
async function getOpportunityById(opportunityId) {
    if (!supabaseClient) return null;
    
    try {
        const { data, error } = await supabaseClient
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
 */
async function getComplianceRequirements(opportunityId = null) {
    if (!supabaseClient) return [];
    
    try {
        let query = supabaseClient
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
 */
async function getLessonsLearned(companyId = null) {
    if (!supabaseClient) return [];
    
    try {
        let query = supabaseClient
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
 * Get company details
 */
async function getCompany(companyId) {
    if (!supabaseClient) return null;
    
    try {
        const { data, error } = await supabaseClient
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
 */
async function getAllCompanies() {
    if (!supabaseClient) return [];
    
    try {
        const { data, error } = await supabaseClient
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

// =============================================================================
// AUTH STATE LISTENER
// =============================================================================

/**
 * Listen for auth state changes
 */
function onAuthStateChange(callback) {
    if (!supabaseClient) {
        console.error('❌ Cannot listen for auth changes - client not initialized');
        return;
    }
    
    supabaseClient.auth.onAuthStateChange((event, session) => {
        console.log('🔐 Auth state changed:', event);
        callback(event, session);
    });
}

// =============================================================================
// RBAC HELPER FUNCTIONS
// =============================================================================

/**
 * Check if user has specific permission
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

// Export for global access
window.mpSupabase = {
    client: supabaseClient,
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
        getOpportunities,
        getOpportunityById,
        getComplianceRequirements,
        getLessonsLearned,
        getCompany,
        getAllCompanies
    },
    rbac: {
        hasPermission,
        getVisibleMenuItems
    }
};

console.log('✅ MissionPulse Supabase Client v1.0.1 loaded');
console.log('🔗 Supabase URL:', SUPABASE_URL);
console.log('🔑 Client initialized:', supabaseClient ? 'YES' : 'NO');
