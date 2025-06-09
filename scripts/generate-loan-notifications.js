// Script to generate dummy loan data with jatuh tempo (due date) notifications
const { createClient } = require('@supabase/supabase-js');

// Supabase connection
const supabaseUrl = 'https://vszhxeamcxgqtwyaxhlu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzemh4ZWFtY3hncXR3eWF4aGx1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4NDQ0ODYsImV4cCI6MjA2NDQyMDQ4Nn0.x6Nj5UAHLA2nsNfvK4P8opRkB0U3--ZFt7Dc3Dj-q94';
const supabase = createClient(supabaseUrl, supabaseKey);

// Get current date and past dates
const today = new Date();
const oneMonthAgo = new Date();
oneMonthAgo.setMonth(today.getMonth() - 1);
const twoMonthsAgo = new Date();
twoMonthsAgo.setMonth(today.getMonth() - 2);
const threeMonthsAgo = new Date();
threeMonthsAgo.setMonth(today.getMonth() - 3);

// Format date to YYYY-MM-DD
const formatDate = (date) => {
  return date.toISOString().split('T')[0];
};

// Generate dummy loan data with due dates
async function generateDummyLoans() {
  try {
    // Get some existing anggota (members)
    const { data: anggota, error: anggotaError } = await supabase
      .from('anggota')
      .select('id, nama')
      .limit(3);

    if (anggotaError) {
      console.error('Error fetching anggota:', anggotaError);
      return;
    }

    if (!anggota || anggota.length === 0) {
      console.error('No anggota found. Please create some members first.');
      return;
    }

    console.log(`Found ${anggota.length} anggota for dummy loans`);

    // Get jenis_pembiayaan (loan types)
    const { data: jenisPembiayaan, error: jenisPembiayaanError } = await supabase
      .from('jenis_pembiayaan')
      .select('id')
      .limit(1);

    if (jenisPembiayaanError) {
      console.error('Error fetching jenis_pembiayaan:', jenisPembiayaanError);
      return;
    }

    if (!jenisPembiayaan || jenisPembiayaan.length === 0) {
      console.error('No jenis_pembiayaan found. Please create loan types first.');
      return;
    }

    const jenisPembiayaanId = jenisPembiayaan[0].id;

    // Create loans with different due dates
    const loans = [
      {
        anggota_id: anggota[0].id,
        status: 'aktif',
        jumlah: 5000000,
        jatuh_tempo: formatDate(today), // Due today
        total_pembayaran: 0,
        sisa_pembayaran: 5000000,
        deskripsi: 'Pinjaman untuk kebutuhan konsumtif',
        jangka_waktu: 12,
        tanggal_jatuh_tempo_bulanan: today.getDate(),
        sisa_bulan: 12,
        jenis_pembiayaan_id: jenisPembiayaanId,
        created_at: formatDate(threeMonthsAgo),
      },
      {
        anggota_id: anggota[1].id,
        status: 'aktif',
        jumlah: 7500000,
        jatuh_tempo: formatDate(oneMonthAgo), // Due one month ago
        total_pembayaran: 0,
        sisa_pembayaran: 7500000,
        deskripsi: 'Pinjaman untuk modal usaha',
        jangka_waktu: 24,
        tanggal_jatuh_tempo_bulanan: oneMonthAgo.getDate(),
        sisa_bulan: 24,
        jenis_pembiayaan_id: jenisPembiayaanId,
        created_at: formatDate(threeMonthsAgo),
      },
      {
        anggota_id: anggota[2].id,
        status: 'aktif',
        jumlah: 10000000,
        jatuh_tempo: formatDate(twoMonthsAgo), // Due two months ago
        total_pembayaran: 0,
        sisa_pembayaran: 10000000,
        deskripsi: 'Pinjaman untuk investasi',
        jangka_waktu: 36,
        tanggal_jatuh_tempo_bulanan: twoMonthsAgo.getDate(),
        sisa_bulan: 36,
        jenis_pembiayaan_id: jenisPembiayaanId,
        created_at: formatDate(threeMonthsAgo),
      }
    ];

    // Create a loan with jatuh tempo notification
    async function createLoanWithNotification(anggotaId, jenisPembiayaanId, tanggalJatuhTempo) {
      try {
        // Create the loan using RPC function to bypass RLS
        const loanAmount = Math.floor(Math.random() * 10000000) + 1000000; // Random amount between 1-10 million
        const { data: loanId, error: loanError } = await supabase
          .rpc('admin_create_pembiayaan', {
            p_anggota_id: anggotaId,
            p_jenis_pembiayaan_id: jenisPembiayaanId,
            p_jumlah: loanAmount,
            p_jangka_waktu: Math.floor(Math.random() * 24) + 6, // Random between 6-30 months
            p_status: 'aktif',
            p_jatuh_tempo: tanggalJatuhTempo.toISOString().split('T')[0] // Format as YYYY-MM-DD
          });

        if (loanError) {
          console.error('Error creating loan:', loanError);
          return null;
        }

        console.log(`Created loan with ID: ${loanId}`);

        // Create transaction and notification for the loan using RPC function
        const formattedDate = new Date(tanggalJatuhTempo).toLocaleDateString('id-ID');
        const { data: result, error: transactionError } = await supabase
          .rpc('admin_create_jatuh_tempo_transaction', {
            p_anggota_id: anggotaId,
            p_pembiayaan_id: loanId,
            p_jumlah: loanAmount,
            p_deskripsi: `Jatuh tempo pembiayaan pada ${formattedDate}`,
            p_jatuh_tempo: tanggalJatuhTempo.toISOString().split('T')[0],
            p_judul: `Jatuh Tempo Pembiayaan`,
            p_pesan: `Pembiayaan Anda akan jatuh tempo pada tanggal ${formattedDate}. Silakan lakukan pembayaran sebelum tanggal tersebut.`
          });

        if (transactionError) {
          console.error('Error creating transaction and notification:', transactionError);
          return { loanId, transactionId: null, notificationId: null };
        } else {
          console.log(`Created transaction ${result.transaksi_id} and notification ${result.notifikasi_id} for loan ${loanId}`);
          return { 
            loanId, 
            transactionId: result.transaksi_id, 
            notificationId: result.notifikasi_id 
          };
        }
      } catch (error) {
        console.error('Error in createLoanWithNotification:', error);
        return null;
      }
    }

    // Insert loans
    for (const loan of loans) {
      const result = await createLoanWithNotification(loan.anggota_id, jenisPembiayaanId, new Date(loan.jatuh_tempo));
      if (result) {
        console.log(`Created loan with ID: ${result.loanId} and transaction ID: ${result.transactionId} and notification ID: ${result.notificationId}`);
      }
    }

    // Create global notifications (pengumuman and sistem)
    const globalNotifications = [
      {
        judul: 'Pengumuman: Rapat Anggota Tahunan',
        pesan: 'Rapat Anggota Tahunan akan dilaksanakan pada tanggal 15 Juli 2025 pukul 09.00 WIB di Aula Koperasi Fatihul Barokah.',
        jenis: 'pengumuman',
        data: {
          tanggal: '2025-07-15',
          waktu: '09:00',
          action: 'Lihat Detail'
        }
      },
      {
        judul: 'Pemeliharaan Sistem',
        pesan: 'Sistem akan mengalami pemeliharaan pada tanggal 20 Juni 2023 pukul 23:00 - 01:00 WIB.',
        jenis: 'sistem',
        data: {
          action: 'Lihat Jadwal'
        }
      },
      {
        judul: 'Update Aplikasi',
        pesan: 'Versi terbaru aplikasi telah tersedia. Silakan perbarui aplikasi Anda untuk mendapatkan fitur terbaru.',
        jenis: 'sistem',
        data: {
          action: 'Update Sekarang'
        }
      }
    ];

    // Function to create global notification using RPC
    async function createGlobalNotification(notification) {
      try {
        const { data, error } = await supabase
          .rpc('admin_create_global_notification', {
            p_judul: notification.judul,
            p_pesan: notification.pesan,
            p_jenis: notification.jenis,
            p_data: JSON.stringify(notification.data)
          });

        if (error) {
          console.error('Error creating global notification:', error);
          return null;
        }

        console.log(`Created global notification with ID: ${data}`);
        return data;
      } catch (error) {
        console.error('Error in createGlobalNotification:', error);
        return null;
      }
    }

    for (const notification of globalNotifications) {
      const notificationId = await createGlobalNotification(notification);
      if (notificationId) {
        console.log(`Successfully created global notification: ${notification.judul}`);
      }
    }

    console.log('Dummy data generation completed successfully!');
  } catch (error) {
    console.error('Error generating dummy data:', error);
  }
}

// Run the function
generateDummyLoans();
