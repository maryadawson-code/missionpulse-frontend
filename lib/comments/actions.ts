'use server'

import { createClient } from '@/lib/supabase/server'

// ─── Types ───────────────────────────────────────────────────

export interface Comment {
  id: string
  sectionId: string
  parentId: string | null
  authorId: string
  authorName: string
  authorRole: string
  content: string
  resolved: boolean
  createdAt: string
  updatedAt: string
  replies: Comment[]
}

// ─── Actions ─────────────────────────────────────────────────

/**
 * Add a comment to a proposal section.
 */
export async function addComment(
  sectionId: string,
  userId: string,
  content: string,
  parentId: string | null = null
): Promise<{ comment: Comment | null; error?: string }> {
  const supabase = await createClient()

  // Get author info
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, role, company_id')
    .eq('id', userId)
    .single()

  if (!profile) return { comment: null, error: 'User not found' }

  const commentId = crypto.randomUUID()
  const now = new Date().toISOString()

  // Get the section's opportunity_id for the activity feed
  const { data: section } = await supabase
    .from('proposal_sections')
    .select('opportunity_id, section_title')
    .eq('id', sectionId)
    .single()

  // Store comment in activity_feed with structured metadata
  await supabase.from('activity_feed').insert({
    action_type: parentId ? 'comment_reply' : 'comment_added',
    entity_type: 'proposal_section',
    entity_id: sectionId,
    entity_name: section?.section_title ?? '',
    user_id: userId,
    user_name: profile.full_name ?? 'Unknown',
    company_id: profile.company_id ?? null,
    opportunity_id: section?.opportunity_id ?? null,
    description: content.slice(0, 200),
    metadata: JSON.parse(JSON.stringify({
      comment_id: commentId,
      parent_id: parentId,
      content,
      resolved: false,
    })),
  })

  // Also log to audit for immutability
  await supabase.from('audit_logs').insert({
    action: 'comment_added',
    table_name: 'proposal_sections',
    record_id: sectionId,
    user_id: userId,
    new_values: JSON.parse(JSON.stringify({
      comment_id: commentId,
      content: content.slice(0, 200),
      parent_id: parentId,
    })),
  })

  // Parse @role mentions and create notifications
  const roleMentions = content.match(/@(\w+)/g)
  if (roleMentions && profile.company_id) {
    for (const mention of roleMentions) {
      const roleName = mention.replace('@', '')
      const { data: mentionedProfiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', roleName)
        .eq('company_id', profile.company_id)

      if (mentionedProfiles) {
        for (const mp of mentionedProfiles) {
          if (mp.id === userId) continue
          await supabase.from('activity_feed').insert({
            action_type: 'comment_mention',
            entity_type: 'proposal_section',
            entity_id: sectionId,
            entity_name: section?.section_title ?? '',
            user_id: mp.id,
            user_name: mp.full_name ?? 'Unknown',
            company_id: profile.company_id,
            opportunity_id: section?.opportunity_id ?? null,
            description: `${profile.full_name ?? 'Someone'} mentioned @${roleName} in a comment`,
            metadata: JSON.parse(JSON.stringify({
              mentioned_by: profile.full_name ?? 'Unknown',
              role_mentioned: roleName,
              comment_preview: content.slice(0, 100),
              comment_id: commentId,
            })),
          })
        }
      }
    }
  }

  return {
    comment: {
      id: commentId,
      sectionId,
      parentId,
      authorId: userId,
      authorName: profile.full_name ?? 'Unknown',
      authorRole: profile.role ?? '',
      content,
      resolved: false,
      createdAt: now,
      updatedAt: now,
      replies: [],
    },
  }
}

/**
 * Get all comments for a proposal section.
 */
export async function getComments(sectionId: string): Promise<Comment[]> {
  const supabase = await createClient()

  const { data: entries } = await supabase
    .from('activity_feed')
    .select('*')
    .eq('entity_type', 'proposal_section')
    .eq('entity_id', sectionId)
    .in('action_type', ['comment_added', 'comment_reply', 'comment_resolved', 'comment_unresolve', 'comment_edited', 'comment_deleted'])
    .order('created_at', { ascending: true })

  if (!entries || entries.length === 0) return []

  // Get user profiles for role info
  const userIds = Array.from(new Set(entries.map((e) => e.user_id).filter(Boolean)))
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .in('id', userIds as string[])

  const profileMap = new Map<string, { name: string; role: string }>()
  if (profiles) {
    for (const p of profiles) {
      profileMap.set(p.id, { name: p.full_name ?? 'Unknown', role: p.role ?? '' })
    }
  }

  // Build comment tree
  const commentMap = new Map<string, Comment>()
  const rootComments: Comment[] = []

  for (const entry of entries) {
    const metadata = entry.metadata as Record<string, unknown> | null
    if (!metadata?.comment_id) continue

    const commentId = metadata.comment_id as string
    const parentId = (metadata.parent_id as string) ?? null
    const actionType = entry.action_type

    // Handle resolve/unresolve
    if (actionType === 'comment_resolved' || actionType === 'comment_unresolve') {
      const target = commentMap.get(commentId)
      if (target) {
        target.resolved = actionType === 'comment_resolved'
      }
      continue
    }

    // Handle edit — update content on existing comment
    if (actionType === 'comment_edited') {
      const target = commentMap.get(commentId)
      if (target) {
        target.content = (metadata.content as string) ?? target.content
        target.updatedAt = entry.created_at ?? target.updatedAt
      }
      continue
    }

    // Handle delete — remove from map and root/reply lists
    if (actionType === 'comment_deleted') {
      const target = commentMap.get(commentId)
      if (target) {
        if (target.parentId) {
          const parent = commentMap.get(target.parentId)
          if (parent) {
            parent.replies = parent.replies.filter((r) => r.id !== commentId)
          }
        } else {
          const idx = rootComments.findIndex((c) => c.id === commentId)
          if (idx !== -1) rootComments.splice(idx, 1)
        }
        commentMap.delete(commentId)
      }
      continue
    }

    const authorProfile = profileMap.get(entry.user_id ?? '') ?? { name: entry.user_name ?? 'Unknown', role: '' }

    const comment: Comment = {
      id: commentId,
      sectionId,
      parentId,
      authorId: entry.user_id ?? '',
      authorName: authorProfile.name,
      authorRole: authorProfile.role,
      content: (metadata.content as string) ?? '',
      resolved: (metadata.resolved as boolean) ?? false,
      createdAt: entry.created_at ?? '',
      updatedAt: entry.created_at ?? '',
      replies: [],
    }

    commentMap.set(commentId, comment)

    if (parentId) {
      const parent = commentMap.get(parentId)
      if (parent) {
        parent.replies.push(comment)
      }
    } else {
      rootComments.push(comment)
    }
  }

  return rootComments
}

/**
 * Resolve or unresolve a comment thread.
 */
export async function resolveComment(
  sectionId: string,
  commentId: string,
  userId: string,
  resolved: boolean
): Promise<{ success: boolean }> {
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, company_id')
    .eq('id', userId)
    .single()

  const { data: section } = await supabase
    .from('proposal_sections')
    .select('opportunity_id, section_title')
    .eq('id', sectionId)
    .single()

  await supabase.from('activity_feed').insert({
    action_type: resolved ? 'comment_resolved' : 'comment_unresolve',
    entity_type: 'proposal_section',
    entity_id: sectionId,
    entity_name: section?.section_title ?? '',
    user_id: userId,
    user_name: profile?.full_name ?? 'Unknown',
    company_id: profile?.company_id ?? null,
    opportunity_id: section?.opportunity_id ?? null,
    description: resolved ? 'Resolved comment thread' : 'Reopened comment thread',
    metadata: JSON.parse(JSON.stringify({
      comment_id: commentId,
      resolved,
    })),
  })

  return { success: true }
}

/**
 * Edit a comment (author only).
 */
export async function editComment(
  sectionId: string,
  commentId: string,
  userId: string,
  newContent: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, company_id')
    .eq('id', userId)
    .single()

  if (!profile) return { success: false, error: 'User not found' }

  const { data: section } = await supabase
    .from('proposal_sections')
    .select('opportunity_id, section_title')
    .eq('id', sectionId)
    .single()

  // Verify the user is the original comment author by checking activity_feed
  const { data: original } = await supabase
    .from('activity_feed')
    .select('user_id, metadata')
    .eq('entity_id', sectionId)
    .in('action_type', ['comment_added', 'comment_reply'])
    .order('created_at', { ascending: true })

  const isAuthor = original?.some((entry) => {
    const meta = entry.metadata as Record<string, unknown> | null
    return meta?.comment_id === commentId && entry.user_id === userId
  })

  if (!isAuthor) return { success: false, error: 'Only the comment author can edit' }

  await supabase.from('activity_feed').insert({
    action_type: 'comment_edited',
    entity_type: 'proposal_section',
    entity_id: sectionId,
    entity_name: section?.section_title ?? '',
    user_id: userId,
    user_name: profile.full_name ?? 'Unknown',
    company_id: profile.company_id ?? null,
    opportunity_id: section?.opportunity_id ?? null,
    description: newContent.slice(0, 200),
    metadata: JSON.parse(JSON.stringify({
      comment_id: commentId,
      content: newContent,
    })),
  })

  await supabase.from('audit_logs').insert({
    action: 'comment_edited',
    table_name: 'proposal_sections',
    record_id: sectionId,
    user_id: userId,
    new_values: JSON.parse(JSON.stringify({
      comment_id: commentId,
      content: newContent.slice(0, 200),
    })),
  })

  return { success: true }
}

/**
 * Delete a comment (author only, soft-delete via activity_feed).
 */
export async function deleteComment(
  sectionId: string,
  commentId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, company_id')
    .eq('id', userId)
    .single()

  if (!profile) return { success: false, error: 'User not found' }

  const { data: section } = await supabase
    .from('proposal_sections')
    .select('opportunity_id, section_title')
    .eq('id', sectionId)
    .single()

  // Verify author
  const { data: original } = await supabase
    .from('activity_feed')
    .select('user_id, metadata')
    .eq('entity_id', sectionId)
    .in('action_type', ['comment_added', 'comment_reply'])
    .order('created_at', { ascending: true })

  const isAuthor = original?.some((entry) => {
    const meta = entry.metadata as Record<string, unknown> | null
    return meta?.comment_id === commentId && entry.user_id === userId
  })

  if (!isAuthor) return { success: false, error: 'Only the comment author can delete' }

  await supabase.from('activity_feed').insert({
    action_type: 'comment_deleted',
    entity_type: 'proposal_section',
    entity_id: sectionId,
    entity_name: section?.section_title ?? '',
    user_id: userId,
    user_name: profile.full_name ?? 'Unknown',
    company_id: profile.company_id ?? null,
    opportunity_id: section?.opportunity_id ?? null,
    description: 'Deleted comment',
    metadata: JSON.parse(JSON.stringify({
      comment_id: commentId,
    })),
  })

  await supabase.from('audit_logs').insert({
    action: 'comment_deleted',
    table_name: 'proposal_sections',
    record_id: sectionId,
    user_id: userId,
    new_values: JSON.parse(JSON.stringify({
      comment_id: commentId,
    })),
  })

  return { success: true }
}

/**
 * Get comment count for a section (for badges).
 */
export async function getCommentCount(sectionId: string): Promise<number> {
  const supabase = await createClient()

  const { count } = await supabase
    .from('activity_feed')
    .select('*', { count: 'exact', head: true })
    .eq('entity_type', 'proposal_section')
    .eq('entity_id', sectionId)
    .in('action_type', ['comment_added', 'comment_reply'])

  return count ?? 0
}
