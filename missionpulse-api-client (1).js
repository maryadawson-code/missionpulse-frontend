/**
 * ================================================================================
 * MISSIONPULSE API CLIENT
 * ================================================================================
 * Client library for connecting frontend to FastAPI backend
 * 
 * Author: Mission Meets Tech
 * Version: 1.0.0
 * Phase: 25 (API Integration)
 * ================================================================================
 */

const MissionPulseAPI = {
    // ==========================================================================
    // CONFIGURATION
    // ==========================================================================
    
    baseURL: 'https://missionpulse-api.onrender.com',
    
    // Set custom base URL (for local development)
    setBaseURL(url) {
        this.baseURL = url.replace(/\/$/, ''); // Remove trailing slash
        console.log(`[MissionPulse API] Base URL set to: ${this.baseURL}`);
    },
    
    // ==========================================================================
    // CORE REQUEST HANDLER
    // ==========================================================================
    
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const startTime = performance.now();
        
        try {
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });
            
            const duration = Math.round(performance.now() - startTime);
            
            if (!response.ok) {
                const error = await response.json().catch(() => ({ error: response.statusText }));
                throw new Error(error.error || `HTTP ${response.status}`);
            }
            
            const data = await response.json();
            console.log(`[MissionPulse API] ${endpoint} (${duration}ms)`, data);
            return { success: true, data, duration };
            
        } catch (error) {
            const duration = Math.round(performance.now() - startTime);
            console.error(`[MissionPulse API] ${endpoint} FAILED (${duration}ms):`, error.message);
            return { success: false, error: error.message, duration };
        }
    },
    
    // ==========================================================================
    // SYSTEM ENDPOINTS
    // ==========================================================================
    
    async healthCheck() {
        return this.request('/api/health');
    },
    
    async getVersion() {
        return this.request('/api/version');
    },
    
    // ==========================================================================
    // DASHBOARD ENDPOINTS
    // ==========================================================================
    
    async getDashboardHealth() {
        return this.request('/api/dashboard/health');
    },
    
    async getDashboardSummary() {
        return this.request('/api/dashboard/summary');
    },
    
    async getPipeline() {
        return this.request('/api/dashboard/pipeline');
    },
    
    async getActivities(limit = 10) {
        return this.request(`/api/dashboard/activities?limit=${limit}`);
    },
    
    async getWorkload() {
        return this.request('/api/dashboard/workload');
    },
    
    // ==========================================================================
    // AGENT ENDPOINTS
    // ==========================================================================
    
    async getAgents() {
        return this.request('/api/agents');
    },
    
    async getAgent(agentId) {
        return this.request(`/api/agents/${agentId}`);
    },
    
    async chatWithAgent(agentId, message, userRole = 'BD') {
        return this.request(`/api/agents/${agentId}/chat`, {
            method: 'POST',
            body: JSON.stringify({
                message,
                user_role: userRole,
                opportunity_id: 'demo-opp-001'
            })
        });
    },
    
    async getAgentUsage(agentId) {
        return this.request(`/api/agents/${agentId}/usage`);
    },
    
    // ==========================================================================
    // CONTEXT ENDPOINTS (Phase 3)
    // ==========================================================================
    
    async getContextStatus() {
        return this.request('/api/context/status');
    },
    
    async getTrainingDataSummary() {
        return this.request('/api/training-data/summary');
    },
    
    // ==========================================================================
    // TEST RUNNER
    // ==========================================================================
    
    async runAllTests() {
        console.log('╔══════════════════════════════════════════════════════════════╗');
        console.log('║        MISSIONPULSE API TEST SUITE - Phase 26 QA            ║');
        console.log('╚══════════════════════════════════════════════════════════════╝');
        
        const tests = [
            { name: 'System Health', fn: () => this.healthCheck() },
            { name: 'API Version', fn: () => this.getVersion() },
            { name: 'Dashboard Health', fn: () => this.getDashboardHealth() },
            { name: 'Dashboard Summary', fn: () => this.getDashboardSummary() },
            { name: 'Pipeline Data', fn: () => this.getPipeline() },
            { name: 'Recent Activities', fn: () => this.getActivities(5) },
            { name: 'Team Workload', fn: () => this.getWorkload() },
            { name: 'List Agents', fn: () => this.getAgents() },
            { name: 'Context Status', fn: () => this.getContextStatus() },
            { name: 'Training Data Summary', fn: () => this.getTrainingDataSummary() }
        ];
        
        const results = [];
        
        for (const test of tests) {
            console.log(`\n🧪 Testing: ${test.name}...`);
            const result = await test.fn();
            results.push({
                name: test.name,
                ...result
            });
        }
        
        // Summary
        console.log('\n');
        console.log('╔══════════════════════════════════════════════════════════════╗');
        console.log('║                      TEST RESULTS SUMMARY                    ║');
        console.log('╠══════════════════════════════════════════════════════════════╣');
        
        let passed = 0;
        let failed = 0;
        
        results.forEach(r => {
            const status = r.success ? '✅ PASS' : '❌ FAIL';
            const time = `${r.duration}ms`;
            const error = r.error ? ` - ${r.error}` : '';
            console.log(`║ ${status} | ${r.name.padEnd(25)} | ${time.padStart(6)}${error}`);
            r.success ? passed++ : failed++;
        });
        
        console.log('╠══════════════════════════════════════════════════════════════╣');
        console.log(`║ TOTAL: ${passed} passed, ${failed} failed                              ║`);
        console.log('╚══════════════════════════════════════════════════════════════╝');
        
        return { passed, failed, results };
    }
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MissionPulseAPI;
}

// Auto-attach to window for browser usage
if (typeof window !== 'undefined') {
    window.MissionPulseAPI = MissionPulseAPI;
}
