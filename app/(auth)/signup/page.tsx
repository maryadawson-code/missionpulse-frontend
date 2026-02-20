import SignupForm from '@/components/auth/SignupForm'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Create Account — MissionPulse',
}

export default function SignupPage() {
  return (
    <>
      <h2 className="text-xl font-semibold text-white mb-6">Create Account</h2>
      <SignupForm />
    </>
  )
}
