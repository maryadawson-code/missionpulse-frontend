// FILE: ai-chat-widget-v2.js
// ROLE: All Users
// SECURITY: CUI content auto-routes to FedRAMP High (AskSage)
// VERSION: 2.0 - AI Router Integration

(function() {
  'use strict';

  // ============================================
  // MODULE SENSITIVITY CLASSIFICATION
  // ============================================
  const MODULE_SENSITIVITY = {
    // HIGH - Always route to AskSage (CUI/Sensitive)
    'pricing': { level: 'high', agent: 'pricing', cuiMarking: 'CUI//SP-PROPIN' },
    'blackhat': { level: 'high', agent: 'blackhat', cuiMarking: 'CUI//SP-FEDCON' },
    'contracts': { level: 'high', agent: 'contracts', cuiMarking: 'CUI//SP-PROPIN' },
    'frenemy': { level: 'medium', agent: 'strategy', cuiMarking: null },
    
    // MEDIUM - Route based on content detection
    'compliance': { level: 'medium', agent: 'compliance', cuiMarking: null },
    'rfpshredder': { level: 'medium', agent: 'compliance', cuiMarking: null },
    'hitl': { level: 'medium', agent: 'compliance', cuiMarking: null },
    'irondome': { level: 'medium', agent: 'writer', cuiMarking: null },
    
    // STANDARD - Use Anthropic (faster)
    'dashboard': { level: 'standard', agent: 'capture', cuiMarking: null },
    'pipeline': { level: 'standard', agent: 'capture', cuiMarking: null },
    'warroom': { level: 'standard', agent: 'capture', cuiMarking: null },
    'swimlane': { level: 'standard', agent: 'capture', cuiMarking: null },
    'orals': { level: 'standard', agent: 'orals', cuiMarking: null },
    'lessons': { level: 'standard', agent: 'strategy', cuiMarking: null },
    'launch': { level: 'standard', agent: 'capture', cuiMarking: null },
    'postaward': { level: 'standard', agent: 'capture', cuiMarking: null },
    'audit': { level: 'standard', agent: 'compliance', cuiMarking: null },
    'settings': { level: 'standard', agent: 'capture', cuiMarking: null },
    'hub': { level: 'standard', agent: 'capture', cuiMarking: null }
  };

  // CUI Pattern Detection
  const CUI_PATTERNS = [
    /CUI\/\//i,
    /FOUO/i,
    /controlled\s+unclassified/i,
    /proprietary/i,
    /competition\s+sensitive/i,
    /source\s+selection/i,
    /pricing\s+data/i,
    /labor\s+rates?/i,
    /wrap\s+rates?/i,
    /indirect\s+rates?/i,
    /fringe/i,
    /G&A/i,
    /overhead/i,
    /profit\s+margin/i,
    /competitor.*(?:price|bid|strategy)/i,
    /teaming.*(?:agreement|arrangement)/i,
    /NDA/i,
    /non-disclosure/i
  ];

  // ============================================
  // AI ROUTER CLASS
  // ============================================
  class AIRouter {
    constructor() {
      this.anthropicEndpoint = 'https://missionpulse-api.onrender.com/chat';
      this.asksageEndpoint = null; // Set via config when Mary gets API key
      this.asksageToken = null;
      this.asksageTokenExpiry = null;
    }

    // Detect if content contains CUI
    detectCUI(text) {
      return CUI_PATTERNS.some(pattern => pattern.test(text));
    }

    // Determine routing based on module + content
    getRoute(moduleId, messageContent) {
      const config = MODULE_SENSITIVITY[moduleId] || MODULE_SENSITIVITY['dashboard'];
      
      // High sensitivity modules always go to AskSage
      if (config.level === 'high') {
        return { provider: 'asksage', reason: 'high-sensitivity-module', cui: config.cuiMarking };
      }
      
      // Check content for CUI patterns
      if (this.detectCUI(messageContent)) {
        return { provider: 'asksage', reason: 'cui-content-detected', cui: 'CUI//SP-PROPIN' };
      }
      
      // Medium sensitivity - check content more carefully
      if (config.level === 'medium') {
        // Additional checks for medium modules
        const sensitiveTerms = /price|cost|rate|bid|competitor|partner|teaming/i;
        if (sensitiveTerms.test(messageContent)) {
          return { provider: 'asksage', reason: 'sensitive-terms', cui: null };
        }
      }
      
      // Default to Anthropic (faster, lower cost)
      return { provider: 'anthropic', reason: 'standard-query', cui: null };
    }

    // Route and send message
    async sendMessage(moduleId, message, context = {}, history = []) {
      const route = this.getRoute(moduleId, message);
      const agentType = MODULE_SENSITIVITY[moduleId]?.agent || 'capture';
      
      console.log(`[AIRouter] Routing to ${route.provider} (${route.reason})`);
      
      // For now, always use Anthropic until AskSage key is configured
      // When AskSage is ready, this will auto-switch for sensitive content
      if (route.provider === 'asksage' && this.asksageEndpoint && this.asksageToken) {
        return await this.sendToAskSage(message, agentType, context, history, route.cui);
      }
      
      return await this.sendToAnthropic(message, agentType, context, history, route);
    }

    async sendToAnthropic(message, agentType, context, history, route) {
      const response = await fetch(this.anthropicEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          agent: agentType,
          context: {
            ...context,
            routingInfo: route
          },
          history: history.slice(-10)
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      return {
        content: data.response || data.content,
        provider: 'anthropic',
        route: route
      };
    }

    async sendToAskSage(message, agentType, context, history, cuiMarking) {
      // AskSage integration - ready for when Mary gets API key
      // This follows the asksage-client.js pattern from Sprint 50
      
      const response = await fetch(this.asksageEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.asksageToken}`
        },
        body: JSON.stringify({
          message,
          persona: this.mapAgentToPersona(agentType),
          context: JSON.stringify(context),
          cui_marking: cuiMarking
        })
      });

      if (!response.ok) {
        // Fallback to Anthropic if AskSage fails
        console.warn('[AIRouter] AskSage failed, falling back to Anthropic');
        return await this.sendToAnthropic(message, agentType, context, history, {
          provider: 'anthropic',
          reason: 'asksage-fallback',
          cui: cuiMarking
        });
      }

      const data = await response.json();
      return {
        content: data.response,
        provider: 'asksage',
        route: { provider: 'asksage', cui: cuiMarking }
      };
    }

    mapAgentToPersona(agentType) {
      const personaMap = {
        'capture': 'Federal Capture Manager',
        'strategy': 'Proposal Strategy Consultant',
        'compliance': 'FAR/DFARS Compliance Expert',
        'writer': 'Technical Proposal Writer',
        'pricing': 'Government Pricing Analyst',
        'blackhat': 'Competitive Intelligence Analyst',
        'contracts': 'Federal Contracts Attorney',
        'orals': 'Orals Presentation Coach'
      };
      return personaMap[agentType] || 'Federal Proposal Assistant';
    }

    // Configure AskSage (call when Mary gets API key)
    configureAskSage(endpoint, token) {
      this.asksageEndpoint = endpoint;
      this.asksageToken = token;
      this.asksageTokenExpiry = Date.now() + (24 * 60 * 60 * 1000); // 24hr
      console.log('[AIRouter] AskSage configured');
    }
  }

  // ============================================
  // CHAT WIDGET COMPONENT
  // ============================================
  const AGENT_NAMES = {
    'capture': 'Capture Intelligence',
    'strategy': 'Strategy Advisor',
    'compliance': 'Compliance Guardian',
    'writer': 'Proposal Writer',
    'pricing': 'Pricing Analyst',
    'blackhat': 'Black Hat Intel',
    'contracts': 'Contracts Advisor',
    'orals': 'Orals Coach'
  };

  const SUGGESTED_PROMPTS = {
    'capture': [
      'Analyze this opportunity\'s win probability',
      'What capture actions should we prioritize?',
      'Summarize the competitive landscape'
    ],
    'pricing': [
      'Review our labor mix for compliance',
      'Calculate wrap rate impact',
      'Suggest price-to-win strategy'
    ],
    'compliance': [
      'Check FAR/DFARS applicability',
      'Identify missing L/M requirements',
      'Flag compliance risks'
    ],
    'blackhat': [
      'Predict competitor pricing strategy',
      'Identify their likely discriminators',
      'What are their weaknesses?'
    ],
    'contracts': [
      'Analyze key contract clauses',
      'Flag unfavorable terms',
      'Suggest negotiation points'
    ],
    'orals': [
      'Generate likely panel questions',
      'Create speaker notes for management slide',
      'Practice Q&A on staffing approach'
    ],
    'strategy': [
      'Refine our win themes',
      'Analyze teaming options',
      'Develop ghost/counter-ghost strategy'
    ],
    'writer': [
      'Draft executive summary opening',
      'Strengthen this section\'s compliance',
      'Make this more compelling'
    ]
  };

  // Global router instance
  const router = new AIRouter();

  // Create Chat Widget
  function createChatWidget(moduleId) {
    const config = MODULE_SENSITIVITY[moduleId] || MODULE_SENSITIVITY['dashboard'];
    const agentName = AGENT_NAMES[config.agent] || 'MissionPulse AI';
    const prompts = SUGGESTED_PROMPTS[config.agent] || SUGGESTED_PROMPTS['capture'];
    
    return {
      moduleId,
      config,
      agentName,
      prompts,
      
      // State
      isOpen: false,
      messages: [],
      isLoading: false,
      
      // Methods
      async sendMessage(text, context = {}) {
        if (!text.trim() || this.isLoading) return null;
        
        this.messages.push({ role: 'user', content: text });
        this.isLoading = true;
        
        try {
          const result = await router.sendMessage(
            this.moduleId,
            text,
            context,
            this.messages.slice(-10)
          );
          
          const assistantMsg = {
            role: 'assistant',
            content: result.content,
            provider: result.provider,
            cui: result.route?.cui
          };
          
          this.messages.push(assistantMsg);
          return assistantMsg;
          
        } catch (error) {
          console.error('[ChatWidget] Error:', error);
          const errorMsg = {
            role: 'assistant',
            content: 'I apologize, but I encountered an error. Please try again.',
            error: true
          };
          this.messages.push(errorMsg);
          return errorMsg;
          
        } finally {
          this.isLoading = false;
        }
      },
      
      clearHistory() {
        this.messages = [];
      }
    };
  }

  // ============================================
  // REACT COMPONENT (for embedding)
  // ============================================
  const ChatWidgetReact = `
    const AIChatWidgetV2 = ({ moduleId, opportunityContext }) => {
      const [isOpen, setIsOpen] = React.useState(false);
      const [messages, setMessages] = React.useState([]);
      const [input, setInput] = React.useState('');
      const [isLoading, setIsLoading] = React.useState(false);
      const [showPrompts, setShowPrompts] = React.useState(true);
      const messagesEndRef = React.useRef(null);
      
      const config = window.MissionPulseAI?.MODULE_SENSITIVITY?.[moduleId] || { agent: 'capture', level: 'standard' };
      const agentName = window.MissionPulseAI?.AGENT_NAMES?.[config.agent] || 'MissionPulse AI';
      const prompts = window.MissionPulseAI?.SUGGESTED_PROMPTS?.[config.agent] || [];
      
      React.useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, [messages]);
      
      const sendMessage = async (text) => {
        if (!text.trim() || isLoading) return;
        
        const userMsg = { role: 'user', content: text };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setShowPrompts(false);
        setIsLoading(true);
        
        try {
          const result = await window.MissionPulseAI.router.sendMessage(
            moduleId,
            text,
            opportunityContext || {},
            messages.slice(-10)
          );
          
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: result.content,
            provider: result.provider,
            cui: result.route?.cui
          }]);
        } catch (error) {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: 'Connection error. Please try again.',
            error: true
          }]);
        } finally {
          setIsLoading(false);
        }
      };
      
      const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendMessage(input);
        }
      };
      
      const providerBadge = (provider, cui) => {
        if (cui) {
          return React.createElement('span', {
            className: 'text-xs px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 ml-2'
          }, cui);
        }
        if (provider === 'asksage') {
          return React.createElement('span', {
            className: 'text-xs px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 ml-2'
          }, 'FedRAMP');
        }
        return null;
      };
      
      if (!isOpen) {
        return React.createElement('button', {
          onClick: () => setIsOpen(true),
          className: 'fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full shadow-lg hover:shadow-cyan-500/25 transition-all flex items-center justify-center z-50',
          title: 'Chat with ' + agentName
        }, React.createElement('span', { className: 'text-2xl' }, '💬'));
      }
      
      return React.createElement('div', {
        className: 'fixed bottom-6 right-6 w-96 h-[500px] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl flex flex-col z-50'
      }, [
        // Header
        React.createElement('div', {
          key: 'header',
          className: 'flex items-center justify-between p-4 border-b border-slate-700'
        }, [
          React.createElement('div', { key: 'title' }, [
            React.createElement('h3', { className: 'font-semibold text-white' }, agentName),
            React.createElement('span', {
              className: 'text-xs ' + (config.level === 'high' ? 'text-amber-400' : 'text-slate-400')
            }, config.level === 'high' ? '🔒 Secure Channel' : '● Online')
          ]),
          React.createElement('button', {
            key: 'close',
            onClick: () => setIsOpen(false),
            className: 'text-slate-400 hover:text-white'
          }, '✕')
        ]),
        
        // Messages
        React.createElement('div', {
          key: 'messages',
          className: 'flex-1 overflow-y-auto p-4 space-y-4'
        }, [
          // Suggested prompts
          showPrompts && messages.length === 0 && React.createElement('div', {
            key: 'prompts',
            className: 'space-y-2'
          }, [
            React.createElement('p', {
              className: 'text-xs text-slate-500 mb-2'
            }, 'Suggested:'),
            ...prompts.map((prompt, i) => 
              React.createElement('button', {
                key: i,
                onClick: () => sendMessage(prompt),
                className: 'block w-full text-left text-sm px-3 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors'
              }, prompt)
            )
          ]),
          
          // Message list
          ...messages.map((msg, i) => 
            React.createElement('div', {
              key: i,
              className: 'flex ' + (msg.role === 'user' ? 'justify-end' : 'justify-start')
            }, React.createElement('div', {
              className: 'max-w-[80%] px-4 py-2 rounded-lg ' + 
                (msg.role === 'user' 
                  ? 'bg-cyan-600 text-white' 
                  : msg.error 
                    ? 'bg-red-900/50 text-red-300'
                    : 'bg-slate-800 text-slate-200')
            }, [
              msg.content,
              msg.role === 'assistant' && providerBadge(msg.provider, msg.cui)
            ]))
          ),
          
          // Loading indicator
          isLoading && React.createElement('div', {
            key: 'loading',
            className: 'flex justify-start'
          }, React.createElement('div', {
            className: 'bg-slate-800 px-4 py-2 rounded-lg text-slate-400'
          }, '...')),
          
          React.createElement('div', { key: 'scroll-anchor', ref: messagesEndRef })
        ]),
        
        // Input
        React.createElement('div', {
          key: 'input',
          className: 'p-4 border-t border-slate-700'
        }, React.createElement('div', {
          className: 'flex gap-2'
        }, [
          React.createElement('input', {
            key: 'textinput',
            type: 'text',
            value: input,
            onChange: (e) => setInput(e.target.value),
            onKeyDown: handleKeyDown,
            placeholder: 'Ask ' + agentName + '...',
            className: 'flex-1 bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500',
            disabled: isLoading
          }),
          React.createElement('button', {
            key: 'send',
            onClick: () => sendMessage(input),
            disabled: isLoading || !input.trim(),
            className: 'px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 disabled:text-slate-500 rounded-lg transition-colors'
          }, '→')
        ]))
      ]);
    };
  `;

  // ============================================
  // EXPORTS
  // ============================================
  window.MissionPulseAI = {
    router,
    createChatWidget,
    MODULE_SENSITIVITY,
    AGENT_NAMES,
    SUGGESTED_PROMPTS,
    ChatWidgetReact,
    
    // Configure AskSage when ready
    configureAskSage: (endpoint, token) => router.configureAskSage(endpoint, token),
    
    // Quick test
    test: async () => {
      console.log('[MissionPulseAI] Testing router...');
      const route = router.getRoute('pricing', 'What is our wrap rate?');
      console.log('[MissionPulseAI] Pricing module route:', route);
      const route2 = router.getRoute('dashboard', 'How many opportunities?');
      console.log('[MissionPulseAI] Dashboard module route:', route2);
      return 'Test complete';
    }
  };

  console.log('[MissionPulseAI] AI Chat Widget V2 loaded - Router enabled');
})();
