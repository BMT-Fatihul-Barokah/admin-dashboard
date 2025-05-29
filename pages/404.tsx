import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function Custom404() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Halaman Tidak Ditemukan</CardTitle>
          <CardDescription className="text-center">
            Maaf, kami tidak dapat menemukan halaman yang Anda cari.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <div className="text-6xl font-bold mb-4">404</div>
          <p className="text-muted-foreground">
            URL yang Anda akses tidak valid atau telah dihapus.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button asChild>
            <Link href="/">Kembali ke Beranda</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
