"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { format, parseISO, addMonths } from "date-fns"
import { id } from "date-fns/locale"
import { X, Save, AlertCircle, CalendarIcon, Loader2 } from "lucide-react"
import { Pembiayaan } from "@/lib/pembiayaan"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { calculateMonthlyInstallment, recordPembayaranPembiayaan, generatePaymentSchedule, getPembayaranByPembiayaanId, PembayaranPembiayaan } from "@/lib/pembayaran-pinjaman"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  loan: Pembiayaan | null;
  onPaymentRecorded: () => void;
}

type PaymentScheduleItem = {
  bulan_ke: number;
  tanggal_jatuh_tempo: Date;
  jumlah: number;
  status: string;
}

export function RecordPaymentModal({
  isOpen,
  onClose,
  loan,
  onPaymentRecorded
}: RecordPaymentModalProps) {
  const [amount, setAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("tunai");
  const [referenceNumber, setReferenceNumber] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentSchedule, setPaymentSchedule] = useState<PaymentScheduleItem[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<number>(1);
  const [monthlyInstallment, setMonthlyInstallment] = useState<number>(0);
  const [previousPayments, setPreviousPayments] = useState<any[]>([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);

  // Format currency
  const formatCurrency = (amount: number) => {
    return `Rp ${amount.toLocaleString('id-ID')}`;
  };

  // Load payment schedule and previous payments when loan changes
  useEffect(() => {
    if (loan) {
      // Calculate monthly installment
      const installment = calculateMonthlyInstallment(
        Number(loan.jumlah), 
        loan.jangka_waktu || 12
      );
      setMonthlyInstallment(installment);
      setAmount(installment.toString());
      
      // Generate payment schedule
      const startDate = new Date(loan.created_at);
      const schedule = generatePaymentSchedule(
        Number(loan.jumlah),
        loan.jangka_waktu || 12,
        startDate
      );
      setPaymentSchedule(schedule);
      
      // Find the next unpaid month
      loadPreviousPayments(loan.id);
    }
  }, [loan]);
  
  // Load previous payments
  const loadPreviousPayments = async (loanId: string) => {
    setIsLoadingPayments(true);
    try {
      const payments = await getPembayaranByPembiayaanId(loanId);
      setPreviousPayments(payments);
      
      // Find the next unpaid month
      const paidMonths = payments.map(p => p.bulan_ke);
      for (let i = 1; i <= (loan?.jangka_waktu || 12); i++) {
        if (!paidMonths.includes(i)) {
          setSelectedMonth(i);
          break;
        }
      }
    } catch (error) {
      console.error('Error loading payments:', error);
    } finally {
      setIsLoadingPayments(false);
    }
  };
  
  // Handle month selection
  const handleMonthSelection = (month: number) => {
    setSelectedMonth(month);
    // Set amount to the monthly installment for the selected month
    const monthItem = paymentSchedule.find(item => item.bulan_ke === month);
    if (monthItem) {
      setAmount(monthItem.jumlah.toString());
    } else {
      setAmount(monthlyInstallment.toString());
    }
  };
  
  // Reset form
  const resetForm = () => {
    setAmount("");
    setPaymentMethod("tunai");
    setReferenceNumber("");
    setNotes("");
    setError(null);
    setSelectedMonth(1);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loan) return;
    
    // Validate amount
    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      setError("Jumlah pembayaran harus lebih dari 0");
      return;
    }
    
    // Validate against remaining payment
    if (paymentAmount > Number(loan.sisa_pembayaran)) {
      setError(`Jumlah pembayaran tidak boleh melebihi sisa pembayaran (${formatCurrency(Number(loan.sisa_pembayaran))})`); 
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Record the payment using the simplified RPC function
      const result = await recordPembayaranPembiayaan(
        {
          pembiayaan_id: loan.id,
          jumlah: paymentAmount,
          bulan_ke: selectedMonth,
          metode_pembayaran: paymentMethod,
          nomor_referensi: referenceNumber || undefined,
          catatan: notes || `Pembayaran angsuran bulan ke-${selectedMonth} via ${paymentMethod}${referenceNumber ? ` (${referenceNumber})` : ''}`
        },
        loan.anggota_id
      );
      
      if (result.success) {
        console.log('Payment recorded successfully:', result.data);
        
        // Show success message with updated loan information
        const sisaPembayaran = result.data?.sisa_pembayaran || 0;
        const sisaBulan = result.data?.sisa_bulan || 0;
        const status = result.data?.status || 'aktif';
        
        toast.success(
          `Pembayaran berhasil dicatat. Sisa pembayaran: ${formatCurrency(sisaPembayaran)}. ` +
          `Sisa angsuran: ${sisaBulan} bulan. ` +
          `Status: ${status === 'lunas' ? 'Lunas' : 'Aktif'}`
        );
        
        // Close modal
        resetForm();
        onClose();
        
        // Force complete page refresh to ensure data is updated
        window.location.reload();
      } else {
        setError(result.error?.message || "Gagal mencatat pembayaran");
      }
    } catch (error: any) {
      console.error('Error recording payment:', error);
      setError("Terjadi kesalahan saat mencatat pembayaran: " + (error?.message || "Unknown error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!loan) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        resetForm();
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Catat Pembayaran</DialogTitle>
          <DialogDescription>
            Pinjaman: {loan.id.substring(0, 8)} - {loan.anggota?.nama || 'Anggota'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <Card className="mb-4">
              <CardHeader className="pb-2">
                <CardTitle>Informasi Pinjaman</CardTitle>
                <CardDescription>
                  Durasi: {loan.jangka_waktu || 12} bulan | Jatuh Tempo: {format(new Date(loan.jatuh_tempo), 'dd MMM yyyy')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-2">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Pinjaman</p>
                    <p className="font-medium">{formatCurrency(Number(loan.jumlah))}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Sisa Pembayaran</p>
                    <p className="font-medium">{formatCurrency(Number(loan.sisa_pembayaran))}</p>
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-sm font-medium text-muted-foreground mb-1">Progress Pembayaran</p>
                  {loan && (
                    <>
                      <Progress 
                        value={loan.total_pembayaran > 0 ? ((loan.total_pembayaran - loan.sisa_pembayaran) / loan.total_pembayaran) * 100 : 0} 
                        className="h-2" 
                      />
                      <p className="text-xs text-muted-foreground mt-1 text-right">
                        {loan.total_pembayaran > 0 ? 
                          Math.round(((loan.total_pembayaran - loan.sisa_pembayaran) / loan.total_pembayaran) * 100) : 0}%
                      </p>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {error && (
              <div className="bg-destructive/10 p-3 rounded-md flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
            
            <div className="grid gap-2">
              <Label htmlFor="installment-month">Angsuran Bulan Ke-</Label>
              <Select 
                value={selectedMonth.toString()} 
                onValueChange={(value) => handleMonthSelection(Number(value))}
                disabled={isSubmitting || isLoadingPayments}
              >
                <SelectTrigger id="installment-month">
                  <SelectValue placeholder="Pilih bulan angsuran" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({length: loan.jangka_waktu || 12}, (_, i) => i + 1).map((month) => {
                    const isPaid = previousPayments.some(p => p.bulan_ke === month);
                    return (
                      <SelectItem 
                        key={month} 
                        value={month.toString()}
                        disabled={isPaid}
                      >
                        Bulan {month} {isPaid ? '(Sudah Dibayar)' : ''}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="amount">Jumlah Pembayaran</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground">Angsuran per bulan: {formatCurrency(monthlyInstallment)}</p>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="payment-method">Metode Pembayaran</Label>
              <Select 
                value={paymentMethod} 
                onValueChange={setPaymentMethod}
                disabled={isSubmitting}
              >
                <SelectTrigger id="payment-method">
                  <SelectValue placeholder="Pilih metode pembayaran" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tunai">Tunai</SelectItem>
                  <SelectItem value="transfer">Transfer Bank</SelectItem>
                  <SelectItem value="qris">QRIS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {paymentMethod !== 'tunai' && (
              <div className="grid gap-2">
                <Label htmlFor="reference">Nomor Referensi</Label>
                <Input
                  id="reference"
                  placeholder="Nomor referensi pembayaran"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            )}
            
            <div className="grid gap-2">
              <Label htmlFor="notes">Catatan</Label>
              <Textarea
                id="notes"
                placeholder="Catatan tambahan (opsional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? (
                <>Memproses...</>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Simpan Pembayaran
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
