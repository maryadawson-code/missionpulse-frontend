// FILE: supabase-client.js
// ROLE: System
// SECURITY: env vars verified - qdrtpnpnhkxvfmvfziop.supabase.co
// LAST UPDATED: 2025-01-28

/**
 * MissionPulse Supabase Client
 * Handles authentication, database operations, and session management
 * © 2025 Mission Meets Tech
 */

// =============================================================================
// SUPABASE CONFIGURATION - VERIFIED CORRECT CREDENTIALS
// =============================================================================
const SUPABASE_URL = 'https://qdrtpnpnhkxvfmvfziop.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkcnRwbnBuaGt4dmZtdmZ6aW9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc4MzI3NjQsImV4cCI6MjA1MzQwODc2NH0.rFKJKvOHOvtwz9HY5cCgnD2sO4N4z2lgXvvzaYGAsoc';

// Initialize Supabase client
let supabase = null;

function initSupabase() {
    if (typeof window !== 'undefined' && window.supabase) {
        return window.supabase;
    }
    
    if (supabase) {
        return supabase;
    }
    
    if (typeof supabaseJs !== 'undefined' && supabaseJs.createClient) {
        supabase = supabaseJs.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } else if (typeof window !== 'undefined' && window.supabase && window.supabase.createClient) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } else {
        console.error('Supabase library not loaded');
        return null;
    }
    
    if (typeof window !== 'undefined') {
        window.supabase = supabase;
    }
    
    return supabase;
}

// =============================================================================
// AUTHENTICATION FUNCTIONS
// =============================================================================

/**
 * Sign in with email and password
 */
async function signIn(email, password) {
    const client = initSupabase();
    if (!client) {
        return { error: { message: 'Supabase client not initialized' } };
    }
    
    try {
        const { data, error } = await client.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) {
            console.error('Sign in error:', error);
            return { error };
        }
        
        // Store session
        if (data.session) {
            localStorage.setItem('missionpulse_session', JSON.stringify(data.session));
            localStorage.setItem('missionpulse_user', JSON.stringify(data.user));
        }
        
        return { data };
    } catch (err) {
        console.error('Sign in exception:', err);
        return { error: { message: err.message } };
    }
}

/**
 * Sign up with email and password
 */
async function signUp(email, password, metadata = {}) {
    const client = initSupabase();
    if (!client) {
        return { error: { message: 'Supabase client not initialized' } };
    }
    
    try {
        const { data, error } = await client.auth.signUp({
            email: email,
            password: password,
            options: {
                data: metadata
            }
        });
        
        if (error) {
            console.error('Sign up error:', error);
            return { error };
        }
        
        return { data };
    } catch (err) {
        console.error('Sign up exception:', err);
        return { error: { message: err.message } };
    }
}

/**
 * Sign out current user
 */
async function signOut() {
    const client = initSupabase();
    if (!client) {
        return { error: { message: 'Supabase client not initialized' } };
    }
    
    try {
        const { error } = await client.auth.signOut();
        
        // Clear local storage
        localStorage.removeItem('missionpulse_session');
        localStorage.removeItem('missionpulse_user');
        localStorage.removeItem('missionpulse_profile');
        
        if (error) {
            console.error('Sign out error:', error);
            return { error };
        }
        
        return { success: true };
    } catch (err) {
        console.error('Sign out exception:', err);
        return { error: { message: err.message } };
    }
}

/**
 * Get current session
 */
async function getSession() {
    const client = initSupabase();
    if (!client) {
        return { error: { message: 'Supabase client not initialized' } };
    }
    
    try {
        const { data, error } = await client.auth.getSession();
        
        if (error) {
            console.error('Get session error:', error);
            return { error };
        }
        
        return { data };
    } catch (err) {
        console.error('Get session exception:', err);
        return { error: { message: err.message } };
    }
}

/**
 * Get current user
 */
