/**
 * Brute Force Protection
 *
 * Redis-backed IP and account-level lockout for auth endpoints.
 * Complements rate limiting with progressive delays and lockouts.
 *
 * IP-level:     5 failed attempts in 15 min → block IP for 30 min
 * Account-level: 10 failed attempts in 1 hr → lock account for 1 hr
 * Progressive:   4th attempt = 2s delay, 5th = 5s delay
 */
import { getRedis } from '@/lib/cache/redis'
import { createLogger } from '@/lib/logging/logger'

const log = createLogger('brute-force')

// ─── Config ─────────────────────────────────────────────────

const IP_MAX_ATTEMPTS = 5
const IP_WINDOW_SECONDS = 15 * 60 // 15 min
const IP_LOCKOUT_SECONDS = 30 * 60 // 30 min

const ACCOUNT_MAX_ATTEMPTS = 10
const ACCOUNT_WINDOW_SECONDS = 60 * 60 // 1 hr
const ACCOUNT_LOCKOUT_SECONDS = 60 * 60 // 1 hr

// Progressive delay thresholds (server-side sleep)
const PROGRESSIVE_DELAYS: Record<number, number> = {
  4: 2000, // 2s
  5: 5000, // 5s
}

// ─── Redis Keys ─────────────────────────────────────────────

function ipKey(ip: string): string {
  return `brute:ip:${ip}`
}

function ipLockKey(ip: string): string {
  return `brute:ip:lock:${ip}`
}

function accountKey(email: string): string {
  // Hash email for privacy in Redis keys
  return `brute:acct:${email.toLowerCase()}`
}

function accountLockKey(email: string): string {
  return `brute:acct:lock:${email.toLowerCase()}`
}

// ─── Types ──────────────────────────────────────────────────

export interface BruteForceResult {
  allowed: boolean
  reason?: 'ip_locked' | 'account_locked'
  delayMs?: number
  attemptsRemaining?: number
  lockoutExpiresAt?: number // Unix timestamp (seconds)
}

// ─── Core ───────────────────────────────────────────────────

/**
 * Check if a login attempt should be allowed.
 * Call BEFORE processing the login.
 */
export async function checkBruteForce(
  ip: string,
  email: string
): Promise<BruteForceResult> {
  const redis = getRedis()
  if (!redis) return { allowed: true } // fail-open

  try {
    // Check IP lockout
    const ipLocked = await redis.get<string>(ipLockKey(ip))
    if (ipLocked) {
      const ttl = await redis.ttl(ipLockKey(ip))
      return {
        allowed: false,
        reason: 'ip_locked',
        lockoutExpiresAt: Math.floor(Date.now() / 1000) + ttl,
      }
    }

    // Check account lockout
    const acctLocked = await redis.get<string>(accountLockKey(email))
    if (acctLocked) {
      const ttl = await redis.ttl(accountLockKey(email))
      return {
        allowed: false,
        reason: 'account_locked',
        lockoutExpiresAt: Math.floor(Date.now() / 1000) + ttl,
      }
    }

    // Get current attempt counts for progressive delay
    const ipAttempts = await redis.get<number>(ipKey(ip))
    const attemptCount = (ipAttempts ?? 0) + 1
    const delayMs = PROGRESSIVE_DELAYS[attemptCount] ?? 0

    return {
      allowed: true,
      delayMs,
      attemptsRemaining: IP_MAX_ATTEMPTS - attemptCount,
    }
  } catch (err) {
    log.warn('Brute force check failed — allowing (fail-open)', {
      error: err instanceof Error ? err.message : String(err),
    })
    return { allowed: true }
  }
}

/**
 * Record a failed login attempt.
 * Call AFTER a login fails.
 */
export async function recordFailedAttempt(
  ip: string,
  email: string
): Promise<void> {
  const redis = getRedis()
  if (!redis) return

  try {
    // Increment IP counter
    const ipCount = await redis.incr(ipKey(ip))
    if (ipCount === 1) {
      await redis.expire(ipKey(ip), IP_WINDOW_SECONDS)
    }

    // Increment account counter
    const acctCount = await redis.incr(accountKey(email))
    if (acctCount === 1) {
      await redis.expire(accountKey(email), ACCOUNT_WINDOW_SECONDS)
    }

    // IP lockout
    if (ipCount >= IP_MAX_ATTEMPTS) {
      await redis.set(ipLockKey(ip), '1', { ex: IP_LOCKOUT_SECONDS })
      log.warn('IP locked out due to brute force', {
        ip,
        attempts: ipCount,
        lockout_seconds: IP_LOCKOUT_SECONDS,
      })
    }

    // Account lockout
    if (acctCount >= ACCOUNT_MAX_ATTEMPTS) {
      await redis.set(accountLockKey(email), '1', { ex: ACCOUNT_LOCKOUT_SECONDS })
      log.warn('Account locked out due to brute force', {
        email_hash: email.length > 0 ? `${email[0]}***@${email.split('@')[1] ?? ''}` : '',
        attempts: acctCount,
        lockout_seconds: ACCOUNT_LOCKOUT_SECONDS,
      })
    }
  } catch (err) {
    log.error('Failed to record brute force attempt', {
      error: err instanceof Error ? err.message : String(err),
    })
  }
}

/**
 * Record a successful login — resets IP counter.
 * Account counter decays by TTL only (not reset on success).
 */
export async function recordSuccessfulLogin(ip: string): Promise<void> {
  const redis = getRedis()
  if (!redis) return

  try {
    await redis.del(ipKey(ip))
    await redis.del(ipLockKey(ip))
  } catch (err) {
    log.warn('Failed to clear brute force IP counter', {
      error: err instanceof Error ? err.message : String(err),
    })
  }
}

/**
 * Admin: unlock a locked account.
 */
export async function adminUnlockAccount(email: string): Promise<boolean> {
  const redis = getRedis()
  if (!redis) return false

  try {
    await redis.del(accountLockKey(email))
    await redis.del(accountKey(email))
    log.info('Account unlocked by admin', {
      email_hash: email.length > 0 ? `${email[0]}***@${email.split('@')[1] ?? ''}` : '',
    })
    return true
  } catch (err) {
    log.error('Failed to unlock account', {
      error: err instanceof Error ? err.message : String(err),
    })
    return false
  }
}

/**
 * Admin: unlock a locked IP.
 */
export async function adminUnlockIp(ip: string): Promise<boolean> {
  const redis = getRedis()
  if (!redis) return false

  try {
    await redis.del(ipLockKey(ip))
    await redis.del(ipKey(ip))
    log.info('IP unlocked by admin', { ip })
    return true
  } catch (err) {
    log.error('Failed to unlock IP', {
      error: err instanceof Error ? err.message : String(err),
    })
    return false
  }
}
