/**
 * SharePoint Integration — Microsoft Graph API
 *
 * Alternative to OneDrive for team-level document storage.
 * Uses SharePoint document libraries for collaborative proposal work.
 *
 * Features:
 * - Site/library picker
 * - Upload to team SharePoint
 * - File listing and download
 */
'use server'

import { createClient } from '@/lib/supabase/server'
import { refreshM365Token } from './auth'

// ─── Types ───────────────────────────────────────────────────

export interface SharePointSite {
  id: string
  name: string
  displayName: string
  webUrl: string
}

export interface SharePointLibrary {
  id: string
  name: string
  webUrl: string
  driveId: string
}

export interface SharePointFile {
  id: string
  name: string
  size: number
  webUrl: string
  lastModified: string
}

// ─── Site Discovery ─────────────────────────────────────────

/**
 * List SharePoint sites the user has access to.
 */
export async function listSites(): Promise<{
  sites: SharePointSite[]
  error?: string
}> {
  const { token, error } = await getValidToken()
  if (!token) return { sites: [], error: error ?? 'Not connected' }

  try {
    const res = await fetch(
      'https://graph.microsoft.com/v1.0/sites?search=*&$top=50',
      {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(10000),
      }
    )

    if (!res.ok) return { sites: [], error: `API returned ${res.status}` }

    const data = (await res.json()) as {
      value: Array<{
        id: string
        name: string
        displayName: string
        webUrl: string
      }>
    }

    return {
      sites: data.value.map((s) => ({
        id: s.id,
        name: s.name,
        displayName: s.displayName,
        webUrl: s.webUrl,
      })),
    }
  } catch (err) {
    return {
      sites: [],
      error: err instanceof Error ? err.message : 'Failed to list sites',
    }
  }
}

/**
 * List document libraries in a SharePoint site.
 */
export async function listLibraries(siteId: string): Promise<{
  libraries: SharePointLibrary[]
  error?: string
}> {
  const { token, error } = await getValidToken()
  if (!token) return { libraries: [], error: error ?? 'Not connected' }

  try {
    const res = await fetch(
      `https://graph.microsoft.com/v1.0/sites/${siteId}/drives`,
      {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(10000),
      }
    )

    if (!res.ok) return { libraries: [], error: `API returned ${res.status}` }

    const data = (await res.json()) as {
      value: Array<{
        id: string
        name: string
        webUrl: string
      }>
    }

    return {
      libraries: data.value.map((lib) => ({
        id: lib.id,
        name: lib.name,
        webUrl: lib.webUrl,
        driveId: lib.id,
      })),
    }
  } catch (err) {
    return {
      libraries: [],
      error: err instanceof Error ? err.message : 'Failed',
    }
  }
}

/**
 * Upload a file to a SharePoint document library.
 */
export async function uploadToSharePoint(
  driveId: string,
  folderPath: string,
  fileName: string,
  fileBuffer: Buffer
): Promise<{ success: boolean; webUrl?: string; error?: string }> {
  const { token, error } = await getValidToken()
  if (!token) return { success: false, error: error ?? 'Not connected' }

  try {
    const uploadPath = folderPath
      ? `${folderPath}/${fileName}`
      : fileName

    const res = await fetch(
      `https://graph.microsoft.com/v1.0/drives/${driveId}/root:/${uploadPath}:/content`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/octet-stream',
        },
        body: new Uint8Array(fileBuffer),
        signal: AbortSignal.timeout(30000),
      }
    )

    if (!res.ok) {
      const errText = await res.text()
      return { success: false, error: `Upload failed: ${errText}` }
    }

    const item = (await res.json()) as { webUrl: string }
    return { success: true, webUrl: item.webUrl }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Upload failed',
    }
  }
}

/**
 * List files in a SharePoint document library folder.
 */
export async function listSharePointFiles(
  driveId: string,
  folderPath?: string
): Promise<{ files: SharePointFile[]; error?: string }> {
  const { token, error } = await getValidToken()
  if (!token) return { files: [], error: error ?? 'Not connected' }

  try {
    const url = folderPath
      ? `https://graph.microsoft.com/v1.0/drives/${driveId}/root:/${folderPath}:/children?$top=100`
      : `https://graph.microsoft.com/v1.0/drives/${driveId}/root/children?$top=100`

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) {
      if (res.status === 404) return { files: [] }
      return { files: [], error: `API returned ${res.status}` }
    }

    const data = (await res.json()) as {
      value: Array<{
        id: string
        name: string
        size?: number
        webUrl: string
        lastModifiedDateTime: string
        file?: unknown
      }>
    }

    return {
      files: data.value
        .filter((item) => item.file)
        .map((item) => ({
          id: item.id,
          name: item.name,
          size: item.size ?? 0,
          webUrl: item.webUrl,
          lastModified: item.lastModifiedDateTime,
        })),
    }
  } catch (err) {
    return {
      files: [],
      error: err instanceof Error ? err.message : 'Failed',
    }
  }
}

/**
 * Save selected SharePoint site/library in integration config.
 */
export async function setSharePointTarget(
  siteId: string,
  siteName: string,
  driveId: string,
  libraryName: string
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
    .eq('provider', 'm365')
    .eq('company_id', profile.company_id)
    .single()

  const existingConfig = (integration?.config as Record<string, unknown>) ?? {}

  const { error: updateError } = await supabase
    .from('integrations')
    .update({
      config: JSON.parse(JSON.stringify({
        ...existingConfig,
        sharepoint: {
          site_id: siteId,
          site_name: siteName,
          drive_id: driveId,
          library_name: libraryName,
        },
      })),
    })
    .eq('provider', 'm365')
    .eq('company_id', profile.company_id)

  if (updateError) return { success: false, error: updateError.message }
  return { success: true }
}

// ─── Helpers ────────────────────────────────────────────────

async function getValidToken(): Promise<{
  token: string | null
  error?: string
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { token: null, error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  if (!profile?.company_id) return { token: null, error: 'No company' }

  const { data: integration } = await supabase
    .from('integrations')
    .select('id, credentials_encrypted')
    .eq('provider', 'm365')
    .eq('company_id', profile.company_id)
    .single()

  if (!integration?.credentials_encrypted) {
    return { token: null, error: 'M365 not connected' }
  }

  const creds = JSON.parse(integration.credentials_encrypted) as {
    access_token: string
    refresh_token: string
    expires_at: number
  }

  if (Date.now() < creds.expires_at - 60000) {
    return { token: creds.access_token }
  }

  const newTokens = await refreshM365Token(creds.refresh_token)
  if (!newTokens) return { token: null, error: 'Token refresh failed' }

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

  return { token: newTokens.access_token }
}
