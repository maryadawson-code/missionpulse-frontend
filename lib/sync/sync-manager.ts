// filepath: lib/sync/sync-manager.ts
/**
 * Sync Manager — Central Orchestrator
 *
 * Coordinates bi-directional sync between MissionPulse and cloud
 * providers (OneDrive, Google Drive, SharePoint). Handles webhook
 * processing, content fetch/push, and conflict detection.
 *
 * v1.3 Sprint 29 — Sync Engine
 */
'use server'

import { createSyncClient } from '@/lib/supabase/sync-client'
import type { ActionResult } from '@/lib/types'
import type {
  CloudProvider,
  DocumentSyncState,
  SyncStatus,
} from '@/lib/types/sync'
import { computeDiff, summarizeDiff } from './diff-engine'
import { detectConflict, createConflictRecord } from './conflict-resolver'

// ─── Provider API Base URLs ───────────────────────────────────

const PROVIDER_ENDPOINTS: Record<CloudProvider, string> = {
  onedrive: 'https://graph.microsoft.com/v1.0/me/drive/items',
  google_drive: 'https://www.googleapis.com/drive/v3/files',
  sharepoint: 'https://graph.microsoft.com/v1.0/sites',
}

// ─── Webhook Processing ───────────────────────────────────────

/**
 * Process an incoming webhook notification from a cloud provider.
 * Determines which documents are affected and enqueues sync operations.
 */
export async function processWebhook(
  provider: CloudProvider,
  payload: Record<string, unknown>
): Promise<void> {
  const supabase = await createSyncClient()

  // Extract cloud file ID from provider-specific payload
  const cloudFileId = extractCloudFileId(provider, payload)
  if (!cloudFileId) return

  // Find the matching document sync state
  const { data: syncState } = await supabase
    .from('document_sync_state')
    .select('*')
    .eq('cloud_provider', provider)
    .eq('cloud_file_id', cloudFileId)
    .single()

  if (!syncState) return

  // Update last cloud edit timestamp
  const now = new Date().toISOString()
  await supabase
    .from('document_sync_state')
    .update({
      last_cloud_edit_at: now,
      sync_status: 'syncing' satisfies SyncStatus,
      updated_at: now,
    })
    .eq('id', syncState.id)

  // Fetch cloud content and compare
  const cloudData = await fetchCloudContent(syncState.document_id, provider)
  if (!cloudData) {
    await updateSyncStatus(syncState.document_id, 'error')
    return
  }

  // Fetch current MP content for comparison
  const { data: mpDoc } = await supabase
    .from('proposal_sections')
    .select('content')
    .eq('id', syncState.document_id)
    .single()

  const mpContent = (mpDoc?.content as string) ?? ''

  // Run conflict detection
  const conflict = await detectConflict(mpContent, cloudData.content, null)

  if (conflict.hasConflict) {
    await createConflictRecord(
      syncState.document_id,
      null,
      syncState.company_id,
      { content: mpContent, updated_at: now },
      { content: cloudData.content, updated_at: cloudData.lastModified, source: provider }
    )
    // Status set to 'conflict' by createConflictRecord
  } else if (conflict.cloudChanged && !conflict.mpChanged) {
    // Only cloud changed — safe to pull
    await supabase
      .from('proposal_sections')
      .update({ content: cloudData.content, updated_at: now })
      .eq('id', syncState.document_id)

    await updateSyncStatus(syncState.document_id, 'synced')
  } else {
    await updateSyncStatus(syncState.document_id, 'synced')
  }
}

// ─── Fetch Cloud Content ──────────────────────────────────────

/**
 * Fetch the current content and metadata of a document from its
 * cloud provider. Returns null if the fetch fails.
 */
