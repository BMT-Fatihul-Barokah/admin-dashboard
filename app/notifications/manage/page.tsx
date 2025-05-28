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
import { supabase } from "@/lib/supabase"

type Notifikasi = {
  id: string;
  anggota_id: string;
  judul: string;
  pesan: string;
  jenis: string;
  is_read: boolean;
  data?: any;
  created_at: Date;
  updated_at: Date;
  anggota?: {
    nama: string;
  };
}

type Anggota = {
  id: string;
  nama: string;
  nomor_anggota: string;
}
import Link from "next/link"

export default function ManageNotificationsPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notifikasi[]>([])
  const [notificationTypes, setNotificationTypes] = useState<{kode: string, nama: string, deskripsi: string}[]>([])
  const [anggotaList, setAnggotaList] = useState<Anggota[]>([])
  const [loading, setLoading] = useState(true)
  const [isLoadingAnggota, setIsLoadingAnggota] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [currentNotification, setCurrentNotification] = useState<Notifikasi | null>(null)
  const [formData, setFormData] = useState({
    jenis: "info",
    judul: "",
    pesan: "",
    anggota_id: "",
    data: {}
  })

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
      // Fetch notification types first
      const { data: typesData, error: typesError } = await supabase
        .from('jenis_notifikasi')
        .select('kode, nama, deskripsi')
        .order('nama')

      if (typesError) throw typesError
      setNotificationTypes(typesData || [])

      // Then fetch notifications
      const { data, error } = await supabase
        .from('notifikasi')
        .select(`
          *,
          anggota:anggota_id(nama)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setNotifications(data || [])
    } catch (error) {
      console.error("Error fetching notifications:", error)
      toast({
        title: "Error",
        description: "Gagal memuat notifikasi. Silakan coba lagi nanti.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Fetch anggota list
  const fetchAnggota = async () => {
    setIsLoadingAnggota(true)
    try {
      const response = await fetch('/api/anggota')
      if (!response.ok) {
        throw new Error('Failed to fetch anggota')
      }
      const data = await response.json()
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
      const anggotaIdValue = formData.anggota_id === 'null' ? null : formData.anggota_id || null

      const { data, error } = await supabase
        .from('notifikasi')
        .insert([
          {
            anggota_id: anggotaIdValue,
            judul: formData.judul,
            pesan: formData.pesan,
            jenis: formData.jenis,
            is_read: false,
            data: formData.data || {},
          }
        ])
        .select()

      if (error) throw error
      
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
      const anggotaIdValue = formData.anggota_id === 'null' ? null : formData.anggota_id || null

      const { error } = await supabase
        .from('notifikasi')
        .update({
          anggota_id: anggotaIdValue,
          judul: formData.judul,
          pesan: formData.pesan,
          jenis: formData.jenis,
          data: formData.data || {},
          updated_at: new Date()
        })
        .eq('id', currentNotification.id)

      if (error) throw error
      
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
      const { error } = await supabase
        .from('notifikasi')
        .delete()
        .eq('id', currentNotification.id)

      if (error) throw error
      
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
  const handleEdit = (notification: Notifikasi) => {
    setCurrentNotification(notification)
    setFormData({
      jenis: notification.jenis,
      judul: notification.judul,
      pesan: notification.pesan,
      anggota_id: notification.anggota_id || 'null',
      data: notification.data || {}
    })
    setIsEditing(true)
  }

  // Handle delete button click
  const handleDelete = (notification: Notifikasi) => {
    setCurrentNotification(notification)
    setDeleteDialogOpen(true)
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      jenis: "info",
      judul: "",
      pesan: "",
      anggota_id: "null",
      data: {}
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
        <CardHeader>
          <CardTitle>Daftar Notifikasi</CardTitle>
          <CardDescription>Kelola semua notifikasi dalam sistem</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {Array(5).fill(0).map((_, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[400px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Bell className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Tidak ada notifikasi</p>
              <p className="text-sm text-muted-foreground">Buat notifikasi baru dengan mengklik tombol di atas</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Jenis</TableHead>
                    <TableHead className="w-[250px]">Judul</TableHead>
                    <TableHead>Pesan</TableHead>
                    <TableHead className="w-[180px]">Waktu</TableHead>
                    <TableHead className="w-[100px]">Status</TableHead>
                    <TableHead className="w-[120px] text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notifications.map((notification) => (
                    <TableRow key={notification.id}>
                      <TableCell>
                        <Badge variant="outline" className={`${getNotificationBadgeColor(notification.jenis)} text-white`}>
                          {notification.jenis}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{notification.judul}</TableCell>
                      <TableCell className="max-w-[300px] truncate">{notification.pesan}</TableCell>
                      <TableCell>{formatDate(new Date(notification.created_at))}</TableCell>
                      <TableCell>
                        {notification.is_read ? (
                          <Badge variant="outline" className="bg-gray-200 text-gray-700">Dibaca</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-blue-500 text-white">Belum Dibaca</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(notification)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(notification)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
              <Select 
                value={formData.anggota_id} 
                onValueChange={(value) => setFormData({...formData, anggota_id: value})}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Pilih anggota (kosongkan untuk notifikasi global)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="null">Notifikasi Global</SelectItem>
                  {isLoadingAnggota ? (
                    <div className="flex items-center justify-center p-2">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span>Memuat data anggota...</span>
                    </div>
                  ) : (
                    anggotaList.map((anggota) => (
                      <SelectItem key={anggota.id} value={anggota.id}>
                        {anggota.nama} - {anggota.nomor_anggota}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
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
              <Select 
                value={formData.anggota_id} 
                onValueChange={(value) => setFormData({...formData, anggota_id: value})}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Pilih anggota (kosongkan untuk notifikasi global)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="null">Notifikasi Global</SelectItem>
                  {isLoadingAnggota ? (
                    <div className="flex items-center justify-center p-2">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span>Memuat data anggota...</span>
                    </div>
                  ) : (
                    anggotaList.map((anggota) => (
                      <SelectItem key={anggota.id} value={anggota.id}>
                        {anggota.nama} - {anggota.nomor_anggota}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
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
