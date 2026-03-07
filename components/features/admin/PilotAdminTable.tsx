// filepath: components/features/admin/PilotAdminTable.tsx
'use client'

import { useState } from 'react'
import type { PilotSummary } from '@/lib/billing/pilots'

interface Props { pilots: PilotSummary[] }

function EngagementBadge({ score }: { score: number }) {
  const color = score >= 70 ? 'bg-green-500/20 text-green-400 border-green-500/30'
    : score >= 40 ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    : 'bg-red-500/20 text-red-400 border-red-500/30'
  return <span className={`px-2 py-1 rounded border text-xs font-semibold ${color}`}>{score}/100</span>
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pilot: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    pilot_converting: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    pilot_expired: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  }
  return <span className={`px-2 py-1 rounded border text-xs font-semibold capitalize ${map[status] ?? ''}`}>{status.replace(/_/g, ' ')}</span>
}

export function PilotAdminTable({ pilots }: Props) {
  const [converting, setConverting] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function handleConvert(companyId: string) {
    setConverting(companyId)
    const res = await fetch(`/api/admin/pilots/${companyId}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'convert' }),
    })
    const json = await res.json() as { success?: boolean; error?: string }
    setConverting(null)
    setMessage(json.success ? 'Pilot converted to annual.' : (json.error ?? 'Error'))
    setTimeout(() => setMessage(null), 4000)
  }

  if (pilots.length === 0) {
    return <div className="border border-gray-700 rounded-lg p-8 text-center text-gray-400">No active pilots.</div>
  }

  return (
    <div className="space-y-4">
      {message && <div className="border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 rounded px-4 py-2 text-sm">{message}</div>}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-300">
          <thead className="text-xs uppercase text-gray-500 border-b border-gray-700">
            <tr>
              <th className="py-3 pr-4">Company</th>
              <th className="py-3 pr-4">Plan</th>
              <th className="py-3 pr-4">Status</th>
              <th className="py-3 pr-4">Days Left</th>
              <th className="py-3 pr-4">Engagement</th>
              <th className="py-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {pilots.map((p) => (
              <tr key={p.companyId} className="hover:bg-gray-800/50">
                <td className="py-3 pr-4 font-medium text-white">{p.companyName}</td>
                <td className="py-3 pr-4">{p.planName}</td>
                <td className="py-3 pr-4"><StatusBadge status={p.status} /></td>
                <td className="py-3 pr-4">
                  {p.daysRemaining !== null
                    ? <span className={p.daysRemaining <= 5 ? 'text-red-400 font-semibold' : ''}>{p.daysRemaining}d</span>
                    : '\u2014'}
                </td>
                <td className="py-3 pr-4"><EngagementBadge score={p.engagementScore} /></td>
                <td className="py-3">
                  {['pilot', 'pilot_expired'].includes(p.status) && (
                    <button onClick={() => handleConvert(p.companyId)} disabled={converting === p.companyId}
                      className="px-3 py-1 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded text-xs hover:bg-cyan-500/30 disabled:opacity-50 transition-colors">
                      {converting === p.companyId ? 'Converting...' : 'Convert to Annual'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
