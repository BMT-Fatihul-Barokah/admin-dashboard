"use client"

import { useState, useEffect } from "react"
import { getAllJenisTabungan, JenisTabungan, supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { RupiahInput } from "@/components/ui/rupiah-input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

// Define the form schema with Zod
const formSchema = z.object({
  anggota_id: z.string({
    required_error: "Pilih anggota",
  }),
  tipe_transaksi: z.string({
    required_error: "Pilih tipe transaksi",
  }),
  jumlah: z.coerce.number({
    required_error: "Masukkan jumlah",
    invalid_type_error: "Jumlah harus berupa angka",
  }).positive("Jumlah harus lebih dari 0"),
  source_type: z.string().default("tabungan"),
  jenis_tabungan_id: z.string().optional(),
})

// Use the base form schema for all cases
const createFormSchema = () => {
  return formSchema;
}

// Define props for the component
interface TransactionFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

// Define anggota type
interface Anggota {
  id: string
  nama: string
  nomor_rekening: string
}

// Using JenisTabungan type from supabase.ts

export function TransactionFormModal({ isOpen, onClose, onSuccess }: TransactionFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [anggotaList, setAnggotaList] = useState<Anggota[]>([])
  const [jenisTabunganList, setJenisTabunganList] = useState<JenisTabungan[]>([])
  const [userTabunganList, setUserTabunganList] = useState<{id: string, jenis_tabungan_id: string, jenis_tabungan_nama: string, saldo: number}[]>([])
  const [isLoadingAnggota, setIsLoadingAnggota] = useState(false)
  const [isLoadingJenisTabungan, setIsLoadingJenisTabungan] = useState(false)
  
  // Initialize form with base schema first
  const form = useForm<z.infer<typeof formSchema>>({    
    resolver: zodResolver(formSchema),
    defaultValues: {
      tipe_transaksi: "",
      jumlah: undefined,
      source_type: "tabungan",
      jenis_tabungan_id: "",
    },
  })
  
  // Watch for changes to form values
  const tipeTransaksi = form.watch("tipe_transaksi")
  const selectedAnggotaId = form.watch("anggota_id")
  const selectedJenisTabunganId = form.watch("jenis_tabungan_id")
  
  // Track selected savings type name for display purposes
  const [selectedJenisTabunganNama, setSelectedJenisTabunganNama] = useState<string>('')
  
  // Update selected savings type name when it changes
  useEffect(() => {
    if (selectedJenisTabunganId && jenisTabunganList.length > 0) {
      const selectedJenisTabungan = jenisTabunganList.find(jt => jt.id === selectedJenisTabunganId);
      
      if (selectedJenisTabungan) {
        setSelectedJenisTabunganNama(selectedJenisTabungan.nama);
      }
    } else {
      setSelectedJenisTabunganNama('');
    }
  }, [selectedJenisTabunganId, jenisTabunganList])
  
  // Reset form when modal is opened/closed
  useEffect(() => {
    if (isOpen) {
      form.reset()
    }
  }, [isOpen, form])
  
  // Fetch anggota list on component mount
  useEffect(() => {
    const fetchAnggota = async () => {
      setIsLoadingAnggota(true)
      try {
        const response = await fetch('/api/anggota')
        if (!response.ok) {
          throw new Error('Failed to fetch anggota')
        }
        const data = await response.json()
        setAnggotaList(data)
      } catch (error) {
        console.error('Error fetching anggota:', error)
        toast.error('Gagal memuat data anggota')
      } finally {
        setIsLoadingAnggota(false)
      }
    }
    
    const fetchJenisTabungan = async () => {
      setIsLoadingJenisTabungan(true)
      try {
        // Use the helper function directly instead of the API
        const data = await getAllJenisTabungan()
        console.log('Fetched jenis tabungan:', data)
        setJenisTabunganList(data)
      } catch (error) {
        console.error('Error fetching jenis tabungan:', error)
        toast.error('Gagal memuat data jenis tabungan')
      } finally {
        setIsLoadingJenisTabungan(false)
      }
    }
    
    if (isOpen) {
      fetchAnggota()
      fetchJenisTabungan()
    }
  }, [isOpen])
  
  // Fetch user's tabungan when anggota is selected
  useEffect(() => {
    const fetchUserTabungan = async () => {
      if (!selectedAnggotaId) return
      
      try {
        console.log('Fetching tabungan for anggota:', selectedAnggotaId)
        
        // Try using RPC function first
        const { data: rpcData, error: rpcError } = await supabase
          .rpc('get_anggota_tabungan', { p_anggota_id: selectedAnggotaId })
        
        if (!rpcError && rpcData) {
          console.log('Received tabungan data from RPC:', rpcData)
          setUserTabunganList(rpcData)
          return
        }
        
        // Fallback to API endpoint
        const response = await fetch(`/api/tabungan?anggota_id=${selectedAnggotaId}`)
        if (!response.ok) {
          throw new Error('Failed to fetch user tabungan')
        }
        const data = await response.json()
        console.log('Received tabungan data from API:', data)
        setUserTabunganList(data)
      } catch (error) {
        console.error('Error fetching user tabungan:', error)
        toast.error('Gagal memuat data tabungan anggota')
        // Set empty array to prevent undefined errors
        setUserTabunganList([])
      }
    }
    
    if (selectedAnggotaId) {
      // Fetch user's tabungan whenever anggota is selected
      fetchUserTabungan()
    }
  }, [selectedAnggotaId])
  
  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true)
    try {
      // Always set source_type to "tabungan" since we only handle savings transactions now
      const source_type = "tabungan";
      
      // Auto-generate description based on transaction type and savings type
      let autoDescription = "";
      const selectedJenisTabungan = jenisTabunganList.find(jt => jt.id === values.jenis_tabungan_id);
      const jenisTabunganNama = selectedJenisTabungan?.nama || "";
      
      if (values.tipe_transaksi === "masuk") {
        autoDescription = `Masuk tabungan - ${jenisTabunganNama}`;
      } else if (values.tipe_transaksi === "keluar") {
        autoDescription = `Keluar tabungan - ${jenisTabunganNama}`;
      }
      
      // Send data to API
      const formData = {
        ...values,
        source_type,
        deskripsi: autoDescription,
        pembiayaan_id: null,
        pinjaman_id: null
      };
      
      console.log('Creating new transaction with data:', formData);
      
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create transaction')
      }
      
      // Show success message
      toast.success('Transaksi berhasil dibuat')
      
      // Close modal and refresh data
      onClose()
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error('Error creating transaction:', error)
      toast.error(`Gagal membuat transaksi: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] p-0 max-h-[85vh] flex flex-col">
        <div className="p-6 pb-4">
          <DialogHeader>
            <DialogTitle>Tambah Transaksi Baru</DialogTitle>
            <DialogDescription>
              Isi form berikut untuk membuat transaksi baru.
            </DialogDescription>
          </DialogHeader>
        </div>
        
        <div className="flex flex-col flex-1 h-full">
          <div className="overflow-y-auto px-6 flex-1" style={{ maxHeight: 'calc(85vh - 180px)' }}>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Anggota Field */}
            <FormField
              control={form.control}
              name="anggota_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Anggota</FormLabel>
                  <Select 
                    disabled={isLoadingAnggota} 
                    onValueChange={field.onChange} 
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih anggota" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {anggotaList.map((anggota) => (
                        <SelectItem key={anggota.id} value={anggota.id}>
                          {anggota.nama} - {anggota.nomor_rekening}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Tipe Transaksi Field */}
            <FormField
              control={form.control}
              name="tipe_transaksi"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipe Transaksi</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih tipe transaksi" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="masuk">Masuk</SelectItem>
                      <SelectItem value="keluar">Keluar</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            

            

            
            {/* Jenis Tabungan Field */}
            <FormField
              control={form.control}
              name="jenis_tabungan_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jenis Tabungan</FormLabel>
                  <Select 
                    disabled={isLoadingJenisTabungan} 
                    onValueChange={field.onChange} 
                    value={field.value || ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih jenis tabungan" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {userTabunganList.length > 0 ? (
                        userTabunganList.map((tabungan) => {
                          const jenisTabungan = jenisTabunganList.find(jt => jt.id === tabungan.jenis_tabungan_id);
                          return (
                            <SelectItem key={tabungan.id} value={tabungan.jenis_tabungan_id}>
                              <div className="flex flex-col">
                                <span className="font-medium">{tabungan.jenis_tabungan_nama}</span>
                                <span className="text-xs text-muted-foreground">
                                  Saldo: Rp {Number(tabungan.saldo).toLocaleString('id-ID')}
                                </span>
                              </div>
                            </SelectItem>
                          );
                        })
                      ) : (
                        <div className="p-2 text-sm text-muted-foreground text-center">
                          Anggota belum memiliki tabungan
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {form.watch("jenis_tabungan_id") && jenisTabunganList.find(jt => jt.id === form.watch("jenis_tabungan_id"))?.deskripsi}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Jumlah Field */}
            <FormField
              control={form.control}
              name="jumlah"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jumlah</FormLabel>
                  <FormControl>
                    <RupiahInput 
                      placeholder="Masukkan jumlah" 
                      value={field.value} 
                      onChange={(value) => {
                        field.onChange(value);
                        if (value) {
                          form.clearErrors("jumlah");
                        }
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Masukkan jumlah transaksi dalam Rupiah
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Description is now auto-generated */}
            
              </form>
            </Form>
          </div>
          
          <div className="p-4 border-t bg-background shadow-sm w-full mt-auto">
            <div className="flex justify-end gap-3 px-2">
              <Button type="button" variant="outline" onClick={onClose} className="min-w-[100px]">
                Batal
              </Button>
              <Button 
                type="button" 
                disabled={isSubmitting} 
                className="min-w-[100px]"
                onClick={form.handleSubmit(onSubmit)}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Tambah
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
