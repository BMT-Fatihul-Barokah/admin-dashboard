"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { format, parseISO } from "date-fns"
import { id } from "date-fns/locale"

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

interface UserDetailDialogProps {
  user: Anggota | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UserDetailDialog({ user, open, onOpenChange }: UserDetailDialogProps) {
  // Format date function
  const formatDate = (dateString: string | Date | undefined) => {
    if (!dateString) return '-'
    try {
      const date = typeof dateString === 'string' ? parseISO(dateString) : dateString
      return format(date, 'dd MMMM yyyy', { locale: id })
    } catch (error) {
      return String(dateString) || '-'
    }
  }

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Detail Anggota</DialogTitle>
          <DialogDescription>
            Informasi lengkap anggota {user.nama}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-sm text-muted-foreground">Nomor Rekening</h3>
              <p>{user.nomor_rekening}</p>
            </div>
            <div>
              <h3 className="font-medium text-sm text-muted-foreground">Nama Lengkap</h3>
              <p>{user.nama}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-sm text-muted-foreground">Alamat</h3>
              <p>{user.alamat || '-'}</p>
            </div>
            <div>
              <h3 className="font-medium text-sm text-muted-foreground">Kota</h3>
              <p>{user.kota || '-'}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-sm text-muted-foreground">Tempat Lahir</h3>
              <p>{user.tempat_lahir || '-'}</p>
            </div>
            <div>
              <h3 className="font-medium text-sm text-muted-foreground">Tanggal Lahir</h3>
              <p>{user.tanggal_lahir ? formatDate(user.tanggal_lahir) : '-'}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-sm text-muted-foreground">Pekerjaan</h3>
              <p>{user.pekerjaan || '-'}</p>
            </div>
            <div>
              <h3 className="font-medium text-sm text-muted-foreground">Jenis Identitas</h3>
              <p>{user.jenis_identitas || '-'}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-sm text-muted-foreground">Nomor Identitas</h3>
              <p>{user.nomor_identitas || '-'}</p>
            </div>
            <div>
              <h3 className="font-medium text-sm text-muted-foreground">Saldo</h3>
              <p className="font-semibold">Rp {Number(user.saldo).toLocaleString('id-ID')}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-sm text-muted-foreground">Tanggal Bergabung</h3>
              <p>{formatDate(user.created_at)}</p>
            </div>
            <div>
              <h3 className="font-medium text-sm text-muted-foreground">Status</h3>
              <p className={user.is_active ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                {user.is_active ? 'Aktif' : 'Nonaktif'}
              </p>
            </div>
          </div>
          
          {user.closed_at && (
            <div>
              <h3 className="font-medium text-sm text-muted-foreground">Tanggal Penutupan</h3>
              <p>{formatDate(user.closed_at)}</p>
            </div>
          )}
        </div>
        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Tutup
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
