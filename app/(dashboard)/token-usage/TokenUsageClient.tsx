'use client'

interface TokenBalance {
  allocated: number
  consumed: number
  purchased: number
  overage_used: number
  remaining: number
  total_available: number
  usage_percent: number
  period_start: string
  period_end: string
}

interface AgentBreakdown {
  agent: string
  inputTokens: number
  outputTokens: number
  totalTokens: number
  cost: number
  count: number
}

interface UserBreakdown {
  userId: string
  email: string
  totalTokens: number
  cost: number
  count: number
}

interface DailyTrend {
  date: string
  tokens: number
  cost: number
}

interface Props {
  balance: TokenBalance | null
  totalTokens: number
  totalCost: number
  perAgent: AgentBreakdown[]
  perUser: UserBreakdown[]
  dailyTrend: DailyTrend[]
}

const CARD_STYLE: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 12,
  padding: '20px 24px',
}

const TABLE_STYLE: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: 13,
}

const TH_STYLE: React.CSSProperties = {
  textAlign: 'left',
  padding: '10px 12px',
  borderBottom: '1px solid rgba(255,255,255,0.08)',
  color: '#8892a4',
  fontWeight: 500,
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
}

const TD_STYLE: React.CSSProperties = {
  padding: '10px 12px',
  borderBottom: '1px solid rgba(255,255,255,0.04)',
  color: '#e8eaf6',
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString()
}

function fmtCost(n: number): string {
  return `$${n.toFixed(2)}`
}

function usageColor(pct: number): string {
  if (pct >= 90) return '#ef4444'
  if (pct >= 75) return '#f59e0b'
  return '#00E5FA'
}

