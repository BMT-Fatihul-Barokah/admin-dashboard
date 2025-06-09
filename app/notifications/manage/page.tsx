"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { toast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Bell, CheckCircle, CreditCard, Info, Settings, User, Wallet, X, Plus, Edit, Trash2, ArrowLeft, Search, Loader2 } from "lucide-react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { 
  GlobalNotification, 
  TransactionNotification, 
  CombinedNotification 
} from "@/lib/notifications"

// Type definitions for the notification management page
type DisplayNotification = {
  id: string;
  judul: string;
  pesan: string;
  jenis: string;
  is_read?: boolean;
  data?: any;
  created_at: Date;
  updated_at: Date;
  source: 'global' | 'transaction';
  anggota_id?: string;
  anggota_name?: string;
  transaksi_id?: string;
}

type Anggota = {
  id: string;
  nama: string;
  nomor_anggota: string;
}

export default function ManageNotificationsPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<DisplayNotification[]>([])
  const [notificationTypes] = useState<{kode: string, nama: string}[]>([
    { kode: "info", nama: "Informasi" },
    { kode: "sistem", nama: "Sistem" },
    { kode: "pengumuman", nama: "Pengumuman" },
    { kode: "transaksi", nama: "Transaksi" },
    { kode: "jatuh_tempo", nama: "Jatuh Tempo" }
  ])
  const [anggotaList, setAnggotaList] = useState<Anggota[]>([])
  const [loading, setLoading] = useState(true)
  const [isLoadingAnggota, setIsLoadingAnggota] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [currentNotification, setCurrentNotification] = useState<DisplayNotification | null>(null)
  const [activeTab, setActiveTab] = useState("global")
  const [formData, setFormData] = useState({
    jenis: "info",
    judul: "",
    pesan: "",
    anggota_id: "",
    data: {},
    source: "global" as "global" | "transaction"
  })

  // Anggota selection popover states
  const [openAnggotaPopover, setOpenAnggotaPopover] = useState(false)
  const [openEditAnggotaPopover, setOpenEditAnggotaPopover] = useState(false)
  const [anggotaSearchQuery, setAnggotaSearchQuery] = useState("")

  // Format the date to a readable format
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Fetch all notifications
  const fetchNotifications = async () => {
    setLoading(true)
    try {
      // Fetch global notifications
      const { data: globalData, error: globalError } = await supabase
        .from('global_notifikasi')
        .select('*')
        .order('created_at', { ascending: false })

      if (globalError) throw globalError

      // Fetch transaction notifications
      const { data: transactionData, error: transactionError } = await supabase
        .from('transaksi_notifikasi')
        .select(`
          *,
          transaksi:transaksi_id(id, jumlah, tipe_transaksi)
        `)
        .order('created_at', { ascending: false })

      if (transactionError) throw transactionError

      // Transform and combine notifications
      const formattedGlobalNotifications: DisplayNotification[] = (globalData || []).map(notification => ({
        id: notification.id,
        judul: notification.judul,
        pesan: notification.pesan,
        jenis: notification.jenis,
        data: notification.data,
        created_at: new Date(notification.created_at),
        updated_at: new Date(notification.updated_at),
        source: 'global' as const,
        anggota_id: notification.anggota_id || undefined
      }))

      const formattedTransactionNotifications: DisplayNotification[] = (transactionData || []).map(notification => ({
        id: notification.id,
        judul: notification.judul || 'Notifikasi Transaksi',
        pesan: notification.pesan,
        jenis: notification.jenis || 'transaksi',
        is_read: notification.is_read,
        data: notification.data,
        created_at: new Date(notification.created_at),
        updated_at: new Date(notification.updated_at),
        source: 'transaction' as const,
        transaksi_id: notification.transaksi_id
      }))

      // Combine and sort notifications by creation date
      const combinedNotifications = [...formattedGlobalNotifications, ...formattedTransactionNotifications]
        .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())

      setNotifications(combinedNotifications)
    } catch (error) {
      console.error('Error fetching notifications:', error)
      toast({
        title: "Error",
        description: "Gagal memuat notifikasi. Silakan coba lagi nanti.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Fetch anggota list
  const fetchAnggota = async () => {
    setIsLoadingAnggota(true)
    try {
      // Fetch anggota directly from the database
      const { data, error } = await supabase
        .from('anggota')
        .select('id, nama, nomor_anggota')
        .order('nama')

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
        // as they are generated by the system when transactions occur
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
      
      setIsCreating(false)
      resetForm()
      fetchNotifications()
    } catch (error) {
      console.error("Error creating notification:", error)
      toast({
        title: "Error",
        description: "Gagal membuat notifikasi. Silakan coba lagi nanti.",
        variant: "destructive",
      })
    }
  }

  // Update an existing notification
  const updateNotification = async () => {
    if (!currentNotification) return

    try {
      const anggotaIdValue = formData.anggota_id || null

      if (currentNotification.source === 'global') {
        // Update a global notification
        const { error } = await supabase
          .from('global_notifikasi')
          .update({
            anggota_id: anggotaIdValue,
            judul: formData.judul,
            pesan: formData.pesan,
            jenis: formData.jenis,
            data: formData.data || {}
          })
          .eq('id', currentNotification.id)

        if (error) throw error
      } else {
        // Update a transaction notification
        const { error } = await supabase
          .from('transaksi_notifikasi')
          .update({
            judul: formData.judul,
            pesan: formData.pesan,
            jenis: formData.jenis,
            data: formData.data || {}
          })
          .eq('id', currentNotification.id)

        if (error) throw error
      }
      
      toast({
        title: "Sukses",
        description: "Notifikasi berhasil diperbarui.",
      })
      
      setIsEditing(false)
      resetForm()
      fetchNotifications()
    } catch (error) {
      console.error("Error updating notification:", error)
      toast({
        title: "Error",
        description: "Gagal memperbarui notifikasi. Silakan coba lagi nanti.",
        variant: "destructive",
      })
    }
  }

  // Delete a notification
  const deleteNotification = async () => {
    if (!currentNotification) return

    try {
      if (currentNotification.source === 'global') {
        // Delete a global notification
        const { error } = await supabase
          .from('global_notifikasi')
          .delete()
          .eq('id', currentNotification.id)

        if (error) throw error
      } else {
        // Delete a transaction notification
        const { error } = await supabase
          .from('transaksi_notifikasi')
          .delete()
          .eq('id', currentNotification.id)

        if (error) throw error
      }
      
      toast({
        title: "Sukses",
        description: "Notifikasi berhasil dihapus.",
      })
      
      setDeleteDialogOpen(false)
      fetchNotifications()
    } catch (error) {
      console.error("Error deleting notification:", error)
      toast({
        title: "Error",
        description: "Gagal menghapus notifikasi. Silakan coba lagi nanti.",
        variant: "destructive",
      })
    }
  }

  // Handle edit button click
  const handleEdit = (notification: DisplayNotification) => {
    setCurrentNotification(notification)
    setFormData({
      jenis: notification.jenis,
      judul: notification.judul,
      pesan: notification.pesan,
      anggota_id: notification.anggota_id || '',
      data: notification.data || {},
      source: notification.source
    })
    setIsEditing(true)
  }

  // Handle delete button click
  const handleDelete = (notification: DisplayNotification) => {
    setCurrentNotification(notification)
    setDeleteDialogOpen(true)
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
    setCurrentNotification(null)
  }

  // Get notification badge color
  const getNotificationBadgeColor = (jenis: string) => {
    switch (jenis) {
      case "transaksi":
        return "bg-blue-500 hover:bg-blue-600"
      case "pengumuman":
        return "bg-purple-500 hover:bg-purple-600"
      case "info":
        return "bg-green-500 hover:bg-green-600"
      case "sistem":
        return "bg-gray-500 hover:bg-gray-600"
      case "jatuh_tempo":
        return "bg-orange-500 hover:bg-orange-600"
      default:
        return "bg-blue-500 hover:bg-blue-600"
    }
  }

  // Fetch notifications and anggota list on component mount
  useEffect(() => {
    fetchNotifications()
    fetchAnggota()
  }, [])

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/notifications">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h2 className="text-3xl font-bold tracking-tight">Kelola Notifikasi</h2>
        </div>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Buat Notifikasi Baru
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Daftar Notifikasi</CardTitle>
          <CardDescription>
            Kelola notifikasi yang akan dikirim ke anggota atau ditampilkan di dashboard.
          </CardDescription>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
            <TabsList>
              <TabsTrigger value="global">Notifikasi Global</TabsTrigger>
              <TabsTrigger value="transaction">Notifikasi Transaksi</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.filter(n => n.source === activeTab).length === 0 ? (
                <div className="text-center py-10">
                  <Bell className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {activeTab === 'global' ? 'Belum ada notifikasi global' : 'Belum ada notifikasi transaksi'}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Jenis</TableHead>
                      <TableHead>Judul</TableHead>
                      <TableHead>Pesan</TableHead>
                      {activeTab === 'global' && <TableHead>Penerima</TableHead>}
                      {activeTab === 'transaction' && <TableHead>ID Transaksi</TableHead>}
                      <TableHead>Tanggal</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {notifications
                      .filter(notification => notification.source === activeTab)
                      .map((notification) => (
                      <TableRow key={notification.id}>
                        <TableCell>
                          <Badge className={getNotificationBadgeColor(notification.jenis)}>
                            {notification.jenis}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{notification.judul}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{notification.pesan}</TableCell>
                        {activeTab === 'global' && (
                          <TableCell>
                            {notification.anggota_name || 'Semua Anggota'}
                          </TableCell>
                        )}
                        {activeTab === 'transaction' && (
                          <TableCell>
                            {notification.transaksi_id ? (
                              <Link href={`/transactions/${notification.transaksi_id}`} className="text-blue-500 hover:underline">
                                {notification.transaksi_id.substring(0, 8)}...
                              </Link>
                            ) : 'N/A'}
                          </TableCell>
                        )}
                        <TableCell>{formatDate(notification.created_at)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleEdit(notification)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="text-red-500"
                              onClick={() => handleDelete(notification)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Notification Dialog */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Buat Notifikasi Baru</DialogTitle>
            <DialogDescription>
              Buat notifikasi baru untuk ditampilkan kepada pengguna.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="jenis" className="text-right">
                Jenis
              </Label>
              <Select 
                value={formData.jenis} 
                onValueChange={(value) => setFormData({...formData, jenis: value})}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Pilih jenis notifikasi" />
                </SelectTrigger>
                <SelectContent>
                  {notificationTypes.map((type) => (
                    <SelectItem key={type.kode} value={type.kode}>
                      {type.nama}
                    </SelectItem>
                  ))}
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
                rows={4}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="anggota_id" className="text-right">
                Anggota (Opsional)
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
                          ? `${anggotaList.find((anggota) => anggota.id === formData.anggota_id)?.nama} - ${anggotaList.find((anggota) => anggota.id === formData.anggota_id)?.nomor_anggota}`
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
                            formData.anggota_id === "null" ? "opacity-100" : "opacity-40"
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
                              anggota.nomor_anggota.toLowerCase().includes(anggotaSearchQuery.toLowerCase())
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
                                {anggota.nama} - {anggota.nomor_anggota}
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
              setIsCreating(false)
              resetForm()
            }}>
              Batal
            </Button>
            <Button 
              onClick={createNotification}
              disabled={!formData.judul || !formData.pesan}
            >
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Notification Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Notifikasi</DialogTitle>
            <DialogDescription>
              Perbarui informasi notifikasi.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-jenis" className="text-right">
                Jenis
              </Label>
              <Select 
                value={formData.jenis} 
                onValueChange={(value) => setFormData({...formData, jenis: value})}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Pilih jenis notifikasi" />
                </SelectTrigger>
                <SelectContent>
                  {notificationTypes.map((type) => (
                    <SelectItem key={type.kode} value={type.kode}>
                      {type.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-judul" className="text-right">
                Judul
              </Label>
              <Input
                id="edit-judul"
                value={formData.judul}
                onChange={(e) => setFormData({...formData, judul: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-pesan" className="text-right">
                Pesan
              </Label>
              <Textarea
                id="edit-pesan"
                value={formData.pesan}
                onChange={(e) => setFormData({...formData, pesan: e.target.value})}
                className="col-span-3"
                rows={4}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-anggota_id" className="text-right">
                Anggota (Opsional)
              </Label>
              <div className="col-span-3">
                <Popover open={openEditAnggotaPopover} onOpenChange={setOpenEditAnggotaPopover}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openEditAnggotaPopover}
                      className="w-full justify-between"
                    >
                      {formData.anggota_id === "null"
                        ? "Notifikasi Global"
                        : anggotaList.find((anggota) => anggota.id === formData.anggota_id)
                          ? `${anggotaList.find((anggota) => anggota.id === formData.anggota_id)?.nama} - ${anggotaList.find((anggota) => anggota.id === formData.anggota_id)?.nomor_anggota}`
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
                          key="global-edit"
                          value="global"
                          onSelect={() => {
                            setFormData({...formData, anggota_id: ""})
                            setOpenEditAnggotaPopover(false)
                            setAnggotaSearchQuery("")
                          }}
                        >
                          <span className={cn(
                            "mr-2",
                            formData.anggota_id === "null" ? "opacity-100" : "opacity-40"
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
                              anggota.nomor_anggota.toLowerCase().includes(anggotaSearchQuery.toLowerCase())
                            )
                            .map((anggota) => (
                              <CommandItem
                                key={anggota.id}
                                value={anggota.nama}
                                onSelect={() => {
                                  setFormData({...formData, anggota_id: anggota.id})
                                  setOpenEditAnggotaPopover(false)
                                  setAnggotaSearchQuery("")
                                }}
                              >
                                <span className={cn(
                                  "mr-2",
                                  formData.anggota_id === anggota.id ? "opacity-100" : "opacity-40"
                                )}>
                                  👤
                                </span>
                                {anggota.nama} - {anggota.nomor_anggota}
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
              <Label htmlFor="edit-data" className="text-right">
                Data JSON (Opsional)
              </Label>
              <Textarea
                id="edit-data"
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
              setIsEditing(false)
              resetForm()
            }}>
              Batal
            </Button>
            <Button 
              onClick={updateNotification}
              disabled={!formData.judul || !formData.pesan}
            >
              Perbarui
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Penghapusan</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus notifikasi ini? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setDeleteDialogOpen(false)
              setCurrentNotification(null)
            }}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction onClick={deleteNotification} className="bg-red-500 hover:bg-red-600">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
