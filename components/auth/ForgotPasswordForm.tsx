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

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-[#00E5FA] px-4 py-2.5 font-semibold text-[#00050F] transition hover:bg-[#00E5FA]/90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Sending...' : 'Send Reset Link'}
      </button>

      <p className="text-center text-sm text-slate-400">
        <Link href="/login" className="text-[#00E5FA] hover:text-[#00E5FA]/80 font-medium">
          Back to Sign In
        </Link>
      </p>
    </form>
  )
}
