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

type JenisNotifikasi = {
  kode: string
  nama: string
  deskripsi: string
  is_global: boolean
  is_push_enabled: boolean
  created_at: Date
  updated_at: Date
  template_judul?: string
  template_pesan?: string
}

export default function NotificationSettingsPage() {
  const [categories, setCategories] = useState<JenisNotifikasi[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Fetch notification types
  const fetchCategories = async () => {
    setLoading(true)
    try {
      // Check if template columns exist in jenis_notifikasi table
      try {
        const { data: columnsExist, error: columnsError } = await supabase.rpc(
          'check_column_exists',
          { p_table_name: 'jenis_notifikasi', p_column_name: 'template_judul' }
        )
        
        if (columnsError) throw columnsError
        
        // If template columns don't exist, add them
        if (!columnsExist) {
          await addTemplateColumnsToJenisNotifikasi()
        }
      } catch (err) {
        console.error("Error checking column existence:", err)
        // Continue anyway as we'll try to fetch all columns
      }
      
      // Fetch notification types
      const { data, error } = await supabase
        .from('jenis_notifikasi')
        .select('*')
        .order('nama', { ascending: true })

      if (error) throw error
      
      setCategories(data || [])
    } catch (error) {
      console.error("Error fetching notification types:", error)
      toast({
        title: "Error",
        description: "Gagal memuat jenis notifikasi. Silakan coba lagi nanti.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Add template columns to jenis_notifikasi table if they don't exist
  const addTemplateColumnsToJenisNotifikasi = async () => {
    try {
      // Create a migration to add template columns
      const { error: sqlError } = await supabase.rpc('execute_sql', {
        sql: `
          ALTER TABLE jenis_notifikasi 
          ADD COLUMN IF NOT EXISTS template_judul TEXT,
          ADD COLUMN IF NOT EXISTS template_pesan TEXT;
        `
      })
      
      if (sqlError) throw sqlError
      
      // Update existing notification types with default templates
      await updateDefaultTemplates()
      
      toast({
        title: "Sukses",
        description: "Kolom template berhasil ditambahkan ke tabel jenis_notifikasi.",
      })
    } catch (error) {
      console.error("Error adding template columns:", error)
      toast({
        title: "Error",
        description: "Gagal menambahkan kolom template ke tabel jenis_notifikasi.",
        variant: "destructive",
      })
      // Even if adding columns fails, try to continue with fetching data
    }
  }

  // Update existing notification types with default templates
  const updateDefaultTemplates = async () => {
    try {
      const templateMap = {
        'transaksi': {
          template_judul: 'Transaksi Baru',
          template_pesan: 'Transaksi sebesar Rp {amount} telah berhasil diproses.'
        },
        'pengumuman': {
          template_judul: 'Pengumuman Penting',
          template_pesan: '{message}'
        },
        'info': {
          template_judul: 'Informasi',
          template_pesan: '{message}'
        },
        'sistem': {
          template_judul: 'Pemeliharaan Sistem',
          template_pesan: 'Sistem akan mengalami pemeliharaan pada tanggal {date} pukul {time}.'
        },
        'jatuh_tempo': {
          template_judul: 'Pinjaman Jatuh Tempo',
          template_pesan: 'Pembayaran pinjaman Anda sebesar Rp {amount} akan jatuh tempo pada tanggal {date}.'
        }
      }
      
      // Get all notification types first
      const { data: existingTypes, error: fetchError } = await supabase
        .from('jenis_notifikasi')
        .select('kode')
      
      if (fetchError) throw fetchError
      
      // Only update types that exist in the database
      const existingKodes = existingTypes?.map(type => type.kode) || []
      
      // Update each notification type with its template
      for (const [kode, templates] of Object.entries(templateMap)) {
        if (existingKodes.includes(kode)) {
          const { error } = await supabase
            .from('jenis_notifikasi')
            .update(templates)
            .eq('kode', kode)
          
          if (error) {
            console.error(`Error updating template for ${kode}:`, error)
            continue // Continue with other templates even if one fails
          }
        }
      }
      
      toast({
        title: "Sukses",
        description: "Template notifikasi default berhasil diperbarui.",
      })
    } catch (error) {
      console.error("Error updating default templates:", error)
      toast({
        title: "Error",
        description: "Gagal memperbarui template notifikasi default.",
        variant: "destructive",
      })
    }
  }

  // Update a notification type
  const updateCategory = async (kode: string, data: Partial<JenisNotifikasi>) => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('jenis_notifikasi')
        .update({
          ...data,
          updated_at: new Date()
        })
        .eq('kode', kode)

      if (error) throw error
      
      // Update local state
      setCategories(prev => 
        prev.map(cat => 
          cat.kode === kode ? { ...cat, ...data, updated_at: new Date() } : cat
        )
      )
      
      toast({
        title: "Sukses",
        description: "Pengaturan notifikasi berhasil diperbarui.",
      })
    } catch (error) {
      console.error("Error updating notification type:", error)
      toast({
        title: "Error",
        description: "Gagal memperbarui pengaturan notifikasi. Silakan coba lagi nanti.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  // Toggle notification push enabled state
  const togglePushEnabled = async (kode: string, enabled: boolean) => {
    await updateCategory(kode, { is_push_enabled: enabled })
  }

  // Toggle global notification setting
  const toggleGlobalSetting = async (kode: string, isGlobal: boolean) => {
    await updateCategory(kode, { is_global: isGlobal })
  }

  // Update template
  const updateTemplate = async (kode: string, judul: string, pesan: string) => {
    await updateCategory(kode, { 
      template_judul: judul,
      template_pesan: pesan
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
              <CardTitle>Jenis Notifikasi</CardTitle>
              <CardDescription>
                Aktifkan atau nonaktifkan notifikasi push untuk setiap jenis notifikasi
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
                  <div key={category.kode} className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="font-medium">{category.nama}</div>
                      <div className="text-sm text-muted-foreground">{category.deskripsi}</div>
                    </div>
                    <Switch
                      checked={category.is_push_enabled}
                      onCheckedChange={(checked) => togglePushEnabled(category.kode, checked)}
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
                  <div key={category.kode} className="space-y-4">
                    <div className="font-medium">{category.nama}</div>
                    <div className="space-y-4">
                      <div className="grid gap-2">
                        <Label htmlFor={`title-${category.kode}`}>Judul Template</Label>
                        <Input
                          id={`title-${category.kode}`}
                          defaultValue={category.template_judul || ''}
                          onBlur={(e) => updateTemplate(category.kode, e.target.value, category.template_pesan || '')}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor={`message-${category.kode}`}>Pesan Template</Label>
                        <Input
                          id={`message-${category.kode}`}
                          defaultValue={category.template_pesan || ''}
                          onBlur={(e) => updateTemplate(category.kode, category.template_judul || '', e.target.value)}
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
                <h3 className="text-lg font-medium">Notifikasi Global</h3>
                <p className="text-sm text-muted-foreground">
                  Aktifkan untuk notifikasi yang dapat dilihat oleh semua pengguna tanpa perlu dikaitkan dengan anggota tertentu
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
                      <div key={category.kode} className="flex items-center justify-between">
                        <div className="font-medium">{category.nama}</div>
                        <Switch
                          checked={category.is_global}
                          onCheckedChange={(checked) => toggleGlobalSetting(category.kode, checked)}
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
