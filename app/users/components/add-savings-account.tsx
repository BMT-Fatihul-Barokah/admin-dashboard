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
// Using centralized supabase client from @/lib/supabase

interface AddSavingsAccountProps {
  userId: string
  userName: string
  onSuccess: () => void
}

interface SavingsType {
  id: string
  kode: string
  nama: string
  deskripsi?: string
  has_account?: boolean
}

export function AddSavingsAccount({ userId, userName, onSuccess }: AddSavingsAccountProps) {
  const { toast } = useToast()
  const [savingsTypes, setSavingsTypes] = useState<SavingsType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Form state
  const [selectedTypeId, setSelectedTypeId] = useState<string>("")
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
        
        // Get all savings types
        const { data, error } = await supabase
          .from('jenis_tabungan')
          .select('id, kode, nama, deskripsi')
          .order('kode', { ascending: true })
        
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

  // We no longer need to generate account numbers as the server will do it
  // based on the savings type code

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedTypeId) {
      toast({
        title: "Error",
        description: "Pilih jenis tabungan terlebih dahulu",
        variant: "destructive"
      })
      return
    }
    
    setIsSubmitting(true)
    
    try {
      // Use our new dedicated RPC function
      console.log('Adding savings account with RPC function');
      
      const { data, error } = await supabase.rpc('add_savings_account', {
        p_anggota_id: userId,
        p_jenis_tabungan_id: selectedTypeId,
        p_saldo: 0
      });
      
      if (error) {
        console.error('Error from RPC function:', error);
        
        // If RPC fails, try direct insert as a last resort
        if (error.code === 'PGRST116') { // Function not found
          console.log('RPC function not found, trying direct insert');
          
          const { error: insertError } = await supabase
            .from('tabungan')
            .insert({
              anggota_id: userId,
              jenis_tabungan_id: selectedTypeId,
              saldo: 0,
              status: 'aktif',
              created_at: new Date(),
              updated_at: new Date()
            });
          
          if (insertError) {
            console.error('Direct insert also failed:', insertError);
            throw insertError;
          }
        } else {
          throw error;
        }
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
      
      // Check for specific error messages
      if (error?.message && error.message.includes('Anggota sudah memiliki jenis tabungan ini')) {
        toast({
          title: "⚠️ Duplikasi Tabungan",
          description: `Anggota sudah memiliki jenis tabungan ini. Tidak dapat menambahkan jenis tabungan yang sama.`,
          variant: "destructive"
        })
      } else if (error?.code === '23505') { // Unique constraint violation
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
  
  // Format currency (kept for future use)
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
                    {type.kode} - {type.nama}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>





        {/* Toggle for default savings removed as no longer needed */}
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
