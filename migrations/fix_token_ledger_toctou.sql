-- Migration: fix_token_ledger_toctou
-- Purpose: Replace application-layer read-check-write token consumption with an atomic
--          PostgreSQL function using FOR UPDATE row locking. Eliminates the TOCTOU race
--          window where concurrent requests could overdraft a company's token balance.
-- Applies to: company_token_ledger table
-- Called by: lib/billing/tokens.ts via supabaseAdmin.rpc('consume_tokens_atomic', ...)
-- NIST controls: SC-28 (data integrity), AU-2 (audit logging)
-- Deploy: supabase migration new fix_token_ledger_toctou && supabase db push

-- STEP 1: Create the atomic consumption function

CREATE OR REPLACE FUNCTION consume_tokens_atomic(
  p_company_id  uuid,
  p_amount      integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current integer;
  v_new     integer;
BEGIN
  IF p_amount <= 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'remaining_tokens', 0,
      'error', 'Token amount must be positive'
    );
  END IF;

  -- FOR UPDATE acquires a row-level lock that blocks any concurrent transaction
  -- attempting to SELECT FOR UPDATE or UPDATE the same row. The second caller
  -- waits here until this transaction commits or rolls back. This eliminates the
  -- race: there is no window between the read and the write.
  SELECT token_balance
  INTO   v_current
  FROM   company_token_ledger
  WHERE  company_id = p_company_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'remaining_tokens', 0,
      'error', 'Ledger record not found for company'
    );
  END IF;

  IF v_current < p_amount THEN
    RETURN jsonb_build_object(
      'success', false,
      'remaining_tokens', v_current,
      'error', 'Insufficient token balance'
    );
  END IF;

  v_new := v_current - p_amount;

  UPDATE company_token_ledger
  SET    token_balance = v_new,
         updated_at    = now()
  WHERE  company_id = p_company_id;

  -- Immutable audit record. The audit_logs_immutable trigger prevents UPDATE/DELETE
  -- on this table (NIST AU-9).
  INSERT INTO audit_logs (
    user_id, action, target_table, target_id, metadata, created_at
  )
  VALUES (
    auth.uid(),
    'token_consumed',
    'company_token_ledger',
    p_company_id::text,
    jsonb_build_object(
      'amount_consumed', p_amount,
      'balance_before',  v_current,
      'balance_after',   v_new
    ),
    now()
  );

  RETURN jsonb_build_object(
    'success',          true,
    'remaining_tokens', v_new,
    'error',            null
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success',          false,
      'remaining_tokens', 0,
      'error',            SQLERRM
    );
END;
$$;

-- STEP 2: Lock down access

REVOKE ALL ON FUNCTION consume_tokens_atomic(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION consume_tokens_atomic(uuid, integer) TO service_role;

-- STEP 3: Balance read helper

CREATE OR REPLACE FUNCTION get_token_balance(p_company_id uuid)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(token_balance, 0)
  FROM   company_token_ledger
  WHERE  company_id = p_company_id;
$$;

REVOKE ALL ON FUNCTION get_token_balance(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_token_balance(uuid) TO service_role;

-- STEP 4: Verify both functions exist

DO $$
BEGIN
  ASSERT (
    SELECT COUNT(*) = 1 FROM pg_proc WHERE proname = 'consume_tokens_atomic'
  ), 'consume_tokens_atomic function was not created';

  ASSERT (
    SELECT COUNT(*) = 1 FROM pg_proc WHERE proname = 'get_token_balance'
  ), 'get_token_balance function was not created';

  RAISE NOTICE 'Token ledger TOCTOU fix migration verified successfully.';
END;
$$;

-- CALLER PATTERN (TypeScript reference):
--
--   import { supabaseAdmin } from '@/lib/supabase/admin'
--
--   const { data, error } = await supabaseAdmin.rpc('consume_tokens_atomic', {
--     p_company_id: companyId,
--     p_amount:     tokensRequired,
--   })
--
--   if (error) return { error: 'Token service unavailable' }
--   if (!data.success) return { error: data.error ?? 'Token consumption failed' }
--   // data.remaining_tokens is the new balance. Proceed with the operation.
