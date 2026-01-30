/**
 * MissionPulse AI Chat Widget v2.0
 * Enhanced UX: Enter-to-send, suggested prompts, streaming responses
 * 
 * Usage:
 * <script src="missionpulse-chat-widget.js"></script>
 * <script>
 *   MissionPulseChat.init({
 *     containerId: 'chat-container',
 *     agent: 'capture', // capture, strategy, blackhat, pricing, compliance, writer, contracts, orals
 *     opportunityId: 'opp-123' // optional context
 *   });
 * </script>
 */

const MissionPulseChat = (function() {
    // =========================================================================
    // CONFIGURATION
    // =========================================================================
    const API_URL = 'https://missionpulse-api.onrender.com';
    
    const AGENTS = {
        capture: {
            name: 'Capture Agent',
            icon: '🎯',
            color: 'cyan',
            description: 'Win strategy and capture planning',
            prompts: [
                'Analyze this opportunity for Go/No-Go',
                'What are our key discriminators?',
                'Identify the incumbent and their weaknesses',
                'Draft a capture plan outline'
            ]
        },
        strategy: {
            name: 'Strategy Agent',
            icon: '♟️',
            color: 'purple',
            description: 'Competitive positioning and win themes',
            prompts: [
                'Develop win themes for this opportunity',
                'What questions should we ask the customer?',
                'How do we ghost the competition?',
                'Create a SWOT analysis'
            ]
        },
        blackhat: {
            name: 'Black Hat Agent',
            icon: '🎩',
            color: 'red',
            description: 'Competitor intelligence analysis',
            prompts: [
                'Who are our main competitors?',
                'What is the incumbent likely to propose?',
                'Identify competitor weaknesses to exploit',
                'How would competitors attack our proposal?'
            ]
        },
        pricing: {
            name: 'Pricing Agent',
            icon: '💰',
            color: 'emerald',
            description: 'BOE and price-to-win analysis',
            prompts: [
                'What labor categories do we need?',
                'Estimate the price-to-win range',
                'Review our rate competitiveness',
                'Build a rough order of magnitude'
            ]
        },
        compliance: {
            name: 'Compliance Agent',
            icon: '📋',
            color: 'amber',
            description: 'RFP requirements and FAR/DFARS',
            prompts: [
                'Extract requirements from Section L',
                'Check for mandatory certifications',
                'What FAR clauses apply here?',
                'Build a compliance matrix'
            ]
        },
        writer: {
            name: 'Writer Agent',
            icon: '✍️',
            color: 'blue',
            description: 'Proposal content generation',
            prompts: [
                'Draft an executive summary',
                'Write a technical approach section',
                'Create a management plan outline',
                'Generate past performance narrative'
            ]
        },
        contracts: {
            name: 'Contracts Agent',
            icon: '📜',
            color: 'rose',
            description: 'Contract terms and negotiations',
            prompts: [
                'Review these contract terms',
                'What are the key risks in the SOW?',
                'Identify negotiable clauses',
                'Summarize the CLIN structure'
            ]
        },
        orals: {
            name: 'Orals Agent',
            icon: '🎤',
            color: 'indigo',
            description: 'Presentation prep and Q&A',
            prompts: [
                'Generate likely orals questions',
                'Create talking points for the PM',
                'How should we handle transition questions?',
                'Draft opening remarks'
            ]
        }
    };

    let currentConfig = {};
    let messages = [];
    let isStreaming = false;

    // =========================================================================
    // INITIALIZE
    // =========================================================================
    function init(config) {
        currentConfig = {
            containerId: config.containerId || 'chat-container',
            agent: config.agent || 'capture',
            opportunityId: config.opportunityId || null,
            onMessage: config.onMessage || null
        };

        render();
        attachListeners();
    }

    // =========================================================================
    // RENDER
    // =========================================================================
    function render() {
        const container = document.getElementById(currentConfig.containerId);
        if (!container) return;

        const agent = AGENTS[currentConfig.agent] || AGENTS.capture;

        container.innerHTML = `
            <div class="flex flex-col h-full bg-slate-900 rounded-xl overflow-hidden border border-slate-700">
                <!-- Header -->
                <div class="flex items-center gap-3 px-4 py-3 bg-slate-800 border-b border-slate-700">
                    <div class="w-10 h-10 rounded-lg bg-${agent.color}-500/20 flex items-center justify-center text-xl">
                        ${agent.icon}
                    </div>
                    <div class="flex-1">
                        <div class="font-semibold text-white">${agent.name}</div>
                        <div class="text-xs text-slate-400">${agent.description}</div>
                    </div>
                    <div id="chat-status" class="flex items-center gap-2 px-2 py-1 rounded-full text-xs bg-emerald-500/20 text-emerald-400">
                        <div class="w-2 h-2 rounded-full bg-emerald-400"></div>
                        Ready
                    </div>
                </div>

                <!-- Messages -->
                <div id="chat-messages" class="flex-1 overflow-y-auto p-4 space-y-4">
                    ${messages.length === 0 ? renderWelcome(agent) : messages.map(renderMessage).join('')}
                </div>

                <!-- Suggested Prompts -->
                <div id="chat-prompts" class="px-4 pb-2 ${messages.length > 0 ? 'hidden' : ''}">
                    <div class="text-xs text-slate-500 mb-2">Suggested prompts:</div>
                    <div class="flex flex-wrap gap-2">
                        ${agent.prompts.map(p => `
                            <button 
                                onclick="MissionPulseChat.sendPrompt('${p.replace(/'/g, "\\'")}')"
                                class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-lg transition-colors"
                            >
                                ${p}
                            </button>
                        `).join('')}
                    </div>
                </div>

                <!-- Input -->
                <div class="p-4 border-t border-slate-700">
                    <div class="flex gap-2">
                        <textarea 
                            id="chat-input"
                            placeholder="Ask ${agent.name.toLowerCase()}... (Enter to send, Shift+Enter for new line)"
                            class="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 resize-none focus:border-${agent.color}-500 focus:outline-none"
                            rows="1"
                            style="min-height: 48px; max-height: 120px;"
                        ></textarea>
                        <button 
                            id="chat-send"
                            onclick="MissionPulseChat.send()"
                            class="px-4 py-3 bg-${agent.color}-500 hover:bg-${agent.color}-400 text-slate-900 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Send
                        </button>
                    </div>
                    <div class="text-xs text-slate-600 mt-2 text-center">
                        AI responses require human review • CUI handling applies
                    </div>
                </div>
            </div>
        `;
    }

    function renderWelcome(agent) {
        return `
            <div class="text-center py-8">
                <div class="text-4xl mb-4">${agent.icon}</div>
                <h3 class="text-lg font-semibold text-white mb-2">Welcome to ${agent.name}</h3>
                <p class="text-slate-400 text-sm max-w-md mx-auto">
                    ${agent.description}. Ask me anything about your proposal or select a suggested prompt below.
                </p>
            </div>
        `;
    }

    function renderMessage(msg) {
        if (msg.role === 'user') {
            return `
                <div class="flex justify-end">
                    <div class="max-w-[80%] bg-cyan-500/20 border border-cyan-500/30 rounded-xl px-4 py-3">
                        <div class="text-white whitespace-pre-wrap">${escapeHtml(msg.content)}</div>
                    </div>
                </div>
            `;
        } else {
            return `
                <div class="flex justify-start">
                    <div class="max-w-[80%] bg-slate-800 border border-slate-700 rounded-xl px-4 py-3">
                        <div class="text-slate-300 whitespace-pre-wrap">${escapeHtml(msg.content)}</div>
                        ${msg.isStreaming ? '<span class="inline-block w-2 h-4 bg-cyan-500 animate-pulse ml-1"></span>' : ''}
                    </div>
                </div>
            `;
        }
    }

    // =========================================================================
    // EVENT HANDLERS
    // =========================================================================
    function attachListeners() {
        const input = document.getElementById('chat-input');
        if (!input) return;

        // Enter to send (Shift+Enter for new line)
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
            }
        });

        // Auto-resize textarea
        input.addEventListener('input', () => {
            input.style.height = 'auto';
            input.style.height = Math.min(input.scrollHeight, 120) + 'px';
        });
    }

    // =========================================================================
    // SEND MESSAGE
    // =========================================================================
    async function send() {
        const input = document.getElementById('chat-input');
        const content = input?.value?.trim();
        
        if (!content || isStreaming) return;

        // Add user message
        messages.push({ role: 'user', content });
        input.value = '';
        input.style.height = 'auto';

        // Hide prompts
        const promptsEl = document.getElementById('chat-prompts');
        if (promptsEl) promptsEl.classList.add('hidden');

        // Update UI
        render();
        attachListeners();
        scrollToBottom();

        // Show streaming indicator
        isStreaming = true;
        updateStatus('Thinking...', 'amber');

        // Add assistant message placeholder
        messages.push({ role: 'assistant', content: '', isStreaming: true });
        render();
        attachListeners();

        try {
            const response = await fetch(`${API_URL}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    agent: currentConfig.agent,
                    messages: messages.slice(0, -1), // Exclude placeholder
                    opportunity_id: currentConfig.opportunityId
                })
            });

            if (!response.ok) throw new Error('API error');

            const data = await response.json();
            
            // Update last message with response
            messages[messages.length - 1] = {
                role: 'assistant',
                content: data.response || data.message || 'I apologize, I encountered an issue. Please try again.',
                isStreaming: false
            };

        } catch (error) {
            console.error('Chat error:', error);
            
            // Fallback demo response
            const agent = AGENTS[currentConfig.agent];
            messages[messages.length - 1] = {
                role: 'assistant',
                content: `[Demo Mode] As the ${agent.name}, I would analyze your request: "${content}"\n\nIn production, I'll provide detailed proposal guidance based on Shipley methodology, your company's knowledge base, and the specific opportunity context.\n\nKey areas I can help with:\n• ${agent.prompts.join('\n• ')}`,
                isStreaming: false
            };
        }

        isStreaming = false;
        updateStatus('Ready', 'emerald');
        render();
        attachListeners();
        scrollToBottom();

        // Callback
        if (currentConfig.onMessage) {
            currentConfig.onMessage(messages[messages.length - 1]);
        }
    }

    function sendPrompt(prompt) {
        const input = document.getElementById('chat-input');
        if (input) {
            input.value = prompt;
            send();
        }
    }

    // =========================================================================
    // UTILITIES
    // =========================================================================
    function updateStatus(text, color) {
        const status = document.getElementById('chat-status');
        if (status) {
            status.className = `flex items-center gap-2 px-2 py-1 rounded-full text-xs bg-${color}-500/20 text-${color}-400`;
            status.innerHTML = `<div class="w-2 h-2 rounded-full bg-${color}-400 ${color === 'amber' ? 'animate-pulse' : ''}"></div>${text}`;
        }
    }

    function scrollToBottom() {
        const messagesEl = document.getElementById('chat-messages');
        if (messagesEl) {
            messagesEl.scrollTop = messagesEl.scrollHeight;
        }
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function clearHistory() {
        messages = [];
        render();
        attachListeners();
    }

    function setAgent(agentId) {
        if (AGENTS[agentId]) {
            currentConfig.agent = agentId;
            messages = [];
            render();
            attachListeners();
        }
    }

    // =========================================================================
    // PUBLIC API
    // =========================================================================
    return {
        init,
        send,
        sendPrompt,
        clearHistory,
        setAgent,
        getMessages: () => [...messages],
        AGENTS
    };
})();

// Auto-expose to window
if (typeof window !== 'undefined') {
    window.MissionPulseChat = MissionPulseChat;
}
