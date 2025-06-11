"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { BarChart3, Users, CreditCard, Wallet, UserPlus, FileText, Eye, AlertTriangle, Loader2, TrendingUp, TrendingDown, X, Download } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";
import { useAdminAuth } from "@/lib/admin-auth-context";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { 
  testDatabaseConnection,
  getTotalAnggota, 
  getPendingRegistrations, 
  getTotalActivePinjaman, 
  getCurrentMonthTransactions, 
  getRecentActivities,
  calculatePercentageChange
} from '@/lib/dashboard-data';
import { format, parseISO, formatDistanceToNow, subMonths, startOfMonth, endOfMonth, subDays } from "date-fns";
import { id } from "date-fns/locale";
import {
  getFinancialSummary,
  getTransactionDistribution,
  getFinancialTrends,
  getMemberStatistics,
  getLoanStatistics,
  getTransactionStatistics,
  FinancialSummary,
  TransactionDistribution,
  FinancialTrend,
  MemberStatistics,
  LoanStatistics,
  TransactionStatistics
} from "@/lib/reports";
import { supabase } from "@/lib/supabase";

// Activity type definition
type Activity = {
  id: string;
  type: 'transaction' | 'registration' | 'loan';
  description: string;
  amount?: number;
  created_at: string;
  status?: string;
};

// Define report type
type Report = {
  id: string;
  title: string;
  description: string;
  period: string;
  date: string;
  type: 'monthly' | 'quarterly' | 'annual';
};

// Define alert type
type SystemAlert = {
  id: string;
  title: string;
  description: string;
  severity: 'info' | 'success' | 'warning' | 'error';
  created_at: string;
  link?: string;
  linkText?: string;
};

