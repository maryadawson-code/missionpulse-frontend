'use client'

import { useState, useRef, useEffect, useTransition, useCallback } from 'react'
import { Send, Loader2, Bot, User, Sparkles, BookOpen, Search, X, Copy, Check } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { addToast } from '@/components/ui/Toast'
import { AgentAttribution } from './AgentAttribution'
import { PromptChips } from './PromptChips'
import {
  sendChatMessage,
  createChatSession,
} from '@/app/(dashboard)/ai-chat/actions'
import { searchPlaybook, type PlaybookResult } from '@/app/(dashboard)/ai-chat/playbook-actions'
import { classifyIntent, AUTO_ROUTE_CONFIDENCE } from '@/lib/ai/intent-classifier'
import { AGENT_LABELS, AGENT_COLORS } from '@/lib/ai/intent-patterns'
import { getSuggestedPrompts } from '@/lib/ai/suggested-prompts'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  model?: string
  confidence?: 'high' | 'medium' | 'low'
  agentType?: string
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
  phase?: string | null
}

interface PendingConfirmation {
  message: string
  agent: string
  confidence: number
  reasoning: string
}

interface SmartChatInterfaceProps {
  existingMessages: ExistingMessage[]
  existingSessionId: string | null
  opportunities?: OpportunityOption[]
  allowedAgents?: string[]
  userRole: string
  userName: string
  selectedPhase?: string | null
}

