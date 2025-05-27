"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { format, parseISO } from "date-fns"
import { id } from "date-fns/locale"
import { Printer, X } from "lucide-react"

interface Transaksi {
  id: string;
  reference_number?: string;
  anggota_id: string;
  anggota?: {
    nama: string;
  } | null;
  tipe_transaksi: string;
  kategori: string;
  deskripsi?: string;
  jumlah: number;
  saldo_sebelum?: number;
  saldo_sesudah?: number;
  pinjaman_id?: string;
  tabungan_id?: string;
  created_at: string;
  updated_at: string;
  tabungan?: { 
    nomor_rekening: string;
    saldo: number;
    jenis_tabungan_id: string;
    jenis_tabungan?: {
      nama: string;
      kode: string;
    } | null;
  } | null;
  pinjaman?: {
    id: string;
    jumlah: number;
    sisa_pembayaran: number;
    jenis_pinjaman: string;
  } | null;
}

interface TransactionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaksi | null;
  onPrint: () => void;
}

export function TransactionDetailModal({
  isOpen,
  onClose,
  transaction,
  onPrint
}: TransactionDetailModalProps) {
  // Format date function
  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, 'dd MMMM yyyy, HH:mm', { locale: id });
    } catch (error) {
      return dateString;
    }
  };
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return `Rp ${amount.toLocaleString('id-ID')}`;
  };

  // Map kategori to display name
  const getKategoriDisplay = (kategori: string) => {
    switch (kategori.toLowerCase()) {
      case 'setoran':
        return 'Setoran';
      case 'penarikan':
        return 'Penarikan';
      case 'pembayaran_pinjaman':
        return 'Angsuran';
      case 'pencairan_pinjaman':
        return 'Pinjaman';
      case 'biaya_admin':
        return 'Biaya Admin';
      case 'lainnya':
        return 'Lainnya';
      default:
        return kategori;
    }
  };

  if (!transaction) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <span>Detail Transaksi</span>
            <Button variant="outline" size="icon" onClick={onPrint} className="mr-10">
              <Printer className="h-4 w-4" />
            </Button>
          </DialogTitle>
          <DialogDescription>
            {transaction.reference_number || transaction.id}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Anggota</p>
              <p className="font-medium">{transaction.anggota?.nama || 'Anggota'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Tanggal</p>
              <p>{formatDate(transaction.created_at.toString())}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Jenis Transaksi</p>
              <Badge variant={transaction.tipe_transaksi === 'masuk' ? 'secondary' : 'destructive'}>
                {transaction.tipe_transaksi === 'masuk' ? 'Masuk' : 'Keluar'}
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Kategori</p>
              <p>{getKategoriDisplay(transaction.kategori)}</p>
            </div>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Deskripsi</p>
            <p>{transaction.deskripsi || '-'}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Jumlah</p>
              <p className="font-semibold text-lg">
                {transaction.tipe_transaksi === 'masuk' ? '+ ' : '- '}
                {formatCurrency(Number(transaction.jumlah))}
              </p>
            </div>
            {transaction.saldo_sesudah !== undefined && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Saldo Akhir</p>
                <p>{formatCurrency(Number(transaction.saldo_sesudah))}</p>
              </div>
            )}
          </div>
          
          {transaction.tabungan && (
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Rekening Tabungan</p>
              <div>
                <p><span className="font-medium">{transaction.tabungan.jenis_tabungan?.nama || 'Tabungan'}</span></p>
                <p className="text-sm text-muted-foreground">No. Rekening: {transaction.tabungan.nomor_rekening}</p>
                <p className="text-sm text-muted-foreground">Saldo Saat Ini: {formatCurrency(Number(transaction.tabungan.saldo))}</p>
              </div>
            </div>
          )}
          
          {transaction.pinjaman && (
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Pinjaman Terkait</p>
              <div>
                <p><span className="font-medium">{transaction.pinjaman.jenis_pinjaman || 'Pinjaman'}</span></p>
                <p className="text-sm text-muted-foreground">ID: {transaction.pinjaman.id.substring(0, 8)}</p>
                <p className="text-sm text-muted-foreground">Jumlah Pinjaman: {formatCurrency(Number(transaction.pinjaman.jumlah))}</p>
                <p className="text-sm text-muted-foreground">Sisa Pembayaran: {formatCurrency(Number(transaction.pinjaman.sisa_pembayaran))}</p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
