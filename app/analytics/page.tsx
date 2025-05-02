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
import { BarChart, LineChart, PieChart, AreaChart } from "lucide-react";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Mock data for charts
const generateMockData = () => {
  // Registration data by month
  const registrationData = [
    { month: 'Jan', count: Math.floor(Math.random() * 50) + 10 },
    { month: 'Feb', count: Math.floor(Math.random() * 50) + 10 },
    { month: 'Mar', count: Math.floor(Math.random() * 50) + 10 },
    { month: 'Apr', count: Math.floor(Math.random() * 50) + 10 },
    { month: 'May', count: Math.floor(Math.random() * 50) + 10 },
    { month: 'Jun', count: Math.floor(Math.random() * 50) + 10 },
  ];
  
  // Loan data by month
  const loanData = [
    { month: 'Jan', amount: Math.floor(Math.random() * 50000000) + 10000000 },
    { month: 'Feb', amount: Math.floor(Math.random() * 50000000) + 10000000 },
    { month: 'Mar', amount: Math.floor(Math.random() * 50000000) + 10000000 },
    { month: 'Apr', amount: Math.floor(Math.random() * 50000000) + 10000000 },
    { month: 'May', amount: Math.floor(Math.random() * 50000000) + 10000000 },
    { month: 'Jun', amount: Math.floor(Math.random() * 50000000) + 10000000 },
  ];
  
  // Registration status distribution
  const statusDistribution = [
    { status: 'Diterima', count: Math.floor(Math.random() * 100) + 50 },
    { status: 'Ditolak', count: Math.floor(Math.random() * 30) + 10 },
    { status: 'Menunggu', count: Math.floor(Math.random() * 20) + 5 },
  ];
  
  // User activity by role
  const activityByRole = [
    { role: 'Admin', count: Math.floor(Math.random() * 100) + 50 },
    { role: 'Ketua', count: Math.floor(Math.random() * 30) + 10 },
    { role: 'Sekretaris', count: Math.floor(Math.random() * 80) + 30 },
    { role: 'Bendahara', count: Math.floor(Math.random() * 60) + 20 },
  ];
  
  return {
    registrationData,
    loanData,
    statusDistribution,
    activityByRole
  };
};

