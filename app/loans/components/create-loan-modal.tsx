"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { createPembiayaan, PembiayaanInput } from "@/lib/pembiayaan"
import { toast } from "sonner"
import { format, addMonths } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

// Loan types
const LOAN_TYPES = [
  "Pembiayaan Umum",
  "Pembiayaan Pendidikan",
  "Pembiayaan Usaha",
  "Pembiayaan Darurat",
  "Pembiayaan Konsumtif"
]

// Loan durations in months
const LOAN_DURATIONS = [
  { label: "3 Bulan", value: 3 },
  { label: "4 Bulan", value: 4 },
  { label: "6 Bulan", value: 6 },
  { label: "8 Bulan", value: 8 },
  { label: "12 Bulan (1 Tahun)", value: 12 },
  { label: "24 Bulan (2 Tahun)", value: 24 },
]

// Loan categories
const LOAN_CATEGORIES = [
  "Produktif",
  "Konsumtif",
  "Pendidikan",
  "Kesehatan",
  "Lainnya"
]

interface Anggota {
  id: string;
  nama: string;
  nomor_rekening: string;
}

interface CreateLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  members: Anggota[];
}

export function CreateLoanModal({
  isOpen,
  onClose,
  onSuccess,
  members
}: CreateLoanModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<PembiayaanInput>({
    anggota_id: "",
    jenis_pembiayaan: "",
    kategori: "",
    jumlah: 0,
    jatuh_tempo: format(addMonths(new Date(), 3), 'yyyy-MM-dd'),
    durasi_bulan: 3,
    deskripsi: ""
  })
  const [date, setDate] = useState<Date | undefined>(addMonths(new Date(), 3))
  const [loanDuration, setLoanDuration] = useState<number>(3)

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        anggota_id: "",
        jenis_pembiayaan: "",
        kategori: "",
        jumlah: 0,
        jatuh_tempo: format(addMonths(new Date(), 3), 'yyyy-MM-dd'),
        durasi_bulan: 3,
        deskripsi: ""
      })
      setDate(addMonths(new Date(), 3))
      setLoanDuration(3)
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

  // Update due date when loan duration changes
  const handleDurationChange = (durationInMonths: number) => {
    setLoanDuration(durationInMonths)
    const newDueDate = addMonths(new Date(), durationInMonths)
    setDate(newDueDate)
    setFormData(prev => ({
      ...prev,
      jatuh_tempo: format(newDueDate, 'yyyy-MM-dd'),
      durasi_bulan: durationInMonths
    }))
  }

  const handleChange = (field: keyof PembiayaanInput, value: string | number) => {
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
    if (!formData.jenis_pembiayaan) {
      toast.error("Silakan pilih jenis pembiayaan")
      return
    }
    if (!formData.kategori) {
      toast.error("Silakan pilih kategori pembiayaan")
      return
    }
    if (!formData.jumlah || formData.jumlah <= 0) {
      toast.error("Jumlah pembiayaan harus lebih dari 0")
      return
    }
    if (!formData.jatuh_tempo) {
      toast.error("Silakan pilih tanggal jatuh tempo")
      return
    }

    setIsSubmitting(true)
    try {
      // Ensure jumlah is a number and all required fields are present
      const cleanedData = {
        ...formData,
        jumlah: Number(formData.jumlah),
        durasi_bulan: loanDuration
      }
      
      // Create the loan
      const result = await createPembiayaan(cleanedData)
      
      if (result.success) {
        toast.success("Pembiayaan baru berhasil dibuat")
        onSuccess()
        onClose()
      } else {
        toast.error(result.error?.message || "Gagal membuat pembiayaan")
      }
    } catch (error: any) {
      toast.error("Terjadi kesalahan: " + (error?.message || "Unknown error"))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Tambah Pembiayaan Baru</DialogTitle>
          <DialogDescription>
            Isi formulir berikut untuk membuat pembiayaan baru.
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
              Jenis Pembiayaan
            </Label>
            <Select 
              value={formData.jenis_pembiayaan} 
              onValueChange={(value) => handleChange('jenis_pembiayaan', value)}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Pilih jenis pembiayaan" />
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
            <Label htmlFor="category" className="text-right">
              Kategori
            </Label>
            <Select 
              value={formData.kategori} 
              onValueChange={(value) => handleChange('kategori', value)}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Pilih kategori pembiayaan" />
              </SelectTrigger>
              <SelectContent>
                {LOAN_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
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
            <Label htmlFor="loanDuration" className="text-right">
              Durasi Pembiayaan
            </Label>
            <Select 
              value={loanDuration.toString()} 
              onValueChange={(value) => handleDurationChange(Number(value))}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Pilih durasi pembiayaan" />
              </SelectTrigger>
              <SelectContent>
                {LOAN_DURATIONS.map((duration) => (
                  <SelectItem key={duration.value} value={duration.value.toString()}>
                    {duration.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              Deskripsi
            </Label>
            <Textarea
              id="reason"
              className="col-span-3"
              placeholder="Deskripsi pengajuan pembiayaan (opsional)"
              value={formData.deskripsi || ''}
              onChange={(e) => handleChange('deskripsi', e.target.value)}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button 
            type="button"
            onClick={() => handleSubmit()} 
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Buat Pembiayaan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
