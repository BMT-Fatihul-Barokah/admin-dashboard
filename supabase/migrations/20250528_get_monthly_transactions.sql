-- Function to get monthly transactions
CREATE OR REPLACE FUNCTION get_monthly_transactions(start_date TIMESTAMP)
RETURNS TABLE (
  month TEXT,
  total_amount NUMERIC,
  count BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') as month,
    COALESCE(SUM(CASE WHEN tipe_transaksi = 'masuk' THEN jumlah ELSE 0 END), 0) as total_amount,
    COUNT(*) as count
  FROM 
    transaksi
  WHERE 
    created_at >= start_date
  GROUP BY 
    DATE_TRUNC('month', created_at)
  ORDER BY 
    DATE_TRUNC('month', created_at);
END;
$$;
