// filepath: components/modules/DashboardClient.tsx
'use client'

import { useRouter } from 'next/navigation'

export function DashboardClient() {
  const router = useRouter()

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => router.push('/pipeline/new')}
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
  )
}
