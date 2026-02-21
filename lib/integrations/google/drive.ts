/**
 * Google Drive Integration
 *
 * Save documents to Google Drive, open in Google Docs,
 * manage folder structure per opportunity.
 *
 * API: Google Drive API v3
 */
'use server'

import { refreshGoogleToken } from './auth'

// ─── Config ──────────────────────────────────────────────────

const DRIVE_API = 'https://www.googleapis.com/drive/v3'
const UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3'

// ─── Types ───────────────────────────────────────────────────

export interface DriveFile {
  id: string
  name: string
  mimeType: string
  webViewLink: string | null
  webContentLink: string | null
  modifiedTime: string
  size: string | null
  parents: string[]
}

export interface DriveFolder {
  id: string
  name: string
  webViewLink: string | null
}

// ─── Folder Management ───────────────────────────────────────

/**
 * Ensure MissionPulse folder structure exists.
 * Creates: MissionPulse/[OpportunityTitle]/
 * Returns the opportunity folder ID.
 */
export async function ensureFolderStructure(
  companyId: string,
  opportunityTitle: string
): Promise<{ folderId: string | null; error?: string }> {
  const token = await refreshGoogleToken(companyId)
  if (!token) return { folderId: null, error: 'Not connected to Google Drive' }

  try {
    // Find or create "MissionPulse" root folder
    const rootFolder = await findOrCreateFolder(token, 'MissionPulse', 'root')
    if (!rootFolder) return { folderId: null, error: 'Failed to create MissionPulse folder' }

    // Find or create opportunity subfolder
    const sanitizedTitle = opportunityTitle.replace(/[/\\:*?"<>|]/g, '_').slice(0, 100)
    const oppFolder = await findOrCreateFolder(token, sanitizedTitle, rootFolder)
    if (!oppFolder) return { folderId: null, error: 'Failed to create opportunity folder' }

    return { folderId: oppFolder }
  } catch (err) {
    return { folderId: null, error: err instanceof Error ? err.message : 'Failed' }
  }
}

/**
 * Find an existing folder by name and parent, or create it.
 */
async function findOrCreateFolder(
  token: string,
  name: string,
  parentId: string
): Promise<string | null> {
  // Search for existing folder
  const query = `name='${name}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`
  const searchRes = await fetch(
    `${DRIVE_API}/files?q=${encodeURIComponent(query)}&fields=files(id,name)`,
    {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(10000),
    }
  )

  if (searchRes.ok) {
    const data = (await searchRes.json()) as { files: Array<{ id: string }> }
    if (data.files.length > 0) {
      return data.files[0].id
    }
  }

  // Create folder
  const createRes = await fetch(`${DRIVE_API}/files`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    }),
    signal: AbortSignal.timeout(10000),
  })

  if (!createRes.ok) return null

  const folder = (await createRes.json()) as { id: string }
  return folder.id
}

// ─── File Operations ─────────────────────────────────────────

/**
 * Save a file to Google Drive in the opportunity folder.
 */
export async function saveToGoogleDrive(
  companyId: string,
  fileName: string,
  content: string | ArrayBuffer,
  mimeType: string,
  folderId: string
): Promise<{ file: DriveFile | null; error?: string }> {
  const token = await refreshGoogleToken(companyId)
  if (!token) return { file: null, error: 'Not connected to Google Drive' }

  try {
    // Use multipart upload for metadata + content
    const metadata = {
      name: fileName,
      parents: [folderId],
    }

    const boundary = 'missionpulse_boundary_' + Date.now()
    const contentBytes = typeof content === 'string'
      ? new TextEncoder().encode(content)
      : new Uint8Array(content)

    // Build multipart body
    const metadataPart = JSON.stringify(metadata)
    const parts = [
      `--${boundary}\r\n`,
      'Content-Type: application/json; charset=UTF-8\r\n\r\n',
      metadataPart,
      `\r\n--${boundary}\r\n`,
      `Content-Type: ${mimeType}\r\n\r\n`,
    ]

    // Combine text parts with binary content
    const textEncoder = new TextEncoder()
    const textParts = textEncoder.encode(parts.join(''))
    const endBoundary = textEncoder.encode(`\r\n--${boundary}--`)

    const body = new Uint8Array(textParts.length + contentBytes.length + endBoundary.length)
    body.set(textParts, 0)
    body.set(contentBytes, textParts.length)
    body.set(endBoundary, textParts.length + contentBytes.length)

    const res = await fetch(`${UPLOAD_API}/files?uploadType=multipart&fields=id,name,mimeType,webViewLink,webContentLink,modifiedTime,size,parents`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
      signal: AbortSignal.timeout(30000),
    })

    if (!res.ok) {
      const err = await res.text()
      return { file: null, error: `Upload failed: ${err}` }
    }

    const file = (await res.json()) as DriveFile
    return { file }
  } catch (err) {
    return { file: null, error: err instanceof Error ? err.message : 'Upload failed' }
  }
}

