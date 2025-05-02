"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Calendar, Download, FileText, PieChart, Printer, Share2, Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FinancialTrendsChart } from "@/components/financial-trends-chart"
import { TransactionDistributionChart } from "@/components/transaction-distribution-chart"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import {
  getFinancialSummary,
  getTransactionDistribution,
  getFinancialTrends,
  getMemberStatistics,
  getLoanStatistics,
  getTransactionStatistics,
  getSavedReports,
  formatCurrency,
  FinancialSummary,
  TransactionDistribution,
  FinancialTrend,
  MemberStatistics,
  LoanStatistics,
  TransactionStatistics,
  SavedReport
} from "@/lib/reports"

export default function ReportsPage() {
  const router = useRouter()
  
  // State for data
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null)
  const [transactionDistribution, setTransactionDistribution] = useState<TransactionDistribution[]>([])
  const [financialTrends, setFinancialTrends] = useState<FinancialTrend[]>([])
  const [memberStats, setMemberStats] = useState<MemberStatistics | null>(null)
  const [loanStats, setLoanStats] = useState<LoanStatistics | null>(null)
  const [transactionStats, setTransactionStats] = useState<TransactionStatistics | null>(null)
  const [savedReports, setSavedReports] = useState<SavedReport[]>([])
  
  // State for UI
  const [isLoading, setIsLoading] = useState(true)
  const [periodType, setPeriodType] = useState<'weekly' | 'monthly' | 'quarterly' | 'yearly'>('monthly')
  const [chartType, setChartType] = useState<'pie' | 'bar'>('pie')
  const [currentDate, setCurrentDate] = useState(new Date())
  
  // Fetch all data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Fetch all data in parallel
        const [summary, distribution, trends, members, loans, transactions, reports] = await Promise.all([
          getFinancialSummary(currentDate),
          getTransactionDistribution(currentDate),
          getFinancialTrends(periodType),
          getMemberStatistics(currentDate),
          getLoanStatistics(currentDate),
          getTransactionStatistics(currentDate),
          getSavedReports()
        ])
        
        // Update state with fetched data
        setFinancialSummary(summary)
        setTransactionDistribution(distribution)
        setFinancialTrends(trends)
        setMemberStats(members)
        setLoanStats(loans)
        setTransactionStats(transactions)
        setSavedReports(reports)
      } catch (error) {
        console.error('Error fetching report data:', error)
        toast.error('Gagal memuat data laporan')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchData()
  }, [currentDate, periodType])
  
  // Handle period change
  const handlePeriodChange = (type: 'weekly' | 'monthly' | 'quarterly' | 'yearly') => {
    setPeriodType(type)
  }
  
  // Handle export report
  const handleExportReport = () => {
    toast.success('Laporan berhasil diekspor')
  }
  
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Laporan</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Calendar className="mr-2 h-4 w-4" />
            Pilih Periode
          </Button>
          <Button onClick={handleExportReport}>
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
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Memuat data...</span>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Pemasukan</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{financialSummary ? formatCurrency(financialSummary.totalIncome) : 'Rp 0'}</div>
                  <p className="text-xs text-muted-foreground">Periode: {financialSummary?.period || '-'}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Pengeluaran</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{financialSummary ? formatCurrency(financialSummary.totalExpense) : 'Rp 0'}</div>
                  <p className="text-xs text-muted-foreground">Periode: {financialSummary?.period || '-'}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Laba Bersih</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{financialSummary ? formatCurrency(financialSummary.netProfit) : 'Rp 0'}</div>
                  <p className="text-xs text-muted-foreground">Periode: {financialSummary?.period || '-'}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Rasio Keuangan</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{financialSummary ? financialSummary.financialRatio.toFixed(1) + '%' : '0%'}</div>
                  <p className="text-xs text-muted-foreground">Periode: {financialSummary?.period || '-'}</p>
                </CardContent>
              </Card>
            </div>
          )}

          {!isLoading && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="col-span-4">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Tren Keuangan</CardTitle>
                    <CardDescription>Perbandingan pendapatan dan pengeluaran</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={periodType} onValueChange={handlePeriodChange}>
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
                    <Button variant="outline" size="icon" onClick={handleExportReport}>
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <FinancialTrendsChart data={financialTrends} />
                </CardContent>
              </Card>
              <Card className="col-span-3">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Distribusi Transaksi</CardTitle>
                    <CardDescription>Berdasarkan kategori</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant={chartType === 'pie' ? 'default' : 'outline'} 
                      size="icon"
                      onClick={() => setChartType('pie')}
                    >
                      <PieChart className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant={chartType === 'bar' ? 'default' : 'outline'} 
                      size="icon"
                      onClick={() => setChartType('bar')}
                    >
                      <BarChart className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <TransactionDistributionChart 
                    data={transactionDistribution} 
                    chartType={chartType} 
                  />
                </CardContent>
              </Card>
            </div>
          )}

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
                  {savedReports.map((report) => (
                    <div key={report.id} className="flex items-center justify-between border-b pb-4">
                      <div className="flex items-center gap-4">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{report.name}</p>
                          <p className="text-sm text-muted-foreground">{report.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => toast.success('Laporan dibagikan')}>
                          <Share2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => toast.success('Laporan dicetak')}>
                          <Printer className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => toast.success('Laporan diunduh')}>
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
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Memuat data...</span>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Anggota</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{memberStats?.totalMembers || 0}</div>
                    <p className="text-xs text-muted-foreground">Periode: {memberStats?.period || '-'}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Anggota Aktif</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{memberStats?.activeMembers || 0}</div>
                    <p className="text-xs text-muted-foreground">Periode: {memberStats?.period || '-'}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Anggota Baru</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{memberStats?.newMembers || 0}</div>
                    <p className="text-xs text-muted-foreground">Periode: {memberStats?.period || '-'}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Anggota Tidak Aktif</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{memberStats?.inactiveMembers || 0}</div>
                    <p className="text-xs text-muted-foreground">Periode: {memberStats?.period || '-'}</p>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Daftar Anggota Baru</CardTitle>
                  <CardDescription>Anggota yang bergabung dalam periode ini</CardDescription>
                </CardHeader>
                <CardContent>
                  {memberStats?.newMembers ? (
                    <div className="rounded-md border">
                      <div className="p-4 text-center">
                        <p>Ada {memberStats.newMembers} anggota baru pada periode {memberStats.period}</p>
                        <Button 
                          className="mt-4" 
                          onClick={() => {
                            toast.success('Membuka halaman anggota')
                            router.push('/members')
                          }}
                        >
                          Lihat Daftar Anggota
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 text-center text-muted-foreground">
                      Tidak ada anggota baru pada periode ini
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="loans" className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Memuat data...</span>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Pinjaman</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{loanStats?.totalLoans || 0}</div>
                    <p className="text-xs text-muted-foreground">Periode: {loanStats?.period || '-'}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pinjaman Aktif</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{loanStats?.activeLoans || 0}</div>
                    <p className="text-xs text-muted-foreground">Periode: {loanStats?.period || '-'}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pinjaman Lunas</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{loanStats?.completedLoans || 0}</div>
                    <p className="text-xs text-muted-foreground">Periode: {loanStats?.period || '-'}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Nilai Pinjaman</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(loanStats?.totalAmount || 0)}</div>
                    <p className="text-xs text-muted-foreground">Periode: {loanStats?.period || '-'}</p>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Status Pinjaman</CardTitle>
                  <CardDescription>Ringkasan status pinjaman</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="rounded-lg border p-4 text-center">
                        <p className="text-sm font-medium text-muted-foreground">Aktif</p>
                        <p className="text-2xl font-bold">{loanStats?.activeLoans || 0}</p>
                      </div>
                      <div className="rounded-lg border p-4 text-center">
                        <p className="text-sm font-medium text-muted-foreground">Lunas</p>
                        <p className="text-2xl font-bold">{loanStats?.completedLoans || 0}</p>
                      </div>
                      <div className="rounded-lg border p-4 text-center">
                        <p className="text-sm font-medium text-muted-foreground">Bermasalah</p>
                        <p className="text-2xl font-bold text-destructive">{loanStats?.problematicLoans || 0}</p>
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full" 
                      onClick={() => {
                        toast.success('Membuka halaman pinjaman')
                        router.push('/loans')
                      }}
                    >
                      Lihat Semua Pinjaman
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Memuat data...</span>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Transaksi</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{transactionStats?.totalTransactions || 0}</div>
                    <p className="text-xs text-muted-foreground">Periode: {transactionStats?.period || '-'}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Setoran</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{transactionStats?.totalDeposits || 0}</div>
                    <p className="text-xs text-muted-foreground">Periode: {transactionStats?.period || '-'}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Penarikan</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{transactionStats?.totalWithdrawals || 0}</div>
                    <p className="text-xs text-muted-foreground">Periode: {transactionStats?.period || '-'}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pencairan Pinjaman</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{transactionStats?.totalLoanDisbursements || 0}</div>
                    <p className="text-xs text-muted-foreground">Periode: {transactionStats?.period || '-'}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pembayaran Pinjaman</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{transactionStats?.totalLoanPayments || 0}</div>
                    <p className="text-xs text-muted-foreground">Periode: {transactionStats?.period || '-'}</p>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Ringkasan Transaksi</CardTitle>
                  <CardDescription>Statistik transaksi periode {transactionStats?.period || 'saat ini'}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="rounded-md border p-4">
                      <h3 className="text-lg font-medium mb-2">Statistik Transaksi</h3>
                      <p>Total transaksi dalam periode ini: <strong>{transactionStats?.totalTransactions || 0}</strong></p>
                      <p>Transaksi setoran: <strong>{transactionStats?.totalDeposits || 0}</strong></p>
                      <p>Transaksi penarikan: <strong>{transactionStats?.totalWithdrawals || 0}</strong></p>
                      <p>Transaksi pencairan pinjaman: <strong>{transactionStats?.totalLoanDisbursements || 0}</strong></p>
                      <p>Transaksi pembayaran pinjaman: <strong>{transactionStats?.totalLoanPayments || 0}</strong></p>
                    </div>
                    
                    <Button className="w-full" onClick={() => toast.success('Membuka halaman transaksi')}>
                      Lihat Semua Transaksi
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
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
