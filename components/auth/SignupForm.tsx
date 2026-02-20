'use client'

import { useState } from 'react'
import Link from 'next/link'
import { signUp } from '@/lib/actions/auth'

export default function SignupForm() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    const result = await signUp(formData)
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
        <label htmlFor="full_name" className="block text-sm font-medium text-slate-400 mb-1.5">
          Full Name
        </label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          required
          className="w-full rounded-lg border border-[#1E293B] bg-[#0F172A] px-4 py-2.5 text-white placeholder-slate-500 focus:border-[#00E5FA] focus:outline-none focus:ring-1 focus:ring-[#00E5FA]"
          placeholder="Jane Doe"
        />
      </div>

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
          minLength={8}
          autoComplete="new-password"
          className="w-full rounded-lg border border-[#1E293B] bg-[#0F172A] px-4 py-2.5 text-white placeholder-slate-500 focus:border-[#00E5FA] focus:outline-none focus:ring-1 focus:ring-[#00E5FA]"
          placeholder="Min 8 characters"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-[#00E5FA] px-4 py-2.5 font-semibold text-[#00050F] transition hover:bg-[#00E5FA]/90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Creating account...' : 'Create Account'}
      </button>

      <p className="text-center text-sm text-slate-400">
        Already have access?{' '}
        <Link href="/login" className="text-[#00E5FA] hover:text-[#00E5FA]/80 font-medium">
          Sign In
        </Link>
      </p>
    </form>
  )
}
