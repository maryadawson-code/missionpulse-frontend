// filepath: components/features/admin/SSOConfigPanel.tsx

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface SSOConfigPanelProps {
  companyId: string
}

export function SSOConfigPanel({ companyId }: SSOConfigPanelProps) {
  const [entityId, setEntityId] = useState('')
  const [ssoUrl, setSsoUrl] = useState('')
  const [certificate, setCertificate] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/sso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          entityId,
          ssoUrl,
          certificate,
        }),
      })
      if (res.ok) setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* SP metadata */}
      <div className="rounded-lg border bg-card p-6">
        <h3 className="font-semibold mb-3">Service Provider (SP) Metadata</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">ACS URL:</span>
            <code className="text-xs bg-muted px-2 py-0.5 rounded">
              {typeof window !== 'undefined' ? window.location.origin : ''}/api/auth/saml/callback
            </code>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Entity ID:</span>
            <code className="text-xs bg-muted px-2 py-0.5 rounded">
              urn:missionpulse:{companyId}
            </code>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Name ID Format:</span>
            <code className="text-xs bg-muted px-2 py-0.5 rounded">
              emailAddress
            </code>
          </div>
        </div>
      </div>

      {/* IdP config */}
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <h3 className="font-semibold">Identity Provider (IdP) Configuration</h3>

        <div>
          <label className="text-sm font-medium block mb-1">
            IdP Entity ID
          </label>
          <input
            type="text"
            value={entityId}
            onChange={(e) => setEntityId(e.target.value)}
            placeholder="https://idp.example.com/metadata"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">
            SSO URL (HTTP-POST)
          </label>
          <input
            type="text"
            value={ssoUrl}
            onChange={(e) => setSsoUrl(e.target.value)}
            placeholder="https://idp.example.com/sso/saml"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">
            X.509 Certificate (PEM)
          </label>
          <textarea
            value={certificate}
            onChange={(e) => setCertificate(e.target.value)}
            placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
            rows={6}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm font-mono"
          />
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={handleSave} disabled={saving || !entityId || !ssoUrl}>
            {saving ? 'Saving...' : 'Save Configuration'}
          </Button>
          {saved && (
            <span className="text-sm text-green-500">Configuration saved</span>
          )}
        </div>
      </div>

      {/* Supported IdPs */}
      <div className="rounded-lg border bg-card p-6">
        <h3 className="font-semibold mb-3">Tested Identity Providers</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          {['Okta', 'Azure AD', 'OneLogin', 'Google Workspace', 'PingFederate', 'Auth0', 'JumpCloud', 'Keycloak'].map(
            (idp) => (
              <div key={idp} className="rounded-md border p-3 text-center text-muted-foreground">
                {idp}
              </div>
            )
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        SAML 2.0 SSO enables your team to authenticate via your corporate identity provider.
        Users are auto-provisioned on first login with the default role specified in your IdP attribute mapping.
      </p>
    </div>
  )
}
