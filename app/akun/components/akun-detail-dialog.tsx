"use client"

import { format, parseISO } from "date-fns"
import { id } from "date-fns/locale"
import { Smartphone, UserCheck, Calendar, CheckCircle, XCircle } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

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

interface AkunDetailDialogProps {
  akun: Akun | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AkunDetailDialog({ akun, open, onOpenChange }: AkunDetailDialogProps) {
  if (!akun) return null

  // Format date function
  const formatDate = (dateString: string | Date) => {
    try {
      const date = typeof dateString === 'string' ? parseISO(dateString) : dateString
      return format(date, 'dd MMMM yyyy HH:mm', { locale: id })
    } catch (error) {
      return String(dateString)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Detail Akun</DialogTitle>
          <DialogDescription>
            Informasi lengkap tentang akun pengguna
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="flex flex-col space-y-1.5">
              <div className="flex items-center space-x-2">
                <Smartphone className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">Nomor Telepon</h3>
              </div>
              <p className="text-sm">{akun.nomor_telepon}</p>
            </div>

            <div className="flex flex-col space-y-1.5">
              <div className="flex items-center space-x-2">
                <UserCheck className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">Nama Anggota</h3>
              </div>
              <p className="text-sm">{akun.anggota?.nama || '-'}</p>
            </div>

            <div className="flex flex-col space-y-1.5">
              <div className="flex items-center space-x-2">
                <UserCheck className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">Nomor Rekening</h3>
              </div>
              <p className="text-sm">{akun.anggota?.nomor_rekening || '-'}</p>
            </div>

            <div className="flex flex-col space-y-1.5">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">Tanggal Dibuat</h3>
              </div>
              <p className="text-sm">{formatDate(akun.created_at)}</p>
            </div>

            <div className="flex flex-col space-y-1.5">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">Terakhir Diperbarui</h3>
              </div>
              <p className="text-sm">{formatDate(akun.updated_at)}</p>
            </div>

            <div className="flex flex-col space-y-1.5">
              <h3 className="text-sm font-semibold">Status Verifikasi</h3>
              <div className="flex items-center space-x-2">
                {akun.is_verified ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <p className="text-sm text-green-500">Terverifikasi</p>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-amber-500" />
                    <p className="text-sm text-amber-500">Belum Terverifikasi</p>
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-col space-y-1.5">
              <h3 className="text-sm font-semibold">Status Akun</h3>
              <div className="flex items-center space-x-2">
                {akun.is_active ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <p className="text-sm text-green-500">Aktif</p>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-red-500" />
                    <p className="text-sm text-red-500">Nonaktif</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
