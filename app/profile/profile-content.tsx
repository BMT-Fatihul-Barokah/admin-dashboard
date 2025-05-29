"use client";

import { useState, useEffect } from "react";
import { useAdminAuth } from "@/lib/admin-auth-context";
import { getRoleTheme } from "@/lib/role-theme";
import { logActivity } from "@/lib/activity-logger";
import { ActivityLogViewer } from "@/components/activity-log-viewer";
import { createClient } from "@supabase/supabase-js";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { User, Key, Shield, AlertTriangle } from "lucide-react";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Extend AdminUser type if needed
interface AdminUserExtended {
  id: string;
  username: string;
  email: string;
  nama: string;
  role: string;
  role_name?: string;
  last_login?: string;
  created_at?: string;
}

// Content component that safely uses hooks
export default function ProfileContent({ defaultTab = "profile" }: { defaultTab?: string }) {
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAdminAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Add a loading state that combines authentication loading and local loading
  useEffect(() => {
    // Set loading to false once authentication is complete and user data is loaded
    if (!authLoading) {
      setIsLoading(false);
    }
  }, [authLoading]);
  
  // Form states
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Get role-specific theme
  const roleTheme = user ? getRoleTheme(user.role) : { primary: "", secondary: "", badge: "" };
  
  // Load user data
  useEffect(() => {
    if (user) {
      setNama(user.nama || "");
      setEmail(user.email || "");
    }
  }, [user]);
  
  // Format date
  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      // Check if date is valid before formatting
      if (isNaN(date.getTime())) return "-";
      
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return "-";
    }
  };
  
  // Update profile
  const handleUpdateProfile = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .update({
          nama: nama,
          email: email,
        })
        .eq('id', user.id);
      
      if (error) throw error;
      
      // Log the activity
      await logActivity({
        userId: user.id,
        actionType: 'update',
        entityType: 'admin_users',
        entityId: user.id,
        description: `Memperbarui profil pengguna`,
        metadata: { fields: ['nama', 'email'] }
      });
      
      toast({
        title: "Berhasil",
        description: "Profil berhasil diperbarui",
      });
      
      // Refresh user data by reloading the page after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Gagal memperbarui profil",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Change password
  const handleChangePassword = async () => {
    if (!user) return;
    
    // Validate passwords
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Konfirmasi password baru tidak cocok",
        variant: "destructive",
      });
      return;
    }
    
    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password baru minimal 6 karakter",
        variant: "destructive",
      });
      return;
    }
    
    setIsSaving(true);
    try {
      // In a real application, you would verify the current password first
      // For this demo, we'll skip that step
      
      const { data, error } = await supabase
        .from('admin_users')
        .update({
          password: newPassword, // In a real app, this would be hashed
        })
        .eq('id', user.id);
      
      if (error) throw error;
      
      // Log the activity
      await logActivity({
        userId: user.id,
        actionType: 'update',
        entityType: 'admin_users',
        entityId: user.id,
        description: `Mengubah password`,
        metadata: { fields: ['password'] }
      });
      
      toast({
        title: "Berhasil",
        description: "Password berhasil diubah",
      });
      
      // Clear password fields
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error('Error changing password:', error);
      toast({
        title: "Error",
        description: "Gagal mengubah password",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Get initials for avatar
  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };
  
  if (!user) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="py-10">
            <div className="text-center">
              <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Tidak Dapat Memuat Profil</h2>
              <p className="text-muted-foreground mb-6">
                Silakan login terlebih dahulu untuk melihat profil Anda.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center mb-6">
        <h1 className="text-3xl font-bold">Profil Saya</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Informasi Profil</CardTitle>
            <CardDescription>Lihat dan perbarui informasi profil Anda</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="profile">
              <TabsList className="mb-4">
                <TabsTrigger value="profile">Profil</TabsTrigger>
                <TabsTrigger value="security">Keamanan</TabsTrigger>
              </TabsList>
              
              <TabsContent value="profile">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={user?.username || ''}
                        disabled
                      />
                      <p className="text-xs text-muted-foreground">
                        Username tidak dapat diubah
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="role">Peran</Label>
                      <div className="flex items-center h-10 px-3 rounded-md border">
                        <Badge className={roleTheme.badge}>
                          {user?.role || '-'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Peran hanya dapat diubah oleh admin
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="nama">Nama Lengkap</Label>
                    <Input
                      id="nama"
                      value={nama}
                      onChange={(e) => setNama(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  
                  <Button 
                    onClick={handleUpdateProfile} 
                    disabled={isSaving}
                    className={roleTheme.primary}
                  >
                    {isSaving ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></div>
                        Menyimpan
                      </>
                    ) : (
                      'Simpan Perubahan'
                    )}
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="security">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Password Saat Ini</Label>
                    <Input
                      id="current-password"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="new-password">Password Baru</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Konfirmasi Password Baru</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                  
                  <div className="bg-yellow-50 border border-yellow-100 rounded-md p-3 text-sm text-yellow-800">
                    <AlertTriangle className="h-4 w-4 inline-block mr-2" />
                    Catatan: Untuk keamanan, Anda akan diminta untuk login kembali setelah mengubah password.
                  </div>
                  
                  <Button 
                    onClick={handleChangePassword} 
                    disabled={isSaving}
                    className={roleTheme.primary}
                  >
                    {isSaving ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></div>
                        Menyimpan
                      </>
                    ) : (
                      'Ubah Password'
                    )}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informasi Akun</CardTitle>
              <CardDescription>Detail informasi akun Anda</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center">
                <Avatar className="h-24 w-24 mb-4">
                  <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.nama || 'user'}`} alt={user?.nama || 'User'} />
                  <AvatarFallback className={roleTheme.primary}>
                    {getInitials(user?.nama || 'User')}
                  </AvatarFallback>
                </Avatar>
                
                <h3 className="text-xl font-semibold">{user?.nama || 'User'}</h3>
                <Badge className={roleTheme.badge}>
                  {user?.role || '-'}
                </Badge>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Username</span>
                  <span className="font-medium">{user?.username || '-'}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-medium">{user?.email || '-'}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Login Terakhir</span>
                  <span className="font-medium">{formatDate(user ? (user as any).last_login : undefined)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Akun Dibuat</span>
                  <span className="font-medium">{formatDate(user ? (user as any).created_at : undefined)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {user?.id && (
            <ActivityLogViewer 
              userId={user.id}
              limit={5}
              className="shadow-sm"
            />
          )}
        </div>
      </div>
    </div>
  );
}
