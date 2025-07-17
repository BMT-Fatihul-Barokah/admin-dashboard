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

## Pengembangan

```bash
# Install dependencies
npm install --legacy-peer-deps

# Run development server
npm run dev

# Build for production
npm run build
```
