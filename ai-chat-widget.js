/**
 * MissionPulse AI Chat Widget
 * Embeddable floating chat for module pages
 * 
 * Usage: Add to any page with:
 *   <script src="render-api-client.js"></script>
 *   <script src="ai-chat-widget.js" data-agent="pricing"></script>
 * 
 * Available agents: capture, strategy, blackhat, pricing, compliance, writer, contracts, orals
 * 
 * © 2026 Mission Meets Tech
 */

(function() {
  'use strict';

  const API_BASE = 'https://missionpulse-api.onrender.com';
  
  // Agent configurations
  const AGENTS = {
    capture: { name: 'Capture Intelligence', icon: '🎯', color: '#f472b6' },
    strategy: { name: 'Strategy Advisor', icon: '♟️', color: '#a78bfa' },
    blackhat: { name: 'Black Hat Intel', icon: '🕵️', color: '#ef4444', restricted: true },
    pricing: { name: 'Pricing Intelligence', icon: '💰', color: '#f59e0b' },
    compliance: { name: 'Compliance Guardian', icon: '🛡️', color: '#22c55e' },
    writer: { name: 'Proposal Writer', icon: '✍️', color: '#06b6d4' },
    contracts: { name: 'Contracts Analyst', icon: '📋', color: '#8b5cf6' },
    orals: { name: 'Orals Coach', icon: '🎤', color: '#ec4899' }
  };

  // Get agent from script tag or default
  const scriptTag = document.currentScript;
  const agentId = scriptTag?.getAttribute('data-agent') || 'capture';
  const agent = AGENTS[agentId] || AGENTS.capture;

  // Inject styles
  const styles = `
    .mp-chat-widget {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 9999;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    }
    
    .mp-chat-toggle {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      box-shadow: 0 4px 20px rgba(0, 229, 250, 0.3);
      transition: transform 0.2s, box-shadow 0.2s;
      background: linear-gradient(135deg, ${agent.color}, ${agent.color}dd);
    }
    
    .mp-chat-toggle:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 30px rgba(0, 229, 250, 0.4);
    }
    
    .mp-chat-toggle.active {
      transform: scale(0.9);
    }
    
    .mp-chat-panel {
      position: absolute;
      bottom: 70px;
      right: 0;
      width: 380px;
      height: 500px;
      background: rgba(15, 23, 42, 0.95);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(0, 229, 250, 0.2);
      border-radius: 16px;
      display: none;
      flex-direction: column;
      overflow: hidden;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
      animation: mp-slide-up 0.3s ease-out;
    }
    
    .mp-chat-panel.open {
      display: flex;
    }
    
    @keyframes mp-slide-up {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .mp-chat-header {
      padding: 16px;
      border-bottom: 1px solid rgba(255,255,255,0.1);
      display: flex;
      align-items: center;
      gap: 12px;
      background: rgba(0, 229, 250, 0.05);
    }
    
    .mp-chat-header-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      background: ${agent.color}25;
    }
    
    .mp-chat-header-info h3 {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
      color: white;
    }
    
    .mp-chat-header-info p {
      margin: 2px 0 0;
      font-size: 11px;
      color: #94a3b8;
    }
    
    .mp-chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .mp-chat-messages::-webkit-scrollbar {
      width: 4px;
    }
    
    .mp-chat-messages::-webkit-scrollbar-thumb {
      background: #334155;
      border-radius: 2px;
    }
    
    .mp-message {
      max-width: 85%;
      padding: 10px 14px;
      border-radius: 12px;
      font-size: 13px;
      line-height: 1.5;
      animation: mp-fade-in 0.3s ease-out;
    }
    
    @keyframes mp-fade-in {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .mp-message.user {
      align-self: flex-end;
      background: rgba(0, 229, 250, 0.2);
      border: 1px solid rgba(0, 229, 250, 0.3);
      color: white;
    }
    
    .mp-message.assistant {
      align-self: flex-start;
      background: rgba(30, 41, 59, 0.8);
      border: 1px solid rgba(255,255,255,0.1);
      color: #e2e8f0;
    }
    
    .mp-message.assistant .mp-confidence {
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px solid rgba(255,255,255,0.1);
      font-size: 11px;
      color: #94a3b8;
    }
    
    .mp-confidence-bar {
      height: 4px;
      background: #334155;
      border-radius: 2px;
      margin-top: 4px;
      overflow: hidden;
    }
    
    .mp-confidence-fill {
      height: 100%;
      border-radius: 2px;
      transition: width 0.5s ease-out;
    }
    
    .mp-typing {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 12px 14px;
      background: rgba(30, 41, 59, 0.8);
      border-radius: 12px;
      align-self: flex-start;
    }
    
    .mp-typing-dot {
      width: 6px;
      height: 6px;
      background: #00E5FA;
      border-radius: 50%;
      animation: mp-typing 1.4s infinite;
    }
    
    .mp-typing-dot:nth-child(2) { animation-delay: 0.2s; }
    .mp-typing-dot:nth-child(3) { animation-delay: 0.4s; }
    
    @keyframes mp-typing {
      0%, 100% { opacity: 0.3; }
      50% { opacity: 1; }
    }
    
    .mp-chat-input-area {
      padding: 12px;
      border-top: 1px solid rgba(255,255,255,0.1);
      display: flex;
      gap: 8px;
    }
    
    .mp-chat-input {
      flex: 1;
      padding: 10px 14px;
      background: rgba(30, 41, 59, 0.6);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 10px;
      color: white;
      font-size: 13px;
      font-family: inherit;
      resize: none;
      outline: none;
    }
    
    .mp-chat-input:focus {
      border-color: rgba(0, 229, 250, 0.5);
    }
    
    .mp-chat-input::placeholder {
      color: #64748b;
    }
    
    .mp-chat-send {
      padding: 10px 16px;
      background: ${agent.color};
      border: none;
      border-radius: 10px;
      color: white;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: opacity 0.2s;
    }
    
    .mp-chat-send:hover {
      opacity: 0.9;
    }
    
    .mp-chat-send:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .mp-chat-empty {
      text-align: center;
      padding: 40px 20px;
      color: #94a3b8;
    }
    
    .mp-chat-empty-icon {
      font-size: 40px;
      margin-bottom: 12px;
    }
    
    .mp-chat-empty h4 {
      margin: 0 0 8px;
      color: white;
      font-size: 14px;
    }
    
    .mp-chat-empty p {
      margin: 0;
      font-size: 12px;
    }
    
    .mp-chat-footer {
      padding: 8px 12px;
      text-align: center;
      font-size: 10px;
      color: #64748b;
      background: rgba(0,0,0,0.2);
    }
    
    .mp-badge {
      display: inline-block;
      padding: 2px 6px;
      font-size: 9px;
      font-weight: 600;
      border-radius: 4px;
      background: ${agent.color}30;
      color: ${agent.color};
      margin-left: 8px;
    }
  `;

  // Inject stylesheet
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);

  // Create widget HTML
  const widget = document.createElement('div');
  widget.className = 'mp-chat-widget';
  widget.innerHTML = `
    <div class="mp-chat-panel">
      <div class="mp-chat-header">
        <div class="mp-chat-header-icon">${agent.icon}</div>
        <div class="mp-chat-header-info">
          <h3>${agent.name}<span class="mp-badge">AI</span></h3>
          <p>Ask me anything about ${agentId}</p>
        </div>
      </div>
      <div class="mp-chat-messages">
        <div class="mp-chat-empty">
          <div class="mp-chat-empty-icon">${agent.icon}</div>
          <h4>Start a conversation</h4>
          <p>Ask ${agent.name} for help</p>
        </div>
      </div>
      <div class="mp-chat-input-area">
        <textarea class="mp-chat-input" placeholder="Type your question..." rows="1"></textarea>
        <button class="mp-chat-send">Send</button>
      </div>
      <div class="mp-chat-footer">AI GENERATED - REQUIRES HUMAN REVIEW</div>
    </div>
    <button class="mp-chat-toggle">${agent.icon}</button>
  `;

  document.body.appendChild(widget);

  // Get elements
  const toggle = widget.querySelector('.mp-chat-toggle');
  const panel = widget.querySelector('.mp-chat-panel');
  const messages = widget.querySelector('.mp-chat-messages');
  const input = widget.querySelector('.mp-chat-input');
  const sendBtn = widget.querySelector('.mp-chat-send');
  
  let isOpen = false;
  let isLoading = false;
  let hasMessages = false;

  // Toggle panel
  toggle.addEventListener('click', () => {
    isOpen = !isOpen;
    panel.classList.toggle('open', isOpen);
    toggle.classList.toggle('active', isOpen);
    if (isOpen) input.focus();
  });

  // Auto-resize input
  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 80) + 'px';
  });

  // Send on Enter
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  sendBtn.addEventListener('click', sendMessage);

  async function sendMessage() {
    const text = input.value.trim();
    if (!text || isLoading) return;

    // Clear empty state
    if (!hasMessages) {
      messages.innerHTML = '';
      hasMessages = true;
    }

    // Add user message
    addMessage(text, 'user');
    input.value = '';
    input.style.height = 'auto';

    // Show typing indicator
    isLoading = true;
    sendBtn.disabled = true;
    const typing = document.createElement('div');
    typing.className = 'mp-typing';
    typing.innerHTML = '<div class="mp-typing-dot"></div><div class="mp-typing-dot"></div><div class="mp-typing-dot"></div>';
    messages.appendChild(typing);
    messages.scrollTop = messages.scrollHeight;

    try {
      const response = await chatWithAgent(agentId, text);
      typing.remove();
      
      const content = response.data?.content || response.content || 'No response received.';
      const confidence = response.data?.confidence_score || response.confidence_score;
      
      addMessage(content, 'assistant', confidence);
    } catch (error) {
      typing.remove();
      addMessage('Sorry, I encountered an error. Please try again.', 'assistant');
      console.error('Chat error:', error);
    } finally {
      isLoading = false;
      sendBtn.disabled = false;
    }
  }

  function addMessage(text, role, confidence) {
    const msg = document.createElement('div');
    msg.className = `mp-message ${role}`;
    
    let html = text.replace(/\n/g, '<br>');
    
    if (role === 'assistant' && confidence) {
      const pct = Math.round(confidence * 100);
      const color = pct >= 80 ? '#22c55e' : pct >= 60 ? '#f59e0b' : '#ef4444';
      html += `
        <div class="mp-confidence">
          Confidence: ${pct}%
          <div class="mp-confidence-bar">
            <div class="mp-confidence-fill" style="width: ${pct}%; background: ${color};"></div>
          </div>
        </div>
      `;
    }
    
    msg.innerHTML = html;
    messages.appendChild(msg);
    messages.scrollTop = messages.scrollHeight;
  }

  async function chatWithAgent(agentId, message) {
    // Try using global MissionPulseAPI if available
    if (typeof MissionPulseAPI !== 'undefined' && MissionPulseAPI.agents) {
      return await MissionPulseAPI.agents.chat(agentId, message);
    }
    
    // Fallback to direct fetch
    const response = await fetch(`${API_BASE}/api/agents-live/${agentId}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });
    
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return await response.json();
  }

})();
