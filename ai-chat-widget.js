/**
 * MissionPulse AI Chat Widget v1.3.0
 * Floating chat component with 9 AI agents including AskSage FedRAMP
 * 
 * Usage:
 *   <script src="ai-chat-widget.js"></script>
 *   <script>
 *     AIChatWidget.init({ defaultAgent: 'capture' });
 *   </script>
 */

(function() {
  'use strict';

  const API_BASE = 'https://missionpulse-api.onrender.com';

  const AGENTS = [
    { id: 'capture', name: 'Capture', icon: '🎯', color: '#06b6d4' },
    { id: 'strategy', name: 'Strategy', icon: '♟️', color: '#8b5cf6' },
    { id: 'blackhat', name: 'Black Hat', icon: '🎭', color: '#ef4444', restricted: true },
    { id: 'pricing', name: 'Pricing', icon: '💰', color: '#10b981' },
    { id: 'compliance', name: 'Compliance', icon: '📋', color: '#f59e0b' },
    { id: 'writer', name: 'Writer', icon: '✍️', color: '#ec4899' },
    { id: 'contracts', name: 'Contracts', icon: '📑', color: '#3b82f6' },
    { id: 'orals', name: 'Orals', icon: '🎤', color: '#7c3aed' },
    { id: 'asksage', name: 'AskSage', icon: '🛡️', color: '#059669', fedramp: true }
  ];

  function getUserRole() {
    try {
      const user = JSON.parse(localStorage.getItem('mp_user') || '{}');
      return user.role || 'pm';
    } catch { return 'pm'; }
  }

  function canAccessAgent(agent) {
    if (!agent.restricted) return true;
    const role = getUserRole();
    return ['ceo', 'coo', 'cap'].includes(role);
  }

  function createWidget(options = {}) {
    const defaultAgent = AGENTS.find(a => a.id === (options.defaultAgent || 'capture')) || AGENTS[0];
    
    // Create styles
    const styles = document.createElement('style');
    styles.textContent = `
      .mp-chat-widget {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 9999;
        font-family: 'Inter', -apple-system, sans-serif;
      }
      .mp-chat-btn {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: linear-gradient(135deg, #00E5FA 0%, #0891b2 100%);
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 20px rgba(0, 229, 250, 0.4);
        transition: transform 0.2s, box-shadow 0.2s;
        font-size: 24px;
      }
      .mp-chat-btn:hover {
        transform: scale(1.05);
        box-shadow: 0 6px 25px rgba(0, 229, 250, 0.5);
      }
      .mp-chat-panel {
        position: absolute;
        bottom: 70px;
        right: 0;
        width: 360px;
        height: 500px;
        background: rgba(15, 23, 42, 0.95);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(0, 229, 250, 0.2);
        border-radius: 16px;
        display: none;
        flex-direction: column;
        overflow: hidden;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
      }
      .mp-chat-panel.open { display: flex; }
      .mp-chat-header {
        padding: 16px;
        border-bottom: 1px solid rgba(100, 116, 139, 0.3);
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .mp-chat-agent-icon {
        width: 40px;
        height: 40px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
      }
      .mp-chat-agent-name { color: #fff; font-weight: 600; font-size: 14px; }
      .mp-chat-agent-badge { 
        font-size: 10px; 
        padding: 2px 6px; 
        border-radius: 4px; 
        background: rgba(5, 150, 105, 0.2);
        color: #10b981;
        margin-left: 8px;
      }
      .mp-chat-close {
        margin-left: auto;
        background: none;
        border: none;
        color: #94a3b8;
        cursor: pointer;
        padding: 4px;
        font-size: 18px;
      }
      .mp-chat-agents {
        padding: 8px;
        border-bottom: 1px solid rgba(100, 116, 139, 0.3);
        display: flex;
        gap: 4px;
        overflow-x: auto;
      }
      .mp-chat-agent-btn {
        padding: 6px 10px;
        border-radius: 8px;
        border: none;
        background: rgba(51, 65, 85, 0.5);
        color: #94a3b8;
        cursor: pointer;
        font-size: 16px;
        transition: all 0.2s;
        flex-shrink: 0;
      }
      .mp-chat-agent-btn:hover { background: rgba(51, 65, 85, 0.8); }
      .mp-chat-agent-btn.active { background: rgba(0, 229, 250, 0.2); color: #00E5FA; }
      .mp-chat-agent-btn.restricted { opacity: 0.5; cursor: not-allowed; }
      .mp-chat-agent-btn.fedramp { border: 1px solid rgba(16, 185, 129, 0.5); }
      .mp-chat-messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .mp-chat-msg {
        max-width: 85%;
        padding: 10px 14px;
        border-radius: 12px;
        font-size: 13px;
        line-height: 1.5;
      }
      .mp-chat-msg.user {
        align-self: flex-end;
        background: #00E5FA;
        color: #000;
        border-bottom-right-radius: 4px;
      }
      .mp-chat-msg.assistant {
        align-self: flex-start;
        background: rgba(51, 65, 85, 0.6);
        color: #e2e8f0;
        border-bottom-left-radius: 4px;
      }
      .mp-chat-input-wrap {
        padding: 12px;
        border-top: 1px solid rgba(100, 116, 139, 0.3);
        display: flex;
        gap: 8px;
      }
      .mp-chat-input {
        flex: 1;
        padding: 10px 14px;
        border-radius: 10px;
        border: 1px solid rgba(100, 116, 139, 0.3);
        background: rgba(30, 41, 59, 0.8);
        color: #fff;
        font-size: 13px;
        outline: none;
      }
      .mp-chat-input:focus { border-color: #00E5FA; }
      .mp-chat-send {
        padding: 10px 16px;
        border-radius: 10px;
        border: none;
        background: linear-gradient(135deg, #00E5FA 0%, #0891b2 100%);
        color: #000;
        font-weight: 600;
        cursor: pointer;
        font-size: 13px;
      }
      .mp-chat-send:disabled { opacity: 0.5; cursor: not-allowed; }
      .mp-chat-footer {
        padding: 8px;
        text-align: center;
        font-size: 10px;
        color: #64748b;
      }
      .mp-typing {
        display: flex;
        gap: 4px;
        padding: 10px 14px;
      }
      .mp-typing span {
        width: 6px;
        height: 6px;
        background: #00E5FA;
        border-radius: 50%;
        animation: mp-bounce 1s infinite;
      }
      .mp-typing span:nth-child(2) { animation-delay: 0.15s; }
      .mp-typing span:nth-child(3) { animation-delay: 0.3s; }
      @keyframes mp-bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-4px); }
      }
    `;
    document.head.appendChild(styles);

    // Create widget HTML
    const widget = document.createElement('div');
    widget.className = 'mp-chat-widget';
    widget.innerHTML = `
      <button class="mp-chat-btn" id="mpChatToggle">🤖</button>
      <div class="mp-chat-panel" id="mpChatPanel">
        <div class="mp-chat-header">
          <div class="mp-chat-agent-icon" id="mpAgentIcon" style="background: ${defaultAgent.color}20">
            ${defaultAgent.icon}
          </div>
          <div>
            <span class="mp-chat-agent-name" id="mpAgentName">${defaultAgent.name}</span>
            <span class="mp-chat-agent-badge" id="mpAgentBadge" style="display: ${defaultAgent.fedramp ? 'inline' : 'none'}">FedRAMP</span>
          </div>
          <button class="mp-chat-close" id="mpChatClose">✕</button>
        </div>
        <div class="mp-chat-agents" id="mpAgentList"></div>
        <div class="mp-chat-messages" id="mpMessages"></div>
        <div class="mp-chat-input-wrap">
          <input type="text" class="mp-chat-input" id="mpInput" placeholder="Ask ${defaultAgent.name}...">
          <button class="mp-chat-send" id="mpSend">Send</button>
        </div>
        <div class="mp-chat-footer">AI GENERATED - REQUIRES HUMAN REVIEW</div>
      </div>
    `;
    document.body.appendChild(widget);

    // State
    let isOpen = false;
    let currentAgent = defaultAgent;
    let messages = [];
    let isLoading = false;

    // Elements
    const toggle = document.getElementById('mpChatToggle');
    const panel = document.getElementById('mpChatPanel');
    const closeBtn = document.getElementById('mpChatClose');
    const agentList = document.getElementById('mpAgentList');
    const messagesEl = document.getElementById('mpMessages');
    const input = document.getElementById('mpInput');
    const sendBtn = document.getElementById('mpSend');
    const agentIcon = document.getElementById('mpAgentIcon');
    const agentName = document.getElementById('mpAgentName');
    const agentBadge = document.getElementById('mpAgentBadge');

    // Render agent buttons
    function renderAgentButtons() {
      agentList.innerHTML = AGENTS.map(agent => {
        const accessible = canAccessAgent(agent);
        const classes = ['mp-chat-agent-btn'];
        if (agent.id === currentAgent.id) classes.push('active');
        if (!accessible) classes.push('restricted');
        if (agent.fedramp) classes.push('fedramp');
        return `<button class="${classes.join(' ')}" data-agent="${agent.id}" ${!accessible ? 'disabled' : ''}>${agent.icon}</button>`;
      }).join('');
    }

    // Render messages
    function renderMessages() {
      messagesEl.innerHTML = messages.map(m => 
        `<div class="mp-chat-msg ${m.role}">${m.content}</div>`
      ).join('');
      if (isLoading) {
        messagesEl.innerHTML += `<div class="mp-chat-msg assistant mp-typing"><span></span><span></span><span></span></div>`;
      }
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    // Switch agent
    function switchAgent(agentId) {
      const agent = AGENTS.find(a => a.id === agentId);
      if (!agent || !canAccessAgent(agent)) return;
      
      currentAgent = agent;
      agentIcon.style.background = `${agent.color}20`;
      agentIcon.textContent = agent.icon;
      agentName.textContent = agent.name;
      agentBadge.style.display = agent.fedramp ? 'inline' : 'none';
      input.placeholder = `Ask ${agent.name}...`;
      
      messages = [{ role: 'assistant', content: `Hello! I'm ${agent.name}. How can I help you today?` }];
      renderMessages();
      renderAgentButtons();
    }

    // Send message
    async function sendMessage() {
      const text = input.value.trim();
      if (!text || isLoading) return;

      messages.push({ role: 'user', content: text });
      input.value = '';
      isLoading = true;
      renderMessages();

      try {
        const response = await fetch(`${API_BASE}/agents/${currentAgent.id}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text,
            user_role: getUserRole()
          })
        });

        if (!response.ok) throw new Error('API error');
        
        const data = await response.json();
        messages.push({ role: 'assistant', content: data.response || data.message || 'Response received.' });
      } catch (err) {
        console.error('Chat error:', err);
        messages.push({ 
          role: 'assistant', 
          content: `As ${currentAgent.name}, I'll help with that. [Demo Mode - API connecting...]\n\nIn production, I provide real-time intelligence.`
        });
      }

      isLoading = false;
      renderMessages();
    }

    // Event listeners
    toggle.addEventListener('click', () => {
      isOpen = !isOpen;
      panel.classList.toggle('open', isOpen);
      if (isOpen && messages.length === 0) {
        messages = [{ role: 'assistant', content: `Hello! I'm ${currentAgent.name}. How can I help you today?` }];
        renderMessages();
      }
    });

    closeBtn.addEventListener('click', () => {
      isOpen = false;
      panel.classList.remove('open');
    });

    agentList.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-agent]');
      if (btn && !btn.disabled) {
        switchAgent(btn.dataset.agent);
      }
    });

    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendMessage();
    });

    // Initial render
    renderAgentButtons();
  }

  // Export
  window.AIChatWidget = {
    init: createWidget,
    version: '1.3.0'
  };
})();
