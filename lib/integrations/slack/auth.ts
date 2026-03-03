/**
 * Slack OAuth 2.0 — Bot Token Flow
 *
 * 1. User clicks Connect → redirect to Slack OAuth
 * 2. Slack calls back with code → exchange for bot token
 * 3. Token stored in integrations table
 *
 * Scopes: chat:write, channels:read, channels:join, users:read, incoming-webhook
 * Env vars: SLACK_CLIENT_ID, SLACK_CLIENT_SECRET, SLACK_REDIRECT_URI
 */
'use server'

import { createClient } from '@/lib/supabase/server'

// ─── Config ──────────────────────────────────────────────────

const SLACK_CLIENT_ID = process.env.SLACK_CLIENT_ID ?? ''
const SLACK_CLIENT_SECRET = process.env.SLACK_CLIENT_SECRET ?? ''
const SLACK_REDIRECT_URI =
  process.env.SLACK_REDIRECT_URI ?? 'https://missionpulse.ai/api/integrations/slack/callback'

const BOT_SCOPES = [
  'chat:write',
  'channels:read',
  'channels:join',
  'channels:manage',
  'users:read',
  'users:read.email',
  'incoming-webhook',
].join(',')

// ─── Types ───────────────────────────────────────────────────

interface SlackTokenResponse {
  ok: boolean
  access_token: string
  bot_user_id: string
  team: { id: string; name: string }
  incoming_webhook?: { url: string; channel: string; channel_id: string }
  error?: string
}

interface SlackConnection {
  isConnected: boolean
  teamName: string | null
  lastSync: string | null
  errorMessage: string | null
}

// ─── OAuth Flow ──────────────────────────────────────────────

/**
 * Generate the Slack OAuth authorization URL.
 */
export async function getSlackAuthUrl(): Promise<string> {
  const params = new URLSearchParams({
    client_id: SLACK_CLIENT_ID,
    scope: BOT_SCOPES,
    redirect_uri: SLACK_REDIRECT_URI,
  })

  return `https://slack.com/oauth/v2/authorize?${params.toString()}`
}

/**
 * Exchange an authorization code for a bot token and store it.
 */
export async function exchangeSlackCode(
  code: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  if (!profile?.company_id) return { success: false, error: 'No company' }

  try {
    const tokenResponse = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: SLACK_CLIENT_ID,
        client_secret: SLACK_CLIENT_SECRET,
        code,
        redirect_uri: SLACK_REDIRECT_URI,
      }),
    })

    const tokens: SlackTokenResponse = await tokenResponse.json()

    if (!tokens.ok) {
      return { success: false, error: `Slack OAuth failed: ${tokens.error}` }
    }

    await supabase.from('integrations').upsert(
      {
        provider: 'slack',
        name: 'Slack',
        company_id: profile.company_id,
        status: 'active',
        credentials_encrypted: JSON.stringify({
          bot_token: tokens.access_token,
          bot_user_id: tokens.bot_user_id,
          team_id: tokens.team.id,
          webhook_url: tokens.incoming_webhook?.url ?? null,
        }),
        config: JSON.parse(JSON.stringify({
          team_name: tokens.team.name,
          notification_prefs: getDefaultNotificationPrefs(),
          channel_mappings: {},
        })),
        error_message: null,
      },
      { onConflict: 'provider,company_id' }
    )

    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

/**
 * Disconnect Slack integration.
 */
export async function disconnectSlack(): Promise<{
  success: boolean
  error?: string
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  if (!profile?.company_id) return { success: false, error: 'No company' }

  const { error } = await supabase
    .from('integrations')
    .update({
      status: 'inactive',
      credentials_encrypted: null,
      error_message: null,
    })
    .eq('provider', 'slack')
    .eq('company_id', profile.company_id)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

/**
 * Get current Slack connection status.
 */
export async function getSlackConnection(): Promise<SlackConnection> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { isConnected: false, teamName: null, lastSync: null, errorMessage: null }

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  if (!profile?.company_id)
    return { isConnected: false, teamName: null, lastSync: null, errorMessage: null }

  const { data: integration } = await supabase
    .from('integrations')
    .select('status, last_sync, error_message, config')
    .eq('provider', 'slack')
    .eq('company_id', profile.company_id)
    .single()

  if (!integration)
    return { isConnected: false, teamName: null, lastSync: null, errorMessage: null }

  const config = integration.config as Record<string, unknown> | null

  return {
    isConnected: integration.status === 'active',
    teamName: (config?.team_name as string) ?? null,
    lastSync: integration.last_sync,
    errorMessage: integration.error_message,
  }
}

// ─── Helpers ────────────────────────────────────────────────

export interface NotificationPrefs {
  gate_approval: boolean
  deadline_warning: boolean
  hitl_pending: boolean
  pwin_change: boolean
  assignment: boolean
}

function getDefaultNotificationPrefs(): NotificationPrefs {
  return {
    gate_approval: true,
    deadline_warning: true,
    hitl_pending: true,
    pwin_change: true,
    assignment: true,
  }
}

/**
 * Update notification preferences.
 */
export async function updateNotificationPrefs(
  prefs: NotificationPrefs
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  if (!profile?.company_id) return { success: false, error: 'No company' }

  const { data: integration } = await supabase
    .from('integrations')
    .select('config')
    .eq('provider', 'slack')
    .eq('company_id', profile.company_id)
    .single()

  const existingConfig = (integration?.config as Record<string, unknown>) ?? {}

  const { error } = await supabase
    .from('integrations')
    .update({
      config: JSON.parse(JSON.stringify({
        ...existingConfig,
        notification_prefs: prefs,
      })),
    })
    .eq('provider', 'slack')
    .eq('company_id', profile.company_id)

  if (error) return { success: false, error: error.message }
  return { success: true }
}
