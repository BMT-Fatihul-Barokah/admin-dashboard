"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { BarChart3, Users, CreditCard, Wallet, UserPlus, FileText, Eye, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useAdminAuth } from "@/lib/admin-auth-context";

export function KetuaDashboard() {
  const { user } = useAdminAuth();

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard Ketua</h2>
        <div className="flex items-center space-x-2">
          <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
            Mode Pengawasan
          </div>
        </div>
      </div>
      
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Ikhtisar</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          <TabsTrigger value="reports">Laporan</TabsTrigger>
          <TabsTrigger value="alerts">Peringatan</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-gradient-to-br from-blue-400 to-blue-500 text-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Nasabah</CardTitle>
                <Users className="h-4 w-4 text-white" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">245</div>
                <p className="text-xs text-blue-100">+12% dari bulan lalu</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-indigo-400 to-indigo-500 text-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Transaksi Bulan Ini</CardTitle>
                <CreditCard className="h-4 w-4 text-white" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Rp 45.6 Juta</div>
                <p className="text-xs text-indigo-100">+18% dari bulan lalu</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-teal-400 to-teal-500 text-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pinjaman Aktif</CardTitle>
                <Wallet className="h-4 w-4 text-white" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">78</div>
                <p className="text-xs text-teal-100">+5% dari bulan lalu</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-amber-400 to-amber-500 text-white">
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
                <CardTitle>Ringkasan Kinerja</CardTitle>
                <CardDescription>
                  Ringkasan kinerja koperasi bulan ini
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Pendapatan</p>
                      <p className="text-2xl font-bold">Rp 78.5 Juta</p>
                      <div className="flex items-center text-sm text-green-600">
                        <span className="font-medium">+12%</span>
                        <span className="ml-1">dari target</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Pengeluaran</p>
                      <p className="text-2xl font-bold">Rp 32.8 Juta</p>
                      <div className="flex items-center text-sm text-green-600">
                        <span className="font-medium">-5%</span>
                        <span className="ml-1">dari anggaran</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Pinjaman Baru</p>
                      <p className="text-2xl font-bold">Rp 124 Juta</p>
                      <div className="flex items-center text-sm text-amber-600">
                        <span className="font-medium">+8%</span>
                        <span className="ml-1">dari bulan lalu</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Anggota Baru</p>
                      <p className="text-2xl font-bold">24</p>
                      <div className="flex items-center text-sm text-green-600">
                        <span className="font-medium">+20%</span>
                        <span className="ml-1">dari target</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Monitoring Cepat</CardTitle>
                <CardDescription>
                  Akses cepat ke fitur monitoring
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2">
                <Link href="/approvals">
                  <Button className="w-full justify-start" variant="outline">
                    <Eye className="mr-2 h-4 w-4" />
                    Lihat Persetujuan Nasabah
                  </Button>
                </Link>
                <Link href="/loans">
                  <Button className="w-full justify-start" variant="outline">
                    <Eye className="mr-2 h-4 w-4" />
                    Lihat Pinjaman
                  </Button>
                </Link>
                <Link href="/transactions">
                  <Button className="w-full justify-start" variant="outline">
                    <Eye className="mr-2 h-4 w-4" />
                    Lihat Transaksi
                  </Button>
                </Link>
                <Link href="/reports">
                  <Button className="w-full justify-start" variant="outline">
                    <FileText className="mr-2 h-4 w-4" />
                    Lihat Laporan
                  </Button>
                </Link>
                <Link href="/users">
                  <Button className="w-full justify-start" variant="outline">
                    <Users className="mr-2 h-4 w-4" />
                    Lihat Anggota
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="monitoring" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monitoring Aktivitas</CardTitle>
              <CardDescription>
                Aktivitas sistem dalam 24 jam terakhir
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-start gap-4 rounded-lg border p-4">
                    <div className="mt-0.5 rounded-full p-1 bg-blue-100">
                      <Eye className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium">
                        {["Transaksi baru dibuat", "Nasabah baru disetujui", "Pinjaman disetujui", "Pembayaran diterima", "Laporan bulanan dibuat"][i - 1]}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {`Dilakukan oleh: ${["Admin", "Sekretaris", "Admin", "Bendahara", "Bendahara"][i - 1]}`}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {`${i} jam yang lalu`}
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Lihat Detail
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Laporan Keuangan</CardTitle>
              <CardDescription>
                Laporan keuangan dan operasional
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <div className="space-y-4">
                <div className="rounded-lg border p-4">
                  <h3 className="text-lg font-medium">Laporan Bulanan April 2025</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Ringkasan keuangan dan operasional bulan April 2025
                  </p>
                  <div className="mt-4 flex gap-2">
                    <Button variant="outline" size="sm">
                      <Eye className="mr-2 h-4 w-4" />
                      Lihat Laporan
                    </Button>
                    <Button variant="outline" size="sm">
                      <FileText className="mr-2 h-4 w-4" />
                      Unduh PDF
                    </Button>
                  </div>
                </div>
                
                <div className="rounded-lg border p-4">
                  <h3 className="text-lg font-medium">Laporan Triwulan I 2025</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Ringkasan keuangan dan operasional triwulan pertama 2025
                  </p>
                  <div className="mt-4 flex gap-2">
                    <Button variant="outline" size="sm">
                      <Eye className="mr-2 h-4 w-4" />
                      Lihat Laporan
                    </Button>
                    <Button variant="outline" size="sm">
                      <FileText className="mr-2 h-4 w-4" />
                      Unduh PDF
                    </Button>
                  </div>
                </div>
                
                <div className="rounded-lg border p-4">
                  <h3 className="text-lg font-medium">Laporan Tahunan 2024</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Ringkasan keuangan dan operasional tahun 2024
                  </p>
                  <div className="mt-4 flex gap-2">
                    <Button variant="outline" size="sm">
                      <Eye className="mr-2 h-4 w-4" />
                      Lihat Laporan
                    </Button>
                    <Button variant="outline" size="sm">
                      <FileText className="mr-2 h-4 w-4" />
                      Unduh PDF
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Peringatan Sistem</CardTitle>
              <CardDescription>
                Peringatan dan notifikasi penting
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <div className="space-y-4">
                <div className="flex items-start gap-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <div className="mt-0.5 rounded-full p-1 bg-amber-100">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-amber-800">
                      5 Pinjaman Melewati Tenggat Pembayaran
                    </h3>
                    <p className="text-sm text-amber-700 mt-1">
                      Terdapat 5 pinjaman yang melewati tenggat pembayaran lebih dari 30 hari
                    </p>
                    <p className="mt-1 text-xs text-amber-600">
                      2 jam yang lalu
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="border-amber-200 bg-amber-100 hover:bg-amber-200 text-amber-800">
                    Lihat Detail
                  </Button>
                </div>
                
                <div className="flex items-start gap-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <div className="mt-0.5 rounded-full p-1 bg-blue-100">
                    <AlertTriangle className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-blue-800">
                      Persetujuan Nasabah Menunggu
                    </h3>
                    <p className="text-sm text-blue-700 mt-1">
                      Terdapat 15 pendaftaran nasabah baru yang menunggu persetujuan
                    </p>
                    <p className="mt-1 text-xs text-blue-600">
                      5 jam yang lalu
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="border-blue-200 bg-blue-100 hover:bg-blue-200 text-blue-800">
                    Lihat Detail
                  </Button>
                </div>
                
                <div className="flex items-start gap-4 rounded-lg border border-green-200 bg-green-50 p-4">
                  <div className="mt-0.5 rounded-full p-1 bg-green-100">
                    <AlertTriangle className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-green-800">
                      Target Pendapatan Tercapai
                    </h3>
                    <p className="text-sm text-green-700 mt-1">
                      Target pendapatan bulan ini telah tercapai 100%
                    </p>
                    <p className="mt-1 text-xs text-green-600">
                      1 hari yang lalu
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="border-green-200 bg-green-100 hover:bg-green-200 text-green-800">
                    Lihat Detail
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
