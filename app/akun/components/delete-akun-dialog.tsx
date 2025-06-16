"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, AlertTriangle } from "lucide-react"
import { supabase } from "@/lib/supabase"

// Define the Akun type locally to avoid circular dependency
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

interface DeleteAkunDialogProps {
  akun: Akun | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onAkunDeleted: () => void
}

export function DeleteAkunDialog({
  akun,
  open,
  onOpenChange,
  onAkunDeleted,
}: DeleteAkunDialogProps) {
  const { toast } = useToast()
  const [isDeleting, setIsDeleting] = useState(false)
  const [confirmText, setConfirmText] = useState("")
  const confirmationText = akun?.nomor_telepon || ""

  const handleDelete = async () => {
    if (!akun) return
    
    if (confirmText !== confirmationText) {
      toast({
        title: "Konfirmasi tidak sesuai",
        description: "Silakan masukkan nomor telepon dengan benar untuk konfirmasi.",
        variant: "destructive",
      })
      return
    }

    setIsDeleting(true)
    try {
      // Delete the account
      const { error } = await supabase
        .from('akun')
        .delete()
        .eq('id', akun.id)

      if (error) throw error

      toast({
        title: "Akun berhasil dihapus",
        description: `Akun dengan nomor telepon ${akun.nomor_telepon} telah dihapus dari sistem.`,
      })
      onAkunDeleted()
      onOpenChange(false)
    } catch (error: any) {
      console.error('Error deleting account:', error)
      toast({
        title: "Gagal menghapus akun",
        description: error.message || "Terjadi kesalahan saat menghapus akun.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  if (!akun) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Hapus Akun
          </DialogTitle>
          <DialogDescription>
            Tindakan ini akan menghapus akun secara permanen dan tidak dapat dibatalkan.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="rounded-md bg-destructive/10 p-4 text-destructive">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 mt-0.5" />
              <div>
                <h4 className="font-medium">Peringatan:</h4>
                <ul className="mt-2 list-disc pl-5 text-sm">
                  <li>Menghapus akun akan menghilangkan akses pengguna ke aplikasi.</li>
                  <li>Pengguna tidak akan dapat masuk kembali dengan nomor telepon ini.</li>
                  <li>Data anggota yang terkait dengan akun ini tidak akan dihapus.</li>
                  <li>Sebagai alternatif, pertimbangkan untuk menonaktifkan akun daripada menghapusnya.</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm">
              Ketik <span className="font-semibold">{confirmationText}</span> untuk konfirmasi penghapusan:
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder={`Ketik "${confirmationText}" untuk konfirmasi`}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Batal
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting || confirmText !== confirmationText}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menghapus...
              </>
            ) : (
              "Hapus Akun"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
