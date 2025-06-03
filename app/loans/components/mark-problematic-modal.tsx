"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { AlertTriangle, X } from "lucide-react"
import { Pembiayaan } from "@/lib/pembiayaan"
import { toast } from "sonner"

interface MarkProblematicModalProps {
  isOpen: boolean;
  onClose: () => void;
  loan: Pembiayaan | null;
  onMarked: () => void;
}

export function MarkProblematicModal({
  isOpen,
  onClose,
  loan,
  onMarked
}: MarkProblematicModalProps) {
  const [reason, setReason] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form
  const resetForm = () => {
    setReason("");
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loan) return;
    
    // Validate reason
    if (!reason.trim()) {
      toast.error("Alasan harus diisi");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // In a real application, this would update the loan status in the database
      // For demo purposes, we'll simulate a successful update
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Show success message
      toast.success("Pembiayaan berhasil ditandai bermasalah");
      
      // Close modal and refresh data
      resetForm();
      onClose();
      onMarked();
    } catch (error) {
      console.error('Error marking loan as problematic:', error);
      toast.error("Terjadi kesalahan saat menandai pinjaman bermasalah");
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
          <DialogTitle className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-destructive mr-2" />
            <span>Tandai Pembiayaan Bermasalah</span>
          </DialogTitle>
          <DialogDescription>
            Pembiayaan: {loan.id.substring(0, 8)} - {loan.anggota?.nama || 'Anggota'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="py-4">
            <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-4">
              <p className="text-amber-800 text-sm">
                Menandai pembiayaan sebagai bermasalah akan mempengaruhi status kredit anggota. 
                Tindakan ini hanya boleh dilakukan setelah upaya penagihan gagal.
              </p>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="reason" className="font-medium">
                Alasan <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="reason"
                placeholder="Jelaskan alasan pembiayaan ini ditandai bermasalah"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                disabled={isSubmitting}
                className="min-h-[120px]"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={onClose}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button 
              type="submit" 
              variant="destructive"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Memproses..." : "Tandai Bermasalah"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
