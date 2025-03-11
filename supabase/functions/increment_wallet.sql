
CREATE OR REPLACE FUNCTION increment_wallet(increment_amount bigint)
RETURNS bigint
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN wallet_balance + increment_amount;
END;
$$;
