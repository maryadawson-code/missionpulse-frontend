// FILE: components/modules/DashboardClient.tsx
// SPRINT: 2 — Dashboard Client Interactions
// NOTE: 'use client' — needs useState for modal toggle

'use client'

import { useState } from 'react'
import { OpportunityForm } from '@/components/modules/OpportunityForm'

export function DashboardClient() {
  const [showCreate, setShowCreate] = useState(false)

  return (
    <>
      {/* Quick Actions Bar */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-navy font-semibold text-sm rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Opportunity
        </button>
        <a
          href="/pipeline"
          className="px-4 py-2.5 border border-border text-slate-300 hover:text-white hover:border-slate-600 text-sm rounded-lg transition-colors"
        >
          View Pipeline
        </a>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <OpportunityForm
          onClose={() => setShowCreate(false)}
          onSuccess={() => setShowCreate(false)}
        />
      )}
    </>
  )
}
