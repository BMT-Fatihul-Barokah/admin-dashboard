"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { createPinjaman, PinjamanInput } from "@/lib/pinjaman"
import { toast } from "sonner"
import { format, addMonths } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

// Loan types
const LOAN_TYPES = [
  "Pinjaman Umum",
  "Pinjaman Pendidikan",
  "Pinjaman Usaha",
  "Pinjaman Darurat",
  "Pinjaman Konsumtif"
]

interface Anggota {
  id: string;
  nama: string;
  nomor_rekening: string;
}

interface CreateLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoanCreated: () => void;
  members: Anggota[];
}

export function CreateLoanModal({
  isOpen,
  onClose,
  onLoanCreated,
  members
}: CreateLoanModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<PinjamanInput>({
    anggota_id: "",
    jenis_pinjaman: "",
    jumlah: 0,
    jatuh_tempo: format(addMonths(new Date(), 3), 'yyyy-MM-dd'),
    alasan: ""
  })
  const [date, setDate] = useState<Date | undefined>(addMonths(new Date(), 3))

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        anggota_id: "",
        jenis_pinjaman: "",
        jumlah: 0,
        jatuh_tempo: format(addMonths(new Date(), 3), 'yyyy-MM-dd'),
        alasan: ""
      })
      setDate(addMonths(new Date(), 3))
    }
  }, [isOpen])

  // Update due date when calendar date changes
  useEffect(() => {
    if (date) {
      setFormData(prev => ({
        ...prev,
        jatuh_tempo: format(date, 'yyyy-MM-dd')
      }))
    }
  }, [date])

  const handleChange = (field: keyof PinjamanInput, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async () => {
    // Validate form
    if (!formData.anggota_id) {
      toast.error("Silakan pilih anggota")
      return
    }
    if (!formData.jenis_pinjaman) {
      toast.error("Silakan pilih jenis pinjaman")
      return
    }
    if (!formData.jumlah || formData.jumlah <= 0) {
      toast.error("Jumlah pinjaman harus lebih dari 0")
      return
    }
    if (!formData.jatuh_tempo) {
      toast.error("Silakan pilih tanggal jatuh tempo")
      return
    }

    setIsSubmitting(true)
    try {
      const result = await createPinjaman(formData)
      
      if (result.success) {
        toast.success("Pengajuan pinjaman berhasil dibuat")
        onLoanCreated()
        onClose()
      } else {
        toast.error(`Gagal membuat pengajuan pinjaman: ${result.error?.message || "Terjadi kesalahan"}`)
      }
    } catch (error: any) {
      toast.error(`Error: ${error.message || "Terjadi kesalahan"}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Tambah Pengajuan Pinjaman</DialogTitle>
          <DialogDescription>
            Isi formulir berikut untuk mengajukan pinjaman baru.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="member" className="text-right">
              Anggota
            </Label>
            <Select 
              value={formData.anggota_id} 
              onValueChange={(value) => handleChange('anggota_id', value)}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Pilih anggota" />
              </SelectTrigger>
              <SelectContent>
                {members.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.nama} ({member.nomor_rekening})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="loanType" className="text-right">
              Jenis Pinjaman
            </Label>
            <Select 
              value={formData.jenis_pinjaman} 
              onValueChange={(value) => handleChange('jenis_pinjaman', value)}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Pilih jenis pinjaman" />
              </SelectTrigger>
              <SelectContent>
                {LOAN_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right">
              Jumlah
            </Label>
            <Input
              id="amount"
              type="number"
              min="0"
              className="col-span-3"
              value={formData.jumlah || ''}
              onChange={(e) => handleChange('jumlah', Number(e.target.value))}
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="dueDate" className="text-right">
              Jatuh Tempo
            </Label>
            <div className="col-span-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pilih tanggal</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="reason" className="text-right">
              Alasan
            </Label>
            <Textarea
              id="reason"
              className="col-span-3"
              placeholder="Alasan pengajuan pinjaman (opsional)"
              value={formData.alasan || ''}
              onChange={(e) => handleChange('alasan', e.target.value)}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Ajukan Pinjaman
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
