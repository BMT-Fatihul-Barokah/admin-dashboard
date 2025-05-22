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
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Nasabah</CardTitle>
                  <Users className="h-4 w-4 text-white" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardData.totalMembers}</div>
                  <p className="text-xs text-blue-100">Anggota aktif</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Transaksi Bulan Ini</CardTitle>
                  <CreditCard className="h-4 w-4 text-white" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(dashboardData.currentMonthTransactions)}</div>
                  <p className="text-xs text-green-100">Total nilai transaksi</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pinjaman Aktif</CardTitle>
                  <Wallet className="h-4 w-4 text-white" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardData.activeLoans.count}</div>
                  <p className="text-xs text-purple-100">{formatCurrency(dashboardData.activeLoans.amount)}</p>
                </CardContent>
              </Card>
            </div>
          )}
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Aktivitas Terbaru</CardTitle>
                <CardDescription>
                  Aktivitas sistem terbaru
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center items-center h-40">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : dashboardData.recentActivities.length > 0 ? (
                  <div className="space-y-4">
                    {dashboardData.recentActivities.map((activity: Activity) => {
                      // Determine color and action based on activity type
                      let color = "bg-sky-500";
                      let actionLink = "#";
                      
                      if (activity.type === "transaction") {
                        color = "bg-green-500";
                        actionLink = `/transactions?id=${activity.id}`;
                      } else if (activity.type === "registration") {
                        color = "bg-amber-500";
                        actionLink = `/approvals?id=${activity.id}`;
                      } else if (activity.type === "loan") {
                        color = "bg-purple-500";
                        actionLink = `/loans?id=${activity.id}`;
                      }
                      
                      return (
                        <div key={activity.id} className="flex items-center">
                          <div className={`mr-2 h-2 w-2 rounded-full ${color}`} />
                          <div className="flex-1">
                            <p className="text-sm font-medium leading-none">
                              {activity.description}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {formatRelativeTime(activity.created_at)}
                            </p>
                          </div>
                          <Link href={actionLink}>
                            <Button variant="ghost" size="sm">
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
            
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Aksi Cepat</CardTitle>
                <CardDescription>
                  Akses cepat ke fitur utama
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2">
                <Link href="/loans">
                  <Button className="w-full justify-start" variant="outline">
                    <Wallet className="mr-2 h-4 w-4" />
                    Kelola Pinjaman
                  </Button>
                </Link>
                <Link href="/transactions">
                  <Button className="w-full justify-start" variant="outline">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Transaksi Baru
                  </Button>
                </Link>
                <Link href="/reports">
                  <Button className="w-full justify-start" variant="outline">
                    <FileText className="mr-2 h-4 w-4" />
                    Buat Laporan
                  </Button>
                </Link>
                <Link href="/import">
                  <Button className="w-full justify-start" variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Import Data
                  </Button>
                </Link>
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
