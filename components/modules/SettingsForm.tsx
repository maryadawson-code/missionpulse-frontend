// filepath: components/modules/SettingsForm.tsx
'use client'

import { useState, useTransition } from 'react'
import {
  updateProfile,
  updatePassword,
  updateNotificationPreferences,
} from '@/lib/actions/settings'
import { addToast } from '@/components/ui/Toast'

interface NotificationPref {
  notification_type: string
  email_enabled: boolean
  in_app_enabled: boolean
  push_enabled: boolean
}

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
  notificationPrefs?: NotificationPref[]
}

const NOTIFICATION_TYPES = [
  { type: 'gate_review', label: 'Gate Reviews' },
  { type: 'deadline_warning', label: 'Deadline Warnings' },
  { type: 'assignment', label: 'Task Assignments' },
  { type: 'pipeline_update', label: 'Pipeline Updates' },
  { type: 'compliance_alert', label: 'Compliance Alerts' },
  { type: 'team_mention', label: 'Team Mentions' },
]

export function SettingsForm({ profile, notificationPrefs = [] }: SettingsFormProps) {
  const [isPending, startTransition] = useTransition()
  const [passwordPending, startPasswordTransition] = useTransition()
  const [notifPending, startNotifTransition] = useTransition()

  const [prefs, setPrefs] = useState<NotificationPref[]>(() =>
    NOTIFICATION_TYPES.map((nt) => {
      const existing = notificationPrefs.find(
        (p) => p.notification_type === nt.type
      )
      return {
        notification_type: nt.type,
        email_enabled: existing?.email_enabled ?? true,
        in_app_enabled: existing?.in_app_enabled ?? true,
        push_enabled: existing?.push_enabled ?? false,
      }
    })
  )


  const inputClass =
    'w-full rounded-lg border border-border bg-card/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-primary/50 focus:ring-1 focus:ring-primary/25 disabled:opacity-50'
  const labelClass = 'block text-sm font-medium text-muted-foreground mb-1.5'

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
    const password = formData.get('new_password') as string
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
      } else {
        addToast('error', result.error ?? 'Failed to update password')
      }
    })
  }

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Profile Section */}
      <form action={handleProfileSubmit}>
        <fieldset className="space-y-4 rounded-xl border border-border bg-card/50 p-6">
          <legend className="text-sm font-semibold text-foreground px-2">
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
              <p className="mt-1 text-xs text-muted-foreground">
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
              className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-[#00050F] transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </fieldset>
      </form>

      {/* Password Section */}
      <form action={handlePasswordSubmit}>
        <fieldset className="space-y-4 rounded-xl border border-border bg-card/50 p-6">
          <legend className="text-sm font-semibold text-foreground px-2">
            Change Password
          </legend>

          <div>
            <label htmlFor="new_password" className={labelClass}>
              New Password
            </label>
            <input
              id="new_password"
              name="new_password"
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
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={passwordPending}
              className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-[#00050F] transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {passwordPending ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </fieldset>
      </form>

      {/* Notification Preferences */}
      <div className="rounded-xl border border-border bg-card/50 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Notification Preferences
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Choose how you want to be notified
            </p>
          </div>
          <button
            type="button"
            disabled={notifPending}
            onClick={() => {
              startNotifTransition(async () => {
                const result = await updateNotificationPreferences(prefs)
                if (result.success) {
                  addToast('success', 'Notification preferences saved')
                } else {
                  addToast('error', result.error ?? 'Failed to save preferences')
                }
              })
            }}
            className="rounded-lg bg-primary px-4 py-1.5 text-xs font-medium text-[#00050F] transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {notifPending ? 'Saving...' : 'Save'}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="py-2 text-xs font-semibold text-muted-foreground pr-4">
                  Type
                </th>
                <th className="py-2 text-xs font-semibold text-muted-foreground text-center px-4">
                  In-App
                </th>
                <th className="py-2 text-xs font-semibold text-muted-foreground text-center px-4">
                  Email
                </th>
                <th className="py-2 text-xs font-semibold text-muted-foreground text-center px-4">
                  Push
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {NOTIFICATION_TYPES.map((nt, idx) => (
                <tr key={nt.type}>
                  <td className="py-2.5 text-xs text-muted-foreground pr-4">
                    {nt.label}
                  </td>
                  <td className="py-2.5 text-center px-4">
                    <input
                      type="checkbox"
                      checked={prefs[idx].in_app_enabled}
                      onChange={(e) => {
                        const next = [...prefs]
                        next[idx] = { ...next[idx], in_app_enabled: e.target.checked }
                        setPrefs(next)
                      }}
                      className="rounded border-border text-primary"
                    />
                  </td>
                  <td className="py-2.5 text-center px-4">
                    <input
                      type="checkbox"
                      checked={prefs[idx].email_enabled}
                      onChange={(e) => {
                        const next = [...prefs]
                        next[idx] = { ...next[idx], email_enabled: e.target.checked }
                        setPrefs(next)
                      }}
                      className="rounded border-border text-primary"
                    />
                  </td>
                  <td className="py-2.5 text-center px-4">
                    <input
                      type="checkbox"
                      checked={prefs[idx].push_enabled}
                      onChange={(e) => {
                        const next = [...prefs]
                        next[idx] = { ...next[idx], push_enabled: e.target.checked }
                        setPrefs(next)
                      }}
                      className="rounded border-border text-primary"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Appearance */}
      <div className="rounded-xl border border-border bg-card/50 p-6">
        <h3 className="text-sm font-semibold text-foreground">Appearance</h3>
        <p className="mt-1 text-xs text-muted-foreground">Choose your preferred theme.</p>
        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg border border-primary/50 bg-primary/10 px-4 py-2.5 text-sm font-medium text-primary"
            disabled
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
            </svg>
            Dark
          </button>
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:border-border hover:text-muted-foreground"
            onClick={() => addToast('info', 'Light theme coming soon')}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
            </svg>
            Light
          </button>
        </div>
      </div>

      {/* Account Info */}
      <div className="rounded-xl border border-border bg-card/50 p-6">
        <h3 className="text-sm font-semibold text-foreground">Account</h3>
        <dl className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <dt className="text-xs text-muted-foreground">User ID</dt>
            <dd className="text-xs font-mono text-muted-foreground">{profile.id}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-xs text-muted-foreground">Role</dt>
            <dd className="text-xs text-muted-foreground">
              {profile.role.replace(/_/g, ' ')}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  )
}
