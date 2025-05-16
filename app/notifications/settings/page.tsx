"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Bell, Settings } from "lucide-react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"

type NotificationCategory = {
  id: string
  name: string
  type: string
  description: string
  is_enabled: boolean
  auto_create: boolean
  template_title: string
  template_message: string
  created_at: Date
  updated_at: Date
}

export default function NotificationSettingsPage() {
  const [categories, setCategories] = useState<NotificationCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Fetch notification categories
  const fetchCategories = async () => {
    setLoading(true)
    try {
      // First check if the notification_categories table exists
      const { data: tableExists, error: tableError } = await supabase
        .from('notification_categories')
        .select('count(*)', { count: 'exact', head: true })
        .limit(1)
      
      if (tableError && tableError.code === '42P01') {
        // Table doesn't exist, create it
        await createNotificationCategoriesTable()
        return
      }
      
      const { data, error } = await supabase
        .from('notification_categories')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) throw error
      
      if (data && data.length > 0) {
        setCategories(data)
      } else {
        // No categories found, create default ones
        await createDefaultCategories()
      }
    } catch (error) {
      console.error("Error fetching notification categories:", error)
      toast({
        title: "Error",
        description: "Gagal memuat kategori notifikasi. Silakan coba lagi nanti.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Create notification_categories table if it doesn't exist
  const createNotificationCategoriesTable = async () => {
    try {
      // Create the table
      await supabase.rpc('create_notification_categories_table')
      
      // Create default categories
      await createDefaultCategories()
    } catch (error) {
      console.error("Error creating notification_categories table:", error)
      toast({
        title: "Error",
        description: "Gagal membuat tabel kategori notifikasi. Silakan coba lagi nanti.",
        variant: "destructive",
      })
    }
  }

  // Create default notification categories
  const createDefaultCategories = async () => {
    try {
      const defaultCategories = [
        {
          name: "Transaksi Baru",
          type: "transaction",
          description: "Notifikasi saat ada transaksi baru",
          is_enabled: true,
          auto_create: true,
          template_title: "Transaksi Baru",
          template_message: "Transaksi simpanan sebesar Rp {amount} dari {member_name} telah berhasil."
        },
        {
          name: "Penarikan Dana",
          type: "transaction",
          description: "Notifikasi saat ada penarikan dana",
          is_enabled: true,
          auto_create: true,
          template_title: "Penarikan Dana",
          template_message: "Penarikan dana sebesar Rp {amount} oleh {member_name} telah berhasil."
        },
        {
          name: "Pengajuan Pinjaman",
          type: "loan",
          description: "Notifikasi saat ada pengajuan pinjaman baru",
          is_enabled: true,
          auto_create: true,
          template_title: "Pengajuan Pinjaman",
          template_message: "{member_name} mengajukan pinjaman sebesar Rp {amount}."
        },
        {
          name: "Pembayaran Pinjaman",
          type: "loan",
          description: "Notifikasi saat ada pembayaran pinjaman",
          is_enabled: true,
          auto_create: true,
          template_title: "Pembayaran Pinjaman",
          template_message: "{member_name} telah melakukan pembayaran pinjaman sebesar Rp {amount}."
        },
        {
          name: "Pinjaman Jatuh Tempo",
          type: "alert",
          description: "Notifikasi saat ada pinjaman yang akan jatuh tempo",
          is_enabled: true,
          auto_create: true,
          template_title: "Pinjaman Jatuh Tempo",
          template_message: "Terdapat {count} pinjaman yang akan jatuh tempo dalam 7 hari ke depan."
        },
        {
          name: "Pendaftaran Anggota Baru",
          type: "user",
          description: "Notifikasi saat ada anggota baru mendaftar",
          is_enabled: true,
          auto_create: true,
          template_title: "Pendaftaran Anggota Baru",
          template_message: "{member_name} telah mendaftar sebagai anggota baru."
        },
        {
          name: "Pemeliharaan Sistem",
          type: "system",
          description: "Notifikasi pemeliharaan sistem",
          is_enabled: true,
          auto_create: false,
          template_title: "Pemeliharaan Sistem",
          template_message: "Sistem akan mengalami pemeliharaan pada tanggal {date} pukul {time}."
        }
      ]

      const { data, error } = await supabase
        .from('notification_categories')
        .insert(defaultCategories)
        .select()

      if (error) throw error
      
      setCategories(data || [])
      
      toast({
        title: "Sukses",
        description: "Kategori notifikasi default berhasil dibuat.",
      })
    } catch (error) {
      console.error("Error creating default categories:", error)
      toast({
        title: "Error",
        description: "Gagal membuat kategori notifikasi default. Silakan coba lagi nanti.",
        variant: "destructive",
      })
    }
  }

  // Update a notification category
  const updateCategory = async (id: string, data: Partial<NotificationCategory>) => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('notification_categories')
        .update({
          ...data,
          updated_at: new Date()
        })
        .eq('id', id)

      if (error) throw error
      
      // Update local state
      setCategories(prev => 
        prev.map(cat => 
          cat.id === id ? { ...cat, ...data, updated_at: new Date() } : cat
        )
      )
      
      toast({
        title: "Sukses",
        description: "Pengaturan notifikasi berhasil diperbarui.",
      })
    } catch (error) {
      console.error("Error updating notification category:", error)
      toast({
        title: "Error",
        description: "Gagal memperbarui pengaturan notifikasi. Silakan coba lagi nanti.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  // Toggle notification category enabled state
  const toggleCategoryEnabled = async (id: string, enabled: boolean) => {
    await updateCategory(id, { is_enabled: enabled })
  }

  // Toggle auto create setting
  const toggleAutoCreate = async (id: string, autoCreate: boolean) => {
    await updateCategory(id, { auto_create: autoCreate })
  }

  // Update template
  const updateTemplate = async (id: string, title: string, message: string) => {
    await updateCategory(id, { 
      template_title: title,
      template_message: message
    })
  }

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories()
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
          <h2 className="text-3xl font-bold tracking-tight">Pengaturan Notifikasi</h2>
        </div>
      </div>

      <Tabs defaultValue="categories" className="space-y-4">
        <TabsList>
          <TabsTrigger value="categories">Kategori Notifikasi</TabsTrigger>
          <TabsTrigger value="templates">Template Notifikasi</TabsTrigger>
          <TabsTrigger value="general">Pengaturan Umum</TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Kategori Notifikasi</CardTitle>
              <CardDescription>
                Aktifkan atau nonaktifkan kategori notifikasi yang ingin ditampilkan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {loading ? (
                <div className="space-y-4">
                  {Array(5).fill(0).map((_, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="h-5 w-40 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-4 w-60 bg-gray-100 rounded animate-pulse"></div>
                      </div>
                      <div className="h-6 w-12 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  ))}
                </div>
              ) : (
                categories.map((category) => (
                  <div key={category.id} className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="font-medium">{category.name}</div>
                      <div className="text-sm text-muted-foreground">{category.description}</div>
                    </div>
                    <Switch
                      checked={category.is_enabled}
                      onCheckedChange={(checked) => toggleCategoryEnabled(category.id, checked)}
                      disabled={saving}
                    />
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Template Notifikasi</CardTitle>
              <CardDescription>
                Kustomisasi template untuk setiap jenis notifikasi
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {loading ? (
                <div className="space-y-8">
                  {Array(3).fill(0).map((_, i) => (
                    <div key={i} className="space-y-4">
                      <div className="h-5 w-40 bg-gray-200 rounded animate-pulse"></div>
                      <div className="space-y-2">
                        <div className="h-10 w-full bg-gray-100 rounded animate-pulse"></div>
                        <div className="h-24 w-full bg-gray-100 rounded animate-pulse"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                categories.map((category) => (
                  <div key={category.id} className="space-y-4">
                    <div className="font-medium">{category.name}</div>
                    <div className="space-y-4">
                      <div className="grid gap-2">
                        <Label htmlFor={`title-${category.id}`}>Judul Template</Label>
                        <Input
                          id={`title-${category.id}`}
                          defaultValue={category.template_title}
                          onBlur={(e) => updateTemplate(category.id, e.target.value, category.template_message)}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor={`message-${category.id}`}>Pesan Template</Label>
                        <Input
                          id={`message-${category.id}`}
                          defaultValue={category.template_message}
                          onBlur={(e) => updateTemplate(category.id, category.template_title, e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                          Gunakan placeholder seperti {'{member_name}'}, {'{amount}'}, {'{date}'}, dll.
                        </p>
                      </div>
                    </div>
                    <Separator />
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pengaturan Umum</CardTitle>
              <CardDescription>
                Konfigurasi pengaturan umum untuk sistem notifikasi
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Pembuatan Otomatis</h3>
                <p className="text-sm text-muted-foreground">
                  Aktifkan atau nonaktifkan pembuatan notifikasi otomatis untuk setiap kategori
                </p>
                
                {loading ? (
                  <div className="space-y-4">
                    {Array(5).fill(0).map((_, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="h-5 w-40 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-6 w-12 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {categories.map((category) => (
                      <div key={category.id} className="flex items-center justify-between">
                        <div className="font-medium">{category.name}</div>
                        <Switch
                          checked={category.auto_create}
                          onCheckedChange={(checked) => toggleAutoCreate(category.id, checked)}
                          disabled={saving}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
