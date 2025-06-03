-- Create a function to get dashboard analytics data
CREATE OR REPLACE FUNCTION get_dashboard_analytics(start_date TIMESTAMP WITH TIME ZONE)
RETURNS TABLE (
  data_type TEXT,
  month TEXT,
  count BIGINT,
  amount NUMERIC,
  status TEXT,
  jenis TEXT
)
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Registration data by month
  RETURN QUERY
  SELECT 
    'registration' as data_type,
    TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YYYY') as month,
    COUNT(*) as count,
    0 as amount,
    is_active::TEXT as status,
    NULL as jenis
  FROM anggota
  WHERE created_at >= start_date
  GROUP BY DATE_TRUNC('month', created_at), is_active
  
  UNION ALL
  
  -- Loan data by month
  SELECT
    'loan' as data_type,
    TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YYYY') as month,
    COUNT(*) as count,
    SUM(jumlah) as amount,
    status,
    jenis_pembiayaan as jenis
  FROM pembiayaan
  WHERE created_at >= start_date
  GROUP BY DATE_TRUNC('month', created_at), status, jenis_pembiayaan
  
  UNION ALL
  
  -- Transaction data by month
  SELECT
    'transaction' as data_type,
    TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YYYY') as month,
    COUNT(*) as count,
    SUM(jumlah) as amount,
    tipe_transaksi as status,
    NULL as jenis
  FROM transaksi
  WHERE created_at >= start_date
  GROUP BY DATE_TRUNC('month', created_at), tipe_transaksi
  
  ORDER BY data_type, month;
END;
$$;