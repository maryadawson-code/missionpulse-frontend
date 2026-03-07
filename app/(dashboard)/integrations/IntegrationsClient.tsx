// filepath: app/(dashboard)/integrations/IntegrationsClient.tsx
'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { OAuthProvider } from '@/lib/integrations/oauth-manager'
import { disconnectUserOAuth } from './actions'

// ─── Integration Catalog ────────────────────────────────────

interface IntegrationDef {
  provider: OAuthProvider
  name: string
  description: string
  category: 'Collaboration' | 'CRM' | 'Compliance'
  icon: string
  color: string
  capabilities: string[]
}

const INTEGRATIONS: IntegrationDef[] = [
  {
    provider: 'microsoft365',
    name: 'Microsoft 365',
    description: 'OneDrive storage, Outlook calendar sync, and Word Online editing for proposals.',
    category: 'Collaboration',
    icon: 'M',
    color: '#5b5fc7',
    capabilities: ['OneDrive file storage', 'Outlook calendar sync', 'Word Online editing'],
  },
  {
    provider: 'google',
    name: 'Google Workspace',
    description: 'Drive file management, Calendar events, and Gmail integration.',
    category: 'Collaboration',
    icon: 'G',
    color: '#4285f4',
    capabilities: ['Google Drive storage', 'Calendar event sync', 'Gmail notifications'],
  },
  {
    provider: 'slack',
    name: 'Slack',
    description: 'Channel notifications for gate approvals, deadlines, and team assignments.',
    category: 'Collaboration',
    icon: 'S',
    color: '#4a154b',
    capabilities: ['Gate approval alerts', 'Deadline reminders', 'Team assignment notifications'],
  },
  {
    provider: 'hubspot',
    name: 'HubSpot CRM',
    description: 'Bi-directional sync of opportunities, contacts, and deal stages.',
    category: 'CRM',
    icon: 'H',
    color: '#ff7a59',
    capabilities: ['Deal pipeline sync', 'Contact management', 'Activity logging'],
  },
  {
    provider: 'salesforce',
    name: 'Salesforce',
    description: 'Sync opportunities and accounts with your Salesforce CRM instance.',
    category: 'CRM',
    icon: 'SF',
    color: '#00a1e0',
    capabilities: ['Opportunity sync', 'Account management', 'Custom field mapping'],
  },
  {
    provider: 'docusign',
    name: 'DocuSign',
    description: 'Electronic signatures and document workflow for teaming agreements and NDAs.',
    category: 'Compliance',
    icon: 'D',
    color: '#ff4438',
    capabilities: ['E-signatures', 'Document routing', 'Audit trail'],
  },
]

const PLATFORM_INTEGRATIONS = [
  { name: 'SAM.gov', description: 'Federal opportunity search and import' },
  { name: 'USAspending', description: 'Federal award data and spending analytics' },
  { name: 'FPDS', description: 'Federal procurement data system' },
]

const CATEGORIES = ['Collaboration', 'CRM', 'Compliance'] as const

// ─── Props ──────────────────────────────────────────────────

interface Props {
  connectedMap: Record<string, { email: string | null; connectedAt: string }>
  flashConnected?: OAuthProvider
  flashError?: string
}

// ─── Component ──────────────────────────────────────────────