export async function fetchCloudContent(
  documentId: string,
  provider: CloudProvider
): Promise<{ content: string; lastModified: string } | null> {
  const supabase = await createSyncClient()

  const { data: syncState } = await supabase
    .from('document_sync_state')
    .select('cloud_file_id, metadata')
    .eq('document_id', documentId)
    .eq('cloud_provider', provider)
    .single()

  if (!syncState) return null

  const token = await getProviderToken(provider)
  if (!token) return null

  try {
    const endpoint = PROVIDER_ENDPOINTS[provider]
    const url = buildContentUrl(provider, endpoint, syncState.cloud_file_id)

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(15000),
    })

    if (!res.ok) return null

    const content = await res.text()

    // Get last modified from metadata endpoint
    const metaUrl = `${PROVIDER_ENDPOINTS[provider]}/${syncState.cloud_file_id}`
    const metaRes = await fetch(metaUrl, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(10000),
    })

    let lastModified = new Date().toISOString()
    if (metaRes.ok) {
      const meta = (await metaRes.json()) as Record<string, unknown>
      lastModified =
        (meta.lastModifiedDateTime as string) ??
        (meta.modifiedTime as string) ??
        lastModified
    }

    return { content, lastModified }
  } catch {
    return null
  }
}

// ─── Push to Cloud ────────────────────────────────────────────

/**
 * Push content from MissionPulse to the cloud provider.
 * Computes a diff for the version history before pushing.
 */
export async function syncToCloud(
  documentId: string,
  content: string,
  provider: CloudProvider
): Promise<ActionResult> {
  const supabase = await createSyncClient()

  const { data: syncState } = await supabase
    .from('document_sync_state')
    .select('id, cloud_file_id, company_id')
    .eq('document_id', documentId)
    .eq('cloud_provider', provider)
    .single()

  if (!syncState) {
    return { success: false, error: 'No sync state found for this document' }
  }

  // Set status to syncing
  await updateSyncStatus(documentId, 'syncing')

  const token = await getProviderToken(provider)
  if (!token) {
    await updateSyncStatus(documentId, 'error')
    return { success: false, error: `${provider} not connected` }
  }

  try {
    // Fetch current cloud content for diff
    const cloudData = await fetchCloudContent(documentId, provider)
    const previousContent = cloudData?.content ?? ''

    // Compute diff for version history
    const diff = await computeDiff(previousContent, content)
    const summary = await summarizeDiff(diff)

    // Push to cloud provider
    const uploadUrl = buildUploadUrl(
      provider,
      PROVIDER_ENDPOINTS[provider],
      syncState.cloud_file_id
    )

    const res = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'text/plain',
      },
      body: content,
      signal: AbortSignal.timeout(30000),
    })

    if (!res.ok) {
      await updateSyncStatus(documentId, 'error')
      return { success: false, error: `Cloud upload failed: ${res.status}` }
    }

    const now = new Date().toISOString()

    // Record version in document_versions
    await supabase.from('document_versions').insert({
      document_id: documentId,
      company_id: syncState.company_id,
      source: 'missionpulse',
      snapshot: { content },
      diff_summary: summary,
    })

    // Update sync state
    await supabase
      .from('document_sync_state')
      .update({
        sync_status: 'synced' satisfies SyncStatus,
        last_sync_at: now,
        last_mp_edit_at: now,
        updated_at: now,
      })
      .eq('id', syncState.id)

    return { success: true }
  } catch (err) {
    await updateSyncStatus(documentId, 'error')
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Sync failed',
    }
  }
}

// ─── Sync Status ──────────────────────────────────────────────

/**
 * Get the current sync status for a document.
 */
export async function getSyncStatus(
  documentId: string
): Promise<DocumentSyncState | null> {
  const supabase = await createSyncClient()

  const { data } = await supabase
    .from('document_sync_state')
    .select('*')
    .eq('document_id', documentId)
    .single()

  return (data as DocumentSyncState) ?? null
}

// ─── Initialize Sync ──────────────────────────────────────────

/**
 * Initialize sync for a document by creating a document_sync_state record.
 * Called when a user first connects a document to a cloud file.
 */
