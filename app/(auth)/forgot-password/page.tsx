import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Reset Password — MissionPulse',
}

export default function ForgotPasswordPage() {
  return (
    <>
      <h2 className="text-xl font-semibold text-foreground mb-6">Reset Password</h2>
      <ForgotPasswordForm />
    </>
  )
}
