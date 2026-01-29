/**
 * MissionPulse AI Chat Widget v2.0
 * Sprint 50: Enter-to-send + Agent-specific suggested prompts
 * AI GENERATED - REQUIRES HUMAN REVIEW
 */

(function() {
  const WIDGET_STYLES = `
    .mp-chat-widget { position: fixed; bottom: 24px; right: 24px; z-index: 9999; font-family: system-ui, -apple-system, sans-serif; }
    .mp-chat-btn { width: 56px; height: 56px; border-radius: 16px; background: linear-gradient(135deg, #00E5FA 0%, #3b82f6 100%); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 20px rgba(0, 229, 250, 0.3); transition: transform 0.2s, box-shadow 0.2s; }
    .mp-chat-btn:hover { transform: scale(1.05); box-shadow: 0 6px 24px rgba(0, 229, 250, 0.4); }
    .mp-chat-btn svg { width: 28px; height: 28px; color: #00050F; }
    .mp-chat-panel { position: fixed; bottom: 90px; right: 24px; width: 380px; height: 520px; background: #0a1628; border: 1px solid rgba(100, 116, 139, 0.3); border-radius: 16px; display: none; flex-direction: column; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4); overflow: hidden; }
    .mp-chat-panel.open { display: flex; }
    .mp-chat-header { padding: 16px; border-bottom: 1px solid rgba(100, 116, 139, 0.2); background: rgba(0, 5, 15, 0.6); }
    .mp-chat-header-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
    .mp-chat-title { color: #fff; font-weight: 600; font-size: 14px; display: flex; align-items: center; gap: 8px; }
    .mp-chat-close { background: none; border: none; color: #64748b; cursor: pointer; padding: 4px; }
    .mp-chat-close:hover { color: #fff; }
    .mp-agent-select { width: 100%; padding: 8px 12px; background: rgba(30, 41, 59, 0.8); border: 1px solid rgba(100, 116, 139, 0.3); border-radius: 8px; color: #fff; font-size: 13px; cursor: pointer; }
    .mp-chat-messages { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px; }
    .mp-message { max-width: 85%; padding: 10px 14px; border-radius: 12px; font-size: 13px; line-height: 1.5; }
    .mp-message.user { background: linear-gradient(135deg, #00E5FA 0%, #3b82f6 100%); color: #00050F; align-self: flex-end; border-bottom-right-radius: 4px; }
    .mp-message.assistant { background: rgba(30, 41, 59, 0.8); color: #e2e8f0; align-self: flex-start; border-bottom-left-radius: 4px; }
    .mp-message.assistant .mp-disclaimer { font-size: 10px; color: #64748b; margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(100, 116, 139, 0.2); }
    .mp-typing { display: flex; gap: 4px; padding: 12px 14px; background: rgba(30, 41, 59, 0.8); border-radius: 12px; align-self: flex-start; }
    .mp-typing span { width: 8px; height: 8px; background: #00E5FA; border-radius: 50%; animation: mp-bounce 1.4s infinite; }
    .mp-typing span:nth-child(2) { animation-delay: 0.2s; }
    .mp-typing span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes mp-bounce { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-6px); } }
    .mp-suggestions { padding: 8px 16px 0; display: flex; flex-direction: column; gap: 6px; }
    .mp-suggestions.hidden { display: none; }
    .mp-suggestion-label { font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
    .mp-suggestion-btns { display: flex; flex-wrap: wrap; gap: 6px; }
    .mp-suggestion-btn { padding: 6px 10px; background: rgba(30, 41, 59, 0.6); border: 1px solid rgba(100, 116, 139, 0.3); border-radius: 6px; color: #94a3b8; font-size: 11px; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
    .mp-suggestion-btn:hover { background: rgba(0, 229, 250, 0.1); border-color: #00E5FA; color: #00E5FA; }
    .mp-chat-input { padding: 12px 16px; border-top: 1px solid rgba(100, 116, 139, 0.2); background: rgba(0, 5, 15, 0.6); }
    .mp-input-row { display: flex; gap: 8px; align-items: flex-end; }
    .mp-input-wrapper { flex: 1; position: relative; }
    .mp-textarea { width: 100%; padding: 10px 12px; background: rgba(30, 41, 59, 0.8); border: 1px solid rgba(100, 116, 139, 0.3); border-radius: 8px; color: #fff; font-size: 13px; resize: none; min-height: 40px; max-height: 100px; line-height: 1.4; }
    .mp-textarea:focus { outline: none; border-color: #00E5FA; }
    .mp-textarea::placeholder { color: #64748b; }
    .mp-send-btn { width: 40px; height: 40px; border-radius: 8px; background: linear-gradient(135deg, #00E5FA 0%, #3b82f6 100%); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: opacity 0.2s; }
    .mp-send-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .mp-send-btn svg { width: 18px; height: 18px; color: #00050F; }
    .mp-hint { font-size: 10px; color: #64748b; margin-top: 6px; text-align: center; }
    .mp-error { padding: 8px 12px; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 8px; color: #f87171; font-size: 12px; margin: 8px 16px; }
  `;

  const AGENTS = [
    { id: 'capture', name: 'Capture Agent', icon: '🎯', color: '#00E5FA' },
    { id: 'strategy', name: 'Strategy Agent', icon: '♟️', color: '#8b5cf6' },
    { id: 'blackhat', name: 'Black Hat Analyst', icon: '🎭', color: '#ef4444' },
    { id: 'pricing', name: 'Pricing Analyst', icon: '💰', color: '#f59e0b' },
    { id: 'compliance', name: 'Compliance Agent', icon: '📋', color: '#10b981' },
    { id: 'writer', name: 'Proposal Writer', icon: '✍️', color: '#3b82f6' },
    { id: 'contracts', name: 'Contracts Advisor', icon: '⚖️', color: '#a78bfa' },
    { id: 'orals', name: 'Orals Coach', icon: '🎤', color: '#ec4899' }
  ];

  const AGENT_PROMPTS = {
    capture: [
      "Analyze this opportunity's win probability",
      "What intel do we need to capture?",
      "Identify key decision makers",
      "Draft a capture plan outline"
    ],
    strategy: [
      "Generate win themes for this bid",
      "What are our key discriminators?",
      "Identify ghost competitors",
      "Recommend teaming partners"
    ],
    blackhat: [
      "Who are the likely competitors?",
      "What's the incumbent's weakness?",
      "Predict competitor pricing strategy",
      "Draft counter-positioning language"
    ],
    pricing: [
      "Build a BOE for this task",
      "Calculate blended labor rate",
      "Analyze price-to-win scenario",
      "Check GSA rate compliance"
    ],
    compliance: [
      "Shred this RFP for requirements",
      "Check Section L/M alignment",
      "Verify FAR/DFARS compliance",
      "Generate compliance matrix"
    ],
    writer: [
      "Draft executive summary",
      "Write technical approach intro",
      "Improve this section's clarity",
      "Add proof points to this claim"
    ],
    contracts: [
      "Analyze contract vehicle risks",
      "Review T&Cs for red flags",
      "Check IDIQ ceiling capacity",
      "Summarize key contract terms"
    ],
    orals: [
      "Generate Q&A prep questions",
      "Coach me on this answer",
      "Create presentation outline",
      "Draft opening statement"
    ]
  };

  const API_URL = 'https://missionpulse-api.onrender.com/api/chat';

  class ChatWidget {
    constructor() {
      this.isOpen = false;
      this.messages = [];
      this.currentAgent = 'capture';
      this.isLoading = false;
      this.hasUserTyped = false;
      this.init();
    }

    init() {
      this.injectStyles();
      this.render();
      this.bindEvents();
    }

    injectStyles() {
      const style = document.createElement('style');
      style.textContent = WIDGET_STYLES;
      document.head.appendChild(style);
    }

    render() {
      const widget = document.createElement('div');
      widget.className = 'mp-chat-widget';
      widget.innerHTML = `
        <button class="mp-chat-btn" id="mpChatToggle">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
          </svg>
        </button>
        <div class="mp-chat-panel" id="mpChatPanel">
          <div class="mp-chat-header">
            <div class="mp-chat-header-top">
              <span class="mp-chat-title">
                <span id="mpAgentIcon">🎯</span>
                MissionPulse AI
              </span>
              <button class="mp-chat-close" id="mpChatClose">
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <select class="mp-agent-select" id="mpAgentSelect">
              ${AGENTS.map(a => `<option value="${a.id}">${a.icon} ${a.name}</option>`).join('')}
            </select>
          </div>
          <div class="mp-chat-messages" id="mpMessages"></div>
          <div class="mp-suggestions" id="mpSuggestions">
            <span class="mp-suggestion-label">Suggested prompts</span>
            <div class="mp-suggestion-btns" id="mpSuggestionBtns"></div>
          </div>
          <div class="mp-chat-input">
            <div class="mp-input-row">
              <div class="mp-input-wrapper">
                <textarea class="mp-textarea" id="mpInput" placeholder="Ask the AI agent..." rows="1"></textarea>
              </div>
              <button class="mp-send-btn" id="mpSend">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                </svg>
              </button>
            </div>
            <div class="mp-hint">Press Enter to send • Shift+Enter for new line</div>
          </div>
        </div>
      `;
      document.body.appendChild(widget);

      this.elements = {
        toggle: document.getElementById('mpChatToggle'),
        panel: document.getElementById('mpChatPanel'),
        close: document.getElementById('mpChatClose'),
        messages: document.getElementById('mpMessages'),
        input: document.getElementById('mpInput'),
        send: document.getElementById('mpSend'),
        agentSelect: document.getElementById('mpAgentSelect'),
        agentIcon: document.getElementById('mpAgentIcon'),
        suggestions: document.getElementById('mpSuggestions'),
        suggestionBtns: document.getElementById('mpSuggestionBtns')
      };

      this.updateSuggestions();
    }

    bindEvents() {
      this.elements.toggle.addEventListener('click', () => this.toggle());
      this.elements.close.addEventListener('click', () => this.close());
      this.elements.send.addEventListener('click', () => this.sendMessage());
      
      // Enter to send, Shift+Enter for new line
      this.elements.input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });

      // Auto-resize textarea
      this.elements.input.addEventListener('input', () => {
        this.elements.input.style.height = 'auto';
        this.elements.input.style.height = Math.min(this.elements.input.scrollHeight, 100) + 'px';
        
        // Hide suggestions when user types
        if (this.elements.input.value.trim()) {
          this.hasUserTyped = true;
          this.elements.suggestions.classList.add('hidden');
        } else {
          this.hasUserTyped = false;
          if (this.messages.length === 0) {
            this.elements.suggestions.classList.remove('hidden');
          }
        }
      });

      // Agent change
      this.elements.agentSelect.addEventListener('change', (e) => {
        this.currentAgent = e.target.value;
        const agent = AGENTS.find(a => a.id === this.currentAgent);
        this.elements.agentIcon.textContent = agent.icon;
        this.updateSuggestions();
      });
    }

    updateSuggestions() {
      const prompts = AGENT_PROMPTS[this.currentAgent] || [];
      this.elements.suggestionBtns.innerHTML = prompts.map(p => 
        `<button class="mp-suggestion-btn">${p}</button>`
      ).join('');

      // Bind suggestion clicks
      this.elements.suggestionBtns.querySelectorAll('.mp-suggestion-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          this.elements.input.value = btn.textContent;
          this.elements.input.focus();
          this.elements.suggestions.classList.add('hidden');
        });
      });

      // Show suggestions only if no messages and user hasn't typed
      if (this.messages.length === 0 && !this.hasUserTyped) {
        this.elements.suggestions.classList.remove('hidden');
      } else {
        this.elements.suggestions.classList.add('hidden');
      }
    }

    toggle() {
      this.isOpen ? this.close() : this.open();
    }

    open() {
      this.isOpen = true;
      this.elements.panel.classList.add('open');
      this.elements.input.focus();
    }

    close() {
      this.isOpen = false;
      this.elements.panel.classList.remove('open');
    }

    async sendMessage() {
      const text = this.elements.input.value.trim();
      if (!text || this.isLoading) return;

      this.elements.input.value = '';
      this.elements.input.style.height = 'auto';
      this.hasUserTyped = false;
      this.elements.suggestions.classList.add('hidden');

      this.addMessage('user', text);
      this.showTyping();
      this.isLoading = true;
      this.elements.send.disabled = true;

      try {
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text,
            agent: this.currentAgent,
            context: this.getContext()
          })
        });

        if (!response.ok) throw new Error('API request failed');

        const data = await response.json();
        this.hideTyping();
        this.addMessage('assistant', data.response || data.message || 'No response received.');

      } catch (error) {
        console.error('Chat error:', error);
        this.hideTyping();
        this.addMessage('assistant', 'Sorry, I encountered an error. Please try again or check your connection.');
      }

      this.isLoading = false;
      this.elements.send.disabled = false;
      this.elements.input.focus();
    }

    getContext() {
      // Gather page context for the AI
      const url = window.location.pathname;
      const pageTitle = document.title;
      
      // Try to get opportunity context if available
      let opportunityContext = null;
      if (window.currentOpportunity) {
        opportunityContext = window.currentOpportunity;
      }

      return {
        page: url,
        title: pageTitle,
        opportunity: opportunityContext,
        previousMessages: this.messages.slice(-6) // Last 6 messages for context
      };
    }

    addMessage(role, content) {
      this.messages.push({ role, content });
      
      const msg = document.createElement('div');
      msg.className = `mp-message ${role}`;
      
      if (role === 'assistant') {
        msg.innerHTML = `
          ${this.formatMessage(content)}
          <div class="mp-disclaimer">AI GENERATED - REQUIRES HUMAN REVIEW</div>
        `;
      } else {
        msg.textContent = content;
      }

      this.elements.messages.appendChild(msg);
      this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
    }

    formatMessage(content) {
      // Basic markdown-like formatting
      return content
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code style="background:rgba(0,229,250,0.1);padding:2px 4px;border-radius:3px;">$1</code>')
        .replace(/\n/g, '<br>');
    }

    showTyping() {
      const typing = document.createElement('div');
      typing.className = 'mp-typing';
      typing.id = 'mpTyping';
      typing.innerHTML = '<span></span><span></span><span></span>';
      this.elements.messages.appendChild(typing);
      this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
    }

    hideTyping() {
      const typing = document.getElementById('mpTyping');
      if (typing) typing.remove();
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new ChatWidget());
  } else {
    new ChatWidget();
  }
})();
