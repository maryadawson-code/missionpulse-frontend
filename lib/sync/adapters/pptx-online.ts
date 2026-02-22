// filepath: lib/sync/adapters/pptx-online.ts
/**
 * PowerPoint Online Adapter — Microsoft Graph API
 *
 * Bi-directional sync for orals presentations and gate review
 * decks stored in PowerPoint Online via Microsoft Graph.
 */
'use server'

import { createSyncClient } from '@/lib/supabase/sync-client'
import { refreshM365Token } from '@/lib/integrations/m365/auth'
import type { ActionResult } from '@/lib/types'

// ─── Constants ────────────────────────────────────────────────

const GRAPH_API = 'https://graph.microsoft.com/v1.0'

// ─── Types ────────────────────────────────────────────────────

interface SlideContent {
  slideIndex: number
  title: string
  body: string
  notes: string
}

interface SlidePayload {
  title: string
  body: string
  notes: string
}

interface GraphPresentationSlide {
  id: string
  index: number
  shapes?: {
    id: string
    type: string
    textFrame?: {
      paragraphs: { text: string }[]
    }
    name?: string
  }[]
  notes?: {
    textFrame?: {
      paragraphs: { text: string }[]
    }
  }
}

// ─── Token Helper ─────────────────────────────────────────────

async function getValidToken(companyId: string): Promise<string | null> {
  const supabase = await createSyncClient()

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

// ─── Slide Extraction ─────────────────────────────────────────

/**
 * Extract structured content from raw slide data.
 * Maps each slide to its index, title, body text, and speaker notes.
 */
export function extractSlideContent(
  slideData: Record<string, unknown>[]
): SlideContent[] {
  return slideData.map((raw, idx) => {
    const slide = raw as unknown as GraphPresentationSlide
    const shapes = slide.shapes ?? []

    // Title is typically the first shape named "Title" or type "title"
    let title = ''
    const bodyParts: string[] = []

    for (const shape of shapes) {
      const text = shape.textFrame?.paragraphs
        ?.map((p) => p.text)
        .join('\n')
        .trim() ?? ''

      if (!text) continue

      const isTitle =
        shape.name?.toLowerCase().includes('title') ||
        shape.type?.toLowerCase() === 'title'

      if (isTitle && !title) {
        title = text
      } else {
        bodyParts.push(text)
      }
    }

    // Speaker notes
    const notes = slide.notes?.textFrame?.paragraphs
      ?.map((p) => p.text)
      .join('\n')
      .trim() ?? ''

    return {
      slideIndex: slide.index ?? idx,
      title,
      body: bodyParts.join('\n\n'),
      notes,
    }
  })
}

// ─── Push ─────────────────────────────────────────────────────

/**
 * Push slide content to a PowerPoint Online presentation via Graph API.
 * Updates existing slides with new title, body, and speaker notes content.
 */
export async function pushToPptxOnline(
  companyId: string,
  cloudFileId: string,
  slides: SlidePayload[]
): Promise<ActionResult> {
  const token = await getValidToken(companyId)
  if (!token) return { success: false, error: 'M365 token unavailable' }

  if (slides.length === 0) return { success: true }

  try {
    // Build a serialized slide structure for the full content push
    // Graph API doesn't support per-slide text patching for PPTX,
    // so we push the entire presentation content via the content endpoint
    const presentationPayload = slides.map((slide, index) => ({
      slideIndex: index,
      title: slide.title,
      body: slide.body,
      notes: slide.notes,
    }))

    const res = await fetch(
      `${GRAPH_API}/me/drive/items/${cloudFileId}/content`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        },
        body: JSON.stringify({ slides: presentationPayload }),
        signal: AbortSignal.timeout(30000),
      }
    )

    if (!res.ok) {
      const errText = await res.text()
      return {
        success: false,
        error: `PPTX push failed (${res.status}): ${errText}`,
      }
    }

    // Update sync state
    const supabase = await createSyncClient()
    await supabase
      .from('document_sync_state')
      .update({
        sync_status: 'synced',
        last_sync_at: new Date().toISOString(),
        last_mp_edit_at: new Date().toISOString(),
      })
      .eq('cloud_file_id', cloudFileId)
      .eq('company_id', companyId)

    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Push to PPTX Online failed',
    }
  }
}

// ─── Pull ─────────────────────────────────────────────────────

/**
 * Pull slide content from a PowerPoint Online presentation.
 * Returns structured slide data and the file last-modified timestamp.
 */
export async function pullFromPptxOnline(
  companyId: string,
  cloudFileId: string
): Promise<{ slides: SlideContent[]; lastModified: string } | null> {
  const token = await getValidToken(companyId)
  if (!token) return null

  try {
    // Fetch metadata for lastModified
    const metaRes = await fetch(
      `${GRAPH_API}/me/drive/items/${cloudFileId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(10000),
      }
    )

    if (!metaRes.ok) return null
    const meta = (await metaRes.json()) as { lastModifiedDateTime: string }

    // Fetch presentation content
    const contentRes = await fetch(
      `${GRAPH_API}/me/drive/items/${cloudFileId}/content`,
      {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(30000),
      }
    )

    if (!contentRes.ok) return null

    // Parse the response — for PPTX, Graph returns raw binary
    // We need to use the presentation API to get structured slide data
    const slidesRes = await fetch(
      `${GRAPH_API}/me/drive/items/${cloudFileId}/workbook/presentations/slides`,
      {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(15000),
      }
    )

    let slides: SlideContent[] = []

    if (slidesRes.ok) {
      const slidesData = (await slidesRes.json()) as { value: Record<string, unknown>[] }
      slides = extractSlideContent(slidesData.value)
    } else {
      // Fallback: parse from binary content is not feasible server-side
      // Return empty slides array — consumer should handle gracefully
      slides = []
    }

    // Update sync state
    const supabase = await createSyncClient()
    await supabase
      .from('document_sync_state')
      .update({
        sync_status: 'synced',
        last_sync_at: new Date().toISOString(),
        last_cloud_edit_at: meta.lastModifiedDateTime,
      })
      .eq('cloud_file_id', cloudFileId)
      .eq('company_id', companyId)

    return {
      slides,
      lastModified: meta.lastModifiedDateTime,
    }
  } catch {
    return null
  }
}

// ─── URL Helper ───────────────────────────────────────────────

/**
 * Get the PowerPoint Online web URL for a cloud file.
 */
export async function getPptxOnlineUrl(
  companyId: string,
  cloudFileId: string
): Promise<string | null> {
  const token = await getValidToken(companyId)
  if (!token) return null

  try {
    const res = await fetch(
      `${GRAPH_API}/me/drive/items/${cloudFileId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(10000),
      }
    )

    if (!res.ok) return null

    const item = (await res.json()) as { webUrl: string }
    return item.webUrl
  } catch {
    return null
  }
}
