"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Download, MoreHorizontal, Plus, Search, SlidersHorizontal, RefreshCcw, Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format, parseISO, differenceInMonths } from "date-fns"
import { id } from "date-fns/locale"
import { createClient } from "@/utils/supabase/client"
import { downloadCSV, formatDataForExport } from "@/utils/export-data"
import { toast } from "sonner"

// Define pinjaman type
interface Pinjaman {
  id: string;
  anggota_id: string;
  anggota?: {
    nama: string;
  };
  jumlah: number;
  sisa_pembayaran: number;
  bunga_persen: number;
  status: string;
  jatuh_tempo?: string;
  created_at: string;
  updated_at: string;
}

export default function LoansPage() {
  const [pinjaman, setPinjaman] = useState<Pinjaman[]>([])
  const [filteredPinjaman, setFilteredPinjaman] = useState<Pinjaman[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  
  const supabase = createClient()
  
  // Format date function
  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, 'dd MMM yyyy', { locale: id });
    } catch (error) {
      return dateString;
    }
  };
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return `Rp ${amount.toLocaleString('id-ID')}`;
  };
  
  // Calculate tenor in months
  const calculateTenor = (jatuhTempo: string, createdAt: string) => {
    try {
      const endDate = parseISO(jatuhTempo);
      const startDate = parseISO(createdAt);
      const months = differenceInMonths(endDate, startDate);
      return `${months} bulan`;
    } catch (error) {
      return '-';
    }
  };
  
  // Map status to badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'aktif':
        return {
          variant: 'default',
          className: 'bg-green-500 hover:bg-green-600'
        };
      case 'menunggu':
        return {
          variant: 'outline',
          className: ''
        };
      case 'lunas':
        return {
          variant: 'secondary',
          className: 'bg-blue-500 hover:bg-blue-600'
        };
      case 'terlambat':
        return {
          variant: 'destructive',
          className: ''
        };
      default:
        return {
          variant: 'default',
          className: ''
        };
    }
  };
  
  // Fetch pinjaman from Supabase
  const fetchPinjaman = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('pinjaman')
        .select(`
          *,
          anggota:anggota_id (nama)
        `)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      setPinjaman(data || [])
      setFilteredPinjaman(data || [])
    } catch (error) {
      console.error('Error fetching pinjaman:', error)
      toast.error('Gagal memuat data pinjaman')
    } finally {
      setIsLoading(false)
    }
  }
  
  // Handle search and filters
  useEffect(() => {
    if (!pinjaman.length) return
    
    let filtered = [...pinjaman]
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(loan => 
        loan.id.toLowerCase().includes(query) ||
        (loan.anggota?.nama && loan.anggota.nama.toLowerCase().includes(query))
      )
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(loan => 
        loan.status.toLowerCase() === statusFilter.toLowerCase()
      )
    }
    
    setFilteredPinjaman(filtered)
  }, [pinjaman, searchQuery, statusFilter])
  
  // Export pinjaman to CSV
  const exportPinjaman = (): void => {
    if (filteredPinjaman.length === 0) {
      toast.error('Tidak ada data untuk diekspor')
      return
    }
    
    // Define field mapping for export
    const fieldMap = {
      id: 'ID Pinjaman',
      'anggota.nama': 'Nama Anggota',
      jumlah: 'Jumlah Pinjaman',
      sisa_pembayaran: 'Sisa Pembayaran',
      bunga_persen: 'Bunga (%)',
      status: 'Status',
      created_at: 'Tanggal Pengajuan'
    }
    
    // Format data with transformations
    const exportData = formatDataForExport(
      filteredPinjaman,
      fieldMap,
      {
        'ID Pinjaman': (value: string) => value.substring(0, 8),
        'Nama Anggota': (value: any, row: Pinjaman) => row.anggota?.nama || 'Anggota',
        'Jumlah Pinjaman': (value: number) => formatCurrency(value),
        'Sisa Pembayaran': (value: number) => formatCurrency(value),
        'Tanggal Pengajuan': (value: string) => formatDate(value)
      }
    )
    
    // Download as CSV
    downloadCSV(exportData, `pinjaman-${new Date().toISOString().split('T')[0]}`)
    toast.success('Data pinjaman berhasil diekspor')
  }
  
  // Load data on component mount
  useEffect(() => {
    fetchPinjaman()
  }, [])

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Manajemen Pinjaman</h2>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Pinjaman
        </Button>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            type="search" 
            placeholder="Cari pinjaman..." 
            className="w-full pl-8" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="aktif">Aktif</SelectItem>
              <SelectItem value="menunggu">Menunggu</SelectItem>
              <SelectItem value="lunas">Lunas</SelectItem>
              <SelectItem value="terlambat">Terlambat</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="icon" className="ml-auto">
          <SlidersHorizontal className="h-4 w-4" />
          <span className="sr-only">Filter</span>
        </Button>
        <Button variant="outline" size="icon" onClick={fetchPinjaman}>
          <RefreshCcw className="h-4 w-4" />
          <span className="sr-only">Refresh</span>
        </Button>
        <Button variant="outline" size="icon" onClick={exportPinjaman}>
          <Download className="h-4 w-4" />
          <span className="sr-only">Export</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredPinjaman.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Tidak ada pinjaman yang ditemukan</p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID Pinjaman</TableHead>
                <TableHead>Nama Anggota</TableHead>
                <TableHead>Jumlah</TableHead>
                <TableHead>Sisa</TableHead>
                <TableHead>Bunga</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tanggal Pengajuan</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPinjaman.map((loan) => (
              <TableRow key={loan.id}>
                <TableCell className="font-medium">{loan.id.substring(0, 8)}</TableCell>
                <TableCell>{loan.anggota?.nama || 'Anggota'}</TableCell>
                <TableCell>{formatCurrency(Number(loan.jumlah))}</TableCell>
                <TableCell>{formatCurrency(Number(loan.sisa_pembayaran))}</TableCell>
                <TableCell>{loan.bunga_persen}%</TableCell>
                <TableCell>
                  <Badge
                    variant={getStatusBadgeVariant(loan.status).variant as any}
                    className={getStatusBadgeVariant(loan.status).className}
                  >
                    {loan.status}
                  </Badge>
                </TableCell>
                <TableCell>{formatDate(loan.created_at.toString())}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>Lihat Detail</DropdownMenuItem>
                      <DropdownMenuItem>Jadwal Pembayaran</DropdownMenuItem>
                      <DropdownMenuItem>Catat Pembayaran</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">Tandai Bermasalah</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {!isLoading && filteredPinjaman.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Menampilkan {filteredPinjaman.length} pinjaman
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon">
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Halaman sebelumnya</span>
            </Button>
            <Button variant="outline" size="sm" className="h-8 w-8">
              1
            </Button>
            <Button variant="outline" size="icon">
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Halaman berikutnya</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