async function getUser() {
    const client = initSupabase();
    if (!client) {
        return { error: { message: 'Supabase client not initialized' } };
    }
    
    try {
        const { data: { user }, error } = await client.auth.getUser();
        
        if (error) {
            console.error('Get user error:', error);
            return { error };
        }
        
        return { user };
    } catch (err) {
        console.error('Get user exception:', err);
        return { error: { message: err.message } };
    }
}

// =============================================================================
// PROFILE FUNCTIONS
// =============================================================================

/**
 * Get user profile from profiles table
 */
async function getProfile(userId) {
    const client = initSupabase();
    if (!client) {
        return { error: { message: 'Supabase client not initialized' } };
    }
    
    try {
        const { data, error } = await client
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
        
        if (error) {
            console.error('Get profile error:', error);
            return { error };
        }
        
        // Cache profile
        if (data) {
            localStorage.setItem('missionpulse_profile', JSON.stringify(data));
        }
        
        return { data };
    } catch (err) {
        console.error('Get profile exception:', err);
        return { error: { message: err.message } };
    }
}

/**
 * Get profile by email
 */
async function getProfileByEmail(email) {
    const client = initSupabase();
    if (!client) {
        return { error: { message: 'Supabase client not initialized' } };
    }
    
    try {
        const { data, error } = await client
            .from('profiles')
            .select('*')
            .eq('email', email)
            .single();
        
        if (error && error.code !== 'PGRST116') {
            console.error('Get profile by email error:', error);
            return { error };
        }
        
        return { data };
    } catch (err) {
        console.error('Get profile by email exception:', err);
        return { error: { message: err.message } };
    }
}

/**
 * Update user profile
 */
async function updateProfile(userId, updates) {
    const client = initSupabase();
    if (!client) {
        return { error: { message: 'Supabase client not initialized' } };
    }
    
    try {
        const { data, error } = await client
            .from('profiles')
            .update(updates)
            .eq('id', userId)
            .select()
            .single();
        
        if (error) {
            console.error('Update profile error:', error);
            return { error };
        }
        
        // Update cache
        if (data) {
            localStorage.setItem('missionpulse_profile', JSON.stringify(data));
        }
        
        return { data };
    } catch (err) {
        console.error('Update profile exception:', err);
        return { error: { message: err.message } };
    }
}

// =============================================================================
// OPPORTUNITIES FUNCTIONS
// =============================================================================

/**
 * Get all opportunities
 */
async function getOpportunities() {
    const client = initSupabase();
    if (!client) {
        return { error: { message: 'Supabase client not initialized' } };
    }
    
    try {
        const { data, error } = await client
            .from('opportunities')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('Get opportunities error:', error);
            return { error };
        }
        
        return { data };
    } catch (err) {
        console.error('Get opportunities exception:', err);
        return { error: { message: err.message } };
    }
}

/**
 * Get single opportunity by ID
 */
async function getOpportunity(id) {
    const client = initSupabase();
    if (!client) {
        return { error: { message: 'Supabase client not initialized' } };
    }
    
    try {
        const { data, error } = await client
            .from('opportunities')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) {
            console.error('Get opportunity error:', error);
            return { error };
        }
        
        return { data };
    } catch (err) {
        console.error('Get opportunity exception:', err);
        return { error: { message: err.message } };
    }
}

/**
 * Create new opportunity
 */
async function createOpportunity(opportunity) {
    const client = initSupabase();
    if (!client) {
        return { error: { message: 'Supabase client not initialized' } };
    }
    
    try {
        const { data, error } = await client
            .from('opportunities')
            .insert([opportunity])
            .select()
            .single();
        
        if (error) {
            console.error('Create opportunity error:', error);
            return { error };
        }
        
        return { data };
    } catch (err) {
        console.error('Create opportunity exception:', err);
        return { error: { message: err.message } };
    }
}

/**
 * Update opportunity
 */
