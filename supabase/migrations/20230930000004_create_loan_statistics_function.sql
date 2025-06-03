-- Create a function to get loan statistics
CREATE OR REPLACE FUNCTION get_loan_statistics()
RETURNS TABLE (
  active_loans_count BIGINT,
  active_loans_amount NUMERIC,
  approval_rate NUMERIC,
  average_loan_amount NUMERIC,
  total_loans BIGINT,
  approved_loans BIGINT
)
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    -- Active loans count
    COUNT(*) FILTER (WHERE status = 'aktif') as active_loans_count,
    
    -- Active loans total amount
    COALESCE(SUM(jumlah) FILTER (WHERE status = 'aktif'), 0) as active_loans_amount,
    
    -- Approval rate (percentage of loans that were approved)
    CASE
      WHEN COUNT(*) > 0 THEN
        ROUND((COUNT(*) FILTER (WHERE status IN ('aktif', 'lunas', 'disetujui'))::NUMERIC / COUNT(*)::NUMERIC) * 100, 2)
      ELSE 0
    END as approval_rate,
    
    -- Average loan amount
    CASE
      WHEN COUNT(*) > 0 THEN ROUND(AVG(jumlah), 2)
      ELSE 0
    END as average_loan_amount,
    
    -- Total number of loans
    COUNT(*) as total_loans,
    
    -- Number of approved loans
    COUNT(*) FILTER (WHERE status IN ('aktif', 'lunas', 'disetujui')) as approved_loans
    
  FROM pembiayaan;
END;
$$;
