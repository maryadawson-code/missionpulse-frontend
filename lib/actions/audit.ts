// FILE: lib/actions/audit.ts
// SPRINT: 2 — Audit & Activity Logging
// SECURITY: NIST 800-53 Rev 5 — AU-3 (Content of Audit Records)
// AUTHORITY: PHASE_2_RULES.md §3 (Audit Logging), CURRENT_STATE.md §4

'use server'

import { createClient as createServerClient } from '@/lib/supabase/server'
import { createLogger } from '@/lib/logging/logger'
import type { Database } from '@/lib/supabase/database.types'

const log = createLogger('audit')

// ── Supabase Json type alias ──
type Json = Database['public']['Tables']['activity_log']['Row']['details']

// ──────────────────────────────────────────────────────────────
// TYPES
// ──────────────────────────────────────────────────────────────

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

// ──────────────────────────────────────────────────────────────
// ACTIVITY LOG (user-visible actions)
// ──────────────────────────────────────────────────────────────

/**
 * Log a user-visible activity to the activity_log table.
 * Called after every successful mutation (create, update, archive).
 *
 * Schema: activity_log has columns:
 *   action, details (Json), id, ip_address, timestamp, user_name, user_role
 *
 * All metadata (user_id, resource_type, resource_id) is packed into `details`.
 */
export async function logActivity(entry: ActivityLogEntry): Promise<AuditResult> {
  try {
    const supabase = createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'No authenticated user' }
    }

    // Fetch profile for user_name and user_role
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, role')
      .eq('id', user.id)
      .single()

    const detailsPayload: Record<string, unknown> = {
      user_id: user.id,
      resource_type: entry.resource_type,
      ...(entry.resource_id ? { resource_id: entry.resource_id } : {}),
      ...(entry.details ?? {}),
    }

    const { error } = await supabase
      .from('activity_log')
      .insert({
        action: entry.action,
        details: detailsPayload as unknown as Json,
        user_name: profile?.full_name ?? user.email ?? null,
        user_role: profile?.role ?? null,
        timestamp: new Date().toISOString(),
      })

    if (error) {
      // Non-blocking: log failure but don't break the parent operation
      log.error('activity_log insert failed', { error: error.message })
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    log.error('Unexpected error', { error: err instanceof Error ? err.message : String(err) })
    return { success: false, error: 'Unexpected audit error' }
  }
}

// ──────────────────────────────────────────────────────────────
// AUDIT LOG (immutable compliance records — AU-9)
// ──────────────────────────────────────────────────────────────

/**
 * Log an immutable audit record.
 * The `audit_logs_immutable` trigger prevents UPDATE/DELETE on this table.
 * Use for: CUI access, gate decisions, role changes, data exports.
 *
 * NOTE: audit_logs schema may differ from activity_log.
 * All event metadata is packed into `details` for forward compatibility.
 */
export async function logAudit(entry: {
  event_type: string
  resource_type: string
  resource_id?: string
  details?: Record<string, unknown>
}): Promise<AuditResult> {
  try {
    const supabase = createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'No authenticated user' }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, role')
      .eq('id', user.id)
      .single()

    const detailsPayload: Record<string, unknown> = {
      user_id: user.id,
      user_name: profile?.full_name ?? user.email ?? null,
      event_type: entry.event_type,
      resource_type: entry.resource_type,
      ...(entry.resource_id ? { resource_id: entry.resource_id } : {}),
      ...(entry.details ?? {}),
    }

    const { error } = await supabase
      .from('audit_logs')
      .insert({
        action: entry.event_type,
        user_id: user.id,
        metadata: detailsPayload as unknown as Json,
        user_role: profile?.role ?? null,
      })

    if (error) {
      log.error('audit_logs insert failed', { error: error.message })
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    log.error('Unexpected error', { error: err instanceof Error ? err.message : String(err) })
    return { success: false, error: 'Unexpected audit error' }
  }
}

// ──────────────────────────────────────────────────────────────
// RECENT ACTIVITY (read — for Dashboard feed)
// ──────────────────────────────────────────────────────────────

type ActivityLogRow = Database['public']['Tables']['activity_log']['Row']

export interface ActivityItem {
  id: string
  action: string
  user_name: string | null
  user_role: string | null
  details: Json
  timestamp: string | null
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
    const supabase = createServerClient()

    const { data, error } = await supabase
      .from('activity_log')
      .select('id, action, user_name, user_role, details, timestamp')
      .order('timestamp', { ascending: false })
      .limit(limit)

    if (error) {
      log.error('getRecentActivity failed', { error: error.message })
      return { data: [], error: error.message }
    }

    const items: ActivityItem[] = (data ?? []).map((row: Pick<ActivityLogRow, 'id' | 'action' | 'user_name' | 'user_role' | 'details' | 'timestamp'>) => ({
      id: row.id,
      action: row.action,
      user_name: row.user_name,
      user_role: row.user_role,
      details: row.details,
      timestamp: row.timestamp,
    }))

    return { data: items }
  } catch (err) {
    log.error('Unexpected error', { error: err instanceof Error ? err.message : String(err) })
    return { data: [], error: 'Failed to load activity' }
  }
}
