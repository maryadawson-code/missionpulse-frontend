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

interface ChatPanelProps {
  existingMessages: ExistingMessage[]
  existingSessionId: string | null
  opportunityContext?: string
}

export function ChatPanel({
  existingMessages,
  existingSessionId,
  opportunityContext,
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
  const [isPending, startTransition] = useTransition()
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [messages])

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
        const sessionResult = await createChatSession()
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
        opportunityContext
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
  }, [input, isPending, sessionId, opportunityContext, startTransition])

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
