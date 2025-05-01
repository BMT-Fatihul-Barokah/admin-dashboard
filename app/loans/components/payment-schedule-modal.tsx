"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format, parseISO, addMonths } from "date-fns"
import { id } from "date-fns/locale"
import { X, Download, Printer } from "lucide-react"
import { Pinjaman } from "@/lib/pinjaman"
import { useRef } from "react"
import { useReactToPrint } from "react-to-print"
import { supabase } from "@/lib/supabase"
import { useState, useEffect } from "react"

interface PaymentScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  loan: Pinjaman | null;
}

// Define payment schedule item type
interface PaymentScheduleItem {
  id: string;
  pinjaman_id: string;
  angsuran_ke: number;
  tanggal_jatuh_tempo: string;
  jumlah_angsuran: number;
  status: string;
  tanggal_pembayaran?: string;
}

export function PaymentScheduleModal({
  isOpen,
  onClose,
  loan
}: PaymentScheduleModalProps) {
  const [paymentSchedule, setPaymentSchedule] = useState<PaymentScheduleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

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

  // Generate payment schedule based on loan data
  const generatePaymentSchedule = (loan: Pinjaman) => {
    if (!loan) return [];
    
    // Calculate number of installments (assuming 12 months for simplicity)
    const numberOfInstallments = 12;
    const installmentAmount = Number(loan.total_pembayaran) / numberOfInstallments;
    
    // Generate schedule
    const schedule: PaymentScheduleItem[] = [];
    const startDate = new Date(loan.created_at);
    
    for (let i = 1; i <= numberOfInstallments; i++) {
      const dueDate = addMonths(startDate, i);
      
      // Determine status based on current date
      let status = 'belum_bayar';
      if (new Date() > dueDate) {
        status = 'terlambat';
      }
      
      // For demo purposes, mark some installments as paid
      if (i <= 3 && loan.status === 'aktif') {
        status = 'lunas';
      }
      
      schedule.push({
        id: `${loan.id}-${i}`,
        pinjaman_id: loan.id,
        angsuran_ke: i,
        tanggal_jatuh_tempo: dueDate.toISOString(),
        jumlah_angsuran: installmentAmount,
        status: status,
        tanggal_pembayaran: status === 'lunas' ? addMonths(startDate, i).toISOString() : undefined
      });
    }
    
    return schedule;
  };

  // Fetch payment schedule from database or generate if not available
  useEffect(() => {
    const fetchPaymentSchedule = async () => {
      if (!loan) return;
      
      setIsLoading(true);
      
      try {
        // Try to fetch from database first (in a real app)
        // For demo, we'll just generate the schedule
        const generatedSchedule = generatePaymentSchedule(loan);
        setPaymentSchedule(generatedSchedule);
      } catch (error) {
        console.error('Error fetching payment schedule:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (isOpen && loan) {
      fetchPaymentSchedule();
    }
  }, [isOpen, loan]);

  // Handle print functionality
  const handlePrint = useReactToPrint({
    documentTitle: `Jadwal_Pembayaran_${loan?.id}`,
    onAfterPrint: () => {
      console.log('Print completed');
    },
    // Use this function to return the element to print
    contentRef: printRef,
  });

  if (!loan) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <span>Jadwal Pembayaran</span>
            <Button variant="outline" size="icon" onClick={handlePrint}>
              <Printer className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div ref={printRef} className="p-4">
          <div className="mb-6">
            <h3 className="text-lg font-semibold">Informasi Pinjaman</h3>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <p className="text-sm text-muted-foreground">ID Pinjaman</p>
                <p>{loan.id.substring(0, 8)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Anggota</p>
                <p>{loan.anggota?.nama || 'Anggota'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Jumlah Pinjaman</p>
                <p>{formatCurrency(Number(loan.jumlah))}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Pembayaran</p>
                <p>{formatCurrency(Number(loan.total_pembayaran))}</p>
              </div>
            </div>
          </div>
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No</TableHead>
                  <TableHead>Tanggal Jatuh Tempo</TableHead>
                  <TableHead>Jumlah Angsuran</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tanggal Pembayaran</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4">
                      Memuat data...
                    </TableCell>
                  </TableRow>
                ) : paymentSchedule.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4">
                      Tidak ada jadwal pembayaran
                    </TableCell>
                  </TableRow>
                ) : (
                  paymentSchedule.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.angsuran_ke}</TableCell>
                      <TableCell>{formatDate(item.tanggal_jatuh_tempo)}</TableCell>
                      <TableCell>{formatCurrency(item.jumlah_angsuran)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            item.status === 'lunas' 
                              ? 'outline' 
                              : item.status === 'terlambat' 
                                ? 'destructive' 
                                : 'secondary'
                          }
                          className={
                            item.status === 'lunas' 
                              ? 'border-green-500 text-green-500' 
                              : ''
                          }
                        >
                          {item.status === 'lunas' 
                            ? 'Lunas' 
                            : item.status === 'terlambat' 
                              ? 'Terlambat' 
                              : 'Belum Bayar'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {item.tanggal_pembayaran 
                          ? formatDate(item.tanggal_pembayaran) 
                          : '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          <div className="mt-6 text-sm text-muted-foreground">
            <p>* Jadwal pembayaran ini dapat berubah sesuai dengan ketentuan yang berlaku.</p>
            <p>* Harap melakukan pembayaran tepat waktu untuk menghindari denda keterlambatan.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
