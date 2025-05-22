"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { BarChart3, Users, CreditCard, Wallet, UserPlus, FileText, Plus, Loader2, UserCog } from "lucide-react";
import Link from "next/link";
import { useAdminAuth } from "@/lib/admin-auth-context";
import { testDatabaseConnection, getTotalAnggota, getPendingRegistrations, getTotalActivePinjaman, getCurrentMonthTransactions, getRecentActivities, calculatePercentageChange } from "@/lib/dashboard-data";
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

export function AdminDashboard() {
  const { user } = useAdminAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<string>('Checking connection...');
  const [dashboardData, setDashboardData] = useState({
    totalMembers: 0,
    pendingRegistrations: 0,
    activeLoans: { count: 0, amount: 0 },
    currentMonthTransactions: 0,
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
        // First test the connection
        const isConnected = await testConnection();
        
        console.log('Fetching all dashboard data...');
        const [members, registrations, loans, transactions, activities] = await Promise.all([
          getTotalAnggota(),
          getPendingRegistrations(),
          getTotalActivePinjaman(),
          getCurrentMonthTransactions(),
          getRecentActivities(5)
        ]);
        
        console.log('Dashboard data fetched:', {
          members,
          registrations,
          loans,
          transactions,
          activitiesCount: activities.length
        });
        
        setDashboardData({
          totalMembers: members,
          pendingRegistrations: registrations,
          activeLoans: loans,
          currentMonthTransactions: transactions,
          recentActivities: activities
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchDashboardData();
  }, []);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard Admin</h2>
        <div className="flex items-center space-x-2">
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
              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden">
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
              
              <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden">
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
              
              <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden">
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
            </div>
          )}
          
          <div className="grid gap-6 md:grid-cols-7 lg:grid-cols-7 mt-6">
            <Card className="col-span-4 shadow-md hover:shadow-lg transition-shadow duration-200 border-0 rounded-xl overflow-hidden">
              <CardHeader className="pb-3 px-6 pt-5 bg-gray-50">
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
                        <div key={activity.id} className={`flex items-center p-3 rounded-lg ${bgColor} hover:bg-opacity-70 transition-colors duration-200`}>
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
                            <Button variant="ghost" size="sm" className="ml-2 flex-shrink-0 hover:bg-white hover:bg-opacity-50">
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
              <CardHeader className="pb-3 px-6 pt-5 bg-gray-50">
                <CardTitle className="text-lg font-semibold">Aksi Cepat</CardTitle>
                <CardDescription>
                  Akses cepat ke fitur utama
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5">
                <div className="grid grid-cols-1 gap-4">
                  <Link href="/loans" className="w-full">
                    <Button className="w-full justify-start h-14 rounded-xl" variant="outline">
                      <div className="bg-purple-100 p-2 rounded-lg mr-4">
                        <Wallet className="h-5 w-5 text-purple-600" />
                      </div>
                      <div className="text-left">
                        <span className="font-medium">Kelola Pinjaman</span>
                      </div>
                    </Button>
                  </Link>
                  <Link href="/transactions" className="w-full">
                    <Button className="w-full justify-start h-14 rounded-xl" variant="outline">
                      <div className="bg-green-100 p-2 rounded-lg mr-4">
                        <CreditCard className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="text-left">
                        <span className="font-medium">Transaksi Baru</span>
                      </div>
                    </Button>
                  </Link>
                  <Link href="/reports" className="w-full">
                    <Button className="w-full justify-start h-14 rounded-xl" variant="outline">
                      <div className="bg-blue-100 p-2 rounded-lg mr-4">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="text-left">
                        <span className="font-medium">Buat Laporan</span>
                      </div>
                    </Button>
                  </Link>
                  <Link href="/import" className="w-full">
                    <Button className="w-full justify-start h-14 rounded-xl" variant="outline">
                      <div className="bg-amber-100 p-2 rounded-lg mr-4">
                        <Plus className="h-5 w-5 text-amber-600" />
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
                <h3 className="mt-4 text-lg font-medium">Grafik Analitik</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Visualisasi data transaksi, pinjaman, dan pertumbuhan anggota
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Laporan</CardTitle>
              <CardDescription>
                Laporan keuangan dan operasional
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px] flex items-center justify-center">
              <div className="text-center">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">Laporan Keuangan</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Laporan bulanan, triwulanan, dan tahunan
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notifikasi</CardTitle>
              <CardDescription>
                Pemberitahuan dan pengumuman sistem
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-start gap-4 rounded-lg border p-4">
                    <div className={`mt-0.5 rounded-full p-1 ${i % 2 === 0 ? 'bg-blue-100' : 'bg-amber-100'}`}>
                      {i % 2 === 0 ? (
                        <CreditCard className={`h-4 w-4 ${i % 2 === 0 ? 'text-blue-600' : 'text-amber-600'}`} />
                      ) : (
                        <UserPlus className={`h-4 w-4 ${i % 2 === 0 ? 'text-blue-600' : 'text-amber-600'}`} />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium">
                        {i % 2 === 0 ? 'Transaksi Baru' : 'Pendaftaran Nasabah Baru'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {i % 2 === 0 
                          ? 'Transaksi baru telah dibuat dan menunggu verifikasi' 
                          : 'Nasabah baru telah mendaftar dan menunggu persetujuan'}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {`${i * 10} menit yang lalu`}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm">
                      Tandai Dibaca
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
