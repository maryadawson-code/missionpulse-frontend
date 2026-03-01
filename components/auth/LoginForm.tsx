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
        <label htmlFor="email" className="block text-sm font-medium text-muted-foreground mb-1.5">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="you@mission.gov"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-muted-foreground mb-1.5">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="••••••••"
        />
      </div>

      <div className="flex items-center justify-between text-sm">
        <Link href="/forgot-password" className="text-primary hover:text-primary/80">
          Forgot password?
        </Link>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-primary px-4 py-2.5 font-semibold text-[#00050F] transition hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Signing in...' : 'Sign In'}
      </button>

      <p className="text-center text-sm text-muted-foreground">
        No account?{' '}
        <Link href="/signup" className="text-primary hover:text-primary/80 font-medium">
          Request Access
        </Link>
      </p>
    </form>
  )
}
