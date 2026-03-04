/**
 * Unified connect/disconnect server actions for all integration providers.
 * Wraps existing per-provider auth modules into a single interface.
 */
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { IntegrationProvider } from '@/lib/integrations/availability'

import { getM365AuthUrl, disconnectM365 } from '@/lib/integrations/m365/auth'
import { getHubSpotAuthUrl, disconnectHubSpot } from '@/lib/integrations/hubspot/auth'
import { getSalesforceAuthUrl, disconnectSalesforce } from '@/lib/integrations/salesforce/auth'
import { getSlackAuthUrl, disconnectSlack } from '@/lib/integrations/slack/auth'
import { getGoogleAuthUrl, disconnectGoogle } from '@/lib/integrations/google/auth'
import { getDocuSignAuthUrl, disconnectDocuSign } from '@/lib/integrations/docusign/auth'

/**
 * Get the OAuth authorization URL for a given provider.
 */
export async function getAuthUrl(
  provider: IntegrationProvider
): Promise<{ url: string | null; error?: string }> {
  try {
    switch (provider) {
      case 'm365':
        return { url: await getM365AuthUrl() }
      case 'hubspot':
        return { url: await getHubSpotAuthUrl() }
      case 'salesforce':
        return { url: await getSalesforceAuthUrl() }
      case 'slack':
        return { url: await getSlackAuthUrl() }
      case 'google':
        return { url: await getGoogleAuthUrl() }
      case 'docusign':
        return { url: await getDocuSignAuthUrl() }
      default:
        return { url: null, error: 'Unknown provider' }
    }
  } catch (err) {
    return {
      url: null,
      error: err instanceof Error ? err.message : 'Failed to generate auth URL',
    }
  }
}

/**
 * Disconnect an integration for the current user's company.
 */
export async function disconnectIntegration(
  provider: IntegrationProvider
): Promise<{ success: boolean; error?: string }> {
  try {
    let result: { success: boolean; error?: string }

    switch (provider) {
      case 'm365':
        result = await disconnectM365()
        break
      case 'hubspot':
        result = await disconnectHubSpot()
        break
      case 'salesforce':
        result = await disconnectSalesforce()
        break
      case 'slack':
        result = await disconnectSlack()
        break
      case 'google': {
        const ctx = await getUserContext()
        if (!ctx) return { success: false, error: 'Not authenticated' }
        result = await disconnectGoogle(ctx.companyId, ctx.userId)
        break
      }
      case 'docusign': {
        const ctx = await getUserContext()
        if (!ctx) return { success: false, error: 'Not authenticated' }
        result = await disconnectDocuSign(ctx.companyId, ctx.userId)
        break
      }
      default:
        return { success: false, error: 'Unknown provider' }
    }

    if (result.success) {
      revalidatePath(`/integrations/${provider}`)
    }

    return result
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Disconnect failed',
    }
  }
}

/**
 * Helper to get userId + companyId for providers that require explicit params.
 */
async function getUserContext(): Promise<{
  userId: string
  companyId: string
} | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  if (!profile?.company_id) return null
  return { userId: user.id, companyId: profile.company_id }
}
