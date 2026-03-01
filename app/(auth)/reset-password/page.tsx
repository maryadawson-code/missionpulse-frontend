import ResetPasswordForm from '@/components/auth/ResetPasswordForm'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Set New Password — MissionPulse',
}

export default function ResetPasswordPage() {
  return (
    <>
      <h2 className="text-xl font-semibold text-foreground mb-2">Set New Password</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Enter your new password below.
      </p>
      <ResetPasswordForm />
    </>
  )
}
