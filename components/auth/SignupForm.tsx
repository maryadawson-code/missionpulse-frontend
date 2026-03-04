'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { signUp } from '@/lib/actions/auth'
import { createBrowserClient } from '@supabase/ssr'

export default function SignupForm() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [confirmEmail, setConfirmEmail] = useState(false)
  const [email, setEmail] = useState('')
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)
  const [secondsElapsed, setSecondsElapsed] = useState(0)

  // Timer for "check spam" hint
  useEffect(() => {
    if (!confirmEmail) return
    const interval = setInterval(() => {
      setSecondsElapsed((s) => s + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [confirmEmail])

  const handleResend = useCallback(async () => {
    if (!email || resending) return
    setResending(true)
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      await supabase.auth.resend({ type: 'signup', email })
      setResent(true)
      setTimeout(() => setResent(false), 5000)
    } catch {
      // Silent fail — resend is best-effort
    } finally {
      setResending(false)
    }
  }, [email, resending])

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    setEmail(formData.get('email') as string)
    const result = await signUp(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else if (result?.confirmEmail) {
      setConfirmEmail(true)
      setLoading(false)
    }
  }

  if (confirmEmail) {
    return (
      <div className="space-y-4 text-center">
        <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-4 text-sm text-green-600 dark:text-green-400">
          <p className="font-medium">Check your email to confirm your account.</p>
          <p className="mt-1 text-xs opacity-80">
            We sent a confirmation link to <span className="font-medium">{email}</span>.
            It usually arrives in 1-2 minutes.
          </p>
        </div>

        {/* Spam hint after 60 seconds */}
        {secondsElapsed >= 60 && (
          <p className="text-xs text-muted-foreground">
            Don&apos;t see it? Check your spam or junk folder.
          </p>
        )}

        <div className="flex flex-col gap-2">
          <button
            onClick={handleResend}
            disabled={resending}
            className="text-sm text-primary hover:text-primary/80 font-medium disabled:opacity-50"
          >
            {resent ? 'Email resent!' : resending ? 'Resending...' : 'Resend confirmation email'}
          </button>

          <button
            onClick={() => {
              setConfirmEmail(false)
              setSecondsElapsed(0)
            }}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Use a different email
          </button>
        </div>

        <Link href="/login" className="block text-sm text-primary hover:text-primary/80">
          Back to Sign In
        </Link>
      </div>
    )
  }

  return (
    <form action={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="full_name" className="block text-sm font-medium text-muted-foreground mb-1.5">
          Full Name
        </label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          required
          className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="Jane Doe"
        />
      </div>

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
          minLength={8}
          autoComplete="new-password"
          className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="Min 8 characters"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-primary px-4 py-2.5 font-semibold text-[#00050F] transition hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Creating account...' : 'Create Account'}
      </button>

      <p className="text-center text-sm text-muted-foreground">
        Already have access?{' '}
        <Link href="/login" className="text-primary hover:text-primary/80 font-medium">
          Sign In
        </Link>
      </p>
    </form>
  )
}
