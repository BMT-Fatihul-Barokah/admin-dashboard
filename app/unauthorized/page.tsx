"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/lib/admin-auth-context";
import { useEffect } from "react";

export default function UnauthorizedPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAdminAuth();

  useEffect(() => {
    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center">
            <ShieldAlert className="h-12 w-12 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-bold">Akses Ditolak</CardTitle>
          <CardDescription>
            Anda tidak memiliki izin untuk mengakses halaman ini
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center mb-4">
            <p className="text-muted-foreground">
              Peran Anda sebagai <span className="font-semibold">{user?.role || "pengguna"}</span> tidak memiliki akses ke fitur ini.
              Silakan hubungi administrator jika Anda memerlukan akses.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button onClick={() => router.push("/")}>Kembali ke Dashboard</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
