"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Users, UserPlus, CheckCircle, XCircle, Bell, FileText, Mail, Loader2, Eye, UserCheck, AlertCircle, ChevronDown, ChevronUp, Phone, Calendar, User } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";
import { useAdminAuth } from "@/lib/admin-auth-context";
import { 
  testDatabaseConnection,
  getTotalAnggota, 
  getPendingRegistrations,
  getRecentMembers
} from '@/lib/dashboard-data';
import { format, parseISO, formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

// Activity type definition
type Activity = {
  id: string;
  type: 'transaction' | 'registration' | 'loan';
  description: string;
  amount?: number;
  created_at: string;
  status?: string;
};

// Member type definition
type Member = {
  id: string;
  nama: string;
  nomor_anggota: string;
  is_active: boolean;
  created_at: string;
  alamat?: string;
  telepon?: string;
  email?: string;
  tanggal_bergabung?: string;
};

export function SekretarisDashboard() {
  const { user } = useAdminAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [membersLoading, setMembersLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    totalMembers: 0,
    pendingRegistrations: 0,
    notifications: 8
  });
  const [recentMembers, setRecentMembers] = useState<Member[]>([]);
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null);
  
  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    try {
      return formatDistanceToNow(parseISO(dateString), { addSuffix: true, locale: id });
    } catch (error) {
      return dateString;
    }
  };
  
  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  // Get status color
  const getStatusColor = (isActive: boolean) => {
    return isActive 
      ? "bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200" 
      : "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200";
  };
  
  // Get status text
  const getStatusText = (isActive: boolean) => {
    return isActive ? "Aktif" : "Nonaktif";
  };
  
  useEffect(() => {
    async function fetchDashboardData() {
      setIsLoading(true);
      try {
        console.log('Fetching sekretaris dashboard data...');
        const members = await getTotalAnggota();
        
        console.log('Sekretaris dashboard data fetched:', {
          members
        });
        
        setDashboardData({
          totalMembers: members,
          pendingRegistrations: 0,
          notifications: 8
        });
      } catch (error) {
        console.error('Error fetching sekretaris dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchDashboardData();
  }, []);
  
  useEffect(() => {
    async function fetchRecentMembers() {
      setMembersLoading(true);
      try {
        const members = await getRecentMembers(5);
        if (members && members.length > 0) {
          setRecentMembers(members);
        } else {
          // If no members are returned, set an empty array
          setRecentMembers([]);
        }
      } catch (error) {
        console.error('Error fetching recent members:', error);
        // On error, use placeholder data
        const placeholderData = [
          {
            id: '1',
            nama: 'Ahmad Fauzi',
            nomor_anggota: 'A-1001',
            is_active: true,
            created_at: new Date(Date.now() - 3600000).toISOString()
          },
          {
            id: '2',
            nama: 'Iqbal Isya Fathurrohman',
            nomor_anggota: 'A-1002',
            is_active: true,
            created_at: new Date(Date.now() - 7200000).toISOString()
          },
          {
            id: '3',
            nama: 'Safarina M QQ.Huda',
            nomor_anggota: 'A-1003',
            is_active: true,
            created_at: new Date(Date.now() - 10800000).toISOString()
          },
          {
            id: '4',
            nama: 'Amrina QQ Choirudin',
            nomor_anggota: 'A-1004',
            is_active: true,
            created_at: new Date(Date.now() - 14400000).toISOString()
          },
          {
            id: '5',
            nama: 'M.sabilul M.QQ H.N',
            nomor_anggota: 'A-1005',
            is_active: false,
            created_at: new Date(Date.now() - 18000000).toISOString()
          }
        ];
        setRecentMembers(placeholderData);
      } finally {
        setMembersLoading(false);
      }
    }
    
    fetchRecentMembers();
  }, []);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard Sekretaris</h2>
        <div className="flex items-center space-x-2">
          <ThemeToggle />
          <div className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-3 py-1 rounded-full text-sm font-medium">
            Sekretaris
          </div>
        </div>
      </div>
      
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Ikhtisar</TabsTrigger>
          <TabsTrigger value="members">Anggota</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Memuat data...</span>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Link href="/users" className="block">
                <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 border-emerald-200 dark:border-emerald-800 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:translate-y-[-2px]">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Total Anggota</CardTitle>
                    <div className="h-10 w-10 rounded-full bg-emerald-200 dark:bg-emerald-800 flex items-center justify-center">
                      <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-300" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <Skeleton className="h-9 w-16 bg-emerald-100" />
                    ) : (
                      <>
                        <div className="text-3xl font-bold text-emerald-900 dark:text-emerald-100">{dashboardData.totalMembers}</div>
                        <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">Anggota aktif</p>
                      </>
                    )}
                  </CardContent>
                </Card>
              </Link>
            
              <Link href="/notifications" className="block">
                <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 border-amber-200 dark:border-amber-800 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:translate-y-[-2px]">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-300">Notifikasi</CardTitle>
                    <div className="h-10 w-10 rounded-full bg-amber-200 dark:bg-amber-800 flex items-center justify-center">
                      <Bell className="h-5 w-5 text-amber-600 dark:text-amber-300" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <Skeleton className="h-9 w-16 bg-amber-100" />
                    ) : (
                      <>
                        <div className="text-3xl font-bold text-amber-900 dark:text-amber-100">{dashboardData.notifications}</div>
                        <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">Belum dibaca</p>
                      </>
                    )}
                  </CardContent>
                </Card>
              </Link>
            
              <Link href="/notifications/settings" className="block">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:translate-y-[-2px]">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">Pengumuman</CardTitle>
                    <div className="h-10 w-10 rounded-full bg-blue-200 dark:bg-blue-800 flex items-center justify-center">
                      <Mail className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <Skeleton className="h-9 w-16 bg-blue-100" />
                    ) : (
                      <>
                        <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">3</div>
                        <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">Pengumuman aktif</p>
                      </>
                    )}
                  </CardContent>
                </Card>
              </Link>
            </div>
          )}
          
          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
            <Card className="col-span-1 lg:col-span-3 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all duration-200 border-blue-50 dark:border-blue-900">
              <CardHeader>
                <CardTitle>Aksi Cepat</CardTitle>
                <CardDescription>
                  Akses cepat ke fitur sekretaris
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Link href="/users" className="w-full">
                    <Button className="w-full justify-start bg-emerald-50 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-800 hover:text-emerald-800 dark:hover:text-emerald-200">
                      <Users className="mr-2 h-5 w-5" />
                      Kelola Anggota
                    </Button>
                  </Link>
                  <Link href="/notifications" className="w-full">
                    <Button className="w-full justify-start bg-amber-50 dark:bg-amber-900 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-800 hover:text-amber-800 dark:hover:text-amber-200">
                      <Bell className="mr-2 h-5 w-5" />
                      Notifikasi
                    </Button>
                  </Link>

                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        

        
        <TabsContent value="members" className="space-y-4">
          <Card className="bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all duration-200 border-blue-50 dark:border-blue-900">
            <CardHeader>
              <CardTitle>Manajemen Anggota</CardTitle>
              <CardDescription>
                Kelola data anggota koperasi
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200">
                    {isLoading ? (
                      <span>Anggota Aktif <Skeleton className="inline-block h-6 w-12 align-middle ml-2" /></span>
                    ) : (
                      <span>Anggota Aktif ({dashboardData.totalMembers})</span>
                    )}
                  </h3>
                  <Link href="/users">
                    <Button className="bg-emerald-600 hover:bg-emerald-700">
                      <Users className="mr-2 h-4 w-4" />
                      Lihat Semua
                    </Button>
                  </Link>
                </div>
                
                <div className="rounded-lg border shadow-sm overflow-hidden">
                  <div className="grid grid-cols-5 gap-4 p-4 font-medium border-b bg-slate-50 dark:bg-slate-800 dark:border-slate-700">
                    <div className="col-span-2">Nama</div>
                    <div>No. Anggota</div>
                    <div>Status</div>
                    <div>Aksi</div>
                  </div>
                  
                  {membersLoading ? (
                    // Loading skeletons
                    Array(5).fill(0).map((_, i) => (
                      <div key={i} className="grid grid-cols-5 gap-4 p-4 border-b last:border-0">
                        <div className="col-span-2 flex items-center">
                          <Skeleton className="h-8 w-8 rounded-full mr-2" />
                          <Skeleton className="h-5 w-32" />
                        </div>
                        <div>
                          <Skeleton className="h-5 w-16" />
                        </div>
                        <div>
                          <Skeleton className="h-6 w-16 rounded-full" />
                        </div>
                        <div className="flex items-center">
                          <Skeleton className="h-8 w-16 rounded-md" />
                        </div>
                      </div>
                    ))
                  ) : recentMembers && recentMembers.length > 0 ? (
                    recentMembers.map((member) => (
                      <Collapsible 
                        key={member.id} 
                        open={expandedMemberId === member.id}
                        onOpenChange={(open) => {
                          setExpandedMemberId(open ? member.id : null);
                        }}
                        className="border-b last:border-0"
                      >
                        <div className="grid grid-cols-5 gap-4 p-4 hover:bg-slate-50 transition-colors">
                          <div className="col-span-2 flex items-center">
                            <Avatar className="h-8 w-8 mr-2 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300">
                              <AvatarFallback>{getInitials(member.nama || 'User')}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-slate-800 dark:text-slate-200">{member.nama || 'Unnamed Member'}</span>
                          </div>
                          <div className="text-slate-600 dark:text-slate-400 flex items-center">{member.nomor_anggota || '-'}</div>
                          <div className="flex items-center">
                            <Badge className={getStatusColor(member.is_active)}>
                              {getStatusText(member.is_active)}
                            </Badge>
                          </div>
                          <div className="flex items-center">
                            <CollapsibleTrigger asChild>
                              <Button variant="outline" size="sm" className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 border-blue-200">
                                {expandedMemberId === member.id ? (
                                  <>
                                    <ChevronUp className="h-3.5 w-3.5 mr-1" />
                                    Tutup
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="h-3.5 w-3.5 mr-1" />
                                    Detail
                                  </>
                                )}
                              </Button>
                            </CollapsibleTrigger>
                          </div>
                        </div>
                        
                        <CollapsibleContent>
                          <div className="bg-slate-50 dark:bg-slate-800 p-4 border-t border-slate-100 dark:border-slate-700">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Informasi Anggota</h4>
                                <ul className="space-y-2">
                                  <li className="flex items-start">
                                    <User className="h-4 w-4 mr-2 text-slate-400 dark:text-slate-500 mt-0.5" />
                                    <div>
                                      <span className="text-xs text-slate-500 dark:text-slate-400 block">Nama Lengkap</span>
                                      <span className="text-sm font-medium dark:text-slate-300">{member.nama || 'Tidak ada data'}</span>
                                    </div>
                                  </li>
                                  <li className="flex items-start">
                                    <Phone className="h-4 w-4 mr-2 text-slate-400 dark:text-slate-500 mt-0.5" />
                                    <div>
                                      <span className="text-xs text-slate-500 dark:text-slate-400 block">Telepon</span>
                                      <span className="text-sm font-medium dark:text-slate-300">{member.telepon || '+62 XXX-XXXX-XXXX'}</span>
                                    </div>
                                  </li>
                                  <li className="flex items-start">
                                    <Mail className="h-4 w-4 mr-2 text-slate-400 dark:text-slate-500 mt-0.5" />
                                    <div>
                                      <span className="text-xs text-slate-500 dark:text-slate-400 block">Email</span>
                                      <span className="text-sm font-medium dark:text-slate-300">{member.email || 'email@example.com'}</span>
                                    </div>
                                  </li>
                                </ul>
                              </div>
                              <div>
                                <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Status Keanggotaan</h4>
                                <ul className="space-y-2">
                                  <li className="flex items-start">
                                    <Calendar className="h-4 w-4 mr-2 text-slate-400 dark:text-slate-500 mt-0.5" />
                                    <div>
                                      <span className="text-xs text-slate-500 dark:text-slate-400 block">Tanggal Bergabung</span>
                                      <span className="text-sm font-medium dark:text-slate-300">
                                        {member.tanggal_bergabung ? 
                                          format(parseISO(member.tanggal_bergabung), 'dd MMMM yyyy', {locale: id}) : 
                                          format(parseISO(member.created_at), 'dd MMMM yyyy', {locale: id})}
                                      </span>
                                    </div>
                                  </li>
                                  <li className="flex items-start">
                                    <Users className="h-4 w-4 mr-2 text-slate-400 dark:text-slate-500 mt-0.5" />
                                    <div>
                                      <span className="text-xs text-slate-500 dark:text-slate-400 block">Nomor Anggota</span>
                                      <span className="text-sm font-medium dark:text-slate-300">{member.nomor_anggota || '-'}</span>
                                    </div>
                                  </li>
                                  <li className="flex items-start">
                                    <CheckCircle className="h-4 w-4 mr-2 text-slate-400 dark:text-slate-500 mt-0.5" />
                                    <div>
                                      <span className="text-xs text-slate-500 dark:text-slate-400 block">Status</span>
                                      <Badge className={getStatusColor(member.is_active)}>
                                        {getStatusText(member.is_active)}
                                      </Badge>
                                    </div>
                                  </li>
                                </ul>
                              </div>
                            </div>
                            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-end">
                              <Link href={`/users/${member.id}`}>
                                <Button variant="outline" size="sm" className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900 border-blue-200 dark:border-blue-800">
                                  <Eye className="h-3.5 w-3.5 mr-1" />
                                  Lihat Profil Lengkap
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    ))
                  ) : (
                    <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                      <AlertCircle className="h-8 w-8 mx-auto mb-2 text-slate-400 dark:text-slate-500" />
                      <p>Tidak ada data anggota ditemukan</p>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-between items-center pt-2">
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    Menampilkan {recentMembers ? recentMembers.length : 0} dari {dashboardData.totalMembers} anggota
                  </span>
                  <div>
                    <Link href="/users">
                      <Button className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800">
                        <UserCheck className="h-4 w-4 mr-1" />
                        Kelola Semua
                      </Button>
                    </Link>
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
