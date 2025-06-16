"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bell, CheckCircle, CreditCard, Info, Settings, User, Wallet, X, ArrowRight, Calendar, Clock, AlertCircle, Plus, Search, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/use-toast"
import Link from "next/link"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { fetchNotifications, CombinedNotification, isJatuhTempoNotification } from '@/lib/notifications';
import { supabase } from "@/lib/supabase"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<CombinedNotification[]>([])
  const [unreadNotifications, setUnreadNotifications] = useState<CombinedNotification[]>([])
  const [transactionNotifications, setTransactionNotifications] = useState<CombinedNotification[]>([])
  const [systemNotifications, setSystemNotifications] = useState<CombinedNotification[]>([])
  const [announcementNotifications, setAnnouncementNotifications] = useState<CombinedNotification[]>([])
  const [jatuhTempoNotifications, setJatuhTempoNotifications] = useState<CombinedNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")
  const [selectedNotification, setSelectedNotification] = useState<CombinedNotification | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  
  // Create notification dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [anggotaList, setAnggotaList] = useState<{id: string, nama: string, nomor_rekening: string}[]>([])
  const [isLoadingAnggota, setIsLoadingAnggota] = useState(false)
  const [openAnggotaPopover, setOpenAnggotaPopover] = useState(false)
  const [anggotaSearchQuery, setAnggotaSearchQuery] = useState("")
  const [formData, setFormData] = useState({
    jenis: "info",
    judul: "",
    pesan: "",
    anggota_id: "",
    data: {},
    source: "global" as "global" | "transaction"
  })
  
  // Format the date to a readable format
  const formatDate = (date: Date) => {
    const now = new Date()
    const notificationDate = new Date(date)
    const diffTime = Math.abs(now.getTime() - notificationDate.getTime())
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60))
    const diffMinutes = Math.floor(diffTime / (1000 * 60))
    
    if (diffMinutes < 1) {
      return "Baru saja"
    } else if (diffMinutes < 60) {
      return `${diffMinutes} menit yang lalu`
    } else if (diffHours < 24) {
      return `${diffHours} jam yang lalu`
    } else {
      return `${diffDays} hari yang lalu`
    }
  }
  
  // Format the date to a full readable format
  const formatFullDate = (date: Date) => {
    return new Date(date).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  // Open notification detail
  const openNotificationDetail = (notification: CombinedNotification) => {
    setSelectedNotification(notification)
    setDetailOpen(true)
  }
  
  // Fetch notifications
  const loadNotifications = async () => {
    setLoading(true);
    try {
      console.log('Fetching notifications from page component...');
      const notifications = await fetchNotifications();
      console.log(`Page received ${notifications.length} notifications`);
      setNotifications(notifications);
      const unread = notifications.filter(notification => !notification.is_read);
      const transactions = notifications.filter(notification => 
        notification.jenis === 'transaksi' || notification.source === 'transaction'
      );
      const system = notifications.filter(notification => notification.jenis === 'sistem');
      const announcements = notifications.filter(notification => notification.jenis === 'pengumuman');
      const jatuhTempo = notifications.filter(notification => isJatuhTempoNotification(notification));
      
      setUnreadNotifications(unread);
      setTransactionNotifications(transactions);
      setSystemNotifications(system);
      setAnnouncementNotifications(announcements);
      setJatuhTempoNotifications(jatuhTempo);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast({
        title: "Error",
        description: "Gagal memuat notifikasi. Silakan coba lagi nanti.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch anggota list
  const fetchAnggota = async () => {
    setIsLoadingAnggota(true)
    try {
      const { data, error } = await supabase
        .from('anggota')
        .select('id, nama, nomor_rekening')
      
      if (error) throw error
      setAnggotaList(data || [])
    } catch (error) {
      console.error("Error fetching anggota:", error)
      toast({
        title: "Error",
        description: "Gagal memuat data anggota. Silakan coba lagi nanti.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingAnggota(false)
    }
  }

  // Create a new notification
  const createNotification = async () => {
    try {
      const anggotaIdValue = formData.anggota_id || null

      if (formData.source === 'global') {
        // Create a global notification
        const { data, error } = await supabase
          .from('global_notifikasi')
          .insert([
            {
              anggota_id: anggotaIdValue,
              judul: formData.judul,
              pesan: formData.pesan,
              jenis: formData.jenis,
              data: formData.data || {},
            }
          ])
          .select()

        if (error) throw error
      } else {
        // For transaction notifications, we would typically not create them manually
        toast({
          title: "Info",
          description: "Notifikasi transaksi biasanya dibuat secara otomatis oleh sistem.",
          variant: "default",
        })
        return
      }
      
      toast({
        title: "Sukses",
        description: "Notifikasi berhasil dibuat.",
      })
      
      setCreateDialogOpen(false)
      resetForm()
      loadNotifications()
    } catch (error) {
      console.error("Error creating notification:", error)
      toast({
        title: "Error",
        description: "Gagal membuat notifikasi. Silakan coba lagi nanti.",
        variant: "destructive",
      })
    }
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      jenis: "info",
      judul: "",
      pesan: "",
      anggota_id: "",
      data: {},
      source: "global"
    })
    setAnggotaSearchQuery("")
  }

  // Fetch notifications and anggota list on component mount
  useEffect(() => {
    loadNotifications();
    fetchAnggota();
  }, []);
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Notification Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        {selectedNotification && (
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <div className="flex items-center gap-2 mb-1">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${getNotificationIconBg(selectedNotification.jenis || 'info')}`}>
                  {getNotificationIcon(selectedNotification.jenis || 'info')}
                </div>
                <DialogTitle>{selectedNotification.judul}</DialogTitle>
              </div>
              <DialogDescription className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5" />
                {formatFullDate(new Date(selectedNotification.created_at))}
              </DialogDescription>
            </DialogHeader>
            
            <div className="p-1">
              <div className="bg-slate-50 p-4 rounded-lg mb-4">
                <p className="text-sm">{selectedNotification.pesan}</p>
              </div>
              
              {selectedNotification.data && (
                <div className="border rounded-lg p-4 mb-4">
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                    <Info className="h-4 w-4" />
                    Informasi Tambahan
                  </h4>
                  <pre className="text-xs bg-slate-50 p-2 rounded overflow-auto">
                    {JSON.stringify(selectedNotification.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
            
            <DialogFooter className="flex justify-between items-center">
              <div className="flex items-center gap-1">
                <Badge className="bg-slate-100 text-slate-800">
                  {selectedNotification.jenis.charAt(0).toUpperCase() + selectedNotification.jenis.slice(1)}
                </Badge>
              </div>
              <div className="flex gap-2">
                {selectedNotification.data?.action && (
                  <Button variant="outline">
                    {selectedNotification.data.action}
                    <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                )}
                <Button onClick={() => setDetailOpen(false)}>Tutup</Button>
              </div>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* Create Notification Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Buat Notifikasi Baru</DialogTitle>
            <DialogDescription>
              Buat notifikasi baru untuk ditampilkan di dashboard atau dikirim ke anggota tertentu.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="jenis" className="text-right">
                Jenis Notifikasi
              </Label>
              <Select 
                value={formData.jenis} 
                onValueChange={(value) => setFormData({...formData, jenis: value})}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Pilih jenis notifikasi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Informasi</SelectItem>
                  <SelectItem value="sistem">Sistem</SelectItem>
                  <SelectItem value="pengumuman">Pengumuman</SelectItem>
                  <SelectItem value="jatuh_tempo">Jatuh Tempo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="judul" className="text-right">
                Judul
              </Label>
              <Input
                id="judul"
                value={formData.judul}
                onChange={(e) => setFormData({...formData, judul: e.target.value})}
                className="col-span-3"
                placeholder="Judul notifikasi"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="pesan" className="text-right">
                Pesan
              </Label>
              <Textarea
                id="pesan"
                value={formData.pesan}
                onChange={(e) => setFormData({...formData, pesan: e.target.value})}
                className="col-span-3"
                placeholder="Isi pesan notifikasi"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="penerima" className="text-right">
                Penerima
              </Label>
              <div className="col-span-3">
                <Popover open={openAnggotaPopover} onOpenChange={setOpenAnggotaPopover}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openAnggotaPopover}
                      className="w-full justify-between"
                    >
                      {!formData.anggota_id
                        ? "Notifikasi Global"
                        : anggotaList.find((anggota) => anggota.id === formData.anggota_id)
                          ? `${anggotaList.find((anggota) => anggota.id === formData.anggota_id)?.nama} - ${anggotaList.find((anggota) => anggota.id === formData.anggota_id)?.nomor_rekening}`
                          : "Pilih anggota..."}
                      <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput 
                        placeholder="Cari anggota..." 
                        className="h-9"
                        value={anggotaSearchQuery}
                        onValueChange={setAnggotaSearchQuery}
                      />
                      <CommandEmpty>Anggota tidak ditemukan.</CommandEmpty>
                      <CommandGroup className="max-h-[300px] overflow-auto">
                        <CommandItem
                          key="global"
                          value="global"
                          onSelect={() => {
                            setFormData({...formData, anggota_id: ""})
                            setOpenAnggotaPopover(false)
                            setAnggotaSearchQuery("")
                          }}
                        >
                          <span className={cn(
                            "mr-2",
                            formData.anggota_id === "" ? "opacity-100" : "opacity-40"
                          )}>
                            🌐
                          </span>
                          Notifikasi Global
                        </CommandItem>
                        {isLoadingAnggota ? (
                          <div className="flex items-center justify-center p-2">
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            <span>Memuat data anggota...</span>
                          </div>
                        ) : (
                          anggotaList
                            .filter(anggota => 
                              anggota.nama.toLowerCase().includes(anggotaSearchQuery.toLowerCase()) ||
                              anggota.nomor_rekening.toLowerCase().includes(anggotaSearchQuery.toLowerCase())
                            )
                            .map((anggota) => (
                              <CommandItem
                                key={anggota.id}
                                value={anggota.nama}
                                onSelect={() => {
                                  setFormData({...formData, anggota_id: anggota.id})
                                  setOpenAnggotaPopover(false)
                                  setAnggotaSearchQuery("")
                                }}
                              >
                                <span className={cn(
                                  "mr-2",
                                  formData.anggota_id === anggota.id ? "opacity-100" : "opacity-40"
                                )}>
                                  👤
                                </span>
                                {anggota.nama} - {anggota.nomor_rekening}
                              </CommandItem>
                            ))
                        )}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="data" className="text-right">
                Data JSON (Opsional)
              </Label>
              <Textarea
                id="data"
                value={formData.data ? JSON.stringify(formData.data, null, 2) : '{}'}
                onChange={(e) => {
                  try {
                    const jsonData = JSON.parse(e.target.value);
                    setFormData({...formData, data: jsonData});
                  } catch (error) {
                    // If invalid JSON, don't update the state
                  }
                }}
                className="col-span-3 font-mono text-sm"
                placeholder='{"key": "value"}'
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setCreateDialogOpen(false)
              resetForm()
            }}>
              Batal
            </Button>
            <Button 
              onClick={createNotification}
              disabled={!formData.judul || !formData.pesan}
            >
              Buat Notifikasi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Notifikasi</h2>
        <div className="flex items-center gap-2">
          <Button variant="default" onClick={() => setCreateDialogOpen(true)} className="bg-black hover:bg-black/90">
            <Plus className="mr-2 h-4 w-4" />
            Buat Notifikasi
          </Button>
          <Button variant="outline" asChild>
            <Link href="/notifications/settings">
              <Settings className="mr-2 h-4 w-4" />
              Pengaturan Notifikasi
            </Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="space-y-4" onValueChange={(value) => setActiveTab(value)}>
        <TabsList>
          <TabsTrigger value="all">Semua</TabsTrigger>
          <TabsTrigger value="unread">Belum Dibaca</TabsTrigger>
          <TabsTrigger value="transactions">Transaksi</TabsTrigger>
          <TabsTrigger value="jatuh_tempo">Jatuh Tempo</TabsTrigger>
          <TabsTrigger value="announcements">Pengumuman</TabsTrigger>
          <TabsTrigger value="system">Sistem</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notifikasi Terbaru</CardTitle>
              <CardDescription>Semua notifikasi dalam 7 hari terakhir</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                // Loading skeleton
                Array(5).fill(0).map((_, index) => (
                  <div key={index} className="flex items-start gap-4 border-b pb-4 last:border-0 last:pb-0">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-4 w-[150px]" />
                        <Skeleton className="h-4 w-[100px]" />
                      </div>
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-[120px]" />
                    </div>
                  </div>
                ))
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">Tidak ada notifikasi</p>
                  <p className="text-sm text-muted-foreground">Anda akan melihat notifikasi baru di sini</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div 
                    key={notification.id} 
                    className="flex items-start gap-4 border-b pb-4 last:border-0 last:pb-0 p-3 rounded-lg transition-colors hover:bg-slate-50 cursor-pointer"
                    onClick={() => openNotificationDetail(notification)}
                  >
                    <div className={`rounded-full p-2 ${getNotificationIconBg(notification.jenis || 'info')}`}>
                      {getNotificationIcon(notification.jenis || 'info')}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{notification.judul}</p>
                        <div className="flex items-center gap-2">

                          <span className="text-xs text-muted-foreground">{formatDate(new Date(notification.created_at))}</span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{notification.pesan}</p>
                      <div className="flex justify-between items-center mt-2 pt-1">
                        <div>
                          {notification.data?.action && (
                            <Button 
                              variant="link" 
                              className="h-auto p-0 text-sm"
                            >
                              {notification.data.action}
                              <ArrowRight className="ml-1 h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => fetchNotifications()}
                disabled={loading}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`}
                >
                  <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/>
                  <path d="M21 3v5h-5"/>
                </svg>
                Muat Ulang
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="unread" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notifikasi Belum Dibaca</CardTitle>
              <CardDescription>Notifikasi yang belum dibaca</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                // Loading skeleton
                Array(3).fill(0).map((_, index) => (
                  <div key={index} className="flex items-start gap-4 border-b pb-4 last:border-0 last:pb-0">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-4 w-[150px]" />
                        <Skeleton className="h-4 w-[100px]" />
                      </div>
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-[120px]" />
                    </div>
                  </div>
                ))
              ) : unreadNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">Tidak ada notifikasi yang belum dibaca</p>
                  <p className="text-sm text-muted-foreground">Semua notifikasi telah dibaca</p>
                </div>
              ) : (
                unreadNotifications.map((notification) => (
                  <div 
                    key={notification.id} 
                    className="flex items-start gap-4 border-b pb-4 last:border-0 last:pb-0 p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => openNotificationDetail(notification)}
                  >
                    <div className={`rounded-full p-2 ${getNotificationIconBg(notification.jenis || 'info')}`}>
                      {getNotificationIcon(notification.jenis || 'info')}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{notification.judul}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{formatDate(new Date(notification.created_at))}</span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{notification.pesan}</p>
                      <div className="flex justify-between items-center mt-2 pt-1">
                        <div>
                          {notification.data?.action && (
                            <Button 
                              variant="link" 
                              className="h-auto p-0 text-sm"
                            >
                              {notification.data.action}
                              <ArrowRight className="ml-1 h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notifikasi Transaksi</CardTitle>
              <CardDescription>Notifikasi terkait transaksi</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                // Loading skeleton
                Array(3).fill(0).map((_, index) => (
                  <div key={index} className="flex items-start gap-4 border-b pb-4 last:border-0 last:pb-0">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-4 w-[150px]" />
                        <Skeleton className="h-4 w-[100px]" />
                      </div>
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-[120px]" />
                    </div>
                  </div>
                ))
              ) : transactionNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">Tidak ada notifikasi transaksi</p>
                  <p className="text-sm text-muted-foreground">Notifikasi transaksi akan muncul di sini</p>
                </div>
              ) : (
                transactionNotifications.map((notification) => (
                  <div 
                    key={notification.id} 
                    className="flex items-start gap-4 border-b pb-4 last:border-0 last:pb-0 p-3 rounded-lg transition-colors hover:bg-slate-50 cursor-pointer"
                    onClick={() => openNotificationDetail(notification)}
                  >
                    <div className={`rounded-full p-2 ${getNotificationIconBg(notification.jenis)}`}>
                      {getNotificationIcon(notification.jenis)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{notification.judul}</p>
                        <div className="flex items-center gap-2">

                          <span className="text-xs text-muted-foreground">{formatDate(new Date(notification.created_at))}</span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{notification.pesan}</p>
                      <div className="flex justify-between items-center mt-2 pt-1">
                        <div>
                          {notification.data?.action && (
                            <Button 
                              variant="link" 
                              className="h-auto p-0 text-sm"
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent triggering the parent onClick
                              }}
                            >
                              {notification.data.action}
                              <ArrowRight className="ml-1 h-3 w-3" />
                            </Button>
                          )}
                        </div>

                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jatuh_tempo" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notifikasi Jatuh Tempo</CardTitle>
              <CardDescription>Notifikasi terkait pembiayaan yang telah jatuh tempo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                // Loading skeleton
                Array(3).fill(0).map((_, index) => (
                  <div key={index} className="flex items-start gap-4 border-b pb-4 last:border-0 last:pb-0">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-4 w-[150px]" />
                        <Skeleton className="h-4 w-[100px]" />
                      </div>
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-[120px]" />
                    </div>
                  </div>
                ))
              ) : jatuhTempoNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">Tidak ada notifikasi jatuh tempo</p>
                  <p className="text-sm text-muted-foreground">Notifikasi jatuh tempo akan muncul di sini</p>
                </div>
              ) : (
                jatuhTempoNotifications.map((notification) => (
                  <div 
                    key={notification.id} 
                    className="flex items-start gap-4 border-b pb-4 last:border-0 last:pb-0 p-3 rounded-lg transition-colors hover:bg-slate-50 cursor-pointer"
                    onClick={() => openNotificationDetail(notification)}
                  >
                    <div className="rounded-full p-2 bg-red-100 text-red-600">
                      <AlertCircle className="h-4 w-4" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{notification.judul}</p>
                        <div className="flex items-center gap-2">

                          <span className="text-xs text-muted-foreground">{formatDate(new Date(notification.created_at))}</span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{notification.pesan}</p>
                      <div className="flex justify-between items-center mt-2 pt-1">
                        <div>
                          {notification.data?.action && (
                            <Button 
                              variant="link" 
                              className="h-auto p-0 text-sm"
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent triggering the parent onClick
                              }}
                            >
                              {notification.data.action}
                              <ArrowRight className="ml-1 h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="announcements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pengumuman</CardTitle>
              <CardDescription>Pengumuman dan informasi penting</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                // Loading skeleton
                Array(3).fill(0).map((_, index) => (
                  <div key={index} className="flex items-start gap-4 border-b pb-4 last:border-0 last:pb-0">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-4 w-[150px]" />
                        <Skeleton className="h-4 w-[100px]" />
                      </div>
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-[120px]" />
                    </div>
                  </div>
                ))
              ) : announcementNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">Tidak ada pengumuman</p>
                  <p className="text-sm text-muted-foreground">Pengumuman akan muncul di sini</p>
                </div>
              ) : (
                announcementNotifications.map((notification) => (
                  <div 
                    key={notification.id} 
                    className="flex items-start gap-4 border-b pb-4 last:border-0 last:pb-0 p-3 rounded-lg transition-colors hover:bg-slate-50 cursor-pointer"
                    onClick={() => openNotificationDetail(notification)}
                  >
                    <div className="rounded-full p-2 bg-blue-100 text-blue-600">
                      <Bell className="h-4 w-4" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{notification.judul}</p>
                        <div className="flex items-center gap-2">

                          <span className="text-xs text-muted-foreground">{formatDate(new Date(notification.created_at))}</span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{notification.pesan}</p>
                      <div className="flex justify-between items-center mt-2 pt-1">
                        <div>
                          {notification.data?.action && (
                            <Button 
                              variant="link" 
                              className="h-auto p-0 text-sm"
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent triggering the parent onClick
                              }}
                            >
                              {notification.data.action}
                              <ArrowRight className="ml-1 h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notifikasi Sistem</CardTitle>
              <CardDescription>Notifikasi terkait sistem</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                // Loading skeleton
                Array(3).fill(0).map((_, index) => (
                  <div key={index} className="flex items-start gap-4 border-b pb-4 last:border-0 last:pb-0">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-4 w-[150px]" />
                        <Skeleton className="h-4 w-[100px]" />
                      </div>
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-[120px]" />
                    </div>
                  </div>
                ))
              ) : systemNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Settings className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">Tidak ada notifikasi sistem</p>
                  <p className="text-sm text-muted-foreground">Notifikasi sistem akan muncul di sini</p>
                </div>
              ) : (
                systemNotifications.map((notification) => (
                  <div 
                    key={notification.id} 
                    className="flex items-start gap-4 border-b pb-4 last:border-0 last:pb-0 p-3 rounded-lg transition-colors hover:bg-slate-50 cursor-pointer"
                    onClick={() => openNotificationDetail(notification)}
                  >
                    <div className={`rounded-full p-2 ${getNotificationIconBg(notification.jenis)}`}>
                      {getNotificationIcon(notification.jenis)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{notification.judul}</p>
                        <div className="flex items-center gap-2">

                          <span className="text-xs text-muted-foreground">{formatDate(new Date(notification.created_at))}</span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{notification.pesan}</p>
                      <div className="flex justify-between items-center mt-2 pt-1">
                        <div>
                          {notification.data?.action && (
                            <Button 
                              variant="link" 
                              className="h-auto p-0 text-sm"
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent triggering the parent onClick
                              }}
                            >
                              {notification.data.action}
                              <ArrowRight className="ml-1 h-3 w-3" />
                            </Button>
                          )}
                        </div>

                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function getNotificationIcon(jenis: string) {
  // Handle based on notification type
  switch (jenis) {
    case "transaksi":
      return <CreditCard className="h-4 w-4 text-white" />
    case "pengumuman":
      return <Bell className="h-4 w-4 text-white" />
    case "info":
      return <Info className="h-4 w-4 text-white" />
    case "sistem":
      return <Settings className="h-4 w-4 text-white" />
    case "jatuh_tempo":
      return <AlertCircle className="h-4 w-4 text-white" />
    default:
      return <CreditCard className="h-4 w-4 text-white" />
  }
}

function getNotificationIconBg(jenis: string) {
  // Handle based on notification type
  switch (jenis) {
    case "transaksi":
      return "bg-blue-500"
    case "pengumuman":
      return "bg-purple-500"
    case "info":
      return "bg-green-500"
    case "sistem":
      return "bg-gray-500"
    case "jatuh_tempo":
      return "bg-red-500"
    default:
      return "bg-blue-500"
  }
}
