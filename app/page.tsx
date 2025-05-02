import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CreditCard, DollarSign, Users, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { RecentTransactionsTable } from "@/components/recent-transactions-table"
import { OverviewChart } from "@/components/overview-chart"
import { getTotalAnggota, getTotalSimpanan, getTotalPinjaman } from "@/lib/supabase"
import Link from "next/link"

export default async function Dashboard() {
  // Fetch data from Supabase
  const totalAnggota = await getTotalAnggota();
  const totalSimpanan = await getTotalSimpanan();
  const totalPinjaman = await getTotalPinjaman();
  
  // Format currency
  const formatCurrency = (amount: number) => {
    // Format as millions (juta) if amount is large enough
    if (amount >= 1000000) {
      return `Rp ${(amount / 1000000).toFixed(1)} juta`;
    } else if (amount >= 1000) {
      return `Rp ${(amount / 1000).toFixed(0)} ribu`;
    }
    return `Rp ${amount.toLocaleString('id-ID')}`;
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center space-x-2">
          <Button asChild>
            <Link href="/import">Import Data</Link>
          </Button>
        </div>
      </div>
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Ringkasan</TabsTrigger>
          <TabsTrigger value="analytics">Analitik</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Pendapatan</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalSimpanan * 0.1)}</div>
                <p className="text-xs text-muted-foreground">Estimasi dari bunga simpanan</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Anggota</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalAnggota}</div>
                <p className="text-xs text-muted-foreground">Anggota aktif</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Simpanan</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalSimpanan)}</div>
                <p className="text-xs text-muted-foreground">Dari semua anggota aktif</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Pinjaman Aktif</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalPinjaman)}</div>
                <p className="text-xs text-muted-foreground">Pinjaman yang belum lunas</p>
              </CardContent>
            </Card>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Ringkasan Keuangan</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <OverviewChart />
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Aktivitas Terbaru</CardTitle>
                <CardDescription>5 transaksi terakhir</CardDescription>
              </CardHeader>
              <CardContent>
                <RecentTransactionsTable />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Pertumbuhan Anggota</CardTitle>
                <CardDescription>Jumlah anggota baru per bulan</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <OverviewChart />
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Distribusi Pinjaman</CardTitle>
                <CardDescription>Berdasarkan kategori</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Data grafik distribusi pinjaman
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
