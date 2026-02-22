// filepath: app/(dashboard)/admin/page.tsx

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { resolveRole, hasPermission } from '@/lib/rbac/config'
import { AdminUserList } from '@/components/modules/AdminUserList'

const ADMIN_LINKS = [
  { href: '/admin/users', label: 'User Management', desc: 'Manage user accounts and roles', icon: '👥' },
  { href: '/admin/settings', label: 'Company Settings', desc: 'Company profile and configuration', icon: '🏢' },
  { href: '/admin/ai-providers', label: 'AI Providers', desc: 'Configure AI model providers', icon: '🤖' },
  { href: '/admin/ai-usage', label: 'AI Usage', desc: 'Token usage and cost tracking', icon: '📊' },
  { href: '/admin/fine-tune', label: 'Fine-Tuning', desc: 'Model fine-tuning configuration', icon: '🎛' },
  { href: '/admin/pilots', label: 'Pilot Programs', desc: 'Manage pilot deployments', icon: '🚀' },
]

export default async function AdminPage() {
  const supabase = await createClient()

  // Auth + RBAC gate
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = profile?.role ?? 'partner'
  const resolved = resolveRole(role)

  // Invisible RBAC — redirect if not admin
  if (!hasPermission(resolved, 'admin', 'canView')) {
    redirect('/dashboard')
  }

  // Fetch all users (admin has elevated access via RLS)
  const { data: users, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, company, status, last_login, created_at')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Admin Console</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage users and system settings
        </p>
      </div>

      {/* Sub-page navigation grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {ADMIN_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex items-start gap-3 rounded-lg border border-border bg-surface px-4 py-4 hover:border-cyan/40 hover:bg-elevated transition-colors group"
          >
            <span className="text-lg mt-0.5">{link.icon}</span>
            <div>
              <p className="text-sm font-medium text-white group-hover:text-cyan transition-colors">
                {link.label}
              </p>
              <p className="text-xs text-slate mt-0.5">{link.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {error && (
        <div className="rounded-lg border border-red-900/50 bg-red-950/30 p-4 text-sm text-red-400">
          Failed to load users: {error.message}
        </div>
      )}

      <AdminUserList users={users ?? []} />
    </div>
  )
}
