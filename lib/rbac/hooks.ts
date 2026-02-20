'use client'

/**
 * RBAC Hooks
 * useRole() — get current user's role config
 * useModuleAccess() — check module permissions
 * © 2026 Mission Meets Tech
 */
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { UserRole, ModuleId } from '@/lib/supabase/types'
import { ROLES, type RoleConfig, type ModulePermission } from './config'

const ROLE_TO_CONFIG: Record<string, string> = {
  CEO: 'executive',
  COO: 'operations',
  CAP: 'capture_manager',
  PM: 'proposal_manager',
  SA: 'solution_architect',
  FIN: 'pricing_lead',
  CON: 'contracts_lead',
  DEL: 'delivery_lead',
  QA: 'quality_lead',
  Partner: 'partner',
  Admin: 'executive',
  executive: 'executive',
  operations: 'operations',
  capture_manager: 'capture_manager',
  proposal_manager: 'proposal_manager',
  solution_architect: 'solution_architect',
  pricing_lead: 'pricing_lead',
  contracts_lead: 'contracts_lead',
  delivery_lead: 'delivery_lead',
  quality_lead: 'quality_lead',
  author: 'author',
  partner: 'partner',
  viewer: 'viewer',
  admin: 'executive',
}

const DEFAULT_CONFIG = ROLES.viewer

/** Get the RBAC config for the current user's role */
export function useRole() {
  const [roleConfig, setRoleConfig] = useState<RoleConfig>(DEFAULT_CONFIG)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchRole() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setRoleConfig(DEFAULT_CONFIG)
        setLoading(false)
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      const dbRole = (profile?.role ?? 'Partner') as UserRole
      const configKey = ROLE_TO_CONFIG[dbRole] ?? 'viewer'
      setRoleConfig(ROLES[configKey] ?? DEFAULT_CONFIG)
      setLoading(false)
    }

    fetchRole()
  }, [])

  return { roleConfig, loading }
}

/** Check if current role can access a specific module */
export function useModuleAccess(moduleId: ModuleId): ModulePermission & { loading: boolean } {
  const { roleConfig, loading } = useRole()

  const permission = roleConfig.modules[moduleId] ?? {
    shouldRender: false,
    canView: false,
    canEdit: false,
  }

  return { ...permission, loading }
}