async function updateOpportunity(id, updates) {
    const client = initSupabase();
    if (!client) {
        return { error: { message: 'Supabase client not initialized' } };
    }
    
    try {
        const { data, error } = await client
            .from('opportunities')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        
        if (error) {
            console.error('Update opportunity error:', error);
            return { error };
        }
        
        return { data };
    } catch (err) {
        console.error('Update opportunity exception:', err);
        return { error: { message: err.message } };
    }
}

/**
 * Delete opportunity
 */
async function deleteOpportunity(id) {
    const client = initSupabase();
    if (!client) {
        return { error: { message: 'Supabase client not initialized' } };
    }
    
    try {
        const { error } = await client
            .from('opportunities')
            .delete()
            .eq('id', id);
        
        if (error) {
            console.error('Delete opportunity error:', error);
            return { error };
        }
        
        return { success: true };
    } catch (err) {
        console.error('Delete opportunity exception:', err);
        return { error: { message: err.message } };
    }
}

// =============================================================================
// GENERIC DATABASE FUNCTIONS
// =============================================================================

/**
 * Generic select function
 */
async function dbSelect(table, columns = '*', filters = {}, options = {}) {
    const client = initSupabase();
    if (!client) {
        return { error: { message: 'Supabase client not initialized' } };
    }
    
    try {
        let query = client.from(table).select(columns);
        
        // Apply filters
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                query = query.eq(key, value);
            }
        });
        
        // Apply ordering
        if (options.orderBy) {
            query = query.order(options.orderBy, { ascending: options.ascending ?? false });
        }
        
        // Apply limit
        if (options.limit) {
            query = query.limit(options.limit);
        }
        
        // Single row
        if (options.single) {
            query = query.single();
        }
        
        const { data, error } = await query;
        
        if (error) {
            console.error(`Select from ${table} error:`, error);
            return { error };
        }
        
        return { data };
    } catch (err) {
        console.error(`Select from ${table} exception:`, err);
        return { error: { message: err.message } };
    }
}

/**
 * Generic insert function
 */
async function dbInsert(table, records, returnData = true) {
    const client = initSupabase();
    if (!client) {
        return { error: { message: 'Supabase client not initialized' } };
    }
    
    try {
        const recordsArray = Array.isArray(records) ? records : [records];
        let query = client.from(table).insert(recordsArray);
        
        if (returnData) {
            query = query.select();
        }
        
        const { data, error } = await query;
        
        if (error) {
            console.error(`Insert into ${table} error:`, error);
            return { error };
        }
        
        return { data };
    } catch (err) {
        console.error(`Insert into ${table} exception:`, err);
        return { error: { message: err.message } };
    }
}

/**
 * Generic update function
 */
async function dbUpdate(table, filters, updates, returnData = true) {
    const client = initSupabase();
    if (!client) {
        return { error: { message: 'Supabase client not initialized' } };
    }
    
    try {
        let query = client.from(table).update(updates);
        
        // Apply filters
        Object.entries(filters).forEach(([key, value]) => {
            query = query.eq(key, value);
        });
        
        if (returnData) {
            query = query.select();
        }
        
        const { data, error } = await query;
        
        if (error) {
            console.error(`Update ${table} error:`, error);
            return { error };
        }
        
        return { data };
    } catch (err) {
        console.error(`Update ${table} exception:`, err);
        return { error: { message: err.message } };
    }
}

/**
 * Generic delete function
 */
async function dbDelete(table, filters) {
    const client = initSupabase();
    if (!client) {
        return { error: { message: 'Supabase client not initialized' } };
    }
    
    try {
        let query = client.from(table).delete();
        
        // Apply filters
        Object.entries(filters).forEach(([key, value]) => {
            query = query.eq(key, value);
        });
        
        const { error } = await query;
        
        if (error) {
            console.error(`Delete from ${table} error:`, error);
            return { error };
        }
        
        return { success: true };
    } catch (err) {
        console.error(`Delete from ${table} exception:`, err);
        return { error: { message: err.message } };
    }
}

