// filepath: lib/utils/cloud-binder-assembly.ts
/**
 * Cloud-Aware Binder Assembly
 *
 * Assembles a proposal binder ZIP that includes cloud document references
 * and sync status metadata. Extends the base binder-assembly module with
 * Phase J sync awareness.
 *
 * v1.3 Sprint 30 -- Cross-Document Intelligence
 */
'use server'

import JSZip from 'jszip'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createSyncClient } from '@/lib/supabase/sync-client'
import type { ActionResult } from '@/lib/types'
import type {
  ArtifactStatus,
  SyncStatus,
  CloudProvider,
  DocumentSource,
} from '@/lib/types/sync'

// -- Types ------------------------------------------------------------------

interface BinderManifestEntry {
  volumeName: string
  sectionTitle: string
  sectionId: string
  status: string | null
  wordCount: number
  syncStatus: SyncStatus
  cloudProvider: CloudProvider | null
  cloudWebUrl: string | null
  lastEditedBy: string | null
  lastEditedAt: string | null
  editSource: DocumentSource | null
}

interface BinderManifest {
  opportunityId: string
  opportunityTitle: string
  assembledAt: string
  assembledBy: string
  totalSections: number
  totalWordCount: number
  syncHealth: number
  artifacts: BinderManifestEntry[]
}

// -- Helpers ----------------------------------------------------------------

function sanitizeFilename(title: string): string {
  return title
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .replace(/\s+/g, '_')
    .slice(0, 50)
}

function countWords(text: string | null): number {
  if (!text) return 0
  return text.split(/\s+/).filter(Boolean).length
}

function computeSyncHealth(statuses: ArtifactStatus[]): number {
  if (statuses.length === 0) return 100
  const syncedOrIdle = statuses.filter(
    (s) => s.syncStatus === 'synced' || s.syncStatus === 'idle'
  ).length
  return Math.round((syncedOrIdle / statuses.length) * 100)
}

// -- Public API -------------------------------------------------------------

/**
 * Fetch sync status for all proposal artifacts in an opportunity.
 *
 * Joins proposal_sections (from the standard DB) with document_sync_state
 * (from the Phase J sync tables) to produce a combined artifact status
 * for each volume/section.
 */
export async function getArtifactStatuses(
  opportunityId: string
): Promise<ArtifactStatus[]> {
  const supabase = await createClient()
  const syncClient = await createSyncClient()

  // Fetch all proposal sections for this opportunity
  const { data: sections, error: sectionsError } = await supabase
    .from('proposal_sections')
    .select('id, section_title, volume, content')
    .eq('opportunity_id', opportunityId)
    .order('volume', { ascending: true })
    .order('sort_order', { ascending: true })

  if (sectionsError || !sections) return []

  // Fetch sync states for all section document IDs
  const sectionIds = sections.map((s) => s.id)
  const { data: syncStates } = await syncClient
    .from('document_sync_state')
    .select(
      'document_id, sync_status, cloud_provider, last_cloud_edit_at, last_mp_edit_at, metadata'
    )
    .in('document_id', sectionIds)

  // Build a lookup map from document_id to sync state
  const syncMap = new Map<
    string,
    {
      sync_status: string
      cloud_provider: string | null
      last_cloud_edit_at: string | null
      last_mp_edit_at: string | null
      metadata: Record<string, unknown> | null
    }
  >()
  for (const state of syncStates ?? []) {
    syncMap.set(state.document_id, state)
  }

  return sections.map((section) => {
    const sync = syncMap.get(section.id)
    const lastEditedAt = sync
      ? sync.last_cloud_edit_at ?? sync.last_mp_edit_at
      : null
    const metadata = (sync?.metadata ?? {}) as Record<string, unknown>
    const lastEditedBy = (metadata.last_edited_by as string) ?? null
    const editSource = (metadata.edit_source as DocumentSource) ?? null

    return {
      volumeName: section.volume ?? 'Unassigned',
      documentId: section.id,
      syncStatus: (sync?.sync_status as SyncStatus) ?? 'idle',
      cloudProvider: (sync?.cloud_provider as CloudProvider) ?? null,
      lastEditedBy,
      lastEditedAt,
      editSource,
      wordCount: countWords(section.content),
    }
  })
}

/**
 * Assemble a cloud-aware proposal binder as a ZIP archive.
 *
 * Fetches all proposal_sections for the opportunity, queries their sync
 * status from document_sync_state, generates a JSON manifest with full
 * sync metadata, packages section content as individual .txt files, and
 * uploads the ZIP to Supabase Storage. Returns a signed download URL.
 */
