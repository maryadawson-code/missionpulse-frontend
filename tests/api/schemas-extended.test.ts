import { describe, it, expect, vi } from 'vitest'
import { z } from 'zod'
import {
  validateRequestBody,
  validationErrorResponse,
  newsletterSubscribeSchema,
  newsletterUnsubscribeSchema,
  VALID_ROLES,
  updateUserRoleSchema,
  VALID_PHASES,
  updatePhaseSchema,
  VALID_SWIMLANE_STATUSES,
  updateSectionStatusSchema,
  updateSectionAssignmentSchema,
  createSavedFilterSchema,
  notificationPreferenceSchema,
  updateNotificationPreferencesSchema,
  VALID_WIDGET_TYPES,
  widgetVisibilitySchema,
  saveWidgetVisibilitySchema,
  VALID_DEBRIEF_TYPES,
  VALID_DEBRIEF_OUTCOMES,
  createDebriefSchema,
} from '@/lib/api/schemas'

describe('validateRequestBody', () => {
  const testSchema = z.object({ name: z.string().min(1) })

  it('returns success for valid JSON body', async () => {
    const request = new Request('https://test.local', {
      method: 'POST',
      body: JSON.stringify({ name: 'test' }),
    })
    const result = await validateRequestBody(request, testSchema)
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.name).toBe('test')
  })

  it('returns failure for invalid JSON', async () => {
    const request = new Request('https://test.local', {
      method: 'POST',
      body: 'not json',
    })
    const result = await validateRequestBody(request, testSchema)
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe('Invalid JSON body')
  })

  it('returns failure for schema mismatch', async () => {
    const request = new Request('https://test.local', {
      method: 'POST',
      body: JSON.stringify({ name: '' }),
    })
    const result = await validateRequestBody(request, testSchema)
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe('Validation failed')
  })
})

describe('validationErrorResponse', () => {
  it('returns 400 status with structured error', async () => {
    const zodError = new z.ZodError([
      { code: 'custom', path: ['name'], message: 'Required' },
    ])
    const response = validationErrorResponse('Validation failed', zodError)
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toBe('Validation failed')
    expect(body.details).toHaveLength(1)
    expect(body.details[0].path).toBe('name')
    expect(body.details[0].message).toBe('Required')
  })
})

describe('newsletterSubscribeSchema', () => {
  it('validates email', () => {
    expect(newsletterSubscribeSchema.safeParse({ email: 'test@test.com' }).success).toBe(true)
  })
  it('rejects invalid email', () => {
    expect(newsletterSubscribeSchema.safeParse({ email: 'not-email' }).success).toBe(false)
  })
  it('accepts optional source', () => {
    expect(newsletterSubscribeSchema.safeParse({ email: 'a@b.com', source: 'web' }).success).toBe(true)
  })
})

describe('newsletterUnsubscribeSchema', () => {
  it('validates email', () => {
    expect(newsletterUnsubscribeSchema.safeParse({ email: 'test@test.com' }).success).toBe(true)
  })
  it('rejects missing email', () => {
    expect(newsletterUnsubscribeSchema.safeParse({}).success).toBe(false)
  })
})

describe('VALID_ROLES', () => {
  it('contains 12 roles', () => {
    expect(VALID_ROLES).toHaveLength(12)
  })
  it('includes key roles', () => {
    expect(VALID_ROLES).toContain('executive')
    expect(VALID_ROLES).toContain('capture_manager')
    expect(VALID_ROLES).toContain('consultant')
  })
})

describe('updateUserRoleSchema', () => {
  it('validates correct input', () => {
    const result = updateUserRoleSchema.safeParse({
      targetUserId: '550e8400-e29b-41d4-a716-446655440000',
      newRole: 'executive',
    })
    expect(result.success).toBe(true)
  })
  it('rejects invalid UUID', () => {
    expect(updateUserRoleSchema.safeParse({ targetUserId: 'bad', newRole: 'executive' }).success).toBe(false)
  })
  it('rejects invalid role', () => {
    expect(updateUserRoleSchema.safeParse({
      targetUserId: '550e8400-e29b-41d4-a716-446655440000',
      newRole: 'superadmin',
    }).success).toBe(false)
  })
})

describe('updatePhaseSchema', () => {
  it('validates Gate 1 through Gate 6', () => {
    for (const phase of VALID_PHASES) {
      expect(updatePhaseSchema.safeParse({
        id: '550e8400-e29b-41d4-a716-446655440000',
        phase,
      }).success).toBe(true)
    }
  })
  it('rejects invalid phase', () => {
    expect(updatePhaseSchema.safeParse({
      id: '550e8400-e29b-41d4-a716-446655440000',
      phase: 'Gate 7',
    }).success).toBe(false)
  })
})

describe('updateSectionStatusSchema', () => {
  it('validates all swimlane statuses', () => {
    for (const status of VALID_SWIMLANE_STATUSES) {
      expect(updateSectionStatusSchema.safeParse({
        sectionId: '550e8400-e29b-41d4-a716-446655440000',
        newStatus: status,
        opportunityId: '550e8400-e29b-41d4-a716-446655440000',
      }).success).toBe(true)
    }
  })
})

