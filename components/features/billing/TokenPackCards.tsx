/**
 * Token Pack Cards — One-time token purchase options.
 *
 * 500K ($50), 1M ($90), 5M ($400) with per-token savings.
 */
'use client'

import { useState } from 'react'
import { Zap, Loader2 } from 'lucide-react'
import { purchaseTokenPack } from '@/lib/billing/checkout'

interface TokenPack {
  id: string
  tokens: number
  price_cents: number
  label: string
  savings: string | null
}

const TOKEN_PACKS: TokenPack[] = [
  { id: 'pack-500k', tokens: 500_000, price_cents: 5000, label: '500K', savings: null },
  { id: 'pack-1m', tokens: 1_000_000, price_cents: 9000, label: '1M', savings: '10% savings' },
  { id: 'pack-5m', tokens: 5_000_000, price_cents: 40000, label: '5M', savings: '20% savings' },
]

export function TokenPackCards() {
  const [loading, setLoading] = useState<string | null>(null)

  async function handlePurchase(packId: string) {
    setLoading(packId)
    try {
      const result = await purchaseTokenPack(packId)
      if (result.url) {
        window.location.href = result.url
      }
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-white">Buy More Tokens</h3>
        <p className="text-sm text-gray-400">
          One-time token packs credited instantly to your account.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {TOKEN_PACKS.map((pack) => (
          <div
            key={pack.id}
            className="relative rounded-xl border border-border bg-card p-5 hover:border-cyan-700/50 transition-colors"
          >
            {pack.savings && (
              <span className="absolute -top-2 right-3 rounded-full bg-cyan-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                {pack.savings}
              </span>
            )}
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-cyan-400" />
              <span className="text-xl font-bold text-white">{pack.label}</span>
            </div>
            <p className="mt-1 text-sm text-gray-400">
              {pack.tokens.toLocaleString()} tokens
            </p>
            <p className="mt-3 text-2xl font-bold text-white">
              ${(pack.price_cents / 100).toFixed(0)}
            </p>
            <p className="text-xs text-gray-500">
              ${((pack.price_cents / pack.tokens) * 1000).toFixed(2)}/1K tokens
            </p>
            <button
              onClick={() => handlePurchase(pack.id)}
              disabled={loading !== null}
              className="mt-4 w-full rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-500 disabled:opacity-50 transition-colors"
            >
              {loading === pack.id ? (
                <Loader2 className="mx-auto h-4 w-4 animate-spin" />
              ) : (
                'Purchase'
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