export function KetuaDashboard() {
  const { user } = useAdminAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isLoadingAlerts, setIsLoadingAlerts] = useState(true);
  
  const [dashboardData, setDashboardData] = useState({
    totalMembers: 0,
    pendingRegistrations: 0,
    activeLoans: { count: 0, amount: 0 },
    currentMonthTransactions: 0,
    recentActivities: [] as Activity[],
    // Performance metrics
    financialSummary: null as FinancialSummary | null,
    memberStats: null as MemberStatistics | null,
    loanStats: null as LoanStatistics | null,
    newLoansAmount: 0,
    newLoansCount: 0,
    newLoansChange: 0,
    newMembersCount: 0,
    newMembersChange: 0,
    // Reports
    reports: [] as Report[],
    // System alerts
    systemAlerts: [] as SystemAlert[]
  });
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    try {
      return formatDistanceToNow(parseISO(dateString), { addSuffix: true, locale: id });
    } catch (error) {
      return dateString;
    }
  };
  
  // Handle viewing a report
  const handleViewReport = (report: Report) => {
    setSelectedReport(report);
    setShowReportModal(true);
  };
  
  // Handle downloading a report as PDF
  const handleDownloadPDF = async (report: Report) => {
    try {
      setIsGeneratingReport(true);
      
      // Simulate PDF generation delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In a real implementation, this would generate and download a PDF
      // For now, we'll just show an alert
      alert(`PDF untuk ${report.title} sedang diunduh`);
      
      // Create a dummy PDF download using a data URL
      const dummyPdfContent = `
        Laporan Keuangan Koperasi Fatihul Barokah
        ${report.title}
        Periode: ${report.period}
        Tanggal: ${report.date}
        
        Ini adalah contoh laporan PDF yang dihasilkan untuk demonstrasi.
        Dalam implementasi sebenarnya, ini akan berisi data keuangan lengkap.
      `;
      
      const blob = new Blob([dummyPdfContent], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${report.title.replace(/ /g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Terjadi kesalahan saat mengunduh PDF');
    } finally {
      setIsGeneratingReport(false);
    }
  };
  
  // Fetch system alerts
  const fetchSystemAlerts = async () => {
    setIsLoadingAlerts(true);
    try {
      const alerts: SystemAlert[] = [];
      
      // 1. Check for overdue loans (more than 30 days past due)
      const { data: overdueLoans, error: overdueError } = await supabase
        .from('pembiayaan')
        .select('id, anggota_id, jumlah, jatuh_tempo, created_at')
        .eq('status', 'aktif')
        .lt('jatuh_tempo', subDays(new Date(), 30).toISOString());
      
      if (overdueError) throw overdueError;
      
      if (overdueLoans && overdueLoans.length > 0) {
        alerts.push({
          id: 'alert-overdue-loans',
          title: `${overdueLoans.length} Pinjaman Melewati Tenggat Pembayaran`,
          description: `Terdapat ${overdueLoans.length} pinjaman yang melewati tenggat pembayaran lebih dari 30 hari`,
          severity: 'warning',
          created_at: new Date().toISOString(),
          link: '/loans?filter=overdue',
          linkText: 'Lihat Detail'
        });
      }
      
      // 2. Check for income target achievement
      if (dashboardData.financialSummary) {
        const targetIncome = 100000000; // 100 juta (example target)
        const currentIncome = dashboardData.financialSummary.totalIncome;
        const achievementPercentage = (currentIncome / targetIncome) * 100;
        
        if (achievementPercentage >= 100) {
          alerts.push({
            id: 'alert-income-target',
            title: 'Target Pendapatan Tercapai',
            description: `Target pendapatan bulan ini telah tercapai ${achievementPercentage.toFixed(0)}%`,
            severity: 'success',
            created_at: new Date().toISOString(),
            link: '/reports',
            linkText: 'Lihat Laporan'
          });
        } else if (achievementPercentage >= 90) {
          alerts.push({
            id: 'alert-income-near-target',
            title: 'Target Pendapatan Hampir Tercapai',
            description: `Target pendapatan bulan ini telah mencapai ${achievementPercentage.toFixed(0)}%`,
            severity: 'info',
            created_at: new Date().toISOString(),
            link: '/reports',
            linkText: 'Lihat Laporan'
          });
        }
      }
      
      // 3. Check for problematic loans
      const { data: problematicLoans, error: problematicError } = await supabase
        .from('pembiayaan')
        .select('id')
        .eq('status', 'bermasalah');
      
      if (problematicError) throw problematicError;
      
      if (problematicLoans && problematicLoans.length > 0) {
        alerts.push({
          id: 'alert-problematic-loans',
          title: `${problematicLoans.length} Pinjaman Bermasalah`,
          description: `Terdapat ${problematicLoans.length} pinjaman dengan status bermasalah yang memerlukan tindakan`,
          severity: 'error',
          created_at: new Date().toISOString(),
          link: '/loans?filter=problematic',
          linkText: 'Lihat Detail'
        });
      }
      
      // 4. Check for new member registrations in the last 24 hours
      const { data: newMembers, error: newMembersError } = await supabase
        .from('anggota')
        .select('id')
        .gt('created_at', subDays(new Date(), 1).toISOString());
      
      if (newMembersError) throw newMembersError;
      
      if (newMembers && newMembers.length > 0) {
        alerts.push({
          id: 'alert-new-members',
          title: `${newMembers.length} Anggota Baru Terdaftar`,
          description: `${newMembers.length} anggota baru telah mendaftar dalam 24 jam terakhir`,
          severity: 'info',
          created_at: new Date().toISOString(),
          link: '/users',
          linkText: 'Lihat Anggota'
        });
      }
      
      // Update dashboard data with alerts
      setDashboardData(prev => ({
        ...prev,
        systemAlerts: alerts
      }));
      
    } catch (error) {
      console.error('Error fetching system alerts:', error);
    } finally {
      setIsLoadingAlerts(false);
    }
  };
  
  useEffect(() => {
    async function fetchDashboardData() {
      setIsLoading(true);
      try {
        console.log('Fetching ketua dashboard data...');
        const currentDate = new Date();
        const lastMonth = subMonths(currentDate, 1);
        
        // Fetch basic dashboard data
        const [members, registrations, loans, transactions, activities] = await Promise.all([
          getTotalAnggota(),
          getPendingRegistrations(),
          getTotalActivePinjaman(),
          getCurrentMonthTransactions(),
          getRecentActivities(5)
        ]);
        
        // Fetch performance metrics
        const [financialSummary, memberStats, loanStats] = await Promise.all([
          getFinancialSummary(currentDate),
          getMemberStatistics(currentDate),
          getLoanStatistics(currentDate)
        ]);
        
        // Fetch new loans for current month
        const { data: currentMonthLoans, error: currentLoansError } = await supabase
          .from('pembiayaan')
          .select('jumlah')
          .gte('created_at', startOfMonth(currentDate).toISOString())
          .lte('created_at', endOfMonth(currentDate).toISOString());
        
        if (currentLoansError) throw currentLoansError;
        
        // Fetch new loans for previous month for comparison
        const { data: prevMonthLoans, error: prevLoansError } = await supabase
          .from('pembiayaan')
          .select('jumlah')
          .gte('created_at', startOfMonth(lastMonth).toISOString())
          .lte('created_at', endOfMonth(lastMonth).toISOString());
        
        if (prevLoansError) throw prevLoansError;
        
        // Calculate new loans metrics
        const newLoansAmount = currentMonthLoans.reduce((sum, loan) => sum + Number(loan.jumlah), 0);
        const newLoansCount = currentMonthLoans.length;
        const prevLoansAmount = prevMonthLoans.reduce((sum, loan) => sum + Number(loan.jumlah), 0);
        const newLoansChange = calculatePercentageChange(prevLoansAmount, newLoansAmount);
        
        // Calculate new members metrics
        const newMembersCount = memberStats?.newMembers || 0;
        const { data: prevMonthMembers, error: prevMembersError } = await supabase
          .from('anggota')
          .select('id')
          .gte('created_at', startOfMonth(lastMonth).toISOString())
          .lte('created_at', endOfMonth(lastMonth).toISOString());
        
        if (prevMembersError) throw prevMembersError;
        
        const prevMonthMembersCount = prevMonthMembers.length;
        const newMembersChange = calculatePercentageChange(prevMonthMembersCount, newMembersCount);
        
        // Generate reports data
        const reports: Report[] = [
          {
            id: 'report-monthly-' + format(currentDate, 'yyyy-MM'),
            title: 'Laporan Bulanan ' + format(currentDate, 'MMMM yyyy', { locale: id }),
            description: 'Ringkasan keuangan dan operasional bulan ' + format(currentDate, 'MMMM yyyy', { locale: id }),
            period: format(currentDate, 'MMMM yyyy', { locale: id }),
            date: format(currentDate, 'dd MMMM yyyy', { locale: id }),
            type: 'monthly'
          },
          {
            id: 'report-quarterly-' + Math.ceil((currentDate.getMonth() + 1) / 3) + '-' + currentDate.getFullYear(),
            title: 'Laporan Triwulan ' + Math.ceil((currentDate.getMonth() + 1) / 3) + ' ' + currentDate.getFullYear(),
            description: 'Ringkasan keuangan dan operasional triwulan ' + Math.ceil((currentDate.getMonth() + 1) / 3) + ' ' + currentDate.getFullYear(),
            period: 'Triwulan ' + Math.ceil((currentDate.getMonth() + 1) / 3) + ' ' + currentDate.getFullYear(),
            date: format(currentDate, 'dd MMMM yyyy', { locale: id }),
            type: 'quarterly'
          },
          {
            id: 'report-annual-' + (currentDate.getFullYear() - 1),
            title: 'Laporan Tahunan ' + (currentDate.getFullYear() - 1),
            description: 'Ringkasan keuangan dan operasional tahun ' + (currentDate.getFullYear() - 1),
            period: 'Tahun ' + (currentDate.getFullYear() - 1),
            date: '31 Desember ' + (currentDate.getFullYear() - 1),
            type: 'annual'
          }
        ];
        
        console.log('Ketua dashboard data fetched with performance metrics');
        
        setDashboardData({
          totalMembers: members,
          pendingRegistrations: registrations,
          activeLoans: loans,
          currentMonthTransactions: transactions,
          recentActivities: activities,
          // Performance metrics
          financialSummary,
          memberStats,
          loanStats,
          newLoansAmount,
          newLoansCount,
          newLoansChange,
          newMembersCount,
          newMembersChange,
          // Reports
          reports,
          // Preserve existing system alerts until they're fetched separately
          systemAlerts: dashboardData.systemAlerts
        });
        
        // After setting the initial dashboard data, fetch system alerts
        // This needs to happen after we have financial data for some alerts
        await fetchSystemAlerts();
        
      } catch (error) {
        console.error('Error fetching ketua dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchDashboardData();
  }, []);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Report Viewing Modal */}
      <Dialog open={showReportModal} onOpenChange={setShowReportModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedReport?.title}</DialogTitle>
            <DialogDescription>
              Periode: {selectedReport?.period} | Tanggal: {selectedReport?.date}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="space-y-6">
              {/* Financial Summary Section */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Ringkasan Keuangan</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">Pendapatan</p>
                    <p className="text-xl font-bold">{dashboardData.financialSummary ? formatCurrency(dashboardData.financialSummary.totalIncome) : '-'}</p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">Pengeluaran</p>
                    <p className="text-xl font-bold">{dashboardData.financialSummary ? formatCurrency(dashboardData.financialSummary.totalExpense) : '-'}</p>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">Keuntungan Bersih</p>
                    <p className="text-xl font-bold">{dashboardData.financialSummary ? formatCurrency(dashboardData.financialSummary.netProfit) : '-'}</p>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">Margin Keuntungan</p>
                    <p className="text-xl font-bold">{dashboardData.financialSummary ? dashboardData.financialSummary.profitMarginRatio.toFixed(1) + '%' : '-'}</p>
                  </div>
                </div>
              </div>
              
              {/* Member Statistics Section */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Statistik Anggota</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">Total Anggota</p>
                    <p className="text-xl font-bold">{dashboardData.memberStats?.totalMembers || 0}</p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">Anggota Aktif</p>
                    <p className="text-xl font-bold">{dashboardData.memberStats?.activeMembers || 0}</p>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">Anggota Baru</p>
                    <p className="text-xl font-bold">{dashboardData.memberStats?.newMembers || 0}</p>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">Anggota Tidak Aktif</p>
                    <p className="text-xl font-bold">{dashboardData.memberStats?.inactiveMembers || 0}</p>
                  </div>
                </div>
              </div>
              
              {/* Loan Statistics Section */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Statistik Pinjaman</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">Total Pinjaman</p>
                    <p className="text-xl font-bold">{dashboardData.loanStats?.totalLoans || 0}</p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">Pinjaman Aktif</p>
                    <p className="text-xl font-bold">{dashboardData.loanStats?.activeLoans || 0}</p>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">Pinjaman Lunas</p>
                    <p className="text-xl font-bold">{dashboardData.loanStats?.completedLoans || 0}</p>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">Pinjaman Bermasalah</p>
                    <p className="text-xl font-bold">{dashboardData.loanStats?.problematicLoans || 0}</p>
                  </div>
                </div>
              </div>
              
              {/* Additional Report Information */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Informasi Tambahan</h3>
                <div className="bg-muted/30 p-4 rounded-lg">
                  <p className="text-sm">Laporan ini berisi ringkasan kinerja koperasi untuk periode {selectedReport?.period}. Data yang disajikan mencakup pendapatan, pengeluaran, statistik anggota, dan informasi pinjaman.</p>
                  <p className="text-sm mt-2">Untuk informasi lebih detail, silakan unduh laporan lengkap dalam format PDF.</p>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReportModal(false)}>
              <X className="mr-2 h-4 w-4" />
              Tutup
            </Button>
            <Button onClick={() => selectedReport && handleDownloadPDF(selectedReport)} disabled={isGeneratingReport}>
              {isGeneratingReport ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyiapkan PDF...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Unduh PDF
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard Ketua</h2>
        <div className="flex items-center space-x-2">
          <ThemeToggle variant="ghost" size="sm" />
          <div className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm font-medium">
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
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Memuat data...</span>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="bg-gradient-to-br from-blue-400 to-blue-500 text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Nasabah</CardTitle>
                  <Users className="h-4 w-4 text-white" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardData.totalMembers}</div>
                  <p className="text-xs text-blue-100">Anggota aktif</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-indigo-400 to-indigo-500 text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Transaksi Bulan Ini</CardTitle>
                  <CreditCard className="h-4 w-4 text-white" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(dashboardData.currentMonthTransactions)}</div>
                  <p className="text-xs text-indigo-100">Total nilai transaksi</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-cyan-400 to-cyan-500 text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pinjaman Aktif</CardTitle>
                  <Wallet className="h-4 w-4 text-white" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardData.activeLoans.count}</div>
                  <p className="text-xs text-cyan-100">{formatCurrency(dashboardData.activeLoans.amount)}</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-teal-400 to-teal-500 text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Anggota</CardTitle>
                  <Users className="h-4 w-4 text-white" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardData.totalMembers}</div>
                  <p className="text-xs text-teal-100">Anggota terdaftar</p>
                </CardContent>
              </Card>
            </div>
          )}
          
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
                      <p className="text-2xl font-bold">{dashboardData.financialSummary ? formatCurrency(dashboardData.financialSummary.totalIncome) : 'Memuat...'}</p>
                      <div className={`flex items-center text-sm ${dashboardData.financialSummary && dashboardData.financialSummary.profitMarginRatio > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {dashboardData.financialSummary && (
                          <>
                            <span className="font-medium">{dashboardData.financialSummary.profitMarginRatio > 0 ? '+' : ''}{dashboardData.financialSummary.profitMarginRatio.toFixed(1)}%</span>
                            <span className="ml-1">margin keuntungan</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Pengeluaran</p>
                      <p className="text-2xl font-bold">{dashboardData.financialSummary ? formatCurrency(dashboardData.financialSummary.totalExpense) : 'Memuat...'}</p>
                      <div className={`flex items-center text-sm ${dashboardData.financialSummary && dashboardData.financialSummary.operationalEfficiencyRatio < 100 ? 'text-green-600' : 'text-red-600'}`}>
                        {dashboardData.financialSummary && (
                          <>
                            <span className="font-medium">{dashboardData.financialSummary.operationalEfficiencyRatio < 100 ? '-' : '+'}{Math.abs(100 - dashboardData.financialSummary.operationalEfficiencyRatio).toFixed(1)}%</span>
                            <span className="ml-1">dari anggaran</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Pinjaman Baru</p>
                      <p className="text-2xl font-bold">{formatCurrency(dashboardData.newLoansAmount)}</p>
                      <div className={`flex items-center text-sm ${dashboardData.newLoansChange >= 0 ? 'text-amber-600' : 'text-red-600'}`}>
                        <div className="flex items-center">
                          {dashboardData.newLoansChange >= 0 ? (
                            <TrendingUp className="mr-1 h-4 w-4" />
                          ) : (
                            <TrendingDown className="mr-1 h-4 w-4" />
                          )}
                          <span className="font-medium">{dashboardData.newLoansChange >= 0 ? '+' : ''}{dashboardData.newLoansChange.toFixed(1)}%</span>
                          <span className="ml-1">dari bulan lalu</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Anggota Baru</p>
                      <p className="text-2xl font-bold">{dashboardData.newMembersCount}</p>
                      <div className={`flex items-center text-sm ${dashboardData.newMembersChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        <div className="flex items-center">
                          {dashboardData.newMembersChange >= 0 ? (
                            <TrendingUp className="mr-1 h-4 w-4" />
                          ) : (
                            <TrendingDown className="mr-1 h-4 w-4" />
                          )}
                          <span className="font-medium">{dashboardData.newMembersChange >= 0 ? '+' : ''}{dashboardData.newMembersChange.toFixed(1)}%</span>
                          <span className="ml-1">dari bulan lalu</span>
                        </div>
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
              {isLoading ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : dashboardData.recentActivities.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.recentActivities.map((activity: Activity) => {
                    // Determine icon and background based on activity type
                    let Icon = Eye;
                    let bgColor = "bg-blue-100";
                    let iconColor = "text-blue-600";
                    let actionLink = "#";
                    let actor = "Admin";
                    
                    if (activity.type === "transaction") {
                      Icon = CreditCard;
                      bgColor = "bg-green-100";
                      iconColor = "text-green-600";
                      actionLink = `/transactions?id=${activity.id}`;
                      actor = "Bendahara";
                    } else if (activity.type === "registration") {
                      Icon = UserPlus;
                      bgColor = "bg-amber-100";
                      iconColor = "text-amber-600";
                      actionLink = `/approvals?id=${activity.id}`;
                      actor = "Sekretaris";
                    } else if (activity.type === "loan") {
                      Icon = Wallet;
                      bgColor = "bg-purple-100";
                      iconColor = "text-purple-600";
                      actionLink = `/loans?id=${activity.id}`;
                      actor = "Admin";
                    }
                    
                    return (
                      <div key={activity.id} className="flex items-start gap-4 rounded-lg border p-4">
                        <div className={`mt-0.5 rounded-full p-1 ${bgColor}`}>
                          <Icon className={`h-4 w-4 ${iconColor}`} />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-sm font-medium">
                            {activity.description}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {`Dilakukan oleh: ${actor}`}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {formatRelativeTime(activity.created_at)}
                          </p>
                        </div>
                        <Link href={actionLink}>
                          <Button variant="outline" size="sm">
                            Lihat Detail
                          </Button>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Tidak ada aktivitas terbaru
                </div>
              )}
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
            <CardContent className="h-[400px] overflow-y-auto">
              {isLoading ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="ml-2">Memuat laporan...</span>
                </div>
              ) : dashboardData.reports.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.reports.map((report) => (
                    <div key={report.id} className="rounded-lg border p-4">
                      <h3 className="text-lg font-medium">{report.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {report.description}
                      </p>
                      <div className="mt-4 flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewReport(report)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Lihat Laporan
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDownloadPDF(report)}
                          disabled={isGeneratingReport}
                        >
                          {isGeneratingReport ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Menyiapkan PDF...
                            </>
                          ) : (
                            <>
                              <FileText className="mr-2 h-4 w-4" />
                              Unduh PDF
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-40 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">Tidak Ada Laporan</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Belum ada laporan yang tersedia saat ini
                  </p>
                </div>
              )}
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
            <CardContent className="h-[400px] overflow-y-auto">
              {isLoadingAlerts ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="ml-2">Memuat peringatan...</span>
                </div>
              ) : dashboardData.systemAlerts.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.systemAlerts.map((alert) => {
                    // Determine styling based on alert severity
                    let bgColor = "bg-blue-50";
                    let borderColor = "border-blue-200";
                    let textColor = "text-blue-800";
                    let descriptionColor = "text-blue-700";
                    let timeColor = "text-blue-600";
                    let iconBgColor = "bg-blue-100";
                    let iconColor = "text-blue-600";
                    let buttonBgColor = "bg-blue-100";
                    let buttonHoverColor = "hover:bg-blue-200";
                    let buttonTextColor = "text-blue-800";
                    let Icon = AlertTriangle;
                    
                    if (alert.severity === 'success') {
                      bgColor = "bg-green-50";
                      borderColor = "border-green-200";
                      textColor = "text-green-800";
                      descriptionColor = "text-green-700";
                      timeColor = "text-green-600";
                      iconBgColor = "bg-green-100";
                      iconColor = "text-green-600";
                      buttonBgColor = "bg-green-100";
                      buttonHoverColor = "hover:bg-green-200";
                      buttonTextColor = "text-green-800";
                      Icon = TrendingUp;
                    } else if (alert.severity === 'warning') {
                      bgColor = "bg-amber-50";
                      borderColor = "border-amber-200";
                      textColor = "text-amber-800";
                      descriptionColor = "text-amber-700";
                      timeColor = "text-amber-600";
                      iconBgColor = "bg-amber-100";
                      iconColor = "text-amber-600";
                      buttonBgColor = "bg-amber-100";
                      buttonHoverColor = "hover:bg-amber-200";
                      buttonTextColor = "text-amber-800";
                      Icon = AlertTriangle;
                    } else if (alert.severity === 'error') {
                      bgColor = "bg-red-50";
                      borderColor = "border-red-200";
                      textColor = "text-red-800";
                      descriptionColor = "text-red-700";
                      timeColor = "text-red-600";
                      iconBgColor = "bg-red-100";
                      iconColor = "text-red-600";
                      buttonBgColor = "bg-red-100";
                      buttonHoverColor = "hover:bg-red-200";
                      buttonTextColor = "text-red-800";
                      Icon = AlertTriangle;
                    } else if (alert.severity === 'info') {
                      bgColor = "bg-blue-50";
                      borderColor = "border-blue-200";
                      textColor = "text-blue-800";
                      descriptionColor = "text-blue-700";
                      timeColor = "text-blue-600";
                      iconBgColor = "bg-blue-100";
                      iconColor = "text-blue-600";
                      buttonBgColor = "bg-blue-100";
                      buttonHoverColor = "hover:bg-blue-200";
                      buttonTextColor = "text-blue-800";
                      Icon = FileText;
                    }
                    
                    return (
                      <div key={alert.id} className={`flex items-start gap-4 rounded-lg border ${borderColor} ${bgColor} p-4`}>
                        <div className={`mt-0.5 rounded-full p-1 ${iconBgColor}`}>
                          <Icon className={`h-4 w-4 ${iconColor}`} />
                        </div>
                        <div className="flex-1">
                          <h3 className={`text-sm font-medium ${textColor}`}>
                            {alert.title}
                          </h3>
                          <p className={`text-sm ${descriptionColor} mt-1`}>
                            {alert.description}
                          </p>
                          <p className={`mt-1 text-xs ${timeColor}`}>
                            {formatRelativeTime(alert.created_at)}
                          </p>
                        </div>
                        {alert.link && (
                          <Link href={alert.link}>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className={`border-${borderColor.split('-')[1]} ${buttonBgColor} ${buttonHoverColor} ${buttonTextColor}`}
                            >
                              {alert.linkText || 'Lihat Detail'}
                            </Button>
                          </Link>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-40 text-center">
                  <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">Tidak Ada Peringatan</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Tidak ada peringatan sistem yang perlu diperhatikan saat ini
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
