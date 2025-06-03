"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Loader2, Plus, Pencil } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface SavingsType {
  id: string
  kode: string
  nama: string
  deskripsi: string
  bagi_hasil: number
  minimum_setoran: number
  biaya_admin: number
  jangka_waktu: number | null
  is_active: boolean
  is_required: boolean
  is_reguler: boolean
  periode_setoran: string | null
  denda_keterlambatan: number
  display_order: number
}

interface FormData {
  kode: string
  nama: string
  deskripsi: string
  bagi_hasil: number
  minimum_setoran: number
  biaya_admin: number
  jangka_waktu: number | null
  is_active: boolean
  is_required: boolean
  is_reguler: boolean
  periode_setoran: string | null
  denda_keterlambatan: number
  display_order: number
}

export function ManageSavingsTypes() {
  const { toast } = useToast()
  const [savingsTypes, setSavingsTypes] = useState<SavingsType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [typeToDelete, setTypeToDelete] = useState<SavingsType | null>(null)
  
  // Form state
  const [formData, setFormData] = useState<FormData>({
    kode: "",
    nama: "",
    deskripsi: "",
    bagi_hasil: 0,
    minimum_setoran: 0,
    biaya_admin: 0,
    jangka_waktu: null,
    is_active: true,
    is_required: false,
    is_reguler: false,
    periode_setoran: null,
    denda_keterlambatan: 0,
    display_order: 0
  })

  // Format currency function
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  // Fetch savings types data
  const fetchSavingsTypes = async () => {
    setIsLoading(true)
    try {
      // Use the RPC function to get savings types
      const { data, error } = await supabase
        .rpc('get_jenis_tabungan')
      
      if (error) throw error
      
      // Map the results to include any missing fields with default values
      const mappedData = (data || []).map((item: any) => ({
        ...item,
        bagi_hasil: item.bagi_hasil || 0,
        biaya_admin: item.biaya_admin || 0,
        jangka_waktu: item.jangka_waktu || null,
        is_required: item.is_required || false,
        is_reguler: item.is_reguler || false,
        periode_setoran: item.periode_setoran || null,
        denda_keterlambatan: item.denda_keterlambatan || 0,
        display_order: item.display_order || 0
      }))
      
      setSavingsTypes(mappedData)
    } catch (error) {
      console.error('Error fetching savings types:', error)
      
      // Fallback to direct query if RPC fails
      try {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('jenis_tabungan')
          .select('*')
          .order('kode', { ascending: true })
        
        if (fallbackError) throw fallbackError
        
        // Map the results to include any missing fields with default values
        const mappedData = (fallbackData || []).map((item: any) => ({
          ...item,
          bagi_hasil: item.bagi_hasil || 0,
          biaya_admin: item.biaya_admin || 0,
          jangka_waktu: item.jangka_waktu || null,
          is_required: item.is_required || false,
          is_reguler: item.is_reguler || false,
          periode_setoran: item.periode_setoran || null,
          denda_keterlambatan: item.denda_keterlambatan || 0,
          display_order: item.display_order || 0
        }))
        
        setSavingsTypes(mappedData)
      } catch (fallbackError) {
        console.error('Fallback query also failed:', fallbackError)
        toast({
          title: "Error",
          description: "Gagal memuat data jenis tabungan",
          variant: "destructive"
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Handle number input changes
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value === "" ? 0 : Number(value)
    }))
  }

  // Handle switch changes
  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }))
  }

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      kode: "",
      nama: "",
      deskripsi: "",
      bagi_hasil: 0,
      minimum_setoran: 0,
      biaya_admin: 0,
      jangka_waktu: null,
      is_active: true,
      is_required: false,
      is_reguler: false,
      periode_setoran: null,
      denda_keterlambatan: 0,
      display_order: 0
    })
    setEditMode(false)
    setSelectedTypeId(null)
  }

  // Open form for editing
  const openEditForm = (type: SavingsType) => {
    setFormData({
      kode: type.kode,
      nama: type.nama,
      deskripsi: type.deskripsi,
      bagi_hasil: type.bagi_hasil,
      minimum_setoran: type.minimum_setoran,
      biaya_admin: type.biaya_admin,
      jangka_waktu: type.jangka_waktu,
      is_active: type.is_active,
      is_required: type.is_required,
      is_reguler: type.is_reguler,
      periode_setoran: type.periode_setoran,
      denda_keterlambatan: type.denda_keterlambatan,
      display_order: type.display_order
    })
    setEditMode(true)
    setSelectedTypeId(type.id)
    setFormOpen(true)
  }

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validate form
      if (!formData.kode || !formData.nama) {
        toast({
          title: "Error",
          description: "Kode dan nama jenis tabungan wajib diisi",
          variant: "destructive"
        })
        return
      }

      // Check for duplicates - using separate queries for better accuracy
      // Check for duplicate kode
      const { data: duplicateKodes, error: kodeError } = await supabase
        .from('jenis_tabungan')
        .select('id, kode')
        .ilike('kode', formData.kode)
        .eq('is_active', true)
        
      if (kodeError) throw kodeError
        
      // Check for duplicate nama
      const { data: duplicateNames, error: nameError } = await supabase
        .from('jenis_tabungan')
        .select('id, nama')
        .ilike('nama', formData.nama)
        .eq('is_active', true)
        
      if (nameError) throw nameError
      
      // Filter out the current record if in edit mode
      const filteredKodes = editMode && selectedTypeId 
        ? duplicateKodes?.filter(type => type.id !== selectedTypeId) 
        : duplicateKodes
        
      const filteredNames = editMode && selectedTypeId 
        ? duplicateNames?.filter(type => type.id !== selectedTypeId) 
        : duplicateNames
      
      // Check for duplicates
      if (filteredKodes && filteredKodes.length > 0) {

        toast({
          title: "⚠️ Duplikasi Kode",
          description: `Kode tabungan '${formData.kode}' sudah digunakan oleh jenis tabungan lain`,
          variant: "destructive"
        })
        setIsSubmitting(false)
        return
      }
      
      if (filteredNames && filteredNames.length > 0) {
        toast({
          title: "⚠️ Duplikasi Nama",
          description: `Nama tabungan '${formData.nama}' sudah digunakan oleh jenis tabungan lain`,
          variant: "destructive"
        })
        setIsSubmitting(false)
        return
      }

      if (editMode && selectedTypeId) {
        // Update existing savings type
        const { error } = await supabase
          .from('jenis_tabungan')
          .update({
            kode: formData.kode,
            nama: formData.nama,
            deskripsi: formData.deskripsi,
            bagi_hasil: formData.bagi_hasil,
            minimum_setoran: formData.minimum_setoran,
            biaya_admin: formData.biaya_admin,
            jangka_waktu: formData.jangka_waktu,
            is_active: formData.is_active,
            is_required: formData.is_required,
            is_reguler: formData.is_reguler,
            periode_setoran: formData.periode_setoran,
            denda_keterlambatan: formData.denda_keterlambatan,
            display_order: formData.display_order,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedTypeId)

        if (error) throw error

        toast({
          title: "✅ Sukses",
          description: `Jenis tabungan ${formData.nama} berhasil diperbarui`,
          variant: "default"
        })
      } else {
        // Create new savings type
        const { error } = await supabase
          .from('jenis_tabungan')
          .insert({
            kode: formData.kode,
            nama: formData.nama,
            deskripsi: formData.deskripsi,
            bagi_hasil: formData.bagi_hasil,
            minimum_setoran: formData.minimum_setoran,
            biaya_admin: formData.biaya_admin,
            jangka_waktu: formData.jangka_waktu,
            is_active: formData.is_active,
            is_required: formData.is_required,
            is_reguler: formData.is_reguler,
            periode_setoran: formData.periode_setoran,
            denda_keterlambatan: formData.denda_keterlambatan,
            display_order: formData.display_order
          })

        if (error) throw error

        toast({
          title: "✅ Sukses",
          description: `Jenis tabungan ${formData.nama} berhasil ditambahkan`,
          variant: "default"
        })
      }

      // Refresh data and close form
      await fetchSavingsTypes()
      setFormOpen(false)
      resetForm()
    } catch (error) {
      console.error('Error saving savings type:', error)
      toast({
        title: "Error",
        description: "Gagal menyimpan jenis tabungan",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Load data on component mount
  useEffect(() => {
    fetchSavingsTypes()
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Manajemen Jenis Tabungan</h2>
        <Button onClick={() => {
          resetForm()
          setFormOpen(true)
        }}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Jenis Tabungan
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : savingsTypes.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Tidak ada jenis tabungan yang ditemukan</p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Setoran Minimum</TableHead>
                <TableHead>Bagi Hasil</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {savingsTypes.map((type) => (
                <TableRow key={type.id}>
                  <TableCell className="font-medium">{type.kode}</TableCell>
                  <TableCell>{type.nama}</TableCell>
                  <TableCell>{formatCurrency(type.minimum_setoran)}</TableCell>
                  <TableCell>{type.bagi_hasil}%</TableCell>
                  <TableCell>
                    <Badge
                      variant={type.is_active ? "default" : "destructive"}
                      className={type.is_active ? "bg-green-500 hover:bg-green-600" : ""}
                    >
                      {type.is_active ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" size="sm" onClick={() => openEditForm(type)}>
                        <Pencil className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => {
                          setTypeToDelete(type);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        Hapus
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Hapus Jenis Tabungan</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus jenis tabungan {typeToDelete?.nama}? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Batal</Button>
            <Button 
              variant="destructive" 
              onClick={async () => {
                if (!typeToDelete) return;
                
                try {
                  setIsSubmitting(true);
                  
                  // Periksa apakah jenis tabungan sedang digunakan
                  const { data: usageData, error: usageError } = await supabase
                    .from('tabungan')
                    .select('id')
                    .eq('jenis_tabungan_id', typeToDelete.id)
                    .limit(1);
                  
                  if (usageError) throw usageError;
                  
                  if (usageData && usageData.length > 0) {
                    toast({
                      title: "Tidak dapat menghapus",
                      description: "Jenis tabungan ini sedang digunakan oleh satu atau lebih anggota",
                      variant: "destructive"
                    });
                    return;
                  }
                  
                  // Hapus jenis tabungan
                  const { error } = await supabase
                    .from('jenis_tabungan')
                    .delete()
                    .eq('id', typeToDelete.id);
                  
                  if (error) throw error;
                  
                  toast({
                    title: "Berhasil",
                    description: "Jenis tabungan berhasil dihapus",
                    variant: "default"
                  });
                  
                  // Refresh data
                  await fetchSavingsTypes();
                  setDeleteDialogOpen(false);
                } catch (error) {
                  console.error('Error deleting savings type:', error);
                  toast({
                    title: "Error",
                    description: "Gagal menghapus jenis tabungan",
                    variant: "destructive"
                  });
                } finally {
                  setIsSubmitting(false);
                }
              }}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menghapus...
                </>
              ) : (
                'Hapus'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Add/Edit Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editMode ? 'Edit Jenis Tabungan' : 'Tambah Jenis Tabungan Baru'}</DialogTitle>
            <DialogDescription>
              {editMode 
                ? 'Perbarui informasi jenis tabungan yang sudah ada' 
                : 'Isi formulir berikut untuk menambahkan jenis tabungan baru'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="kode">Kode Tabungan</Label>
                  <Input
                    id="kode"
                    name="kode"
                    value={formData.kode}
                    onChange={handleInputChange}
                    placeholder="SIBAROKAH"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nama">Nama Tabungan</Label>
                  <Input
                    id="nama"
                    name="nama"
                    value={formData.nama}
                    onChange={handleInputChange}
                    placeholder="SIMPANAN BAROKAH"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="deskripsi">Deskripsi</Label>
                <Textarea
                  id="deskripsi"
                  name="deskripsi"
                  value={formData.deskripsi}
                  onChange={handleInputChange}
                  placeholder="Deskripsi jenis tabungan"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minimum_setoran">Setoran Minimum (Rp)</Label>
                  <Input
                    id="minimum_setoran"
                    name="minimum_setoran"
                    type="number"
                    value={formData.minimum_setoran}
                    onChange={handleNumberChange}
                    min={0}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bagi_hasil">Bagi Hasil (%)</Label>
                  <Input
                    id="bagi_hasil"
                    name="bagi_hasil"
                    type="number"
                    value={formData.bagi_hasil}
                    onChange={handleNumberChange}
                    min={0}
                    step={0.01}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="biaya_admin">Biaya Admin (Rp)</Label>
                  <Input
                    id="biaya_admin"
                    name="biaya_admin"
                    type="number"
                    value={formData.biaya_admin}
                    onChange={handleNumberChange}
                    min={0}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jangka_waktu">Jangka Waktu (Bulan)</Label>
                  <Input
                    id="jangka_waktu"
                    name="jangka_waktu"
                    type="number"
                    value={formData.jangka_waktu || ""}
                    onChange={handleNumberChange}
                    min={0}
                    placeholder="Opsional"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="denda_keterlambatan">Denda Keterlambatan (Rp)</Label>
                  <Input
                    id="denda_keterlambatan"
                    name="denda_keterlambatan"
                    type="number"
                    value={formData.denda_keterlambatan}
                    onChange={handleNumberChange}
                    min={0}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="display_order">Urutan Tampilan</Label>
                  <Input
                    id="display_order"
                    name="display_order"
                    type="number"
                    value={formData.display_order}
                    onChange={handleNumberChange}
                    min={0}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_reguler"
                    checked={formData.is_reguler}
                    onCheckedChange={(checked) => handleSwitchChange('is_reguler', checked)}
                  />
                  <Label htmlFor="is_reguler">Tabungan Reguler</Label>
                </div>
                
                {formData.is_reguler && (
                  <div className="space-y-2">
                    <Label htmlFor="periode_setoran">Periode Setoran</Label>
                    <Select
                      value={formData.periode_setoran || ""}
                      onValueChange={(value) => handleSelectChange('periode_setoran', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih periode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="harian">Harian</SelectItem>
                        <SelectItem value="mingguan">Mingguan</SelectItem>
                        <SelectItem value="bulanan">Bulanan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_required"
                    checked={formData.is_required}
                    onCheckedChange={(checked) => handleSwitchChange('is_required', checked)}
                  />
                  <Label htmlFor="is_required">Tabungan Wajib</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => handleSwitchChange('is_active', checked)}
                  />
                  <Label htmlFor="is_active">Aktif</Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setFormOpen(false)}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  'Simpan'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