export async function assembleCloudBinder(
  opportunityId: string
): Promise<ActionResult<{ url: string }>> {
  const supabase = await createClient()

  // Auth check
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  // Fetch opportunity title
  const { data: opportunity } = await supabase
    .from('opportunities')
    .select('title')
    .eq('id', opportunityId)
    .single()

  if (!opportunity) {
    return { success: false, error: 'Opportunity not found' }
  }

  // Fetch all sections
  const { data: sections, error: sectionsError } = await supabase
    .from('proposal_sections')
    .select('id, section_title, volume, status, content, sort_order')
    .eq('opportunity_id', opportunityId)
    .order('volume', { ascending: true })
    .order('sort_order', { ascending: true })

  if (sectionsError) {
    return { success: false, error: sectionsError.message }
  }

  const allSections = sections ?? []
  if (allSections.length === 0) {
    return { success: false, error: 'No proposal sections found for this opportunity' }
  }

  // Fetch artifact sync statuses
  const artifactStatuses = await getArtifactStatuses(opportunityId)
  const statusMap = new Map<string, ArtifactStatus>()
  for (const artifact of artifactStatuses) {
    statusMap.set(artifact.documentId, artifact)
  }

  // Build ZIP archive
  const zip = new JSZip()
  const date = new Date().toISOString().slice(0, 10)
  const sanitizedTitle = sanitizeFilename(opportunity.title)

  const manifestEntries: BinderManifestEntry[] = []
  let totalWordCount = 0

  // Fetch cloud web URLs for linked documents
  const syncClient = await createSyncClient()
  const sectionIds = allSections.map((s) => s.id)
  const { data: syncStatesForUrls } = await syncClient
    .from('document_sync_state')
    .select('document_id, cloud_web_url')
    .in('document_id', sectionIds)

  const urlMap = new Map<string, string | null>()
  for (const state of syncStatesForUrls ?? []) {
    urlMap.set(state.document_id, state.cloud_web_url)
  }

  // Group sections by volume for folder structure
  const volumeGroups = new Map<string, typeof allSections>()
  for (const section of allSections) {
    const vol = section.volume ?? 'Unassigned'
    const group = volumeGroups.get(vol)
    if (group) {
      group.push(section)
    } else {
      volumeGroups.set(vol, [section])
    }
  }

  const volumeEntries = Array.from(volumeGroups.entries())
  for (const [volumeName, volumeSections] of volumeEntries) {
    const folder = zip.folder(volumeName.replace(/[^a-zA-Z0-9\s-]/g, '_'))
    if (!folder) continue

    for (const section of volumeSections) {
      const wordCount = countWords(section.content)
      totalWordCount += wordCount

      const artifact = statusMap.get(section.id)
      const sectionFilename = `${section.section_title.replace(/[^a-zA-Z0-9\s-]/g, '_').slice(0, 60)}.txt`

      folder.file(sectionFilename, section.content ?? '')

      manifestEntries.push({
        volumeName,
        sectionTitle: section.section_title,
        sectionId: section.id,
        status: section.status,
        wordCount,
        syncStatus: artifact?.syncStatus ?? 'idle',
        cloudProvider: artifact?.cloudProvider ?? null,
        cloudWebUrl: urlMap.get(section.id) ?? null,
        lastEditedBy: artifact?.lastEditedBy ?? null,
        lastEditedAt: artifact?.lastEditedAt ?? null,
        editSource: artifact?.editSource ?? null,
      })
    }
  }

  // Build manifest
  const manifest: BinderManifest = {
    opportunityId,
    opportunityTitle: opportunity.title,
    assembledAt: new Date().toISOString(),
    assembledBy: user.email ?? user.id,
    totalSections: allSections.length,
    totalWordCount,
    syncHealth: computeSyncHealth(artifactStatuses),
    artifacts: manifestEntries,
  }

  zip.file(`${sanitizedTitle}_manifest_${date}.json`, JSON.stringify(manifest, null, 2))

  // Generate ZIP buffer
  const zipBuffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  })

  // Upload to Supabase Storage
  const storagePath = `binders/${opportunityId}/${sanitizedTitle}_CloudBinder_${date}.zip`
  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(storagePath, zipBuffer, {
      contentType: 'application/zip',
      upsert: true,
    })

  if (uploadError) {
    return { success: false, error: `Upload failed: ${uploadError.message}` }
  }

  // Generate signed URL (valid for 1 hour)
  const { data: signedUrl, error: signError } = await supabase.storage
    .from('documents')
    .createSignedUrl(storagePath, 3600)

  if (signError || !signedUrl) {
    return { success: false, error: 'Failed to generate download URL' }
  }

  // Audit log
  await supabase.from('audit_logs').insert({
    id: crypto.randomUUID(),
    user_id: user.id,
    action: 'assemble_cloud_binder',
    entity_type: 'opportunity',
    entity_id: opportunityId,
    details: {
      section_count: allSections.length,
      total_word_count: totalWordCount,
      sync_health: manifest.syncHealth,
      storage_path: storagePath,
    },
    created_at: new Date().toISOString(),
  })

  // Activity log
  await supabase.from('activity_log').insert({
    action: 'assemble_cloud_binder',
    user_name: user.email ?? 'Unknown',
    details: {
      entity_type: 'opportunity',
      entity_id: opportunityId,
      section_count: allSections.length,
      sync_health: manifest.syncHealth,
    },
  })

  revalidatePath(`/proposals/${opportunityId}/collaboration`)

  return {
    success: true,
    data: { url: signedUrl.signedUrl },
  }
}
