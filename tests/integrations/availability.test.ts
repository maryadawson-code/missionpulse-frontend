import { describe, it, expect } from 'vitest'

describe('Integration Availability', () => {
  it('module can be imported', async () => {
    const mod = await import('@/lib/integrations/availability')
    expect(mod.isProviderAvailable).toBeDefined()
    expect(mod.getIntegrationAvailability).toBeDefined()
  })

  it('isProviderAvailable returns false when env vars missing', async () => {
    const { isProviderAvailable } = await import('@/lib/integrations/availability')

    // In test env, no env vars are set, so all should be false
    const result = await isProviderAvailable('hubspot')
    expect(result).toBe(false)
  })

  it('getIntegrationAvailability returns all providers', async () => {
    const { getIntegrationAvailability } = await import('@/lib/integrations/availability')
    const availability = await getIntegrationAvailability()

    expect(availability).toHaveProperty('m365')
    expect(availability).toHaveProperty('hubspot')
    expect(availability).toHaveProperty('salesforce')
    expect(availability).toHaveProperty('slack')
    expect(availability).toHaveProperty('google')
    expect(availability).toHaveProperty('docusign')
    expect(availability).toHaveProperty('govwin')
  })

  it('returns false for unknown provider', async () => {
    const { isProviderAvailable } = await import('@/lib/integrations/availability')
    const result = await isProviderAvailable('unknown' as never)
    expect(result).toBe(false)
  })
})
