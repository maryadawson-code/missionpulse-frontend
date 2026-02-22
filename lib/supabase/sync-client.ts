// filepath: lib/supabase/sync-client.ts
/**
 * Phase J Sync Client
 *
 * The tables in migration 20260222_v1_3_phase_j.sql are not yet in the
 * auto-generated database.types.ts. This module provides a Supabase
 * client with relaxed table-name typing for the sync engine.
 *
 * TODO: Remove after running `supabase gen types typescript --project-id djuviwarqdvlbgcfuupa`
 *       and replace all `createSyncClient()` calls with `createClient()`.
 */
import { createClient } from './server'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Phase J table names — defined in migration 20260222_v1_3_phase_j.sql
 */
export type PhaseJTable =
  | 'document_sync_state'
  | 'sync_conflicts'
  | 'coordination_rules'
  | 'coordination_log'
  | 'document_versions'
  | 'proposal_milestones'
  | 'section_assignments'

/**
 * Create a Supabase server client that accepts Phase J table names.
 * Uses the same cookie-based auth as the standard `createClient()`.
 *
 * At runtime, `supabase.from(tableName)` works with any valid table;
 * this wrapper merely relaxes the TypeScript type-check.
 */
export function createSyncClient(): SupabaseClient {
  return createClient() as unknown as SupabaseClient
}
