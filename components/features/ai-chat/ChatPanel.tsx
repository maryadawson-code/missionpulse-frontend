'use client'

import { useState, useRef, useEffect, useTransition, useCallback } from 'react'
import { Send, Loader2, Bot, User, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { addToast } from '@/components/ui/Toast'
import { ConfidenceBadge } from '@/components/features/ai/ConfidenceBadge'
import {
  sendChatMessage,
  createChatSession,
} from '@/app/(dashboard)/ai-chat/actions'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  model?: string
  confidence?: 'high' | 'medium' | 'low'
}

interface ExistingMessage {
  id: string
  role: string
  content: string
}

interface OpportunityOption {
  id: string
  title: string
  agency: string | null
}

const AGENT_LABELS: Record<string, string> = {
  general: 'General Assistant',
  capture: 'Capture Agent',
  writer: 'Writer Agent',
  compliance: 'Compliance Agent',
  pricing: 'Pricing Agent',
  strategy: 'Strategy Agent',
  blackhat: 'Black Hat Agent',
  contracts: 'Contracts Agent',
  orals: 'Orals Coach',
}

interface ChatPanelProps {
  existingMessages: ExistingMessage[]
  existingSessionId: string | null
  opportunityContext?: string
  opportunities?: OpportunityOption[]
  allowedAgents?: string[]
}

export function ChatPanel({
  existingMessages,
  existingSessionId,
  opportunityContext,
  opportunities = [],
  allowedAgents = [],
}: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(
    existingMessages.map((m) => ({
      id: m.id,
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))
  )
  const [input, setInput] = useState('')
  const [sessionId, setSessionId] = useState<string | null>(
    existingSessionId
  )
  const [selectedOpp, setSelectedOpp] = useState<string>('')
  const [selectedAgent, setSelectedAgent] = useState<string>('general')
  const [isPending, startTransition] = useTransition()
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [messages])

  // Build opportunity context from selection
  const activeContext = (() => {
    if (opportunityContext) return opportunityContext
    if (!selectedOpp) return undefined
    const opp = opportunities.find((o) => o.id === selectedOpp)
    if (!opp) return undefined
    return `Opportunity: ${opp.title}${opp.agency ? ` | Agency: ${opp.agency}` : ''} | ID: ${opp.id}`
  })()

  const handleSend = useCallback(() => {
    if (!input.trim() || isPending) return

    const userMessage = input.trim()
    setInput('')

    // Add user message optimistically
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: userMessage,
    }
    setMessages((prev) => [...prev, userMsg])

    startTransition(async () => {
      let currentSessionId = sessionId

      // Create session if needed
      if (!currentSessionId) {
        const sessionResult = await createChatSession(selectedOpp || undefined)
        if (!sessionResult.success || !sessionResult.sessionId) {
          addToast('error', sessionResult.error ?? 'Failed to create session')
          return
        }
        currentSessionId = sessionResult.sessionId
        setSessionId(currentSessionId)
      }

      const result = await sendChatMessage(
        currentSessionId,
        userMessage,
        activeContext
      )

      if (result.success && result.response) {
        const assistantMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: result.response,
          model: result.model,
          confidence: result.confidence,
        }
        setMessages((prev) => [...prev, assistantMsg])
      } else {
        addToast('error', result.error ?? 'Failed to get response')
      }
    })
  }, [input, isPending, sessionId, activeContext, selectedOpp, opportunities, startTransition])

  return (
    <div className="flex flex-col rounded-xl border border-border bg-card h-[calc(100vh-200px)] min-h-[500px]">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Sparkles className="h-5 w-5 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">
          MissionPulse AI
        </h2>
        <span className="text-[10px] text-muted-foreground ml-auto">
          Powered by AskSage
        </span>
      </div>

      {/* Context Picker */}
      {(opportunities.length > 0 || allowedAgents.length > 0) && (
        <div className="flex items-center gap-3 border-b border-border px-4 py-2">
          {opportunities.length > 0 && (
            <select
              value={selectedOpp}
              onChange={(e) => {
                setSelectedOpp(e.target.value)
                // Reset session when context changes
                setSessionId(null)
              }}
              className="h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">No opportunity context</option>
              {opportunities.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.title}{o.agency ? ` (${o.agency})` : ''}
                </option>
              ))}
            </select>
          )}
          {allowedAgents.length > 0 && (
            <select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
              className="h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="general">General Assistant</option>
              {allowedAgents.map((agent) => (
                <option key={agent} value={agent}>
                  {AGENT_LABELS[agent] ?? agent}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Bot className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm font-medium text-foreground">
              How can I help you?
            </p>
            <p className="mt-1 text-xs text-muted-foreground max-w-sm">
              Ask about pipeline management, compliance requirements, proposal
              strategy, or government contracting best practices.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${
              msg.role === 'user' ? 'justify-end' : ''
            }`}
          >
            {msg.role === 'assistant' && (
              <div className="flex-shrink-0 mt-0.5">
                <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              </div>
            )}

            <div
              className={`max-w-[80%] rounded-lg px-4 py-2.5 ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground'
              }`}
            >
              <div className="text-sm whitespace-pre-wrap leading-relaxed">
                {msg.content}
              </div>
              {msg.role === 'assistant' && (
                <div className="mt-2 flex items-center gap-2">
                  {msg.confidence && <ConfidenceBadge level={msg.confidence} />}
                  {msg.model && (
                    <span className="text-[10px] text-muted-foreground">
                      {msg.model} via AskSage
                    </span>
                  )}
                </div>
              )}
            </div>

            {msg.role === 'user' && (
              <div className="flex-shrink-0 mt-0.5">
                <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            )}
          </div>
        ))}

        {isPending && (
          <div className="flex gap-3">
            <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div className="bg-muted rounded-lg px-4 py-3">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}
      </div>

      {/* AI disclaimer */}
      <div className="border-t border-border px-4 py-1.5">
        <p className="text-[10px] text-muted-foreground">
          AI GENERATED — REQUIRES HUMAN REVIEW. All data handled via AskSage (FedRAMP).
        </p>
      </div>

      {/* Input */}
      <div className="border-t border-border px-4 py-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder="Ask MissionPulse AI..."
            disabled={isPending}
            className="flex-1 h-10 rounded-lg border border-border bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || isPending}
            className="h-10 w-10"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
