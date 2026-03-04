/**
 * Workspace Manager — Multi-Workspace Support
 * Sprint 32 (T-32.3) — Phase L v2.0
 *
 * Manages workspace lifecycle and user workspace switching.
 * Workspaces provide data isolation for divisions, subsidiaries,
 * and joint ventures within a single company.
 *
 * © 2026 Mission Meets Tech
 */

import { createClient } from '@/lib/supabase/server'

// ─── Types ──────────────────────────────────────────────────────

export interface Workspace {
  id: string
  name: string
  domain: string | null
  subscriptionTier: string | null
  isActive: boolean
  parentCompanyId: string
  createdBy: string | null
  createdAt: string
}

// ─── Public API ─────────────────────────────────────────────────

/**
 * Create a new workspace for a company.
 */
export async function createWorkspace(
  companyId: string,
  name: string,
  userId: string
): Promise<{ success: boolean; workspaceId?: string; error?: string }> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('workspaces')
    .insert({
      parent_company_id: companyId,
      name,
      is_active: true,
      created_by: userId,
    })
    .select('id')
    .single()

  if (error) return { success: false, error: error.message }
  return { success: true, workspaceId: data?.id }
}

/**
 * Archive a workspace (soft delete via is_active flag).
 */
export async function archiveWorkspace(
  workspaceId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('workspaces')
    .update({ is_active: false })
    .eq('id', workspaceId)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

/**
 * Switch a user's active workspace.
 * Stored in profiles.preferences JSONB field.
 */
export async function switchWorkspace(
  userId: string,
  workspaceId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // Fetch current preferences
  const { data: profile } = await supabase
    .from('profiles')
    .select('preferences')
    .eq('id', userId)
    .single()

  const prefs = (profile?.preferences ?? {}) as Record<string, unknown>
  prefs.active_workspace_id = workspaceId

  const { error } = await supabase
    .from('profiles')
    .update({ preferences: JSON.parse(JSON.stringify(prefs)) })
    .eq('id', userId)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

/**
 * Get the active workspace for a user.
 */
export async function getActiveWorkspace(
  userId: string
): Promise<Workspace | null> {
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('preferences, company_id')
    .eq('id', userId)
    .single()

  if (!profile) return null

  const prefs = (profile.preferences ?? {}) as Record<string, unknown>
  const activeId = prefs.active_workspace_id as string | undefined

  if (!activeId) return null

  const { data } = await supabase
    .from('workspaces')
    .select('*')
    .eq('id', activeId)
    .eq('is_active', true)
    .single()

  if (!data) return null

  return {
    id: data.id,
    name: data.name,
    domain: data.domain,
    subscriptionTier: data.subscription_tier,
    isActive: data.is_active,
    parentCompanyId: data.parent_company_id,
    createdBy: data.created_by,
    createdAt: data.created_at,
  }
}

/**
 * List all active workspaces for a company.
 */
export async function listWorkspaces(
  companyId: string
): Promise<Workspace[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('workspaces')
    .select('*')
    .eq('parent_company_id', companyId)
    .eq('is_active', true)
    .order('created_at', { ascending: true })

  return (data ?? []).map(w => ({
    id: w.id,
    name: w.name,
    domain: w.domain,
    subscriptionTier: w.subscription_tier,
    isActive: w.is_active,
    parentCompanyId: w.parent_company_id,
    createdBy: w.created_by,
    createdAt: w.created_at,
  }))
}
