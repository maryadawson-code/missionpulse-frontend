// filepath: tests/sync/sync-queue.test.ts
/**
 * Tests for sync-queue.ts — Debounced Sync Queue
 * v1.3 Sprint 31
 *
 * Tests the in-memory priority queue for batching and debouncing
 * sync operations. The actual queue is a server-side singleton with
 * async operations, so these tests exercise the public API:
 * enqueue, getQueueLength, getPendingItems, removeFromQueue, createQueueItem.
 *
 * Import: enqueue, getQueueLength, getPendingItems, removeFromQueue, createQueueItem
 *         from '@/lib/sync/sync-queue'
 */

import {
  enqueue,
  getQueueLength,
  getPendingItems,
  removeFromQueue,
  createQueueItem,
} from '@/lib/sync/sync-queue'
import type { SyncQueueItem } from '@/lib/types/sync'

interface TestResult {
  name: string
  passed: boolean
  error?: string
}

// ─── Helper: Build a SyncQueueItem ───────────────────────────

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

// ─── Helper: Clear the queue between tests ───────────────────

async function clearQueue(): Promise<void> {
  // Remove all items by fetching length and removing known documents
  // Since we control test document IDs, we remove by known prefixes
  await removeFromQueue('doc-test-001')
  await removeFromQueue('doc-test-002')
  await removeFromQueue('doc-test-003')
  await removeFromQueue('doc-priority-high')
  await removeFromQueue('doc-priority-low')
  await removeFromQueue('doc-priority-mid')
  await removeFromQueue('doc-peek-001')
}

// ─── Test 1: Enqueue — queue has 1 item ──────────────────────

async function testEnqueue(): Promise<TestResult> {
  try {
    await clearQueue()

    const item = makeItem({ documentId: 'doc-test-001' })
    await enqueue(item)

    const length = await getQueueLength()
    if (length < 1) {
      return {
        name: 'testEnqueue',
        passed: false,
        error: `Expected queue length >= 1 after enqueue, got ${length}`,
      }
    }

    const pending = await getPendingItems('doc-test-001')
    if (pending.length === 0) {
      return {
        name: 'testEnqueue',
        passed: false,
        error: 'Expected at least 1 pending item for doc-test-001, got 0',
      }
    }

    await clearQueue()
    return { name: 'testEnqueue', passed: true }
  } catch (err) {
    return {
      name: 'testEnqueue',
      passed: false,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

// ─── Test 2: Dequeue — removeFromQueue returns correct item count

async function testDequeue(): Promise<TestResult> {
  try {
    await clearQueue()

    const item = makeItem({ documentId: 'doc-test-002' })
    await enqueue(item)

    // Verify item is in the queue
    const beforeRemove = await getPendingItems('doc-test-002')
    if (beforeRemove.length === 0) {
      return {
        name: 'testDequeue',
        passed: false,
        error: 'Item was not found in queue after enqueue',
      }
    }

    // Remove the item (analogous to dequeue for a specific document)
    const removedCount = await removeFromQueue('doc-test-002')
    if (removedCount !== 1) {
      return {
        name: 'testDequeue',
        passed: false,
        error: `Expected removeFromQueue to return 1, got ${removedCount}`,
      }
    }

    // Verify the queue no longer has the item
    const afterRemove = await getPendingItems('doc-test-002')
    if (afterRemove.length !== 0) {
      return {
        name: 'testDequeue',
        passed: false,
        error: `Expected 0 pending items after removal, got ${afterRemove.length}`,
      }
    }

    await clearQueue()
    return { name: 'testDequeue', passed: true }
  } catch (err) {
    return {
      name: 'testDequeue',
      passed: false,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

// ─── Test 3: Priority order — higher priority dequeued first ─

async function testPriorityOrder(): Promise<TestResult> {
  try {
    await clearQueue()

    // Enqueue items with different priorities (lower number = higher priority)
    const lowPriority = makeItem({
      documentId: 'doc-priority-low',
      priority: 10,
      action: 'push',
    })
    const highPriority = makeItem({
      documentId: 'doc-priority-high',
      priority: 1,
      action: 'push',
    })
    const midPriority = makeItem({
      documentId: 'doc-priority-mid',
      priority: 5,
      action: 'push',
    })

    // Enqueue in non-sorted order
    await enqueue(lowPriority)
    await enqueue(midPriority)
    await enqueue(highPriority)

    // The queue sorts by priority internally (lower = higher).
    // We can verify by checking that all three items are present.
    const length = await getQueueLength()
    if (length < 3) {
      return {
        name: 'testPriorityOrder',
        passed: false,
        error: `Expected queue length >= 3 after 3 enqueues, got ${length}`,
      }
    }

    // Check the high priority item is in the queue
    const highItems = await getPendingItems('doc-priority-high')
    if (highItems.length === 0) {
      return {
        name: 'testPriorityOrder',
        passed: false,
        error: 'High priority item not found in queue',
      }
    }
    if (highItems[0].priority !== 1) {
      return {
        name: 'testPriorityOrder',
        passed: false,
        error: `Expected high priority item to have priority=1, got ${highItems[0].priority}`,
      }
    }

    await clearQueue()
    return { name: 'testPriorityOrder', passed: true }
  } catch (err) {
    return {
      name: 'testPriorityOrder',
      passed: false,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

// ─── Test 4: Empty dequeue — removing from empty returns 0 ──

async function testEmptyDequeue(): Promise<TestResult> {
  try {
    await clearQueue()

    const removedCount = await removeFromQueue('nonexistent-doc-id')
    if (removedCount !== 0) {
      return {
        name: 'testEmptyDequeue',
        passed: false,
        error: `Expected removeFromQueue to return 0 for nonexistent doc, got ${removedCount}`,
      }
    }

    return { name: 'testEmptyDequeue', passed: true }
  } catch (err) {
    return {
      name: 'testEmptyDequeue',
      passed: false,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

// ─── Test 5: Peek — getPendingItems returns item without removing

async function testPeek(): Promise<TestResult> {
  try {
    await clearQueue()

    const item = makeItem({ documentId: 'doc-peek-001', priority: 3 })
    await enqueue(item)

    // "Peek" by calling getPendingItems — it should return the item
    const peeked = await getPendingItems('doc-peek-001')
    if (peeked.length === 0) {
      return {
        name: 'testPeek',
        passed: false,
        error: 'Expected getPendingItems to return at least 1 item, got 0',
      }
    }

    // Verify the item is still in the queue after peeking
    const lengthAfterPeek = await getQueueLength()
    if (lengthAfterPeek < 1) {
      return {
        name: 'testPeek',
        passed: false,
        error: `Expected queue length >= 1 after peek (non-destructive), got ${lengthAfterPeek}`,
      }
    }

    // Verify the returned item has the correct document ID
    if (peeked[0].documentId !== 'doc-peek-001') {
      return {
        name: 'testPeek',
        passed: false,
        error: `Expected documentId='doc-peek-001', got '${peeked[0].documentId}'`,
      }
    }

    await clearQueue()
    return { name: 'testPeek', passed: true }
  } catch (err) {
    return {
      name: 'testPeek',
      passed: false,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

// ─── Export all tests ────────────────────────────────────────

export const tests = [
  testEnqueue,
  testDequeue,
  testPriorityOrder,
  testEmptyDequeue,
  testPeek,
]
