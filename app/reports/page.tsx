import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Calendar, Download, FileText, PieChart, Printer, Share2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { OverviewChart } from "@/components/overview-chart"

export default function ReportsPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Laporan</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Calendar className="mr-2 h-4 w-4" />
            Pilih Periode
          </Button>
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Ekspor Laporan
          </Button>
        </div>
      </div>

      <Tabs defaultValue="financial" className="space-y-4">
        <TabsList>
          <TabsTrigger value="financial">Laporan Keuangan</TabsTrigger>
          <TabsTrigger value="members">Laporan Anggota</TabsTrigger>
          <TabsTrigger value="loans">Laporan Pinjaman</TabsTrigger>
          <TabsTrigger value="transactions">Laporan Transaksi</TabsTrigger>
        </TabsList>

        <TabsContent value="financial" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Pendapatan</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Rp 45.231.890</div>
                <p className="text-xs text-muted-foreground">Periode: April 2023</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Pengeluaran</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Rp 12.567.000</div>
                <p className="text-xs text-muted-foreground">Periode: April 2023</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Laba Bersih</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Rp 32.664.890</div>
                <p className="text-xs text-muted-foreground">Periode: April 2023</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rasio Keuangan</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">72.2%</div>
                <p className="text-xs text-muted-foreground">Periode: April 2023</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Tren Keuangan</CardTitle>
                  <CardDescription>Perbandingan pendapatan dan pengeluaran</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select defaultValue="monthly">
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Pilih Periode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Mingguan</SelectItem>
                      <SelectItem value="monthly">Bulanan</SelectItem>
                      <SelectItem value="quarterly">Kuartalan</SelectItem>
                      <SelectItem value="yearly">Tahunan</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="icon">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <OverviewChart />
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Distribusi Pendapatan</CardTitle>
                  <CardDescription>Berdasarkan kategori</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon">
                    <PieChart className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon">
                    <BarChart className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Data grafik distribusi pendapatan
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 grid-cols-1">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Laporan Keuangan Terunduh</CardTitle>
                  <CardDescription>Laporan yang telah diunduh sebelumnya</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {financialReports.map((report) => (
                    <div key={report.id} className="flex items-center justify-between border-b pb-4">
                      <div className="flex items-center gap-4">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{report.name}</p>
                          <p className="text-sm text-muted-foreground">{report.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon">
                          <Share2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Printer className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Laporan Anggota</CardTitle>
              <CardDescription>Statistik dan data anggota</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                Data laporan anggota akan ditampilkan di sini
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="loans" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Laporan Pinjaman</CardTitle>
              <CardDescription>Statistik dan data pinjaman</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                Data laporan pinjaman akan ditampilkan di sini
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Laporan Transaksi</CardTitle>
              <CardDescription>Statistik dan data transaksi</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                Data laporan transaksi akan ditampilkan di sini
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

const financialReports = [
  {
    id: "report-001",
    name: "Laporan Keuangan Bulanan - April 2023",
    date: "30 Apr 2023",
    format: "PDF",
  },
  {
    id: "report-002",
    name: "Laporan Keuangan Bulanan - Maret 2023",
    date: "31 Mar 2023",
    format: "PDF",
  },
  {
    id: "report-003",
    name: "Laporan Keuangan Kuartal 1 - 2023",
    date: "31 Mar 2023",
    format: "PDF",
  },
  {
    id: "report-004",
    name: "Laporan Keuangan Tahunan - 2022",
    date: "31 Dec 2022",
    format: "PDF",
  },
]
