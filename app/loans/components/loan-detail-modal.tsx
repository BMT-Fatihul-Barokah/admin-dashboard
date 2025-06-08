"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { format, parseISO } from "date-fns"
import { id } from "date-fns/locale"
import { X, CalendarDays, CreditCard } from "lucide-react"
import { Pembiayaan } from "@/lib/pembiayaan"

interface LoanDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  loan: Pembiayaan | null;
  onViewSchedule: () => void;
  onRecordPayment: () => void;
}

export function LoanDetailModal({
  isOpen,
  onClose,
  loan,
  onViewSchedule,
  onRecordPayment
}: LoanDetailModalProps) {
  // Format date function
  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, 'dd MMMM yyyy', { locale: id });
    } catch (error) {
      return dateString;
    }
  };
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return `Rp ${amount.toLocaleString('id-ID')}`;
  };

  // Get badge variant based on status
  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'aktif':
        return {
          variant: 'default',
          className: 'bg-green-500'
        };
      case 'lunas':
        return {
          variant: 'outline',
          className: 'border-green-500 text-green-500'
        };
      default:
        return {
          variant: 'default',
          className: ''
        };
    }
  };

  // Calculate progress percentage
  const calculateProgress = (total: number, remaining: number) => {
    if (total === 0) return 100;
    const paid = total - remaining;
    return Math.round((paid / total) * 100);
  };

  if (!loan) return null;

  const progressPercentage = calculateProgress(Number(loan.total_pembayaran), Number(loan.sisa_pembayaran));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Detail Pembiayaan</DialogTitle>
          <DialogDescription>
            ID: {loan.id}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          {/* Header Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Anggota</p>
              <p className="font-medium">{loan.anggota?.nama || 'Anggota'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <Badge
                variant={getStatusBadgeVariant(loan.status).variant as any}
                className={getStatusBadgeVariant(loan.status).className}
              >
                {loan.status}
              </Badge>
            </div>
          </div>
          
          {/* Loan Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Jenis Pembiayaan</p>
              <p>{loan.jenis_pembiayaan?.nama || '-'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Tanggal Pengajuan</p>
              <p>{formatDate(loan.created_at.toString())}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Jumlah Pembiayaan</p>
              <p className="font-semibold text-lg">{formatCurrency(Number(loan.jumlah))}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Jatuh Tempo</p>
              <p>{formatDate(loan.jatuh_tempo.toString())}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Total Pembayaran</p>
              <p>{formatCurrency(Number(loan.total_pembayaran))}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Sisa Pembayaran</p>
              <p>{formatCurrency(Number(loan.sisa_pembayaran))}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Deskripsi</p>
              <p>{loan.deskripsi || '-'}</p>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress Pembayaran</span>
              <span>{progressPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
              <div 
                className="bg-green-600 h-2.5 rounded-full" 
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={onViewSchedule}
            >
              <CalendarDays className="mr-2 h-4 w-4" />
              Jadwal Pembayaran
            </Button>
            <Button 
              variant="default" 
              className="flex-1"
              onClick={onRecordPayment}
              disabled={loan.status === 'lunas'}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Catat Pembayaran
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
