'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

// This component handles global errors during build
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center">Terjadi Kesalahan</CardTitle>
              <CardDescription className="text-center">
                Maaf, terjadi kesalahan saat memuat halaman.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-6xl font-bold mb-4">Error</div>
              <p className="text-muted-foreground mb-4">
                Harap coba lagi atau kembali ke halaman utama.
              </p>
              <div className="flex justify-center gap-4">
                <Button onClick={() => reset()}>Coba Lagi</Button>
                <Button variant="outline" asChild>
                  <Link href="/">Kembali ke Beranda</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </body>
    </html>
  );
}
