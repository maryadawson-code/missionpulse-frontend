'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Shield, Loader2, Copy, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

type MFAMode = 'loading' | 'challenge' | 'enroll' | 'verify'

export default function MFAPage() {
  const [mode, setMode] = useState<MFAMode>('loading')
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [secret, setSecret] = useState<string | null>(null)
  const [factorId, setFactorId] = useState<string | null>(null)
  const [verifyCode, setVerifyCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const supabase = createClient()

  // On mount, check if user already has MFA factors enrolled
  useEffect(() => {
    async function checkFactors() {
      const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()

      if (data?.currentLevel === 'aal2') {
        // Already fully authenticated with MFA
        router.push('/dashboard')
        return
      }

      if (data?.currentLevel === 'aal1' && data?.nextLevel === 'aal2') {
        // Has factors enrolled, needs to complete challenge
        const { data: factors } = await supabase.auth.mfa.listFactors()
        const totpFactor = factors?.totp?.[0]
        if (totpFactor) {
          setFactorId(totpFactor.id)
          setMode('challenge')
          return
        }
      }

      // No factors enrolled — show enrollment flow
      setMode('enroll')
    }

    checkFactors()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleEnroll() {
    setError(null)
    startTransition(async () => {
      const { data, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'MissionPulse Authenticator',
      })

      if (enrollError) {
        setError(enrollError.message)
        return
      }

      if (data) {
        setQrCode(data.totp.qr_code)
        setSecret(data.totp.secret)
        setFactorId(data.id)
        setMode('verify')
      }
    })
  }

  function handleVerify() {
    if (!factorId || verifyCode.length !== 6) return
    setError(null)

    startTransition(async () => {
      const challenge = await supabase.auth.mfa.challenge({ factorId })
      if (challenge.error) {
        setError(challenge.error.message)
        return
      }

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.data.id,
        code: verifyCode,
      })

      if (verifyError) {
        setError('Invalid code. Please try again.')
        setVerifyCode('')
        return
      }

      router.push('/dashboard')
    })
  }

  function handleCopySecret() {
    if (secret) {
      navigator.clipboard.writeText(secret)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card/50 p-8">
        <div className="text-center mb-6">
          <Shield className="mx-auto h-10 w-10 text-primary" />
          <h1 className="mt-3 text-xl font-bold text-foreground">
            Multi-Factor Authentication
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === 'loading' && 'Checking your security status...'}
            {mode === 'challenge' && 'Enter the code from your authenticator app'}
            {mode === 'enroll' && 'Add an extra layer of security to your account'}
            {mode === 'verify' && 'Scan the QR code with your authenticator app'}
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-900/50 bg-red-950/30 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Loading */}
        {mode === 'loading' && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Challenge — user has MFA enrolled, verify code */}
        {mode === 'challenge' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                Enter 6-digit code
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                autoFocus
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                placeholder="000000"
                className="w-full rounded-lg border border-border bg-card/50 px-3 py-2 text-center text-xl font-mono tracking-[0.5em] text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50"
              />
            </div>

            <Button
              className="w-full"
              onClick={handleVerify}
              disabled={isPending || verifyCode.length !== 6}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Verify'
              )}
            </Button>
          </div>
        )}

        {/* Enroll Step */}
        {mode === 'enroll' && (
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-card/30 p-4">
              <h3 className="text-sm font-medium text-foreground mb-2">
                How it works
              </h3>
              <ol className="space-y-2 text-xs text-muted-foreground">
                <li>1. Install an authenticator app (Google Authenticator, Authy, 1Password)</li>
                <li>2. Scan the QR code or enter the setup key manually</li>
                <li>3. Enter the 6-digit code from the app to verify</li>
              </ol>
            </div>

            <p className="text-xs text-amber-400">
              MFA is required for accessing CUI-protected modules (Pricing, Strategy, Black Hat).
            </p>

            <Button
              className="w-full"
              onClick={handleEnroll}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Shield className="h-4 w-4" />
              )}
              Set Up MFA
            </Button>
          </div>
        )}

        {/* Verify Step — after scanning QR */}
        {mode === 'verify' && (
          <div className="space-y-4">
            {qrCode && (
              <div className="flex justify-center">
                <div className="rounded-lg bg-white p-3">
                  <Image src={qrCode} alt="MFA QR Code" width={192} height={192} unoptimized className="h-48 w-48" />
                </div>
              </div>
            )}

            {secret && (
              <div className="rounded-lg border border-border bg-card/30 p-3">
                <p className="text-xs text-muted-foreground mb-1">
                  Or enter this key manually:
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs font-mono text-primary break-all">
                    {secret}
                  </code>
                  <button
                    onClick={handleCopySecret}
                    className="shrink-0 text-muted-foreground hover:text-foreground"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                Enter 6-digit code
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                placeholder="000000"
                className="w-full rounded-lg border border-border bg-card/50 px-3 py-2 text-center text-xl font-mono tracking-[0.5em] text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50"
              />
            </div>

            <Button
              className="w-full"
              onClick={handleVerify}
              disabled={isPending || verifyCode.length !== 6}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Verify & Enable MFA'
              )}
            </Button>
          </div>
        )}

        {/* Skip option — only during enrollment, not during challenge */}
        {(mode === 'enroll' || mode === 'verify') && (
          <div className="mt-4 text-center">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Skip for now
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
