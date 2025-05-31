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
import { MobileMenu } from "@/components/mobile-menu";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
});
import { useRouter } from "next/navigation";
import React, { useState } from "react";
// Toast functionality removed to avoid dependency issues

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

  // Function untuk tutorial toast - simplified version without toast library
  const showTutorialToast = () => {
    // Open in a new window/tab instead of using toast
    window.open('https://expo.dev/accounts/bmtfatihulbarokah/projects/koperasi-fatihul-barokah-mobile-apps/builds/d5a38dec-57d9-4531-a67b-df93d136bf1e', '_blank');
  };
  return (
    <div className="min-h-screen bg-gray-50">
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
                href="#pinjaman"
                className="text-gray-700 hover:text-blue-600 font-medium px-3 py-2 rounded-lg transition-colors hover:bg-blue-50"
              >
                Pinjaman
              </a>
              <a
                href="/admin/login"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-lg font-medium"
              >
                Admin Login
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
                    href="#pinjaman"
                    className="block py-2 text-gray-700 hover:text-blue-600"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Pinjaman
                  </a>
                  <a
                    href="/admin/login"
                    className="block py-2 bg-blue-600 text-white px-4 rounded text-center"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Admin Login
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
                    Bergabung Sekarang
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
                    <div className="text-3xl font-bold">100+</div>
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

        {/* Tentang Kami Section */}
        <section id="tentang" className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Tentang Kami
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                BMT Fatihul Barokah adalah lembaga keuangan mikro syariah yang
                berkomitmen untuk memberikan layanan keuangan terbaik bagi
                masyarakat.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Visi */}
              <div className="bg-blue-50 rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow">
                <div className="w-16 h-16 bg-blue-600 rounded-full mb-6 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Visi</h3>
                <p className="text-gray-600">
                  Menjadi lembaga keuangan syariah terkemuka yang memberikan
                  solusi keuangan terbaik bagi masyarakat dengan prinsip syariah
                  yang kuat.
                </p>
              </div>

              {/* Misi */}
              <div className="bg-blue-50 rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow">
                <div className="w-16 h-16 bg-blue-600 rounded-full mb-6 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Misi</h3>
                <p className="text-gray-600">
                  Memberikan layanan keuangan yang inovatif, terjangkau, dan
                  sesuai dengan prinsip syariah untuk mendukung pertumbuhan
                  ekonomi masyarakat.
                </p>
              </div>

              {/* Nilai */}
              <div className="bg-blue-50 rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow">
                <div className="w-16 h-16 bg-blue-600 rounded-full mb-6 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Nilai</h3>
                <p className="text-gray-600">
                  Integritas, profesionalisme, inovasi, dan kepedulian terhadap
                  kesejahteraan masyarakat menjadi nilai-nilai utama yang kami
                  junjung tinggi.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Layanan Section */}
        <section id="layanan" className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Layanan Kami
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Kami menyediakan berbagai layanan keuangan syariah untuk memenuhi
                kebutuhan Anda.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Simpanan */}
              <Card className="hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-full mb-4 flex items-center justify-center">
                    <PiggyBank className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Simpanan
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Berbagai produk simpanan dengan bagi hasil yang kompetitif
                    dan sesuai syariah.
                  </p>
                  <a
                    href="#simpanan"
                    className="text-blue-600 font-medium flex items-center hover:text-blue-800 transition-colors"
                  >
                    Selengkapnya <ChevronRight className="w-4 h-4 ml-1" />
                  </a>
                </CardContent>
              </Card>

              {/* Pembiayaan */}
              <Card className="hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-full mb-4 flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Pembiayaan
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Solusi pembiayaan untuk kebutuhan usaha, pendidikan, dan
                    kebutuhan lainnya.
                  </p>
                  <a
                    href="#pinjaman"
                    className="text-blue-600 font-medium flex items-center hover:text-blue-800 transition-colors"
                  >
                    Selengkapnya <ChevronRight className="w-4 h-4 ml-1" />
                  </a>
                </CardContent>
              </Card>

              {/* Pembayaran */}
              <Card className="hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-full mb-4 flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Pembayaran
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Layanan pembayaran tagihan, pulsa, dan berbagai kebutuhan
                    lainnya.
                  </p>
                  <a
                    href="#"
                    className="text-blue-600 font-medium flex items-center hover:text-blue-800 transition-colors"
                  >
                    Selengkapnya <ChevronRight className="w-4 h-4 ml-1" />
                  </a>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Simpanan Section */}
        <section id="simpanan" className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Produk Simpanan
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Pilih produk simpanan yang sesuai dengan kebutuhan Anda.
              </p>
            </div>

            <div className="space-y-6">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">
                    Simpanan Pokok
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600">
                    <p>
                      Simpanan yang harus dibayarkan oleh setiap anggota saat
                      pertama kali bergabung. Simpanan ini tidak dapat diambil
                      selama masih menjadi anggota.
                    </p>
                    <div className="mt-4 bg-blue-50 p-4 rounded-lg">
                      <p className="font-medium">Ketentuan:</p>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Setoran awal: Rp 100.000</li>
                        <li>Tidak dapat diambil selama masih menjadi anggota</li>
                        <li>Tidak dikenakan biaya administrasi</li>
                      </ul>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2">
                  <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">
                    Simpanan Wajib
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600">
                    <p>
                      Simpanan yang wajib dibayarkan oleh setiap anggota secara
                      berkala. Simpanan ini tidak dapat diambil selama masih
                      menjadi anggota.
                    </p>
                    <div className="mt-4 bg-blue-50 p-4 rounded-lg">
                      <p className="font-medium">Ketentuan:</p>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Setoran bulanan: Rp 50.000</li>
                        <li>Tidak dapat diambil selama masih menjadi anggota</li>
                        <li>Tidak dikenakan biaya administrasi</li>
                      </ul>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3">
                  <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">
                    Simpanan Sukarela
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600">
                    <p>
                      Simpanan yang dapat disetor dan diambil kapan saja sesuai
                      kebutuhan anggota. Simpanan ini mendapatkan bagi hasil
                      sesuai dengan kebijakan BMT.
                    </p>
                    <div className="mt-4 bg-blue-50 p-4 rounded-lg">
                      <p className="font-medium">Ketentuan:</p>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Setoran awal minimal: Rp 50.000</li>
                        <li>Setoran selanjutnya minimal: Rp 10.000</li>
                        <li>Dapat diambil kapan saja</li>
                        <li>Bagi hasil kompetitif</li>
                      </ul>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4">
                  <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">
                    Simpanan Berjangka
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600">
                    <p>
                      Simpanan dengan jangka waktu tertentu yang memberikan bagi
                      hasil lebih tinggi. Simpanan ini hanya dapat diambil sesuai
                      dengan jangka waktu yang telah disepakati.
                    </p>
                    <div className="mt-4 bg-blue-50 p-4 rounded-lg">
                      <p className="font-medium">Ketentuan:</p>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Setoran minimal: Rp 1.000.000</li>
                        <li>Jangka waktu: 3, 6, 12 bulan</li>
                        <li>Bagi hasil lebih tinggi</li>
                        <li>
                          Pencairan sebelum jatuh tempo dikenakan biaya
                          administrasi
                        </li>
                      </ul>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </section>

        {/* Pinjaman Section */}
        <section id="pinjaman" className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Produk Pembiayaan
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Solusi pembiayaan syariah untuk berbagai kebutuhan Anda.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Murabahah */}
              <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-blue-100">
                <div className="w-16 h-16 bg-blue-600 rounded-full mb-6 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Pembiayaan Murabahah
                </h3>
                <p className="text-gray-600 mb-4">
                  Pembiayaan dengan akad jual beli dimana BMT membeli barang yang
                  dibutuhkan anggota dan menjualnya kepada anggota dengan harga
                  pokok ditambah margin yang disepakati.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                    <span className="text-gray-700">Margin kompetitif</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                    <span className="text-gray-700">Angsuran tetap</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                    <span className="text-gray-700">Proses cepat</span>
                  </div>
                </div>
              </div>

              {/* Mudharabah */}
              <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-blue-100">
                <div className="w-16 h-16 bg-blue-600 rounded-full mb-6 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Pembiayaan Mudharabah
                </h3>
                <p className="text-gray-600 mb-4">
                  Pembiayaan dengan akad kerjasama usaha dimana BMT menyediakan
                  modal dan anggota sebagai pengelola usaha dengan pembagian
                  keuntungan sesuai nisbah yang disepakati.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                    <span className="text-gray-700">Bagi hasil sesuai usaha</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                    <span className="text-gray-700">Modal usaha 100%</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                    <span className="text-gray-700">Pendampingan usaha</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Kontak Section */}
        <section id="kontak" className="py-20 bg-blue-900 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Hubungi Kami
              </h2>
              <p className="text-lg text-blue-100 max-w-3xl mx-auto">
                Jangan ragu untuk menghubungi kami jika Anda memiliki pertanyaan
                atau ingin bergabung.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              {/* Alamat */}
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
                  Jl. Raya Sukorejo No.123, Desa Sukorejo, Kecamatan Sukorejo,
                  Kabupaten Pasuruan, Jawa Timur
                </p>
              </div>

              {/* Email */}
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg
                    className="w-8 h-8"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Email</h3>
                <p className="text-blue-100">
                  <a
                    href="mailto:fatihulbarokah.bmt@gmail.com"
                    className="no-underline focus:outline-none active:text-white transition duration-150"
                    style={{ WebkitTapHighlightColor: "transparent" }}
                    onTouchStart={(e) => (e.currentTarget.style.color = "#fff")}
                    onTouchEnd={(e) => (e.currentTarget.style.color = "")}
                  >
                    fatihulbarokah.bmt@gmail.com
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
                <p className="text-blue-100">+62 858 1925 0059</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
