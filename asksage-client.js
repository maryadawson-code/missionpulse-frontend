/**
 * MissionPulse AskSage Client
 * FedRAMP High / IL5 Compliant AI Provider
 * 
 * Routes CUI-marked content through AskSage for CMMC compliance
 * 
 * © 2026 Mission Meets Tech
 */

(function(global) {
  'use strict';

  // ═══════════════════════════════════════════════════════════════════
  // ASKSAGE ENDPOINT CONFIGURATION
  // ═══════════════════════════════════════════════════════════════════
  const ASKSAGE_ENDPOINTS = {
    // Commercial FedRAMP High (default)
    commercial: {
      api: 'https://api.asksage.ai',
      chat: 'https://chat.asksage.ai',
      label: 'FedRAMP High (Commercial)',
      cuiAuthorized: false
    },
    // IL5 Civilian
    il5_civilian: {
      api: 'https://api.civ.asksage.ai',
      chat: 'https://chat.civ.asksage.ai',
      label: 'IL5 Civilian (CUI Authorized)',
      cuiAuthorized: true
    },
    // IL5 DoD (requires NIPR)
    il5_dod: {
      api: 'https://api.genai.army.mil',
      chat: 'https://chat.genai.army.mil',
      label: 'IL5 DoD (NIPR Required)',
      cuiAuthorized: true
    }
  };

  // Default personas available in AskSage
  const ASKSAGE_PERSONAS = {
    1: { id: 1, name: 'Ask Sage', description: 'General purpose assistant' },
    2: { id: 2, name: 'Technical Writer', description: 'Technical documentation' },
    3: { id: 3, name: 'Proposal Writer', description: 'Government proposal writing' },
    4: { id: 4, name: 'Contract Specialist', description: 'FAR/DFARS expertise' },
    5: { id: 5, name: 'Capture Manager', description: 'BD and capture strategy' }
  };

  // ═══════════════════════════════════════════════════════════════════
  // ASKSAGE CLIENT CLASS
  // ═══════════════════════════════════════════════════════════════════
  class AskSageClient {
    constructor(config = {}) {
      this.email = config.email || null;
      this.apiKey = config.apiKey || null;
      this.accessToken = null;
      this.tokenExpiry = null;
      this.securityLevel = config.securityLevel || 'commercial';
      this.defaultModel = config.defaultModel || 'gpt-4';
      this.defaultPersona = config.defaultPersona || 1;
      this.endpoint = ASKSAGE_ENDPOINTS[this.securityLevel] || ASKSAGE_ENDPOINTS.commercial;
      
      this._listeners = {
        status: [],
        error: []
      };
    }

    // ─────────────────────────────────────────────────────────────────
    // Configuration
    // ─────────────────────────────────────────────────────────────────
    configure(config) {
      if (config.email) this.email = config.email;
      if (config.apiKey) this.apiKey = config.apiKey;
      if (config.securityLevel) {
        this.securityLevel = config.securityLevel;
        this.endpoint = ASKSAGE_ENDPOINTS[config.securityLevel] || ASKSAGE_ENDPOINTS.commercial;
      }
      if (config.defaultModel) this.defaultModel = config.defaultModel;
      if (config.defaultPersona) this.defaultPersona = config.defaultPersona;
      return this;
    }

    isConfigured() {
      return !!(this.email && this.apiKey);
    }

    isCuiAuthorized() {
      return this.endpoint?.cuiAuthorized || false;
    }

    // ─────────────────────────────────────────────────────────────────
    // Token Management (24-hour tokens)
    // ─────────────────────────────────────────────────────────────────
    async getAccessToken(forceRefresh = false) {
      // Return cached token if still valid
      if (!forceRefresh && this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
        return this.accessToken;
      }

      if (!this.email || !this.apiKey) {
        throw new Error('AskSage: Email and API key required for authentication');
      }

      try {
        const response = await fetch(`${this.endpoint.api}/user/get-token-with-api-key`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: this.email,
            api_key: this.apiKey
          })
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(error.message || `Authentication failed: ${response.status}`);
        }

        const data = await response.json();
        this.accessToken = data.access_token || data.token;
        // Token valid for 24 hours, refresh at 23 hours
        this.tokenExpiry = Date.now() + (23 * 60 * 60 * 1000);
        
        this._emit('status', { status: 'authenticated', endpoint: this.endpoint.label });
        return this.accessToken;
      } catch (error) {
        this._emit('error', { error: error.message, operation: 'getAccessToken' });
        throw error;
      }
    }

    // ─────────────────────────────────────────────────────────────────
    // Core API Methods
    // ─────────────────────────────────────────────────────────────────
    
    /**
     * Query AskSage AI
     * @param {string} message - User message/prompt
     * @param {Object} options - Query options
     * @returns {Promise<Object>} - AI response
     */
    async query(message, options = {}) {
      const token = await this.getAccessToken();
      
      const payload = {
        message: message,
        model: options.model || this.defaultModel,
        persona: options.persona || this.defaultPersona,
        temperature: options.temperature || 0.7,
        dataset: options.dataset || null,
        system_prompt: options.systemPrompt || null,
        ...options.extra
      };

      try {
        const response = await fetch(`${this.endpoint.api}/server/query`, {
          method: 'POST',
          headers: {
            'x-access-tokens': token,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(error.message || `Query failed: ${response.status}`);
        }

        const data = await response.json();
        return {
          success: true,
          response: data.response || data.message || data,
          model: payload.model,
          persona: payload.persona,
          provider: 'asksage',
          cuiCompliant: this.isCuiAuthorized()
        };
      } catch (error) {
        this._emit('error', { error: error.message, operation: 'query' });
        throw error;
      }
    }

    /**
     * Query with file attachment
     * @param {string} message - User message
     * @param {string|string[]} files - File path(s)
     * @param {Object} options - Query options
     */
    async queryWithFile(message, files, options = {}) {
      const token = await this.getAccessToken();
      
      const payload = {
        message: message,
        file: Array.isArray(files) ? files : [files],
        model: options.model || this.defaultModel,
        persona: options.persona || this.defaultPersona,
        ...options.extra
      };

      try {
        const response = await fetch(`${this.endpoint.api}/server/query_with_file`, {
          method: 'POST',
          headers: {
            'x-access-tokens': token,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          throw new Error(`Query with file failed: ${response.status}`);
        }

        const data = await response.json();
        return {
          success: true,
          response: data.response || data,
          provider: 'asksage'
        };
      } catch (error) {
        this._emit('error', { error: error.message, operation: 'queryWithFile' });
        throw error;
      }
    }

    /**
     * Get available models
     */
    async getModels() {
      const token = await this.getAccessToken();
      
      try {
        const response = await fetch(`${this.endpoint.api}/server/get-models`, {
          method: 'POST',
          headers: {
            'x-access-tokens': token,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Get models failed: ${response.status}`);
        }

        return await response.json();
      } catch (error) {
        this._emit('error', { error: error.message, operation: 'getModels' });
        throw error;
      }
    }

    /**
     * Get available personas
     */
    async getPersonas() {
      const token = await this.getAccessToken();
      
      try {
        const response = await fetch(`${this.endpoint.api}/server/get-personas`, {
          method: 'POST',
          headers: {
            'x-access-tokens': token,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Get personas failed: ${response.status}`);
        }

        return await response.json();
      } catch (error) {
        this._emit('error', { error: error.message, operation: 'getPersonas' });
        throw error;
      }
    }

    /**
     * Get user's datasets
     */
    async getDatasets() {
      const token = await this.getAccessToken();
      
      try {
        const response = await fetch(`${this.endpoint.api}/server/get-datasets`, {
          method: 'POST',
          headers: {
            'x-access-tokens': token,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Get datasets failed: ${response.status}`);
        }

        return await response.json();
      } catch (error) {
        this._emit('error', { error: error.message, operation: 'getDatasets' });
        throw error;
      }
    }

    /**
     * Get token usage for current month
     */
    async getTokenUsage() {
      const token = await this.getAccessToken();
      
      try {
        const response = await fetch(`${this.endpoint.api}/server/count-monthly-tokens`, {
          method: 'POST',
          headers: {
            'x-access-tokens': token,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Get token usage failed: ${response.status}`);
        }

        return await response.json();
      } catch (error) {
        this._emit('error', { error: error.message, operation: 'getTokenUsage' });
        throw error;
      }
    }

    /**
     * Test connection to AskSage
     */
    async testConnection() {
      try {
        await this.getAccessToken(true);
        const models = await this.getModels();
        return {
          success: true,
          message: 'Connected to AskSage',
          endpoint: this.endpoint.label,
          cuiAuthorized: this.isCuiAuthorized(),
          modelsAvailable: Array.isArray(models) ? models.length : 'unknown'
        };
      } catch (error) {
        return {
          success: false,
          message: error.message,
          endpoint: this.endpoint.label
        };
      }
    }

    // ─────────────────────────────────────────────────────────────────
    // Event System
    // ─────────────────────────────────────────────────────────────────
    on(event, callback) {
      if (this._listeners[event]) {
        this._listeners[event].push(callback);
      }
      return this;
    }

    off(event, callback) {
      if (this._listeners[event]) {
        this._listeners[event] = this._listeners[event].filter(cb => cb !== callback);
      }
      return this;
    }

    _emit(event, data) {
      if (this._listeners[event]) {
        this._listeners[event].forEach(cb => cb(data));
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // EXPORT
  // ═══════════════════════════════════════════════════════════════════
  global.AskSageClient = AskSageClient;
  global.ASKSAGE_ENDPOINTS = ASKSAGE_ENDPOINTS;
  global.ASKSAGE_PERSONAS = ASKSAGE_PERSONAS;

  console.log('[MissionPulse] AskSage Client loaded');

})(typeof window !== 'undefined' ? window : global);
