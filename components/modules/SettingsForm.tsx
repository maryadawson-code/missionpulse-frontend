// filepath: components/modules/SettingsForm.tsx
'use client'

import { useState, useTransition } from 'react'
import { updateProfile, updatePassword } from '@/lib/actions/settings'
import { addToast } from '@/components/ui/Toast'

interface SettingsFormProps {
  profile: {
    id: string
    full_name: string
    email: string
    company: string
    phone: string
    avatar_url: string
    role: string
  }
}

export function SettingsForm({ profile }: SettingsFormProps) {
  const [isPending, startTransition] = useTransition()
  const [passwordPending, startPasswordTransition] = useTransition()
  const [showPasswordForm, setShowPasswordForm] = useState(false)

  const inputClass =
    'w-full rounded-lg border border-gray-700 bg-gray-900/50 px-3 py-2 text-sm text-gray-200 placeholder-gray-500 outline-none transition-colors focus:border-[#00E5FA]/50 focus:ring-1 focus:ring-[#00E5FA]/25 disabled:opacity-50'
  const labelClass = 'block text-sm font-medium text-gray-300 mb-1.5'

  function handleProfileSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await updateProfile(formData)
      if (result.success) {
        addToast('success', 'Profile updated')
      } else {
        addToast('error', result.error ?? 'Failed to update profile')
      }
    })
  }

  function handlePasswordSubmit(formData: FormData) {
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirm_password') as string

    if (password.length < 8) {
      addToast('error', 'Password must be at least 8 characters')
      return
    }
    if (password !== confirmPassword) {
      addToast('error', 'Passwords do not match')
      return
    }

    startPasswordTransition(async () => {
      const result = await updatePassword(formData)
      if (result.success) {
        addToast('success', 'Password updated')
        setShowPasswordForm(false)
      } else {
        addToast('error', result.error ?? 'Failed to update password')
      }
    })
  }

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Profile Section */}
      <form action={handleProfileSubmit}>
        <fieldset className="space-y-4 rounded-xl border border-gray-800 bg-gray-900/50 p-6">
          <legend className="text-sm font-semibold text-white px-2">
            Profile Information
          </legend>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="full_name" className={labelClass}>
                Full Name
              </label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                defaultValue={profile.full_name}
                placeholder="Your full name"
                className={inputClass}
                disabled={isPending}
              />
            </div>

            <div>
              <label htmlFor="email" className={labelClass}>
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                defaultValue={profile.email}
                className={inputClass}
                disabled
              />
              <p className="mt-1 text-xs text-gray-500">
                Contact admin to change email
              </p>
            </div>

            <div>
              <label htmlFor="role" className={labelClass}>
                Role
              </label>
              <input
                id="role"
                type="text"
                value={profile.role.replace(/_/g, ' ')}
                className={inputClass}
                disabled
              />
            </div>

            <div>
              <label htmlFor="company" className={labelClass}>
                Company
              </label>
              <input
                id="company"
                name="company"
                type="text"
                defaultValue={profile.company}
                placeholder="Your company name"
                className={inputClass}
                disabled={isPending}
              />
            </div>

            <div>
              <label htmlFor="phone" className={labelClass}>
                Phone
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                defaultValue={profile.phone}
                placeholder="(555) 123-4567"
                className={inputClass}
                disabled={isPending}
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="avatar_url" className={labelClass}>
                Avatar URL
              </label>
              <input
                id="avatar_url"
                name="avatar_url"
                type="url"
                defaultValue={profile.avatar_url}
                placeholder="https://example.com/avatar.jpg"
                className={inputClass}
                disabled={isPending}
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-[#00E5FA] px-6 py-2 text-sm font-medium text-[#00050F] transition-colors hover:bg-[#00E5FA]/90 disabled:opacity-50"
            >
              {isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </fieldset>
      </form>

      {/* Password Section */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Password</h3>
            <p className="mt-1 text-xs text-gray-500">
              Update your account password
            </p>
          </div>
          {!showPasswordForm && (
            <button
              onClick={() => setShowPasswordForm(true)}
              className="rounded-lg border border-gray-700 px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
            >
              Change Password
            </button>
          )}
        </div>

        {showPasswordForm && (
          <form action={handlePasswordSubmit} className="mt-4 space-y-4">
            <div>
              <label htmlFor="password" className={labelClass}>
                New Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                placeholder="Minimum 8 characters"
                className={inputClass}
                disabled={passwordPending}
              />
            </div>
            <div>
              <label htmlFor="confirm_password" className={labelClass}>
                Confirm Password
              </label>
              <input
                id="confirm_password"
                name="confirm_password"
                type="password"
                required
                minLength={8}
                placeholder="Confirm new password"
                className={inputClass}
                disabled={passwordPending}
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={passwordPending}
                className="rounded-lg bg-[#00E5FA] px-6 py-2 text-sm font-medium text-[#00050F] transition-colors hover:bg-[#00E5FA]/90 disabled:opacity-50"
              >
                {passwordPending ? 'Updating...' : 'Update Password'}
              </button>
              <button
                type="button"
                onClick={() => setShowPasswordForm(false)}
                disabled={passwordPending}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-400 transition-colors hover:text-gray-200 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Account Info */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
        <h3 className="text-sm font-semibold text-white">Account</h3>
        <dl className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <dt className="text-xs text-gray-500">User ID</dt>
            <dd className="text-xs font-mono text-gray-400">{profile.id}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-xs text-gray-500">Role</dt>
            <dd className="text-xs text-gray-400">
              {profile.role.replace(/_/g, ' ')}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  )
}
