-- Create a function to get recent activities for the dashboard
CREATE OR REPLACE FUNCTION get_recent_activities(activity_limit INTEGER DEFAULT 5)
RETURNS TABLE (
  id UUID,
  activity_type TEXT,
  description TEXT,
  amount NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE,
  status TEXT
)
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Recent transactions
  RETURN QUERY
  SELECT 
    t.id,
    'transaction'::TEXT as activity_type,
    CASE 
      WHEN t.tipe_transaksi = 'masuk' THEN 'Penerimaan ' || t.kategori || ' dari ' || COALESCE(a.nama, 'Anggota')
      ELSE 'Pengeluaran ' || t.kategori || ' dari ' || COALESCE(a.nama, 'Anggota')
    END as description,
    t.jumlah as amount,
    t.created_at,
    t.tipe_transaksi as status
  FROM transaksi t
  LEFT JOIN anggota a ON t.anggota_id = a.id
  
  UNION ALL
  
  -- Recent loans
  SELECT 
    p.id,
    'loan'::TEXT as activity_type,
    'Pembiayaan ' || p.status || ' untuk ' || COALESCE(a.nama, 'Anggota') as description,
    p.jumlah as amount,
    p.created_at,
    p.status
  FROM pembiayaan p
  LEFT JOIN anggota a ON p.anggota_id = a.id
  
  -- Sort by created_at and limit
  ORDER BY created_at DESC
  LIMIT activity_limit;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_recent_activities(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_recent_activities(INTEGER) TO anon;

-- Add comment for documentation
COMMENT ON FUNCTION get_recent_activities IS 'Returns recent activities (transactions and loans) for the dashboard';
