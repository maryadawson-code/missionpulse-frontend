/**
 * MissionPulse Render API Client v1.3.0
 * Includes AskSage FedRAMP High Agent
 * 
 * Usage:
 *   const client = new MissionPulseAPI();
 *   const response = await client.chat('asksage', 'What is CMMC 2.0?');
 */

const RENDER_API_BASE = 'https://missionpulse-api.onrender.com';

// Agent Configuration - 9 Agents
const AGENT_CONFIG = {
  capture: {
    name: 'Capture Intelligence',
    endpoint: '/agents/capture/chat',
    icon: '🎯',
    roles: ['ceo', 'coo', 'cap', 'pm', 'sa', 'fin', 'con', 'del', 'qa', 'admin']
  },
  strategy: {
    name: 'Strategy Advisor',
    endpoint: '/agents/strategy/chat',
    icon: '♟️',
    roles: ['ceo', 'coo', 'cap', 'pm', 'sa', 'fin', 'con', 'del', 'qa', 'admin']
  },
  blackhat: {
    name: 'Black Hat Intel',
    endpoint: '/agents/blackhat/chat',
    icon: '🎭',
    roles: ['ceo', 'coo', 'cap'], // RESTRICTED
    restricted: true
  },
  pricing: {
    name: 'Pricing Intelligence',
    endpoint: '/agents/pricing/chat',
    icon: '💰',
    roles: ['ceo', 'coo', 'cap', 'pm', 'fin', 'admin']
  },
  compliance: {
    name: 'Compliance Guardian',
    endpoint: '/agents/compliance/chat',
    icon: '📋',
    roles: ['ceo', 'coo', 'cap', 'pm', 'sa', 'fin', 'con', 'del', 'qa', 'admin']
  },
  writer: {
    name: 'Proposal Writer',
    endpoint: '/agents/writer/chat',
    icon: '✍️',
    roles: ['ceo', 'coo', 'cap', 'pm', 'sa', 'fin', 'con', 'del', 'qa', 'admin']
  },
  contracts: {
    name: 'Contracts Analyst',
    endpoint: '/agents/contracts/chat',
    icon: '📑',
    roles: ['ceo', 'coo', 'cap', 'pm', 'con', 'admin']
  },
  orals: {
    name: 'Orals Coach',
    endpoint: '/agents/orals/chat',
    icon: '🎤',
    roles: ['ceo', 'coo', 'cap', 'pm', 'sa', 'admin']
  },
  asksage: {
    name: 'AskSage',
    endpoint: '/agents/asksage/chat',
    icon: '🛡️',
    roles: ['ceo', 'coo', 'cap', 'pm', 'admin'], // capture_manager+
    fedramp: true,
    securityLevel: 'FedRAMP High / IL5'
  }
};

class MissionPulseAPI {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || RENDER_API_BASE;
    this.timeout = options.timeout || 30000;
    this.userRole = options.userRole || this._getUserRole();
  }

  _getUserRole() {
    try {
      const user = JSON.parse(localStorage.getItem('mp_user') || '{}');
      return user.role || 'pm';
    } catch {
      return 'pm';
    }
  }

  // Check if user can access agent
  canAccess(agentId) {
    const agent = AGENT_CONFIG[agentId];
    if (!agent) return false;
    return agent.roles.includes(this.userRole);
  }

  // Get all accessible agents for current user
  getAccessibleAgents() {
    return Object.entries(AGENT_CONFIG)
      .filter(([id, _]) => this.canAccess(id))
      .map(([id, config]) => ({ id, ...config }));
  }

  // Get agent info
  getAgent(agentId) {
    return AGENT_CONFIG[agentId] || null;
  }

  // Health check
  async health() {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      return await response.json();
    } catch (error) {
      console.error('Health check failed:', error);
      return { status: 'offline', error: error.message };
    }
  }

  // Agent status check
  async agentStatus(agentId) {
    try {
      const response = await fetch(`${this.baseUrl}/agents/${agentId}/status`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      return await response.json();
    } catch (error) {
      console.error(`Agent ${agentId} status failed:`, error);
      return { status: 'offline', error: error.message };
    }
  }

  // Chat with agent
  async chat(agentId, message, options = {}) {
    const agent = AGENT_CONFIG[agentId];
    
    if (!agent) {
      throw new Error(`Unknown agent: ${agentId}`);
    }

    if (!this.canAccess(agentId)) {
      throw new Error(`Access denied: ${agentId} requires ${agent.roles.join('/')} role`);
    }

    const payload = {
      message: message,
      user_role: this.userRole,
      opportunity_id: options.opportunityId || null,
      include_playbook: options.includePlaybook !== false,
      context: options.context || {}
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseUrl}${agent.endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || `HTTP ${response.status}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        agentId: agentId,
        agentName: agent.name,
        response: data.response || data.message,
        confidence: data.confidence,
        tokenUsage: data.token_usage,
        fedramp: agent.fedramp || false,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }

  // Convenience methods for each agent
  async captureChat(message, options) { return this.chat('capture', message, options); }
  async strategyChat(message, options) { return this.chat('strategy', message, options); }
  async blackhatChat(message, options) { return this.chat('blackhat', message, options); }
  async pricingChat(message, options) { return this.chat('pricing', message, options); }
  async complianceChat(message, options) { return this.chat('compliance', message, options); }
  async writerChat(message, options) { return this.chat('writer', message, options); }
  async contractsChat(message, options) { return this.chat('contracts', message, options); }
  async oralsChat(message, options) { return this.chat('orals', message, options); }
  async asksageChat(message, options) { return this.chat('asksage', message, options); }

  // Stream chat (for future SSE support)
  async streamChat(agentId, message, onToken, options = {}) {
    // Placeholder for streaming implementation
    // Currently falls back to regular chat
    const result = await this.chat(agentId, message, options);
    if (onToken) onToken(result.response);
    return result;
  }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { MissionPulseAPI, AGENT_CONFIG, RENDER_API_BASE };
}

// Global export for browser
if (typeof window !== 'undefined') {
  window.MissionPulseAPI = MissionPulseAPI;
  window.AGENT_CONFIG = AGENT_CONFIG;
}
