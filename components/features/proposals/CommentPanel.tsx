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
  Pencil,
  Trash2,
  X,
  Check,
} from 'lucide-react'
import {
  addComment,
  getComments,
  resolveComment,
  editComment,
  deleteComment,
  type Comment,
} from '@/lib/comments/actions'
import { addToast } from '@/components/ui/Toast'
import { createClient } from '@/lib/supabase/client'

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

  // Realtime subscription — reload comments on any change to this section
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`comments_${sectionId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'activity_feed' },
        (payload) => {
          const entry = payload.new as Record<string, unknown>
          if (entry.entity_id !== sectionId) return
          const actionType = entry.action_type as string
          if (
            actionType === 'comment_added' ||
            actionType === 'comment_reply' ||
            actionType === 'comment_edited' ||
            actionType === 'comment_deleted' ||
            actionType === 'comment_resolved' ||
            actionType === 'comment_unresolve'
          ) {
            loadComments()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [sectionId, loadComments])

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
                onEdit={(commentId, newContent) => {
                  setComments((prev) =>
                    prev.map((c) =>
                      c.id === commentId
                        ? { ...c, content: newContent, updatedAt: new Date().toISOString() }
                        : {
                            ...c,
                            replies: c.replies.map((r) =>
                              r.id === commentId
                                ? { ...r, content: newContent, updatedAt: new Date().toISOString() }
                                : r
                            ),
                          }
                    )
                  )
                }}
                onDelete={(commentId) => {
                  setComments((prev) =>
                    prev
                      .filter((c) => c.id !== commentId)
                      .map((c) => ({
                        ...c,
                        replies: c.replies.filter((r) => r.id !== commentId),
                      }))
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
                        onEdit={(commentId, newContent) => {
                          setComments((prev) =>
                            prev.map((c) =>
                              c.id === commentId
                                ? { ...c, content: newContent, updatedAt: new Date().toISOString() }
                                : {
                                    ...c,
                                    replies: c.replies.map((r) =>
                                      r.id === commentId
                                        ? { ...r, content: newContent, updatedAt: new Date().toISOString() }
                                        : r
                                    ),
                                  }
                            )
                          )
                        }}
                        onDelete={(commentId) => {
                          setComments((prev) =>
                            prev
                              .filter((c) => c.id !== commentId)
                              .map((c) => ({
                                ...c,
                                replies: c.replies.filter((r) => r.id !== commentId),
                              }))
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
  onEdit,
  onDelete,
}: {
  comment: Comment
  sectionId: string
  userId: string
  userName: string
  onReply: (_reply: Comment) => void
  onResolve: (_resolved: boolean) => void
  onEdit: (_commentId: string, _newContent: string) => void
  onDelete: (_commentId: string) => void
}) {
  const [replyText, setReplyText] = useState('')
  const [showReply, setShowReply] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')

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

  const handleEdit = async (commentId: string) => {
    if (!editText.trim()) return
    setSubmitting(true)
    const result = await editComment(sectionId, commentId, userId, editText.trim())
    if (result.success) {
      onEdit(commentId, editText.trim())
      setEditingId(null)
      setEditText('')
    } else {
      addToast('error', result.error ?? 'Failed to edit')
    }
    setSubmitting(false)
  }

  const handleDelete = async (commentId: string) => {
    setSubmitting(true)
    const result = await deleteComment(sectionId, commentId, userId)
    if (result.success) {
      onDelete(commentId)
      addToast('success', 'Comment deleted')
    } else {
      addToast('error', result.error ?? 'Failed to delete')
    }
    setSubmitting(false)
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
      {editingId === comment.id ? (
        <div className="space-y-1.5">
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="w-full resize-none rounded border border-border bg-card px-2 py-1 text-xs text-foreground focus:border-primary focus:outline-none"
            rows={2}
          />
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleEdit(comment.id)}
              disabled={submitting || !editText.trim()}
              className="flex items-center gap-1 rounded bg-cyan-500 px-2 py-0.5 text-[10px] text-black hover:bg-cyan-400 disabled:opacity-50"
            >
              <Check className="h-3 w-3" />
              Save
            </button>
            <button
              onClick={() => { setEditingId(null); setEditText('') }}
              className="flex items-center gap-1 rounded border border-border px-2 py-0.5 text-[10px] text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <p className="text-xs text-foreground leading-relaxed">
          {renderContent(comment.content)}
        </p>
      )}

      {/* Actions */}
      <div className="mt-2 flex items-center gap-3">
        <button
          onClick={() => setShowReply(!showReply)}
          className="text-[10px] text-muted-foreground hover:text-foreground"
        >
          Reply
        </button>
        <button
          onClick={handleResolve}
          className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground"
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
        {comment.authorId === userId && !comment.resolved && (
          <>
            <button
              onClick={() => { setEditingId(comment.id); setEditText(comment.content) }}
              className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground"
            >
              <Pencil className="h-3 w-3" />
              Edit
            </button>
            <button
              onClick={() => handleDelete(comment.id)}
              disabled={submitting}
              className="flex items-center gap-1 text-[10px] text-red-400 hover:text-red-300 disabled:opacity-50"
            >
              <Trash2 className="h-3 w-3" />
              Delete
            </button>
          </>
        )}
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
