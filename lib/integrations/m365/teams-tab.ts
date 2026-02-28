/**
 * Microsoft Teams Tab App
 *
 * Embed MissionPulse opportunity dashboard as a Teams channel tab.
 * Uses Graph API to manage tabs in Teams channels.
 */
'use server'

import { createClient } from '@/lib/supabase/server'
import { refreshM365Token } from './auth'

// ─── Types ───────────────────────────────────────────────────

interface TeamsTabConfig {
  tabId: string
  displayName: string
  opportunityId: string
  teamId: string
  channelId: string
  contentUrl: string
  websiteUrl: string
}

// ─── Token Helper ────────────────────────────────────────────

const GRAPH_URL = 'https://graph.microsoft.com/v1.0'

async function getToken(companyId: string): Promise<string | null> {
  const supabase = await createClient()

  const { data: integration } = await supabase
    .from('integrations')
    .select('id, credentials_encrypted')
    .eq('provider', 'm365')
    .eq('company_id', companyId)
    .single()

  if (!integration?.credentials_encrypted) return null

  const creds = JSON.parse(integration.credentials_encrypted) as {
    access_token: string
    refresh_token: string
    expires_at: number
  }

  if (Date.now() < creds.expires_at - 60000) {
    return creds.access_token
  }

  const newTokens = await refreshM365Token(creds.refresh_token)
  if (!newTokens) return null

  await supabase
    .from('integrations')
    .update({
      credentials_encrypted: JSON.stringify({
        access_token: newTokens.access_token,
        refresh_token: newTokens.refresh_token,
        expires_at: Date.now() + newTokens.expires_in * 1000,
      }),
    })
    .eq('id', integration.id)

  return newTokens.access_token
}

// ─── Tab Management ──────────────────────────────────────────

/**
 * Add a MissionPulse tab to a Teams channel.
 * Embeds the opportunity dashboard as a website tab.
 */
export async function addTeamsTab(
  companyId: string,
  teamId: string,
  channelId: string,
  opportunity: { id: string; title: string }
): Promise<TeamsTabConfig | null> {
  const token = await getToken(companyId)
  if (!token) return null

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://missionpulse.ai'
  const contentUrl = `${baseUrl}/pipeline/${opportunity.id}?embed=teams`
  const websiteUrl = `${baseUrl}/pipeline/${opportunity.id}`

  const response = await fetch(
    `${GRAPH_URL}/teams/${teamId}/channels/${channelId}/tabs`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        displayName: `MP: ${opportunity.title.slice(0, 40)}`,
        'teamsApp@odata.bind': `${GRAPH_URL}/appCatalogs/teamsApps/com.microsoft.teamspace.tab.web`,
        configuration: {
          entityId: `missionpulse-${opportunity.id}`,
          contentUrl,
          websiteUrl,
          removeUrl: `${baseUrl}/api/integrations/m365/tab-remove`,
        },
      }),
    }
  )

  if (!response.ok) return null

  const tab = await response.json()

  return {
    tabId: tab.id,
    displayName: tab.displayName,
    opportunityId: opportunity.id,
    teamId,
    channelId,
    contentUrl,
    websiteUrl,
  }
}

/**
 * Remove a MissionPulse tab from a Teams channel.
 */
export async function removeTeamsTab(
  companyId: string,
  teamId: string,
  channelId: string,
  tabId: string
): Promise<boolean> {
  const token = await getToken(companyId)
  if (!token) return false

  const response = await fetch(
    `${GRAPH_URL}/teams/${teamId}/channels/${channelId}/tabs/${tabId}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }
  )

  return response.ok
}

/**
 * List all MissionPulse tabs in a Teams channel.
 */
export async function listMissionPulseTabs(
  companyId: string,
  teamId: string,
  channelId: string
): Promise<TeamsTabConfig[]> {
  const token = await getToken(companyId)
  if (!token) return []

  const response = await fetch(
    `${GRAPH_URL}/teams/${teamId}/channels/${channelId}/tabs?$expand=teamsApp`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  )

  if (!response.ok) return []

  const data = await response.json()
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://missionpulse.ai'

  return (data.value ?? [])
    .filter((tab: Record<string, unknown>) => {
      const config = tab.configuration as Record<string, unknown> | null
      return config?.contentUrl && String(config.contentUrl).includes(baseUrl)
    })
    .map((tab: Record<string, unknown>) => {
      const config = tab.configuration as Record<string, unknown>
      const entityId = String(config.entityId ?? '')
      const oppId = entityId.replace('missionpulse-', '')

      return {
        tabId: tab.id as string,
        displayName: tab.displayName as string,
        opportunityId: oppId,
        teamId,
        channelId,
        contentUrl: config.contentUrl as string,
        websiteUrl: config.websiteUrl as string,
      }
    })
}

/**
 * Store Teams tab configuration in the opportunity metadata.
 */
export async function saveTabConfig(
  opportunityId: string,
  config: TeamsTabConfig
): Promise<{ success: boolean }> {
  const supabase = await createClient()

  const { data: opp } = await supabase
    .from('opportunities')
    .select('metadata')
    .eq('id', opportunityId)
    .single()

  const metadata = (opp?.metadata as Record<string, unknown>) ?? {}

  await supabase
    .from('opportunities')
    .update({
      metadata: JSON.parse(JSON.stringify({
        ...metadata,
        teams_tab: {
          tabId: config.tabId,
          teamId: config.teamId,
          channelId: config.channelId,
        },
      })),
    })
    .eq('id', opportunityId)

  return { success: true }
}