export default function AnalyticsPage() {
  const { toast } = useToast();
  const { user } = useAdminAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("6months");
  const [mockData, setMockData] = useState(generateMockData());
  
  // Get role-specific theme
  const roleTheme = user ? getRoleTheme(user.role) : { primary: "", secondary: "", badge: "" };
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };
  
  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // In a real application, you would fetch actual data from Supabase here
        // For now, we'll use the mock data
        setTimeout(() => {
          setMockData(generateMockData());
          setIsLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error loading analytics data:', error);
        toast({
          title: "Error",
          description: "Gagal memuat data analitik",
          variant: "destructive",
        });
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [timeRange]);
  
  // Calculate summary metrics
  const totalRegistrations = mockData.registrationData.reduce((sum, item) => sum + item.count, 0);
  const totalLoanAmount = mockData.loanData.reduce((sum, item) => sum + item.amount, 0);
  const approvalRate = Math.round((mockData.statusDistribution[0].count / 
    (mockData.statusDistribution[0].count + mockData.statusDistribution[1].count + mockData.statusDistribution[2].count)) * 100);
  
  // Role-specific content
  const renderRoleSpecificContent = () => {
    if (!user) return null;
    
    switch (user.role) {
      case 'admin':
        return (
          <>
            <Card className={`${roleTheme.secondary} border-none`}>
              <CardHeader>
                <CardTitle>Aktivitas Pengguna Berdasarkan Peran</CardTitle>
                <CardDescription className="text-white/70">
                  Jumlah aktivitas yang dilakukan oleh masing-masing peran
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80 flex items-center justify-center">
                  <div className="text-center">
                    <BarChart className="h-16 w-16 mb-4 mx-auto text-white/70" />
                    <p className="text-white/70">Grafik aktivitas pengguna berdasarkan peran akan ditampilkan di sini</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Performa Sistem</CardTitle>
                  <CardDescription>
                    Metrik performa sistem dalam {timeRange === "6months" ? "6 bulan" : "1 tahun"} terakhir
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80 flex items-center justify-center">
                    <div className="text-center">
                      <LineChart className="h-16 w-16 mb-4 mx-auto text-muted-foreground" />
                      <p className="text-muted-foreground">Grafik performa sistem akan ditampilkan di sini</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Log Aktivitas</CardTitle>
                  <CardDescription>
                    Ringkasan log aktivitas dalam sistem
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80 flex items-center justify-center">
                    <div className="text-center">
                      <AreaChart className="h-16 w-16 mb-4 mx-auto text-muted-foreground" />
                      <p className="text-muted-foreground">Grafik log aktivitas akan ditampilkan di sini</p>
                    </div>
                  </div>
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
                <div className="h-80 flex items-center justify-center">
                  <div className="text-center">
                    <AreaChart className="h-16 w-16 mb-4 mx-auto text-white/70" />
                    <p className="text-white/70">Grafik kinerja koperasi akan ditampilkan di sini</p>
                  </div>
                </div>
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
                  <div className="h-80 flex items-center justify-center">
                    <div className="text-center">
                      <LineChart className="h-16 w-16 mb-4 mx-auto text-muted-foreground" />
                      <p className="text-muted-foreground">Grafik tren pendaftaran nasabah akan ditampilkan di sini</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Distribusi Status Pendaftaran</CardTitle>
                  <CardDescription>
                    Distribusi status pendaftaran nasabah
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80 flex items-center justify-center">
                    <div className="text-center">
                      <PieChart className="h-16 w-16 mb-4 mx-auto text-muted-foreground" />
                      <p className="text-muted-foreground">Grafik distribusi status pendaftaran akan ditampilkan di sini</p>
                    </div>
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
                <div className="h-80 flex items-center justify-center">
                  <div className="text-center">
                    <LineChart className="h-16 w-16 mb-4 mx-auto text-white/70" />
                    <p className="text-white/70">Grafik tren pendaftaran nasabah akan ditampilkan di sini</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Distribusi Status Pendaftaran</CardTitle>
                  <CardDescription>
                    Distribusi status pendaftaran nasabah
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80 flex items-center justify-center">
                    <div className="text-center">
                      <PieChart className="h-16 w-16 mb-4 mx-auto text-muted-foreground" />
                      <p className="text-muted-foreground">Grafik distribusi status pendaftaran akan ditampilkan di sini</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Waktu Pemrosesan Pendaftaran</CardTitle>
                  <CardDescription>
                    Rata-rata waktu pemrosesan pendaftaran nasabah
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80 flex items-center justify-center">
                    <div className="text-center">
                      <BarChart className="h-16 w-16 mb-4 mx-auto text-muted-foreground" />
                      <p className="text-muted-foreground">Grafik waktu pemrosesan pendaftaran akan ditampilkan di sini</p>
                    </div>
                  </div>
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
                <div className="h-80 flex items-center justify-center">
                  <div className="text-center">
                    <AreaChart className="h-16 w-16 mb-4 mx-auto text-white/70" />
                    <p className="text-white/70">Grafik tren pinjaman akan ditampilkan di sini</p>
                  </div>
                </div>
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
                  <div className="h-80 flex items-center justify-center">
                    <div className="text-center">
                      <PieChart className="h-16 w-16 mb-4 mx-auto text-muted-foreground" />
                      <p className="text-muted-foreground">Grafik distribusi jenis pinjaman akan ditampilkan di sini</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Status Pembayaran Pinjaman</CardTitle>
                  <CardDescription>
                    Status pembayaran pinjaman
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80 flex items-center justify-center">
                    <div className="text-center">
                      <BarChart className="h-16 w-16 mb-4 mx-auto text-muted-foreground" />
                      <p className="text-muted-foreground">Grafik status pembayaran pinjaman akan ditampilkan di sini</p>
                    </div>
                  </div>
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
            <Button variant="outline" disabled={isLoading} onClick={() => setMockData(generateMockData())}>
              {isLoading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></div>
                  Memuat
                </>
              ) : (
                'Refresh'
              )}
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Pendaftaran</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalRegistrations}</div>
              <p className="text-xs text-muted-foreground">
                Pendaftaran dalam {timeRange === "6months" ? "6 bulan" : "1 tahun"} terakhir
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Pinjaman</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalLoanAmount)}</div>
              <p className="text-xs text-muted-foreground">
                Pinjaman dalam {timeRange === "6months" ? "6 bulan" : "1 tahun"} terakhir
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Tingkat Persetujuan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{approvalRate}%</div>
              <p className="text-xs text-muted-foreground">
                Persentase pendaftaran yang disetujui
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Role-specific content */}
        {renderRoleSpecificContent()}
      </div>
    </RoleProtected>
  );
}
