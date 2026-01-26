/**
 * ================================================================================
 * MISSIONPULSE - TRAINING DATA API SERVICE
 * ================================================================================
 * Frontend JavaScript module for interacting with Training Data CRUD endpoints.
 * Replace mock data calls with this service.
 * 
 * Author: Mission Meets Tech
 * Version: 1.0.0
 * ================================================================================
 */

// Configuration
const API_BASE_URL = 'https://missionpulse-api.onrender.com';

/**
 * Training Data API Service
 * Provides CRUD operations for all 6 training data categories
 */
const TrainingDataAPI = {
    
    // =========================================================================
    // CONFIGURATION
    // =========================================================================
    
    /**
     * Get headers with user role for RBAC
     * @returns {Object} Headers object
     */
    getHeaders() {
        // Get current user role from localStorage or session
        const userRole = localStorage.getItem('userRole') || 'ceo';
        
        return {
            'Content-Type': 'application/json',
            'X-User-Role': userRole
        };
    },
    
    /**
     * Handle API response
     * @param {Response} response - Fetch response
     * @returns {Promise} Parsed JSON or error
     */
    async handleResponse(response) {
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || errorData.error || `HTTP ${response.status}`);
        }
        return response.json();
    },
    
    // =========================================================================
    // COMPANY PROFILE
    // =========================================================================
    
    /**
     * Get company profile
     * @returns {Promise<Object|null>} Company profile or null if not set
     */
    async getCompanyProfile() {
        const response = await fetch(`${API_BASE_URL}/api/training-data/company-profile`, {
            method: 'GET',
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    },
    
    /**
     * Create or update company profile
     * @param {Object} profileData - Company profile data
     * @returns {Promise<Object>} Saved company profile
     */
    async saveCompanyProfile(profileData) {
        const response = await fetch(`${API_BASE_URL}/api/training-data/company-profile`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(profileData)
        });
        return this.handleResponse(response);
    },
    
    // =========================================================================
    // WIN THEMES
    // =========================================================================
    
    /**
     * Get all win themes
     * @returns {Promise<Array>} List of win themes
     */
    async getWinThemes() {
        const response = await fetch(`${API_BASE_URL}/api/training-data/win-themes`, {
            method: 'GET',
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    },
    
    /**
     * Create a new win theme
     * @param {Object} themeData - Win theme data
     * @returns {Promise<Object>} Created win theme
     */
    async createWinTheme(themeData) {
        const response = await fetch(`${API_BASE_URL}/api/training-data/win-themes`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(themeData)
        });
        return this.handleResponse(response);
    },
    
    /**
     * Update a win theme
     * @param {number} id - Win theme ID
     * @param {Object} themeData - Updated data
     * @returns {Promise<Object>} Updated win theme
     */
    async updateWinTheme(id, themeData) {
        const response = await fetch(`${API_BASE_URL}/api/training-data/win-themes/${id}`, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify(themeData)
        });
        return this.handleResponse(response);
    },
    
    /**
     * Delete a win theme
     * @param {number} id - Win theme ID
     * @returns {Promise<Object>} Deletion confirmation
     */
    async deleteWinTheme(id) {
        const response = await fetch(`${API_BASE_URL}/api/training-data/win-themes/${id}`, {
            method: 'DELETE',
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    },
    
    // =========================================================================
    // COMPETITORS
    // =========================================================================
    
    /**
     * Get all competitors
     * @returns {Promise<Array>} List of competitors
     */
    async getCompetitors() {
        const response = await fetch(`${API_BASE_URL}/api/training-data/competitors`, {
            method: 'GET',
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    },
    
    /**
     * Create a new competitor
     * @param {Object} competitorData - Competitor data
     * @returns {Promise<Object>} Created competitor
     */
    async createCompetitor(competitorData) {
        const response = await fetch(`${API_BASE_URL}/api/training-data/competitors`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(competitorData)
        });
        return this.handleResponse(response);
    },
    
    /**
     * Update a competitor
     * @param {number} id - Competitor ID
     * @param {Object} competitorData - Updated data
     * @returns {Promise<Object>} Updated competitor
     */
    async updateCompetitor(id, competitorData) {
        const response = await fetch(`${API_BASE_URL}/api/training-data/competitors/${id}`, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify(competitorData)
        });
        return this.handleResponse(response);
    },
    
    /**
     * Delete a competitor
     * @param {number} id - Competitor ID
     * @returns {Promise<Object>} Deletion confirmation
     */
    async deleteCompetitor(id) {
        const response = await fetch(`${API_BASE_URL}/api/training-data/competitors/${id}`, {
            method: 'DELETE',
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    },
    
    // =========================================================================
    // LABOR CATEGORIES
    // =========================================================================
    
    /**
     * Get all labor categories
     * @returns {Promise<Array>} List of labor categories
     */
    async getLaborCategories() {
        const response = await fetch(`${API_BASE_URL}/api/training-data/labor-categories`, {
            method: 'GET',
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    },
    
    /**
     * Create a new labor category
     * @param {Object} lcatData - Labor category data
     * @returns {Promise<Object>} Created labor category
     */
    async createLaborCategory(lcatData) {
        const response = await fetch(`${API_BASE_URL}/api/training-data/labor-categories`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(lcatData)
        });
        return this.handleResponse(response);
    },
    
    /**
     * Update a labor category
     * @param {number} id - Labor category ID
     * @param {Object} lcatData - Updated data
     * @returns {Promise<Object>} Updated labor category
     */
    async updateLaborCategory(id, lcatData) {
        const response = await fetch(`${API_BASE_URL}/api/training-data/labor-categories/${id}`, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify(lcatData)
        });
        return this.handleResponse(response);
    },
    
    /**
     * Delete a labor category
     * @param {number} id - Labor category ID
     * @returns {Promise<Object>} Deletion confirmation
     */
    async deleteLaborCategory(id) {
        const response = await fetch(`${API_BASE_URL}/api/training-data/labor-categories/${id}`, {
            method: 'DELETE',
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    },
    
    // =========================================================================
    // PAST PERFORMANCE
    // =========================================================================
    
    /**
     * Get all past performance records
     * @returns {Promise<Array>} List of past performance records
     */
    async getPastPerformance() {
        const response = await fetch(`${API_BASE_URL}/api/training-data/past-performance`, {
            method: 'GET',
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    },
    
    /**
     * Create a new past performance record
     * @param {Object} ppData - Past performance data
     * @returns {Promise<Object>} Created past performance record
     */
    async createPastPerformance(ppData) {
        const response = await fetch(`${API_BASE_URL}/api/training-data/past-performance`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(ppData)
        });
        return this.handleResponse(response);
    },
    
    /**
     * Update a past performance record
     * @param {number} id - Past performance ID
     * @param {Object} ppData - Updated data
     * @returns {Promise<Object>} Updated past performance record
     */
    async updatePastPerformance(id, ppData) {
        const response = await fetch(`${API_BASE_URL}/api/training-data/past-performance/${id}`, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify(ppData)
        });
        return this.handleResponse(response);
    },
    
    /**
     * Delete a past performance record
     * @param {number} id - Past performance ID
     * @returns {Promise<Object>} Deletion confirmation
     */
    async deletePastPerformance(id) {
        const response = await fetch(`${API_BASE_URL}/api/training-data/past-performance/${id}`, {
            method: 'DELETE',
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    },
    
    // =========================================================================
    // TEAMING PARTNERS
    // =========================================================================
    
    /**
     * Get all teaming partners
     * @returns {Promise<Array>} List of teaming partners
     */
    async getTeamingPartners() {
        const response = await fetch(`${API_BASE_URL}/api/training-data/teaming-partners`, {
            method: 'GET',
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    },
    
    /**
     * Create a new teaming partner
     * @param {Object} partnerData - Teaming partner data
     * @returns {Promise<Object>} Created teaming partner
     */
    async createTeamingPartner(partnerData) {
        const response = await fetch(`${API_BASE_URL}/api/training-data/teaming-partners`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(partnerData)
        });
        return this.handleResponse(response);
    },
    
    /**
     * Update a teaming partner
     * @param {number} id - Teaming partner ID
     * @param {Object} partnerData - Updated data
     * @returns {Promise<Object>} Updated teaming partner
     */
    async updateTeamingPartner(id, partnerData) {
        const response = await fetch(`${API_BASE_URL}/api/training-data/teaming-partners/${id}`, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify(partnerData)
        });
        return this.handleResponse(response);
    },
    
    /**
     * Delete a teaming partner
     * @param {number} id - Teaming partner ID
     * @returns {Promise<Object>} Deletion confirmation
     */
    async deleteTeamingPartner(id) {
        const response = await fetch(`${API_BASE_URL}/api/training-data/teaming-partners/${id}`, {
            method: 'DELETE',
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    },
    
    // =========================================================================
    // SUMMARY
    // =========================================================================
    
    /**
     * Get training data summary/statistics
     * @returns {Promise<Object>} Summary with record counts
     */
    async getSummary() {
        const response = await fetch(`${API_BASE_URL}/api/training-data/summary`, {
            method: 'GET',
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    },
    
    // =========================================================================
    // UTILITY METHODS
    // =========================================================================
    
    /**
     * Load all training data categories at once
     * @returns {Promise<Object>} Object with all categories
     */
    async loadAllData() {
        try {
            const [
                companyProfile,
                winThemes,
                competitors,
                laborCategories,
                pastPerformance,
                teamingPartners,
                summary
            ] = await Promise.all([
                this.getCompanyProfile().catch(() => null),
                this.getWinThemes().catch(() => []),
                this.getCompetitors().catch(() => []),
                this.getLaborCategories().catch(() => []),
                this.getPastPerformance().catch(() => []),
                this.getTeamingPartners().catch(() => []),
                this.getSummary().catch(() => ({}))
            ]);
            
            return {
                companyProfile,
                winThemes,
                competitors,
                laborCategories,
                pastPerformance,
                teamingPartners,
                summary
            };
        } catch (error) {
            console.error('Error loading training data:', error);
            throw error;
        }
    },
    
    /**
     * Test API connectivity
     * @returns {Promise<boolean>} True if API is reachable
     */
    async testConnection() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/health`);
            const data = await response.json();
            return data.status === 'healthy';
        } catch (error) {
            console.error('API connection test failed:', error);
            return false;
        }
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TrainingDataAPI;
}
