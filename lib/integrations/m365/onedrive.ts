/**
 * OneDrive Integration — Microsoft Graph API
 *
 * Save generated documents to OneDrive.
 * Open in Word Online for collaborative editing.
 * Bi-directional file sync for proposal volumes.
 *
 * Folder structure: /MissionPulse/[OpportunityTitle]/[Volume]/
 */
'use server'

import { createClient } from '@/lib/supabase/server'
import { refreshM365Token } from './auth'

// ─── Types ───────────────────────────────────────────────────

export interface OneDriveFile {
  id: string
  name: string
  size: number
  webUrl: string
  lastModified: string
  mimeType: string
  downloadUrl: string | null
}

export interface OneDriveFolder {
  id: string
  name: string
  webUrl: string
  childCount: number
}

interface GraphDriveItem {
  id: string
  name: string
  size?: number
  webUrl: string
  lastModifiedDateTime: string
  file?: { mimeType: string }
  folder?: { childCount: number }
  '@microsoft.graph.downloadUrl'?: string
}

// ─── Core Operations ────────────────────────────────────────

/**
 * Save a generated document to OneDrive.
 * Creates folder structure if it doesn't exist.
 */
export async function saveToOneDrive(
  fileBuffer: Buffer,
  fileName: string,
  opportunityTitle: string,
  volume: string
): Promise<{ success: boolean; webUrl?: string; error?: string }> {
  const { token, error } = await getValidToken()
  if (!token) return { success: false, error: error ?? 'Not connected' }

  const folderPath = `/MissionPulse/${sanitizePath(opportunityTitle)}/${sanitizePath(volume)}`

  try {
    // Ensure folder exists
    await ensureFolderPath(token, folderPath)

    // Upload file
    const uploadUrl = `https://graph.microsoft.com/v1.0/me/drive/root:${folderPath}/${sanitizePath(fileName)}:/content`

    const res = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/octet-stream',
      },
      body: new Uint8Array(fileBuffer),
      signal: AbortSignal.timeout(30000),
    })

    if (!res.ok) {
      const errText = await res.text()
      return { success: false, error: `Upload failed: ${errText}` }
    }

    const item = (await res.json()) as GraphDriveItem
    return { success: true, webUrl: item.webUrl }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Upload failed',
    }
  }
}

/**
 * Get the Word Online edit URL for a DOCX file on OneDrive.
 */
export async function getWordOnlineUrl(
  fileId: string
): Promise<{ url: string | null; error?: string }> {
  const { token, error } = await getValidToken()
  if (!token) return { url: null, error: error ?? 'Not connected' }

  try {
    const res = await fetch(
      `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(10000),
      }
    )

    if (!res.ok) return { url: null, error: `API returned ${res.status}` }

    const item = (await res.json()) as GraphDriveItem
    // Word Online URL is the webUrl for DOCX files
    return { url: item.webUrl }
  } catch (err) {
    return {
      url: null,
      error: err instanceof Error ? err.message : 'Failed',
    }
  }
}

/**
 * List files in an opportunity's OneDrive folder.
 */
export async function listOneDriveFiles(
  opportunityTitle: string,
  volume?: string
): Promise<{ files: OneDriveFile[]; error?: string }> {
  const { token, error } = await getValidToken()
  if (!token) return { files: [], error: error ?? 'Not connected' }

  const folderPath = volume
    ? `/MissionPulse/${sanitizePath(opportunityTitle)}/${sanitizePath(volume)}`
    : `/MissionPulse/${sanitizePath(opportunityTitle)}`

  try {
    const res = await fetch(
      `https://graph.microsoft.com/v1.0/me/drive/root:${folderPath}:/children?$top=100&$orderby=lastModifiedDateTime desc`,
      {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(10000),
      }
    )

    if (!res.ok) {
      if (res.status === 404) return { files: [] } // Folder doesn't exist yet
      return { files: [], error: `API returned ${res.status}` }
    }

    const data = (await res.json()) as { value: GraphDriveItem[] }

    const files: OneDriveFile[] = data.value
      .filter((item) => item.file) // Only files, not folders
      .map((item) => ({
        id: item.id,
        name: item.name,
        size: item.size ?? 0,
        webUrl: item.webUrl,
        lastModified: item.lastModifiedDateTime,
        mimeType: item.file?.mimeType ?? 'application/octet-stream',
        downloadUrl: item['@microsoft.graph.downloadUrl'] ?? null,
      }))

    return { files }
  } catch (err) {
    return {
      files: [],
      error: err instanceof Error ? err.message : 'Failed',
    }
  }
}

/**
 * Download a file from OneDrive.
 */
export async function downloadFromOneDrive(
  fileId: string
): Promise<{ data: Buffer | null; error?: string }> {
  const { token, error } = await getValidToken()
  if (!token) return { data: null, error: error ?? 'Not connected' }

  try {
    const res = await fetch(
      `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/content`,
      {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(30000),
      }
    )

    if (!res.ok) return { data: null, error: `Download failed: ${res.status}` }

    const arrayBuffer = await res.arrayBuffer()
    return { data: Buffer.from(arrayBuffer) }
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Download failed',
    }
  }
}

/**
 * Sync check: compare OneDrive file timestamps with local records.
 * Returns files that have been modified in OneDrive since last sync.
 */
export async function checkForUpdates(
  opportunityTitle: string
): Promise<{ updatedFiles: OneDriveFile[]; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { updatedFiles: [], error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  if (!profile?.company_id) return { updatedFiles: [], error: 'No company' }

  const { data: integration } = await supabase
    .from('integrations')
    .select('last_sync')
    .eq('provider', 'm365')
    .eq('company_id', profile.company_id)
    .single()

  const lastSync = integration?.last_sync

  const { files, error } = await listOneDriveFiles(opportunityTitle)
  if (error) return { updatedFiles: [], error }

  if (!lastSync) return { updatedFiles: files }

  const lastSyncDate = new Date(lastSync)
  const updatedFiles = files.filter(
    (f) => new Date(f.lastModified) > lastSyncDate
  )

  return { updatedFiles }
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

  // Token still valid?
  if (Date.now() < creds.expires_at - 60000) {
    return { token: creds.access_token }
  }

  // Refresh
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

async function ensureFolderPath(
  token: string,
  folderPath: string
): Promise<void> {
  const segments = folderPath.split('/').filter(Boolean)
  let currentPath = ''

  for (const segment of segments) {
    currentPath += `/${segment}`

    const checkRes = await fetch(
      `https://graph.microsoft.com/v1.0/me/drive/root:${currentPath}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(10000),
      }
    )

    if (checkRes.status === 404) {
      // Create folder
      const parentPath = currentPath.substring(0, currentPath.lastIndexOf('/')) || '/'
      const createUrl =
        parentPath === '/'
          ? 'https://graph.microsoft.com/v1.0/me/drive/root/children'
          : `https://graph.microsoft.com/v1.0/me/drive/root:${parentPath}:/children`

      await fetch(createUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: segment,
          folder: {},
          '@microsoft.graph.conflictBehavior': 'rename',
        }),
        signal: AbortSignal.timeout(10000),
      })
    }
  }
}

function sanitizePath(name: string): string {
  // OneDrive path restrictions: no * : < > ? / \ | " and no leading/trailing spaces
  return name
    .replace(/[*:<>?/\\|"]/g, '_')
    .replace(/^\.+/, '')
    .trim()
    .substring(0, 255)
}
