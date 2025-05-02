# Admin Panel BMT Fatihul Barokah

Admin panel untuk pengelolaan data koperasi BMT Fatihul Barokah.

## Fitur Utama

- Dashboard dengan ringkasan data keuangan
- Manajemen anggota
- Manajemen transaksi
- Manajemen pinjaman
- Laporan keuangan
- Import data dari Excel
- Persetujuan pendaftaran anggota baru

## Import Data dari Excel

Fitur import data memungkinkan admin untuk mengimpor data dari file Excel ke dalam database Supabase. Fitur ini sangat berguna untuk migrasi data dari sistem lama atau untuk memperbarui data secara massal.

### Cara Menggunakan Fitur Import Data

1. Persiapkan file Excel dengan format yang sesuai (lihat template yang tersedia di halaman import)
2. Buka halaman Import Data di admin panel
3. Pilih jenis data yang akan diimpor (Anggota, Transaksi, atau Pinjaman)
4. Upload file Excel
5. Tinjau data yang akan diimpor pada halaman preview
6. Klik tombol "Import Data" untuk memulai proses import
7. Tunggu hingga proses selesai
8. Lihat hasil import pada halaman riwayat import

### Struktur File Excel untuk Import Data Anggota

File Excel untuk import data anggota harus memiliki kolom-kolom berikut:

- NO.: Nomor urut
- Nama Anggota: Nama lengkap anggota
- No. Rekening: Nomor rekening anggota (harus unik)
- Saldo: Saldo rekening anggota
- Alamat: Alamat lengkap anggota
- Kota: Kota tempat tinggal anggota
- Tempat Lahir: Tempat lahir anggota
- Tanggal Lahir: Tanggal lahir anggota (format tanggal Excel)
- Pekerjaan: Pekerjaan anggota
- Jenis Identitas: Jenis identitas (KTP, SIM, Paspor, dll)
- Nomor Identitas: Nomor identitas anggota

### Logika Import Data

Proses import data mengikuti logika berikut:

1. Jika data dengan nomor rekening yang sama sudah ada di database, data tersebut akan diperbarui
2. Jika data dengan nomor rekening belum ada di database, data baru akan dibuat
3. Semua aktivitas import akan dicatat dalam tabel riwayat import

### Menjalankan Import Data Melalui Script

Untuk menjalankan import data melalui script, gunakan perintah berikut:

```bash
node scripts/test-import.js "path/to/excel/file.xlsx"
```

### Database Migration

Sebelum menggunakan fitur import, pastikan tabel import_history sudah dibuat di database Supabase. Gunakan file SQL di folder migrations untuk membuat tabel tersebut:

```sql
-- Jalankan SQL ini di Supabase SQL Editor
-- File: migrations/create_import_history_table.sql
```

## Pengembangan

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```
