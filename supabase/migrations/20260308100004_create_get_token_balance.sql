CREATE OR REPLACE FUNCTION get_token_balance(p_company_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN (
    SELECT COALESCE(token_balance, 0)
    FROM   company_token_ledger
    WHERE  company_id = p_company_id
  );
END;
$$;
