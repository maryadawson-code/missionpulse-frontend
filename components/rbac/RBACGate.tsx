// filepath: components/rbac/RBACGate.tsx
'use client'

import { type ReactNode } from 'react'
import { type ModuleId, type ModulePermission, getModulePermission } from '@/lib/rbac/config'
import { useRole } from '@/lib/rbac/hooks'

// ---------------------------------------------------------------------------
// RBACGate — Invisible RBAC enforcement
// ---------------------------------------------------------------------------
// Design principle: "Components that users cannot access MUST NOT render in the DOM."
// No "Access Denied" messages. The feature simply doesn't exist for that user.

interface RBACGateProps {
  /** The module this gate protects */
  moduleId: ModuleId
  /** Minimum permission level required. Default: 'view' */
  require?: 'render' | 'view' | 'edit'
  /** Children rendered ONLY if permission check passes */
  children: ReactNode
  /** Optional fallback rendered while role is loading. Default: null (invisible). */
  fallback?: ReactNode
}

export function RBACGate({
  moduleId,
  require = 'view',
  children,
  fallback = null,
}: RBACGateProps) {
  const { dbRole, loading } = useRole()

  // Fail closed while loading — render nothing (or explicit fallback)
  if (loading) return <>{fallback}</>

  // Fail closed if no role resolved — render nothing
  if (!dbRole) return null

  const perm: ModulePermission = getModulePermission(dbRole, moduleId)

  // Permission ladder: edit > view > render
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

  // Invisible RBAC: if not allowed, return null. No DOM footprint.
  if (!allowed) return null

  return <>{children}</>
}

// ---------------------------------------------------------------------------
// CUIBanner — classification banner for CUI-protected modules
// ---------------------------------------------------------------------------

interface CUIBannerProps {
  classification: string // e.g. "CUI // SP-PROPIN"
}

export function CUIBanner({ classification }: CUIBannerProps) {
  return (
    <div
      className="w-full bg-amber-900/30 border border-amber-500/40 text-amber-200 text-center text-xs font-mono py-1.5 px-4"
      role="status"
      aria-label={`Controlled Unclassified Information: ${classification}`}
    >
      {classification}
    </div>
  )
}

// ---------------------------------------------------------------------------
// AIFooter — required on all AI-generated content
// ---------------------------------------------------------------------------

export function AIFooter() {
  return (
    <p className="text-xs text-slate-500 mt-4 font-mono">
      AI GENERATED — REQUIRES HUMAN REVIEW
    </p>
  )
}
