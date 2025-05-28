"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import { format } from "date-fns"
import { createClient } from '@supabase/supabase-js'

interface AddSavingsAccountProps {
  userId: string
  userName: string
  onSuccess: () => void
}

interface SavingsType {
  id: string
  kode: string
  nama: string
  minimum_setoran: number
  is_reguler: boolean
  periode_setoran: string | null
  jangka_waktu: number | null
  is_active: boolean
}

export function AddSavingsAccount({ userId, userName, onSuccess }: AddSavingsAccountProps) {
  const { toast } = useToast()
  const [savingsTypes, setSavingsTypes] = useState<SavingsType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Form state
  const [selectedTypeId, setSelectedTypeId] = useState<string>("")
  const [isDefault, setIsDefault] = useState(false)
  const [selectedType, setSelectedType] = useState<SavingsType | null>(null)
  
  // Fetch available savings types (only those the member doesn't already have)
  useEffect(() => {
    async function fetchSavingsTypes() {
      setIsLoading(true)
      try {
        // First, get the member's existing savings accounts
        const { data: memberAccounts, error: memberError } = await supabase
          .from('tabungan')
          .select('jenis_tabungan_id')
          .eq('anggota_id', userId)
          .eq('status', 'aktif')
        
        if (memberError) throw memberError
        
        // Extract the IDs of savings types the member already has
        const existingTypeIds = (memberAccounts || []).map(account => account.jenis_tabungan_id)
        
        // Get all active savings types
        const { data, error } = await supabase
          .from('jenis_tabungan')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true })
        
        if (error) throw error
        
        // Filter out the savings types the member already has
        const availableTypes = (data || []).filter(type => !existingTypeIds.includes(type.id))
        
        setSavingsTypes(availableTypes)
      } catch (error) {
        console.error('Error fetching savings types:', error)
        toast({
          title: "Error",
          description: "Gagal memuat data jenis tabungan",
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchSavingsTypes()
  }, [toast, userId])

  // Update selected type when type ID changes
  useEffect(() => {
    if (selectedTypeId) {
      const type = savingsTypes.find(t => t.id === selectedTypeId)
      setSelectedType(type || null)
    } else {
      setSelectedType(null)
    }
  }, [selectedTypeId, savingsTypes])

  // Generate account number
  const generateAccountNumber = async (): Promise<string> => {
    try {
      // Get the last account number from the database
      const { data, error } = await supabase
        .from('tabungan')
        .select('nomor_rekening')
        .order('created_at', { ascending: false })
        .limit(1)
      
      if (error) throw error
      
      let lastNumber = 0
      if (data && data.length > 0) {
        const lastAccountNumber = data[0].nomor_rekening
        // Extract the numeric part of the account number (assuming format like 'TAB-00001')
        const match = lastAccountNumber.match(/\d+$/)
        if (match) {
          lastNumber = parseInt(match[0], 10)
        }
      }
      
      // Generate new account number with incremented number
      const newNumber = lastNumber + 1
      const paddedNumber = newNumber.toString().padStart(5, '0')
      return `TAB-${paddedNumber}`
    } catch (error) {
      console.error('Error generating account number:', error)
      // Fallback to timestamp-based number if there's an error
      const timestamp = new Date().getTime().toString().slice(-5)
      return `TAB-${timestamp}`
    }
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedTypeId) {
      toast({
        title: "Error",
        description: "Silakan pilih jenis tabungan",
        variant: "destructive"
      })
      return
    }
    
    setIsSubmitting(true)
    
    try {
      // Generate account number
      const accountNumber = await generateAccountNumber()
      
      // Prepare data for new savings account
      const currentTime = new Date().toISOString();
      const tanggalJatuhTempo = selectedType?.jangka_waktu 
        ? new Date(Date.now() + selectedType.jangka_waktu * 30 * 24 * 60 * 60 * 1000).toISOString() 
        : null;
      
      // Jika ini adalah tabungan default, update tabungan lain terlebih dahulu
      if (isDefault) {
        try {
          const { error: updateError } = await supabase
            .from('tabungan')
            .update({ is_default: false })
            .eq('anggota_id', userId)
            .eq('status', 'aktif');
          
          if (updateError) {
            console.error('Error updating other accounts:', updateError);
          }
        } catch (updateErr) {
          console.error('Exception updating other accounts:', updateErr);
        }
      }
      
      // Gunakan fungsi bypass RLS yang baru dibuat
      console.log('Attempting to insert account using bypass RLS function');
      
      // Panggil fungsi add_tabungan_baru untuk bypass RLS
      const { data, error } = await supabase.rpc('add_tabungan_baru', {
        p_nomor_rekening: accountNumber,
        p_anggota_id: userId,
        p_jenis_tabungan_id: selectedTypeId,
        p_saldo: 0,
        p_tanggal_jatuh_tempo: tanggalJatuhTempo,
        p_tanggal_setoran_reguler: 1, // Default to 1
        p_is_default: isDefault
      });
      
      console.log('Insert response:', { data, error });
      
      if (error) {
        console.error('Detailed error:', JSON.stringify(error));
        throw error;
      }
      
      toast({
        title: "Berhasil",
        description: `Tabungan baru berhasil ditambahkan untuk ${userName}`,
        variant: "default"
      })
      
      // Call success callback
      onSuccess()
    } catch (error: any) {
      console.error('Error adding savings account:', error)
      
      // Periksa apakah error adalah duplikasi jenis tabungan
      if (error?.message && error.message.includes('Anggota sudah memiliki jenis tabungan ini')) {
        toast({
          title: "⚠️ Duplikasi Tabungan",
          description: `Anggota sudah memiliki jenis tabungan ini. Tidak dapat menambahkan jenis tabungan yang sama.`,
          variant: "destructive"
        })
      } else {
        toast({
          title: "Error",
          description: `Gagal menambahkan tabungan baru: ${error?.message || JSON.stringify(error)}`,
          variant: "destructive"
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="jenis_tabungan">Jenis Tabungan</Label>
          {savingsTypes.length === 0 ? (
            <div className="p-4 border rounded-md bg-muted/50">
              <p className="text-sm text-muted-foreground text-center">
                Anggota ini sudah memiliki semua jenis tabungan yang tersedia.
              </p>
            </div>
          ) : (
            <Select
              value={selectedTypeId}
              onValueChange={setSelectedTypeId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih jenis tabungan" />
              </SelectTrigger>
              <SelectContent>
                {savingsTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.kode} - {type.nama} (Min. {formatCurrency(type.minimum_setoran)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>





        <div className="flex items-center space-x-2">
          <Switch
            id="is_default"
            checked={isDefault}
            onCheckedChange={setIsDefault}
          />
          <Label htmlFor="is_default">Jadikan Tabungan Utama</Label>
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button 
          type="submit" 
          disabled={isSubmitting || savingsTypes.length === 0}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Menyimpan...
            </>
          ) : (
            'Tambah Tabungan'
          )}
        </Button>
      </div>
    </form>
  )
}
