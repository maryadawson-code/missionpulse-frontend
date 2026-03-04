/**
 * Offline Action Queue — Optimistic Offline Support
 * Sprint 35 (T-35.2) — Phase L v2.0
 *
 * Queues mutations when offline and replays them when
 * connectivity is restored. Uses IndexedDB for persistence.
 *
 * © 2026 Mission Meets Tech
 */

// ─── Types ──────────────────────────────────────────────────────

export interface QueuedAction {
  id: string
  url: string
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body: string | null
  headers: Record<string, string>
  createdAt: number
  retries: number
  status: 'pending' | 'replaying' | 'failed'
}

const DB_NAME = 'missionpulse_offline'
const STORE_NAME = 'actions'
const DB_VERSION = 1

// ─── IndexedDB Helpers ──────────────────────────────────────────

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

// ─── Public API ─────────────────────────────────────────────────

/**
 * Enqueue a mutation for later replay.
 */
export async function enqueueAction(
  action: Omit<QueuedAction, 'id' | 'createdAt' | 'retries' | 'status'>
): Promise<string> {
  const db = await openDB()
  const id = crypto.randomUUID()
  const entry: QueuedAction = {
    ...action,
    id,
    createdAt: Date.now(),
    retries: 0,
    status: 'pending',
  }

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).put(entry)
    tx.oncomplete = () => resolve(id)
    tx.onerror = () => reject(tx.error)
  })
}

/**
 * Get all queued actions, ordered by creation time.
 */
export async function getQueuedActions(): Promise<QueuedAction[]> {
  const db = await openDB()

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const req = tx.objectStore(STORE_NAME).getAll()
    req.onsuccess = () => {
      const actions = (req.result as QueuedAction[])
        .sort((a, b) => a.createdAt - b.createdAt)
      resolve(actions)
    }
    req.onerror = () => reject(req.error)
  })
}

/**
 * Replay all pending actions in order.
 * Returns the number of successfully replayed actions.
 */
export async function replayQueue(): Promise<{ replayed: number; failed: number }> {
  const actions = await getQueuedActions()
  const pending = actions.filter(a => a.status === 'pending' || a.status === 'failed')

  let replayed = 0
  let failed = 0

  for (const action of pending) {
    try {
      const res = await fetch(action.url, {
        method: action.method,
        headers: action.headers,
        body: action.body,
      })

      if (res.ok) {
        await removeAction(action.id)
        replayed++
      } else {
        await markFailed(action.id, action.retries + 1)
        failed++
      }
    } catch {
      await markFailed(action.id, action.retries + 1)
      failed++
    }
  }

  return { replayed, failed }
}

/**
 * Remove a completed action from the queue.
 */
export async function removeAction(id: string): Promise<void> {
  const db = await openDB()

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

/**
 * Clear all actions from the queue.
 */
export async function clearQueue(): Promise<void> {
  const db = await openDB()

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).clear()
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

/** Get the count of pending actions. */
export async function getQueueSize(): Promise<number> {
  const actions = await getQueuedActions()
  return actions.filter(a => a.status !== 'failed' || a.retries < 3).length
}

// ─── Private ────────────────────────────────────────────────────

async function markFailed(id: string, retries: number): Promise<void> {
  const db = await openDB()

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const req = store.get(id)
    req.onsuccess = () => {
      const action = req.result as QueuedAction
      if (action) {
        action.status = retries >= 3 ? 'failed' : 'pending'
        action.retries = retries
        store.put(action)
      }
    }
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}
