'use client'

import { useState } from 'react'
import Link from 'next/link'
import { forgotPassword } from '@/lib/actions/auth'

export default function ForgotPasswordForm() {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    setSuccess(null)
    const result = await forgotPassword(formData)
    if (result?.error) {
      setError(result.error)
    } else if (result?.success) {
      setSuccess(result.success)
    }
    setLoading(false)
  }

  return (
    <form action={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">
          {success}
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

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-primary px-4 py-2.5 font-semibold text-[#00050F] transition hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Sending...' : 'Send Reset Link'}
      </button>

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="text-primary hover:text-primary/80 font-medium">
          Back to Sign In
        </Link>
      </p>
    </form>
  )
}