export function SmartChatInterface({
  existingMessages,
  existingSessionId,
  opportunities = [],
  allowedAgents = [],
  userRole,
  userName,
  selectedPhase = null,
}: SmartChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(
    existingMessages.map((m) => ({
      id: m.id,
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))
  )
  const [input, setInput] = useState('')
  const [sessionId, setSessionId] = useState<string | null>(existingSessionId)
  const [selectedOpp, setSelectedOpp] = useState<string>('')
  const [isPending, startTransition] = useTransition()
  const [pendingConfirmation, setPendingConfirmation] = useState<PendingConfirmation | null>(null)
  const [showPlaybook, setShowPlaybook] = useState(false)
  const [playbookQuery, setPlaybookQuery] = useState('')
  const [playbookResults, setPlaybookResults] = useState<PlaybookResult[]>([])
  const [playbookLoading, setPlaybookLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Derive active opportunity and phase from selection
  const activeOpp = selectedOpp ? opportunities.find((o) => o.id === selectedOpp) : null
  const activePhase = activeOpp?.phase ?? selectedPhase

  // Get suggested prompts based on role, phase, allowed agents, and active opportunity
  const suggestedPrompts = getSuggestedPrompts(userRole, activePhase, allowedAgents, activeOpp?.title)

  async function handlePlaybookSearch() {
    if (!playbookQuery.trim()) return
    setPlaybookLoading(true)
    const result = await searchPlaybook(playbookQuery.trim())
    if (result.success) {
      setPlaybookResults(result.results ?? [])
    } else {
      addToast('error', result.error ?? 'Search failed')
    }
    setPlaybookLoading(false)
  }

  function insertPlaybookContent(content: string) {
    setInput((prev) => prev + (prev ? '\n\n' : '') + content)
    setShowPlaybook(false)
    addToast('success', 'Content inserted into message')
  }

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [messages])

  // Build opportunity context from selection
  const activeContext = (() => {
    if (!selectedOpp) return undefined
    const opp = opportunities.find((o) => o.id === selectedOpp)
    if (!opp) return undefined
    return `Opportunity: ${opp.title}${opp.agency ? ` | Agency: ${opp.agency}` : ''}${opp.phase ? ` | Phase: ${opp.phase}` : ''} | ID: ${opp.id}`
  })()

  const doSend = useCallback((message: string, agent: string) => {
    // Add user message optimistically
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: message,
    }
    setMessages((prev) => [...prev, userMsg])

    startTransition(async () => {
      let currentSessionId = sessionId

      // Create session if needed
      if (!currentSessionId) {
        const sessionResult = await createChatSession(selectedOpp || undefined, agent)
        if (!sessionResult.success || !sessionResult.sessionId) {
          addToast('error', sessionResult.error ?? 'Failed to create session')
          return
        }
        currentSessionId = sessionResult.sessionId
        setSessionId(currentSessionId)
      }

      const result = await sendChatMessage(
        currentSessionId,
        message,
        activeContext,
        agent
      )

      if (result.success && result.response) {
        const assistantMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: result.response,
          model: result.model,
          confidence: result.confidence,
          agentType: agent,
        }
        setMessages((prev) => [...prev, assistantMsg])
      } else {
        addToast('error', result.error ?? 'Failed to get response')
      }
    })
  }, [sessionId, activeContext, selectedOpp, startTransition])

  const handleSend = useCallback(() => {
    if (!input.trim() || isPending) return

    const userMessage = input.trim()
    setInput('')

    // Classify intent
    const classification = classifyIntent(userMessage, allowedAgents)

    if (classification.confidence >= AUTO_ROUTE_CONFIDENCE) {
      // High confidence — auto-route
      doSend(userMessage, classification.agent)
    } else {
      // Low confidence — ask for confirmation
      setPendingConfirmation({
        message: userMessage,
        agent: classification.agent,
        confidence: classification.confidence,
        reasoning: classification.reasoning,
      })
    }
  }, [input, isPending, allowedAgents, doSend])

  const handleConfirmAgent = useCallback((agent: string) => {
    if (!pendingConfirmation) return
    const message = pendingConfirmation.message
    setPendingConfirmation(null)
    doSend(message, agent)
  }, [pendingConfirmation, doSend])

  const handleCancelConfirmation = useCallback(() => {
    // Put the message back in the input
    if (pendingConfirmation) {
      setInput(pendingConfirmation.message)
    }
    setPendingConfirmation(null)
  }, [pendingConfirmation])

  const handlePromptSelect = useCallback((prompt: string) => {
    setInput(prompt)
    // Auto-send the prompt chip
    const classification = classifyIntent(prompt, allowedAgents)
    if (classification.confidence >= AUTO_ROUTE_CONFIDENCE) {
      setInput('')
      doSend(prompt, classification.agent)
    }
    // If low confidence, just fill the input and let user send manually
  }, [allowedAgents, doSend])

  const showChips = messages.length === 0 && !isPending && !pendingConfirmation

  return (
    <div className="flex flex-col rounded-xl border border-border bg-card h-[calc(100vh-200px)] min-h-[500px]">
      {/* Profile-first Header */}
      <div className="border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                Hi {userName.split(' ')[0]}, how can I help?
              </h2>
              {selectedOpp && activeOpp ? (
                <p className="text-[11px] text-muted-foreground">
                  Working on: {activeOpp.title}{activePhase ? ` \u2022 ${activePhase}` : ''}
                </p>
              ) : (
                <p className="text-[11px] text-muted-foreground">
                  Smart routing \u2022 Powered by AskSage
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Context Picker — opportunity only, no agent dropdown */}
      {opportunities.length > 0 && (
        <div className="flex items-center gap-3 border-b border-border px-4 py-2">
          <select
            value={selectedOpp}
            onChange={(e) => {
              setSelectedOpp(e.target.value)
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
          {activePhase && (
            <span className="text-[10px] text-muted-foreground">
              Phase: {activePhase}
            </span>
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
              Just type naturally — your message will be automatically routed to the right AI agent.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}
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
                <AgentAttribution
                  agentType={msg.agentType ?? 'general'}
                  model={msg.model}
                  confidence={msg.confidence}
                />
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

      {/* Pending Confirmation Bar */}
      {pendingConfirmation && (
        <div className="border-t border-border px-4 py-3 bg-muted/50">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className={`h-2 w-2 rounded-full shrink-0 ${AGENT_COLORS[pendingConfirmation.agent] ?? 'bg-gray-400'}`} />
              <span className="text-xs text-foreground truncate">
                I&apos;ll route this to <strong>{AGENT_LABELS[pendingConfirmation.agent] ?? pendingConfirmation.agent}</strong> &mdash; correct?
              </span>
              <span className="text-[10px] text-muted-foreground shrink-0">
                ({Math.round(pendingConfirmation.confidence * 100)}% confidence)
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={() => handleConfirmAgent(pendingConfirmation.agent)}
              >
                <Check className="h-3 w-3 mr-1" />
                Accept
              </Button>
              {/* Agent picker for override */}
              <select
                onChange={(e) => {
                  if (e.target.value) handleConfirmAgent(e.target.value)
                }}
                className="h-7 rounded-md border border-border bg-background px-2 text-[11px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                defaultValue=""
              >
                <option value="" disabled>Change agent...</option>
                {allowedAgents.map((a) => (
                  <option key={a} value={a}>
                    {AGENT_LABELS[a] ?? a}
                  </option>
                ))}
              </select>
              <button
                onClick={handleCancelConfirmation}
                className="p-1 text-muted-foreground hover:text-foreground"
                title="Cancel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Playbook Search Panel */}
      {showPlaybook && (
        <div className="border-t border-border px-4 py-3 max-h-52 overflow-y-auto">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex-1 flex gap-1">
              <input
                type="text"
                value={playbookQuery}
                onChange={(e) => setPlaybookQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handlePlaybookSearch() }}
                placeholder="Search playbook entries..."
                className="flex-1 h-8 rounded-md border border-border bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <Button size="icon" variant="outline" className="h-8 w-8" onClick={handlePlaybookSearch} disabled={playbookLoading}>
                {playbookLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Search className="h-3 w-3" />}
              </Button>
            </div>
            <button onClick={() => setShowPlaybook(false)} className="p-1 text-muted-foreground hover:text-foreground" aria-label="Close playbook">
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          {playbookResults.length > 0 ? (
            <div className="space-y-2">
              {playbookResults.map((r) => (
                <div key={r.id} className="rounded-md border border-border bg-muted/50 p-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-foreground truncate">{r.title}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[9px] text-muted-foreground">{Math.round(r.score * 100)}%</span>
                      {r.category && (
                        <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] text-primary">{r.category}</span>
                      )}
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground line-clamp-2">{r.content}</p>
                  <button
                    onClick={() => insertPlaybookContent(r.content)}
                    className="mt-1 flex items-center gap-1 text-[10px] text-primary hover:underline"
                  >
                    <Copy className="h-2.5 w-2.5" /> Insert into message
                  </button>
                </div>
              ))}
            </div>
          ) : playbookQuery && !playbookLoading ? (
            <p className="text-xs text-muted-foreground text-center py-2">No results found</p>
          ) : null}
        </div>
      )}

      {/* Prompt Chips */}
      {showChips && suggestedPrompts.length > 0 && (
        <div className="border-t border-border px-4 py-2">
          <PromptChips
            prompts={suggestedPrompts}
            onSelect={handlePromptSelect}
            disabled={isPending}
          />
        </div>
      )}

      {/* Input */}
      <div className="border-t border-border px-4 py-3">
        <div className="flex gap-2">
          <button
            onClick={() => setShowPlaybook(!showPlaybook)}
            className={`h-10 w-10 shrink-0 flex items-center justify-center rounded-lg border transition-colors ${showPlaybook ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-foreground hover:border-primary/50'}`}
            title="Search Playbook"
          >
            <BookOpen className="h-4 w-4" />
          </button>
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
            placeholder="Ask anything — auto-routed to the right agent..."
            disabled={isPending || !!pendingConfirmation}
            className="flex-1 h-10 rounded-lg border border-border bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || isPending || !!pendingConfirmation}
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
