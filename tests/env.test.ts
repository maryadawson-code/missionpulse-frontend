import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/logging/logger', () => ({
  createLogger: vi.fn().mockReturnValue({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  }),
}))

describe('Environment Config', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('exports env object with defaults', async () => {
    const { env } = await import('@/lib/env')
    expect(env).toBeDefined()
    expect(typeof env.SUPABASE_URL).toBe('string')
    expect(typeof env.SUPABASE_ANON_KEY).toBe('string')
    expect(typeof env.SITE_URL).toBe('string')
  })

  it('SITE_URL defaults to localhost when not set', async () => {
    delete process.env.NEXT_PUBLIC_SITE_URL
    const { env } = await import('@/lib/env')
    expect(env.SITE_URL).toBe('http://localhost:3000')
  })

  it('getFeatureStatus returns all features', async () => {
    const { getFeatureStatus } = await import('@/lib/env')
    const status = getFeatureStatus()
    expect(status).toHaveProperty('ai')
    expect(status).toHaveProperty('billing')
    expect(status).toHaveProperty('sam_gov')
    expect(status).toHaveProperty('rate_limiting')
    expect(status).toHaveProperty('error_tracking')
  })

  it('features are inactive when env vars missing', async () => {
    delete process.env.STRIPE_SECRET_KEY
    delete process.env.SAM_GOV_API_KEY
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.SENTRY_DSN
    const { getFeatureStatus } = await import('@/lib/env')
    const status = getFeatureStatus()
    expect(status.billing.active).toBe(false)
    expect(status.billing.reason).toBeDefined()
    expect(status.sam_gov.active).toBe(false)
    expect(status.rate_limiting.active).toBe(false)
    expect(status.error_tracking.active).toBe(false)
  })

  it('AI feature is inactive when no AI keys set', async () => {
    delete process.env.ASKSAGE_API_KEY
    delete process.env.ANTHROPIC_API_KEY
    delete process.env.OPENAI_API_KEY
    const { getFeatureStatus } = await import('@/lib/env')
    const status = getFeatureStatus()
    expect(status.ai.active).toBe(false)
    expect(status.ai.reason).toContain('No AI API key')
  })

  it('AI feature is active when any AI key is set', async () => {
    process.env.ANTHROPIC_API_KEY = 'sk-test'
    const { getFeatureStatus } = await import('@/lib/env')
    const status = getFeatureStatus()
    expect(status.ai.active).toBe(true)
    expect(status.ai.reason).toBeUndefined()
    delete process.env.ANTHROPIC_API_KEY
  })

  it('billing feature is active when Stripe key set', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_123'
    const { getFeatureStatus } = await import('@/lib/env')
    const status = getFeatureStatus()
    expect(status.billing.active).toBe(true)
    delete process.env.STRIPE_SECRET_KEY
  })

  it('each feature has active boolean and optional reason', async () => {
    const { getFeatureStatus } = await import('@/lib/env')
    const status = getFeatureStatus()
    for (const [, info] of Object.entries(status)) {
      expect(typeof info.active).toBe('boolean')
      if (!info.active) {
        expect(typeof info.reason).toBe('string')
      }
    }
  })
})
