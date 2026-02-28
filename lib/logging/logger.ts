/**
 * Structured Logging Library
 *
 * JSON-formatted logs with automatic correlation IDs, PII redaction,
 * and Sentry integration for error-level events.
 *
 * Usage:
 *   import { createLogger } from '@/lib/logging/logger'
 *   const log = createLogger('opportunities')
 *   log.error('Insert failed', { table: 'opportunities', error: err.message })
 */
import * as Sentry from '@sentry/nextjs'
import { getCorrelationId } from './correlation'

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  module: string
  correlationId?: string
  [key: string]: unknown
}

// Keys whose values should be auto-redacted
const REDACT_KEYS = /password|token|secret|key|authorization|cookie/i

function redactMeta(meta: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(meta)) {
    if (REDACT_KEYS.test(k)) {
      result[k] = '[REDACTED]'
    } else if (v && typeof v === 'object' && !Array.isArray(v)) {
      result[k] = redactMeta(v as Record<string, unknown>)
    } else {
      result[k] = v
    }
  }
  return result
}

function formatEntry(
  level: LogLevel,
  module: string,
  message: string,
  meta?: Record<string, unknown>
): LogEntry {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    module,
  }

  const correlationId = getCorrelationId()
  if (correlationId) {
    entry.correlationId = correlationId
  }

  if (meta) {
    Object.assign(entry, redactMeta(meta))
  }

  return entry
}

export interface Logger {
  debug: (message: string, meta?: Record<string, unknown>) => void
  info: (message: string, meta?: Record<string, unknown>) => void
  warn: (message: string, meta?: Record<string, unknown>) => void
  error: (message: string, meta?: Record<string, unknown>) => void
}

/**
 * Create a logger instance scoped to a module name.
 */
export function createLogger(module: string): Logger {
  return {
    debug(message, meta) {
      const entry = formatEntry('debug', module, message, meta)
      // eslint-disable-next-line no-console
      console.debug(JSON.stringify(entry))
    },

    info(message, meta) {
      const entry = formatEntry('info', module, message, meta)
      // eslint-disable-next-line no-console
      console.info(JSON.stringify(entry))
    },

    warn(message, meta) {
      const entry = formatEntry('warn', module, message, meta)
      console.warn(JSON.stringify(entry))
    },

    error(message, meta) {
      const entry = formatEntry('error', module, message, meta)
      console.error(JSON.stringify(entry))

      // Send to Sentry as breadcrumb + exception
      Sentry.addBreadcrumb({
        category: module,
        message,
        level: 'error',
        data: meta,
      })

      const errorObj = meta?.error
        ? new Error(String(meta.error))
        : new Error(message)
      errorObj.name = `${module}:${message}`
      Sentry.captureException(errorObj, {
        tags: { module },
        extra: meta,
      })
    },
  }
}
