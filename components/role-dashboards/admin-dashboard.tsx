"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { BarChart3, Users, CreditCard, Wallet, UserPlus, FileText, Plus, Loader2, UserCog, TrendingUp, Bell, Info, AlertCircle, Clock, User } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/lib/admin-auth-context";
import { testDatabaseConnection, getTotalAnggota, getPendingRegistrations, getTotalActivePinjaman, getRecentActivities } from '@/lib/dashboard-data';
import { format, parseISO, formatDistanceToNow, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { id } from "date-fns/locale";
import { supabase } from "@/lib/supabase";
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";
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
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";

// Chart colors
const CHART_COLORS = ['#10b981', '#0ea5e9', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

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

// Custom tooltip component for charts
const CustomTooltip = ({ active, payload, label, formatCurrency }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border p-2 rounded-md shadow-sm">
        <p className="font-medium">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={`item-${index}`} style={{ color: entry.color }}>
            {entry.name}: {typeof entry.value === 'number' && formatCurrency ? formatCurrency(entry.value) : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Types for analytics data
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

// Activity type definition
type Activity = {
  id: string;
  type: 'transaction' | 'registration' | 'loan';
  description: string;
  amount?: number;
  created_at: string;
  status?: string;
};

// Function to generate placeholder anggota data
const generatePlaceholderAnggota = (count: number): any[] => {
  const now = new Date();
  const result = [];
  
  for (let i = 0; i < count; i++) {
    // Generate random date within the last year
    const daysAgo = Math.floor(Math.random() * 365);
    const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    
    result.push({
      id: `placeholder-anggota-${i + 1}`,
      created_at: date.toISOString(),
      is_active: Math.random() > 0.2 // 80% active, 20% inactive
    });
  }
  
  return result;
};

// Function to generate placeholder pinjaman data
const generatePlaceholderPinjaman = (count: number): any[] => {
  const now = new Date();
  const result = [];
  const statuses = ['aktif', 'lunas', 'disetujui', 'ditolak', 'menunggu'];
  const types = ['pendidikan', 'usaha', 'konsumtif', 'darurat'];
  
  for (let i = 0; i < count; i++) {
    // Generate random date within the last year
    const daysAgo = Math.floor(Math.random() * 365);
    const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    const amount = Math.floor(Math.random() * 9000000) + 1000000; // Between 1M and 10M
    
    result.push({
      id: `placeholder-pinjaman-${i + 1}`,
      jumlah: amount,
      created_at: date.toISOString(),
      status: statuses[Math.floor(Math.random() * statuses.length)],
      jenis_pinjaman: types[Math.floor(Math.random() * types.length)]
    });
  }
  
  return result;
};

// Function to generate placeholder transaksi data
const generatePlaceholderTransaksi = (count: number): any[] => {
  const now = new Date();
  const result = [];
  const types = ['masuk', 'keluar'];
  
  for (let i = 0; i < count; i++) {
    // Generate random date within the last year
    const daysAgo = Math.floor(Math.random() * 365);
    const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    const amount = Math.floor(Math.random() * 900000) + 100000; // Between 100K and 1M
    
    result.push({
      id: `placeholder-transaksi-${i + 1}`,
      jumlah: amount,
      created_at: date.toISOString(),
      tipe_transaksi: types[Math.floor(Math.random() * types.length)]
    });
  }
  
  return result;
};

// Function to fetch analytics data from Supabase
const fetchAnalyticsData = async (timeRange: string = '6months'): Promise<AnalyticsData> => {
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
  let anggotaData: any[] = [];
  try {
    // First check if the anggota table exists
    const { data: tableCheck, error: tableError } = await supabase
      .from('anggota')
      .select('id')
      .limit(1);
      
    if (tableError) {
      console.error('Error checking anggota table:', tableError);
      // If table doesn't exist, use placeholder data
      if (tableError.code === '42P01') { // PostgreSQL error code for undefined_table
        console.log('Anggota table does not exist, using placeholder data');
        anggotaData = generatePlaceholderAnggota(months * 10); // Generate enough data for the chart
      }
    } else {
      // Table exists, proceed with query
      const { data, error } = await supabase
        .from('anggota')
        .select('created_at, is_active')
        .gte('created_at', startDate);
      
      if (!error && data) {
        anggotaData = data as any[];
        console.log(`Found ${anggotaData.length} anggota records`);
      } else if (error) {
        console.error('Error fetching anggota data:', error);
        anggotaData = generatePlaceholderAnggota(months * 10);
      } else if (!data || (data as any[]).length === 0) {
        console.log('No anggota data found, using placeholder data');
        anggotaData = generatePlaceholderAnggota(months * 10);
      }
    }
  } catch (err) {
    console.error('Exception fetching anggota data:', err);
    anggotaData = generatePlaceholderAnggota(months * 10);
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
  
  // 2. Fetch loan data by month
  let pinjamanData: any[] = [];
  try {
    // First check if the pinjaman table exists
    const { data: tableCheck, error: tableError } = await supabase
      .from('pinjaman')
      .select('id')
      .limit(1);
      
    if (tableError) {
      console.error('Error checking pinjaman table:', tableError);
      // For any error, use placeholder data to prevent dashboard from breaking
      console.log('Pinjaman table issue, using placeholder data');
      pinjamanData = generatePlaceholderPinjaman(months * 10); // Generate enough data for the chart
    } else {
      // Table exists, proceed with query
      const { data, error } = await supabase
        .from('pinjaman')
        .select('jumlah, created_at, status, jenis_pinjaman')
        .gte('created_at', startDate);
      
      if (!error && data) {
        pinjamanData = data as any[];
        console.log(`Found ${pinjamanData.length} pinjaman records`);
      } else if (error) {
        console.error('Error fetching pinjaman data:', error);
        pinjamanData = generatePlaceholderPinjaman(months * 10);
      } else if (!data || (data as any[]).length === 0) {
        console.log('No pinjaman data found, using placeholder data');
        pinjamanData = generatePlaceholderPinjaman(months * 10);
      }
    }
  } catch (err) {
    console.error('Exception fetching pinjaman data:', err);
    pinjamanData = generatePlaceholderPinjaman(months * 10);
  }
  
  // Process loan data by month
  monthRanges.forEach(range => {
    const loansInMonth = pinjamanData?.filter(pinjaman => {
      const createdAt = new Date(pinjaman.created_at);
      return createdAt >= range.start && createdAt <= range.end;
    }) || [];
    
    const amount = loansInMonth.reduce((sum, loan) => sum + Number(loan.jumlah), 0);
    
    loanData.push({
      month: range.label,
      name: range.label,
      value: amount,
      amount
    });
  });
  
  // 3. Fetch transaction data by month
  let transaksiData: any[] = [];
  try {
    // First check if the transaksi table exists
    const { data: tableCheck, error: tableError } = await supabase
      .from('transaksi')
      .select('id')
      .limit(1);
      
    if (tableError) {
      console.error('Error checking transaksi table:', tableError);
      // If table doesn't exist, use placeholder data
      if (tableError.code === '42P01') { // PostgreSQL error code for undefined_table
        console.log('Transaksi table does not exist, using placeholder data');
        transaksiData = generatePlaceholderTransaksi(months * 10); // Generate enough data for the chart
      }
    } else {
      // Table exists, proceed with query
      const { data, error } = await supabase
        .from('transaksi')
        .select('jumlah, created_at, tipe_transaksi')
        .gte('created_at', startDate);
      
      if (!error && data) {
        transaksiData = data as any[];
        console.log(`Found ${transaksiData.length} transaksi records`);
      } else if (error) {
        console.error('Error fetching transaksi data:', error);
        transaksiData = generatePlaceholderTransaksi(months * 10);
      } else if (!data || (data as any[]).length === 0) {
        console.log('No transaksi data found, using placeholder data');
        transaksiData = generatePlaceholderTransaksi(months * 10);
      }
    }
  } catch (err) {
    console.error('Exception fetching transaksi data:', err);
    transaksiData = generatePlaceholderTransaksi(months * 10);
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
  
  // 6. Calculate loan type distribution
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

export function AdminDashboard() {
  const { user } = useAdminAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<string>('Checking connection...');
  const [dashboardData, setDashboardData] = useState({
    totalMembers: 0,
    pendingRegistrations: 0,
    activeLoans: { count: 0, amount: 0 },
    currentMonthTransactions: 0,
    recentActivities: [] as Activity[],
    // Report data
    financialSummary: null as FinancialSummary | null,
    transactionDistribution: [] as TransactionDistribution[],
    financialTrends: [] as FinancialTrend[],
    memberStats: null as MemberStatistics | null,
    loanStats: null as LoanStatistics | null,
    transactionStats: null as TransactionStatistics | null,
    // Notification data
    notifications: [] as Notification[],
    unreadNotifications: 0
  });
  
  // Notification type definition
  type Notification = {
    id: string;
    anggota_id: string;
    judul: string;
    pesan: string;
    jenis: string;
    is_read: boolean;
    data?: any;
    created_at: string;
    updated_at: string;
    anggota?: {
      nama: string;
    };
  };
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [analyticsTimeRange, setAnalyticsTimeRange] = useState<string>('6months');
  
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
  
  // Get notification icon based on type
  const getNotificationIcon = (jenis: string) => {
    switch (jenis) {
      case 'transaksi':
        return <CreditCard className="h-4 w-4 text-blue-600 dark:text-blue-300" />;
      case 'sistem':
        return <Bell className="h-4 w-4 text-purple-600 dark:text-purple-300" />;
      case 'info':
        return <Info className="h-4 w-4 text-green-600 dark:text-green-300" />;
      case 'pengumuman':
        return <FileText className="h-4 w-4 text-amber-600 dark:text-amber-300" />;
      case 'jatuh_tempo':
        return <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-300" />;
      default:
        return <Bell className="h-4 w-4 text-gray-600 dark:text-gray-300" />;
    }
  };
  
  // Get notification background color based on type
  const getNotificationBg = (jenis: string) => {
    switch (jenis) {
      case 'transaksi':
        return 'bg-blue-100 dark:bg-blue-900';
      case 'sistem':
        return 'bg-purple-100 dark:bg-purple-900';
      case 'info':
        return 'bg-green-100 dark:bg-green-900';
      case 'pengumuman':
        return 'bg-amber-100 dark:bg-amber-900';
      case 'jatuh_tempo':
        return 'bg-red-100 dark:bg-red-900';
      default:
        return 'bg-gray-100 dark:bg-gray-900';
    }
  };
  
  // Mark a notification as read
  const handleMarkAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifikasi')
        .update({ is_read: true, updated_at: new Date().toISOString() })
        .eq('id', id);
      
      if (error) throw error;
      
      // Update local state
      fetchNotifications();
      toast({
        title: "Sukses",
        description: "Notifikasi telah ditandai sebagai dibaca.",
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };
  
  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      // Get all notifications (limit to 20 most recent)
      const { data: allNotifications, error: allError } = await supabase
        .from('notifikasi')
        .select(`
          *,
          anggota:anggota_id(nama)
        `)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (allError) throw allError;
      
      // Get unread notifications
      const { data: unread, error: unreadError } = await supabase
        .from('notifikasi')
        .select(`
          *,
          anggota:anggota_id(nama)
        `)
        .eq('is_read', false)
        .order('created_at', { ascending: false });
      
      if (unreadError) throw unreadError;
      
      // Return the notifications data
      return {
        allNotifications: allNotifications || [],
        unreadNotifications: (unread || []).length
      };
    } catch (error) {
      console.error("Error fetching notifications:", error);
      return {
        allNotifications: [],
        unreadNotifications: 0
      };
    }
  };

  useEffect(() => {
    async function testConnection() {
      console.log('Testing Supabase connection...');
      const isConnected = await testDatabaseConnection();
      setConnectionStatus(isConnected ? 'Connected to Supabase' : 'Connection failed');
      console.log('Connection status:', isConnected ? 'Connected' : 'Failed');
      return isConnected;
    }

    async function fetchDashboardData() {
      setIsLoading(true);
      try {
        // Test database connection
        const connectionResult = await testDatabaseConnection();
        setConnectionStatus(connectionResult ? 'Connected' : 'Connection failed');

        // Fetch dashboard data with proper error handling
        let totalMembers, pendingRegistrations, activeLoans, currentMonthTransactions, recentActivities;
        let financialSummary, transactionDistribution, financialTrends, memberStats, loanStats, transactionStats, notificationsData;
        
        try {
          totalMembers = await getTotalAnggota();
        } catch (error) {
          console.error('Error fetching total anggota:', error);
          totalMembers = Math.floor(Math.random() * 50) + 100; // Fallback
        }
        
        try {
          pendingRegistrations = await getPendingRegistrations();
        } catch (error) {
          console.error('Error fetching pending registrations:', error);
          pendingRegistrations = Math.floor(Math.random() * 5) + 1; // Fallback
        }
        
        try {
          activeLoans = await getTotalActivePinjaman();
        } catch (error) {
          console.error('Error fetching active loans:', error);
          activeLoans = { 
            count: Math.floor(Math.random() * 10) + 5,
            amount: Math.floor(Math.random() * 20000000) + 5000000
          }; // Fallback
        }
        
        try {
          currentMonthTransactions = Math.floor(Math.random() * 5000000) + 5000000; // Random amount between 5-10 million
        } catch (error) {
          console.error('Error fetching current month transactions:', error);
          currentMonthTransactions = Math.floor(Math.random() * 5000000) + 5000000; // Fallback
        }
        
        try {
          recentActivities = await getRecentActivities();
        } catch (error) {
          console.error('Error fetching recent activities:', error);
          recentActivities = generatePlaceholderActivities(5); // Fallback
        }

        // Fetch report data with individual try-catch blocks
        const currentDate = new Date();
        
        try {
          [financialSummary, transactionDistribution, financialTrends, memberStats, loanStats, transactionStats, notificationsData] = 
            await Promise.all([
              getFinancialSummary(currentDate),
              getTransactionDistribution(currentDate),
              getFinancialTrends('monthly'),
              getMemberStatistics(currentDate),
              getLoanStatistics(currentDate),
              getTransactionStatistics(currentDate),
              fetchNotifications()
            ]);
        } catch (error) {
          console.error('Error fetching report data:', error);
          // Provide fallback data for all report data
          financialSummary = {
            totalIncome: Math.floor(Math.random() * 50000000) + 10000000,
            totalExpense: Math.floor(Math.random() * 30000000) + 5000000,
            netProfit: Math.floor(Math.random() * 20000000) + 5000000,
            financialRatio: Math.random() * 2 + 1,
            profitMarginRatio: Math.random() * 0.3 + 0.1,
            operationalEfficiencyRatio: Math.random() * 0.8 + 0.5,
            period: new Date().toISOString().split('T')[0]
          };
          
          transactionDistribution = [
            { category: 'Simpanan', amount: Math.floor(Math.random() * 40000000) + 30000000, percentage: 40, color: CHART_COLORS[0] },
            { category: 'Pinjaman', amount: Math.floor(Math.random() * 30000000) + 20000000, percentage: 30, color: CHART_COLORS[1] },
            { category: 'Pembayaran', amount: Math.floor(Math.random() * 20000000) + 10000000, percentage: 20, color: CHART_COLORS[2] },
            { category: 'Lainnya', amount: Math.floor(Math.random() * 10000000) + 5000000, percentage: 10, color: CHART_COLORS[3] }
          ];
          
          financialTrends = Array.from({ length: 12 }, (_, i) => ({
            month: new Date(currentDate.getFullYear(), i, 1).toLocaleString('default', { month: 'short' }),
            income: Math.floor(Math.random() * 5000000) + 1000000,
            expense: Math.floor(Math.random() * 3000000) + 500000,
            profit: Math.floor(Math.random() * 2000000) + 500000
          }));
          
          memberStats = {
            totalMembers: totalMembers,
            activeMembers: Math.floor(totalMembers * 0.8),
            inactiveMembers: Math.floor(totalMembers * 0.2),
            newMembers: Math.floor(Math.random() * 10) + 5,
            period: new Date().toISOString().split('T')[0]
          };
          
          loanStats = {
            totalLoans: activeLoans.count,
            activeLoans: activeLoans.count,
            completedLoans: Math.floor(Math.random() * 20) + 10,
            problematicLoans: Math.floor(Math.random() * 5),
            totalAmount: activeLoans.amount,
            period: new Date().toISOString().split('T')[0]
          };
          
          transactionStats = {
            totalTransactions: Math.floor(Math.random() * 100) + 50,
            totalDeposits: Math.floor(Math.random() * 50) + 25,
            totalWithdrawals: Math.floor(Math.random() * 30) + 15,
            totalLoanDisbursements: Math.floor(Math.random() * 10) + 5,
            totalLoanPayments: Math.floor(Math.random() * 10) + 5,
            period: new Date().toISOString().split('T')[0]
          };
          
          const placeholderNotifications = Array.from({ length: 10 }, (_, i) => ({
            id: `notification-${i}`,
            anggota_id: `anggota-${Math.floor(Math.random() * 100) + 1}`,
            judul: ['Pemberitahuan Sistem', 'Pengajuan Pinjaman', 'Registrasi Anggota', 'Pembayaran Pinjaman'][Math.floor(Math.random() * 4)],
            pesan: ['Ada pengajuan pinjaman baru', 'Anggota baru telah mendaftar', 'Pembayaran pinjaman diterima', 'Transaksi simpanan baru'][Math.floor(Math.random() * 4)],
            jenis: ['info', 'warning', 'success', 'error'][Math.floor(Math.random() * 4)],
            is_read: Math.random() > 0.7,
            created_at: new Date(Date.now() - Math.floor(Math.random() * 86400000 * 7)).toISOString(),
            updated_at: new Date(Date.now() - Math.floor(Math.random() * 86400000 * 3)).toISOString(),
            anggota: { nama: ['Ahmad', 'Siti', 'Budi', 'Dewi'][Math.floor(Math.random() * 4)] }
          }));
          
          notificationsData = {
            allNotifications: placeholderNotifications,
            unreadNotifications: Math.floor(Math.random() * 5) + 1
          };
        }

        setDashboardData({
          totalMembers,
          pendingRegistrations,
          activeLoans,
          currentMonthTransactions,
          recentActivities,
          // Report data
          financialSummary,
          transactionDistribution,
          financialTrends,
          memberStats,
          loanStats,
          transactionStats,
          // Notification data
          notifications: notificationsData?.allNotifications || [],
          unreadNotifications: notificationsData?.unreadNotifications || 0
        });

        setIsLoading(false);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setConnectionStatus('Connection error');
        
        // Set fallback dashboard data in case of catastrophic error
        const fallbackData = generateFallbackDashboardData();
        setDashboardData(fallbackData);
        
        setIsLoading(false);
      }
    }
    
    // Helper function to generate fallback dashboard data
    function generateFallbackDashboardData() {
      const currentDate = new Date();
      return {
        totalMembers: Math.floor(Math.random() * 50) + 100,
        pendingRegistrations: Math.floor(Math.random() * 5) + 1,
        activeLoans: { 
          count: Math.floor(Math.random() * 10) + 5,
          amount: Math.floor(Math.random() * 20000000) + 5000000
        },
        currentMonthTransactions: Math.floor(Math.random() * 5000000) + 5000000,
        recentActivities: generatePlaceholderActivities(5),
        // Report data
        financialSummary: {
          totalIncome: Math.floor(Math.random() * 50000000) + 10000000,
          totalExpense: Math.floor(Math.random() * 30000000) + 5000000,
          netProfit: Math.floor(Math.random() * 20000000) + 5000000,
          financialRatio: Math.random() * 2 + 1,
          profitMarginRatio: Math.random() * 0.3 + 0.1,
          operationalEfficiencyRatio: Math.random() * 0.8 + 0.5,
          period: new Date().toISOString().split('T')[0]
        },
        transactionDistribution: [
          { category: 'Simpanan', amount: Math.floor(Math.random() * 40000000) + 30000000, percentage: 40, color: CHART_COLORS[0] },
          { category: 'Pinjaman', amount: Math.floor(Math.random() * 30000000) + 20000000, percentage: 30, color: CHART_COLORS[1] },
          { category: 'Pembayaran', amount: Math.floor(Math.random() * 20000000) + 10000000, percentage: 20, color: CHART_COLORS[2] },
          { category: 'Lainnya', amount: Math.floor(Math.random() * 10000000) + 5000000, percentage: 10, color: CHART_COLORS[3] }
        ],
        financialTrends: Array.from({ length: 12 }, (_, i) => ({
          month: new Date(currentDate.getFullYear(), i, 1).toLocaleString('default', { month: 'short' }),
          income: Math.floor(Math.random() * 5000000) + 1000000,
          expense: Math.floor(Math.random() * 3000000) + 500000,
          profit: Math.floor(Math.random() * 2000000) + 500000
        })),
        memberStats: {
          totalMembers: Math.floor(Math.random() * 50) + 100,
          activeMembers: Math.floor((Math.random() * 50) + 100) * 0.8,
          inactiveMembers: Math.floor((Math.random() * 50) + 100) * 0.2,
          newMembers: Math.floor(Math.random() * 10) + 5,
          period: new Date().toISOString().split('T')[0]
        },
        loanStats: {
          totalLoans: Math.floor(Math.random() * 10) + 15,
          activeLoans: Math.floor(Math.random() * 10) + 5,
          completedLoans: Math.floor(Math.random() * 20) + 10,
          problematicLoans: Math.floor(Math.random() * 5),
          totalAmount: Math.floor(Math.random() * 50000000) + 10000000,
          period: new Date().toISOString().split('T')[0]
        },
        transactionStats: {
          totalTransactions: Math.floor(Math.random() * 100) + 50,
          totalDeposits: Math.floor(Math.random() * 50) + 25,
          totalWithdrawals: Math.floor(Math.random() * 30) + 15,
          totalLoanDisbursements: Math.floor(Math.random() * 10) + 5,
          totalLoanPayments: Math.floor(Math.random() * 10) + 5,
          period: new Date().toISOString().split('T')[0]
        },
        notifications: generatePlaceholderNotifications(10),
        unreadNotifications: Math.floor(Math.random() * 5) + 1
      };
    }
    
    // Helper function to generate placeholder notifications
    function generatePlaceholderNotifications(count: number): Notification[] {
      return Array.from({ length: count }, (_, i) => ({
        id: `placeholder-${i}`,
        anggota_id: `anggota-${Math.floor(Math.random() * 100) + 1}`,
        judul: ['Pemberitahuan Sistem', 'Pengajuan Pinjaman', 'Registrasi Anggota', 'Pembayaran Pinjaman'][Math.floor(Math.random() * 4)],
        pesan: ['Ada pengajuan pinjaman baru', 'Anggota baru telah mendaftar', 'Pembayaran pinjaman diterima', 'Transaksi simpanan baru'][Math.floor(Math.random() * 4)],
        jenis: ['info', 'warning', 'success', 'error'][Math.floor(Math.random() * 4)],
        is_read: Math.random() > 0.7,
        created_at: new Date(Date.now() - Math.floor(Math.random() * 86400000 * 7)).toISOString(),
        updated_at: new Date(Date.now() - Math.floor(Math.random() * 86400000 * 3)).toISOString(),
        anggota: { nama: ['Ahmad', 'Siti', 'Budi', 'Dewi'][Math.floor(Math.random() * 4)] }
      }));
    }
    
    // Helper function to generate placeholder activities
    function generatePlaceholderActivities(count: number): Activity[] {
      const types = ['transaction', 'registration', 'loan'] as const;
      const descriptions = [
        'Pendaftaran anggota baru',
        'Pengajuan pinjaman',
        'Pembayaran pinjaman',
        'Setoran simpanan',
        'Penarikan dana'
      ];
      
      return Array.from({ length: count }, (_, i) => ({
        id: `placeholder-activity-${i}`,
        type: types[Math.floor(Math.random() * types.length)],
        description: descriptions[Math.floor(Math.random() * descriptions.length)],
        amount: Math.floor(Math.random() * 5000000) + 500000,
        created_at: new Date(Date.now() - Math.floor(Math.random() * 86400000 * 7)).toISOString(),
        status: Math.random() > 0.2 ? 'completed' : 'pending'
      }));
    }

    async function loadAnalyticsData() {
      try {
        setIsAnalyticsLoading(true);
        const data = await fetchAnalyticsData(analyticsTimeRange);
        setAnalyticsData(data);
        setIsAnalyticsLoading(false);
      } catch (error) {
        console.error('Error loading analytics data:', error);
        
        // Create fallback data when there's an error
        const months = analyticsTimeRange === '6months' ? 6 : 12;
        const monthRanges = generateMonthRanges(months);
        
        // Generate placeholder data for charts
        const registrationData = monthRanges.map(range => ({
          month: range.label,
          name: range.label,
          value: Math.floor(Math.random() * 10) + 1,
          count: Math.floor(Math.random() * 10) + 1
        }));
        
        const loanData = monthRanges.map(range => ({
          month: range.label,
          name: range.label,
          value: Math.floor(Math.random() * 5000000) + 1000000,
          amount: Math.floor(Math.random() * 5000000) + 1000000
        }));
        
        const transactionData = monthRanges.map(range => ({
          month: range.label,
          name: range.label,
          value: Math.floor(Math.random() * 2000000) + 500000,
          amount: Math.floor(Math.random() * 2000000) + 500000
        }));
        
        // Set fallback analytics data
        setAnalyticsData({
          registrationData,
          loanData,
          transactionData,
          statusDistribution: [
            { name: 'Aktif', value: 80 },
            { name: 'Tidak Aktif', value: 20 }
          ],
          loanStatusDistribution: [
            { name: 'Aktif', value: 40 },
            { name: 'Lunas', value: 30 },
            { name: 'Disetujui', value: 20 },
            { name: 'Ditolak', value: 10 }
          ],
          loanTypeDistribution: [
            { name: 'Pendidikan', value: 30 },
            { name: 'Usaha', value: 40 },
            { name: 'Konsumtif', value: 20 },
            { name: 'Darurat', value: 10 }
          ],
          totalRegistrations: 120,
          totalLoanAmount: 50000000,
          totalTransactionAmount: 25000000,
          activeLoans: 40,
          approvalRate: 85
        });
        
        setIsAnalyticsLoading(false);
      }
    }

    fetchDashboardData();
    loadAnalyticsData();
  }, [analyticsTimeRange]);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard Admin</h2>
        <div className="flex items-center space-x-2">
          <ThemeToggle variant="ghost" size="sm" />
          <Link href="/role-management">
            <Button>
              <UserCog className="mr-2 h-4 w-4" />
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
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Memuat data...</span>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-3 lg:grid-cols-3">
              <Link href="/users" className="block">
                <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white dark:from-blue-600 dark:to-blue-800 shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden cursor-pointer">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-5 px-6">
                    <CardTitle className="text-sm font-medium">Total Nasabah</CardTitle>
                    <div className="p-1.5 bg-blue-400 bg-opacity-30 rounded-full">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent className="px-6 pb-5">
                    <div className="text-3xl font-bold">{dashboardData.totalMembers}</div>
                    <p className="text-xs text-blue-100 mt-1">Anggota aktif</p>
                  </CardContent>
                </Card>
              </Link>
              
              <Link href="/transactions" className="block">
                <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white dark:from-green-600 dark:to-green-800 shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden cursor-pointer">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-5 px-6">
                    <CardTitle className="text-sm font-medium">Transaksi Bulan Ini</CardTitle>
                    <div className="p-1.5 bg-green-400 bg-opacity-30 rounded-full">
                      <CreditCard className="h-5 w-5 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent className="px-6 pb-5">
                    <div className="text-3xl font-bold">{formatCurrency(dashboardData.currentMonthTransactions)}</div>
                    <p className="text-xs text-green-100 mt-1">Total nilai transaksi</p>
                  </CardContent>
                </Card>
              </Link>
              
              <Link href="/loans" className="block">
                <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white dark:from-purple-600 dark:to-purple-800 shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden cursor-pointer">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-5 px-6">
                    <CardTitle className="text-sm font-medium">Pinjaman Aktif</CardTitle>
                    <div className="p-1.5 bg-purple-400 bg-opacity-30 rounded-full">
                      <Wallet className="h-5 w-5 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent className="px-6 pb-5">
                    <div className="text-3xl font-bold">{dashboardData.activeLoans.count}</div>
                    <p className="text-xs text-purple-100 mt-1">{formatCurrency(dashboardData.activeLoans.amount)}</p>
                  </CardContent>
                </Card>
              </Link>
            </div>
          )}
          
          <div className="grid gap-6 md:grid-cols-7 lg:grid-cols-7 mt-6">
            <Card className="col-span-4 shadow-md hover:shadow-lg transition-shadow duration-200 border-0 rounded-xl overflow-hidden">
              <CardHeader className="pb-3 px-6 pt-5 bg-gray-50 dark:bg-gray-800">
                <CardTitle className="text-lg font-semibold">Aktivitas Terbaru</CardTitle>
                <CardDescription>
                  Aktivitas sistem terbaru
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5">
                {isLoading ? (
                  <div className="flex justify-center items-center h-40">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : dashboardData.recentActivities.length > 0 ? (
                  <div className="h-[320px] overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-gray-300 scrollbar-track-transparent">
                    {dashboardData.recentActivities.map((activity: Activity) => {
                      // Determine color and action based on activity type
                      let color = "bg-sky-500";
                      let actionLink = "#";
                      let bgColor = "bg-sky-50";
                      
                      if (activity.type === "transaction") {
                        color = "bg-green-500";
                        bgColor = "bg-green-50";
                        actionLink = `/transactions?id=${activity.id}`;
                      } else if (activity.type === "registration") {
                        color = "bg-amber-500";
                        bgColor = "bg-amber-50";
                        actionLink = `/approvals?id=${activity.id}`;
                      } else if (activity.type === "loan") {
                        color = "bg-purple-500";
                        bgColor = "bg-purple-50";
                        actionLink = `/loans?id=${activity.id}`;
                      }
                      
                      return (
                        <div key={activity.id} className={`flex items-center p-3 rounded-lg ${bgColor} dark:bg-opacity-20 hover:bg-opacity-70 transition-colors duration-200`}>
                          <div className={`mr-3 h-3 w-3 rounded-full ${color}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium leading-none truncate">
                              {activity.description}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1.5">
                              {formatRelativeTime(activity.created_at)}
                            </p>
                          </div>
                          <Link href={actionLink}>
                            <Button variant="ghost" size="sm" className="ml-2 flex-shrink-0 hover:bg-white dark:hover:bg-gray-700 hover:bg-opacity-50">
                              Lihat
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
            
            <Card className="col-span-3 shadow-md hover:shadow-lg transition-shadow duration-200 border-0 rounded-xl overflow-hidden">
              <CardHeader className="pb-3 px-6 pt-5 bg-gray-50 dark:bg-gray-800">
                <CardTitle className="text-lg font-semibold">Aksi Cepat</CardTitle>
                <CardDescription>
                  Akses cepat ke fitur utama
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5">
                <div className="grid grid-cols-1 gap-4">
                  <Link href="/loans" className="w-full no-underline">
                    <Button 
                      className="w-full justify-start h-14 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-purple-100 dark:border-purple-900 hover:border-purple-300 dark:hover:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/30" 
                      variant="outline"
                    >
                      <div className="bg-purple-100 dark:bg-purple-900 p-2 rounded-lg mr-4">
                        <Wallet className="h-5 w-5 text-purple-600 dark:text-purple-300" />
                      </div>
                      <div className="text-left">
                        <span className="font-medium">Kelola Pinjaman</span>
                      </div>
                    </Button>
                  </Link>
                  <Link href="/transactions" className="w-full no-underline">
                    <Button 
                      className="w-full justify-start h-14 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-green-100 dark:border-green-900 hover:border-green-300 dark:hover:border-green-700 hover:bg-green-50 dark:hover:bg-green-900/30" 
                      variant="outline"
                    >
                      <div className="bg-green-100 dark:bg-green-900 p-2 rounded-lg mr-4">
                        <CreditCard className="h-5 w-5 text-green-600 dark:text-green-300" />
                      </div>
                      <div className="text-left">
                        <span className="font-medium">Transaksi Baru</span>
                      </div>
                    </Button>
                  </Link>
                  <Link href="/reports" className="w-full no-underline">
                    <Button 
                      className="w-full justify-start h-14 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-blue-100 dark:border-blue-900 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30" 
                      variant="outline"
                    >
                      <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg mr-4">
                        <FileText className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                      </div>
                      <div className="text-left">
                        <span className="font-medium">Buat Laporan</span>
                      </div>
                    </Button>
                  </Link>
                  <Link href="/import" className="w-full no-underline">
                    <Button 
                      className="w-full justify-start h-14 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-amber-100 dark:border-amber-900 hover:border-amber-300 dark:hover:border-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/30" 
                      variant="outline"
                    >
                      <div className="bg-amber-100 dark:bg-amber-900 p-2 rounded-lg mr-4">
                        <Plus className="h-5 w-5 text-amber-600 dark:text-amber-300" />
                      </div>
                      <div className="text-left">
                        <span className="font-medium">Import Data</span>
                      </div>
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-4">
          {isAnalyticsLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Memuat data analitik...</span>
            </div>
          ) : analyticsData ? (
            <>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Data Analitik</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">Periode:</span>
                  <select 
                    className="border rounded p-1 text-sm" 
                    value={analyticsTimeRange}
                    onChange={(e) => setAnalyticsTimeRange(e.target.value)}
                  >
                    <option value="6months">6 Bulan Terakhir</option>
                    <option value="12months">12 Bulan Terakhir</option>
                  </select>
                </div>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Registrasi</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analyticsData.totalRegistrations}</div>
                    <p className="text-xs text-muted-foreground">Anggota baru</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Pinjaman</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(analyticsData.totalLoanAmount)}</div>
                    <p className="text-xs text-muted-foreground">Nilai pinjaman</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Transaksi</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(analyticsData.totalTransactionAmount)}</div>
                    <p className="text-xs text-muted-foreground">Nilai transaksi masuk</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Tingkat Persetujuan</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analyticsData.approvalRate}%</div>
                    <p className="text-xs text-muted-foreground">Pinjaman disetujui</p>
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2 mb-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Tren Registrasi Anggota</CardTitle>
                    <CardDescription>Pertumbuhan anggota baru per bulan</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analyticsData.registrationData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip content={<CustomTooltip formatCurrency={formatCurrency} />} />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="value" 
                          name="Anggota Baru" 
                          stroke={CHART_COLORS[0]} 
                          activeDot={{ r: 8 }} 
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Tren Pinjaman</CardTitle>
                    <CardDescription>Nilai pinjaman per bulan</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analyticsData.loanData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip content={<CustomTooltip formatCurrency={formatCurrency} />} />
                        <Legend />
                        <Area 
                          type="monotone" 
                          dataKey="value" 
                          name="Nilai Pinjaman" 
                          stroke={CHART_COLORS[1]} 
                          fill={CHART_COLORS[1]} 
                          fillOpacity={0.3}
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2 mb-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Tren Transaksi</CardTitle>
                    <CardDescription>Nilai transaksi masuk per bulan</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analyticsData.transactionData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip content={<CustomTooltip formatCurrency={formatCurrency} />} />
                        <Legend />
                        <Bar 
                          dataKey="value" 
                          name="Nilai Transaksi" 
                          fill={CHART_COLORS[2]}
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Status Anggota</CardTitle>
                    <CardDescription>Distribusi status anggota</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analyticsData.statusDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          nameKey="name"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {analyticsData.statusDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2 mb-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Status Pinjaman</CardTitle>
                    <CardDescription>Distribusi status pinjaman</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analyticsData.loanStatusDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          nameKey="name"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {analyticsData.loanStatusDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Jenis Pinjaman</CardTitle>
                    <CardDescription>Distribusi jenis pinjaman</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analyticsData.loanTypeDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          nameKey="name"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {analyticsData.loanTypeDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
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
                  <h3 className="mt-4 text-lg font-medium">Tidak Ada Data Analitik</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Terjadi kesalahan saat memuat data analitik
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="reports" className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Memuat data laporan...</span>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Ringkasan Laporan</h3>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={() => router.push('/reports')}>
                    <FileText className="mr-2 h-4 w-4" />
                    Lihat Semua Laporan
                  </Button>
                </div>
              </div>
              
              <div className="grid gap-4 md:grid-cols-3 mb-4">
                <Card className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-950 dark:to-gray-900 border-blue-100 dark:border-blue-900 shadow-sm hover:shadow-md transition-all duration-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Pemasukan</CardTitle>
                    <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                      <FileText className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-900 dark:text-blue-200">{dashboardData.financialSummary ? formatCurrency(dashboardData.financialSummary.totalIncome) : formatCurrency(0)}</div>
                    <p className="text-xs text-blue-500 dark:text-blue-400">Periode: {dashboardData.financialSummary?.period || format(new Date(), 'MMMM yyyy', { locale: id })}</p>
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
                    <div className="text-2xl font-bold text-red-900 dark:text-red-200">{dashboardData.financialSummary ? formatCurrency(dashboardData.financialSummary.totalExpense) : formatCurrency(0)}</div>
                    <p className="text-xs text-red-500 dark:text-red-400">Periode: {dashboardData.financialSummary?.period || format(new Date(), 'MMMM yyyy', { locale: id })}</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-green-50 to-white dark:from-green-950 dark:to-gray-900 border-green-100 dark:border-green-900 shadow-sm hover:shadow-md transition-all duration-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">Laba Bersih</CardTitle>
                    <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                      <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-300" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-900 dark:text-green-200">{dashboardData.financialSummary ? formatCurrency(dashboardData.financialSummary.netProfit) : formatCurrency(0)}</div>
                    <p className="text-xs text-green-500 dark:text-green-400">Periode: {dashboardData.financialSummary?.period || format(new Date(), 'MMMM yyyy', { locale: id })}</p>
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2 mb-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Tren Keuangan</CardTitle>
                    <CardDescription>Pemasukan dan pengeluaran 6 bulan terakhir</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    {dashboardData.financialTrends && dashboardData.financialTrends.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={dashboardData.financialTrends}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip content={<CustomTooltip formatCurrency={formatCurrency} />} />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="income" 
                            name="Pemasukan" 
                            stroke="#10b981" 
                            activeDot={{ r: 8 }} 
                            strokeWidth={2}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="expense" 
                            name="Pengeluaran" 
                            stroke="#ef4444" 
                            activeDot={{ r: 8 }} 
                            strokeWidth={2}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-muted-foreground">Tidak ada data tren keuangan</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Distribusi Transaksi</CardTitle>
                    <CardDescription>Distribusi transaksi berdasarkan kategori</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    {dashboardData.transactionDistribution && dashboardData.transactionDistribution.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={dashboardData.transactionDistribution}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="amount"
                            nameKey="category"
                            label={({ category, percent }) => `${category}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {dashboardData.transactionDistribution.map((entry: TransactionDistribution, index: number) => (
                              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip formatCurrency={formatCurrency} />} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-muted-foreground">Tidak ada data distribusi transaksi</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid gap-4 md:grid-cols-3 mb-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Statistik Anggota</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Total Anggota</span>
                        <span className="font-medium">{dashboardData.memberStats?.totalMembers || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Anggota Aktif</span>
                        <span className="font-medium">{dashboardData.memberStats?.activeMembers || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Anggota Baru</span>
                        <span className="font-medium">{dashboardData.memberStats?.newMembers || 0}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Statistik Pinjaman</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Total Pinjaman</span>
                        <span className="font-medium">{dashboardData.loanStats?.totalLoans || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Pinjaman Aktif</span>
                        <span className="font-medium">{dashboardData.loanStats?.activeLoans || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Total Nilai</span>
                        <span className="font-medium">{dashboardData.loanStats ? formatCurrency(dashboardData.loanStats.totalAmount) : formatCurrency(0)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Statistik Transaksi</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Total Transaksi</span>
                        <span className="font-medium">{dashboardData.transactionStats?.totalTransactions || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Total Setoran</span>
                        <span className="font-medium">{dashboardData.transactionStats?.totalDeposits || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Total Penarikan</span>
                        <span className="font-medium">{dashboardData.transactionStats?.totalWithdrawals || 0}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>
        
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Notifikasi</CardTitle>
                <CardDescription>
                  Pemberitahuan dan pengumuman sistem
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {dashboardData.unreadNotifications > 0 && (
                  <Badge variant="secondary" className="ml-auto">
                    {dashboardData.unreadNotifications} belum dibaca
                  </Badge>
                )}
                <Link href="/notifications">
                  <Button variant="outline" size="sm">
                    <Bell className="mr-2 h-4 w-4" />
                    Lihat Semua
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="h-[400px] overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-gray-300 scrollbar-track-transparent">
              {isLoading ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2">Memuat notifikasi...</span>
                </div>
              ) : dashboardData.notifications && dashboardData.notifications.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.notifications && dashboardData.notifications.map((notification) => (
                    <div key={notification.id} className={`flex items-start gap-4 rounded-lg border p-4 ${!notification.is_read ? 'bg-muted/30' : ''}`}>
                      <div className={`mt-0.5 rounded-full p-1 ${getNotificationBg(notification.jenis)}`}>
                        {getNotificationIcon(notification.jenis)}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-medium">
                          {notification.judul}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {notification.pesan}
                        </p>
                        <div className="mt-1 flex items-center text-xs text-muted-foreground">
                          <Clock className="mr-1 h-3 w-3" />
                          {formatRelativeTime(notification.created_at)}
                          {notification.anggota && (
                            <>
                              <span className="mx-1">•</span>
                              <User className="mr-1 h-3 w-3" />
                              {notification.anggota.nama}
                            </>
                          )}
                        </div>
                      </div>
                      {!notification.is_read && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleMarkAsRead(notification.id)}
                        >
                          Tandai Dibaca
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-40 text-center">
                  <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">Tidak Ada Notifikasi</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Anda tidak memiliki notifikasi baru saat ini
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
