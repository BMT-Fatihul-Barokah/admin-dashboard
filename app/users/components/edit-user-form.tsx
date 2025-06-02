"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from '@supabase/supabase-js'
import { useToast } from "@/components/ui/use-toast"
import { format } from "date-fns"

// Create a direct Supabase client instance
const supabaseUrl = 'https://vszhxeamcxgqtwyaxhlu.supabase.co'

// Use anon key for all operations - RLS policies will handle permissions
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzemh4ZWFtY3hncXR3eWF4aGx1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4NDQ0ODYsImV4cCI6MjA2NDQyMDQ4Nn0.x6Nj5UAHLA2nsNfvK4P8opRkB0U3--ZFt7Dc3Dj-q94'

// Create a single Supabase client instance
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'x-client-info': 'admin-dashboard'
    },
  }
})

// Helper function to generate a UUID
function generateUUID() {
  // This is a simple implementation that creates a random UUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

type Anggota = {
  id: string
  nama: string
  nomor_rekening: string
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
  const [formData, setFormData] = useState<Partial<Anggota>>({
    nama: '',
    alamat: '',
    kota: '',
    tempat_lahir: '',
    tanggal_lahir: '',
    pekerjaan: '',
    jenis_identitas: '',
    nomor_identitas: '',
    nomor_rekening: ''
  })

  // Initialize form data when user changes or dialog opens
  useEffect(() => {
    if (user) {
      // Editing existing user
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
        nomor_rekening: user.nomor_rekening
      })
    } else {
      // Adding new user - reset to defaults
      setFormData({
        nama: '',
        alamat: '',
        kota: '',
        tempat_lahir: '',
        tanggal_lahir: '',
        pekerjaan: '',
        jenis_identitas: '',
        nomor_identitas: '',
        nomor_rekening: ''
      })
    }
  }, [user, open]) // Dependencies to prevent infinite rendering

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form data before setting isSubmitting
    // This prevents showing the loading state if validation fails immediately
    const validationError = validateFormData(formData)
    if (validationError) {
      toast({
        title: "Validasi Gagal",
        description: validationError,
        variant: "destructive"
      })
      return
    }
    
    setIsSubmitting(true)
    try {
      if (user) {
        await updateExistingUser()
      } else {
        await addNewUser()
      }
      
      // After successful operation
      onUserUpdated()
      onOpenChange(false)
    } catch (error: any) {
      handleSubmissionError(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Create a default SIBAROKAH savings account for a new member
  const createDefaultSavingsAccount = async (anggotaId: string) => {
    try {
      console.log('Starting to create savings account for member ID:', anggotaId)
      
      // First, get the SIBAROKAH savings type ID
      const { data: sibarokahType, error: typeError } = await supabase
        .from('jenis_tabungan')
        .select('id')
        .eq('kode', 'SIBAROKAH')
        .single()
      
      if (typeError) {
        console.error('Error fetching SIBAROKAH type:', JSON.stringify(typeError, null, 2))
        throw new Error('Gagal mendapatkan jenis tabungan SIBAROKAH')
      }
      
      if (!sibarokahType) {
        console.error('SIBAROKAH type not found in database')
        throw new Error('Jenis tabungan SIBAROKAH tidak ditemukan')
      }
      
      console.log('Found SIBAROKAH type ID:', sibarokahType.id)
      
      // Generate a unique account number for the savings account
      const now = new Date()
      const year = now.getFullYear().toString().slice(-2)
      const month = (now.getMonth() + 1).toString().padStart(2, '0')
      const day = now.getDate().toString().padStart(2, '0')
      const randomDigits = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
      const accountNumber = `SB${year}${month}${day}${randomDigits}`
      
      // Create a new savings account for the member
      const { data: insertedData, error: insertError } = await supabase
        .from('tabungan')
        .insert({
          nomor_rekening: accountNumber,
          anggota_id: anggotaId,
          jenis_tabungan_id: sibarokahType.id,
          saldo: 0,
          status: 'active' // Using 'status' instead of 'is_active' to match the database schema
        })
        .select()
      
      if (insertError) {
        console.error('Error creating savings account:', JSON.stringify(insertError, null, 2))
        throw new Error('Gagal membuat akun tabungan SIBAROKAH')
      }
      
      console.log(`Successfully created SIBAROKAH account ${accountNumber} for member ${anggotaId}`, insertedData)
      return insertedData
    } catch (error) {
      console.error('Error in createDefaultSavingsAccount:', error)
      throw error
    }
  }

  // Validate form data and return error message if invalid
  const validateFormData = (data: Partial<Anggota>): string | null => {
    if (!data.nama || data.nama.trim() === '') {
      return 'Nama anggota wajib diisi'
    }
    
    return null
  }
  
  // Update an existing user in the database
  const updateExistingUser = async () => {
    if (!user) return
    
    try {
      // Format date properly for Supabase
      let formattedDate = null
      if (formData.tanggal_lahir) {
        try {
          formattedDate = typeof formData.tanggal_lahir === 'string' 
            ? formData.tanggal_lahir.split('T')[0] 
            : format(formData.tanggal_lahir, 'yyyy-MM-dd')
        } catch (e) {
          console.warn('Error formatting date:', e)
          formattedDate = null
        }
      }
      
      // Prepare data for update
      const updateData = {
        nama: formData.nama?.trim() || user.nama,
        alamat: formData.alamat?.trim() || null,
        kota: formData.kota?.trim() || null,
        tempat_lahir: formData.tempat_lahir?.trim() || null,
        tanggal_lahir: formattedDate,
        pekerjaan: formData.pekerjaan?.trim() || null,
        jenis_identitas: formData.jenis_identitas || null,
        nomor_identitas: formData.nomor_identitas?.trim() || null,
        updated_at: new Date().toISOString()
      }
      
      // Update the user
      const { error } = await supabase
        .from('anggota')
        .update(updateData)
        .eq('id', user.id)
      
      if (error) {
        console.error('Update error:', error)
        throw error
      }
      
      toast({
        title: "Berhasil",
        description: `Data anggota ${formData.nama || user.nama} telah diperbarui.`,
      })
      
      // Close the dialog and refresh the user list
      setIsSubmitting(false)
      onOpenChange(false)
      onUserUpdated()
      
      return { ...user, ...updateData }
    } catch (error) {
      setIsSubmitting(false)
      handleSubmissionError(error)
      return null
    }
  }

  // Handle adding a new user
  const addNewUser = async () => {
    try {
      // Generate account number if not provided
      let accountNumber = formData.nomor_rekening?.trim()

      if (!accountNumber) {
        // Generate a unique account number
        const now = new Date()
        const year = now.getFullYear().toString().slice(-2)
        const month = (now.getMonth() + 1).toString().padStart(2, '0')
        const day = now.getDate().toString().padStart(2, '0')
        const randomDigits = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
        accountNumber = `${year}${month}${day}${randomDigits}`
        
        // Double-check that the generated account number is unique
        let isUnique = false
        let attempts = 0
        
        while (!isUnique && attempts < 5) {
          const { data: existingAccount } = await supabase
            .from('anggota')
            .select('nomor_rekening')
            .eq('nomor_rekening', accountNumber)
            .maybeSingle()
          
          if (existingAccount) {
            // Try a different random number
            const newRandomDigits = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
            accountNumber = `${year}${month}${day}${newRandomDigits}`
            attempts++
          } else {
            isUnique = true
          }
        }
      }
      
      // Format date properly for Supabase
      let formattedDate = null
      if (formData.tanggal_lahir) {
        try {
          // Ensure date is in YYYY-MM-DD format
          formattedDate = typeof formData.tanggal_lahir === 'string' 
            ? formData.tanggal_lahir.split('T')[0] 
            : format(formData.tanggal_lahir, 'yyyy-MM-dd')
        } catch (e) {
          console.warn('Error formatting date:', e)
          formattedDate = null
        }
      }
      
      // Prepare data for insert - removed 'saldo' field as it doesn't exist in the anggota table
      const insertData = {
        nama: formData.nama?.trim() || '',
        nomor_rekening: accountNumber,
        alamat: formData.alamat?.trim() || null,
        kota: formData.kota?.trim() || null,
        tempat_lahir: formData.tempat_lahir?.trim() || null,
        tanggal_lahir: formattedDate,
        pekerjaan: formData.pekerjaan?.trim() || null,
        jenis_identitas: formData.jenis_identitas || null,
        nomor_identitas: formData.nomor_identitas?.trim() || null,
        is_active: true
      }
      
      // Log the exact data being sent to Supabase
      console.log('Adding new user with data:', JSON.stringify(insertData, null, 2))
      
      // Insert the new member without selecting to avoid schema errors
      const { error } = await supabase
        .from('anggota')
        .insert(insertData)
      
      if (error) {
        console.error('Insert error:', JSON.stringify(error, null, 2))
        throw error
      }
      
      // After successful insert, fetch the newly created record
      const { data: fetchedData, error: fetchError } = await supabase
        .from('anggota')
        .select('*')
        .eq('nomor_rekening', accountNumber)
        .single()
      
      if (fetchError) {
        console.error('Error fetching new user:', JSON.stringify(fetchError, null, 2))
        throw fetchError
      }
      
      // Use the fetched data as the new member
      const newMember = fetchedData || null
      
      if (!newMember) {
        console.error('Failed to retrieve newly inserted member data')
        throw new Error('Gagal mendapatkan data anggota baru')
      }
      
      try {
        // Create savings account with proper error handling
        await createDefaultSavingsAccount(newMember.id)
        
        toast({
          title: "Berhasil",
          description: `Anggota baru telah ditambahkan dengan akun tabungan SIBAROKAH.`,
        })
        
        return newMember
      } catch (savingsError) {
        console.error('Failed to create savings account:', savingsError)
        
        // Still return the member data even if savings account creation fails
        toast({
          title: "Perhatian",
          description: `Anggota baru telah ditambahkan, tetapi gagal membuat akun tabungan SIBAROKAH. Silakan buat manual.`,
          variant: "destructive"
        })
        
        return newMember
      }
    } catch (error) {
      console.error('Error in addNewUser:', error)
      handleSubmissionError(error)
      throw error
    }
  }

  // This is intentionally left empty as we've moved the createDefaultSavingsAccount function to the top of the file
  
  // Handle submission errors with appropriate user feedback
  const handleSubmissionError = (error: any) => {
    console.error('Error updating/adding user:', JSON.stringify(error, null, 2))
    console.error('Form data being submitted:', JSON.stringify(formData, null, 2))
    
    // Check for specific error types
    let errorMessage = `Terjadi kesalahan saat ${user ? 'memperbarui' : 'menambahkan'} anggota.`
    
    // Handle schema-related errors
    if (error?.message?.includes('Could not find the \'saldo\' column')) {
      errorMessage = 'Terjadi kesalahan dengan struktur database. Kolom saldo tidak ditemukan.'
    } else if (error?.code === 'PGRST204') {
      errorMessage = 'Terjadi kesalahan dengan struktur database. Kolom yang diperlukan tidak ditemukan.'
    } else if (error?.code === '23505') {
      errorMessage = 'Nomor rekening sudah digunakan. Silakan gunakan nomor rekening lain.'
    } else if (error?.code === '23502') {
      errorMessage = 'Data yang dimasukkan tidak lengkap. Pastikan semua kolom wajib telah diisi.'
    } else if (typeof error === 'object' && error !== null) {
      if ('details' in error && error.details) {
        errorMessage += ` ${error.details}`
      } else if ('error' in error) {
        errorMessage += ` ${error.error}`
      } else if ('hint' in error) {
        errorMessage += ` ${error.hint}`
      } else {
        // Try to stringify the error object
        try {
          const errorStr = JSON.stringify(error)
          if (errorStr !== '{}') {
            errorMessage += ` ${errorStr}`
          }
        } catch (e) {
          // Do nothing if we can't stringify
        }
      }
    }
    
    toast({
      title: "Error",
      description: errorMessage,
      variant: "destructive"
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{user ? 'Edit Anggota' : 'Tambah Anggota Baru'}</DialogTitle>
          <DialogDescription>
            {user ? `Edit informasi anggota ${user.nama}` : 'Masukkan informasi anggota baru'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nomor_rekening">Nomor Rekening</Label>
                <Input 
                  id="nomor_rekening"
                  name="nomor_rekening"
                  value={formData.nomor_rekening || ''}
                  onChange={!user ? handleChange : undefined}
                  disabled={!!user}
                  placeholder={user ? '' : 'Wajib Diisi'}
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
              {isSubmitting ? 'Menyimpan...' : (user ? 'Simpan Perubahan' : 'Tambah Anggota')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
