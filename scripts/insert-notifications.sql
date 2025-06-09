-- SQL script to insert dummy loan data and notifications
-- This bypasses RLS by being run directly in the database

-- Insert some jatuh tempo transactions and notifications
DO $$
DECLARE
  loan_id UUID;
  anggota_id UUID;
  transaction_id UUID;
  notification_id UUID;
  jatuh_tempo_date DATE;
BEGIN
  -- Get some existing anggota IDs
  FOR anggota_id IN (SELECT id FROM anggota LIMIT 3)
  LOOP
    -- Create a loan with jatuh tempo in the past month
    jatuh_tempo_date := CURRENT_DATE - (RANDOM() * 30)::INTEGER;
    
    INSERT INTO pembiayaan (
      anggota_id,
      jenis_pembiayaan_id,
      status,
      jumlah,
      jatuh_tempo,
      jangka_waktu,
      sisa_bulan,
      deskripsi
    ) VALUES (
      anggota_id,
      (SELECT id FROM jenis_pembiayaan LIMIT 1), -- Get first jenis_pembiayaan
      'aktif',
      (RANDOM() * 10000000 + 1000000)::NUMERIC, -- Random amount between 1-10 million
      jatuh_tempo_date,
      12, -- 12 months term
      6, -- 6 months remaining
      'Pembiayaan dengan jatuh tempo ' || jatuh_tempo_date
    )
    RETURNING id INTO loan_id;
    
    -- Create a transaction for the loan
    INSERT INTO transaksi (
      anggota_id,
      pembiayaan_id,
      tipe_transaksi,
      source_type,
      deskripsi,
      jumlah,
      sebelum,
      sesudah
    ) VALUES (
      anggota_id,
      loan_id,
      'jatuh_tempo',
      'pembiayaan',
      'Jatuh tempo pembiayaan pada ' || jatuh_tempo_date,
      (SELECT jumlah FROM pembiayaan WHERE id = loan_id),
      0,
      (SELECT jumlah FROM pembiayaan WHERE id = loan_id)
    )
    RETURNING id INTO transaction_id;
    
    -- Create a notification for the transaction
    INSERT INTO transaksi_notifikasi (
      transaksi_id,
      judul,
      pesan,
      jenis,
      data,
      is_read
    ) VALUES (
      transaction_id,
      'Jatuh Tempo Pembiayaan',
      'Pembiayaan Anda akan jatuh tempo pada tanggal ' || jatuh_tempo_date || '. Silakan lakukan pembayaran sebelum tanggal tersebut.',
      'transaksi',
      jsonb_build_object(
        'jatuh_tempo', jatuh_tempo_date,
        'pembiayaan_id', loan_id,
        'action', 'Lihat Detail'
      ),
      false
    )
    RETURNING id INTO notification_id;
    
    RAISE NOTICE 'Created loan % with transaction % and notification %', loan_id, transaction_id, notification_id;
  END LOOP;
  
  -- Create some global notifications
  INSERT INTO global_notifikasi (
    judul,
    pesan,
    jenis,
    data
  ) VALUES
  ('Pengumuman: Rapat Anggota Tahunan', 
   'Rapat Anggota Tahunan akan dilaksanakan pada tanggal 15 Juli 2025 pukul 09.00 WIB di Aula Koperasi.', 
   'pengumuman',
   '{"tanggal": "2025-07-15", "waktu": "09:00", "tempat": "Aula Koperasi", "action": "Lihat Detail"}'::jsonb),
   
  ('Pemeliharaan Sistem', 
   'Sistem akan mengalami pemeliharaan pada tanggal 20 Juni 2025 pukul 22.00 - 24.00 WIB. Mohon maaf atas ketidaknyamanannya.', 
   'sistem',
   '{"tanggal_mulai": "2025-06-20 22:00", "tanggal_selesai": "2025-06-20 24:00", "action": "Tutup"}'::jsonb),
   
  ('Update Aplikasi', 
   'Versi terbaru aplikasi telah tersedia. Silakan perbarui aplikasi Anda untuk mendapatkan fitur-fitur terbaru.', 
   'sistem',
   '{"versi": "2.5.0", "tanggal_rilis": "2025-06-05", "action": "Update"}'::jsonb);
   
  RAISE NOTICE 'Created global notifications';
END;
$$;
