"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format, parseISO, addMonths } from "date-fns"
import { id } from "date-fns/locale"
import { X, Download, Printer } from "lucide-react"
import { Pembiayaan } from "@/lib/pembiayaan"
import { useRef } from "react"
import { useReactToPrint } from "react-to-print"
import { supabase } from "@/lib/supabase"
import { useState, useEffect } from "react"

interface PaymentScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  loan: Pembiayaan | null;
}

// Define payment schedule item type
interface PaymentScheduleItem {
  id: string;
  pembiayaan_id: string;
  angsuran_ke: number;
  tanggal_jatuh_tempo: string;
  jumlah_angsuran: number;
  status: string;
  tanggal_pembayaran?: string;
  payment_id?: string;
}

export function PaymentScheduleModal({
  isOpen,
  onClose,
  loan
}: PaymentScheduleModalProps) {
  const [paymentSchedule, setPaymentSchedule] = useState<PaymentScheduleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  // Format date for display
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'dd MMMM yyyy');
    } catch (error) {
      console.error('Error formatting date:', dateString, error);
      return '-';
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return `Rp ${amount.toLocaleString('id-ID')}`;
  };

  // Generate payment schedule based on loan data
  const generatePaymentSchedule = (loan: Pembiayaan) => {
    if (!loan) return [];
    
    // Use the loan's jangka_waktu for number of installments
    const numberOfInstallments = loan.jangka_waktu || 12;
    
    // Calculate installment amount based on the loan amount, not total_pembayaran
    // (which might be 0 for new loans)
    const installmentAmount = Number(loan.jumlah) / numberOfInstallments;
    
    // Generate schedule
    const schedule: PaymentScheduleItem[] = [];
    const startDate = new Date(loan.created_at);
    
    // Get the day of the month for due dates (use tanggal_jatuh_tempo_bulanan if available)
    const dueDateDay = loan.tanggal_jatuh_tempo_bulanan || startDate.getDate();
    
    for (let i = 1; i <= numberOfInstallments; i++) {
      // Calculate due date by adding months to start date
      let dueDate = addMonths(startDate, i);
      
      // Set the day of month to match the preferred payment day
      dueDate.setDate(dueDateDay);
      
      // Determine status based on current date and actual payments
      // Default to 'belum_bayar' for all installments
      let status = 'belum_bayar';
      if (new Date() > dueDate) {
        status = 'terlambat';
      }
      
      // In a real implementation, we would check if this installment has been paid
      // by looking at payment records in the database
      
      schedule.push({
        id: `${loan.id}-${i}`,
        pembiayaan_id: loan.id,
        angsuran_ke: i,
        tanggal_jatuh_tempo: dueDate.toISOString(),
        jumlah_angsuran: installmentAmount,
        status: status,
        tanggal_pembayaran: undefined // No payments for new loans
      });
    }
    
    return schedule;
  };

  // Fetch payment schedule from database using the get_payment_schedule function
  useEffect(() => {
    const fetchPaymentSchedule = async () => {
      if (!loan) return;
      
      setIsLoading(true);
      
      try {
        // First try to use the RPC function
        try {
          const { data, error } = await supabase.rpc('get_payment_schedule', {
            p_pembiayaan_id: loan.id
          });
          
          if (error) {
            throw new Error(`RPC error: ${JSON.stringify(error)}`);
          }
          
          console.log('Payment schedule raw data:', data);
          
          if (data && data.success && data.schedule) {
            // Convert the schedule from the database to our PaymentScheduleItem format
            const scheduleItems: PaymentScheduleItem[] = data.schedule.map((item: any) => ({
              id: item.id,
              pembiayaan_id: item.pembiayaan_id,
              angsuran_ke: item.angsuran_ke,
              tanggal_jatuh_tempo: item.tanggal_jatuh_tempo,
              jumlah_angsuran: item.jumlah_angsuran,
              status: item.status,
              tanggal_pembayaran: item.tanggal_pembayaran,
              payment_id: item.payment_id
            }));
            
            console.log('Processed schedule items:', scheduleItems);
            setPaymentSchedule(scheduleItems);
            return; // Exit early if successful
          } else {
            throw new Error(`Invalid response format from RPC function: ${JSON.stringify(data)}`);
          }
        } catch (rpcError) {
          console.warn('RPC function failed, falling back to client-side generation:', rpcError);
          // Continue to fallback
        }
        
        // Fallback: Generate schedule client-side
        const generatedSchedule = generatePaymentSchedule(loan);
        setPaymentSchedule(generatedSchedule);
        
      } catch (error) {
        console.error('Error in payment schedule handling:', error);
        // Final fallback
        const generatedSchedule = generatePaymentSchedule(loan);
        setPaymentSchedule(generatedSchedule);
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
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <span>Jadwal Pembayaran</span>
            <Button variant="outline" size="icon" onClick={handlePrint} className="mr-10">
              <Printer className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div ref={printRef} className="p-4">
          <div className="mb-6">
            <h3 className="text-lg font-semibold">Informasi Pembiayaan</h3>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <p className="text-sm text-muted-foreground">ID Pembiayaan</p>
                <p>{loan.id.substring(0, 8)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Anggota</p>
                <p>{loan.anggota?.nama || 'Anggota'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Jumlah Pembiayaan</p>
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
