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
