/**
 * Integration Availability — Server-side only
 *
 * Checks whether platform-level OAuth credentials are configured for each
 * integration provider. Returns booleans only — never exposes env var names
 * to the client.
 */
'use server'

export type IntegrationProvider =
  | 'm365'
  | 'hubspot'
  | 'salesforce'
  | 'slack'
  | 'google'
  | 'docusign'
  | 'govwin'

/**
 * Check if a single provider has its required OAuth credentials configured.
 */
export async function isProviderAvailable(
  provider: IntegrationProvider
): Promise<boolean> {
  switch (provider) {
    case 'm365':
      return !!((process.env.MICROSOFT_CLIENT_ID || process.env.M365_CLIENT_ID) && (process.env.MICROSOFT_CLIENT_SECRET || process.env.M365_CLIENT_SECRET))
    case 'hubspot':
      return !!(process.env.HUBSPOT_CLIENT_ID && process.env.HUBSPOT_CLIENT_SECRET)
    case 'salesforce':
      return !!(process.env.SALESFORCE_CLIENT_ID && process.env.SALESFORCE_CLIENT_SECRET)
    case 'slack':
      return !!(process.env.SLACK_CLIENT_ID && process.env.SLACK_CLIENT_SECRET)
    case 'google':
      return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
    case 'docusign':
      return !!(process.env.DOCUSIGN_CLIENT_ID && process.env.DOCUSIGN_CLIENT_SECRET)
    case 'govwin':
      return !!(process.env.GOVWIN_CLIENT_ID && process.env.GOVWIN_CLIENT_SECRET)
    default:
      return false
  }
}

/**
 * Check availability for all providers at once.
 */
export async function getIntegrationAvailability(): Promise<
  Record<IntegrationProvider, boolean>
> {
  return {
    m365: !!((process.env.MICROSOFT_CLIENT_ID || process.env.M365_CLIENT_ID) && (process.env.MICROSOFT_CLIENT_SECRET || process.env.M365_CLIENT_SECRET)),
    hubspot: !!(process.env.HUBSPOT_CLIENT_ID && process.env.HUBSPOT_CLIENT_SECRET),
    salesforce: !!(process.env.SALESFORCE_CLIENT_ID && process.env.SALESFORCE_CLIENT_SECRET),
    slack: !!(process.env.SLACK_CLIENT_ID && process.env.SLACK_CLIENT_SECRET),
    google: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    docusign: !!(process.env.DOCUSIGN_CLIENT_ID && process.env.DOCUSIGN_CLIENT_SECRET),
    govwin: !!(process.env.GOVWIN_CLIENT_ID && process.env.GOVWIN_CLIENT_SECRET),
  }
}