describe('updateSectionAssignmentSchema', () => {
  it('accepts null writer and reviewer', () => {
    expect(updateSectionAssignmentSchema.safeParse({
      sectionId: '550e8400-e29b-41d4-a716-446655440000',
      writerId: null,
      reviewerId: null,
      opportunityId: '550e8400-e29b-41d4-a716-446655440000',
    }).success).toBe(true)
  })
  it('accepts valid UUID writer and reviewer', () => {
    expect(updateSectionAssignmentSchema.safeParse({
      sectionId: '550e8400-e29b-41d4-a716-446655440000',
      writerId: '550e8400-e29b-41d4-a716-446655440000',
      reviewerId: '550e8400-e29b-41d4-a716-446655440000',
      opportunityId: '550e8400-e29b-41d4-a716-446655440000',
    }).success).toBe(true)
  })
})

describe('createSavedFilterSchema', () => {
  it('validates minimal filter', () => {
    expect(createSavedFilterSchema.safeParse({ name: 'My Filter', filters: {} }).success).toBe(true)
  })
  it('rejects empty name', () => {
    expect(createSavedFilterSchema.safeParse({ name: '', filters: {} }).success).toBe(false)
  })
  it('rejects name > 100 chars', () => {
    expect(createSavedFilterSchema.safeParse({ name: 'x'.repeat(101), filters: {} }).success).toBe(false)
  })
})

describe('notificationPreferenceSchema', () => {
  it('validates complete preference', () => {
    expect(notificationPreferenceSchema.safeParse({
      notification_type: 'deadline',
      email_enabled: true,
      in_app_enabled: true,
      push_enabled: false,
    }).success).toBe(true)
  })
})

describe('updateNotificationPreferencesSchema', () => {
  it('validates array of preferences', () => {
    expect(updateNotificationPreferencesSchema.safeParse([
      { notification_type: 'deadline', email_enabled: true, in_app_enabled: true, push_enabled: false },
      { notification_type: 'comment', email_enabled: false, in_app_enabled: true, push_enabled: false },
    ]).success).toBe(true)
  })
})

describe('VALID_WIDGET_TYPES', () => {
  it('contains expected widgets', () => {
    expect(VALID_WIDGET_TYPES).toContain('pipeline_overview')
    expect(VALID_WIDGET_TYPES).toContain('ai_usage')
    expect(VALID_WIDGET_TYPES).toContain('budget_burn')
    expect(VALID_WIDGET_TYPES.length).toBeGreaterThanOrEqual(8)
  })
})

describe('widgetVisibilitySchema', () => {
  it('validates widget visibility', () => {
    expect(widgetVisibilitySchema.safeParse({ widget_type: 'ai_usage', is_visible: true }).success).toBe(true)
  })
})

describe('saveWidgetVisibilitySchema', () => {
  it('validates array', () => {
    expect(saveWidgetVisibilitySchema.safeParse([
      { widget_type: 'ai_usage', is_visible: true },
    ]).success).toBe(true)
  })
})

describe('createDebriefSchema', () => {
  it('validates complete debrief', () => {
    expect(createDebriefSchema.safeParse({
      opportunity_id: '550e8400-e29b-41d4-a716-446655440000',
      debrief_type: 'win',
      outcome: 'win',
      debrief_date: '2026-03-01',
    }).success).toBe(true)
  })
  it('accepts optional fields', () => {
    expect(createDebriefSchema.safeParse({
      opportunity_id: '550e8400-e29b-41d4-a716-446655440000',
      debrief_type: 'loss',
      outcome: 'loss',
      debrief_date: '2026-03-01',
      contract_value: 5000000,
      strengths: ['Strong team'],
      weaknesses: ['Price too high'],
      lessons_learned: ['Be more competitive'],
      evaluator_feedback: 'Good but expensive',
      notes: 'Follow up next quarter',
    }).success).toBe(true)
  })
  it('rejects invalid debrief type', () => {
    expect(createDebriefSchema.safeParse({
      opportunity_id: '550e8400-e29b-41d4-a716-446655440000',
      debrief_type: 'invalid',
      outcome: 'win',
      debrief_date: '2026-03-01',
    }).success).toBe(false)
  })
  it('rejects invalid date format', () => {
    expect(createDebriefSchema.safeParse({
      opportunity_id: '550e8400-e29b-41d4-a716-446655440000',
      debrief_type: 'win',
      outcome: 'win',
      debrief_date: 'not-a-date',
    }).success).toBe(false)
  })
  it('VALID_DEBRIEF_TYPES includes expected types', () => {
    expect(VALID_DEBRIEF_TYPES).toContain('win')
    expect(VALID_DEBRIEF_TYPES).toContain('loss')
    expect(VALID_DEBRIEF_TYPES).toContain('no_bid')
    expect(VALID_DEBRIEF_TYPES).toContain('protest')
  })
  it('VALID_DEBRIEF_OUTCOMES includes pending', () => {
    expect(VALID_DEBRIEF_OUTCOMES).toContain('pending')
  })
})
