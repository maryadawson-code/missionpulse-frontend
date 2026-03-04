'use client'

interface EngagementGaugeProps {
  score: number
  companyName: string
}

function getScoreConfig(score: number): {
  color: string
  label: string
  description: string
} {
  if (score > 70) {
    return {
      color: '#10B981',
      label: 'High Engagement',
      description: 'Likely to Convert',
    }
  }
  if (score > 40) {
    return {
      color: '#F59E0B',
      label: 'Moderate',
      description: 'Needs Attention',
    }
  }
  return {
    color: '#EF4444',
    label: 'At Risk',
    description: 'Intervention Needed',
  }
}

export function EngagementGauge({ score, companyName }: EngagementGaugeProps) {
  const config = getScoreConfig(score)

  return (
    <div className="flex items-center gap-3">
      <div className="relative h-14 w-14 flex-shrink-0">
        <svg className="h-14 w-14 -rotate-90" viewBox="0 0 36 36">
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="#1E293B"
            strokeWidth="3"
          />
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke={config.color}
            strokeWidth="3"
            strokeDasharray={`${score}, 100`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-white">{score}</span>
        </div>
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-white truncate">{companyName}</p>
        <p className="text-[10px]" style={{ color: config.color }}>
          {config.label}
        </p>
        <p className="text-[10px] text-gray-500">{config.description}</p>
      </div>
    </div>
  )
}
