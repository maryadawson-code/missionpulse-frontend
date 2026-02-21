'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Loader2, Copy, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

type MFAStep = 'enroll' | 'verify' | 'recovery'

export default function MFAPage() {
  const [step, setStep] = useState<MFAStep>('enroll')
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [secret, setSecret] = useState<string | null>(null)
  const [factorId, setFactorId] = useState<string | null>(null)
  const [verifyCode, setVerifyCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const supabase = createClient()

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
        setStep('verify')
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
        setError(verifyError.message)
        return
      }

      router.push('/')
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
    <div className="flex min-h-screen items-center justify-center bg-[#00050F] p-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-gray-900/50 p-8">
        <div className="text-center mb-6">
          <Shield className="mx-auto h-10 w-10 text-[#00E5FA]" />
          <h1 className="mt-3 text-xl font-bold text-white">
            Multi-Factor Authentication
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            {step === 'enroll' && 'Add an extra layer of security to your account'}
            {step === 'verify' && 'Scan the QR code with your authenticator app'}
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-900/50 bg-red-950/30 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Enroll Step */}
        {step === 'enroll' && (
          <div className="space-y-4">
            <div className="rounded-lg border border-gray-800 bg-gray-900/30 p-4">
              <h3 className="text-sm font-medium text-white mb-2">
                How it works
              </h3>
              <ol className="space-y-2 text-xs text-gray-400">
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

        {/* Verify Step */}
        {step === 'verify' && (
          <div className="space-y-4">
            {/* QR Code */}
            {qrCode && (
              <div className="flex justify-center">
                <div className="rounded-lg bg-white p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrCode} alt="MFA QR Code" className="h-48 w-48" />
                </div>
              </div>
            )}

            {/* Manual entry key */}
            {secret && (
              <div className="rounded-lg border border-gray-800 bg-gray-900/30 p-3">
                <p className="text-xs text-gray-400 mb-1">
                  Or enter this key manually:
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs font-mono text-[#00E5FA] break-all">
                    {secret}
                  </code>
                  <button
                    onClick={handleCopySecret}
                    className="shrink-0 text-gray-400 hover:text-white"
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

            {/* Verification code input */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Enter 6-digit code
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full rounded-lg border border-gray-700 bg-gray-900/50 px-3 py-2 text-center text-xl font-mono tracking-[0.5em] text-white placeholder-gray-600 outline-none focus:border-[#00E5FA]/50"
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

        {/* Skip option for non-CUI roles */}
        <div className="mt-4 text-center">
          <button
            onClick={() => router.push('/')}
            className="text-xs text-gray-500 hover:text-gray-300"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  )
}
