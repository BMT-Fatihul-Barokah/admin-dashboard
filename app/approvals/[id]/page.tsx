"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/lib/admin-auth-context";
import { RoleActionButton } from "@/components/role-action-button";
import { logActivity } from "@/lib/activity-logger";
import { ActivityLogViewer } from "@/components/activity-log-viewer";
import { getRoleTheme } from "@/lib/role-theme";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, CheckCircle, XCircle, FileText, User, Phone, Calendar, Clock, MapPin, Info } from "lucide-react";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Define types based on database schema
interface CustomerDetail {
  id: string;
  nama: string;
  noIdentitas: string;
  noTelepon: string;
  alamat: string;
  pekerjaan: string;
  penghasilan: number;
  status: string;
  created_at: string;
  updated_at: string;
  alasan_penolakan: string | null;
  akun_id: string;
  foto_ktp: string | null;
  foto_diri: string | null;
  email: string | null;
  tanggal_lahir: string | null;
}

export default function CustomerDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAdminAuth();
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [rejectReason, setRejectReason] = useState("");
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  
  // Get role-specific theme
  const roleTheme = user ? getRoleTheme(user.role) : { primary: "", secondary: "", badge: "" };
  
  // Fetch customer details
  const fetchCustomerDetails = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('pendaftaran')
        .select('*')
        .eq('id', params.id)
        .single();
      
      if (error) throw error;
      
      setCustomer(data as CustomerDetail);
    } catch (error) {
      console.error('Error fetching customer details:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data nasabah",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load customer details on component mount
  useEffect(() => {
    fetchCustomerDetails();
  }, [params.id]);
  
  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch (error) {
      return dateString;
    }
  };
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };
  
  // Handle approve customer
  const handleApprove = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('pendaftaran')
        .update({ status: 'diterima' })
        .eq('id', params.id);
      
      if (error) throw error;
      
      // Update akun table to set is_active to true
      const { data: akunData, error: akunError } = await supabase
        .from('akun')
        .update({ is_active: true })
        .eq('id', customer?.akun_id);
      
      if (akunError) throw akunError;
      
      // Log the activity
      if (user) {
        await logActivity({
          userId: user.id,
          actionType: 'approve',
          entityType: 'pendaftaran',
          entityId: params.id,
          description: `Menyetujui pendaftaran nasabah ${customer?.nama}`,
          metadata: { status: 'diterima' }
        });
      }
      
      toast({
        title: "Berhasil",
        description: "Pendaftaran nasabah berhasil disetujui",
      });
      
      // Refresh data
      fetchCustomerDetails();
    } catch (error) {
      console.error('Error approving customer:', error);
      toast({
        title: "Error",
        description: "Gagal menyetujui pendaftaran nasabah",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle reject customer
  const handleReject = async () => {
    if (!rejectReason) {
      toast({
        title: "Error",
        description: "Alasan penolakan harus diisi",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('pendaftaran')
        .update({
          status: 'ditolak',
          alasan_penolakan: rejectReason
        })
        .eq('id', params.id);
      
      if (error) throw error;
      
      // Log the activity
      if (user) {
        await logActivity({
          userId: user.id,
          actionType: 'reject',
          entityType: 'pendaftaran',
          entityId: params.id,
          description: `Menolak pendaftaran nasabah ${customer?.nama}`,
          metadata: {
            status: 'ditolak',
            alasan_penolakan: rejectReason
          }
        });
      }
      
      toast({
        title: "Berhasil",
        description: "Pendaftaran nasabah berhasil ditolak",
      });
      
      // Reset rejection reason and close dialog
      setRejectReason('');
      setIsRejectDialogOpen(false);
      
      // Refresh data
      fetchCustomerDetails();
    } catch (error) {
      console.error('Error rejecting customer:', error);
      toast({
        title: "Error",
        description: "Gagal menolak pendaftaran nasabah",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'menunggu':
        return <Badge className="bg-yellow-100 text-yellow-800">Menunggu</Badge>;
      case 'diterima':
        return <Badge className="bg-green-100 text-green-800">Diterima</Badge>;
      case 'ditolak':
        return <Badge className="bg-red-100 text-red-800">Ditolak</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center mb-6">
          <Button variant="outline" size="sm" className="mr-4" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Button>
          <h1 className="text-2xl font-bold">Memuat Data Nasabah...</h1>
        </div>
        <div className="grid gap-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardHeader className="h-24 bg-gray-100"></CardHeader>
              <CardContent className="h-48 bg-gray-50"></CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }
  
  if (!customer) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center mb-6">
          <Button variant="outline" size="sm" className="mr-4" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Button>
          <h1 className="text-2xl font-bold">Data Nasabah Tidak Ditemukan</h1>
        </div>
        <Card>
          <CardContent className="py-10">
            <div className="text-center">
              <Info className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Data Tidak Ditemukan</h2>
              <p className="text-muted-foreground mb-6">
                Data nasabah dengan ID {params.id} tidak ditemukan atau telah dihapus.
              </p>
              <Button onClick={() => router.push('/approvals')}>
                Kembali ke Daftar Persetujuan
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center mb-6">
        <Button variant="outline" size="sm" className="mr-4" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Button>
        <h1 className="text-2xl font-bold">Detail Nasabah</h1>
        <div className="ml-auto flex items-center gap-2">
          {getStatusBadge(customer.status)}
          {customer.status === 'menunggu' && (
            <>
              <RoleActionButton
                variant="default"
                size="sm"
                allowedRoles={['admin', 'sekretaris']}
                action="approve"
                tooltipMessage="Anda tidak memiliki izin untuk menyetujui pendaftaran"
                onClick={handleApprove}
                disabled={isLoading}
                className={roleTheme.primary}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Setujui
              </RoleActionButton>
              
              <RoleActionButton
                variant="outline"
                size="sm"
                allowedRoles={['admin', 'sekretaris']}
                action="reject"
                tooltipMessage="Anda tidak memiliki izin untuk menolak pendaftaran"
                onClick={() => setIsRejectDialogOpen(true)}
                disabled={isLoading}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Tolak
              </RoleActionButton>
            </>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Informasi Nasabah</CardTitle>
            <CardDescription>Detail informasi pendaftaran nasabah</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="personal">
              <TabsList className="mb-4">
                <TabsTrigger value="personal">Data Pribadi</TabsTrigger>
                <TabsTrigger value="financial">Data Keuangan</TabsTrigger>
                <TabsTrigger value="documents">Dokumen</TabsTrigger>
              </TabsList>
              
              <TabsContent value="personal">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-muted-foreground text-sm">Nama Lengkap</Label>
                      <div className="flex items-center mt-1">
                        <User className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="font-medium">{customer.nama}</span>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-muted-foreground text-sm">Nomor Identitas (KTP)</Label>
                      <div className="flex items-center mt-1">
                        <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="font-medium">{customer.noIdentitas}</span>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-muted-foreground text-sm">Nomor Telepon</Label>
                      <div className="flex items-center mt-1">
                        <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="font-medium">{customer.noTelepon}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <Label className="text-muted-foreground text-sm">Email</Label>
                      <div className="flex items-center mt-1">
                        <span className="font-medium">{customer.email || '-'}</span>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-muted-foreground text-sm">Tanggal Lahir</Label>
                      <div className="flex items-center mt-1">
                        <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="font-medium">{formatDate(customer.tanggal_lahir)}</span>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-muted-foreground text-sm">Alamat</Label>
                      <div className="flex items-start mt-1">
                        <MapPin className="h-4 w-4 mr-2 text-muted-foreground mt-1" />
                        <span className="font-medium">{customer.alamat}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="financial">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-muted-foreground text-sm">Pekerjaan</Label>
                      <div className="flex items-center mt-1">
                        <span className="font-medium">{customer.pekerjaan}</span>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-muted-foreground text-sm">Penghasilan Bulanan</Label>
                      <div className="flex items-center mt-1">
                        <span className="font-medium">{formatCurrency(customer.penghasilan)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="documents">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-muted-foreground text-sm mb-2 block">Foto KTP</Label>
                    {customer.foto_ktp ? (
                      <div className="border rounded-md overflow-hidden">
                        <img 
                          src={`${supabaseUrl}/storage/v1/object/public/customer-documents/${customer.foto_ktp}`} 
                          alt="Foto KTP" 
                          className="w-full h-auto"
                        />
                      </div>
                    ) : (
                      <div className="border rounded-md p-4 text-center text-muted-foreground">
                        Tidak ada foto KTP
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <Label className="text-muted-foreground text-sm mb-2 block">Foto Diri</Label>
                    {customer.foto_diri ? (
                      <div className="border rounded-md overflow-hidden">
                        <img 
                          src={`${supabaseUrl}/storage/v1/object/public/customer-documents/${customer.foto_diri}`} 
                          alt="Foto Diri" 
                          className="w-full h-auto"
                        />
                      </div>
                    ) : (
                      <div className="border rounded-md p-4 text-center text-muted-foreground">
                        Tidak ada foto diri
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status Pendaftaran</CardTitle>
              <CardDescription>Informasi status pendaftaran nasabah</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label className="text-muted-foreground text-sm">Status</Label>
                  <div className="mt-1">
                    {getStatusBadge(customer.status)}
                  </div>
                </div>
                
                <div>
                  <Label className="text-muted-foreground text-sm">Tanggal Pendaftaran</Label>
                  <div className="flex items-center mt-1">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="font-medium">{formatDate(customer.created_at)}</span>
                  </div>
                </div>
                
                <div>
                  <Label className="text-muted-foreground text-sm">Terakhir Diperbarui</Label>
                  <div className="flex items-center mt-1">
                    <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="font-medium">{formatDate(customer.updated_at)}</span>
                  </div>
                </div>
                
                {customer.status === 'ditolak' && customer.alasan_penolakan && (
                  <div>
                    <Label className="text-muted-foreground text-sm">Alasan Penolakan</Label>
                    <div className="mt-1 p-3 bg-red-50 border border-red-100 rounded-md text-sm">
                      {customer.alasan_penolakan}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          <ActivityLogViewer 
            entityType="pendaftaran"
            entityId={params.id}
            limit={5}
            className="shadow-sm"
          />
        </div>
      </div>
      
      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tolak Pendaftaran Nasabah</DialogTitle>
            <DialogDescription>
              Masukkan alasan penolakan untuk nasabah {customer.nama}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="reason">Alasan Penolakan</Label>
              <Textarea
                id="reason"
                placeholder="Masukkan alasan penolakan"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)} disabled={isLoading}>
              Batal
            </Button>
            <Button onClick={handleReject} disabled={isLoading || !rejectReason.trim()}>
              {isLoading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></div>
                  Memproses
                </>
              ) : (
                'Tolak Nasabah'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
