'use client'

import { useState, useEffect } from 'react'

interface DeadlineCountdownProps {
  targetDate: string
}

function padTwo(n: number): string {
  return n.toString().padStart(2, '0')
}

export function DeadlineCountdown({ targetDate }: DeadlineCountdownProps) {
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  const target = new Date(targetDate).getTime()
  const diff = target - now
  const overdue = diff < 0

  const absDiff = Math.abs(diff)
  const days = Math.floor(absDiff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((absDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((absDiff % (1000 * 60)) / 1000)

  // Color: green >7d, amber 2-7d, red <2d, pulsing red overdue
  const colorClass = overdue
    ? 'text-red-400 animate-pulse'
    : days >= 7
      ? 'text-emerald-400'
      : days >= 2
        ? 'text-amber-400'
        : 'text-red-400'

  return (
    <div className="flex items-center gap-2">
      <div className={`flex items-baseline gap-1 font-mono text-sm font-bold ${colorClass}`}>
        {overdue && <span className="text-xs font-medium">OVERDUE</span>}
        <span>{days}<span className="text-xs font-normal text-muted-foreground">d</span></span>
        <span>{padTwo(hours)}<span className="text-xs font-normal text-muted-foreground">h</span></span>
        <span>{padTwo(minutes)}<span className="text-xs font-normal text-muted-foreground">m</span></span>
        <span>{padTwo(seconds)}<span className="text-xs font-normal text-muted-foreground">s</span></span>
      </div>
    </div>
  )
}
