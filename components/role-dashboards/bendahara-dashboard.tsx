"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { BarChart3, CreditCard, Wallet, FileText, Bell, DollarSign, Calculator, ArrowUpRight, ArrowDownRight } from "lucide-react";
import Link from "next/link";
import { useAdminAuth } from "@/lib/admin-auth-context";

export function BendaraDashboard() {
  const { user } = useAdminAuth();

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard Bendahara</h2>
        <div className="flex items-center space-x-2">
          <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
            Bendahara
          </div>
        </div>
      </div>
      
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Ikhtisar Keuangan</TabsTrigger>
          <TabsTrigger value="transactions">Transaksi</TabsTrigger>
          <TabsTrigger value="loans">Pinjaman</TabsTrigger>
          <TabsTrigger value="reports">Laporan</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-gradient-to-br from-green-400 to-green-500 text-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pendapatan Bulan Ini</CardTitle>
                <ArrowUpRight className="h-4 w-4 text-white" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Rp 78.5 Juta</div>
                <p className="text-xs text-green-100">+12% dari bulan lalu</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-red-400 to-red-500 text-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pengeluaran Bulan Ini</CardTitle>
                <ArrowDownRight className="h-4 w-4 text-white" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Rp 32.8 Juta</div>
                <p className="text-xs text-red-100">-5% dari bulan lalu</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-blue-400 to-blue-500 text-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Transaksi</CardTitle>
                <CreditCard className="h-4 w-4 text-white" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">324</div>
                <p className="text-xs text-blue-100">+8% dari bulan lalu</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-amber-400 to-amber-500 text-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pinjaman Aktif</CardTitle>
                <Wallet className="h-4 w-4 text-white" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">78</div>
                <p className="text-xs text-amber-100">Total Rp 124 Juta</p>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Ringkasan Keuangan</CardTitle>
                <CardDescription>
                  Ringkasan keuangan koperasi bulan ini
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-medium">Grafik Keuangan</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Perbandingan pendapatan dan pengeluaran 6 bulan terakhir
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Aksi Cepat</CardTitle>
                <CardDescription>
                  Akses cepat ke fitur bendahara
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2">
                <Link href="/transactions">
                  <Button className="w-full justify-start" variant="outline">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Catat Transaksi Baru
                  </Button>
                </Link>
                <Link href="/loans">
                  <Button className="w-full justify-start" variant="outline">
                    <Wallet className="mr-2 h-4 w-4" />
                    Kelola Pinjaman
                  </Button>
                </Link>
                <Link href="/reports">
                  <Button className="w-full justify-start" variant="outline">
                    <FileText className="mr-2 h-4 w-4" />
                    Buat Laporan Keuangan
                  </Button>
                </Link>
                <Button className="w-full justify-start" variant="outline">
                  <Calculator className="mr-2 h-4 w-4" />
                  Kalkulator Pinjaman
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <DollarSign className="mr-2 h-4 w-4" />
                  Kelola Anggaran
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Transaksi Terbaru</CardTitle>
              <CardDescription>
                Daftar transaksi terbaru dalam sistem
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Transaksi Bulan Mei 2025</h3>
                  <Link href="/transactions">
                    <Button>
                      Lihat Semua
                    </Button>
                  </Link>
                </div>
                
                <div className="rounded-md border">
                  <div className="grid grid-cols-5 gap-4 p-4 font-medium border-b">
                    <div>Tanggal</div>
                    <div>ID Transaksi</div>
                    <div>Jenis</div>
                    <div>Jumlah</div>
                    <div>Status</div>
                  </div>
                  
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="grid grid-cols-5 gap-4 p-4 border-b last:border-0">
                      <div>{`${i} Mei 2025`}</div>
                      <div>{`TRX-${10000 + i}`}</div>
                      <div>{i % 2 === 0 ? 'Pemasukan' : 'Pengeluaran'}</div>
                      <div className={i % 2 === 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                        {i % 2 === 0 ? `+ Rp ${i * 500}.000` : `- Rp ${i * 300}.000`}
                      </div>
                      <div>
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                          Selesai
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-center mt-4">
                  <Button variant="outline">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Catat Transaksi Baru
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="loans" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Manajemen Pinjaman</CardTitle>
              <CardDescription>
                Kelola pinjaman anggota koperasi
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Pinjaman Aktif</h3>
                  <Link href="/loans">
                    <Button>
                      Lihat Semua
                    </Button>
                  </Link>
                </div>
                
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="rounded-lg border p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{`Anggota ${i}`}</h4>
                          <p className="text-sm text-muted-foreground">{`ID Pinjaman: P-${1000 + i}`}</p>
                        </div>
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                          Aktif
                        </span>
                      </div>
                      
                      <div className="mt-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Jumlah Pinjaman:</span>
                          <span className="font-medium">{`Rp ${i * 5}.000.000`}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Tanggal Mulai:</span>
                          <span>{`1 Mei 2025`}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Jatuh Tempo:</span>
                          <span>{`1 Mei 2026`}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Status Pembayaran:</span>
                          <span className="text-green-600 font-medium">Lancar</span>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex justify-end gap-2">
                        <Button variant="outline" size="sm">
                          Lihat Detail
                        </Button>
                        <Button size="sm">
                          Catat Pembayaran
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Laporan Keuangan</CardTitle>
              <CardDescription>
                Buat dan kelola laporan keuangan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Buat Laporan Baru</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Jenis Laporan</label>
                      <select className="w-full rounded-md border border-input bg-background px-3 py-2">
                        <option>Laporan Bulanan</option>
                        <option>Laporan Triwulan</option>
                        <option>Laporan Tahunan</option>
                        <option>Laporan Pinjaman</option>
                        <option>Laporan Keuangan Umum</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Periode</label>
                      <select className="w-full rounded-md border border-input bg-background px-3 py-2">
                        <option>Mei 2025</option>
                        <option>April 2025</option>
                        <option>Maret 2025</option>
                        <option>Triwulan II 2025</option>
                        <option>Triwulan I 2025</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button>
                      <FileText className="mr-2 h-4 w-4" />
                      Buat Laporan
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Laporan Terbaru</h3>
                  
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="rounded-lg border p-4">
                        <h4 className="font-medium">{`Laporan ${['Bulanan', 'Triwulan', 'Pinjaman'][i-1]} - ${['April 2025', 'Triwulan I 2025', 'Mei 2025'][i-1]}`}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {`Dibuat pada ${i} Mei 2025`}
                        </p>
                        <div className="flex justify-end mt-4 gap-2">
                          <Button variant="outline" size="sm">
                            <FileText className="mr-2 h-4 w-4" />
                            Unduh PDF
                          </Button>
                          <Button size="sm">
                            Lihat Detail
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
