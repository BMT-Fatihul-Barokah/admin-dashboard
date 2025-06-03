-- Create a function to get loan approval rates over time
CREATE OR REPLACE FUNCTION get_loan_approval_rates(start_date TIMESTAMP WITH TIME ZONE)
RETURNS TABLE (
  month TEXT,
  total_applications BIGINT,
  approved_applications BIGINT,
  approval_rate NUMERIC,
  average_amount NUMERIC
)
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YYYY') as month,
    COUNT(*) as total_applications,
    COUNT(*) FILTER (WHERE status IN ('aktif', 'lunas', 'disetujui')) as approved_applications,
    CASE
      WHEN COUNT(*) > 0 THEN
        ROUND((COUNT(*) FILTER (WHERE status IN ('aktif', 'lunas', 'disetujui'))::NUMERIC / COUNT(*)::NUMERIC) * 100, 2)
      ELSE 0
    END as approval_rate,
    CASE
      WHEN COUNT(*) > 0 THEN ROUND(AVG(jumlah), 2)
      ELSE 0
    END as average_amount
  FROM pembiayaan
  WHERE created_at >= start_date
  GROUP BY DATE_TRUNC('month', created_at)
  ORDER BY DATE_TRUNC('month', created_at);
END;
$$;
