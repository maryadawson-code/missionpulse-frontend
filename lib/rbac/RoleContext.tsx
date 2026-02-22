// filepath: lib/rbac/RoleContext.tsx
'use client'

import { createContext, useContext } from 'react'
import type { ModulePermission } from './config'

export interface RoleContextValue {
  role: string
  permissions: Record<string, ModulePermission>
  displayName: string
  isExternal: boolean
  forceCUIWatermark: boolean
  classificationCeiling: string
}

const RoleContext = createContext<RoleContextValue | null>(null)

export function RoleProvider({
  value,
  children,
}: {
  value: RoleContextValue
  children: React.ReactNode
}) {
  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>
}

export function usePermissions(): RoleContextValue {
  const ctx = useContext(RoleContext)
  if (!ctx) {
    // Fail closed — deny all
    return {
      role: 'partner',
      permissions: {},
      displayName: 'Unknown',
      isExternal: true,
      forceCUIWatermark: false,
      classificationCeiling: 'PUBLIC',
    }
  }
  return ctx
}
