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
  const [targetAmount, setTargetAmount] = useState<number | null>(null)
  const [isDefault, setIsDefault] = useState(false)
  const [tanggalSetoranReguler, setTanggalSetoranReguler] = useState<number | null>(null)
  const [selectedType, setSelectedType] = useState<SavingsType | null>(null)
  
  // Fetch available savings types
  useEffect(() => {
    async function fetchSavingsTypes() {
      setIsLoading(true)
      try {
        const { data, error } = await supabase
          .from('jenis_tabungan')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true })
        
        if (error) throw error
        
        setSavingsTypes(data || [])
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
  }, [toast])

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
      const newAccount = {
        nomor_rekening: accountNumber,
        anggota_id: userId,
        jenis_tabungan_id: selectedTypeId,
        saldo: 0, // Initial balance is 0
        tanggal_buka: new Date().toISOString(),
        tanggal_jatuh_tempo: selectedType?.jangka_waktu 
          ? new Date(Date.now() + selectedType.jangka_waktu * 30 * 24 * 60 * 60 * 1000).toISOString() 
          : null,
        status: 'aktif',
        tanggal_setoran_reguler: tanggalSetoranReguler,
        is_default: isDefault,
        target_amount: targetAmount
      }
      
      // If this is set as default, update all other accounts to not be default
      if (isDefault) {
        const { error: updateError } = await supabase
          .from('tabungan')
          .update({ is_default: false })
          .eq('anggota_id', userId)
          .eq('status', 'aktif')
        
        if (updateError) throw updateError
      }
      
      // Insert new savings account
      const { error } = await supabase
        .from('tabungan')
        .insert(newAccount)
      
      if (error) throw error
      
      toast({
        title: "Berhasil",
        description: `Tabungan baru berhasil ditambahkan untuk ${userName}`,
        variant: "default"
      })
      
      // Call success callback
      onSuccess()
    } catch (error) {
      console.error('Error adding savings account:', error)
      toast({
        title: "Error",
        description: "Gagal menambahkan tabungan baru",
        variant: "destructive"
      })
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
        </div>

        {selectedType?.is_reguler && (
          <div className="space-y-2">
            <Label htmlFor="tanggal_setoran">Tanggal Setoran Reguler</Label>
            <Select
              value={tanggalSetoranReguler?.toString() || ""}
              onValueChange={(value) => setTanggalSetoranReguler(value ? parseInt(value, 10) : null)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih tanggal setoran" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                  <SelectItem key={day} value={day.toString()}>
                    Tanggal {day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Periode setoran: {selectedType.periode_setoran || 'Tidak ditentukan'}
            </p>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="target_amount">Target Tabungan (Opsional)</Label>
          <Input
            id="target_amount"
            type="number"
            min={0}
            value={targetAmount || ""}
            onChange={(e) => setTargetAmount(e.target.value ? parseFloat(e.target.value) : null)}
            placeholder="Masukkan target tabungan"
          />
          <p className="text-sm text-muted-foreground">
            Target tabungan akan digunakan untuk menghitung progres tabungan
          </p>
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
        <Button type="submit" disabled={isSubmitting}>
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
