// filepath: components/modules/WarRoom/PwinGauge.tsx
interface PwinGaugeProps {
  value: number // 0-100
  size?: number
}

export function PwinGauge({ value, size = 120 }: PwinGaugeProps) {
  const clamped = Math.max(0, Math.min(100, value))
  const radius = (size - 16) / 2
  const circumference = Math.PI * radius // Half-circle
  const offset = circumference - (clamped / 100) * circumference

  function gaugeColor(v: number): string {
    if (v >= 70) return '#22C55E' // success green
    if (v >= 40) return '#F59E0B' // warning amber
    return '#EF4444' // error red
  }

  const color = gaugeColor(clamped)

  return (
    <div className="flex flex-col items-center">
      <svg
        width={size}
        height={size / 2 + 16}
        viewBox={`0 0 ${size} ${size / 2 + 16}`}
        className="overflow-visible"
      >
        {/* Background arc */}
        <path
          d={`M 8 ${size / 2} A ${radius} ${radius} 0 0 1 ${size - 8} ${size / 2}`}
          fill="none"
          stroke="#1E293B"
          strokeWidth={8}
          strokeLinecap="round"
        />
        {/* Value arc */}
        <path
          d={`M 8 ${size / 2} A ${radius} ${radius} 0 0 1 ${size - 8} ${size / 2}`}
          fill="none"
          stroke={color}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
        {/* Center text */}
        <text
          x={size / 2}
          y={size / 2 - 4}
          textAnchor="middle"
          className="fill-white text-2xl font-bold"
          style={{ fontSize: size * 0.22 }}
        >
          {clamped}%
        </text>
        <text
          x={size / 2}
          y={size / 2 + 14}
          textAnchor="middle"
          className="fill-slate-400 text-xs"
          style={{ fontSize: size * 0.09 }}
        >
          Win Probability
        </text>
      </svg>
    </div>
  )
}