/**
 * Get the Google Docs edit URL for a file.
 * Converts compatible files to Google Docs format.
 */
export async function getGoogleDocsUrl(
  companyId: string,
  fileId: string
): Promise<{ url: string | null; error?: string }> {
  const token = await refreshGoogleToken(companyId)
  if (!token) return { url: null, error: 'Not connected' }

  try {
    const res = await fetch(`${DRIVE_API}/files/${fileId}?fields=webViewLink,mimeType`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) return { url: null, error: 'File not found' }

    const file = (await res.json()) as { webViewLink: string; mimeType: string }
    return { url: file.webViewLink }
  } catch (err) {
    return { url: null, error: err instanceof Error ? err.message : 'Failed' }
  }
}

/**
 * List files in an opportunity folder.
 */
export async function listFolderFiles(
  companyId: string,
  folderId: string
): Promise<{ files: DriveFile[]; error?: string }> {
  const token = await refreshGoogleToken(companyId)
  if (!token) return { files: [], error: 'Not connected' }

  try {
    const query = `'${folderId}' in parents and trashed=false`
    const res = await fetch(
      `${DRIVE_API}/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,webViewLink,webContentLink,modifiedTime,size,parents)&orderBy=modifiedTime desc`,
      {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(10000),
      }
    )

    if (!res.ok) return { files: [], error: `API returned ${res.status}` }

    const data = (await res.json()) as { files: DriveFile[] }
    return { files: data.files ?? [] }
  } catch (err) {
    return { files: [], error: err instanceof Error ? err.message : 'Failed' }
  }
}

/**
 * Download a file from Google Drive.
 */
export async function downloadFromDrive(
  companyId: string,
  fileId: string
): Promise<{ data: ArrayBuffer | null; fileName: string | null; error?: string }> {
  const token = await refreshGoogleToken(companyId)
  if (!token) return { data: null, fileName: null, error: 'Not connected' }

  try {
    // Get file metadata first
    const metaRes = await fetch(`${DRIVE_API}/files/${fileId}?fields=name,mimeType`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(10000),
    })

    if (!metaRes.ok) return { data: null, fileName: null, error: 'File not found' }

    const meta = (await metaRes.json()) as { name: string; mimeType: string }

    // Check if it's a Google native doc (needs export) or a regular file (direct download)
    const isGoogleDoc = meta.mimeType.startsWith('application/vnd.google-apps.')

    let downloadUrl: string
    if (isGoogleDoc) {
      const exportMime = meta.mimeType === 'application/vnd.google-apps.document'
        ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        : meta.mimeType === 'application/vnd.google-apps.spreadsheet'
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : 'application/pdf'
      downloadUrl = `${DRIVE_API}/files/${fileId}/export?mimeType=${encodeURIComponent(exportMime)}`
    } else {
      downloadUrl = `${DRIVE_API}/files/${fileId}?alt=media`
    }

    const dataRes = await fetch(downloadUrl, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(30000),
    })

    if (!dataRes.ok) return { data: null, fileName: null, error: 'Download failed' }

    const data = await dataRes.arrayBuffer()
    return { data, fileName: meta.name }
  } catch (err) {
    return { data: null, fileName: null, error: err instanceof Error ? err.message : 'Failed' }
  }
}
