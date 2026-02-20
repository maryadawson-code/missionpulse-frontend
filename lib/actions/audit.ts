// FILE: lib/actions/audit.ts
// SPRINT: 2 — Audit & Activity Logging
// SECURITY: NIST 800-53 Rev 5 — AU-3 (Content of Audit Records)
// AUTHORITY: PHASE_2_RULES.md §3 (Audit Logging), CURRENT_STATE.md §4

'use server'

import { createClient as createServerClient } from '@/lib/supabase/server'

// ────────────────────────────────────────────────────────────
// TYPES
// ────────────────────────────────────────────────────────────

interface ActivityLogEntry {
  action: string
  resource_type: string
  resource_id?: string
  details?: Record<string, unknown>
}

interface AuditResult {
  success: boolean
  error?: string
}

// ────────────────────────────────────────────────────────────
// ACTIVITY LOG (user-visible actions)
// ────────────────────────────────────────────────────────────

/**
 * Log a user-visible activity to the activity_log table.
 * Called after every successful mutation (create, update, archive).
 *
 * Schema: activity_log table (unverified — graceful fail if missing columns).
 */
export async function logActivity(entry: ActivityLogEntry): Promise<AuditResult> {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'No authenticated user' }
    }

    const { error } = await (supabase as any).from('activity_log').insert({
      user_id: user.id,
      action: entry.action,
      resource_type: entry.resource_type,
      resource_id: entry.resource_id ?? null,
      details: entry.details ?? {},
      created_at: new Date().toISOString(),
    })

    if (error) {
      // Non-blocking: log failure but don't break the parent operation
      console.error('[audit] activity_log insert failed:', error.message)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    console.error('[audit] unexpected error:', err)
    return { success: false, error: 'Unexpected audit error' }
  }
}

// ────────────────────────────────────────────────────────────
// AUDIT LOG (immutable compliance records — AU-9)
// ────────────────────────────────────────────────────────────

/**
 * Log an immutable audit record.
 * The `audit_logs_immutable` trigger prevents UPDATE/DELETE on this table.
 * Use for: CUI access, gate decisions, role changes, data exports.
 */
export async function logAudit(entry: {
  event_type: string
  resource_type: string
  resource_id?: string
  details?: Record<string, unknown>
}): Promise<AuditResult> {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'No authenticated user' }
    }

    const { error } = await (supabase as any).from('audit_logs').insert({
      user_id: user.id,
      event_type: entry.event_type,
      resource_type: entry.resource_type,
      resource_id: entry.resource_id ?? null,
      details: entry.details ?? {},
    })

    if (error) {
      console.error('[audit] audit_logs insert failed:', error.message)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    console.error('[audit] unexpected error:', err)
    return { success: false, error: 'Unexpected audit error' }
  }
}

// ────────────────────────────────────────────────────────────
// RECENT ACTIVITY (read — for Dashboard feed)
// ────────────────────────────────────────────────────────────

export interface ActivityItem {
  id: string
  user_id: string
  action: string
  resource_type: string
  resource_id: string | null
  details: Record<string, unknown>
  created_at: string
}

/**
 * Fetch recent activity for the Dashboard feed.
 * RLS ensures users only see activities they have access to.
 */
export async function getRecentActivity(limit = 10): Promise<{
  data: ActivityItem[]
  error?: string
}> {
  try {
    const supabase = await createServerClient()

    const { data, error } = await supabase
      .from('activity_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('[audit] getRecentActivity failed:', error.message)
      return { data: [], error: error.message }
    }

    return { data: (data as ActivityItem[]) ?? [] }
  } catch (err) {
    console.error('[audit] unexpected error:', err)
    return { data: [], error: 'Failed to load activity' }
  }
}
