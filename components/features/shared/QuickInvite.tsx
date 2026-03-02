'use client'

import { useState, useTransition } from 'react'
import { UserPlus, Copy, Check, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { generateInviteLink } from '@/lib/actions/workspace'

interface QuickInviteProps {
  companyId: string
  maxUsers: number
  currentTeamSize: number
}

const ROLE_OPTIONS = [
  { value: 'executive', label: 'Full Access' },
  { value: 'author', label: 'Proposal Writer' },
  { value: 'consultant', label: 'Reviewer' },
] as const

export function QuickInvite({ companyId, maxUsers, currentTeamSize }: QuickInviteProps) {
  const [role, setRole] = useState<string>('author')
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const spotsLeft = maxUsers - currentTeamSize

  if (spotsLeft <= 0) return null

  function handleGenerateLink() {
    setError(null)
    startTransition(async () => {
      const result = await generateInviteLink(companyId, role)
      if (result.success && result.link) {
        setInviteLink(result.link)
      } else {
        setError(result.error ?? 'Failed to generate invite link')
      }
    })
  }

  async function handleCopy() {
    if (!inviteLink) return
    try {
      await navigator.clipboard.writeText(inviteLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card/50 p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <UserPlus className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-foreground">Invite a Teammate</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {spotsLeft} {spotsLeft === 1 ? 'spot' : 'spots'} available on your plan
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {/* Role selection */}
        <div className="flex gap-2">
          {ROLE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { setRole(opt.value); setInviteLink(null) }}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                role === opt.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Generate / Show link */}
        {!inviteLink ? (
          <Button
            size="sm"
            variant="outline"
            onClick={handleGenerateLink}
            disabled={isPending}
            className="w-full"
          >
            <Send className="mr-2 h-3.5 w-3.5" />
            {isPending ? 'Generating...' : 'Generate Invite Link'}
          </Button>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={inviteLink}
              className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground"
            />
            <Button size="sm" variant="outline" onClick={handleCopy}>
              {copied ? (
                <Check className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        )}

        {error && (
          <p className="text-xs text-red-500 dark:text-red-400">{error}</p>
        )}
      </div>
    </div>
  )
}
