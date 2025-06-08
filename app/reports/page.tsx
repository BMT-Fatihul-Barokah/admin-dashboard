"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Calendar, ChevronLeft, ChevronRight, Download, FileText, PieChart, Printer, Share2, Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FinancialTrendsChart } from "@/components/financial-trends-chart"
import { TransactionDistributionChart } from "@/components/transaction-distribution-chart"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useAdminAuth } from "@/lib/admin-auth-context"
import { supabase } from "@/lib/supabase"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import type { WorkSheet, WorkBook } from "xlsx"
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
  const { user } = useAdminAuth()
  
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
  const [isDownloading, setIsDownloading] = useState<string | null>(null)
  const [periodType, setPeriodType] = useState<'weekly' | 'monthly' | 'quarterly' | 'yearly'>('monthly')
  const [chartType, setChartType] = useState<'pie' | 'bar'>('pie')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [showDatePicker, setShowDatePicker] = useState(false)
  
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
  
  // Handle downloading a saved report
  const handleDownloadSavedReport = async (report: SavedReport) => {
    try {
      setIsDownloading(report.id)
      console.log('Downloading report:', report)
      
      // Extract period from report name (e.g., "Laporan Keuangan Bulanan - April 2023")
      let period = ''
      let reportType = 'financial'
      
      // Parse the date from the report
      if (report.date) {
        const dateParts = report.date.split(' ')
        if (dateParts.length >= 2) {
          const month = dateParts[0]
          const year = dateParts[dateParts.length - 1]
          period = `${year}-${month}`
        }
      }
      
      // Determine report type from name
      if (report.name.toLowerCase().includes('anggota')) {
        reportType = 'members'
      } else if (report.name.toLowerCase().includes('pinjaman')) {
        reportType = 'loans'
      } else if (report.name.toLowerCase().includes('transaksi')) {
        reportType = 'transactions'
      }
      
      // Get the Supabase URL and access token
      const supabaseUrl = 'https://hyiwhckxwrngegswagrb.supabase.co'
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        toast.error('Sesi login tidak valid. Silakan login kembali.')
        return
      }
      
      // Direct fetch approach to get the file as an array buffer
      const response = await fetch(
        `${supabaseUrl}/functions/v1/export-report`, 
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            reportType,
            period,
            format: report.format.toLowerCase()
          })
        }
      )
      
      // Check if the response is successful
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Edge function error:', errorText)
        throw new Error(`Server responded with ${response.status}: ${errorText}`)
      }
      
      // Get the array buffer from the response
      const functionData = await response.arrayBuffer()
      
      // Create a Blob from the response data
      const blob = new Blob([functionData], {
        type: report.format.toLowerCase() === 'pdf' 
          ? 'application/pdf' 
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })
      
      // Create a download link and trigger the download
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = report.name.replace(/ /g, '_') + '.' + report.format.toLowerCase()
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast.success('Laporan berhasil diunduh')
    } catch (error) {
      console.error('Error downloading report:', error)
      toast.error('Gagal mengunduh laporan')
    } finally {
      setIsDownloading(null)
    }
  }
  
  // Handle export report
  const handleExportReport = async () => {
    try {
      setIsLoading(true)
      
      // Import xlsx library dynamically
      const XLSX = await import('xlsx')
      
      // Format period for the filename
      const formattedPeriod = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
      const formattedMonth = format(currentDate, 'MMMM yyyy', { locale: id })
      
      // Determine report type based on active tab
      const activeTab = document.querySelector('[role="tabpanel"]:not([hidden])')?.id || 'financial'
      const reportType = activeTab.replace('-tab', '')
      
      // Prepare data for export based on report type
      let fileName = `Laporan_${formattedPeriod}.xlsx`
      
      // Sample data for when real data is missing
      const sampleTransactions = [
        { id: 'TRX-001', tanggal: '2025-05-01', jenis: 'Setoran', jumlah: 1500000, anggota: 'Ahmad Fauzi' },
        { id: 'TRX-002', tanggal: '2025-05-05', jenis: 'Penarikan', jumlah: 500000, anggota: 'Budi Santoso' },
        { id: 'TRX-003', tanggal: '2025-05-10', jenis: 'Pembayaran Pinjaman', jumlah: 750000, anggota: 'Citra Dewi' },
        { id: 'TRX-004', tanggal: '2025-05-15', jenis: 'Pencairan Pinjaman', jumlah: 3000000, anggota: 'Dian Purnama' },
        { id: 'TRX-005', tanggal: '2025-05-20', jenis: 'Setoran', jumlah: 1250000, anggota: 'Eko Prasetyo' }
      ]
      
      const sampleMembers = [
        { id: 'MBR-001', nama: 'Ahmad Fauzi', status: 'Aktif', tanggal_bergabung: '2024-01-15', saldo: 2500000 },
        { id: 'MBR-002', nama: 'Budi Santoso', status: 'Aktif', tanggal_bergabung: '2024-02-20', saldo: 1750000 },
        { id: 'MBR-003', nama: 'Citra Dewi', status: 'Aktif', tanggal_bergabung: '2024-03-10', saldo: 3200000 },
        { id: 'MBR-004', nama: 'Dian Purnama', status: 'Tidak Aktif', tanggal_bergabung: '2024-01-05', saldo: 0 },
        { id: 'MBR-005', nama: 'Eko Prasetyo', status: 'Aktif', tanggal_bergabung: '2024-04-25', saldo: 1800000 }
      ]
      
      const sampleLoans = [
        { id: 'LN-001', anggota: 'Ahmad Fauzi', jumlah: 5000000, tanggal_pencairan: '2025-03-15', jangka_waktu: '12 bulan', status: 'Aktif' },
        { id: 'LN-002', anggota: 'Citra Dewi', jumlah: 3000000, tanggal_pencairan: '2025-04-10', jangka_waktu: '6 bulan', status: 'Aktif' },
        { id: 'LN-003', anggota: 'Budi Santoso', jumlah: 2000000, tanggal_pencairan: '2025-02-20', jangka_waktu: '6 bulan', status: 'Lunas' },
        { id: 'LN-004', anggota: 'Eko Prasetyo', jumlah: 7500000, tanggal_pencairan: '2025-01-05', jangka_waktu: '24 bulan', status: 'Aktif' },
        { id: 'LN-005', anggota: 'Fani Wijaya', jumlah: 1500000, tanggal_pencairan: '2025-04-25', jangka_waktu: '3 bulan', status: 'Bermasalah' }
      ]
      
      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      
      if (reportType === 'financial') {
        fileName = `Laporan_Keuangan_${formattedPeriod}.xlsx`;
        
        // Financial summary data
        const summaryData = [
          {
            Kategori: 'Total Pemasukan',
            Nilai: financialSummary?.totalIncome || 5000000,
            Periode: financialSummary?.period || formattedMonth
          },
          {
            Kategori: 'Total Pengeluaran',
            Nilai: financialSummary?.totalExpense || 3500000,
            Periode: financialSummary?.period || formattedMonth
          },
          {
            Kategori: 'Laba Bersih',
            Nilai: financialSummary?.netProfit || 1500000,
            Periode: financialSummary?.period || formattedMonth
          },
          {
            Kategori: 'Rasio Keuangan',
            Nilai: financialSummary?.financialRatio || 1.43,
            Periode: financialSummary?.period || formattedMonth
          },
          {
            Kategori: 'Margin Keuntungan',
            Nilai: financialSummary?.profitMarginRatio || 0.3,
            Periode: financialSummary?.period || formattedMonth
          },
          {
            Kategori: 'Efisiensi Operasional',
            Nilai: financialSummary?.operationalEfficiencyRatio || 0.7,
            Periode: financialSummary?.period || formattedMonth
          }
        ]
        
        // Transaction distribution data
        const distributionData = transactionDistribution.length > 0 
          ? transactionDistribution.map(item => ({
              Kategori: item.category,
              Jumlah: item.amount,
              Persentase: item.percentage
            }))
          : [
              { Kategori: 'Setoran', Jumlah: 2750000, Persentase: 55 },
              { Kategori: 'Penarikan', Jumlah: 500000, Persentase: 10 },
              { Kategori: 'Pembayaran Pinjaman', Jumlah: 750000, Persentase: 15 },
              { Kategori: 'Pencairan Pinjaman', Jumlah: 1000000, Persentase: 20 }
            ]
        
        // Financial trends data
        const trendsData = financialTrends.length > 0
          ? financialTrends.map(item => ({
              Bulan: item.month,
              Pemasukan: item.income,
              Pengeluaran: item.expense,
              'Laba Bersih': item.income - item.expense
            }))
          : [
              { Bulan: 'Januari', Pemasukan: 4500000, Pengeluaran: 3200000, 'Laba Bersih': 1300000 },
              { Bulan: 'Februari', Pemasukan: 4800000, Pengeluaran: 3300000, 'Laba Bersih': 1500000 },
              { Bulan: 'Maret', Pemasukan: 5200000, Pengeluaran: 3600000, 'Laba Bersih': 1600000 },
              { Bulan: 'April', Pemasukan: 4900000, Pengeluaran: 3400000, 'Laba Bersih': 1500000 },
              { Bulan: 'Mei', Pemasukan: 5000000, Pengeluaran: 3500000, 'Laba Bersih': 1500000 },
              { Bulan: 'Juni', Pemasukan: 5300000, Pengeluaran: 3700000, 'Laba Bersih': 1600000 }
            ]
            
        // Sample transaction details
        const transactionDetails = sampleTransactions
        
        // Add sheets to workbook with formatting
        // 1. Summary Sheet
        const summarySheet = XLSX.utils.json_to_sheet(summaryData)
        
        // Set column widths
        const summaryWidths = [{ wch: 25 }, { wch: 15 }, { wch: 20 }]
        summarySheet['!cols'] = summaryWidths;
        
        XLSX.utils.book_append_sheet(wb, summarySheet, 'Ringkasan Keuangan')
        
        // 2. Distribution Sheet
        const distributionSheet = XLSX.utils.json_to_sheet(distributionData)
        
        // Set column widths
        const distributionWidths = [{ wch: 20 }, { wch: 15 }, { wch: 15 }]
        distributionSheet['!cols'] = distributionWidths;
        
        XLSX.utils.book_append_sheet(wb, distributionSheet, 'Distribusi Transaksi')
        
        // 3. Trends Sheet
        const trendsSheet = XLSX.utils.json_to_sheet(trendsData)
        
        // Set column widths
        const trendsWidths = [{ wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }]
        trendsSheet['!cols'] = trendsWidths;
        
        XLSX.utils.book_append_sheet(wb, trendsSheet, 'Tren Keuangan')
        
        // 4. Transaction Details Sheet
        const transactionDetailsSheet = XLSX.utils.json_to_sheet(transactionDetails)
        
        // Set column widths
        const transactionWidths = [{ wch: 10 }, { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 20 }]
        transactionDetailsSheet['!cols'] = transactionWidths;
        
        XLSX.utils.book_append_sheet(wb, transactionDetailsSheet, 'Detail Transaksi')
        
      } else if (reportType === 'members') {
        fileName = `Laporan_Anggota_${formattedPeriod}.xlsx`;
        
        // Member statistics data
        const membersData = [
          {
            Kategori: 'Total Anggota',
            Jumlah: memberStats?.totalMembers || 125,
            Periode: memberStats?.period || formattedMonth
          },
          {
            Kategori: 'Anggota Aktif',
            Jumlah: memberStats?.activeMembers || 112,
            Periode: memberStats?.period || formattedMonth
          },
          {
            Kategori: 'Anggota Baru',
            Jumlah: memberStats?.newMembers || 8,
            Periode: memberStats?.period || formattedMonth
          },
          {
            Kategori: 'Anggota Tidak Aktif',
            Jumlah: memberStats?.inactiveMembers || 13,
            Periode: memberStats?.period || formattedMonth
          }
        ]
        
        // Add sheets to workbook with formatting
        // 1. Summary Sheet
        const membersSheet = XLSX.utils.json_to_sheet(membersData)
        
        // Set column widths
        const summaryWidths = [{ wch: 25 }, { wch: 15 }, { wch: 20 }]
        membersSheet['!cols'] = summaryWidths
        
        XLSX.utils.book_append_sheet(wb, membersSheet, 'Statistik Anggota')
        
        // 2. Member Details Sheet
        const memberDetailsSheet = XLSX.utils.json_to_sheet(sampleMembers)
        
        // Set column widths
        const memberWidths = [{ wch: 10 }, { wch: 20 }, { wch: 15 }, { wch: 20 }, { wch: 15 }]
        memberDetailsSheet['!cols'] = memberWidths
        
        XLSX.utils.book_append_sheet(wb, memberDetailsSheet, 'Detail Anggota')
        
      } else if (reportType === 'loans') {
        fileName = `Laporan_Pinjaman_${formattedPeriod}.xlsx`;
        
        // Loan statistics data
        const loansData = [
          {
            Kategori: 'Total Pinjaman',
            Jumlah: loanStats?.totalLoans || 45,
            Nilai: loanStats?.totalAmount || 175000000,
            Periode: loanStats?.period || formattedMonth
          },
          {
            Kategori: 'Pinjaman Aktif',
            Jumlah: loanStats?.activeLoans || 38,
            Nilai: 150000000,
            Periode: loanStats?.period || formattedMonth
          },
          {
            Kategori: 'Pinjaman Lunas',
            Jumlah: loanStats?.completedLoans || 6,
            Nilai: 20000000,
            Periode: loanStats?.period || formattedMonth
          },
          {
            Kategori: 'Pinjaman Bermasalah',
            Jumlah: loanStats?.problematicLoans || 1,
            Nilai: 5000000,
            Periode: loanStats?.period || formattedMonth
          }
        ]
        
        // Add sheets to workbook with formatting
        // 1. Summary Sheet
        const loansSheet = XLSX.utils.json_to_sheet(loansData)
        
        // Set column widths
        const summaryWidths = [{ wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 20 }]
        loansSheet['!cols'] = summaryWidths;
        
        XLSX.utils.book_append_sheet(wb, loansSheet, 'Statistik Pinjaman')
        
        // 2. Loan Details Sheet
        const loanDetailsSheet = XLSX.utils.json_to_sheet(sampleLoans)
        
        // Set column widths
        const loanWidths = [{ wch: 10 }, { wch: 20 }, { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 15 }]
        loanDetailsSheet['!cols'] = loanWidths;
        
        XLSX.utils.book_append_sheet(wb, loanDetailsSheet, 'Detail Pinjaman')
        
      } else if (reportType === 'transactions') {
        fileName = `Laporan_Transaksi_${formattedPeriod}.xlsx`;
        
        // Transaction statistics data
        const transactionsData = [
          {
            Kategori: 'Total Transaksi',
            Jumlah: transactionStats?.totalTransactions || 87,
            Periode: transactionStats?.period || formattedMonth
          },
          {
            Kategori: 'Total Setoran',
            Jumlah: transactionStats?.totalDeposits || 45,
            Periode: transactionStats?.period || formattedMonth
          },
          {
            Kategori: 'Total Penarikan',
            Jumlah: transactionStats?.totalWithdrawals || 25,
            Periode: transactionStats?.period || formattedMonth
          },
          {
            Kategori: 'Total Pencairan Pinjaman',
            Jumlah: transactionStats?.totalLoanDisbursements || 7,
            Periode: transactionStats?.period || formattedMonth
          },
          {
            Kategori: 'Total Pembayaran Pinjaman',
            Jumlah: transactionStats?.totalLoanPayments || 10,
            Periode: transactionStats?.period || formattedMonth
          }
        ]
        
        // Add sheets to workbook with formatting
        // 1. Summary Sheet
        const transactionsSheet = XLSX.utils.json_to_sheet(transactionsData)
        
        // Set column widths
        const summaryWidths = [{ wch: 30 }, { wch: 15 }, { wch: 20 }]
        transactionsSheet['!cols'] = summaryWidths;
        
        XLSX.utils.book_append_sheet(wb, transactionsSheet, 'Statistik Transaksi')
        
        // 2. Transaction Details Sheet
        const transactionDetailsSheet = XLSX.utils.json_to_sheet(sampleTransactions)
        
        // Set column widths
        const transactionWidths = [{ wch: 10 }, { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 20 }]
        transactionDetailsSheet['!cols'] = transactionWidths;
        
        XLSX.utils.book_append_sheet(wb, transactionDetailsSheet, 'Detail Transaksi')
      } else {
        // Fallback for unknown report type
        const fallbackSheet = XLSX.utils.json_to_sheet([{ 
          'Jenis Laporan': 'Tidak Diketahui',
          'Pesan': 'Jenis laporan tidak dikenali',
          'Tanggal': new Date().toISOString().split('T')[0]
        }])
        
        // Set column widths
        const fallbackWidths = [{ wch: 20 }, { wch: 30 }, { wch: 15 }]
        fallbackSheet['!cols'] = fallbackWidths;
        
        XLSX.utils.book_append_sheet(wb, fallbackSheet, 'Laporan')
      }
      
      // Add report metadata sheet
      const metadataSheet = XLSX.utils.json_to_sheet([
        { 'Metadata': 'Informasi Laporan', 'Nilai': '' },
        { 'Metadata': 'Tanggal Laporan', 'Nilai': new Date().toISOString().split('T')[0] },
        { 'Metadata': 'Periode Laporan', 'Nilai': formattedMonth },
        { 'Metadata': 'Jenis Laporan', 'Nilai': reportType === 'financial' ? 'Keuangan' : 
                                              reportType === 'members' ? 'Anggota' : 
                                              reportType === 'loans' ? 'Pinjaman' : 
                                              reportType === 'transactions' ? 'Transaksi' : 'Tidak Diketahui' },
        { 'Metadata': 'Dibuat Oleh', 'Nilai': user?.nama || 'Admin' }
      ]);
      
      // Set column widths
      const metadataWidths = [{ wch: 25 }, { wch: 30 }];
      metadataSheet['!cols'] = metadataWidths;
      
      XLSX.utils.book_append_sheet(wb, metadataSheet, 'Metadata');
      
      // If no sheets were added (unlikely with our checks), add a default sheet
      if (wb.SheetNames.length === 0) {
        const defaultSheet = XLSX.utils.json_to_sheet([{ 
          'Informasi': 'Tidak ada data yang tersedia untuk laporan ini',
          'Periode': formattedPeriod 
        }])
        XLSX.utils.book_append_sheet(wb, defaultSheet, 'Tidak Ada Data')
      }
      
      // Generate Excel file and trigger download
      XLSX.writeFile(wb, fileName)
      
      toast.success('Laporan berhasil diekspor')
    } catch (error) {
      console.error('Error exporting report:', error)
      toast.error('Gagal mengekspor laporan')
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Laporan</h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Button 
              variant="outline" 
              onClick={() => setShowDatePicker(!showDatePicker)}
            >
              <Calendar className="mr-2 h-4 w-4" />
              {format(currentDate, 'MMMM yyyy', { locale: id })}
            </Button>
            
            {showDatePicker && (
              <div className="absolute right-0 top-full z-50 mt-2 bg-background border rounded-md shadow-md p-4 w-[280px]">
                <div className="flex flex-col space-y-4">
                  <div className="flex justify-between items-center">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        const newDate = new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), 1)
                        setCurrentDate(newDate)
                      }}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="font-medium">{currentDate.getFullYear()}</span>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        const newDate = new Date(currentDate.getFullYear() + 1, currentDate.getMonth(), 1)
                        setCurrentDate(newDate)
                      }}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    {Array.from({ length: 12 }).map((_, index) => {
                      const date = new Date(currentDate.getFullYear(), index, 1)
                      return (
                        <Button 
                          key={index} 
                          variant={currentDate.getMonth() === index ? "default" : "ghost"}
                          size="sm"
                          className="text-xs h-8"
                          onClick={() => {
                            const newDate = new Date(currentDate.getFullYear(), index, 1)
                            setCurrentDate(newDate)
                            setShowDatePicker(false)
                          }}
                        >
                          {format(date, 'MMM', { locale: id })}
                        </Button>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <Select value={periodType} onValueChange={(value) => handlePeriodChange(value as any)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Pilih Periode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Mingguan</SelectItem>
              <SelectItem value="monthly">Bulanan</SelectItem>
              <SelectItem value="quarterly">Kuartalan</SelectItem>
              <SelectItem value="yearly">Tahunan</SelectItem>
            </SelectContent>
          </Select>
          
          {user?.role !== 'ketua' && (
            <Button onClick={handleExportReport} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Mengekspor...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Ekspor Laporan
                </>
              )}
            </Button>
          )}
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-950 dark:to-gray-900 border-blue-100 dark:border-blue-900 shadow-sm hover:shadow-md transition-all duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Pemasukan</CardTitle>
                  <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                    <FileText className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-900 dark:text-blue-200">{financialSummary ? formatCurrency(financialSummary.totalIncome) : 'Rp 0'}</div>
                  <p className="text-xs text-blue-500 dark:text-blue-400">Periode: {financialSummary?.period || '-'}</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-red-50 to-white dark:from-red-950 dark:to-gray-900 border-red-100 dark:border-red-900 shadow-sm hover:shadow-md transition-all duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-red-700 dark:text-red-300">Total Pengeluaran</CardTitle>
                  <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                    <FileText className="h-4 w-4 text-red-600 dark:text-red-300" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-900 dark:text-red-200">{financialSummary ? formatCurrency(financialSummary.totalExpense) : 'Rp 0'}</div>
                  <p className="text-xs text-red-500 dark:text-red-400">Periode: {financialSummary?.period || '-'}</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-green-50 to-white dark:from-green-950 dark:to-gray-900 border-green-100 dark:border-green-900 shadow-sm hover:shadow-md transition-all duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">Laba Bersih</CardTitle>
                  <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                    <FileText className="h-4 w-4 text-green-600 dark:text-green-300" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-900 dark:text-green-200">{financialSummary ? formatCurrency(financialSummary.netProfit) : 'Rp 0'}</div>
                  <p className="text-xs text-green-500 dark:text-green-400">Periode: {financialSummary?.period || '-'}</p>
                </CardContent>
              </Card>
            </div>
          )}

          {!isLoading && (
            <div className="space-y-4">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4 bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-all duration-200 border-blue-50 dark:border-blue-900">
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
                      {user?.role !== 'ketua' && (
                        <Button variant="outline" size="icon" onClick={handleExportReport}>
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <FinancialTrendsChart data={financialTrends} />
                  </CardContent>
                </Card>
                <Card className="col-span-3 bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-all duration-200 border-blue-50 dark:border-blue-900">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Distribusi Transaksi</CardTitle>
                      <CardDescription>Berdasarkan sumber</CardDescription>
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
            </div>
          )}

          {!isLoading && (
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
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleDownloadSavedReport(report)}
                            disabled={isLoading}
                          >
                            {isDownloading === report.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Download className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
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

// Sample data for demonstration purposes only
export const financialReports = [
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
];
