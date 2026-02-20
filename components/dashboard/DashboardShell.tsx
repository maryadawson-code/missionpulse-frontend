// filepath: components/dashboard/DashboardShell.tsx
'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { TopBar } from '@/components/dashboard/TopBar'

interface DashboardShellProps {
  children: React.ReactNode
  allowedModules: string[]
  userName: string | null
  userEmail: string
  avatarUrl: string | null
}

export function DashboardShell({
  children,
  allowedModules,
  userName,
  userEmail,
  avatarUrl,
}: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-navy">
      <Sidebar
        allowedModules={allowedModules}
        isMobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main content area — offset by sidebar width on desktop */}
      <div className="lg:pl-56">
        <TopBar
          userName={userName}
          userEmail={userEmail}
          avatarUrl={avatarUrl}
          onToggleMobile={() => setMobileOpen((v) => !v)}
        />

        <main className="px-4 py-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  )
}
