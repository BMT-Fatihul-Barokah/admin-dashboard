"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { BarChart3, Users, CreditCard, Wallet, UserPlus, FileText, Settings, Plus } from "lucide-react";
import Link from "next/link";
import { useAdminAuth } from "@/lib/admin-auth-context";

export function AdminDashboard() {
  const { user } = useAdminAuth();

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard Admin</h2>
        <div className="flex items-center space-x-2">
          <Link href="/role-management">
            <Button>
              <Settings className="mr-2 h-4 w-4" />
              Kelola Peran
            </Button>
          </Link>
        </div>
      </div>
      
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Ikhtisar</TabsTrigger>
          <TabsTrigger value="analytics">Analitik</TabsTrigger>
          <TabsTrigger value="reports">Laporan</TabsTrigger>
          <TabsTrigger value="notifications">Notifikasi</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Nasabah</CardTitle>
                <Users className="h-4 w-4 text-white" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">245</div>
                <p className="text-xs text-blue-100">+12% dari bulan lalu</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Transaksi Bulan Ini</CardTitle>
                <CreditCard className="h-4 w-4 text-white" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Rp 45.6 Juta</div>
                <p className="text-xs text-green-100">+18% dari bulan lalu</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pinjaman Aktif</CardTitle>
                <Wallet className="h-4 w-4 text-white" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">78</div>
                <p className="text-xs text-purple-100">+5% dari bulan lalu</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pendaftaran Baru</CardTitle>
                <UserPlus className="h-4 w-4 text-white" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">15</div>
                <p className="text-xs text-amber-100">Menunggu persetujuan</p>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Aktivitas Terbaru</CardTitle>
                <CardDescription>
                  Aktivitas sistem dalam 24 jam terakhir
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center">
                      <div className="mr-2 h-2 w-2 rounded-full bg-sky-500" />
                      <div className="flex-1">
                        <p className="text-sm font-medium leading-none">
                          {["Transaksi baru", "Nasabah baru disetujui", "Pinjaman disetujui", "Pembayaran diterima", "Laporan bulanan dibuat"][i - 1]}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {`${i} jam yang lalu`}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm">
                        Lihat
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Aksi Cepat</CardTitle>
                <CardDescription>
                  Akses cepat ke fitur utama
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2">
                <Link href="/approvals">
                  <Button className="w-full justify-start" variant="outline">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Persetujuan Nasabah
                  </Button>
                </Link>
                <Link href="/loans">
                  <Button className="w-full justify-start" variant="outline">
                    <Wallet className="mr-2 h-4 w-4" />
                    Kelola Pinjaman
                  </Button>
                </Link>
                <Link href="/transactions">
                  <Button className="w-full justify-start" variant="outline">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Transaksi Baru
                  </Button>
                </Link>
                <Link href="/reports">
                  <Button className="w-full justify-start" variant="outline">
                    <FileText className="mr-2 h-4 w-4" />
                    Buat Laporan
                  </Button>
                </Link>
                <Link href="/import">
                  <Button className="w-full justify-start" variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Import Data
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analitik</CardTitle>
              <CardDescription>
                Grafik dan statistik kinerja koperasi
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px] flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">Grafik Analitik</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Visualisasi data transaksi, pinjaman, dan pertumbuhan anggota
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Laporan</CardTitle>
              <CardDescription>
                Laporan keuangan dan operasional
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px] flex items-center justify-center">
              <div className="text-center">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">Laporan Keuangan</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Laporan bulanan, triwulanan, dan tahunan
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notifikasi</CardTitle>
              <CardDescription>
                Pemberitahuan dan pengumuman sistem
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-start gap-4 rounded-lg border p-4">
                    <div className={`mt-0.5 rounded-full p-1 ${i % 2 === 0 ? 'bg-blue-100' : 'bg-amber-100'}`}>
                      {i % 2 === 0 ? (
                        <CreditCard className={`h-4 w-4 ${i % 2 === 0 ? 'text-blue-600' : 'text-amber-600'}`} />
                      ) : (
                        <UserPlus className={`h-4 w-4 ${i % 2 === 0 ? 'text-blue-600' : 'text-amber-600'}`} />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium">
                        {i % 2 === 0 ? 'Transaksi Baru' : 'Pendaftaran Nasabah Baru'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {i % 2 === 0 
                          ? 'Transaksi baru telah dibuat dan menunggu verifikasi' 
                          : 'Nasabah baru telah mendaftar dan menunggu persetujuan'}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {`${i * 10} menit yang lalu`}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm">
                      Tandai Dibaca
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
