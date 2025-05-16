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
import { Bell, CheckCircle, CreditCard, Info, Settings, User, Wallet, X, Plus, Edit, Trash2, ArrowLeft } from "lucide-react"
import { supabase, Notification } from "@/lib/supabase"
import Link from "next/link"

export default function ManageNotificationsPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [currentNotification, setCurrentNotification] = useState<Notification | null>(null)
  const [formData, setFormData] = useState({
    type: "system",
    title: "",
    message: "",
    action: "",
    action_link: "",
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
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('time', { ascending: false })

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

  // Create a new notification
  const createNotification = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert([
          {
            type: formData.type,
            title: formData.title,
            message: formData.message,
            time: new Date(),
            read: false,
            action: formData.action || null,
            action_link: formData.action_link || null,
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
      const { error } = await supabase
        .from('notifications')
        .update({
          type: formData.type,
          title: formData.title,
          message: formData.message,
          action: formData.action || null,
          action_link: formData.action_link || null,
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
        .from('notifications')
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
  const handleEdit = (notification: Notification) => {
    setCurrentNotification(notification)
    setFormData({
      type: notification.type,
      title: notification.title,
      message: notification.message,
      action: notification.action || "",
      action_link: notification.action_link || "",
    })
    setIsEditing(true)
  }

  // Handle delete button click
  const handleDelete = (notification: Notification) => {
    setCurrentNotification(notification)
    setDeleteDialogOpen(true)
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      type: "system",
      title: "",
      message: "",
      action: "",
      action_link: "",
    })
    setCurrentNotification(null)
  }

  // Get notification badge color
  const getNotificationBadgeColor = (type: string) => {
    switch (type) {
      case "transaction":
        return "bg-blue-500 hover:bg-blue-600"
      case "loan":
        return "bg-green-500 hover:bg-green-600"
      case "user":
        return "bg-purple-500 hover:bg-purple-600"
      case "system":
        return "bg-gray-500 hover:bg-gray-600"
      case "alert":
        return "bg-orange-500 hover:bg-orange-600"
      case "success":
        return "bg-green-500 hover:bg-green-600"
      case "error":
        return "bg-red-500 hover:bg-red-600"
      default:
        return "bg-blue-500 hover:bg-blue-600"
    }
  }

  // Fetch notifications on component mount
  useEffect(() => {
    fetchNotifications()
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
                    <TableHead className="w-[100px]">Tipe</TableHead>
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
                        <Badge variant="outline" className={`${getNotificationBadgeColor(notification.type)} text-white`}>
                          {notification.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{notification.title}</TableCell>
                      <TableCell className="max-w-[300px] truncate">{notification.message}</TableCell>
                      <TableCell>{formatDate(new Date(notification.time))}</TableCell>
                      <TableCell>
                        {notification.read ? (
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
              <Label htmlFor="type" className="text-right">
                Tipe
              </Label>
              <Select 
                value={formData.type} 
                onValueChange={(value) => setFormData({...formData, type: value})}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Pilih tipe notifikasi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">Sistem</SelectItem>
                  <SelectItem value="transaction">Transaksi</SelectItem>
                  <SelectItem value="loan">Pinjaman</SelectItem>
                  <SelectItem value="user">Pengguna</SelectItem>
                  <SelectItem value="alert">Peringatan</SelectItem>
                  <SelectItem value="success">Sukses</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Judul
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="message" className="text-right">
                Pesan
              </Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({...formData, message: e.target.value})}
                className="col-span-3"
                rows={4}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="action" className="text-right">
                Aksi (Opsional)
              </Label>
              <Input
                id="action"
                value={formData.action}
                onChange={(e) => setFormData({...formData, action: e.target.value})}
                className="col-span-3"
                placeholder="Contoh: Lihat Detail"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="action_link" className="text-right">
                Link Aksi (Opsional)
              </Label>
              <Input
                id="action_link"
                value={formData.action_link}
                onChange={(e) => setFormData({...formData, action_link: e.target.value})}
                className="col-span-3"
                placeholder="Contoh: /transactions/123"
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
              disabled={!formData.title || !formData.message}
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
              <Label htmlFor="edit-type" className="text-right">
                Tipe
              </Label>
              <Select 
                value={formData.type} 
                onValueChange={(value) => setFormData({...formData, type: value})}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Pilih tipe notifikasi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">Sistem</SelectItem>
                  <SelectItem value="transaction">Transaksi</SelectItem>
                  <SelectItem value="loan">Pinjaman</SelectItem>
                  <SelectItem value="user">Pengguna</SelectItem>
                  <SelectItem value="alert">Peringatan</SelectItem>
                  <SelectItem value="success">Sukses</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-title" className="text-right">
                Judul
              </Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-message" className="text-right">
                Pesan
              </Label>
              <Textarea
                id="edit-message"
                value={formData.message}
                onChange={(e) => setFormData({...formData, message: e.target.value})}
                className="col-span-3"
                rows={4}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-action" className="text-right">
                Aksi (Opsional)
              </Label>
              <Input
                id="edit-action"
                value={formData.action}
                onChange={(e) => setFormData({...formData, action: e.target.value})}
                className="col-span-3"
                placeholder="Contoh: Lihat Detail"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-action_link" className="text-right">
                Link Aksi (Opsional)
              </Label>
              <Input
                id="edit-action_link"
                value={formData.action_link}
                onChange={(e) => setFormData({...formData, action_link: e.target.value})}
                className="col-span-3"
                placeholder="Contoh: /transactions/123"
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
              disabled={!formData.title || !formData.message}
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
