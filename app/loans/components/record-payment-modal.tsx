"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { format, parseISO } from "date-fns"
import { id } from "date-fns/locale"
import { X, Save, AlertCircle } from "lucide-react"
import { Pinjaman } from "@/lib/pinjaman"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  loan: Pinjaman | null;
  onPaymentRecorded: () => void;
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

  // Format currency
  const formatCurrency = (amount: number) => {
    return `Rp ${amount.toLocaleString('id-ID')}`;
  };

  // Reset form
  const resetForm = () => {
    setAmount("");
    setPaymentMethod("tunai");
    setReferenceNumber("");
    setNotes("");
    setError(null);
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
      // In a real application, this would be a transaction to:
      // 1. Create a payment record
      // 2. Update the loan's remaining payment
      // 3. Update the loan status if fully paid
      // 4. Create a transaction record
      
      // For demo purposes, we'll simulate a successful payment
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Show success message
      toast.success("Pembayaran berhasil dicatat");
      
      // Close modal and refresh data
      resetForm();
      onClose();
      onPaymentRecorded();
    } catch (error) {
      console.error('Error recording payment:', error);
      setError("Terjadi kesalahan saat mencatat pembayaran");
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
            <div className="grid grid-cols-2 gap-4 mb-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Pinjaman</p>
                <p className="font-medium">{formatCurrency(Number(loan.total_pembayaran))}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Sisa Pembayaran</p>
                <p className="font-medium">{formatCurrency(Number(loan.sisa_pembayaran))}</p>
              </div>
            </div>
            
            {error && (
              <div className="bg-destructive/10 p-3 rounded-md flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
            
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