// =============================================================================
// ACCESS REQUEST FUNCTIONS
// =============================================================================

/**
 * Submit access request
 */
async function submitAccessRequest(requestData) {
    const client = initSupabase();
    if (!client) {
        return { error: { message: 'Supabase client not initialized' } };
    }
    
    try {
        const { data, error } = await client
            .from('access_requests')
            .insert([{
                full_name: requestData.fullName,
                email: requestData.email,
                company_name: requestData.companyName,
                job_title: requestData.jobTitle,
                message: requestData.message || null,
                status: 'pending',
                created_at: new Date().toISOString()
            }])
            .select()
            .single();
        
        if (error) {
            console.error('Submit access request error:', error);
            return { error };
        }
        
        return { data };
    } catch (err) {
        console.error('Submit access request exception:', err);
        return { error: { message: err.message } };
    }
}

/**
 * Get pending access requests (admin only)
 */
async function getAccessRequests(status = null) {
    const client = initSupabase();
    if (!client) {
        return { error: { message: 'Supabase client not initialized' } };
    }
    
    try {
        let query = client
            .from('access_requests')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (status) {
            query = query.eq('status', status);
        }
        
        const { data, error } = await query;
        
        if (error) {
            console.error('Get access requests error:', error);
            return { error };
        }
        
        return { data };
    } catch (err) {
        console.error('Get access requests exception:', err);
        return { error: { message: err.message } };
    }
}

// =============================================================================
// USER INVITATION FUNCTIONS
// =============================================================================

/**
 * Get user invitations
 */
async function getInvitations(status = null) {
    const client = initSupabase();
    if (!client) {
        return { error: { message: 'Supabase client not initialized' } };
    }
    
    try {
        let query = client
            .from('user_invitations')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (status) {
            query = query.eq('status', status);
        }
        
        const { data, error } = await query;
        
        if (error) {
            console.error('Get invitations error:', error);
            return { error };
        }
        
        return { data };
    } catch (err) {
        console.error('Get invitations exception:', err);
        return { error: { message: err.message } };
    }
}

/**
 * Create user invitation
 */
async function createInvitation(inviteData) {
    const client = initSupabase();
    if (!client) {
        return { error: { message: 'Supabase client not initialized' } };
    }
    
    try {
        const { data, error } = await client
            .from('user_invitations')
            .insert([{
                full_name: inviteData.fullName,
                email: inviteData.email,
                role: inviteData.role || 'User',
                status: 'pending',
                created_at: new Date().toISOString()
            }])
            .select()
            .single();
        
        if (error) {
            console.error('Create invitation error:', error);
            return { error };
        }
        
        return { data };
    } catch (err) {
        console.error('Create invitation exception:', err);
        return { error: { message: err.message } };
    }
}

// =============================================================================
// AUDIT LOG FUNCTIONS
// =============================================================================

/**
 * Log audit event
 */
async function logAuditEvent(action, details = {}) {
    const client = initSupabase();
    if (!client) {
        return { error: { message: 'Supabase client not initialized' } };
    }
    
    try {
        // Get current user
        const { data: { user } } = await client.auth.getUser();
        
        const { error } = await client
            .from('audit_log')
            .insert([{
                user_id: user?.id || null,
                user_email: user?.email || 'anonymous',
                action: action,
                details: details,
                created_at: new Date().toISOString()
            }]);
        
        if (error) {
            console.error('Log audit event error:', error);
            return { error };
        }
        
        return { success: true };
    } catch (err) {
        console.error('Log audit event exception:', err);
        return { error: { message: err.message } };
    }
}

// =============================================================================
// ROLE-BASED ACCESS CONTROL
// =============================================================================

