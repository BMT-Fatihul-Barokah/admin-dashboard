export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <h1 className="text-2xl font-bold mb-2">Halaman Tidak Ditemukan</h1>
        <p className="text-gray-600 mb-4">
          Maaf, kami tidak dapat menemukan halaman yang Anda cari.
        </p>
        <div className="text-6xl font-bold mb-4 text-primary">404</div>
        <p className="text-gray-500 mb-6">
          URL yang Anda akses tidak valid atau telah dihapus.
        </p>
        <a
          href="/"
          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
        >
          Kembali ke Beranda
        </a>
      </div>
    </div>
  );
}
