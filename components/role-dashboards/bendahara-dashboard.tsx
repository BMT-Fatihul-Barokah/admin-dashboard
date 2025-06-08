"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart3, CreditCard, Wallet, FileText, Bell, DollarSign, Calculator, 
  ArrowUpRight, ArrowDownRight, Loader2, TrendingUp, TrendingDown, 
  PieChart, Activity, BarChart, CircleDollarSign, Landmark, PiggyBank
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";
import { useAdminAuth } from "@/lib/admin-auth-context";
import { 
  getTotalAnggota, 
  getTotalActivePinjaman, 
  getRecentActivities 
} from '@/lib/dashboard-data';
import { getFinancialSummary } from '@/lib/financial-data';
import { supabase } from '@/lib/supabase';
import { format, parseISO, formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";

// Activity type definition
type Activity = {
  id: string;
  type: 'transaction' | 'registration' | 'loan';
  description: string;
  amount?: number;
  created_at: string;
  status?: string;
};

// Financial summary type
type FinancialSummary = {
  current_month: {
    income: number;
    expenses: number;
    balance: number;
    income_change: number;
    expenses_change: number;
  };
  previous_month: {
    income: number;
    expenses: number;
    balance: number;
  };
  total_savings: number;
  total_loans: {
    amount: number;
    count: number;
  };
  top_income_categories?: Array<{
    transaction_type: string;
    total: number;
  }>;
  monthly_trend?: Array<{
    month: string;
    income: number;
    expenses: number;
    balance: number;
  }>;
}

export function BendaraDashboard() {
  const { user } = useAdminAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    totalMembers: 0,
    activeLoans: { count: 0, amount: 0 },
    financialSummary: {
      current_month: { income: 0, expenses: 0, balance: 0, income_change: 0, expenses_change: 0 },
      previous_month: { income: 0, expenses: 0, balance: 0 },
      total_savings: 0,
      total_loans: { amount: 0, count: 0 },
      top_income_categories: [],
      monthly_trend: []
    } as FinancialSummary,
    recentActivities: [] as Activity[]
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
  
  // Transaction type formatter
  const formatTransactionType = (type: string) => {
    return type === 'masuk' ? 'Penerimaan' : 'Pengeluaran';
  };
  
  // Get trend icon based on percentage change
  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return null;
  };
  
  useEffect(() => {
    async function fetchDashboardData() {
      setIsLoading(true);
      try {
        console.log('Fetching bendahara dashboard data...');
        const [members, loans, financialSummary, activities] = await Promise.all([
          getTotalAnggota(),
          getTotalActivePinjaman(),
          getFinancialSummary(),
          getRecentActivities(5)
        ]);
        
        console.log('Bendahara dashboard data fetched:', {
          members,
          loans,
          financialSummary,
          activitiesCount: activities.length
        });
        
        setDashboardData({
          totalMembers: members,
          activeLoans: loans,
          financialSummary,
          recentActivities: activities.filter(a => a.type === 'transaction')
        });
      } catch (error) {
        console.error('Error fetching bendahara dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchDashboardData();
  }, []);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard Bendahara</h2>
        <div className="flex items-center space-x-2">
          <ThemeToggle variant="ghost" size="sm" />
          <div className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-3 py-1 rounded-full text-sm font-medium">
            Mode Keuangan
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
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Memuat data...</span>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* Income Card */}
              <Card className="bg-gradient-to-br from-green-400 to-green-600 text-white shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pendapatan Bulan Ini</CardTitle>
                  <div className="p-1 bg-white/20 rounded-full">
                    <PiggyBank className="h-4 w-4 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(dashboardData.financialSummary.current_month.income)}</div>
                  <div className="flex items-center mt-1">
                    {dashboardData.financialSummary.current_month.income_change > 0 ? (
                      <ArrowUpRight className="h-3 w-3 text-green-100 mr-1" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 text-red-100 mr-1" />
                    )}
                    <p className="text-xs text-green-100">
                      {Math.abs(dashboardData.financialSummary.current_month.income_change).toFixed(1)}% dari bulan lalu
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              {/* Expenses Card */}
              <Card className="bg-gradient-to-br from-red-400 to-red-600 text-white shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pengeluaran Bulan Ini</CardTitle>
                  <div className="p-1 bg-white/20 rounded-full">
                    <Calculator className="h-4 w-4 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(dashboardData.financialSummary.current_month.expenses)}</div>
                  <div className="flex items-center mt-1">
                    {dashboardData.financialSummary.current_month.expenses_change > 0 ? (
                      <ArrowUpRight className="h-3 w-3 text-red-100 mr-1" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 text-green-100 mr-1" />
                    )}
                    <p className="text-xs text-red-100">
                      {Math.abs(dashboardData.financialSummary.current_month.expenses_change).toFixed(1)}% dari bulan lalu
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              {/* Balance Card */}
              <Card className="bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Saldo Bulan Ini</CardTitle>
                  <div className="p-1 bg-white/20 rounded-full">
                    <Wallet className="h-4 w-4 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(dashboardData.financialSummary.current_month.balance)}</div>
                  <p className="text-xs text-blue-100">Selisih pendapatan dan pengeluaran</p>
                </CardContent>
              </Card>
              
              {/* Total Savings Card */}
              <Card className="bg-gradient-to-br from-purple-400 to-purple-600 text-white shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Tabungan</CardTitle>
                  <div className="p-1 bg-white/20 rounded-full">
                    <Landmark className="h-4 w-4 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(dashboardData.financialSummary.total_savings)}</div>
                  <p className="text-xs text-purple-100">Seluruh tabungan anggota aktif</p>
                </CardContent>
              </Card>
            </div>
          )}
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Ringkasan Keuangan</CardTitle>
                <CardDescription>
                  Ringkasan keuangan koperasi bulan ini
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Savings and Loans Progress */}
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">Total Tabungan</span>
                      <span className="text-sm font-medium">{formatCurrency(dashboardData.financialSummary.total_savings)}</span>
                    </div>
                    <Progress value={75} className="h-2 bg-blue-100" />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">Total Pinjaman</span>
                      <span className="text-sm font-medium">{formatCurrency(dashboardData.financialSummary.total_loans.amount)}</span>
                    </div>
                    <Progress value={40} className="h-2 bg-red-100" />
                  </div>
                </div>
                
                {/* Top Income Categories */}
                <div>
                  <h4 className="text-sm font-medium mb-3">Kategori Pemasukan Teratas</h4>
                  <div className="space-y-2">
                    {dashboardData.financialSummary.top_income_categories && dashboardData.financialSummary.top_income_categories.length > 0 ? (
                      dashboardData.financialSummary.top_income_categories.slice(0, 3).map((category, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className={`w-3 h-3 rounded-full mr-2 ${
                              index === 0 ? 'bg-green-500' : 
                              index === 1 ? 'bg-blue-500' : 'bg-purple-500'
                            }`}></div>
                            <span className="text-sm">{category.transaction_type === 'masuk' ? 'Penerimaan' : 'Pengeluaran'}</span>
                          </div>
                          <span className="text-sm font-medium">{formatCurrency(category.total)}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-muted-foreground">Tidak ada data transaksi</div>
                    )}
                  </div>
                </div>
                
                {/* Monthly Trend */}
                <div>
                  <h4 className="text-sm font-medium mb-3">Tren Bulanan</h4>
                  <div className="space-y-2">
                    {dashboardData.financialSummary.monthly_trend && dashboardData.financialSummary.monthly_trend.length > 0 ? (
                      <div className="grid grid-cols-3 gap-2">
                        {dashboardData.financialSummary.monthly_trend.slice(-3).map((month, index) => (
                          <div key={index} className="p-2 border rounded-md">
                            <div className="text-xs text-muted-foreground">{month.month}</div>
                            <div className="flex items-center mt-1">
                              <DollarSign className="h-3 w-3 text-green-500 mr-1" />
                              <span className="text-xs">{formatCurrency(month.income)}</span>
                            </div>
                            <div className="flex items-center mt-1">
                              <Calculator className="h-3 w-3 text-red-500 mr-1" />
                              <span className="text-xs">{formatCurrency(month.expenses)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">Tidak ada data tren</div>
                    )}
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
                  <h3 className="text-lg font-medium">
                    {isLoading ? (
                      <span>Transaksi Terbaru (Loading...)</span>
                    ) : (
                      <span>Transaksi Bulan {format(new Date(), 'MMMM yyyy', { locale: id })}</span>
                    )}
                  </h3>
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
                  
                  {isLoading ? (
                    <div className="p-8 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                      <p className="text-muted-foreground">Memuat data transaksi...</p>
                    </div>
                  ) : dashboardData.recentActivities.length > 0 ? (
                    dashboardData.recentActivities.map((activity) => {
                      const isIncome = activity.description.toLowerCase().includes('pemasukan') || 
                                      activity.description.toLowerCase().includes('penerimaan') || 
                                      activity.description.toLowerCase().includes('masuk');
                      return (
                        <div key={activity.id} className="grid grid-cols-5 gap-4 p-4 border-b last:border-0">
                          <div>{format(parseISO(activity.created_at), 'dd MMM yyyy', { locale: id })}</div>
                          <div>{activity.id}</div>
                          <div>{isIncome ? 'Pemasukan' : 'Pengeluaran'}</div>
                          <div className={isIncome ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                            {activity.amount ? `${isIncome ? '+ ' : '- '}${formatCurrency(activity.amount)}` : '-'}
                          </div>
                          <div>
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                              {activity.status || 'Selesai'}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-8 text-center text-muted-foreground">
                      Tidak ada transaksi terbaru
                    </div>
                  )}
                </div>
                
                <div className="flex justify-center mt-4">
                  <Link href="/transactions/new">
                    <Button>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Catat Transaksi Baru
                    </Button>
                  </Link>
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
                  <h3 className="text-lg font-medium">
                    {isLoading ? (
                      <span>Pinjaman Aktif (Loading...)</span>
                    ) : (
                      <span>Pinjaman Aktif ({dashboardData.activeLoans.count})</span>
                    )}
                  </h3>
                  <Link href="/loans">
                    <Button>
                      Lihat Semua
                    </Button>
                  </Link>
                </div>
                
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                  {isLoading ? (
                    <div className="col-span-2 p-8 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                      <p className="text-muted-foreground">Memuat data pinjaman...</p>
                    </div>
                  ) : dashboardData.activeLoans.count > 0 ? (
                    // In a real implementation, we would fetch actual loan data
                    // For now, we'll create placeholder items based on the count
                    Array.from({ length: Math.min(4, dashboardData.activeLoans.count) }).map((_, i) => {
                      const loanAmount = dashboardData.activeLoans.amount / dashboardData.activeLoans.count;
                      return (
                        <div key={i} className="rounded-lg border p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium">{`Anggota ${i + 1}`}</h4>
                              <p className="text-sm text-muted-foreground">{`ID Pinjaman: P-${1000 + i}`}</p>
                            </div>
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                              Aktif
                            </span>
                          </div>
                          
                          <div className="mt-4 space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Jumlah Pinjaman:</span>
                              <span className="font-medium">{formatCurrency(loanAmount)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Tanggal Mulai:</span>
                              <span>{format(new Date(new Date().setMonth(new Date().getMonth() - 1)), 'dd MMM yyyy', { locale: id })}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Jatuh Tempo:</span>
                              <span>{format(new Date(new Date().setMonth(new Date().getMonth() + 11)), 'dd MMM yyyy', { locale: id })}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Status Pembayaran:</span>
                              <span className="text-green-600 font-medium">Lancar</span>
                            </div>
                          </div>
                          
                          <div className="mt-4 flex justify-end gap-2">
                            <Button variant="outline" size="sm">
                              Detail
                            </Button>
                            <Button variant="outline" size="sm">
                              Catat Pembayaran
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="col-span-2 p-8 text-center text-muted-foreground">
                      Tidak ada pinjaman aktif saat ini
                    </div>
                  )}
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
                        {/* Generate last 6 months as options */}
                        {Array.from({ length: 6 }).map((_, i) => {
                          const date = new Date();
                          date.setMonth(date.getMonth() - i);
                          return (
                            <option key={i}>{format(date, 'MMMM yyyy', { locale: id })}</option>
                          );
                        })}
                        {/* Add quarterly options */}
                        <option>Triwulan {Math.ceil((new Date().getMonth() + 1) / 3)} {new Date().getFullYear()}</option>
                        <option>Triwulan {Math.ceil((new Date().getMonth() + 1) / 3) - 1 || 4} {Math.ceil((new Date().getMonth() + 1) / 3) - 1 ? new Date().getFullYear() : new Date().getFullYear() - 1}</option>
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
                  
                  {isLoading ? (
                    <div className="p-8 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                      <p className="text-muted-foreground">Memuat data laporan...</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* In a real implementation, we would fetch actual reports data */}
                      {/* For now, we'll create placeholder items with current date */}
                      {[1, 2, 3].map((i) => {
                        const reportDate = new Date();
                        reportDate.setDate(reportDate.getDate() - (i * 5));
                        
                        return (
                          <div key={i} className="rounded-lg border p-4">
                            <h4 className="font-medium">{`Laporan ${['Bulanan', 'Triwulan', 'Pinjaman'][i-1]} - ${format(reportDate, 'MMMM yyyy', { locale: id })}`}</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {`Dibuat pada ${format(reportDate, 'd MMMM yyyy', { locale: id })}`}
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
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
