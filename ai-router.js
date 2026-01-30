/**
 * MissionPulse AI Router
 * Smart routing between AskSage (CUI/sensitive) and Anthropic (general)
 * 
 * CMMC Compliance: CUI-marked content automatically routes to FedRAMP High
 * 
 * © 2026 Mission Meets Tech
 */

(function(global) {
  'use strict';

  // ═══════════════════════════════════════════════════════════════════
  // ROUTING CONFIGURATION
  // ═══════════════════════════════════════════════════════════════════
  
  // CUI markings that MUST route to AskSage
  const CUI_MARKINGS = [
    'CUI//PROPIN',
    'CUI//FEDCON', 
    'CUI//SP-CTI',
    'CUI//SP-EXPT',
    'CUI//SP-NNPI',
    'CUI//SP-PRVCY'
  ];

  // Modules that should prefer AskSage for compliance
  const SENSITIVE_MODULES = [
    'pricing',
    'boe',
    'blackhat',
    'competitive',
    'contracts',
    'compliance',
    'security',
    'personnel',
    'clearances'
  ];

  // Keywords that suggest sensitive content
  const SENSITIVE_KEYWORDS = [
    'labor rate',
    'cost proposal',
    'pricing',
    'proprietary',
    'competitor',
    'weakness',
    'vulnerability',
    'clearance',
    'classified',
    'controlled',
    'cui',
    'fouo',
    'sensitive'
  ];

  // ═══════════════════════════════════════════════════════════════════
  // AI ROUTER CLASS
  // ═══════════════════════════════════════════════════════════════════
  class AIRouter {
    constructor() {
      this.asksageClient = null;
      this.anthropicApiKey = null;
      this.anthropicEndpoint = 'https://api.anthropic.com/v1/messages';
      this.renderEndpoint = 'https://missionpulse-api.onrender.com';
      
      this.preferAsksage = false; // User preference to always use AskSage
      this.fallbackEnabled = true; // If primary fails, try secondary
      
      this._listeners = {
        route: [],
        error: [],
        fallback: []
      };
    }

    // ─────────────────────────────────────────────────────────────────
    // Configuration
    // ─────────────────────────────────────────────────────────────────
    
    /**
     * Configure AskSage provider
     */
    configureAskSage(config) {
      if (typeof AskSageClient !== 'undefined') {
        this.asksageClient = new AskSageClient(config);
      } else {
        console.warn('[AIRouter] AskSageClient not loaded');
      }
      return this;
    }

    /**
     * Configure Anthropic provider
     */
    configureAnthropic(apiKey, endpoint = null) {
      this.anthropicApiKey = apiKey;
      if (endpoint) this.anthropicEndpoint = endpoint;
      return this;
    }

    /**
     * Configure Render backend (proxy for Anthropic)
     */
    configureRenderBackend(endpoint) {
      this.renderEndpoint = endpoint;
      return this;
    }

    /**
     * Set user preference to always use AskSage
     */
    setPreferAskSage(prefer) {
      this.preferAsksage = prefer;
      return this;
    }

    // ─────────────────────────────────────────────────────────────────
    // Routing Logic
    // ─────────────────────────────────────────────────────────────────

    /**
     * Determine which provider to use based on context
     * @param {Object} context - Routing context
     * @returns {string} - 'asksage' or 'anthropic'
     */
    determineProvider(context = {}) {
      const { 
        cuiMarking = 'UNCLASSIFIED',
        module = '',
        content = '',
        forceProvider = null
      } = context;

      // Forced provider takes precedence
      if (forceProvider) {
        return forceProvider;
      }

      // User preference to always use AskSage
      if (this.preferAsksage && this.isAskSageAvailable()) {
        return 'asksage';
      }

      // Check CUI marking - MUST use AskSage for CUI
      if (this.isCuiContent(cuiMarking)) {
        if (!this.isAskSageAvailable()) {
          console.warn('[AIRouter] CUI content detected but AskSage not configured!');
          this._emit('error', { 
            type: 'cui_no_provider',
            message: 'CUI content requires AskSage but it is not configured'
          });
          return null; // Don't allow processing without compliant provider
        }
        return 'asksage';
      }

      // Check if module is sensitive
      if (this.isSensitiveModule(module)) {
        if (this.isAskSageAvailable()) {
          return 'asksage';
        }
        // Allow fallback to Anthropic for non-CUI sensitive modules
        console.warn('[AIRouter] Sensitive module using Anthropic fallback');
      }

      // Check content for sensitive keywords
      if (this.hasSensitiveContent(content)) {
        if (this.isAskSageAvailable()) {
          return 'asksage';
        }
      }

      // Default to Anthropic for general queries (faster/cheaper)
      if (this.isAnthropicAvailable()) {
        return 'anthropic';
      }

      // Fallback to AskSage if Anthropic not available
      if (this.isAskSageAvailable()) {
        return 'asksage';
      }

      return null; // No providers available
    }

    /**
     * Check if content has CUI marking
     */
    isCuiContent(marking) {
      if (!marking) return false;
      return CUI_MARKINGS.some(cui => 
        marking.toUpperCase().includes(cui.replace('CUI//', ''))
      );
    }

    /**
     * Check if module is sensitive
     */
    isSensitiveModule(module) {
      if (!module) return false;
      const moduleLower = module.toLowerCase();
      return SENSITIVE_MODULES.some(sm => moduleLower.includes(sm));
    }

    /**
     * Check content for sensitive keywords
     */
    hasSensitiveContent(content) {
      if (!content) return false;
      const contentLower = content.toLowerCase();
      return SENSITIVE_KEYWORDS.some(kw => contentLower.includes(kw));
    }

    /**
     * Check if AskSage is available
     */
    isAskSageAvailable() {
      return this.asksageClient && this.asksageClient.isConfigured();
    }

    /**
     * Check if Anthropic is available
     */
    isAnthropicAvailable() {
      return !!(this.anthropicApiKey || this.renderEndpoint);
    }

    // ─────────────────────────────────────────────────────────────────
    // Query Execution
    // ─────────────────────────────────────────────────────────────────

    /**
     * Send query to appropriate provider
     * @param {string} message - User message
     * @param {Object} context - Routing context
     * @param {Object} options - Query options
     */
    async query(message, context = {}, options = {}) {
      const provider = this.determineProvider(context);
      
      if (!provider) {
        throw new Error('No AI provider available. Configure AskSage or Anthropic.');
      }

      this._emit('route', { 
        provider, 
        context,
        reason: this.getRoutingReason(context)
      });

      try {
        if (provider === 'asksage') {
          return await this.queryAskSage(message, options);
        } else {
          return await this.queryAnthropic(message, options);
        }
      } catch (error) {
        // Try fallback if enabled
        if (this.fallbackEnabled) {
          const fallbackProvider = provider === 'asksage' ? 'anthropic' : 'asksage';
          
          // Don't fallback from AskSage to Anthropic for CUI content
          if (provider === 'asksage' && this.isCuiContent(context.cuiMarking)) {
            throw new Error('CUI content cannot fallback to non-FedRAMP provider');
          }

          if ((fallbackProvider === 'asksage' && this.isAskSageAvailable()) ||
              (fallbackProvider === 'anthropic' && this.isAnthropicAvailable())) {
            
            this._emit('fallback', { 
              from: provider, 
              to: fallbackProvider,
              error: error.message 
            });

            if (fallbackProvider === 'asksage') {
              return await this.queryAskSage(message, options);
            } else {
              return await this.queryAnthropic(message, options);
            }
          }
        }
        throw error;
      }
    }

    /**
     * Query AskSage
     */
    async queryAskSage(message, options = {}) {
      if (!this.asksageClient) {
        throw new Error('AskSage client not configured');
      }

      const result = await this.asksageClient.query(message, {
        model: options.model,
        persona: options.persona,
        systemPrompt: options.systemPrompt,
        temperature: options.temperature,
        dataset: options.dataset
      });

      return {
        ...result,
        provider: 'asksage',
        cuiCompliant: this.asksageClient.isCuiAuthorized()
      };
    }

    /**
     * Query Anthropic (via Render backend or direct)
     */
    async queryAnthropic(message, options = {}) {
      // Use Render backend if available (no CORS issues)
      if (this.renderEndpoint) {
        return await this.queryViaRender(message, options);
      }

      // Direct Anthropic API call
      if (!this.anthropicApiKey) {
        throw new Error('Anthropic API key not configured');
      }

      const response = await fetch(this.anthropicEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.anthropicApiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: options.model || 'claude-3-sonnet-20240229',
          max_tokens: options.maxTokens || 4096,
          system: options.systemPrompt || 'You are a helpful federal proposal assistant.',
          messages: [{ role: 'user', content: message }]
        })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error?.message || `Anthropic API error: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        response: data.content?.[0]?.text || '',
        provider: 'anthropic',
        model: data.model,
        cuiCompliant: false
      };
    }

    /**
     * Query via Render backend
     */
    async queryViaRender(message, options = {}) {
      const agentType = options.agentType || 'general';
      
      const response = await fetch(`${this.renderEndpoint}/api/agent/${agentType}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: message,
          context: options.context || {},
          opportunityId: options.opportunityId
        })
      });

      if (!response.ok) {
        throw new Error(`Render API error: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        response: data.response || data.message || '',
        provider: 'anthropic',
        via: 'render',
        cuiCompliant: false
      };
    }

    /**
     * Get human-readable routing reason
     */
    getRoutingReason(context) {
      if (context.forceProvider) {
        return `Forced to ${context.forceProvider}`;
      }
      if (this.preferAsksage) {
        return 'User preference: Always use AskSage';
      }
      if (this.isCuiContent(context.cuiMarking)) {
        return `CUI content (${context.cuiMarking}) requires FedRAMP High`;
      }
      if (this.isSensitiveModule(context.module)) {
        return `Sensitive module: ${context.module}`;
      }
      if (this.hasSensitiveContent(context.content)) {
        return 'Content contains sensitive keywords';
      }
      return 'Default routing';
    }

    // ─────────────────────────────────────────────────────────────────
    // Status & Info
    // ─────────────────────────────────────────────────────────────────

    /**
     * Get current configuration status
     */
    getStatus() {
      return {
        asksage: {
          configured: this.isAskSageAvailable(),
          endpoint: this.asksageClient?.endpoint?.label || 'Not configured',
          cuiAuthorized: this.asksageClient?.isCuiAuthorized() || false
        },
        anthropic: {
          configured: this.isAnthropicAvailable(),
          viaRender: !!this.renderEndpoint
        },
        preferences: {
          preferAsksage: this.preferAsksage,
          fallbackEnabled: this.fallbackEnabled
        }
      };
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
  // SINGLETON INSTANCE
  // ═══════════════════════════════════════════════════════════════════
  const aiRouter = new AIRouter();

  // ═══════════════════════════════════════════════════════════════════
  // EXPORT
  // ═══════════════════════════════════════════════════════════════════
  global.AIRouter = AIRouter;
  global.aiRouter = aiRouter; // Singleton instance
  global.CUI_MARKINGS = CUI_MARKINGS;
  global.SENSITIVE_MODULES = SENSITIVE_MODULES;

  console.log('[MissionPulse] AI Router loaded');

})(typeof window !== 'undefined' ? window : global);
