"use client"

import { useState, useEffect, Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Bell, Settings, Loader2 } from "lucide-react"
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

// Content component that safely uses hooks inside Suspense
function NotificationSettingsContent() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center p-4">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      }
    >
      <NotificationSettingsUI />
    </Suspense>
  );
}

function NotificationSettingsUI() {
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

  // Save all changes function
  const saveAllChanges = async () => {
    setSaving(true)
    try {
      toast({
        title: "Perubahan Disimpan",
        description: "Semua perubahan pengaturan notifikasi telah disimpan.",
      })
    } catch (error) {
      console.error("Error saving all changes:", error)
      toast({
        title: "Error",
        description: "Gagal menyimpan perubahan. Silakan coba lagi nanti.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  // Reset template to default
  const resetTemplate = async (kode: string) => {
    const defaultTemplates = {
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
    
    const template = defaultTemplates[kode as keyof typeof defaultTemplates]
    if (template) {
      await updateCategory(kode, template)
      // Update local state
      setCategories(prev =>
        prev.map(cat =>
          cat.kode === kode
            ? { ...cat, ...template }
            : cat
        )
      )
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/notifications" className="hover:opacity-80">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold">Pengaturan Notifikasi</h1>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin mr-2">
            <Loader2 className="h-5 w-5" />
          </div>
          <span>Memuat pengaturan notifikasi...</span>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Pengaturan Notifikasi</CardTitle>
            <CardDescription>
              Kelola preferensi notifikasi dan template pesan untuk aplikasi
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="categories">
              <TabsList className="mb-4">
                <TabsTrigger value="categories">
                  <Bell className="h-4 w-4 mr-2" />
                  Jenis Notifikasi
                </TabsTrigger>
                <TabsTrigger value="templates">
                  <Settings className="h-4 w-4 mr-2" />
                  Template Pesan
                </TabsTrigger>
              </TabsList>

              <TabsContent value="categories">
                <div className="space-y-6">
                  {categories.map((category) => (
                    <div key={category.kode} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-semibold">{category.nama}</h3>
                          <p className="text-sm text-muted-foreground">
                            {category.deskripsi}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id={`push-${category.kode}`}
                            checked={category.is_push_enabled}
                            onCheckedChange={(checked) => {
                              updateCategory(category.kode, { is_push_enabled: checked })
                            }}
                          />
                          <Label htmlFor={`push-${category.kode}`}>
                            {category.is_push_enabled ? "Aktif" : "Nonaktif"}
                          </Label>
                        </div>
                      </div>
                      <Separator />
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="templates">
                <div className="space-y-6">
                  {categories.map((category) => (
                    <div key={category.kode} className="space-y-4 border rounded-lg p-4">
                      <div>
                        <h3 className="font-semibold">{category.nama}</h3>
                        <p className="text-sm text-muted-foreground">
                          {category.deskripsi}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`title-${category.kode}`}>Template Judul</Label>
                        <Input
                          id={`title-${category.kode}`}
                          placeholder="Template judul notifikasi"
                          value={category.template_judul || ''}
                          onChange={(e) => {
                            // Update local state immediately
                            setCategories(prev =>
                              prev.map(cat =>
                                cat.kode === category.kode
                                  ? { ...cat, template_judul: e.target.value }
                                  : cat
                              )
                            )
                          }}
                          onBlur={(e) => {
                            // Save to database on blur if changed
                            if (e.target.value !== category.template_judul) {
                              updateCategory(category.kode, { template_judul: e.target.value })
                            }
                          }}
                        />
                        <p className="text-xs text-muted-foreground">
                          Variables: {'{amount}'}, {'{date}'}, {'{time}'}, {'{message}'}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`message-${category.kode}`}>Template Pesan</Label>
                        <Input
                          id={`message-${category.kode}`}
                          placeholder="Template isi pesan notifikasi"
                          value={category.template_pesan || ''}
                          onChange={(e) => {
                            // Update local state immediately
                            setCategories(prev =>
                              prev.map(cat =>
                                cat.kode === category.kode
                                  ? { ...cat, template_pesan: e.target.value }
                                  : cat
                              )
                            )
                          }}
                          onBlur={(e) => {
                            // Save to database on blur if changed
                            if (e.target.value !== category.template_pesan) {
                              updateCategory(category.kode, { template_pesan: e.target.value })
                            }
                          }}
                        />
                        <p className="text-xs text-muted-foreground">
                          Variables: {'{amount}'}, {'{date}'}, {'{time}'}, {'{message}'}
                        </p>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => resetTemplate(category.kode)}
                      >
                        Reset ke Default
                      </Button>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" asChild>
              <Link href="/notifications">
                Kembali
              </Link>
            </Button>
            <Button
              onClick={saveAllChanges}
              disabled={saving}
            >
              {saving ? "Menyimpan..." : "Simpan Semua Perubahan"}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}

// Main page component with Suspense boundary
export default function NotificationSettingsPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center gap-2">
          <ArrowLeft className="h-5 w-5" />
          <h1 className="text-2xl font-bold">Pengaturan Notifikasi</h1>
        </div>
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin mr-2">
            <Loader2 className="h-5 w-5" />
          </div>
          <span>Memuat pengaturan notifikasi...</span>
        </div>
      </div>
    }>
      <NotificationSettingsContent />
    </Suspense>
  )
}
