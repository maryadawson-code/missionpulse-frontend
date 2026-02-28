'use client'

import { useState } from 'react'
import Link from 'next/link'
import { signIn } from '@/lib/actions/auth'

export default function LoginForm({ callbackError }: { callbackError?: string }) {
  const [error, setError] = useState<string | null>(callbackError ?? null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    const result = await signIn(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <form action={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-400 mb-1.5">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full rounded-lg border border-[#1E293B] bg-[#0F172A] px-4 py-2.5 text-white placeholder-slate-500 focus:border-[#00E5FA] focus:outline-none focus:ring-1 focus:ring-[#00E5FA]"
          placeholder="you@mission.gov"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-slate-400 mb-1.5">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="w-full rounded-lg border border-[#1E293B] bg-[#0F172A] px-4 py-2.5 text-white placeholder-slate-500 focus:border-[#00E5FA] focus:outline-none focus:ring-1 focus:ring-[#00E5FA]"
          placeholder="••••••••"
        />
      </div>

      <div className="flex items-center justify-between text-sm">
        <Link href="/forgot-password" className="text-[#00E5FA] hover:text-[#00E5FA]/80">
          Forgot password?
        </Link>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-[#00E5FA] px-4 py-2.5 font-semibold text-[#00050F] transition hover:bg-[#00E5FA]/90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Signing in...' : 'Sign In'}
      </button>

      <p className="text-center text-sm text-slate-400">
        No account?{' '}
        <Link href="/signup" className="text-[#00E5FA] hover:text-[#00E5FA]/80 font-medium">
          Request Access
        </Link>
      </p>
    </form>
  )
}
