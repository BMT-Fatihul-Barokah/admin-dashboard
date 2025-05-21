"use client"

import { useState, useEffect } from "react"
import { getAllJenisTabungan, JenisTabungan } from "@/lib/supabase"
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
  kategori: z.string({
    required_error: "Pilih kategori",
  }),
  jumlah: z.coerce.number({
    required_error: "Masukkan jumlah",
    invalid_type_error: "Jumlah harus berupa angka",
  }).positive("Jumlah harus lebih dari 0"),
  deskripsi: z.string().optional(),
  pinjaman_id: z.string().optional(),
  jenis_tabungan_id: z.string().optional(),
})

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
  const [pinjamanList, setPinjamanList] = useState<any[]>([])
  const [jenisTabunganList, setJenisTabunganList] = useState<JenisTabungan[]>([])
  const [userTabunganList, setUserTabunganList] = useState<{id: string, jenis_tabungan_id: string, jenis_tabungan_nama: string, saldo: number}[]>([])
  const [isLoadingAnggota, setIsLoadingAnggota] = useState(false)
  const [isLoadingPinjaman, setIsLoadingPinjaman] = useState(false)
  const [isLoadingJenisTabungan, setIsLoadingJenisTabungan] = useState(false)
  
  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tipe_transaksi: "",
      kategori: "",
      jumlah: undefined,
      deskripsi: "",
      jenis_tabungan_id: "",
      pinjaman_id: "",
    },
  })
  
  // Watch for changes to form values
  const tipeTransaksi = form.watch("tipe_transaksi")
  const selectedAnggotaId = form.watch("anggota_id")
  
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
  
  // Fetch pinjaman list when anggota is selected
  useEffect(() => {
    const fetchPinjaman = async () => {
      if (!selectedAnggotaId) return
      
      setIsLoadingPinjaman(true)
      try {
        const response = await fetch(`/api/pinjaman?anggota_id=${selectedAnggotaId}&status=aktif`)
        if (!response.ok) {
          throw new Error('Failed to fetch pinjaman')
        }
        const data = await response.json()
        setPinjamanList(data)
      } catch (error) {
        console.error('Error fetching pinjaman:', error)
        toast.error('Gagal memuat data pinjaman')
      } finally {
        setIsLoadingPinjaman(false)
      }
    }
    
    const fetchUserTabungan = async () => {
      if (!selectedAnggotaId) return
      
      try {
        console.log('Fetching tabungan for anggota:', selectedAnggotaId)
        const response = await fetch(`/api/tabungan?anggota_id=${selectedAnggotaId}`)
        if (!response.ok) {
          throw new Error('Failed to fetch user tabungan')
        }
        const data = await response.json()
        console.log('Received tabungan data:', data)
        setUserTabunganList(data)
      } catch (error) {
        console.error('Error fetching user tabungan:', error)
        toast.error('Gagal memuat data tabungan anggota')
      }
    }
    
    if (selectedAnggotaId) {
      if (tipeTransaksi === "masuk" && form.getValues("kategori") === "pembayaran_pinjaman") {
        fetchPinjaman()
      }
      
      // Fetch user's tabungan whenever anggota is selected
      fetchUserTabungan()
    }
  }, [selectedAnggotaId, tipeTransaksi, form])
  
  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true)
    try {
      // Send data to API
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Tambah Transaksi Baru</DialogTitle>
          <DialogDescription>
            Isi form berikut untuk membuat transaksi baru.
          </DialogDescription>
        </DialogHeader>
        
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
            
            {/* Kategori Field */}
            <FormField
              control={form.control}
              name="kategori"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kategori</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih kategori" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {tipeTransaksi === "masuk" ? (
                        <>
                          <SelectItem value="setoran">Setoran</SelectItem>
                          <SelectItem value="pembayaran_pinjaman">Angsuran Pinjaman</SelectItem>
                          <SelectItem value="bunga">Bunga</SelectItem>
                          <SelectItem value="pencairan_pinjaman">Pencairan Pinjaman</SelectItem>
                          <SelectItem value="biaya_admin">Biaya Admin</SelectItem>
                          <SelectItem value="lainnya">Lainnya</SelectItem>
                        </>
                      ) : tipeTransaksi === "keluar" ? (
                        <>
                          <SelectItem value="penarikan">Penarikan</SelectItem>
                          <SelectItem value="pencairan_pinjaman">Pencairan Pinjaman</SelectItem>
                          <SelectItem value="biaya_admin">Biaya Admin</SelectItem>
                          <SelectItem value="pembayaran_pinjaman">Pembayaran Pinjaman</SelectItem>
                          <SelectItem value="lainnya">Lainnya</SelectItem>
                        </>
                      ) : null}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Pinjaman Field - Only show for pembayaran_pinjaman */}
            {form.watch("kategori") === "pembayaran_pinjaman" && (
              <FormField
                control={form.control}
                name="pinjaman_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pinjaman</FormLabel>
                    <Select 
                      disabled={isLoadingPinjaman} 
                      onValueChange={field.onChange} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih pinjaman" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {pinjamanList.map((pinjaman) => (
                          <SelectItem key={pinjaman.id} value={pinjaman.id}>
                            {pinjaman.jenis_pinjaman} - Rp {pinjaman.sisa_pembayaran.toLocaleString('id-ID')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            {/* Jenis Tabungan Field - Show for relevant categories */}
            {(form.watch("kategori") === "setoran" || 
              form.watch("kategori") === "penarikan") && (
              <FormField
                control={form.control}
                name="jenis_tabungan_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jenis Tabungan</FormLabel>
                    <Select 
                      disabled={isLoadingJenisTabungan || userTabunganList.length === 0} 
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
            )}
            
            {/* Jumlah Field */}
            <FormField
              control={form.control}
              name="jumlah"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jumlah</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="Masukkan jumlah" 
                      value={field.value || ""} 
                      onChange={(e) => {
                        const value = e.target.value === "" ? undefined : Number(e.target.value);
                        field.onChange(value);
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
            
            {/* Deskripsi Field */}
            <FormField
              control={form.control}
              name="deskripsi"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deskripsi (Opsional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Masukkan deskripsi transaksi" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
