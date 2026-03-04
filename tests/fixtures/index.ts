/**
 * Shared test fixtures barrel export.
 *
 * Usage:
 *   import { getMockProfile, getMockOpportunity, createMockSupabaseClient } from '@/tests/fixtures'
 */
export { createMockQueryBuilder, createMockSupabaseClient } from './supabase'
export { mockProfiles, getMockProfile, type MockProfile } from './profile'
export { mockOpportunities, getMockOpportunity, getMockOpportunityList, type MockOpportunity } from './opportunity'
export { fullAccess, viewOnly, noAccess, rolePermissions, getMockPermission, type MockModulePermission } from './permissions'
