/**
 * ================================================================================
 * MISSIONPULSE - INTELLIGENT MODEL ROUTER v1.0.0
 * ================================================================================
 * Automatically routes prompts to AskSage (FedRAMP High) for CUI data
 * or Anthropic Claude for non-CUI to optimize cost and compliance.
 * 
 * Author: Mission Meets Tech
 * Classification: CUI // SP-PROPIN (this file handles CUI routing logic)
 * ================================================================================
 */

const ModelRouter = {
    // Configuration
    config: {
        askSageApiUrl: 'https://api.asksage.ai/v1', // Replace with actual AskSage endpoint
        anthropicApiUrl: 'https://missionpulse-api.onrender.com/agents',
        defaultCuiModel: 'aws-gov-claude-4.5-sonnet',
        defaultNonCuiModel: 'claude-sonnet',
        debug: true
    },

    // =========================================================================
    // CUI DETECTION PATTERNS
    // =========================================================================
    cuiPatterns: {
        // Explicit CUI markers
        explicit: [
            /\bCUI\b/i,
            /\bFOUO\b/i,
            /\bPROPIN\b/i,
            /controlled\s*unclassified/i,
            /for\s*official\s*use\s*only/i,
            /competition\s*sensitive/i,
            /source\s*selection/i,
            /proprietary\s*information/i
        ],
        
        // Pricing & Financial (always CUI in proposals)
        pricing: [
            /labor\s*rate/i,
            /indirect\s*rate/i,
            /overhead\s*rate/i,
            /G&A\s*rate/i,
            /fringe\s*rate/i,
            /wrap\s*rate/i,
            /fully\s*burdened/i,
            /BOE|basis\s*of\s*estimate/i,
            /cost\s*volume/i,
            /price\s*proposal/i,
            /\$[\d,]+\s*(K|M|B)/i,  // Dollar amounts with K/M/B
            /\$[\d,]{6,}/,          // Dollar amounts over $100,000
            /profit\s*margin/i,
            /fee\s*percentage/i,
            /CPFF|CPIF|FFP|T&M/i    // Contract types with pricing implications
        ],
        
        // Competitive Intelligence (always restrict)
        competitive: [
            /competitor\s*analysis/i,
            /black\s*hat/i,
            /competitive\s*intel/i,
            /competitor\s*weakness/i,
            /competitor\s*strength/i,
            /incumbent\s*weakness/i,
            /ghost\s*team/i,
            /teaming\s*strategy/i,
            /win\s*strategy/i,
            /discriminator/i,
            /price\s*to\s*win/i,
            /PTW/i
        ],
        
        // Personnel Sensitive
        personnel: [
            /\b\d{3}-\d{2}-\d{4}\b/,  // SSN pattern
            /security\s*clearance/i,
            /TS\/SCI/i,
            /top\s*secret/i,
            /secret\s*clearance/i,
            /salary|compensation/i,
            /key\s*personnel/i,
            /resume|CV/i
        ],
        
        // Technical Proprietary
        technical: [
            /proprietary\s*solution/i,
            /trade\s*secret/i,
            /patent\s*pending/i,
            /technical\s*approach/i,
            /solution\s*architecture/i,
            /innovation/i
        ],
        
        // Contract Specific
        contract: [
            /contract\s*number/i,
            /task\s*order/i,
            /delivery\s*order/i,
            /IDIQ/i,
            /BPA/i,
            /GSA\s*schedule/i,
            /ceiling\s*value/i
        ]
    },

    // =========================================================================
    // TASK DETECTION FOR OPTIMAL MODEL SELECTION
    // =========================================================================
    taskPatterns: {
        largeDocument: [
            /analyze\s*(this|the)\s*(document|file|PDF|RFP)/i,
            /summarize\s*(this|the)\s*(document|file)/i,
            /review\s*(this|the)\s*(RFP|SOW|PWS)/i,
            /extract\s*(requirements|sections)/i
        ],
        codeGeneration: [
            /write\s*(code|script|function)/i,
            /generate\s*(code|SQL|Python)/i,
            /create\s*(a|an)\s*(component|module|API)/i,
            /fix\s*(this|the)\s*(bug|code|error)/i,
            /refactor/i
        ],
        imageGeneration: [
            /generate\s*(an|a)\s*image/i,
            /create\s*(a|an)\s*(diagram|chart|visual)/i,
            /design\s*(a|an)/i,
            /draw/i
        ],
        quickAnswer: [
            /what\s*is/i,
            /define/i,
            /explain\s*briefly/i,
            /quick\s*question/i,
            /FAQ/i
        ],
        complexReasoning: [
            /analyze\s*and\s*compare/i,
            /develop\s*a\s*strategy/i,
            /create\s*a\s*plan/i,
            /evaluate\s*options/i,
            /recommend/i
        ]
    },

    // =========================================================================
    // ASKSAGE MODEL CATALOG (FedRAMP High Compliant)
    // =========================================================================
    askSageModels: {
        // Best for large documents (1M+ context)
        'gemini-2.5-pro': {
            name: 'Google Gemini 2.5 Pro',
            contextWindow: 1000000,
            fedrampHigh: true,
            bestFor: ['largeDocument', 'complexReasoning'],
            costTier: 'medium',
            promptConversion: 5.6,
            completionConversion: 0.933
        },
        'gemini-2.5-flash': {
            name: 'Google Gemini 2.5 Flash',
            contextWindow: 1000000,
            fedrampHigh: true,
            bestFor: ['largeDocument', 'quickAnswer'],
            costTier: 'low',
            promptConversion: 46.2,
            completionConversion: 5.6
        },
        // Best for code and complex tasks
        'aws-gov-claude-4.5-sonnet': {
            name: 'AWS Gov Bedrock Claude 4.5 Sonnet',
            contextWindow: 200000,
            fedrampHigh: true,
            airGapCapable: true,
            bestFor: ['codeGeneration', 'complexReasoning'],
            costTier: 'medium',
            promptConversion: 3.535,
            completionConversion: 0.707
        },
        'google-claude-4.5-sonnet': {
            name: 'Google Anthropic Claude 4.5 Sonnet',
            contextWindow: 200000,
            fedrampHigh: true,
            bestFor: ['codeGeneration', 'complexReasoning'],
            costTier: 'medium',
            promptConversion: 4.242,
            completionConversion: 0.848
        },
        // Best for general use
        'azure-gpt-5': {
            name: 'Azure OpenAI GPT-5',
            contextWindow: 272000,
            fedrampHigh: true,
            bestFor: ['complexReasoning', 'quickAnswer'],
            costTier: 'high',
            promptConversion: 11.2,
            completionConversion: 1.4
        },
        'azure-gpt-4.1': {
            name: 'Azure OpenAI GPT-4.1',
            contextWindow: 1000000,
            fedrampHigh: true,
            bestFor: ['largeDocument', 'codeGeneration'],
            costTier: 'medium',
            promptConversion: 7,
            completionConversion: 1.75
        },
        // Budget options
        'azure-gpt-5-nano': {
            name: 'Azure OpenAI GPT-5-nano',
            contextWindow: 272000,
            fedrampHigh: true,
            bestFor: ['quickAnswer'],
            costTier: 'veryLow',
            promptConversion: 280,
            completionConversion: 35
        },
        'nova-lite': {
            name: 'AWS Gov Bedrock Nova Lite',
            contextWindow: 300000,
            fedrampHigh: true,
            bestFor: ['quickAnswer', 'largeDocument'],
            costTier: 'veryLow',
            promptConversion: 194.6,
            completionConversion: 48.3
        },
        // Image generation
        'google-imagen-4': {
            name: 'Google Imagen 4',
            contextWindow: 480,
            fedrampHigh: true,
            bestFor: ['imageGeneration'],
            costTier: 'medium',
            completionConversion: 2600
        },
        // Azure Gov (IL5 capable)
        'azure-gov-gpt-4o': {
            name: 'Azure Gov OpenAI GPT-4o',
            contextWindow: 128000,
            fedrampHigh: true,
            il5Capable: true,
            bestFor: ['quickAnswer', 'codeGeneration'],
            costTier: 'medium',
            promptConversion: 2.1,
            completionConversion: 0.7
        }
    },

    // =========================================================================
    // CORE DETECTION FUNCTIONS
    // =========================================================================
    
    /**
     * Detect if content contains CUI indicators
     * @param {string} content - The text to analyze
     * @returns {object} Detection result with category and confidence
     */
    detectCUI(content) {
        const results = {
            isCUI: false,
            confidence: 0,
            categories: [],
            matchedPatterns: [],
            recommendation: null
        };

        if (!content || typeof content !== 'string') {
            return results;
        }

        const contentLower = content.toLowerCase();
        let totalMatches = 0;
        let categoryScores = {};

        // Check each category
        for (const [category, patterns] of Object.entries(this.cuiPatterns)) {
            categoryScores[category] = 0;
            
            for (const pattern of patterns) {
                if (pattern.test(content)) {
                    totalMatches++;
                    categoryScores[category]++;
                    results.matchedPatterns.push({
                        category,
                        pattern: pattern.toString()
                    });
                }
            }

            if (categoryScores[category] > 0) {
                results.categories.push({
                    name: category,
                    matches: categoryScores[category]
                });
            }
        }

        // Calculate confidence
        if (totalMatches >= 3) {
            results.confidence = 0.95;
            results.isCUI = true;
        } else if (totalMatches === 2) {
            results.confidence = 0.8;
            results.isCUI = true;
        } else if (totalMatches === 1) {
            // Single match - check if it's explicit CUI marker
            const hasExplicit = results.categories.some(c => c.name === 'explicit');
            if (hasExplicit) {
                results.confidence = 0.95;
                results.isCUI = true;
            } else {
                results.confidence = 0.5;
                results.isCUI = true; // Err on side of caution
            }
        }

        // Generate recommendation
        if (results.isCUI) {
            results.recommendation = `CUI DETECTED (${results.confidence * 100}% confidence). ` +
                `Categories: ${results.categories.map(c => c.name).join(', ')}. ` +
                `Routing to AskSage FedRAMP High models.`;
        } else {
            results.recommendation = 'No CUI detected. Using standard Anthropic routing.';
        }

        if (this.config.debug) {
            console.log('[ModelRouter] CUI Detection:', results);
        }

        return results;
    },

    /**
     * Detect the type of task being requested
     * @param {string} content - The prompt text
     * @returns {string} Task type identifier
     */
    detectTaskType(content) {
        for (const [taskType, patterns] of Object.entries(this.taskPatterns)) {
            for (const pattern of patterns) {
                if (pattern.test(content)) {
                    return taskType;
                }
            }
        }
        return 'general';
    },

    /**
     * Estimate token count for content
     * @param {string} content - Text to estimate
     * @returns {number} Estimated token count
     */
    estimateTokens(content) {
        // Rough estimate: 1 token ≈ 4 characters for English
        return Math.ceil(content.length / 4);
    },

    // =========================================================================
    // MODEL SELECTION
    // =========================================================================

    /**
     * Select optimal AskSage model based on task and content
     * @param {string} content - The prompt content
     * @param {string} taskType - Detected task type
     * @param {object} options - Additional options
     * @returns {object} Selected model configuration
     */
    selectAskSageModel(content, taskType, options = {}) {
        const estimatedTokens = this.estimateTokens(content);
        const prioritizeCost = options.prioritizeCost || false;
        const requiresAirGap = options.airGap || false;

        let candidates = [];

        // Filter by requirements
        for (const [modelId, model] of Object.entries(this.askSageModels)) {
            // Must be FedRAMP High
            if (!model.fedrampHigh) continue;

            // Check air-gap requirement
            if (requiresAirGap && !model.airGapCapable) continue;

            // Check context window
            if (estimatedTokens > model.contextWindow * 0.8) continue;

            // Score the model
            let score = 0;

            // Task match bonus
            if (model.bestFor && model.bestFor.includes(taskType)) {
                score += 50;
            }

            // Cost scoring (inverse - lower cost = higher score if prioritizing cost)
            const costScores = { veryLow: 40, low: 30, medium: 20, high: 10 };
            if (prioritizeCost) {
                score += costScores[model.costTier] || 0;
            }

            // Context window efficiency (prefer models where we use reasonable % of window)
            const utilization = estimatedTokens / model.contextWindow;
            if (utilization > 0.1 && utilization < 0.5) {
                score += 20; // Good utilization
            }

            candidates.push({
                modelId,
                model,
                score
            });
        }

        // Sort by score
        candidates.sort((a, b) => b.score - a.score);

        if (candidates.length === 0) {
            // Fallback to default
            return {
                modelId: this.config.defaultCuiModel,
                model: this.askSageModels[this.config.defaultCuiModel],
                fallback: true
            };
        }

        const selected = candidates[0];
        
        if (this.config.debug) {
            console.log('[ModelRouter] Model Selection:', {
                taskType,
                estimatedTokens,
                selected: selected.modelId,
                score: selected.score,
                alternatives: candidates.slice(1, 4).map(c => c.modelId)
            });
        }

        return selected;
    },

    // =========================================================================
    // MAIN ROUTING FUNCTION
    // =========================================================================

    /**
     * Route a prompt to the appropriate AI backend
     * @param {string} prompt - User's prompt
     * @param {object} context - Additional context (current module, user role, etc.)
     * @returns {object} Routing decision with model and endpoint
     */
    async route(prompt, context = {}) {
        const routingDecision = {
            timestamp: new Date().toISOString(),
            promptPreview: prompt.substring(0, 100) + '...',
            cuiDetection: null,
            taskType: null,
            selectedBackend: null,
            selectedModel: null,
            endpoint: null,
            headers: {},
            reasoning: []
        };

        // Step 1: Detect CUI
        routingDecision.cuiDetection = this.detectCUI(prompt);
        
        // Also check context for CUI indicators
        if (context.module) {
            const cuiModules = ['pricing', 'blackhat', 'competitive'];
            if (cuiModules.some(m => context.module.toLowerCase().includes(m))) {
                routingDecision.cuiDetection.isCUI = true;
                routingDecision.cuiDetection.confidence = Math.max(
                    routingDecision.cuiDetection.confidence, 
                    0.9
                );
                routingDecision.reasoning.push(
                    `Module context "${context.module}" indicates CUI data`
                );
            }
        }

        // Step 2: Detect task type
        routingDecision.taskType = this.detectTaskType(prompt);
        routingDecision.reasoning.push(`Detected task type: ${routingDecision.taskType}`);

        // Step 3: Route based on CUI detection
        if (routingDecision.cuiDetection.isCUI) {
            // Route to AskSage
            routingDecision.selectedBackend = 'asksage';
            
            const modelSelection = this.selectAskSageModel(
                prompt,
                routingDecision.taskType,
                {
                    prioritizeCost: context.prioritizeCost || false,
                    airGap: context.requiresAirGap || false
                }
            );
            
            routingDecision.selectedModel = modelSelection.modelId;
            routingDecision.modelDetails = modelSelection.model;
            routingDecision.endpoint = `${this.config.askSageApiUrl}/chat`;
            routingDecision.reasoning.push(
                `CUI detected (${routingDecision.cuiDetection.confidence * 100}% confidence) - ` +
                `routing to AskSage ${modelSelection.model.name}`
            );

            // Add CUI marking to response metadata
            routingDecision.headers['X-CUI-Classification'] = 'CUI // SP-PROPIN';
            routingDecision.headers['X-Data-Sensitivity'] = 'HIGH';

        } else {
            // Route to Anthropic
            routingDecision.selectedBackend = 'anthropic';
            routingDecision.selectedModel = 'claude-sonnet';
            
            // Map to MissionPulse agent endpoints
            const agentEndpoint = context.agent || 'capture';
            routingDecision.endpoint = `${this.config.anthropicApiUrl}/${agentEndpoint}/chat`;
            routingDecision.reasoning.push(
                `No CUI detected - routing to Anthropic Claude via MissionPulse API`
            );
        }

        if (this.config.debug) {
            console.log('[ModelRouter] Routing Decision:', routingDecision);
        }

        return routingDecision;
    },

    // =========================================================================
    // INTEGRATION HELPERS
    // =========================================================================

    /**
     * Build request payload for AskSage API
     * @param {string} prompt - User prompt
     * @param {object} routingDecision - Output from route()
     * @returns {object} Request payload
     */
    buildAskSagePayload(prompt, routingDecision) {
        return {
            model: routingDecision.selectedModel,
            messages: [
                {
                    role: 'system',
                    content: 'You are a federal contracting expert assistant for MissionPulse. ' +
                        'Provide accurate, compliance-focused guidance. ' +
                        'Mark any CUI data appropriately in responses.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            max_tokens: 4096,
            temperature: 0.7,
            // AskSage specific options
            datasets: ['Acquisition.gov', 'Department of Defense'], // FAR/DFARS
            live_search: false // Disable for CUI
        };
    },

    /**
     * Build request payload for Anthropic/MissionPulse API
     * @param {string} prompt - User prompt  
     * @param {object} routingDecision - Output from route()
     * @returns {object} Request payload
     */
    buildAnthropicPayload(prompt, routingDecision) {
        return {
            message: prompt,
            context: {
                task_type: routingDecision.taskType,
                timestamp: routingDecision.timestamp
            }
        };
    },

    /**
     * Execute the routed request
     * @param {string} prompt - User prompt
     * @param {object} context - Additional context
     * @returns {object} AI response
     */
    async execute(prompt, context = {}) {
        const routingDecision = await this.route(prompt, context);
        
        let response;
        
        if (routingDecision.selectedBackend === 'asksage') {
            const payload = this.buildAskSagePayload(prompt, routingDecision);
            
            // Note: Actual AskSage API call would go here
            // This is a placeholder for integration
            response = {
                success: true,
                backend: 'asksage',
                model: routingDecision.selectedModel,
                message: '[AskSage Integration Pending - Configure API Key]',
                cuiClassification: 'CUI // SP-PROPIN',
                routingDecision
            };
            
        } else {
            const payload = this.buildAnthropicPayload(prompt, routingDecision);
            
            try {
                const apiResponse = await fetch(routingDecision.endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...routingDecision.headers
                    },
                    body: JSON.stringify(payload)
                });
                
                const data = await apiResponse.json();
                
                response = {
                    success: true,
                    backend: 'anthropic',
                    model: routingDecision.selectedModel,
                    message: data.response || data.message,
                    routingDecision
                };
                
            } catch (error) {
                response = {
                    success: false,
                    error: error.message,
                    routingDecision
                };
            }
        }
        
        return response;
    }
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ModelRouter;
}

// Also attach to window for browser use
if (typeof window !== 'undefined') {
    window.ModelRouter = ModelRouter;
}
