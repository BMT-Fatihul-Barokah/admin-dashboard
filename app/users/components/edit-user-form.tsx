"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from '@supabase/supabase-js'
import { useToast } from "@/components/ui/use-toast"
import { format, parseISO } from "date-fns"

// Create a direct Supabase client instance
const supabaseUrl = 'https://hyiwhckxwrngegswagrb.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5aXdoY2t4d3JuZ2Vnc3dhZ3JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0OTY4MzcsImV4cCI6MjA2MTA3MjgzN30.bpDSX9CUEA0F99x3cwNbeTVTVq-NHw5GC5jmp2QqnNM'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

type Anggota = {
  id: string
  nama: string
  nomor_rekening: string
  saldo: number
  alamat?: string
  kota?: string
  tempat_lahir?: string
  tanggal_lahir?: Date | string
  pekerjaan?: string
  jenis_identitas?: string
  nomor_identitas?: string
  created_at: Date | string
  updated_at: Date | string
  closed_at?: Date | string
  is_active: boolean
}

interface EditUserFormProps {
  user: Anggota | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUserUpdated: () => void
}

export function EditUserForm({ user, open, onOpenChange, onUserUpdated }: EditUserFormProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<Partial<Anggota>>({})

  // Initialize form data when user changes
  useState(() => {
    if (user) {
      setFormData({
        nama: user.nama,
        alamat: user.alamat || '',
        kota: user.kota || '',
        tempat_lahir: user.tempat_lahir || '',
        tanggal_lahir: user.tanggal_lahir ? 
          (typeof user.tanggal_lahir === 'string' ? user.tanggal_lahir.split('T')[0] : format(user.tanggal_lahir, 'yyyy-MM-dd')) : '',
        pekerjaan: user.pekerjaan || '',
        jenis_identitas: user.jenis_identitas || '',
        nomor_identitas: user.nomor_identitas || '',
      })
    }
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) return
    
    setIsSubmitting(true)
    try {
      // Prepare data for update
      const updateData = {
        ...formData,
        updated_at: new Date().toISOString()
      }
      
      // Update anggota in database
      const { error } = await supabase
        .from('anggota')
        .update(updateData)
        .eq('id', user.id)
      
      if (error) throw error
      
      toast({
        title: "Berhasil",
        description: `Data anggota ${user.nama} telah diperbarui.`,
      })
      
      onUserUpdated()
      onOpenChange(false)
    } catch (error) {
      console.error('Error updating user:', error)
      toast({
        title: "Error",
        description: "Gagal memperbarui data anggota. Silakan coba lagi.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Anggota</DialogTitle>
          <DialogDescription>
            Edit informasi anggota {user.nama}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nomor_rekening">Nomor Rekening</Label>
                <Input 
                  id="nomor_rekening" 
                  value={user.nomor_rekening} 
                  disabled 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nama">Nama Lengkap</Label>
                <Input 
                  id="nama" 
                  name="nama" 
                  value={formData.nama || ''} 
                  onChange={handleChange} 
                  required 
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="alamat">Alamat</Label>
              <Input 
                id="alamat" 
                name="alamat" 
                value={formData.alamat || ''} 
                onChange={handleChange} 
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="kota">Kota</Label>
                <Input 
                  id="kota" 
                  name="kota" 
                  value={formData.kota || ''} 
                  onChange={handleChange} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tempat_lahir">Tempat Lahir</Label>
                <Input 
                  id="tempat_lahir" 
                  name="tempat_lahir" 
                  value={formData.tempat_lahir || ''} 
                  onChange={handleChange} 
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tanggal_lahir">Tanggal Lahir</Label>
                <Input 
                  id="tanggal_lahir" 
                  name="tanggal_lahir" 
                  type="date" 
                  value={formData.tanggal_lahir ? String(formData.tanggal_lahir).split('T')[0] : ''} 
                  onChange={handleChange} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pekerjaan">Pekerjaan</Label>
                <Input 
                  id="pekerjaan" 
                  name="pekerjaan" 
                  value={formData.pekerjaan || ''} 
                  onChange={handleChange} 
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="jenis_identitas">Jenis Identitas</Label>
                <Select 
                  value={formData.jenis_identitas || ''} 
                  onValueChange={(value) => handleSelectChange('jenis_identitas', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih jenis identitas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="KTP">KTP</SelectItem>
                    <SelectItem value="SIM">SIM</SelectItem>
                    <SelectItem value="Paspor">Paspor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="nomor_identitas">Nomor Identitas</Label>
                <Input 
                  id="nomor_identitas" 
                  name="nomor_identitas" 
                  value={formData.nomor_identitas || ''} 
                  onChange={handleChange} 
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
