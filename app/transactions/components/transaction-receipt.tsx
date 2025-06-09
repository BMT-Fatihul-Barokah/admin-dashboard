"use client"

import { useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { format, parseISO } from "date-fns"
import { id } from "date-fns/locale"
import { Printer, X } from "lucide-react"
import { useReactToPrint } from "react-to-print"

interface Transaksi {
  id: string;
  anggota_id: string;
  anggota?: {
    nama: string;
    nomor_rekening: string;
  } | null;
  tipe_transaksi: string;
  source_type?: string;
  deskripsi?: string;
  jumlah: number;
  sebelum?: number;
  sesudah?: number;
  pembiayaan_id?: string;
  tabungan_id?: string;
  created_at: string;
  updated_at: string;
}

interface TransactionReceiptProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaksi | null;
}

export function TransactionReceipt({
  isOpen,
  onClose,
  transaction
}: TransactionReceiptProps) {
  const printRef = useRef<HTMLDivElement>(null);

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
    // Always format as positive number
    return `Rp ${Math.abs(amount).toLocaleString('id-ID')}`;
  };



  const handlePrint = useReactToPrint({
    documentTitle: `Bukti_Transaksi_${transaction?.id}`,
    onAfterPrint: () => {
      console.log('Print completed');
    },
    // Use this function to return the element to print
    contentRef: printRef,
  });

  if (!transaction) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <span>Bukti Transaksi</span>
            <Button variant="default" size="sm" onClick={handlePrint} className="mr-10">
              <Printer className="h-4 w-4 mr-2" />
              Cetak
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div ref={printRef} className="p-6 bg-white">
          {/* Receipt Header */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold">KOPERASI FATIHUL BAROKAH</h2>
            <p className="text-sm">Jl. Raya Utama No. 123, Kota, Indonesia</p>
            <p className="text-sm">Telp: (021) 1234-5678</p>
            <div className="mt-4 border-t-2 border-b-2 border-black py-2">
              <h3 className="text-lg font-bold">BUKTI TRANSAKSI</h3>
              <p className="text-sm">{transaction.id}</p>
            </div>
          </div>
          
          {/* Transaction Details */}
          <div className="mb-6">
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div>
                <p className="text-sm font-medium">Tanggal:</p>
                <p className="text-sm">{formatDate(transaction.created_at.toString())}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Anggota:</p>
                <p className="text-sm">{transaction.anggota?.nama || 'Anggota'}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div>
                <p className="text-sm font-medium">Jenis Transaksi:</p>
                <p className="text-sm">{transaction.tipe_transaksi === 'masuk' ? 'Masuk' : 'Keluar'}</p>
              </div>

            </div>
            
            {transaction.deskripsi && (
              <div className="mb-2">
                <p className="text-sm font-medium">Deskripsi:</p>
                <p className="text-sm">{transaction.deskripsi}</p>
              </div>
            )}
          </div>
          
          {/* Amount */}
          <div className="border-t border-dashed border-gray-300 pt-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <p className="font-medium">Jumlah:</p>
              <p className="font-bold text-lg">
                {transaction.tipe_transaksi === 'masuk' ? '+ ' : '- '}
                {formatCurrency(Math.abs(Number(transaction.jumlah)))}
              </p>
            </div>
            
            {transaction.sebelum !== undefined && (
              <div className="flex justify-between items-center mb-1">
                <p className="text-sm">Saldo Sebelum:</p>
                <p className="text-sm">{formatCurrency(Number(transaction.sebelum))}</p>
              </div>
            )}
            
            {transaction.sesudah !== undefined && (
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium">Saldo Akhir:</p>
                <p className="text-sm font-medium">{formatCurrency(Number(transaction.sesudah))}</p>
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div className="text-center mt-8">
            <p className="text-sm mb-2">Terima kasih atas kepercayaan Anda</p>
            <p className="text-xs text-gray-500">Dokumen ini dicetak pada {format(new Date(), 'dd MMMM yyyy, HH:mm', { locale: id })}</p>
            <p className="text-xs text-gray-500">Bukti transaksi ini sah tanpa tanda tangan dan stempel</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
