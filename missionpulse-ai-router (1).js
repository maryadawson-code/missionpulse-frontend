/**
 * MissionPulse AI Router v1.0
 * Intelligent Multi-Model Routing for Federal Proposal Management
 * 
 * Routes queries automatically to:
 * - AskSage: FedRAMP High/IL5 for CUI, pricing, compliance
 * - Claude: Strategy, analysis, writing, code
 * - GPT + DALL-E: Diagrams, images, visual content
 * 
 * @author MissionPulse / Mission Meets Tech
 * @license MIT
 * @version 1.0.0
 */

// =============================================================================
// MISSIONPULSE AI ROUTER - CORE MODULE
// =============================================================================

const MissionPulseAI = (function() {
    'use strict';

    // Configuration (loaded from localStorage or defaults)
    let config = {
        asksage: {
            endpoint: 'https://api.asksage.ai',
            model: 'gpt-4o',
            apiKey: null,
            email: null,
            persona: 1,
            dataset: 'none'
        },
        claude: {
            endpoint: 'https://api.anthropic.com/v1',
            model: 'claude-3-5-sonnet-20241022',
            apiKey: null,
            maxTokens: 4096
        },
        gpt: {
            endpoint: 'https://api.openai.com/v1',
            model: 'gpt-4o',
            dalleModel: 'dall-e-3',
            apiKey: null,
            maxTokens: 4096
        },
        routing: {
            autoCUIDetect: true,
            autoImageDetect: true,
            defaultRoute: 'claude',
            cuiKeywords: [],
            visualKeywords: []
        }
    };

    // Default keyword lists for routing
    const DEFAULT_CUI_KEYWORDS = [
        'pricing', 'price', 'cost', 'rate', 'labor rate', 'hourly rate',
        'boe', 'basis of estimate', 'fte', 'staff', 'staffing',
        'salary', 'compensation', 'wrap rate', 'fringe', 'overhead',
        'g&a', 'profit', 'margin', 'indirect', 'direct cost',
        'contract value', 'ceiling', 'clins', 'clin',
        'cui', 'fouo', 'controlled unclassified', 'sensitive',
        'proprietary', 'trade secret', 'confidential',
        'far', 'dfars', 'compliance', 'nist', 'cmmc',
        'ato', 'fedramp', 'security control', 'ssp',
        'subcontractor', 'teaming', 'oem cost', 'vendor price',
        'classified', 'secret', 'top secret', 'sci'
    ];

    const DEFAULT_VISUAL_KEYWORDS = [
        'diagram', 'chart', 'graph', 'image', 'picture', 'visual',
        'flowchart', 'org chart', 'organization chart', 'architecture diagram',
        'infographic', 'illustration', 'draw', 'create image',
        'generate image', 'make a diagram', 'show me', 'visualize',
        'timeline', 'gantt', 'swim lane', 'process flow',
        'network diagram', 'system architecture', 'data flow',
        'mockup', 'wireframe', 'ui design', 'logo'
    ];

    // Token usage tracking
    let tokenUsage = {
        asksage: { used: 0, limit: 200000 },
        claude: { used: 0, limit: 100000 },
        gpt: { used: 0, limit: 50000 }
    };

    // Route history
    let routeHistory = [];

    // ==========================================================================
    // INITIALIZATION
    // ==========================================================================

    function init(customConfig = {}) {
        // Merge custom config
        config = deepMerge(config, customConfig);
        
        // Load from localStorage if available
        const stored = localStorage.getItem('missionpulse_ai_config');
        if (stored) {
            config = deepMerge(config, JSON.parse(stored));
        }

        // Set default keywords if not customized
        if (!config.routing.cuiKeywords.length) {
            config.routing.cuiKeywords = DEFAULT_CUI_KEYWORDS;
        }
        if (!config.routing.visualKeywords.length) {
            config.routing.visualKeywords = DEFAULT_VISUAL_KEYWORDS;
        }

        console.log('[MissionPulse AI] Router initialized');
        return this;
    }

    // ==========================================================================
    // ROUTING ENGINE
    // ==========================================================================

    /**
     * Determine the optimal AI route for a given query
     * @param {string} message - User's query
     * @param {Object} options - Optional routing overrides
     * @returns {Object} Routing decision with reason and confidence
     */
    function determineRoute(message, options = {}) {
        const lowerMessage = message.toLowerCase();

        // Manual override
        if (options.forceRoute) {
            return {
                route: options.forceRoute,
                reason: 'Manual route override',
                confidence: 1.0,
                forced: true
            };
        }

        // CUI Mode override (all queries to AskSage)
        if (options.cuiMode) {
            return {
                route: 'asksage',
                reason: 'CUI Mode enabled - routing to FedRAMP High',
                confidence: 1.0,
                securityLevel: 'CUI'
            };
        }

        // Check for CUI/Sensitive keywords
        if (config.routing.autoCUIDetect) {
            const cuiMatch = config.routing.cuiKeywords.find(
                keyword => lowerMessage.includes(keyword.toLowerCase())
            );
            if (cuiMatch) {
                return {
                    route: 'asksage',
                    reason: `Sensitive keyword detected: "${cuiMatch}"`,
                    confidence: 0.95,
                    securityLevel: 'CUI',
                    matchedKeyword: cuiMatch
                };
            }
        }

        // Check for Visual/Diagram keywords
        if (config.routing.autoImageDetect) {
            const visualMatch = config.routing.visualKeywords.find(
                keyword => lowerMessage.includes(keyword.toLowerCase())
            );
            if (visualMatch) {
                return {
                    route: 'gpt',
                    reason: `Visual content requested: "${visualMatch}"`,
                    confidence: 0.9,
                    matchedKeyword: visualMatch,
                    isImageRequest: isImageGenerationRequest(message)
                };
            }
        }

        // Default route
        return {
            route: config.routing.defaultRoute,
            reason: 'General query - using default route',
            confidence: 0.85
        };
    }

    function isImageGenerationRequest(message) {
        const imagePatterns = [
            'create image', 'generate image', 'make a picture',
            'draw me', 'illustration of', 'logo for'
        ];
        return imagePatterns.some(p => message.toLowerCase().includes(p));
    }

    // ==========================================================================
    // API CLIENTS
    // ==========================================================================

    /**
     * AskSage API Client - FedRAMP High / IL5 Compliant
     */
    const AskSageClient = {
        /**
         * Get 24-hour access token
         */
        async getToken() {
            if (!config.asksage.apiKey || !config.asksage.email) {
                throw new Error('AskSage API key and email required');
            }

            const response = await fetch(
                `${config.asksage.endpoint}/user/get-token-with-api-key`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: config.asksage.email,
                        api_key: config.asksage.apiKey
                    })
                }
            );

            const data = await response.json();
            if (data.response && data.response.token) {
                return data.response.token;
            }
            throw new Error('Failed to get AskSage token');
        },

        /**
         * Query AskSage
         */
        async query(message, options = {}) {
            const response = await fetch(
                `${config.asksage.endpoint}/server/query`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-access-tokens': config.asksage.apiKey
                    },
                    body: JSON.stringify({
                        message: message,
                        model: options.model || config.asksage.model,
                        persona: options.persona || config.asksage.persona,
                        dataset: options.dataset || config.asksage.dataset,
                        temperature: options.temperature || 0.7,
                        limit_references: options.limit_references || 5,
                        live: options.live || 0
                    })
                }
            );

            const data = await response.json();
            
            // Track token usage (estimate)
            const estimatedTokens = (message.length + (data.message?.length || 0)) / 4;
            trackTokenUsage('asksage', estimatedTokens);

            return {
                success: true,
                source: 'asksage',
                message: data.message,
                references: data.references,
                uuid: data.uuid,
                raw: data
            };
        },

        /**
         * Query with file attachment
         */
        async queryWithFile(message, filePath, options = {}) {
            const response = await fetch(
                `${config.asksage.endpoint}/server/query_with_file`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-access-tokens': config.asksage.apiKey
                    },
                    body: JSON.stringify({
                        message: message,
                        file: filePath,
                        model: options.model || config.asksage.model,
                        ...options
                    })
                }
            );

            return response.json();
        },

        /**
         * Get available models
         */
        async getModels() {
            const response = await fetch(
                `${config.asksage.endpoint}/server/get-models`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-access-tokens': config.asksage.apiKey
                    }
                }
            );
            return response.json();
        }
    };

    /**
     * Claude API Client - Anthropic
     */
    const ClaudeClient = {
        async query(message, options = {}) {
            if (!config.claude.apiKey) {
                throw new Error('Claude API key required');
            }

            const response = await fetch(
                `${config.claude.endpoint}/messages`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': config.claude.apiKey,
                        'anthropic-version': '2023-06-01'
                    },
                    body: JSON.stringify({
                        model: options.model || config.claude.model,
                        max_tokens: options.maxTokens || config.claude.maxTokens,
                        messages: Array.isArray(message) 
                            ? message 
                            : [{ role: 'user', content: message }],
                        system: options.system || 'You are a helpful AI assistant for federal proposal management. Provide clear, actionable responses.'
                    })
                }
            );

            const data = await response.json();
            
            // Track token usage
            if (data.usage) {
                trackTokenUsage('claude', data.usage.input_tokens + data.usage.output_tokens);
            }

            return {
                success: true,
                source: 'claude',
                message: data.content?.[0]?.text || '',
                usage: data.usage,
                raw: data
            };
        }
    };

    /**
     * GPT / DALL-E API Client - OpenAI
     */
    const GPTClient = {
        async query(message, options = {}) {
            if (!config.gpt.apiKey) {
                throw new Error('OpenAI API key required');
            }

            // Check if this is an image generation request
            if (options.generateImage || isImageGenerationRequest(message)) {
                return this.generateImage(message, options);
            }

            const response = await fetch(
                `${config.gpt.endpoint}/chat/completions`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${config.gpt.apiKey}`
                    },
                    body: JSON.stringify({
                        model: options.model || config.gpt.model,
                        messages: Array.isArray(message)
                            ? message
                            : [{ role: 'user', content: message }],
                        max_tokens: options.maxTokens || config.gpt.maxTokens
                    })
                }
            );

            const data = await response.json();
            
            // Track token usage
            if (data.usage) {
                trackTokenUsage('gpt', data.usage.total_tokens);
            }

            return {
                success: true,
                source: 'gpt',
                message: data.choices?.[0]?.message?.content || '',
                usage: data.usage,
                raw: data
            };
        },

        async generateImage(prompt, options = {}) {
            const response = await fetch(
                `${config.gpt.endpoint}/images/generations`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${config.gpt.apiKey}`
                    },
                    body: JSON.stringify({
                        model: options.dalleModel || config.gpt.dalleModel,
                        prompt: prompt,
                        n: options.n || 1,
                        size: options.size || '1024x1024',
                        quality: options.quality || 'standard'
                    })
                }
            );

            const data = await response.json();
            
            // Track usage (DALL-E uses different pricing)
            trackTokenUsage('gpt', 1000); // Approximate token equivalent

            return {
                success: true,
                source: 'gpt-dalle',
                type: 'image',
                images: data.data?.map(d => d.url) || [],
                raw: data
            };
        }
    };

    // ==========================================================================
    // MAIN QUERY FUNCTION
    // ==========================================================================

    /**
     * Main entry point - routes query to appropriate AI
     * @param {string} message - User's query
     * @param {Object} options - Options including forceRoute, cuiMode, etc.
     * @returns {Promise<Object>} AI response with routing metadata
     */
    async function query(message, options = {}) {
        // Determine route
        const routing = determineRoute(message, options);
        
        // Log route decision
        logRoute(message, routing);

        // Execute query based on route
        let response;
        const startTime = Date.now();

        try {
            switch (routing.route) {
                case 'asksage':
                    response = await AskSageClient.query(message, options);
                    break;
                case 'claude':
                    response = await ClaudeClient.query(message, options);
                    break;
                case 'gpt':
                    response = await GPTClient.query(message, options);
                    break;
                default:
                    throw new Error(`Unknown route: ${routing.route}`);
            }

            response.routing = routing;
            response.latency = Date.now() - startTime;
            
        } catch (error) {
            response = {
                success: false,
                source: routing.route,
                error: error.message,
                routing: routing
            };
        }

        return response;
    }

    // ==========================================================================
    // UTILITY FUNCTIONS
    // ==========================================================================

    function trackTokenUsage(provider, tokens) {
        tokenUsage[provider].used += Math.round(tokens);
        
        // Emit event for UI updates
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('missionpulse-tokens', {
                detail: { provider, tokens, total: tokenUsage[provider] }
            }));
        }
    }

    function logRoute(message, routing) {
        const entry = {
            timestamp: new Date().toISOString(),
            message: message.substring(0, 100),
            route: routing.route,
            reason: routing.reason,
            confidence: routing.confidence
        };
        
        routeHistory.unshift(entry);
        if (routeHistory.length > 100) routeHistory.pop();

        // Emit event
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('missionpulse-route', {
                detail: entry
            }));
        }
    }

    function deepMerge(target, source) {
        const result = { ...target };
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = deepMerge(target[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }
        return result;
    }

    // ==========================================================================
    // CONFIGURATION API
    // ==========================================================================

    function setConfig(newConfig) {
        config = deepMerge(config, newConfig);
        localStorage.setItem('missionpulse_ai_config', JSON.stringify(config));
        return config;
    }

    function getConfig() {
        return { ...config };
    }

    function setApiKey(provider, key) {
        if (config[provider]) {
            config[provider].apiKey = key;
            localStorage.setItem('missionpulse_ai_config', JSON.stringify(config));
        }
    }

    function getTokenUsage() {
        return { ...tokenUsage };
    }

    function getRouteHistory() {
        return [...routeHistory];
    }

    function addCUIKeyword(keyword) {
        if (!config.routing.cuiKeywords.includes(keyword.toLowerCase())) {
            config.routing.cuiKeywords.push(keyword.toLowerCase());
        }
    }

    function addVisualKeyword(keyword) {
        if (!config.routing.visualKeywords.includes(keyword.toLowerCase())) {
            config.routing.visualKeywords.push(keyword.toLowerCase());
        }
    }

    // ==========================================================================
    // PUBLIC API
    // ==========================================================================

    return {
        // Core
        init,
        query,
        determineRoute,

        // Direct client access
        asksage: AskSageClient,
        claude: ClaudeClient,
        gpt: GPTClient,

        // Configuration
        setConfig,
        getConfig,
        setApiKey,

        // Monitoring
        getTokenUsage,
        getRouteHistory,

        // Customization
        addCUIKeyword,
        addVisualKeyword,

        // Version
        version: '1.0.0'
    };
})();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MissionPulseAI;
}

