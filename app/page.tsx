"use client";
import Image from "next/image";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  ChevronRight,
  Phone,
  Mail,
  MapPin,
  Clock,
  CheckCircle,
  Users,
  Wallet,
  PiggyBank,
  CreditCard,
} from "lucide-react";
import { Roboto } from "next/font/google";
// Add import at the top
import { MobileMenu } from "@/components/mobile-menu";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
});
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import toast, { Toaster } from "react-hot-toast";
export default function HomePage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const router = useRouter();

  // Function untuk direct download
  const handleDirectDownload = () => {
    const downloadUrl =
      "https://expo.dev/accounts/bmtfatihulbarokah/projects/koperasi-fatihul-barokah-mobile-apps/builds/d5a38dec-57d9-4531-a67b-df93d136bf1e";
    window.open(downloadUrl, "_blank");
  };

  // Function untuk tutorial toast
  const showTutorialToast = () => {
    toast(
      (t) => (
        <div className="space-y-3 max-w-sm">
          <div className="font-semibold text-gray-900">
            Tutorial Download Aplikasi
          </div>
          <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
            <li>Tekan tombol "Download Sekarang"</li>
            <li>Pilih opsi "Install"</li>
            <li>Berikan izin unduhan dari browser Anda</li>
            <li>Buka file APK yang telah berhasil diunduh</li>
            <li>
              Aktifkan pengaturan "Izinkan instalasi dari sumber tidak dikenal"
            </li>
            <li>Ikuti seluruh tahapan proses instalasi hingga selesai</li>
            <li>
              Setelah berhasil menginstal aplikasi, silakan menghubungi kami
              melalui website resmi untuk bantuan lebih lanjut
            </li>
          </ol>
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => {
                handleDirectDownload();
                toast.dismiss(t.id);
              }}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
            >
              Download Sekarang
            </button>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-400 transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      ),
      {
        duration: 10000,
        position: "top-right",
      }
    );
  };
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast Container - Responsive */}
      <Toaster
        position="top-right"
        toastOptions={{
          className: "text-sm",
          style: {
            maxWidth: "90vw",
          },
        }}
      />

      {/* Header dengan Logo yang Diperbaiki */}
      <header className="bg-white shadow-lg border-b-2 border-blue-100 fixed top-0 w-full z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo Section - Tanpa Background */}
            <div className="flex items-center flex-shrink-0">
              <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                aria-label="Scroll ke atas"
                className="focus:outline-none"
              >
                <Image
                  src="/logo.png"
                  alt="BMT Fatihul Barokah Logo"
                  width={86}
                  height={86}
                  className="object-contain mr-0.1 cursor-pointer hover:opacity-75 transition"
                />
              </button>
              <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="
    flex flex-col text-left bg-transparent border-none p-0 m-0
    focus:outline-none cursor-pointer group
    transition
  "
                aria-label="Kembali ke halaman sebelumnya"
              >
                <span className="text-xl font-bold text-gray-900 leading-tight group-active:text-blue-700 transition">
                  BMT Fatihul Barokah
                </span>
                <span className="text-sm text-blue-600 font-medium group-active:text-blue-900 transition">
                  Solusi Keuangan Syariah
                </span>
              </button>
            </div>

            {/* Navigation Menu */}
            <nav className="hidden md:flex items-center space-x-6">
              <a
                href="#tentang"
                className="text-gray-700 hover:text-blue-600 font-medium px-3 py-2 rounded-lg transition-colors hover:bg-blue-50"
              >
                Tentang Kami
              </a>
              <a
                href="#layanan"
                className="text-gray-700 hover:text-blue-600 font-medium px-3 py-2 rounded-lg transition-colors hover:bg-blue-50"
              >
                Layanan
              </a>
              <a
                href="#simpanan"
                className="text-gray-700 hover:text-blue-600 font-medium px-3 py-2 rounded-lg transition-colors hover:bg-blue-50"
              >
                Simpanan
              </a>
              <a
                href="#pembiayaan"
                className="text-gray-700 hover:text-blue-600 font-medium px-3 py-2 rounded-lg transition-colors hover:bg-blue-50"
              >
                Pembiayaan
              </a>
              <a
                href="#kontak"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-lg font-medium"
              >
                Kontak
              </a>
            </nav>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={toggleMobileMenu}
                className="text-gray-700 hover:text-blue-600 p-2"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d={
                      isMobileMenuOpen
                        ? "M6 18L18 6M6 6l12 12"
                        : "M4 6h16M4 12h16M4 18h16"
                    }
                  />
                </svg>
              </button>
            </div>

            {/* Tambahkan mobile menu dropdown SETELAH header */}
            {isMobileMenuOpen && (
              <div className="md:hidden bg-white border-t border-gray-200 absolute top-full left-0 right-0 z-40">
                <div className="px-4 py-2 space-y-1">
                  <a
                    href="#tentang"
                    className="block py-2 text-gray-700 hover:text-blue-600"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Tentang Kami
                  </a>
                  <a
                    href="#layanan"
                    className="block py-2 text-gray-700 hover:text-blue-600"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Layanan
                  </a>
                  <a
                    href="#simpanan"
                    className="block py-2 text-gray-700 hover:text-blue-600"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Simpanan
                  </a>
                  <a
                    href="#pembiayaan"
                    className="block py-2 text-gray-700 hover:text-blue-600"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Pembiayaan
                  </a>
                  <a
                    href="#kontak"
                    className="block py-2 bg-blue-600 text-white px-4 rounded text-center"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Kontak
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content dengan padding top untuk fixed header */}
      <main className="pt-16">
        <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 min-h-screen flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-white">
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                Bergabung dengan BMT Fatihul Barokah
              </h1>
              <p className="text-lg md:text-xl lg:text-2xl mb-8 text-blue-100">
                Solusi Keuangan Syariah yang Aman dan Terpercaya
              </p>

              {/* Button Section yang Diupdate */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleDirectDownload}
                  className="bg-white text-blue-900 px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold hover:bg-blue-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                    />
                  </svg>
                  <span className="text-sm sm:text-base">
                    Download Sekarang
                  </span>
                </button>

                <button
                  onClick={showTutorialToast}
                  className="border-2 border-white text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold hover:bg-white hover:text-blue-900 transition-all duration-200 hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-sm sm:text-base">
                    Tutorial Donwload Aplikasi
                  </span>
                </button>
              </div>
            </div>

            {/* Hero Card */}
            <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-8 border border-white border-opacity-20">
              <div className="text-center text-white">
                <div className="w-16 h-16 bg-white bg-opacity-30 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg
                    className="w-8 h-8"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-4">
                  Keuangan Syariah Digital
                </h3>
                <p className="text-blue-100 mb-6">
                  Nikmati layanan perbankan syariah yang modern dan terpercaya
                </p>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-3xl font-bold">1000+</div>
                    <div className="text-sm text-blue-200">Anggota</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold">5+</div>
                    <div className="text-sm text-blue-200">Layanan</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold">24/7</div>
                    <div className="text-sm text-blue-200">Support</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Tentang Section */}
        <section id="tentang" className="scroll-mt-18 py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Tentang BMT Fatihul Barokah
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                BMT Fatihul Barokah adalah lembaga keuangan mikro syariah yang
                berkomitmen untuk memberikan solusi finansial berdasarkan
                prinsip-prinsip syariah.
              </p>
            </div>

            {/* Legalitas BMT Section */}
            <div className="bg-white shadow-lg rounded-xl p-8 mb-12 border-l-4 border-blue-600">
              <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <svg className="w-6 h-6 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                </svg>
                LEGALITAS BMT FATIHUL BAROKAH
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 p-5 rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-start mb-3">
                    <div className="bg-blue-100 p-2 rounded-md mr-3">
                      <svg className="w-5 h-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Akta Pendirian</h4>
                      <p className="text-gray-700 text-sm">Notaris Ida Ferliyanti, SH. Nomor 04 tertanggal 12 September 2022.</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-blue-50 p-5 rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-start mb-3">
                    <div className="bg-blue-100 p-2 rounded-md mr-3">
                      <svg className="w-5 h-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Pengesahan Badan Hukum</h4>
                      <p className="text-gray-700 text-sm">Terdaftar di Kemenkumham RI Nomor AHU-004857.AH.01.26. Tahun 2022.</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-blue-50 p-5 rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-start mb-3">
                    <div className="bg-blue-100 p-2 rounded-md mr-3">
                      <svg className="w-5 h-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Nomor Induk Koperasi</h4>
                      <p className="text-gray-700 text-sm">Terdaftar di Kementerian Koperasi dan Usaha Kecil dan Menengah, dengan Nomor: 371008300134.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Feature Cards */}
              <div className="text-center p-8 bg-blue-50 rounded-xl hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Syariah Compliance
                </h3>
                <p className="text-gray-600">
                  Seluruh produk dan layanan kami sesuai dengan prinsip syariah
                  Islam, bebas dari riba dan gharar.
                </p>
              </div>

              <div className="text-center p-8 bg-green-50 rounded-xl hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-green-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Aman dan Terpercaya
                </h3>
                <p className="text-gray-600">
                  Dikelola oleh tim profesional yang berpengalaman dan
                  terpercaya dalam industri keuangan syariah.
                </p>
              </div>

              <div className="text-center p-8 bg-purple-50 rounded-xl hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Bunga Nol Persen
                </h3>
                <p className="text-gray-600">
                  Kami menerapkan sistem bagi hasil yang adil dan transparan,
                  tanpa bunga sesuai dengan prinsip syariah.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Simpanan Section */}
        <section id="simpanan" className="scroll-mt-18 py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                PRODUK SIMPANAN BMT FATHHUL BAROKAH
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Kami menyediakan berbagai produk simpanan syariah untuk memenuhi kebutuhan finansial Anda
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* SIBAROKAH */}
              <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                <div className="h-2 bg-blue-600"></div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Simpanan Barokah (SIBAROKAH)</h3>
                  <p className="text-gray-700 mb-3">Simpanan dari anggota maupun non anggota BMT dengan prinsip wadiah atau akad qordh. Penarikan dapat dilakukan setiap saat.</p>
                  <div className="mt-4 bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-blue-800">Setoran awal: Rp 50.000</p>
                    <p className="text-sm font-medium text-blue-800">Setoran selanjutnya: min. Rp 10.000</p>
                  </div>
                </div>
              </div>

              {/* SIMUROJA */}
              <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                <div className="h-2 bg-green-600"></div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Simpanan Mudhorobah Berjangka (SIMUROJA)</h3>
                  <p className="text-gray-700 mb-3">Simpanan dengan prinsip Mudharabah dengan jangka waktu yang telah disepakati. Pemilik simpanan akan mendapatkan bagi hasil.</p>
                  <div className="mt-4 bg-green-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-green-800">Jangka waktu: 3, 6, dan 12 bulan</p>
                    <p className="text-sm font-medium text-green-800">Setoran minimal: Rp 100.000</p>
                  </div>
                </div>
              </div>

              {/* SIDIKA */}
              <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                <div className="h-2 bg-purple-600"></div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Simpanan Pendidikan (SIDIKA)</h3>
                  <p className="text-gray-700 mb-3">Simpanan yang dialokasikan bagi dana pendidikan. Penarikan dapat dilakukan dua kali dalam satu tahun pembayaran awal semester.</p>
                  <div className="mt-4 bg-purple-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-purple-800">Setoran awal: Rp 100.000</p>
                    <p className="text-sm font-medium text-purple-800">Setoran selanjutnya: min. Rp 10.000</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Show More Button */}
            <div className="mt-10 text-center">
              <button 
                onClick={() => {
                  const hiddenProducts = document.getElementById('hidden-simpanan-products');
                  const showMoreBtn = document.getElementById('show-more-btn');
                  const showLessBtn = document.getElementById('show-less-btn');
                  
                  if (hiddenProducts && showMoreBtn && showLessBtn) {
                    hiddenProducts.classList.toggle('hidden');
                    showMoreBtn.classList.toggle('hidden');
                    showLessBtn.classList.toggle('hidden');
                  }
                }}
                id="show-more-btn"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors duration-300 inline-flex items-center gap-2"
              >
                <span>Lihat Produk Lainnya</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            {/* Hidden Products */}
            <div id="hidden-simpanan-products" className="hidden mt-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* SIFITRI */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                  <div className="h-2 bg-yellow-600"></div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Simpanan Idul Fitri (SIFITRI)</h3>
                    <p className="text-gray-700 mb-3">Simpanan yang diperuntukkan untuk keperluan lebaran. Penarikan dilakukan satu kali menjelang Idul Fitri (25 hari sebelum Idul Fitri).</p>
                    <div className="mt-4 bg-yellow-50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-yellow-800">Setoran awal: Rp 100.000</p>
                      <p className="text-sm font-medium text-yellow-800">Setoran selanjutnya: min. Rp 10.000</p>
                    </div>
                  </div>
                </div>

                {/* SIQURBAN */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                  <div className="h-2 bg-red-600"></div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Simpanan Qurban (SIQURBAN)</h3>
                    <p className="text-gray-700 mb-3">Simpanan yang diperuntukkan untuk keperluan ibadah qurban. Penarikan dilakukan satu kali menjelang Idul Adha (25 hari sebelum Idul Adha).</p>
                    <div className="mt-4 bg-red-50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-red-800">Setoran awal: Rp 100.000</p>
                      <p className="text-sm font-medium text-red-800">Setoran selanjutnya: min. Rp 10.000</p>
                    </div>
                  </div>
                </div>

                {/* SINIKA */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                  <div className="h-2 bg-pink-600"></div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Simpanan Nikah (SINIKA)</h3>
                    <p className="text-gray-700 mb-3">Simpanan yang diperuntukkan bagi mereka yang merencanakan pernikahan. Penarikan dilakukan satu kali pada saat bulan pernikahan.</p>
                    <div className="mt-4 bg-pink-50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-pink-800">Setoran awal: Rp 100.000</p>
                      <p className="text-sm font-medium text-pink-800">Setoran selanjutnya: min. Rp 10.000</p>
                    </div>
                  </div>
                </div>

                {/* SIMUROH */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                  <div className="h-2 bg-indigo-600"></div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Simpanan Umroh (SIMUROH)</h3>
                    <p className="text-gray-700 mb-3">Simpanan yang diperuntukkan bagi mereka yang ingin berangkat umroh. Penarikan dilakukan saat simpanan sudah memenuhi syarat untuk umroh.</p>
                    <div className="mt-4 bg-indigo-50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-indigo-800">Setoran awal: Rp 100.000</p>
                      <p className="text-sm font-medium text-indigo-800">Setoran selanjutnya: min. Rp 10.000</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Show Less Button */}
              <div className="mt-10 text-center">
                <button 
                  onClick={() => {
                    const hiddenProducts = document.getElementById('hidden-simpanan-products');
                    const showMoreBtn = document.getElementById('show-more-btn');
                    const showLessBtn = document.getElementById('show-less-btn');
                    
                    if (hiddenProducts && showMoreBtn && showLessBtn) {
                      hiddenProducts.classList.toggle('hidden');
                      showMoreBtn.classList.toggle('hidden');
                      showLessBtn.classList.toggle('hidden');
                    }
                  }}
                  id="show-less-btn"
                  className="hidden px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition-colors duration-300 inline-flex items-center gap-2"
                >
                  <span>Tampilkan Lebih Sedikit</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </section>
        


        {/* Pembiayaan Section */}
        <section id="pembiayaan" className="scroll-mt-18 py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                PRODUK PEMBIAYAAN BMT FATHHUL BAROKAH
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Solusi pembiayaan syariah untuk berbagai kebutuhan Anda
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Pembiayaan Konsumtif */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:translate-y-[-5px]">
                <div className="h-3 bg-blue-600"></div>
                <div className="p-8">
                  <div className="w-16 h-16 bg-blue-600 rounded-full mb-6 flex items-center justify-center">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Pembiayaan Konsumtif Syariah</h3>
                  <p className="text-gray-700 mb-4">
                    Merupakan solusi pembiayaan terhadap produk kebutuhan konsumtif masyarakat dan mendukung aktivitas sehari-hari.
                  </p>
                  <p className="text-gray-700 mb-4">
                    Pembiayaan konsumtif ini dilakukan berdasarkan akad ijarah, murabahah, dan lain-lain.
                  </p>
                  <div className="mt-6 bg-white p-4 rounded-lg border border-blue-200">
                    <p className="text-gray-800 font-medium">Contoh:</p>
                    <p className="text-gray-700">Pembiayaan alat elektronik, kendaraan bermotor, alat rumah tangga, dll.</p>
                  </div>
                </div>
              </div>

              {/* Pembiayaan Investasi */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:translate-y-[-5px]">
                <div className="h-3 bg-green-600"></div>
                <div className="p-8">
                  <div className="w-16 h-16 bg-green-600 rounded-full mb-6 flex items-center justify-center">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Pembiayaan Investasi Syariah</h3>
                  <p className="text-gray-700 mb-4">
                    Merupakan solusi syariah untuk penguatan modal usaha atau sarana produksi lainnya sesuai dengan prinsip syariah.
                  </p>
                  <p className="text-gray-700 mb-4">
                    Pembiayaan investasi ini menggunakan akad ijarah, murabahah, mudharabah, dll.
                  </p>
                  <div className="mt-6 bg-white p-4 rounded-lg border border-green-200">
                    <p className="text-gray-800 font-medium">Contoh:</p>
                    <p className="text-gray-700">Pembiayaan investasi syariah untuk usaha, peralatan usaha, modal usaha dan hal-hal lain.</p>
                  </div>
                </div>
              </div>

              {/* Pembiayaan Modal Kerja */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:translate-y-[-5px]">
                <div className="h-3 bg-purple-600"></div>
                <div className="p-8">
                  <div className="w-16 h-16 bg-purple-600 rounded-full mb-6 flex items-center justify-center">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Pembiayaan Modal Kerja Syariah</h3>
                  <p className="text-gray-700 mb-4">
                    Pembiayaan modal kerja syariah yang merupakan kebutuhan usaha jangka pendek dalam bentuk pembiayaan kas usaha (working capital) yang habis dalam satu siklus usaha.
                  </p>
                  <p className="text-gray-700 mb-4">
                    Pembiayaan ini dapat digunakan oleh pelaku usaha dalam rangka peningkatan modal kerja lainnya dengan menggunakan akad murabahah.
                  </p>
                  <div className="mt-6 bg-white p-4 rounded-lg border border-purple-200">
                    <p className="text-gray-800 font-medium">Keunggulan:</p>
                    <p className="text-gray-700">Proses cepat, persyaratan mudah, dan sesuai dengan prinsip syariah.</p>
                  </div>
                </div>
              </div>
            </div>


          </div>
        </section>

        {/* Contact Section */}
        <section
          id="kontak"
          className="scroll-mt-24 py-20 bg-blue-900 text-white"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">Hubungi Kami</h2>
              <p className="text-xl text-blue-100">
                Jika Anda memiliki pertanyaan atau membutuhkan informasi lebih
                lanjut, jangan ragu untuk menghubungi kami.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg
                    className="w-8 h-8"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Alamat</h3>
                <p className="text-blue-100">
                  Jl. Madrasah I No.26, RT.10/RW.1, Gandaria Sel., Kec.
                  Cilandak, Kota Jakarta Selatan, Daerah Khusus
                  Ibukota Jakarta 12420
                </p>
              </div>

              {/* Jam Operasional */}
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg
                    className="w-8 h-8"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Jam Operasional</h3>
                <p className="text-blue-100">Senin - Jumat: 09.00 - 15.00</p>
              </div>

              {/* Email */}
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                  {/* Icon email */}
                  <svg
                    className="w-8 h-8"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M2.94 6.33A2 2 0 0 1 4.82 5h10.36a2 2 0 0 1 1.89 1.33L10 12.08 2.94 6.33zM2 8v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-7.31 5.48a1 1 0 0 1-1.38 0L2 8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Email</h3>
                <p className="text-blue-100">
                    <a
                      href="mailto:bmtfathhulbarokah.id@gmail.com"
                      className="no-underline focus:outline-none active:text-white transition duration-150"
                      style={{ WebkitTapHighlightColor: "transparent" }} // menghilangkan efek biru pada tap di mobile
                      onTouchStart={(e) => (e.currentTarget.style.color = "#fff")}
                      onTouchEnd={(e) => (e.currentTarget.style.color = "")}
                    >
                      bmtfathhulbarokah.id@gmail.com
                    </a>
                </p>
              </div>

              {/* Telepon */}
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg
                    className="w-8 h-8"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Telepon</h3>
                <div className="text-blue-100 space-y-1">
                  <p>
                    <span className="font-medium">Sdr. Dawud Setianto: </span>
                    <a href="tel:+6281349768716" className="hover:text-white transition-colors duration-200">
                      0813-4976-8716
                    </a>
                  </p>
                  <p>
                    <span className="font-medium">Ustadz Ahmad Nuruddin: </span>
                    <a href="tel:+6285931250059" className="hover:text-white transition-colors duration-200">
                      0859-3125-0059
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
