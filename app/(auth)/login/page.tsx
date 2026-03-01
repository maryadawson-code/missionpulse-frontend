import LoginForm from '@/components/auth/LoginForm'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign In — MissionPulse',
}

const ERROR_MESSAGES: Record<string, string> = {
  auth_callback_failed: 'Authentication failed. Please try again.',
  session_expired: 'Your session has expired. Please sign in again.',
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  const errorKey = searchParams?.error
  const callbackError = errorKey ? ERROR_MESSAGES[errorKey] ?? errorKey : undefined

  return (
    <>
      <h2 className="text-xl font-semibold text-foreground mb-6">Sign In</h2>
      <LoginForm callbackError={callbackError} />
    </>
  )
}
