"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Users, UserPlus, CheckCircle, XCircle, Bell, FileText, Mail, Loader2 } from "lucide-react";
import Link from "next/link";
import { useAdminAuth } from "@/lib/admin-auth-context";
import { 
  testDatabaseConnection,
  getTotalAnggota, 
  getPendingRegistrations, 
  getRecentActivities 
} from '@/lib/dashboard-data';
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

export function SekretarisDashboard() {
  const { user } = useAdminAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    totalMembers: 0,
    pendingRegistrations: 0,
    recentActivities: [] as Activity[]
  });
  
  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    try {
      return formatDistanceToNow(parseISO(dateString), { addSuffix: true, locale: id });
    } catch (error) {
      return dateString;
    }
  };
  
  useEffect(() => {
    async function fetchDashboardData() {
      setIsLoading(true);
      try {
        console.log('Fetching sekretaris dashboard data...');
        const [members, registrations, activities] = await Promise.all([
          getTotalAnggota(),
          getPendingRegistrations(),
          getRecentActivities(5)
        ]);
        
        console.log('Sekretaris dashboard data fetched:', {
          members,
          registrations,
          activitiesCount: activities.length
        });
        
        setDashboardData({
          totalMembers: members,
          pendingRegistrations: registrations,
          recentActivities: activities.filter(a => a.type === 'registration')
        });
      } catch (error) {
        console.error('Error fetching sekretaris dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchDashboardData();
  }, []);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard Sekretaris</h2>
        <div className="flex items-center space-x-2">
          <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
            Sekretaris
          </div>
        </div>
      </div>
      
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Ikhtisar</TabsTrigger>
          <TabsTrigger value="approvals">Persetujuan</TabsTrigger>
          <TabsTrigger value="members">Anggota</TabsTrigger>
          <TabsTrigger value="communications">Komunikasi</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Memuat data...</span>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card className="bg-gradient-to-br from-purple-400 to-purple-500 text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pendaftaran Baru</CardTitle>
                  <UserPlus className="h-4 w-4 text-white" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardData.pendingRegistrations}</div>
                  <p className="text-xs text-purple-100">Menunggu persetujuan</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-pink-400 to-pink-500 text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Anggota</CardTitle>
                  <Users className="h-4 w-4 text-white" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardData.totalMembers}</div>
                  <p className="text-xs text-pink-100">Anggota aktif</p>
                </CardContent>
              </Card>
            
            <Card className="bg-gradient-to-br from-violet-400 to-violet-500 text-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Notifikasi</CardTitle>
                <Bell className="h-4 w-4 text-white" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">8</div>
                <p className="text-xs text-violet-100">Belum dibaca</p>
              </CardContent>
            </Card>
            </div>
          )}
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Pendaftaran Terbaru</CardTitle>
                <CardDescription>
                  Pendaftaran anggota baru yang menunggu persetujuan
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center items-center h-40">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : dashboardData.recentActivities.length > 0 ? (
                  <div className="space-y-4">
                    {dashboardData.recentActivities.map((activity: Activity) => (
                      <div key={activity.id} className="flex items-center">
                        <div className="mr-2 h-2 w-2 rounded-full bg-purple-500" />
                        <div className="flex-1">
                          <p className="text-sm font-medium leading-none">
                            {activity.description}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatRelativeTime(activity.created_at)}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Link href={`/approvals?id=${activity.id}`}>
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                              <XCircle className="h-4 w-4 text-red-500" />
                            </Button>
                          </Link>
                          <Link href={`/approvals?id=${activity.id}&action=approve`}>
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Tidak ada pendaftaran baru yang menunggu persetujuan
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Aksi Cepat</CardTitle>
                <CardDescription>
                  Akses cepat ke fitur sekretaris
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2">
                <Link href="/approvals">
                  <Button className="w-full justify-start" variant="outline">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Persetujuan Nasabah
                  </Button>
                </Link>
                <Link href="/users">
                  <Button className="w-full justify-start" variant="outline">
                    <Users className="mr-2 h-4 w-4" />
                    Kelola Anggota
                  </Button>
                </Link>
                <Link href="/notifications">
                  <Button className="w-full justify-start" variant="outline">
                    <Bell className="mr-2 h-4 w-4" />
                    Notifikasi
                  </Button>
                </Link>
                <Button className="w-full justify-start" variant="outline">
                  <Mail className="mr-2 h-4 w-4" />
                  Kirim Pengumuman
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <FileText className="mr-2 h-4 w-4" />
                  Buat Laporan Anggota
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="approvals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Persetujuan Nasabah</CardTitle>
              <CardDescription>
                Kelola persetujuan pendaftaran nasabah baru
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Menunggu Persetujuan (15)</h3>
                  <Link href="/approvals">
                    <Button>
                      Lihat Semua
                    </Button>
                  </Link>
                </div>
                
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-start gap-4 rounded-lg border p-4">
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <h4 className="text-sm font-medium">{`Nasabah ${i}`}</h4>
                          <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">Menunggu</span>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-muted-foreground">No. Identitas:</p>
                            <p className="font-medium">{`ID-${1000 + i}`}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">No. Telepon:</p>
                            <p className="font-medium">{`+628123456${i}`}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Tanggal Daftar:</p>
                            <p className="font-medium">{`${i} Mei 2025`}</p>
                          </div>
                        </div>
                        <div className="mt-4 flex gap-2 justify-end">
                          <Button variant="outline" size="sm">
                            <XCircle className="mr-2 h-4 w-4 text-red-500" />
                            Tolak
                          </Button>
                          <Button size="sm" className="bg-green-500 hover:bg-green-600">
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Setujui
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Manajemen Anggota</CardTitle>
              <CardDescription>
                Kelola data anggota koperasi
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">
                    {isLoading ? (
                      <span>Anggota Aktif (Loading...)</span>
                    ) : (
                      <span>Anggota Aktif ({dashboardData.totalMembers})</span>
                    )}
                  </h3>
                  <Link href="/users">
                    <Button>
                      Lihat Semua
                    </Button>
                  </Link>
                </div>
                
                <div className="rounded-md border">
                  <div className="grid grid-cols-4 gap-4 p-4 font-medium border-b">
                    <div>Nama</div>
                    <div>No. Anggota</div>
                    <div>Status</div>
                    <div>Aksi</div>
                  </div>
                  
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="grid grid-cols-4 gap-4 p-4 border-b last:border-0">
                      <div className="font-medium">{`Anggota ${i}`}</div>
                      <div>{`A-${1000 + i}`}</div>
                      <div>
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                          Aktif
                        </span>
                      </div>
                      <div>
                        <Button variant="outline" size="sm">
                          Detail
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="communications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Komunikasi</CardTitle>
              <CardDescription>
                Kelola komunikasi dan pengumuman
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Buat Pengumuman</h3>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Judul</label>
                    <input 
                      type="text" 
                      className="w-full rounded-md border border-input bg-background px-3 py-2"
                      placeholder="Masukkan judul pengumuman"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Isi Pengumuman</label>
                    <textarea 
                      className="w-full rounded-md border border-input bg-background px-3 py-2 min-h-[100px]"
                      placeholder="Masukkan isi pengumuman"
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button>
                      <Mail className="mr-2 h-4 w-4" />
                      Kirim Pengumuman
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Pengumuman Terbaru</h3>
                  
                  <div className="space-y-4">
                    {[1, 2].map((i) => (
                      <div key={i} className="rounded-lg border p-4">
                        <h4 className="font-medium">{`Pengumuman ${i}: Informasi Penting`}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {`Ini adalah pengumuman penting untuk semua anggota koperasi.`}
                        </p>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-xs text-muted-foreground">
                            {`Dikirim: ${i} hari yang lalu`}
                          </span>
                          <Button variant="outline" size="sm">
                            Lihat Detail
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
