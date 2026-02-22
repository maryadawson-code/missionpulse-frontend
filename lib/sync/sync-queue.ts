// filepath: lib/sync/sync-queue.ts
/**
 * Debounced Sync Queue
 *
 * In-memory queue for batching and debouncing sync operations.
 * Processes items in priority order with retry logic.
 * Server-side singleton to avoid duplicate processing.
 *
 * v1.3 Sprint 29 — Sync Engine
 */
'use server'

import type { SyncQueueItem, CloudProvider } from '@/lib/types/sync'

// ─── Constants ────────────────────────────────────────────────

/** Minimum time between sync flushes (ms) */
export const SYNC_DEBOUNCE_MS = 5000

/** Maximum retry attempts before marking a sync as failed */
export const MAX_RETRIES = 3

// ─── Singleton Queue State ────────────────────────────────────

/**
 * Server-side singleton queue. In Next.js server actions, module-level
 * state persists across requests within the same server process.
 * For multi-instance deployments, a Redis-backed queue should replace this.
 */
let queue: SyncQueueItem[] = []
let isProcessing = false
let debounceTimer: ReturnType<typeof setTimeout> | null = null

// ─── Queue Operations ─────────────────────────────────────────

/**
 * Add an item to the sync queue. If an item for the same document
 * and action already exists, it is replaced (deduplication).
 * Automatically schedules a debounced flush.
 */
export async function enqueue(item: SyncQueueItem): Promise<void> {
  // Deduplicate: remove existing entry for same document + action
  queue = queue.filter(
    (existing) =>
      !(existing.documentId === item.documentId && existing.action === item.action)
  )

  queue.push({
    ...item,
    enqueuedAt: new Date().toISOString(),
    attempts: 0,
  })

  // Sort by priority (lower number = higher priority)
  queue.sort((a, b) => a.priority - b.priority)

  scheduleFlush()
}

/**
 * Process all items currently in the queue.
 * Items are processed in priority order. Failed items are re-enqueued
 * up to MAX_RETRIES times.
 */
export async function processQueue(): Promise<{
  processed: number
  failed: number
  remaining: number
}> {
  if (isProcessing) {
    return { processed: 0, failed: 0, remaining: queue.length }
  }

  isProcessing = true
  let processed = 0
  let failed = 0

  // Take a snapshot of current queue and clear it
  const batch = [...queue]
  queue = []

  for (const item of batch) {
    try {
      await processItem(item)
      processed++
    } catch {
      if (item.attempts + 1 < MAX_RETRIES) {
        // Re-enqueue with incremented attempt count
        queue.push({
          ...item,
          attempts: item.attempts + 1,
          // Decrease priority on retry (higher number = lower priority)
          priority: item.priority + 1,
        })
        failed++
      } else {
        // Max retries exceeded — drop the item and report failure
        failed++
      }
    }
  }

  // Re-sort after adding retries
  queue.sort((a, b) => a.priority - b.priority)
  isProcessing = false

  return { processed, failed, remaining: queue.length }
}

/**
 * Immediately flush and process the queue, ignoring the debounce timer.
 * Used for critical operations (e.g., user-initiated sync).
 */
export async function flush(): Promise<{
  processed: number
  failed: number
  remaining: number
}> {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
    debounceTimer = null
  }

  return processQueue()
}

// ─── Queue Inspection ─────────────────────────────────────────

/**
 * Get the current number of items in the queue.
 */
export async function getQueueLength(): Promise<number> {
  return queue.length
}

/**
 * Get all pending items for a specific document.
 */
export async function getPendingItems(
  documentId: string
): Promise<SyncQueueItem[]> {
  return queue.filter((item) => item.documentId === documentId)
}

/**
 * Remove all pending items for a specific document.
 * Used when a document is deleted or sync is disabled.
 */
export async function removeFromQueue(documentId: string): Promise<number> {
  const before = queue.length
  queue = queue.filter((item) => item.documentId !== documentId)
  return before - queue.length
}

// ─── Internal Helpers ─────────────────────────────────────────

/**
 * Schedule a debounced queue flush. Resets the timer on each call.
 */
function scheduleFlush(): void {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }

  debounceTimer = setTimeout(async () => {
    debounceTimer = null
    await processQueue()
  }, SYNC_DEBOUNCE_MS)
}

/**
 * Process a single queue item by delegating to the appropriate
 * sync manager function. Uses dynamic import to avoid circular
 * dependency with sync-manager.
 */
async function processItem(item: SyncQueueItem): Promise<void> {
  // Dynamic import to break circular dependency:
  // sync-manager -> sync-queue (enqueue) and sync-queue -> sync-manager (process)
  const { syncToCloud, fetchCloudContent } = await import('./sync-manager')

  switch (item.action) {
    case 'push': {
      const result = await syncToCloud(
        item.documentId,
        '', // Content is fetched inside syncToCloud from DB
        item.provider
      )
      if (!result.success) {
        throw new Error(result.error ?? 'Push sync failed')
      }
      break
    }

    case 'pull': {
      const content = await fetchCloudContent(item.documentId, item.provider)
      if (!content) {
        throw new Error('Pull sync failed: no content returned')
      }
      break
    }

    case 'resolve': {
      // Resolve actions are handled by the conflict resolver directly
      // This queue entry just ensures the document state is refreshed
      await fetchCloudContent(item.documentId, item.provider)
      break
    }
  }
}

/**
 * Create a SyncQueueItem with sensible defaults.
 * Convenience factory for callers that don't need full control.
 */
export async function createQueueItem(
  documentId: string,
  provider: CloudProvider,
  action: SyncQueueItem['action'],
  priority: number = 5
): Promise<SyncQueueItem> {
  return {
    id: crypto.randomUUID(),
    documentId,
    provider,
    action,
    priority,
    enqueuedAt: new Date().toISOString(),
    attempts: 0,
  }
}
