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

interface DeleteUserDialogProps {
  userId: string
  userName: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onUserDeleted: () => void
}

export function DeleteUserDialog({
  userId,
  userName,
  open,
  onOpenChange,
  onUserDeleted,
}: DeleteUserDialogProps) {
  const { toast } = useToast()
  const [isDeleting, setIsDeleting] = useState(false)
  const [confirmText, setConfirmText] = useState("")
  const confirmationText = userName.toLowerCase()

  const handleDelete = async () => {
    if (confirmText.toLowerCase() !== confirmationText) {
      toast({
        title: "Konfirmasi tidak sesuai",
        description: "Silakan masukkan nama anggota dengan benar untuk konfirmasi.",
        variant: "destructive",
      })
      return
    }

    setIsDeleting(true)
    try {
      // First check if user has related records
      const { data: relatedData, error: relatedError } = await supabase.rpc('check_anggota_dependencies', {
        p_anggota_id: userId
      })

      if (relatedError) throw relatedError

      if (relatedData && relatedData.has_dependencies) {
        toast({
          title: "Tidak dapat menghapus anggota",
          description: "Anggota ini memiliki data terkait (tabungan, pembiayaan, transaksi, atau akun). Nonaktifkan anggota sebagai alternatif.",
          variant: "destructive",
        })
        onOpenChange(false)
        return
      }

      // If no dependencies, proceed with deletion
      const { error } = await supabase
        .from('anggota')
        .delete()
        .eq('id', userId)

      if (error) throw error

      toast({
        title: "Anggota berhasil dihapus",
        description: `${userName} telah dihapus dari sistem.`,
      })
      onUserDeleted()
      onOpenChange(false)
    } catch (error: any) {
      console.error('Error deleting user:', error)
      toast({
        title: "Gagal menghapus anggota",
        description: error.message || "Terjadi kesalahan saat menghapus anggota.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Hapus Anggota
          </DialogTitle>
          <DialogDescription>
            Tindakan ini akan menghapus anggota secara permanen dan tidak dapat dibatalkan.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="rounded-md bg-destructive/10 p-4 text-destructive">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 mt-0.5" />
              <div>
                <h4 className="font-medium">Peringatan:</h4>
                <ul className="mt-2 list-disc pl-5 text-sm">
                  <li>Menghapus anggota akan menghilangkan semua data terkait anggota tersebut.</li>
                  <li>Jika anggota memiliki tabungan, pembiayaan, atau transaksi aktif, penghapusan tidak diizinkan.</li>
                  <li>Sebagai alternatif, pertimbangkan untuk menonaktifkan anggota daripada menghapusnya.</li>
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
            disabled={isDeleting || confirmText.toLowerCase() !== confirmationText}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menghapus...
              </>
            ) : (
              "Hapus Anggota"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
