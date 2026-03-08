/**
 * Token allocation constants per subscription tier.
 * Canonical source — matches subscription_plans.monthly_token_limit in DB.
 */
export const TOKEN_ALLOCATIONS = {
  trial: 50_000,
  starter: 500_000,
  professional: 2_000_000,
  enterprise: 10_000_000,
} as const

export type SubscriptionTier = keyof typeof TOKEN_ALLOCATIONS
