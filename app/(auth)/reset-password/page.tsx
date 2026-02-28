import ResetPasswordForm from '@/components/auth/ResetPasswordForm'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Set New Password — MissionPulse',
}

export default function ResetPasswordPage() {
  return (
    <>
      <h2 className="text-xl font-semibold text-white mb-2">Set New Password</h2>
      <p className="text-sm text-slate-400 mb-6">
        Enter your new password below.
      </p>
      <ResetPasswordForm />
    </>
  )
}
