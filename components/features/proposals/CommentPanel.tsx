'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  MessageSquare,
  Send,
  CheckCircle2,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  AtSign,
} from 'lucide-react'
import {
  addComment,
  getComments,
  resolveComment,
  type Comment,
} from '@/lib/comments/actions'
import { addToast } from '@/components/ui/Toast'

// ─── Types ───────────────────────────────────────────────────

interface CommentPanelProps {
  sectionId: string
  userId: string
  userName: string
}

// ─── Component ───────────────────────────────────────────────

export function CommentPanel({ sectionId, userId, userName }: CommentPanelProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showResolved, setShowResolved] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const loadComments = useCallback(async () => {
    setLoading(true)
    const result = await getComments(sectionId)
    setComments(result)
    setLoading(false)
  }, [sectionId])

  useEffect(() => {
    loadComments()
  }, [loadComments])

  const handleSubmit = async () => {
    if (!newComment.trim() || submitting) return
    setSubmitting(true)

    const result = await addComment(sectionId, userId, newComment.trim())
    if (result.error) {
      addToast('error', result.error)
    } else if (result.comment) {
      setComments((prev) => [...prev, result.comment!])
      setNewComment('')
      addToast('success', 'Comment added')
    }

    setSubmitting(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const unresolvedComments = comments.filter((c) => !c.resolved)
  const resolvedComments = comments.filter((c) => c.resolved)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Comments</span>
          {unresolvedComments.length > 0 && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
              {unresolvedComments.length}
            </span>
          )}
        </div>
      </div>

      {/* Comment list */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse space-y-2">
                <div className="h-3 w-24 rounded bg-muted" />
                <div className="h-8 rounded bg-muted" />
              </div>
            ))}
          </div>
        ) : unresolvedComments.length === 0 && resolvedComments.length === 0 ? (
          <div className="py-8 text-center">
            <MessageSquare className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">No comments yet.</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Use @role to mention team members.
            </p>
          </div>
        ) : (
          <>
            {unresolvedComments.map((comment) => (
              <CommentThread
                key={comment.id}
                comment={comment}
                sectionId={sectionId}
                userId={userId}
                userName={userName}
                onReply={(reply) => {
                  setComments((prev) =>
                    prev.map((c) =>
                      c.id === comment.id
                        ? { ...c, replies: [...c.replies, reply] }
                        : c
                    )
                  )
                }}
                onResolve={(resolved) => {
                  setComments((prev) =>
                    prev.map((c) =>
                      c.id === comment.id ? { ...c, resolved } : c
                    )
                  )
                }}
              />
            ))}

            {/* Resolved section */}
            {resolvedComments.length > 0 && (
              <div className="mt-4">
                <button
                  onClick={() => setShowResolved(!showResolved)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-muted-foreground"
                >
                  {showResolved ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                  {resolvedComments.length} resolved
                </button>
                {showResolved &&
                  resolvedComments.map((comment) => (
                    <div key={comment.id} className="mt-2 opacity-60">
                      <CommentThread
                        comment={comment}
                        sectionId={sectionId}
                        userId={userId}
                        userName={userName}
                        onReply={(reply) => {
                          setComments((prev) =>
                            prev.map((c) =>
                              c.id === comment.id
                                ? { ...c, replies: [...c.replies, reply] }
                                : c
                            )
                          )
                        }}
                        onResolve={(resolved) => {
                          setComments((prev) =>
                            prev.map((c) =>
                              c.id === comment.id ? { ...c, resolved } : c
                            )
                          )
                        }}
                      />
                    </div>
                  ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border p-3">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a comment... (use @role to mention)"
            className="flex-1 resize-none rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            rows={2}
          />
          <button
            onClick={handleSubmit}
            disabled={!newComment.trim() || submitting}
            className="self-end rounded-lg bg-cyan-500 p-2 text-black hover:bg-cyan-400 disabled:opacity-50"
            title="Send (Cmd+Enter)"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
          <AtSign className="h-3 w-3" />
          @capture_manager, @contracts, @executive...
        </div>
      </div>
    </div>
  )
}

// ─── Comment Thread ──────────────────────────────────────────

function CommentThread({
  comment,
  sectionId,
  userId,
  userName,
  onReply,
  onResolve,
}: {
  comment: Comment
  sectionId: string
  userId: string
  userName: string
  onReply: (_reply: Comment) => void
  onResolve: (_resolved: boolean) => void
}) {
  const [replyText, setReplyText] = useState('')
  const [showReply, setShowReply] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleReply = async () => {
    if (!replyText.trim() || submitting) return
    setSubmitting(true)

    const result = await addComment(sectionId, userId, replyText.trim(), comment.id)
    if (result.comment) {
      onReply(result.comment)
      setReplyText('')
      setShowReply(false)
    }

    setSubmitting(false)
  }

  const handleResolve = async () => {
    const newResolved = !comment.resolved
    await resolveComment(sectionId, comment.id, userId, newResolved)
    onResolve(newResolved)
  }

  // Highlight @mentions in text
  const renderContent = (text: string) => {
    const parts = text.split(/(@\w+)/g)
    return parts.map((part, i) =>
      part.startsWith('@') ? (
        <span key={i} className="rounded bg-primary/10 px-1 text-primary">
          {part}
        </span>
      ) : (
        <span key={i}>{part}</span>
      )
    )
  }

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  return (
    <div className="rounded-lg border border-border bg-card/50 p-3">
      {/* Author */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center">
            <span className="text-[9px] font-medium text-foreground">
              {comment.authorName.charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="text-xs font-medium text-foreground">{comment.authorName}</span>
          {comment.authorRole && (
            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
              {comment.authorRole}
            </span>
          )}
        </div>
        <span className="text-[10px] text-muted-foreground">{timeAgo(comment.createdAt)}</span>
      </div>

      {/* Content */}
      <p className="text-xs text-foreground leading-relaxed">
        {renderContent(comment.content)}
      </p>

      {/* Actions */}
      <div className="mt-2 flex items-center gap-3">
        <button
          onClick={() => setShowReply(!showReply)}
          className="text-[10px] text-muted-foreground hover:text-muted-foreground"
        >
          Reply
        </button>
        <button
          onClick={handleResolve}
          className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-muted-foreground"
        >
          {comment.resolved ? (
            <>
              <RotateCcw className="h-3 w-3" />
              Reopen
            </>
          ) : (
            <>
              <CheckCircle2 className="h-3 w-3" />
              Resolve
            </>
          )}
        </button>
      </div>

      {/* Replies */}
      {comment.replies.length > 0 && (
        <div className="mt-2 ml-4 space-y-2 border-l border-border pl-3">
          {comment.replies.map((reply) => (
            <div key={reply.id}>
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[10px] font-medium text-muted-foreground">
                  {reply.authorName}
                </span>
                <span className="text-[10px] text-muted-foreground">{timeAgo(reply.createdAt)}</span>
              </div>
              <p className="text-[11px] text-muted-foreground">{renderContent(reply.content)}</p>
            </div>
          ))}
        </div>
      )}

      {/* Reply input */}
      {showReply && (
        <div className="mt-2 flex gap-2">
          <input
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleReply()
              }
            }}
            placeholder={`Reply as ${userName}...`}
            className="flex-1 rounded border border-border bg-card px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
          <button
            onClick={handleReply}
            disabled={!replyText.trim() || submitting}
            className="rounded bg-cyan-500 px-2 py-1 text-xs text-black hover:bg-cyan-400 disabled:opacity-50"
          >
            Reply
          </button>
        </div>
      )}
    </div>
  )
}