const ROLES = {
    CEO: { level: 100, name: 'CEO' },
    COO: { level: 90, name: 'COO' },
    Admin: { level: 80, name: 'Admin' },
    CAP: { level: 70, name: 'Capture Manager' },
    PM: { level: 60, name: 'Project Manager' },
    SA: { level: 50, name: 'Solution Architect' },
    FIN: { level: 50, name: 'Finance' },
    CON: { level: 50, name: 'Contracts' },
    DEL: { level: 50, name: 'Delivery' },
    QA: { level: 40, name: 'Quality Assurance' },
    Partner: { level: 30, name: 'Partner' },
    User: { level: 10, name: 'User' }
};

/**
 * Check if user has required role
 */
function hasRole(userRole, requiredRole) {
    const userLevel = ROLES[userRole]?.level || 0;
    const requiredLevel = ROLES[requiredRole]?.level || 0;
    return userLevel >= requiredLevel;
}

/**
 * Check if user can access feature
 */
function canAccess(userRole, feature) {
    const featureRoles = {
        'admin-users': ['CEO', 'COO', 'Admin'],
        'black-hat': ['CEO', 'COO', 'Admin', 'CAP', 'SA'],
        'pricing': ['CEO', 'COO', 'Admin', 'CAP', 'FIN'],
        'contracts': ['CEO', 'COO', 'Admin', 'CON'],
        'hitl-queue': ['CEO', 'COO', 'Admin', 'CAP', 'PM', 'SA'],
        'executive-dashboard': ['CEO', 'COO', 'Admin']
    };
    
    const allowedRoles = featureRoles[feature];
    if (!allowedRoles) return true; // No restrictions
    
    return allowedRoles.includes(userRole);
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get cached profile
 */
function getCachedProfile() {
    try {
        const cached = localStorage.getItem('missionpulse_profile');
        return cached ? JSON.parse(cached) : null;
    } catch {
        return null;
    }
}

/**
 * Clear all cached data
 */
function clearCache() {
    localStorage.removeItem('missionpulse_session');
    localStorage.removeItem('missionpulse_user');
    localStorage.removeItem('missionpulse_profile');
}

/**
 * Check connection status
 */
async function checkConnection() {
    const client = initSupabase();
    if (!client) {
        return { connected: false, error: 'Client not initialized' };
    }
    
    try {
        const { data, error } = await client
            .from('opportunities')
            .select('id')
            .limit(1);
        
        if (error) {
            return { connected: false, error: error.message };
        }
        
        return { connected: true };
    } catch (err) {
        return { connected: false, error: err.message };
    }
}

// =============================================================================
// EXPORTS
// =============================================================================

// Make functions available globally
if (typeof window !== 'undefined') {
    window.MissionPulseDB = {
        // Config
        SUPABASE_URL,
        SUPABASE_ANON_KEY,
        
        // Init
        initSupabase,
        
        // Auth
        signIn,
        signUp,
        signOut,
        getSession,
        getUser,
        
        // Profile
        getProfile,
        getProfileByEmail,
        updateProfile,
        getCachedProfile,
        
        // Opportunities
        getOpportunities,
        getOpportunity,
        createOpportunity,
        updateOpportunity,
        deleteOpportunity,
        
        // Generic DB
        dbSelect,
        dbInsert,
        dbUpdate,
        dbDelete,
        
        // Access Requests
        submitAccessRequest,
        getAccessRequests,
        
        // Invitations
        getInvitations,
        createInvitation,
        
        // Audit
        logAuditEvent,
        
        // RBAC
        ROLES,
        hasRole,
        canAccess,
        
        // Utility
        clearCache,
        checkConnection
    };
    
    // Also expose initSupabase globally for backward compatibility
    window.initSupabase = initSupabase;
}

// Auto-initialize on load
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        initSupabase();
        console.log('MissionPulse DB initialized - Connected to:', SUPABASE_URL);
    });
}

// AI GENERATED CONTENT - REQUIRES HUMAN REVIEW
