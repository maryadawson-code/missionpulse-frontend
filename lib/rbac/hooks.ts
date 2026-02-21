// filepath: lib/rbac/hooks.ts
'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import {
  type ConfigRoleId,
  type ModuleId,
  type ModulePermission,
  type NavItem,
  resolveRole,
  getModulePermission,
  getVisibleNav,
  getRoleConfig,
  isInternalRole,
} from './config'

// ---------------------------------------------------------------------------
// Browser Supabase client (singleton)
// ---------------------------------------------------------------------------
function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// ---------------------------------------------------------------------------
// useRole — fetches the current user's DB role and resolves to ConfigRoleId
// ---------------------------------------------------------------------------
interface UseRoleReturn {
  /** Raw DB value from profiles.role */
  dbRole: string | null
  /** Resolved canonical config role */
  role: ConfigRoleId
  /** Display name for the resolved role */
  displayName: string
  /** Loading state — true until first fetch completes */
  loading: boolean
  /** Whether the resolved role is internal */
  isInternal: boolean
}

export function useRole(): UseRoleReturn {
  const [dbRole, setDbRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function fetchRole() {
      const supabase = getSupabase()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user || cancelled) {
        setLoading(false)
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!cancelled) {
        setDbRole(profile?.role ?? null)
        setLoading(false)
      }
    }

    fetchRole()
    return () => {
      cancelled = true
    }
  }, [])

  const resolved = resolveRole(dbRole)
  const config = getRoleConfig(resolved)

  return {
    dbRole,
    role: resolved,
    displayName: config?.displayName ?? "Unknown",
    loading,
    isInternal: isInternalRole(dbRole ?? "partner"),
  }
}

// ---------------------------------------------------------------------------
// useModuleAccess — returns permissions for a specific module
// ---------------------------------------------------------------------------
interface UseModuleAccessReturn {
  /** Should this module's UI be rendered at all? (Invisible RBAC) */
  shouldRender: boolean
  /** Can the user view content in this module? */
  canView: boolean
  /** Can the user edit/mutate in this module? */
  canEdit: boolean
  /** Scope restriction (external users) */
  scopeRestriction?: string
  /** Loading — permissions unknown until role resolves */
  loading: boolean
}

export function useModuleAccess(moduleId: ModuleId): UseModuleAccessReturn {
  const { dbRole, loading } = useRole()

  if (loading) {
    // Fail closed: render nothing while loading
    return {
      shouldRender: false,
      canView: false,
      canEdit: false,
      loading: true,
    }
  }

  const perm: ModulePermission = getModulePermission(dbRole ?? "partner", moduleId)

  return {
    shouldRender: perm.shouldRender,
    canView: perm.canView,
    canEdit: perm.canEdit,
    scopeRestriction: perm.scopeRestriction,
    loading: false,
  }
}

// ---------------------------------------------------------------------------
// useVisibleNav — returns filtered nav arrays for sidebar rendering
// ---------------------------------------------------------------------------
interface UseVisibleNavReturn {
  primary: NavItem[]
  secondary: NavItem[]
  admin: NavItem[]
  loading: boolean
}

export function useVisibleNav(): UseVisibleNavReturn {
  const { dbRole, loading } = useRole()

  if (loading) {
    return { primary: [], secondary: [], admin: [], loading: true }
  }

  return {
    ...getVisibleNav(dbRole ?? "partner"),
    loading: false,
  }
}
