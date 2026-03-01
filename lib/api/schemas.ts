/**
 * API Request Body Validation Schemas
 *
 * Zod schemas for all mutation endpoints (API routes + server actions).
 * Provides defense-in-depth at the server boundary.
 *
 * v1.8 Sprint 50 T-50.1
 */

import { z } from 'zod'
import { NextResponse } from 'next/server'
import { emailSchema } from '@/lib/utils/validation'

// ─── Validate helper ─────────────────────────────────────────────

type ValidationSuccess<T> = { success: true; data: T }
type ValidationFailure = { success: false; error: string; details: z.ZodError }
type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure

/**
 * Parse a request body against a Zod schema.
 * Returns `{ data }` on success, `{ error, details }` on failure.
 */
export async function validateRequestBody<T>(
  request: Request,
  schema: z.ZodType<T>
): Promise<ValidationResult<T>> {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return {
      success: false,
      error: 'Invalid JSON body',
      details: new z.ZodError([
        {
          code: 'custom',
          path: [],
          message: 'Request body must be valid JSON',
        },
      ]),
    }
  }

  const result = schema.safeParse(body)
  if (!result.success) {
    return { success: false, error: 'Validation failed', details: result.error }
  }
  return { success: true, data: result.data }
}

/**
 * Return a structured 400 response for validation failures.
 */
export function validationErrorResponse(error: string, details: z.ZodError) {
  return NextResponse.json(
    {
      error,
      details: details.issues.map((i) => ({
        path: i.path.join('.'),
        message: i.message,
      })),
    },
    { status: 400 }
  )
}

// ─── Newsletter schemas ──────────────────────────────────────────

export const newsletterSubscribeSchema = z.object({
  email: emailSchema,
  source: z.string().trim().max(100).optional(),
})

export const newsletterUnsubscribeSchema = z.object({
  email: emailSchema,
})

// ─── Server Action schemas ───────────────────────────────────────

export const VALID_ROLES = [
  'executive',
  'operations',
  'capture_manager',
  'proposal_manager',
  'volume_lead',
  'pricing_manager',
  'contracts',
  'hr_staffing',
  'author',
  'partner',
  'subcontractor',
  'consultant',
] as const

export const updateUserRoleSchema = z.object({
  targetUserId: z.string().uuid('Invalid user ID'),
  newRole: z.enum(VALID_ROLES, { message: 'Invalid role' }),
})

export const VALID_PHASES = [
  'Gate 1',
  'Gate 2',
  'Gate 3',
  'Gate 4',
  'Gate 5',
  'Gate 6',
] as const

export const updatePhaseSchema = z.object({
  id: z.string().uuid('Invalid opportunity ID'),
  phase: z.enum(VALID_PHASES, { message: 'Invalid phase' }),
})

export const VALID_SWIMLANE_STATUSES = [
  'draft',
  'pink_review',
  'revision',
  'green_review',
  'red_review',
  'final',
] as const

export const updateSectionStatusSchema = z.object({
  sectionId: z.string().uuid('Invalid section ID'),
  newStatus: z.enum(VALID_SWIMLANE_STATUSES, { message: 'Invalid status' }),
  opportunityId: z.string().uuid('Invalid opportunity ID'),
})

export const updateSectionAssignmentSchema = z.object({
  sectionId: z.string().uuid('Invalid section ID'),
  writerId: z.string().uuid('Invalid writer ID').nullable(),
  reviewerId: z.string().uuid('Invalid reviewer ID').nullable(),
  opportunityId: z.string().uuid('Invalid opportunity ID'),
})

export const createSavedFilterSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name too long'),
  filters: z.record(z.string(), z.unknown()),
})

export const notificationPreferenceSchema = z.object({
  notification_type: z.string().min(1, 'Notification type is required'),
  email_enabled: z.boolean(),
  in_app_enabled: z.boolean(),
  push_enabled: z.boolean(),
})

export const updateNotificationPreferencesSchema = z.array(
  notificationPreferenceSchema
)

export const VALID_WIDGET_TYPES = [
  'pipeline_overview',
  'recent_activity',
  'team_workload',
  'compliance_health',
  'upcoming_deadlines',
  'win_rate',
  'ai_usage',
  'budget_burn',
] as const

export const widgetVisibilitySchema = z.object({
  widget_type: z.string().min(1, 'Widget type is required'),
  is_visible: z.boolean(),
})

export const saveWidgetVisibilitySchema = z.array(widgetVisibilitySchema)

export const VALID_DEBRIEF_TYPES = [
  'win',
  'loss',
  'no_bid',
  'protest',
] as const

export const VALID_DEBRIEF_OUTCOMES = [
  'win',
  'loss',
  'no_bid',
  'protest',
  'pending',
] as const

export const createDebriefSchema = z.object({
  opportunity_id: z.string().uuid('Invalid opportunity ID'),
  debrief_type: z.enum(VALID_DEBRIEF_TYPES, { message: 'Invalid debrief type' }),
  outcome: z.enum(VALID_DEBRIEF_OUTCOMES, { message: 'Invalid outcome' }),
  debrief_date: z.string().regex(/^\d{4}-\d{2}-\d{2}/, 'Invalid date format'),
  contract_value: z.number().min(0).optional(),
  strengths: z.array(z.string()).optional(),
  weaknesses: z.array(z.string()).optional(),
  lessons_learned: z.array(z.string()).optional(),
  evaluator_feedback: z.string().optional(),
  notes: z.string().optional(),
})
