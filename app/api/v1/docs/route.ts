/**
 * Public REST API — OpenAPI 3.0 Spec
 * Sprint 33 (T-33.2) — Phase L v2.0
 * © 2026 Mission Meets Tech
 */

import { NextResponse } from 'next/server'

const OPENAPI_SPEC = {
  openapi: '3.0.3',
  info: {
    title: 'MissionPulse Public API',
    version: '1.0.0',
    description: 'REST API for MissionPulse GovCon proposal management platform.',
    contact: { email: 'api@missionpulse.ai' },
  },
  servers: [
    { url: '/api/v1', description: 'Production' },
  ],
  security: [{ BearerAuth: [] }],
  components: {
    securitySchemes: {
      BearerAuth: { type: 'http', scheme: 'bearer', description: 'API key from Settings > API Keys' },
    },
  },
  paths: {
    '/opportunities': {
      get: {
        summary: 'List opportunities',
        tags: ['Opportunities'],
        parameters: [],
        responses: {
          200: { description: 'List of opportunities' },
          401: { description: 'Unauthorized' },
          429: { description: 'Rate limited' },
        },
      },
      post: {
        summary: 'Create opportunity',
        tags: ['Opportunities'],
        requestBody: { content: { 'application/json': { schema: { type: 'object' } } } },
        responses: {
          201: { description: 'Created' },
          400: { description: 'Validation error' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/opportunities/{id}': {
      get: { summary: 'Get opportunity', tags: ['Opportunities'], responses: { 200: { description: 'Opportunity details' } } },
      patch: { summary: 'Update opportunity', tags: ['Opportunities'], responses: { 200: { description: 'Updated' } } },
      delete: { summary: 'Delete opportunity', tags: ['Opportunities'], responses: { 200: { description: 'Deleted' } } },
    },
    '/proposals/{id}': {
      get: { summary: 'Get proposal (read-only)', tags: ['Proposals'], responses: { 200: { description: 'Proposal volumes and sections' } } },
    },
    '/compliance/{opportunityId}': {
      get: { summary: 'Get compliance requirements', tags: ['Compliance'], responses: { 200: { description: 'Compliance data' } } },
    },
    '/ai/query': {
      post: { summary: 'Submit AI query', tags: ['AI'], responses: { 200: { description: 'Query accepted' } } },
    },
    '/usage': {
      get: { summary: 'Get token usage', tags: ['Usage'], responses: { 200: { description: 'Token usage data' } } },
    },
  },
}

export async function GET() {
  return NextResponse.json(OPENAPI_SPEC, {
    headers: { 'Content-Type': 'application/json' },
  })
}