export default function TokenUsageClient({
  balance,
  totalTokens,
  totalCost,
  perAgent,
  perUser,
  dailyTrend,
}: Props) {
  const usagePct = balance?.usage_percent ?? 0
  const maxBar = Math.max(...perAgent.map((a) => a.totalTokens), 1)

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#e8eaf6', margin: 0 }}>
          Token Usage
        </h1>
        <p style={{ fontSize: 14, color: '#8892a4', marginTop: 4 }}>
          AI token consumption for the current billing period.
        </p>
      </div>

      {/* Summary cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
          marginBottom: 32,
        }}
      >
        <div style={CARD_STYLE}>
          <div style={{ fontSize: 11, color: '#8892a4', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Tokens Used
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#e8eaf6', marginTop: 4 }}>
            {fmt(totalTokens)}
          </div>
        </div>

        <div style={CARD_STYLE}>
          <div style={{ fontSize: 11, color: '#8892a4', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Balance Remaining
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#00E5FA', marginTop: 4 }}>
            {balance ? fmt(balance.remaining) : '—'}
          </div>
        </div>

        <div style={CARD_STYLE}>
          <div style={{ fontSize: 11, color: '#8892a4', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Usage
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: usageColor(usagePct), marginTop: 4 }}>
            {usagePct}%
          </div>
          {balance && (
            <div
              style={{
                marginTop: 8,
                height: 6,
                borderRadius: 3,
                background: 'rgba(255,255,255,0.06)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${Math.min(usagePct, 100)}%`,
                  background: usageColor(usagePct),
                  borderRadius: 3,
                  transition: 'width 0.3s',
                }}
              />
            </div>
          )}
        </div>

        <div style={CARD_STYLE}>
          <div style={{ fontSize: 11, color: '#8892a4', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Estimated Cost
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#e8eaf6', marginTop: 4 }}>
            {fmtCost(totalCost)}
          </div>
        </div>
      </div>

      {/* Per-Agent breakdown */}
      <div style={{ ...CARD_STYLE, marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: '#e8eaf6', marginBottom: 16, marginTop: 0 }}>
          Usage by Agent
        </h2>
        {perAgent.length === 0 ? (
          <p style={{ color: '#8892a4', fontSize: 13 }}>No usage data this period.</p>
        ) : (
          <table style={TABLE_STYLE}>
            <thead>
              <tr>
                <th style={TH_STYLE}>Agent</th>
                <th style={{ ...TH_STYLE, textAlign: 'right' }}>Requests</th>
                <th style={{ ...TH_STYLE, textAlign: 'right' }}>Input</th>
                <th style={{ ...TH_STYLE, textAlign: 'right' }}>Output</th>
                <th style={{ ...TH_STYLE, textAlign: 'right' }}>Total</th>
                <th style={{ ...TH_STYLE, textAlign: 'right' }}>Cost</th>
                <th style={{ ...TH_STYLE, width: 120 }}></th>
              </tr>
            </thead>
            <tbody>
              {perAgent.map((a) => (
                <tr key={a.agent}>
                  <td style={{ ...TD_STYLE, fontWeight: 500 }}>
                    {a.agent}
                  </td>
                  <td style={{ ...TD_STYLE, textAlign: 'right' }}>{a.count}</td>
                  <td style={{ ...TD_STYLE, textAlign: 'right' }}>{fmt(a.inputTokens)}</td>
                  <td style={{ ...TD_STYLE, textAlign: 'right' }}>{fmt(a.outputTokens)}</td>
                  <td style={{ ...TD_STYLE, textAlign: 'right', fontWeight: 500 }}>
                    {fmt(a.totalTokens)}
                  </td>
                  <td style={{ ...TD_STYLE, textAlign: 'right' }}>{fmtCost(a.cost)}</td>
                  <td style={TD_STYLE}>
                    <div
                      style={{
                        height: 6,
                        borderRadius: 3,
                        background: 'rgba(255,255,255,0.06)',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${(a.totalTokens / maxBar) * 100}%`,
                          background: '#00E5FA',
                          borderRadius: 3,
                        }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Per-User breakdown */}
      <div style={{ ...CARD_STYLE, marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: '#e8eaf6', marginBottom: 16, marginTop: 0 }}>
          Top Users
        </h2>
        {perUser.length === 0 ? (
          <p style={{ color: '#8892a4', fontSize: 13 }}>No usage data this period.</p>
        ) : (
          <table style={TABLE_STYLE}>
            <thead>
              <tr>
                <th style={TH_STYLE}>User</th>
                <th style={{ ...TH_STYLE, textAlign: 'right' }}>Requests</th>
                <th style={{ ...TH_STYLE, textAlign: 'right' }}>Tokens</th>
                <th style={{ ...TH_STYLE, textAlign: 'right' }}>Cost</th>
              </tr>
            </thead>
            <tbody>
              {perUser.slice(0, 20).map((u) => (
                <tr key={u.userId}>
                  <td style={{ ...TD_STYLE, fontWeight: 500 }}>{u.email}</td>
                  <td style={{ ...TD_STYLE, textAlign: 'right' }}>{u.count}</td>
                  <td style={{ ...TD_STYLE, textAlign: 'right' }}>{fmt(u.totalTokens)}</td>
                  <td style={{ ...TD_STYLE, textAlign: 'right' }}>{fmtCost(u.cost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Daily trend */}
      <div style={CARD_STYLE}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: '#e8eaf6', marginBottom: 16, marginTop: 0 }}>
          Daily Trend
        </h2>
        {dailyTrend.length === 0 ? (
          <p style={{ color: '#8892a4', fontSize: 13 }}>No daily data available.</p>
        ) : (
          <table style={TABLE_STYLE}>
            <thead>
              <tr>
                <th style={TH_STYLE}>Date</th>
                <th style={{ ...TH_STYLE, textAlign: 'right' }}>Tokens</th>
                <th style={{ ...TH_STYLE, textAlign: 'right' }}>Cost</th>
              </tr>
            </thead>
            <tbody>
              {dailyTrend.map((d) => (
                <tr key={d.date}>
                  <td style={TD_STYLE}>{d.date}</td>
                  <td style={{ ...TD_STYLE, textAlign: 'right' }}>{fmt(d.tokens)}</td>
                  <td style={{ ...TD_STYLE, textAlign: 'right' }}>{fmtCost(d.cost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