// =============================================================================
// USAGE EXAMPLES
// =============================================================================

/*
// Initialize
MissionPulseAI.init({
    asksage: {
        apiKey: 'your-asksage-key',
        email: 'your@email.gov'
    },
    claude: {
        apiKey: 'your-anthropic-key'
    },
    gpt: {
        apiKey: 'your-openai-key'
    }
});

// Auto-routed query
const response = await MissionPulseAI.query('Analyze our labor rates for the VA proposal');
// → Routes to AskSage (detected "labor rates")

const response2 = await MissionPulseAI.query('Create an org chart for our team');
// → Routes to GPT + DALL-E (detected "org chart")

const response3 = await MissionPulseAI.query('Develop win themes for this opportunity');
// → Routes to Claude (general strategy)

// Force specific route
const response4 = await MissionPulseAI.query('General question', { forceRoute: 'asksage' });

// CUI mode (all to AskSage)
const response5 = await MissionPulseAI.query('Any query', { cuiMode: true });

// Direct client access
const asksageResponse = await MissionPulseAI.asksage.query('CUI query');
const claudeResponse = await MissionPulseAI.claude.query('Strategy query');
const gptResponse = await MissionPulseAI.gpt.generateImage('Create logo');

// Listen for events
window.addEventListener('missionpulse-route', (e) => {
    console.log('Routed to:', e.detail.route);
});

window.addEventListener('missionpulse-tokens', (e) => {
    console.log('Token usage:', e.detail);
});
*/
