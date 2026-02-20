import LoginForm from '@/components/auth/LoginForm'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign In — MissionPulse',
}

export default function LoginPage() {
  return (
    <>
      <h2 className="text-xl font-semibold text-white mb-6">Sign In</h2>
      <LoginForm />
    </>
  )
}
