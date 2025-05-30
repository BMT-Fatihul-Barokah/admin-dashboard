'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Image from 'next/image';
import { FaAndroid, FaApple, FaDownload } from 'react-icons/fa';

export default function DownloadPage() {
  const handleDownload = () => {
    // Replace this URL with your actual APK file URL on the server
    const apkUrl = '/api/download/app.apk';
    window.location.href = apkUrl;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Download Our Mobile App
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Get access to our powerful mobile application and manage your account on the go
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-center max-w-6xl mx-auto">
          <div className="order-2 md:order-1">
            <Card className="bg-gray-800 border-gray-700 p-8">
              <div className="space-y-6">
                <div className="flex items-center space-x-4 text-green-400">
                  <FaAndroid className="text-3xl" />
                  <div>
                    <h3 className="text-xl font-semibold">Android App</h3>
                    <p className="text-gray-400">Version 1.0.0 (64 MB)</p>
                  </div>
                </div>
                
                <Button 
                  size="lg" 
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={handleDownload}
                >
                  <FaDownload className="mr-2" />
                  Download APK
                </Button>

                <div className="text-sm text-gray-400">
                  <p>Supported Android version: 6.0 and above</p>
                  <p>Last updated: May 30, 2025</p>
                </div>
              </div>
            </Card>

            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4">Coming Soon</h3>
              <Card className="bg-gray-800 border-gray-700 p-8">
                <div className="flex items-center space-x-4 text-gray-400">
                  <FaApple className="text-3xl" />
                  <div>
                    <h3 className="text-xl font-semibold">iOS App</h3>
                    <p>Available soon on the App Store</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          <div className="order-1 md:order-2">
            <div className="relative h-[600px]">
              <Image
                src="/app-preview.png"
                alt="Mobile App Preview"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
