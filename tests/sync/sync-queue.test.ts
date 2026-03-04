// filepath: tests/sync/sync-queue.test.ts
/**
 * Tests for sync-queue.ts — Debounced Sync Queue
 * v1.3 Sprint 31 → Migrated to Vitest (v1.6 T-42.1)
 */

import {
  enqueue,
  getQueueLength,
  getPendingItems,
  removeFromQueue,
} from '@/lib/sync/sync-queue'
import type { SyncQueueItem } from '@/lib/types/sync'

function makeItem(overrides: Partial<SyncQueueItem> = {}): SyncQueueItem {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    documentId: overrides.documentId ?? 'doc-test-001',
    provider: overrides.provider ?? 'google_drive',
    action: overrides.action ?? 'push',
    priority: overrides.priority ?? 5,
    enqueuedAt: overrides.enqueuedAt ?? new Date().toISOString(),
    attempts: overrides.attempts ?? 0,
  }
}

async function clearQueue(): Promise<void> {
  await removeFromQueue('doc-test-001')
  await removeFromQueue('doc-test-002')
  await removeFromQueue('doc-test-003')
  await removeFromQueue('doc-priority-high')
  await removeFromQueue('doc-priority-low')
  await removeFromQueue('doc-priority-mid')
  await removeFromQueue('doc-peek-001')
}

describe('sync-queue', () => {
  beforeEach(async () => {
    await clearQueue()
  })

  afterEach(async () => {
    await clearQueue()
  })

  it('enqueue adds an item to the queue', async () => {
    const item = makeItem({ documentId: 'doc-test-001' })
    await enqueue(item)

    const length = await getQueueLength()
    expect(length).toBeGreaterThanOrEqual(1)

    const pending = await getPendingItems('doc-test-001')
    expect(pending.length).toBeGreaterThanOrEqual(1)
  })

  it('removeFromQueue removes the correct item', async () => {
    const item = makeItem({ documentId: 'doc-test-002' })
    await enqueue(item)

    const beforeRemove = await getPendingItems('doc-test-002')
    expect(beforeRemove.length).toBeGreaterThanOrEqual(1)

    const removedCount = await removeFromQueue('doc-test-002')
    expect(removedCount).toBe(1)

    const afterRemove = await getPendingItems('doc-test-002')
    expect(afterRemove).toHaveLength(0)
  })

  it('enqueues items with different priorities', async () => {
    await enqueue(makeItem({ documentId: 'doc-priority-low', priority: 10, action: 'push' }))
    await enqueue(makeItem({ documentId: 'doc-priority-mid', priority: 5, action: 'push' }))
    await enqueue(makeItem({ documentId: 'doc-priority-high', priority: 1, action: 'push' }))

    const length = await getQueueLength()
    expect(length).toBeGreaterThanOrEqual(3)

    const highItems = await getPendingItems('doc-priority-high')
    expect(highItems.length).toBeGreaterThanOrEqual(1)
    expect(highItems[0].priority).toBe(1)
  })

  it('removeFromQueue returns 0 for nonexistent document', async () => {
    const removedCount = await removeFromQueue('nonexistent-doc-id')
    expect(removedCount).toBe(0)
  })

  it('getPendingItems does not remove items from queue', async () => {
    const item = makeItem({ documentId: 'doc-peek-001', priority: 3 })
    await enqueue(item)

    const peeked = await getPendingItems('doc-peek-001')
    expect(peeked.length).toBeGreaterThanOrEqual(1)
    expect(peeked[0].documentId).toBe('doc-peek-001')

    // Item should still be in queue after peeking
    const lengthAfterPeek = await getQueueLength()
    expect(lengthAfterPeek).toBeGreaterThanOrEqual(1)
  })
})
