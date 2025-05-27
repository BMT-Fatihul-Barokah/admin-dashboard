"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/lib/admin-auth-context";
import { RoleProtected } from "@/components/role-protected";
import { getRoleTheme } from "@/lib/role-theme";
import { createClient } from "@supabase/supabase-js";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { format, parseISO, startOfMonth, endOfMonth, subMonths, differenceInMonths, addMonths } from "date-fns";
import {
  ImprovedTrendChart,
  ImprovedPieChart,
  ImprovedBarChart,
  ImprovedLineChart,
  ImprovedDarkLineChart,
  ImprovedDualAxisBarChart,
  CustomTooltip,
  CHART_COLORS
} from "./fixed-charts";

import { StatusDistributionPieChart } from "./fixed-pie-charts";

import { 
  AreaChart, 
  Area, 
  BarChart as RechartsBarChart, 
  Bar, 
  LineChart as RechartsLineChart, 
  Line, 
  PieChart as RechartsPieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Define types for analytics data
type MonthlyData = {
  month: string;
  name: string;
  value: number;
  count?: number;
  amount?: number;
};

type StatusDistribution = {
  name: string;
  value: number;
  percentage?: number;
};

interface AnalyticsData {
  registrationData: MonthlyData[];
  loanData: MonthlyData[];
  transactionData: MonthlyData[];
  statusDistribution: StatusDistribution[];
  loanStatusDistribution: StatusDistribution[];
  loanTypeDistribution: StatusDistribution[];
  totalRegistrations: number;
  totalLoanAmount: number;
  totalTransactionAmount: number;
  activeLoans: number;
  approvalRate: number;
}

// Colors for charts - using the imported CHART_COLORS from fixed-charts.tsx

// Helper function to generate month ranges
const generateMonthRanges = (months: number): { start: Date, end: Date, label: string }[] => {
  const ranges = [];
  const today = new Date();
  
  for (let i = months - 1; i >= 0; i--) {
    const date = subMonths(today, i);
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    const label = format(date, 'MMM yyyy');
    ranges.push({ start, end, label });
  }
  
  return ranges;
};

// Helper function to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

// Function to fetch analytics data from Supabase
const fetchAnalyticsData = async (timeRange: string): Promise<AnalyticsData> => {
  // Determine date range based on selected time range
  const months = timeRange === '6months' ? 6 : 12;
  const monthRanges = generateMonthRanges(months);
  const startDate = monthRanges[0].start.toISOString();
  
  // Initialize empty data structure
  const registrationData: MonthlyData[] = [];
  const loanData: MonthlyData[] = [];
  const transactionData: MonthlyData[] = [];
  const statusDistribution: StatusDistribution[] = [];
  const loanStatusDistribution: StatusDistribution[] = [];
  const loanTypeDistribution: StatusDistribution[] = [];
  
  // 1. Fetch registration data by month
  const { data: anggotaData, error: anggotaError } = await supabase
    .from('anggota')
    .select('created_at, is_active')
    .gte('created_at', startDate);
  
  if (anggotaError) {
    console.error('Error fetching anggota data:', anggotaError);
    throw new Error('Failed to fetch registration data');
  }
  
  // Process registration data by month
  monthRanges.forEach(range => {
    const count = anggotaData?.filter(anggota => {
      const createdAt = new Date(anggota.created_at);
      return createdAt >= range.start && createdAt <= range.end;
    }).length || 0;
    
    registrationData.push({
      month: range.label,
      name: range.label,
      value: count,
      count
    });
  });
  
  // 2. Fetch loan data by month using the new loan_trend_view
  const { data: loanTrendData, error: loanTrendError } = await supabase
    .from('loan_trend_view')
    .select('*')
    .gte('month', startDate);
  
  if (loanTrendError) {
    console.error('Error fetching loan trend data:', loanTrendError);
    throw new Error('Failed to fetch loan trend data');
  }
  
  // Process loan data by month
  monthRanges.forEach(range => {
    // Find matching month in the loan trend data
    const matchingMonth = loanTrendData?.find(trend => {
      const trendMonth = new Date(trend.month);
      const rangeMonth = range.start.getMonth();
      const rangeYear = range.start.getFullYear();
      return trendMonth.getMonth() === rangeMonth && trendMonth.getFullYear() === rangeYear;
    });
    
    const amount = matchingMonth ? Number(matchingMonth.total_amount) : 0;
    
    loanData.push({
      month: range.label,
      name: range.label,
      value: amount,
      amount
    });
  });
  
  // Also fetch all loan data for other calculations
  const { data: pinjamanData, error: pinjamanError } = await supabase
    .from('pinjaman')
    .select('jumlah, created_at, status, jenis_pinjaman')
    .gte('created_at', startDate);
  
  if (pinjamanError) {
    console.error('Error fetching pinjaman data:', pinjamanError);
    throw new Error('Failed to fetch loan data');
  }
  
  // 3. Fetch transaction data by month
  const { data: transaksiData, error: transaksiError } = await supabase
    .from('transaksi')
    .select('jumlah, created_at, tipe_transaksi')
    .gte('created_at', startDate);
  
  if (transaksiError) {
    console.error('Error fetching transaksi data:', transaksiError);
    throw new Error('Failed to fetch transaction data');
  }
  
  // Process transaction data by month
  monthRanges.forEach(range => {
    const transactionsInMonth = transaksiData?.filter(transaksi => {
      const createdAt = new Date(transaksi.created_at);
      return createdAt >= range.start && createdAt <= range.end;
    }) || [];
    
    const amount = transactionsInMonth.reduce((sum, transaction) => {
      // Only count incoming transactions for the total
      if (transaction.tipe_transaksi === 'masuk') {
        return sum + Number(transaction.jumlah);
      }
      return sum;
    }, 0);
    
    transactionData.push({
      month: range.label,
      name: range.label,
      value: amount,
      amount
    });
  });
  
  // 4. Calculate status distribution
  const activeCount = anggotaData?.filter(anggota => anggota.is_active).length || 0;
  const inactiveCount = (anggotaData?.length || 0) - activeCount;
  
  statusDistribution.push(
    { name: 'Aktif', value: activeCount },
    { name: 'Tidak Aktif', value: inactiveCount }
  );
  
  // 5. Calculate loan status distribution
  const loanStatusCounts: Record<string, number> = {};
  pinjamanData?.forEach(pinjaman => {
    const status = pinjaman.status;
    loanStatusCounts[status] = (loanStatusCounts[status] || 0) + 1;
  });
  
  Object.entries(loanStatusCounts).forEach(([status, count]) => {
    loanStatusDistribution.push({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count
    });
  });
  
  // 6. Calculate loan type distribution using the new loan_type_distribution_view
  const { data: loanTypeData, error: loanTypeError } = await supabase
    .from('loan_type_distribution_view')
    .select('*');
  
  if (loanTypeError) {
    console.error('Error fetching loan type distribution:', loanTypeError);
    // Fallback to the old calculation method if the view query fails
    const loanTypeCounts: Record<string, number> = {};
    pinjamanData?.forEach(pinjaman => {
      const type = pinjaman.jenis_pinjaman;
      loanTypeCounts[type] = (loanTypeCounts[type] || 0) + 1;
    });
    
    Object.entries(loanTypeCounts).forEach(([type, count]) => {
      loanTypeDistribution.push({
        name: type,
        value: count
      });
    });
  } else {
    // Use the normalized data from the view
    loanTypeData?.forEach(item => {
      loanTypeDistribution.push({
        name: item.name,
        value: item.count,
        percentage: item.count_percentage
      });
    });
  }
  
  // Calculate summary metrics
  const totalRegistrations = registrationData.reduce((sum, item) => sum + item.value, 0);
  const totalLoanAmount = loanData.reduce((sum, item) => sum + item.value, 0);
  const totalTransactionAmount = transactionData.reduce((sum, item) => sum + item.value, 0);
  const activeLoans = pinjamanData?.filter(loan => loan.status === 'aktif').length || 0;
  const approvedLoans = pinjamanData?.filter(loan => ['aktif', 'lunas', 'disetujui'].includes(loan.status)).length || 0;
  const totalLoans = pinjamanData?.length || 0;
  const approvalRate = totalLoans > 0 ? Math.round((approvedLoans / totalLoans) * 100) : 0;
  
  return {
    registrationData,
    loanData,
    transactionData,
    statusDistribution,
    loanStatusDistribution,
    loanTypeDistribution,
    totalRegistrations,
    totalLoanAmount,
    totalTransactionAmount,
    activeLoans,
    approvalRate
  };
};

export default function AnalyticsPage() {
  const { toast } = useToast();
  const { user } = useAdminAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("6months");
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  
  // Get role-specific theme
  const roleTheme = user ? getRoleTheme(user.role) : { primary: "", secondary: "", badge: "" };
  
  // Function to load data
  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchAnalyticsData(timeRange);
      setAnalyticsData(data);
    } catch (error) {
      console.error('Error loading analytics data:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data analitik",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load data on component mount or when timeRange changes
  useEffect(() => {
    loadData();
  }, [timeRange]);
  
  // Using the CustomTooltip from fixed-charts.tsx
  
  // Render the summary cards
  const renderSummaryCards = () => {
    if (!analyticsData) return null;
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Anggota</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.totalRegistrations}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Dalam {timeRange === "6months" ? "6 bulan" : "1 tahun"} terakhir
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Pinjaman</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analyticsData.totalLoanAmount)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Dalam {timeRange === "6months" ? "6 bulan" : "1 tahun"} terakhir
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pinjaman Aktif</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.activeLoans}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Pinjaman yang sedang berjalan
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tingkat Persetujuan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.approvalRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Persentase pinjaman yang disetujui
            </p>
          </CardContent>
        </Card>
      </div>
    );
  };
  
  // Role-specific content
  const renderRoleSpecificContent = () => {
    if (!user || !analyticsData) return null;
    
    switch (user.role) {
      case 'admin':
        return (
          <>
            <Card className={`${roleTheme.secondary} border-none`}>
              <CardHeader>
                <CardTitle>Tren Pinjaman dan Pendaftaran</CardTitle>
                <CardDescription className="text-white/70">
                  Perbandingan tren pinjaman dan pendaftaran nasabah dalam {timeRange === "6months" ? "6 bulan" : "1 tahun"} terakhir
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ImprovedDualAxisBarChart 
                  data={analyticsData.loanData} 
                  formatCurrency={formatCurrency} 
                />
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Distribusi Status Pinjaman</CardTitle>
                  <CardDescription>
                    Distribusi pinjaman berdasarkan status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ImprovedPieChart 
                    data={analyticsData.loanStatusDistribution} 
                    formatCurrency={formatCurrency} 
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Tren Transaksi</CardTitle>
                  <CardDescription>
                    Tren transaksi masuk dalam {timeRange === "6months" ? "6 bulan" : "1 tahun"} terakhir
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ImprovedLineChart 
                    data={analyticsData.transactionData} 
                    dataKey="value" 
                    name="Jumlah Transaksi" 
                    formatCurrency={formatCurrency} 
                  />
                </CardContent>
              </Card>
            </div>
          </>
        );

      case 'ketua':
        return (
          <>
            <Card className={`${roleTheme.secondary} border-none`}>
              <CardHeader>
                <CardTitle>Ringkasan Kinerja Koperasi</CardTitle>
                <CardDescription className="text-white/70">
                  Ringkasan kinerja koperasi dalam {timeRange === "6months" ? "6 bulan" : "1 tahun"} terakhir
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ImprovedTrendChart 
                  data={analyticsData.transactionData} 
                  dataKey="value" 
                  name="Total Transaksi" 
                  formatCurrency={formatCurrency} 
                />
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Tren Pendaftaran Nasabah</CardTitle>
                  <CardDescription>
                    Tren pendaftaran nasabah dalam {timeRange === "6months" ? "6 bulan" : "1 tahun"} terakhir
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ImprovedLineChart 
                    data={analyticsData.registrationData} 
                    dataKey="value" 
                    name="Jumlah Pendaftaran" 
                    formatCurrency={formatCurrency} 
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Distribusi Status Anggota</CardTitle>
                  <CardDescription>
                    Distribusi status anggota koperasi
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={analyticsData.statusDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {analyticsData.statusDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        );

      case 'sekretaris':
        return (
          <>
            <Card className={`${roleTheme.secondary} border-none`}>
              <CardHeader>
                <CardTitle>Tren Pendaftaran Nasabah</CardTitle>
                <CardDescription className="text-white/70">
                  Tren pendaftaran nasabah dalam {timeRange === "6months" ? "6 bulan" : "1 tahun"} terakhir
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ImprovedDarkLineChart 
                  data={analyticsData.registrationData} 
                  dataKey="value" 
                  name="Jumlah Pendaftaran" 
                  formatCurrency={formatCurrency} 
                />
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Distribusi Status Anggota</CardTitle>
                  <CardDescription>
                    Distribusi status anggota koperasi
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={analyticsData.statusDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {analyticsData.statusDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Aktivitas Pendaftaran Bulanan</CardTitle>
                  <CardDescription>
                    Jumlah pendaftaran per bulan
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ImprovedBarChart 
                    data={analyticsData.registrationData} 
                    dataKey="value" 
                    name="Jumlah Pendaftaran" 
                    formatCurrency={formatCurrency} 
                  />
                </CardContent>
              </Card>
            </div>
          </>
        );

      case 'bendahara':
        return (
          <>
            <Card className={`${roleTheme.secondary} border-none`}>
              <CardHeader>
                <CardTitle>Tren Pinjaman</CardTitle>
                <CardDescription className="text-white/70">
                  Tren pinjaman dalam {timeRange === "6months" ? "6 bulan" : "1 tahun"} terakhir
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ImprovedTrendChart 
                  data={analyticsData.loanData} 
                  dataKey="value" 
                  name="Jumlah Pinjaman" 
                  formatCurrency={formatCurrency}
                  isDarkTheme={true} 
                />
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Distribusi Jenis Pinjaman</CardTitle>
                  <CardDescription>
                    Distribusi jenis pinjaman
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ImprovedPieChart 
                    data={analyticsData.loanTypeDistribution} 
                    formatCurrency={formatCurrency} 
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Status Pinjaman</CardTitle>
                  <CardDescription>
                    Distribusi status pinjaman
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ImprovedBarChart 
                    data={analyticsData.loanStatusDistribution} 
                    dataKey="value" 
                    name="Jumlah Pinjaman" 
                    formatCurrency={formatCurrency} 
                  />
                </CardContent>
              </Card>
            </div>
          </>
        );

      default:
        return null;
    }
  };
  
  return (
    <RoleProtected allowedRoles={['admin', 'ketua', 'sekretaris', 'bendahara']}>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Analitik</h1>
          <div className="flex items-center gap-4">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Pilih Rentang Waktu" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="6months">6 Bulan Terakhir</SelectItem>
                <SelectItem value="1year">1 Tahun Terakhir</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" disabled={isLoading} onClick={loadData}>
              {isLoading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></div>
                  Memuat
                </>
              ) : (
                "Refresh"
              )}
            </Button>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Memuat data analitik...</p>
          </div>
        ) : analyticsData ? (
          <>
            {renderSummaryCards()}
            {renderRoleSpecificContent()}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">Tidak ada data analitik yang tersedia</p>
            <Button variant="outline" className="mt-4" onClick={loadData}>
              Coba Lagi
            </Button>
          </div>
        )}
      </div>
    </RoleProtected>
  );
}
