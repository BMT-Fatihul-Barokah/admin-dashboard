"use client"

import { useState } from "react"
import { AlertTriangle, CheckCircle, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"

type Akun = {
  id: string
  nomor_telepon: string
  pin: string | null
  anggota_id: string | null
  created_at: Date | string
  updated_at: Date | string
  is_verified: boolean
  is_active: boolean
  anggota?: {
    nama: string
    nomor_rekening: string
  }
}

interface ToggleAkunStatusProps {
  akun: Akun | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onStatusChanged: () => void
}

export function ToggleAkunStatus({ akun, open, onOpenChange, onStatusChanged }: ToggleAkunStatusProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!akun) return null

  const handleToggleStatus = async () => {
    setIsSubmitting(true)
    try {
      const newStatus = !akun.is_active
      
      const { error } = await supabase
        .from('akun')
        .update({ is_active: newStatus })
        .eq('id', akun.id)
      
      if (error) throw error
      
      toast({
        title: "Berhasil",
        description: newStatus 
          ? `Akun ${akun.nomor_telepon} berhasil diaktifkan` 
          : `Akun ${akun.nomor_telepon} berhasil dinonaktifkan`,
      })
      
      onOpenChange(false)
      onStatusChanged()
    } catch (error: any) {
      console.error('Error toggling akun status:', error)
      toast({
        title: "Error",
        description: `Gagal mengubah status akun: ${error.message}`,
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {akun.is_active ? (
              <>
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Nonaktifkan Akun
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5 text-green-500" />
                Aktifkan Akun
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {akun.is_active 
              ? `Apakah Anda yakin ingin menonaktifkan akun ${akun.nomor_telepon}?`
              : `Apakah Anda yakin ingin mengaktifkan kembali akun ${akun.nomor_telepon}?`
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            {akun.is_active 
              ? "Akun yang dinonaktifkan tidak akan dapat login ke aplikasi."
              : "Mengaktifkan akun akan memungkinkan pengguna untuk login kembali ke aplikasi."
            }
          </p>
          
          {akun.anggota && (
            <div className="mt-4 p-4 border rounded-md bg-muted/50">
              <p className="text-sm font-medium">Informasi Anggota Terkait:</p>
              <p className="text-sm mt-1">Nama: {akun.anggota.nama}</p>
              <p className="text-sm">No. Rekening: {akun.anggota.nomor_rekening}</p>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Batal
          </Button>
          <Button 
            type="button"
            variant={akun.is_active ? "destructive" : "default"}
            onClick={handleToggleStatus}
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {akun.is_active ? 'Nonaktifkan' : 'Aktifkan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
