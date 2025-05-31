'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Image from 'next/image';
import { FaAndroid, FaApple, FaDownload } from 'react-icons/fa';

export default function DownloadPage() {
  const handleDownload = () => {
    // Redirect to the Expo build URL
    const expoUrl = 'https://expo.dev/accounts/bmtfatihulbarokah/projects/koperasi-fatihul-barokah-mobile-apps/builds/d5a38dec-57d9-4531-a67b-df93d136bf1e';
    window.open(expoUrl, '_blank');
  };

  const handleIOSDownload = () => {
    // Redirect to the iOS Expo build URL
    const iosExpoUrl = 'https://expo.dev/accounts/test02/projects/koperasi-fatihul-barokah-mobile-apps/builds/f22f2a63-9259-4391-9fbd-39c26ee54c98';
    window.open(iosExpoUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Unduh Aplikasi Mobile Kami
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Akses layanan kami melalui aplikasi mobile dan kelola akun Anda di mana saja
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-center max-w-6xl mx-auto">
          <div className="order-2 md:order-1">
            <Card className="bg-gray-800 border-gray-700 p-8">
              <div className="space-y-6">
                <div className="flex items-center space-x-4 text-green-400">
                  <FaAndroid className="text-3xl" />
                  <div>
                    <h3 className="text-xl font-semibold">Aplikasi Android</h3>
                    <p className="text-gray-400">Versi 1.0.0 (64 MB)</p>
                  </div>
                </div>
                
                <Button 
                  size="lg" 
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={handleDownload}
                >
                  <FaDownload className="mr-2" />
                  Unduh dari Expo
                </Button>

                <div className="text-sm text-gray-400">
                  <p>Mendukung Android versi: 6.0 ke atas</p>
                  <p>Terakhir diperbarui: 30 Mei 2025</p>
                </div>
              </div>
            </Card>

            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4">Aplikasi iOS</h3>
              <Card className="bg-gray-800 border-gray-700 p-8">
                <div className="flex items-center space-x-4 text-blue-400">
                  <FaApple className="text-3xl" />
                  <div>
                    <h3 className="text-xl font-semibold">Aplikasi iOS</h3>
                    <p className="text-gray-400">Versi 1.0.0 (58 MB)</p>
                  </div>
                </div>
                
                <Button 
                  size="lg" 
                  className="w-full bg-blue-600 hover:bg-blue-700 mt-6"
                  onClick={handleIOSDownload}
                >
                  <FaDownload className="mr-2" />
                  Unduh dari Expo
                </Button>
                
                <div className="text-sm text-gray-400 mt-4">
                  <p>Mendukung iOS versi: 13.0 ke atas</p>
                  <p>Terakhir diperbarui: 30 Mei 2025</p>
                </div>
              </Card>
            </div>
          </div>

          <div className="order-1 md:order-2 flex items-center justify-center">
            <div className="bg-[#007BFF] rounded-3xl shadow-2xl p-6 w-[280px] h-[280px] flex items-center justify-center">
              <div className="relative w-[200px] h-[200px]">
                <Image
                  src="/app-preview.png"
                  alt="Mobile App Icon"
                  fill
                  className="object-contain scale-150 ml-2 mt-1"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
