/**
 * Mock External API Server
 *
 * Provides mock implementations for all external integrations
 * so CI tests run without live API calls.
 *
 * Mocked services: Salesforce, GovWin, Microsoft Graph, Slack, Stripe
 */

// ─── Salesforce Mocks ───────────────────────────────────────

export const mockSalesforceToken = {
  access_token: 'mock_sf_access_token_123',
  refresh_token: 'mock_sf_refresh_token_456',
  instance_url: 'https://mock.salesforce.com',
  token_type: 'Bearer',
  issued_at: Date.now().toString(),
}

export const mockSalesforceOpportunity = {
  Id: '006MOCK000001',
  Name: 'Mock DoD Cyber Contract',
  Amount: 5000000,
  Probability: 65,
  StageName: 'Proposal/Price Quote',
  CloseDate: '2026-06-30',
  Description: 'Mock Salesforce opportunity for testing',
  IsClosed: false,
  LastModifiedDate: new Date().toISOString(),
}

export const mockSalesforceOrg = {
  records: [{ Name: 'Mock Test Org' }],
}

export function createSalesforceMockResponses(): Map<string, unknown> {
  const map = new Map<string, unknown>()
  map.set('/services/oauth2/token', mockSalesforceToken)
  map.set('/services/data/v59.0/query', { records: [mockSalesforceOpportunity] })
  map.set('/services/data/v59.0/limits', { DailyApiRequests: { Max: 15000, Remaining: 14500 } })
  map.set('/services/data/v59.0/sobjects/Opportunity', { id: '006MOCKCREATED' })
  return map
}

// ─── GovWin IQ Mocks ───────────────────────────────────────

export const mockGovWinOpportunity = {
  id: 'GW-MOCK-001',
  title: 'Mock DHS IT Modernization',
  agency: 'DHS',
  subAgency: 'USCIS',
  naicsCode: '541512',
  setAside: 'Small Business',
  estimatedValue: 25000000,
  solicitationNumber: 'SOL-2026-MOCK',
  dueDate: '2026-08-15',
  description: 'Mock GovWin opportunity for testing',
  status: 'active',
  competitors: [
    { name: 'Competitor A', isIncumbent: true, winProbability: 40, source: 'GovWin' },
    { name: 'Competitor B', isIncumbent: false, winProbability: 25, source: 'GovWin' },
  ],
  agencyIntel: {
    agencyName: 'DHS',
    budgetForecast: 150000000,
    fiscalYear: '2026',
    acquisitionTimeline: 'Q3 FY2026',
    incumbentContractor: 'Competitor A',
    recompeteDate: '2026-09-30',
  },
}

export const mockGovWinToken = {
  access_token: 'mock_gw_access_token',
  refresh_token: 'mock_gw_refresh_token',
  expires_in: 3600,
}

// ─── Microsoft 365 Mocks ────────────────────────────────────

export const mockM365Token = {
  access_token: 'mock_m365_access_token',
  refresh_token: 'mock_m365_refresh_token',
  expires_in: 3600,
  token_type: 'Bearer',
}

export const mockM365UserProfile = {
  displayName: 'Test User',
  mail: 'test@missionpulse.io',
}

export const mockOneDriveFile = {
  id: 'mock-file-id-001',
  name: 'Tech_Volume_Draft.docx',
  size: 245000,
  webUrl: 'https://mock.sharepoint.com/documents/Tech_Volume_Draft.docx',
  lastModifiedDateTime: new Date().toISOString(),
  file: { mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
}

// ─── Slack Mocks ────────────────────────────────────────────

export const mockSlackToken = {
  ok: true,
  access_token: 'xoxb-mock-slack-bot-token',
  bot_user_id: 'UMOCKBOT',
  team: { id: 'TMOCKTEAM', name: 'Mock Workspace' },
  incoming_webhook: {
    url: 'https://hooks.slack.com/services/MOCK/WEBHOOK',
    channel: '#general',
    channel_id: 'CMOCKGEN',
  },
}

export const mockSlackMessage = {
  ok: true,
  ts: '1234567890.123456',
  channel: 'CMOCKGEN',
}

export const mockSlackChannels = {
  ok: true,
  channels: [
    { id: 'CMOCKGEN', name: 'general' },
    { id: 'CMOCKPROP', name: 'mp-mock-proposal' },
  ],
}

// ─── Stripe Mocks ───────────────────────────────────────────

export const mockStripeCheckoutSession = {
  id: 'cs_mock_session_001',
  object: 'checkout.session',
  customer: 'cus_mock_customer',
  subscription: 'sub_mock_subscription',
  payment_status: 'paid',
  metadata: {
    company_id: 'mock-company-id',
    token_amount: '10000',
  },
}

export const mockStripeWebhookEvent = {
  id: 'evt_mock_001',
  type: 'checkout.session.completed',
  data: {
    object: mockStripeCheckoutSession,
  },
}

// ─── Helper: Create fetch mock ──────────────────────────────

export function createFetchMock(
  responseMap: Map<string, unknown>
): typeof globalThis.fetch {
  return async (input: string | URL | Request): Promise<Response> => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url

    const entries = Array.from(responseMap.entries())
    for (const [pattern, response] of entries) {
      if (url.includes(pattern)) {
        return new Response(JSON.stringify(response), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }
    }

    return new Response('Not Found', { status: 404 })
  }
}
