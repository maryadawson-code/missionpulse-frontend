// filepath: lib/rbac/server.ts
// Server-only RBAC utilities. Imported by Server Components, Server Actions, Route Handlers.
// NEVER import this from a 'use client' file.

import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { redirect } from 'next/navigation'
import {
  type ConfigRoleId,
  type ModuleId,
  type ModulePermission,
  resolveRole,
  getModulePermission,
  getRoleConfig,
} from './config'

// ---------------------------------------------------------------------------
// Server Supabase client (per-request)
// ---------------------------------------------------------------------------
function createServerSupabase() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from Server Component — cookies are read-only.
            // Session refresh handled by middleware.
          }
        },
      },
    }
  )
}

// ---------------------------------------------------------------------------
// getCurrentRole — fetches the authenticated user's role on the server
// ---------------------------------------------------------------------------
export interface ServerRoleInfo {
  userId: string
  dbRole: string
  role: ConfigRoleId
  displayName: string
  isInternal: boolean
}

/**
 * Get the current user's role. Redirects to /login if not authenticated.
 * Use in Server Components and Server Actions.
 */
export async function getCurrentRole(): Promise<ServerRoleInfo> {
  const supabase = createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const dbRole = profile?.role ?? 'viewer'
  const resolved = resolveRole(dbRole)
  const config = getRoleConfig(resolved)

  return {
    userId: user.id,
    dbRole,
    role: resolved,
    displayName: config?.displayName ?? resolved.replace(/_/g, ' '),
    isInternal: config?.type === 'internal',
  }
}

// ---------------------------------------------------------------------------
// requireModuleAccess — gate for Server Components / Actions
// ---------------------------------------------------------------------------

/**
 * Asserts the current user has at least `require` level access to `moduleId`.
 * Redirects to /dashboard (not "Access Denied") if unauthorized.
 * Invisible RBAC: user never sees why they were redirected.
 */
export async function requireModuleAccess(
  moduleId: ModuleId,
  require: 'render' | 'view' | 'edit' = 'view'
): Promise<ServerRoleInfo> {
  const roleInfo = await getCurrentRole()
  const perm: ModulePermission = getModulePermission(roleInfo.dbRole, moduleId)

  let allowed = false
  switch (require) {
    case 'render':
      allowed = perm.shouldRender
      break
    case 'view':
      allowed = perm.shouldRender && perm.canView
      break
    case 'edit':
      allowed = perm.shouldRender && perm.canView && perm.canEdit
      break
  }

  if (!allowed) {
    // Invisible RBAC: redirect to dashboard, not an error page
    redirect('/')
  }

  return roleInfo
}

// ---------------------------------------------------------------------------
// requireAdmin — shortcut for admin-only operations
// ---------------------------------------------------------------------------

/**
 * Asserts the current user has admin module access.
 * Redirects to /dashboard if not.
 */
export async function requireAdmin(): Promise<ServerRoleInfo> {
  return requireModuleAccess('admin', 'view')
}

// ---------------------------------------------------------------------------
// requireSensitiveAccess — for CUI-protected modules (pricing, blackhat)
// ---------------------------------------------------------------------------

/**
 * Asserts the current user can access CUI-protected content.
 * Checks security.canViewAllClassifications or module-specific shouldRender.
 */
export async function requireSensitiveAccess(
  moduleId: 'pricing' | 'blackhat'
): Promise<ServerRoleInfo> {
  return requireModuleAccess(moduleId, 'view')
}
