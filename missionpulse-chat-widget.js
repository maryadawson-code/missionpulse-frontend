/**
 * MissionPulse AI Chat Widget v2.0
 * Embeddable chat component with Enter-to-send and suggested prompts
 * 
 * Usage: Include this script and call:
 * MissionPulseChat.init({ agent: 'capture', containerId: 'chatWidget' });
 */

const MissionPulseChat = (function() {
  const API_URL = 'https://missionpulse-api.onrender.com';
  
  // Agent configurations with prompts
  const agentConfig = {
    capture: {
      name: 'Capture Agent',
      icon: '🎯',
      prompts: [
        'What win themes should we emphasize?',
        'Analyze our competitive position',
        'What intelligence gaps exist?',
        'Draft capture strategy'
      ]
    },
    strategy: {
      name: 'Strategy Agent',
      icon: '♟️',
      prompts: [
        'Who are likely competitors?',
        'What are our discriminators?',
        'Suggest teaming partners',
        'Position against incumbent'
      ]
    },
    blackhat: {
      name: 'Black Hat Agent',
      icon: '🎩',
      prompts: [
        'How would competitors ghost us?',
        'What are our vulnerabilities?',
        'Predict competitor strategy',
        'Evaluator objections?'
      ]
    },
    pricing: {
      name: 'Pricing Agent',
      icon: '💰',
      prompts: [
        'Estimate price-to-win',
        'What LCATs are needed?',
        'Review burden rates',
        'Structure the pricing'
      ]
    },
    compliance: {
      name: 'Compliance Agent',
      icon: '✅',
      prompts: [
        'List RFP requirements',
        'Check Section L compliance',
        'Required certifications?',
        'Flag compliance gaps'
      ]
    },
    writer: {
      name: 'Writer Agent',
      icon: '✍️',
      prompts: [
        'Draft executive summary',
        'Write technical approach',
        'Past performance narrative',
        'Improve this text...'
      ]
    },
    contracts: {
      name: 'Contracts Agent',
      icon: '📜',
      prompts: [
        'Explain this FAR clause',
        'Key contract terms?',
        'High-risk clauses?',
        'Is this negotiable?'
      ]
    },
    orals: {
      name: 'Orals Coach',
      icon: '🎤',
      prompts: [
        'Likely questions?',
        'Structure presentation',
        'Create talking points',
        'Handle tough questions'
      ]
    }
  };

  let config = {};
  let chatHistory = [];
  let isTyping = false;

  // Initialize widget
  function init(options = {}) {
    config = {
      agent: options.agent || 'capture',
      containerId: options.containerId || 'missionpulse-chat',
      context: options.context || {},
      onMessage: options.onMessage || null,
      collapsed: options.collapsed !== false
    };

    render();
    loadHistory();
    setupEvents();
  }

  // Render widget HTML
  function render() {
    const container = document.getElementById(config.containerId);
    if (!container) return;

    const agent = agentConfig[config.agent] || agentConfig.capture;
    
    container.innerHTML = `
      <div id="mpChatWidget" class="fixed bottom-4 right-4 z-50 font-sans">
        <!-- Toggle Button -->
        <button 
          id="mpChatToggle"
          class="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg flex items-center justify-center text-2xl hover:scale-105 transition-transform"
          title="Chat with ${agent.name}"
        >
          ${agent.icon}
        </button>

        <!-- Chat Panel -->
        <div id="mpChatPanel" class="hidden absolute bottom-16 right-0 w-80 sm:w-96 bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden" style="max-height: 500px;">
          <!-- Header -->
          <div class="bg-gray-800 px-4 py-3 flex items-center gap-3 border-b border-gray-700">
            <span class="text-xl">${agent.icon}</span>
            <div class="flex-1">
              <div class="font-medium text-white text-sm">${agent.name}</div>
              <div class="text-xs text-gray-400">AI Assistant</div>
            </div>
            <button id="mpChatClose" class="text-gray-400 hover:text-white text-lg">&times;</button>
          </div>

          <!-- Messages -->
          <div id="mpChatMessages" class="h-64 overflow-y-auto p-3 space-y-3 bg-gray-900">
            <div class="text-center text-gray-500 text-xs py-4">
              Start a conversation or use a prompt below
            </div>
          </div>

          <!-- Suggested Prompts -->
          <div id="mpChatPrompts" class="px-3 py-2 border-t border-gray-800 bg-gray-900/50">
            <div class="flex flex-wrap gap-1">
              ${agent.prompts.map(p => `
                <button class="mp-prompt-btn text-xs px-2 py-1 bg-gray-800 hover:bg-cyan-600/30 border border-gray-700 hover:border-cyan-500 rounded-full text-gray-300 hover:text-cyan-300 transition-colors truncate max-w-full">
                  ${escapeHtml(p)}
                </button>
              `).join('')}
            </div>
          </div>

          <!-- Input -->
          <div class="p-3 border-t border-gray-700 bg-gray-800">
            <div class="flex gap-2">
              <textarea 
                id="mpChatInput"
                class="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 resize-none focus:border-cyan-500 focus:outline-none"
                placeholder="Type message... (Enter to send)"
                rows="1"
              ></textarea>
              <button 
                id="mpChatSend"
                class="px-3 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-700 rounded-lg text-white text-sm font-medium transition-colors"
              >
                →
              </button>
            </div>
            <div class="text-center text-xs text-gray-600 mt-1">AI GENERATED - REQUIRES HUMAN REVIEW</div>
          </div>
        </div>
      </div>
    `;
  }

  // Setup event listeners
  function setupEvents() {
    const toggle = document.getElementById('mpChatToggle');
    const panel = document.getElementById('mpChatPanel');
    const close = document.getElementById('mpChatClose');
    const input = document.getElementById('mpChatInput');
    const send = document.getElementById('mpChatSend');
    const prompts = document.querySelectorAll('.mp-prompt-btn');

    if (toggle) toggle.addEventListener('click', () => panel.classList.toggle('hidden'));
    if (close) close.addEventListener('click', () => panel.classList.add('hidden'));
    
    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendMessage();
        }
      });
      
      // Auto-resize
      input.addEventListener('input', () => {
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 80) + 'px';
      });
    }

    if (send) send.addEventListener('click', sendMessage);

    prompts.forEach(btn => {
      btn.addEventListener('click', () => {
        if (input) {
          input.value = btn.textContent.trim();
          input.focus();
        }
      });
    });
  }

  // Send message
  async function sendMessage() {
    const input = document.getElementById('mpChatInput');
    const message = input?.value.trim();
    
    if (!message || isTyping) return;

    // Add user message
    chatHistory.push({ role: 'user', content: message });
    input.value = '';
    input.style.height = 'auto';
    renderMessages();

    // Hide prompts after first message
    const promptsEl = document.getElementById('mpChatPrompts');
    if (promptsEl) promptsEl.style.display = 'none';

    // Show typing
    isTyping = true;
    showTyping();

    try {
      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent: config.agent,
          message: message,
          context: config.context,
          history: chatHistory.slice(-6)
        })
      });

      let reply;
      if (response.ok) {
        const data = await response.json();
        reply = data.response || data.message || getFallback();
      } else {
        reply = getFallback();
      }

      chatHistory.push({ role: 'assistant', content: reply });
      
      if (config.onMessage) config.onMessage(reply);
      
    } catch (err) {
      chatHistory.push({ role: 'assistant', content: getFallback() });
    }

    isTyping = false;
    renderMessages();
    saveHistory();
  }

  // Fallback response
  function getFallback() {
    const agent = agentConfig[config.agent];
    return `I'm ${agent?.name || 'your AI assistant'}. I can help with federal proposal questions. The API is currently warming up - please try again in a moment, or check your connection.`;
  }

  // Show typing indicator
  function showTyping() {
    const container = document.getElementById('mpChatMessages');
    if (!container) return;
    
    const typing = document.createElement('div');
    typing.id = 'mpTyping';
    typing.className = 'flex gap-2';
    typing.innerHTML = `
      <div class="bg-gray-800 rounded-lg px-3 py-2">
        <div class="flex gap-1">
          <span class="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
          <span class="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" style="animation-delay:0.2s"></span>
          <span class="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" style="animation-delay:0.4s"></span>
        </div>
      </div>
    `;
    container.appendChild(typing);
    container.scrollTop = container.scrollHeight;
  }

  // Render messages
  function renderMessages() {
    const container = document.getElementById('mpChatMessages');
    if (!container) return;
    
    const agent = agentConfig[config.agent];

    container.innerHTML = chatHistory.map(msg => {
      if (msg.role === 'user') {
        return `
          <div class="flex justify-end">
            <div class="bg-cyan-600/30 border border-cyan-500/30 rounded-lg rounded-tr-none px-3 py-2 max-w-[85%]">
              <div class="text-sm text-white">${escapeHtml(msg.content)}</div>
            </div>
          </div>
        `;
      } else {
        return `
          <div class="flex gap-2">
            <span class="text-lg">${agent?.icon || '🤖'}</span>
            <div class="bg-gray-800 rounded-lg rounded-tl-none px-3 py-2 max-w-[85%]">
              <div class="text-sm text-gray-200">${formatMessage(msg.content)}</div>
            </div>
          </div>
        `;
      }
    }).join('');

    container.scrollTop = container.scrollHeight;
  }

  // Format message
  function formatMessage(text) {
    return escapeHtml(text)
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');
  }

  // Save/load history
  function saveHistory() {
    try {
      localStorage.setItem(`mp_chat_${config.agent}`, JSON.stringify(chatHistory.slice(-20)));
    } catch (e) {}
  }

  function loadHistory() {
    try {
      const saved = localStorage.getItem(`mp_chat_${config.agent}`);
      if (saved) {
        chatHistory = JSON.parse(saved);
        renderMessages();
      }
    } catch (e) {}
  }

  // Escape HTML
  function escapeHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  // Public API
  return {
    init,
    sendMessage,
    clearHistory: () => { chatHistory = []; renderMessages(); },
    setContext: (ctx) => { config.context = ctx; }
  };
})();

// Auto-init if container exists
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('missionpulse-chat')) {
      MissionPulseChat.init();
    }
  });
}
