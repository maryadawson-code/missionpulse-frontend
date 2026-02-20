// filepath: app/(dashboard)/layout.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { ToastContainer } from '@/components/ui/Toast'
import rbacConfig from '@/lib/rbac/config'

/**
 * Dashboard layout — Server Component.
 *
 * 1. Verifies auth (redirect to /login if no session)
 * 2. Fetches user profile for role
 * 3. Computes allowed modules from RBAC config
 * 4. Passes to DashboardShell (client) for sidebar/topbar rendering
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, role, avatar_url')
    .eq('id', user.id)
    .single()

  const userRole = profile?.role ?? 'viewer'
  const userName = profile?.full_name ?? null
  const userEmail = profile?.email ?? user.email ?? ''
  const avatarUrl = profile?.avatar_url ?? null

  // Compute allowed modules from RBAC config
  const roleConfig = rbacConfig.roles[userRole as keyof typeof rbacConfig.roles]
  let allowedModules: string[] = []

  if (roleConfig && 'modules' in roleConfig) {
    const modules = roleConfig.modules as Record<
      string,
      { shouldRender?: boolean }
    >
    allowedModules = Object.entries(modules)
      .filter(([, config]) => config.shouldRender === true)
      .map(([key]) => key)
  }

  // Fallback: if no role config found, show minimum nav
  if (allowedModules.length === 0) {
    allowedModules = ['dashboard', 'settings']
  }

  // All roles get settings access
  if (!allowedModules.includes('settings')) {
    allowedModules.push('settings')
  }

  return (
    <>
      <DashboardShell
        allowedModules={allowedModules}
        userName={userName}
        userEmail={userEmail}
        avatarUrl={avatarUrl}
      >
        {children}
      </DashboardShell>
      <ToastContainer />
    </>
  )
}
