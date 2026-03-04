'use client'

import { useState, useEffect, useCallback } from 'react'

interface APIKeyInfo {
  id: string
  keyPrefix: string
  name: string
  permissions: string[]
  rateLimit: number
  lastUsedAt: string | null
  createdAt: string
}

export function APIKeysClient() {
  const [keys, setKeys] = useState<APIKeyInfo[]>([])
  const [newKeyName, setNewKeyName] = useState('')
  const [newKeySecret, setNewKeySecret] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchKeys = useCallback(async () => {
    const res = await fetch('/api/admin/api-keys')
    if (res.ok) {
      const data = await res.json()
      setKeys(data.keys ?? [])
    }
  }, [])

  useEffect(() => { fetchKeys() }, [fetchKeys])

  const handleGenerate = async () => {
    if (!newKeyName.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/admin/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newKeyName,
          permissions: ['read', 'write', 'ai'],
          rateLimit: 1000,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setNewKeySecret(data.rawKey)
        setNewKeyName('')
        fetchKeys()
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRevoke = async (keyId: string) => {
    await fetch('/api/admin/api-keys', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyId }),
    })
    fetchKeys()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">API Keys</h1>
        <p className="text-sm text-white/50 mt-1">
          Manage API keys for the MissionPulse REST API. API docs at <code>/api/v1/docs</code>
        </p>
      </div>

      {/* Generate new key */}
      <div className="rounded-lg border border-white/10 bg-white/5 p-4">
        <h2 className="text-sm font-semibold text-white mb-3">Generate New Key</h2>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Key name (e.g., Production)"
            value={newKeyName}
            onChange={e => setNewKeyName(e.target.value)}
            className="flex-1 rounded bg-white/5 border border-white/10 px-3 py-1.5 text-sm text-white"
          />
          <button
            onClick={handleGenerate}
            disabled={loading || !newKeyName.trim()}
            className="px-4 py-1.5 rounded bg-[#00E5FA]/20 text-[#00E5FA] text-sm hover:bg-[#00E5FA]/30 disabled:opacity-50"
          >
            {loading ? 'Generating…' : 'Generate'}
          </button>
        </div>

        {newKeySecret && (
          <div className="mt-3 p-3 rounded bg-green-900/20 border border-green-500/30">
            <p className="text-xs text-green-400 mb-1">Copy this key now — it will not be shown again:</p>
            <code className="text-sm text-green-300 break-all">{newKeySecret}</code>
            <button
              onClick={() => setNewKeySecret(null)}
              className="block mt-2 text-xs text-white/40 hover:text-white/60"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* Active keys */}
      <div className="rounded-lg border border-white/10 bg-white/5 p-4">
        <h2 className="text-sm font-semibold text-white mb-3">Active Keys</h2>
        {keys.length === 0 ? (
          <p className="text-sm text-white/40">No API keys generated yet.</p>
        ) : (
          <div className="space-y-2">
            {keys.map(k => (
              <div key={k.id} className="flex items-center justify-between p-3 rounded bg-white/5">
                <div>
                  <p className="text-sm text-white font-medium">{k.name}</p>
                  <p className="text-xs text-white/40 mt-0.5">
                    {k.keyPrefix}… · Created {new Date(k.createdAt).toLocaleDateString()}
                    {k.lastUsedAt && ` · Last used ${new Date(k.lastUsedAt).toLocaleDateString()}`}
                  </p>
                  <div className="flex gap-1 mt-1">
                    {k.permissions.map(p => (
                      <span key={p} className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/50">{p}</span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => handleRevoke(k.id)}
                  className="text-xs px-3 py-1 rounded bg-red-900/30 text-red-400 hover:bg-red-900/50"
                >
                  Revoke
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-[10px] text-white/30 text-center">
        AI GENERATED — REQUIRES HUMAN REVIEW
      </p>
    </div>
  )
}