export function IntegrationsClient({ connectedMap, flashConnected, flashError }: Props) {
  const router = useRouter()
  const [confirmingDisconnect, setConfirmingDisconnect] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [showFlash, setShowFlash] = useState(!!(flashConnected || flashError))

  useEffect(() => {
    if (showFlash) {
      const timer = setTimeout(() => setShowFlash(false), 6000)
      return () => clearTimeout(timer)
    }
  }, [showFlash])

  const connectedCount = Object.keys(connectedMap).length

  function handleConnect(provider: OAuthProvider) {
    window.location.href = `/api/oauth/${provider}`
  }

  function handleDisconnect(provider: OAuthProvider) {
    if (confirmingDisconnect === provider) {
      startTransition(async () => {
        await disconnectUserOAuth(provider)
        setConfirmingDisconnect(null)
        router.refresh()
      })
    } else {
      setConfirmingDisconnect(provider)
      // Auto-clear confirm state after 4 seconds
      setTimeout(() => setConfirmingDisconnect(null), 4000)
    }
  }

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#e8eaf6', margin: 0 }}>
          Integrations
        </h1>
        <p style={{ fontSize: 14, color: '#8892a4', marginTop: 4 }}>
          Connect your tools — no IT required. 3 clicks: Connect, Authorize, Done.
        </p>
      </div>

      {/* Flash Banner */}
      {showFlash && flashConnected && (
        <div
          style={{
            padding: '12px 16px',
            marginBottom: 16,
            borderRadius: 8,
            border: '1px solid rgba(0, 229, 250, 0.3)',
            backgroundColor: 'rgba(0, 229, 250, 0.08)',
            color: '#00E5FA',
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>
            Successfully connected {INTEGRATIONS.find((i) => i.provider === flashConnected)?.name ?? flashConnected}
          </span>
          <button
            onClick={() => setShowFlash(false)}
            style={{ background: 'none', border: 'none', color: '#00E5FA', cursor: 'pointer', fontSize: 16 }}
          >
            x
          </button>
        </div>
      )}
      {showFlash && flashError && (
        <div
          style={{
            padding: '12px 16px',
            marginBottom: 16,
            borderRadius: 8,
            border: '1px solid rgba(239, 68, 68, 0.3)',
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            color: '#f87171',
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>Connection failed: {flashError}</span>
          <button
            onClick={() => setShowFlash(false)}
            style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: 16 }}
          >
            x
          </button>
        </div>
      )}

      {/* Summary Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 16px',
          marginBottom: 24,
          borderRadius: 8,
          border: '1px solid rgba(255,255,255,0.08)',
          backgroundColor: 'rgba(255,255,255,0.02)',
          fontSize: 13,
          color: '#8892a4',
        }}
      >
        <span
          style={{
            display: 'inline-block',
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: connectedCount > 0 ? '#34d399' : '#6b7280',
          }}
        />
        <span>
          {connectedCount} of {INTEGRATIONS.length} integrations connected
        </span>
      </div>

      {/* Integration Cards by Category */}
      {CATEGORIES.map((category) => {
        const items = INTEGRATIONS.filter((i) => i.category === category)
        if (items.length === 0) return null

        return (
          <div key={category} style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 13, fontWeight: 600, color: '#8892a4', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
              {category}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {items.map((integration) => {
                const connection = connectedMap[integration.provider]
                const isConnected = !!connection
                const isConfirming = confirmingDisconnect === integration.provider

                return (
                  <div
                    key={integration.provider}
                    style={{
                      borderRadius: 12,
                      border: `1px solid ${isConnected ? 'rgba(52, 211, 153, 0.2)' : 'rgba(255,255,255,0.08)'}`,
                      backgroundColor: isConnected ? 'rgba(52, 211, 153, 0.03)' : 'rgba(255,255,255,0.02)',
                      padding: 20,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                    }}
                  >
                    {/* Card Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 8,
                            backgroundColor: integration.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            fontSize: 13,
                            fontWeight: 700,
                          }}
                        >
                          {integration.icon}
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: '#e8eaf6' }}>
                            {integration.name}
                          </div>
                        </div>
                      </div>
                      {isConnected && (
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: '#34d399',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#34d399', display: 'inline-block' }} />
                          Connected
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    <p style={{ fontSize: 12, color: '#8892a4', lineHeight: 1.5, margin: 0 }}>
                      {integration.description}
                    </p>

                    {/* Capabilities */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {integration.capabilities.map((cap) => (
                        <div key={cap} style={{ fontSize: 11, color: '#8892a4', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ color: isConnected ? '#34d399' : '#6b7280' }}>
                            {isConnected ? '\u2713' : '\u25CB'}
                          </span>
                          {cap}
                        </div>
                      ))}
                    </div>

                    {/* Connected Email */}
                    {isConnected && connection.email && (
                      <div style={{ fontSize: 11, color: '#8892a4' }}>
                        {connection.email}
                      </div>
                    )}

                    {/* Action Button */}
                    <div style={{ marginTop: 'auto', paddingTop: 4 }}>
                      {isConnected ? (
                        <button
                          onClick={() => handleDisconnect(integration.provider)}
                          disabled={isPending}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: 8,
                            border: isConfirming ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(255,255,255,0.1)',
                            backgroundColor: isConfirming ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                            color: isConfirming ? '#f87171' : '#8892a4',
                            fontSize: 13,
                            fontWeight: 500,
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                          }}
                        >
                          {isPending ? 'Disconnecting...' : isConfirming ? 'Confirm disconnect?' : 'Disconnect'}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleConnect(integration.provider)}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: 8,
                            border: 'none',
                            backgroundColor: '#00E5FA',
                            color: '#00050F',
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                          }}
                        >
                          Connect &rarr;
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Platform Integrations */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 13, fontWeight: 600, color: '#8892a4', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
          Platform Data Sources
        </h2>
        <div
          style={{
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.08)',
            backgroundColor: 'rgba(255,255,255,0.02)',
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          {PLATFORM_INTEGRATIONS.map((pi) => (
            <div
              key={pi.name}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <div>
                <span style={{ fontSize: 13, fontWeight: 500, color: '#e8eaf6' }}>{pi.name}</span>
                <span style={{ fontSize: 12, color: '#8892a4', marginLeft: 8 }}>— {pi.description}</span>
              </div>
              <span
                style={{
                  fontSize: 11,
                  color: '#34d399',
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                }}
              >
                Auto-connected
              </span>
            </div>
          ))}
          <p style={{ fontSize: 11, color: '#6b7280', margin: 0 }}>
            These data sources use platform credentials — no setup required.
          </p>
        </div>
      </div>
    </div>
  )
}
