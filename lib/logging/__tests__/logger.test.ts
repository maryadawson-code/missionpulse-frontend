// filepath: lib/logging/__tests__/logger.test.ts
import { vi } from 'vitest'

// Mock Sentry
vi.mock('@sentry/nextjs', () => ({
  addBreadcrumb: vi.fn(),
  captureException: vi.fn(),
}))

// Mock correlation ID
vi.mock('@/lib/logging/correlation', () => ({
  getCorrelationId: vi.fn(() => 'test-correlation-id'),
}))

import { createLogger } from '@/lib/logging/logger'
import * as Sentry from '@sentry/nextjs'

describe('logger', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates a logger with all log level methods', () => {
    const log = createLogger('test-module')
    expect(typeof log.debug).toBe('function')
    expect(typeof log.info).toBe('function')
    expect(typeof log.warn).toBe('function')
    expect(typeof log.error).toBe('function')
  })

  it('debug outputs JSON with correct level and module', () => {
    const spy = vi.spyOn(console, 'debug').mockImplementation(() => {})
    const log = createLogger('pipeline')
    log.debug('test message')

    expect(spy).toHaveBeenCalledOnce()
    const output = JSON.parse(spy.mock.calls[0][0])
    expect(output.level).toBe('debug')
    expect(output.module).toBe('pipeline')
    expect(output.message).toBe('test message')
    expect(output.correlationId).toBe('test-correlation-id')
    spy.mockRestore()
  })

  it('info outputs JSON with correct level', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {})
    const log = createLogger('auth')
    log.info('user logged in', { userId: 'u-001' })

    const output = JSON.parse(spy.mock.calls[0][0])
    expect(output.level).toBe('info')
    expect(output.userId).toBe('u-001')
    spy.mockRestore()
  })

  it('warn outputs JSON with correct level', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const log = createLogger('sync')
    log.warn('rate limit approaching')

    const output = JSON.parse(spy.mock.calls[0][0])
    expect(output.level).toBe('warn')
    spy.mockRestore()
  })

  it('error sends to Sentry', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const log = createLogger('billing')
    log.error('charge failed', { error: 'insufficient funds' })

    expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'billing',
        message: 'charge failed',
        level: 'error',
      })
    )
    expect(Sentry.captureException).toHaveBeenCalledOnce()
    spy.mockRestore()
  })

  it('redacts sensitive keys in metadata', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {})
    const log = createLogger('auth')
    log.info('login attempt', {
      username: 'admin',
      password: 'secret123',
      api_token: 'tok_abc',
      authorization: 'Bearer xyz',
    })

    const output = JSON.parse(spy.mock.calls[0][0])
    expect(output.username).toBe('admin')
    expect(output.password).toBe('[REDACTED]')
    expect(output.api_token).toBe('[REDACTED]')
    expect(output.authorization).toBe('[REDACTED]')
    spy.mockRestore()
  })

  it('redacts nested sensitive keys', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {})
    const log = createLogger('api')
    log.info('request', {
      headers: { authorization: 'Bearer xyz', 'content-type': 'application/json' },
    })

    const output = JSON.parse(spy.mock.calls[0][0])
    expect(output.headers.authorization).toBe('[REDACTED]')
    expect(output.headers['content-type']).toBe('application/json')
    spy.mockRestore()
  })

  it('includes timestamp in ISO format', () => {
    const spy = vi.spyOn(console, 'debug').mockImplementation(() => {})
    const log = createLogger('test')
    log.debug('msg')

    const output = JSON.parse(spy.mock.calls[0][0])
    expect(output.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    spy.mockRestore()
  })
})