export async function initializeSync(
  documentId: string,
  provider: CloudProvider,
  cloudFileId: string,
  companyId: string
): Promise<ActionResult> {
  const supabase = await createSyncClient()

  // Check if sync state already exists
  const { data: existing } = await supabase
    .from('document_sync_state')
    .select('id')
    .eq('document_id', documentId)
    .eq('cloud_provider', provider)
    .single()

  if (existing) {
    return { success: false, error: 'Sync already initialized for this document and provider' }
  }

  const now = new Date().toISOString()

  const { error } = await supabase.from('document_sync_state').insert({
    document_id: documentId,
    company_id: companyId,
    cloud_provider: provider,
    cloud_file_id: cloudFileId,
    sync_status: 'idle' satisfies SyncStatus,
    metadata: {},
    created_at: now,
    updated_at: now,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  // Write audit log
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    await supabase.from('audit_logs').insert({
      action: 'sync_initialized',
      entity_type: 'document_sync_state',
      entity_id: documentId,
      user_id: user.id,
      metadata: { provider, cloud_file_id: cloudFileId },
    })
  }

  return { success: true }
}

// ─── Internal Helpers ─────────────────────────────────────────

/**
 * Update the sync_status field on document_sync_state.
 */
async function updateSyncStatus(
  documentId: string,
  status: SyncStatus
): Promise<void> {
  const supabase = await createSyncClient()

  await supabase
    .from('document_sync_state')
    .update({
      sync_status: status,
      updated_at: new Date().toISOString(),
    })
    .eq('document_id', documentId)
}

/**
 * Extract the cloud file ID from a webhook payload.
 * Each provider sends a different payload structure.
 */
function extractCloudFileId(
  provider: CloudProvider,
  payload: Record<string, unknown>
): string | null {
  switch (provider) {
    case 'onedrive':
    case 'sharepoint': {
      // Microsoft Graph sends { value: [{ resourceData: { id } }] }
      const value = payload.value as { resourceData?: { id?: string } }[] | undefined
      return value?.[0]?.resourceData?.id ?? null
    }
    case 'google_drive': {
      // Google sends { fileId } in the notification
      return (payload.fileId as string) ?? null
    }
  }
}

/**
 * Build the content download URL for a provider.
 */
function buildContentUrl(
  provider: CloudProvider,
  endpoint: string,
  fileId: string
): string {
  switch (provider) {
    case 'onedrive':
    case 'sharepoint':
      return `${endpoint}/${fileId}/content`
    case 'google_drive':
      return `${endpoint}/${fileId}?alt=media`
  }
}

/**
 * Build the content upload URL for a provider.
 */
function buildUploadUrl(
  provider: CloudProvider,
  endpoint: string,
  fileId: string
): string {
  switch (provider) {
    case 'onedrive':
    case 'sharepoint':
      return `${endpoint}/${fileId}/content`
    case 'google_drive':
      return `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`
  }
}

/**
 * Get a valid OAuth token for the cloud provider.
 * Delegates to the appropriate integration module.
 */
async function getProviderToken(
  provider: CloudProvider
): Promise<string | null> {
  const supabase = await createSyncClient()

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

  // Map cloud provider to integration provider name
  const integrationProvider =
    provider === 'google_drive' ? 'google' : 'm365'

  const { data: integration } = await supabase
    .from('integrations')
    .select('credentials_encrypted')
    .eq('provider', integrationProvider)
    .eq('company_id', profile.company_id)
    .single()

  if (!integration?.credentials_encrypted) return null

  const creds = JSON.parse(integration.credentials_encrypted) as {
    access_token: string
    expires_at: number
  }

  // Check if token is still valid (with 60s buffer)
  if (Date.now() < creds.expires_at - 60000) {
    return creds.access_token
  }

  // Token expired — caller should handle refresh or return null
  return null
}
