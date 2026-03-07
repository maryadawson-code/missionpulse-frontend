// filepath: components/features/admin/EngagementGauge.tsx
'use client'

interface Props {
  score: number
  companyName?: string
  breakdown?: { daily_logins: number; ai_queries: number; proposals_created: number; compliance_matrices: number; team_invites: number }
}

export function EngagementGauge({ score, companyName, breakdown }: Props) {
  const color = score >= 70 ? '#22c55e' : score >= 40 ? '#eab308' : '#ef4444'
  const tier = score >= 70 ? 'Healthy' : score >= 40 ? 'At Risk' : 'Critical'
  const circumference = 2 * Math.PI * 40
  const dashOffset = circumference - (score / 100) * circumference

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
      {companyName && <div className="text-sm font-medium text-gray-300">{companyName}</div>}
      <div className="flex items-center gap-6">
        <svg width="96" height="96" viewBox="0 0 96 96">
          <circle cx="48" cy="48" r="40" fill="none" stroke="#1f2937" strokeWidth="8" />
          <circle cx="48" cy="48" r="40" fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={circumference} strokeDashoffset={dashOffset} strokeLinecap="round"
            transform="rotate(-90 48 48)" style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
          <text x="48" y="52" textAnchor="middle" fill="white" fontSize="20" fontWeight="bold">{score}</text>
        </svg>
        <div className="space-y-1">
          <div className="text-2xl font-bold text-white">{score}<span className="text-gray-400 text-sm">/100</span></div>
          <div className="text-sm font-semibold" style={{ color }}>{tier}</div>
          {score < 40 && <div className="text-xs text-red-400">Alert sent at Day 14</div>}
        </div>
      </div>
      {breakdown && (
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
          <div>Logins: <span className="text-white">{breakdown.daily_logins}</span></div>
          <div>AI Queries: <span className="text-white">{breakdown.ai_queries}</span></div>
          <div>Proposals: <span className="text-white">{breakdown.proposals_created}</span></div>
          <div>Compliance: <span className="text-white">{breakdown.compliance_matrices}</span></div>
          <div>Team: <span className="text-white">{breakdown.team_invites}</span></div>
        </div>
      )}
    </div>
  )
}
