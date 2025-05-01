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
import { format, parseISO } from "date-fns"
import { id } from "date-fns/locale"
import { downloadCSV, formatDataForExport } from "@/utils/export-data"
import { toast } from "sonner"

// Define transaction type
interface Transaksi {
  id: string;
  reference_number?: string;
  anggota_id: string;
  anggota?: {
    nama: string;
  } | null;
  tipe_transaksi: string;
  kategori: string;
  deskripsi?: string;
  jumlah: number;
  saldo_sebelum?: number;
  saldo_sesudah?: number;
  pinjaman_id?: string;
  created_at: string;
  updated_at: string;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaksi[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<Transaksi[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [showFilters, setShowFilters] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Component initialization
  
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
  
  // Map transaction type to status for display
  const getStatusFromType = (type: string, kategori: string) => {
    if (type.toLowerCase() === 'masuk') {
      return 'Berhasil';
    } else if (type.toLowerCase() === 'keluar') {
      if (kategori.toLowerCase() === 'pencairan_pinjaman') {
        return 'Diproses';
      } else {
        return 'Berhasil';
      }
    }
    return 'Berhasil';
  };
  
  // Map kategori to display name
  const getKategoriDisplay = (kategori: string) => {
    switch (kategori.toLowerCase()) {
      case 'setoran':
        return 'Setoran';
      case 'penarikan':
        return 'Penarikan';
      case 'pembayaran_pinjaman':
        return 'Angsuran';
      case 'pencairan_pinjaman':
        return 'Pinjaman';
      case 'biaya_admin':
        return 'Biaya Admin';
      case 'bunga':
        return 'Bunga';
      case 'lainnya':
        return 'Lainnya';
      default:
        return kategori;
    }
  };
  
  // Fetch transactions from API route
  const fetchTransactions = async () => {
    setIsLoading(true)
    setError(null)
    try {
      console.log('Attempting to fetch transactions from API...')
      
      // Use the API route to fetch transactions
      const response = await fetch('/api/transactions')
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('Error response from API:', errorData)
        setError(`API error: ${errorData.error || response.statusText}`)
        throw new Error(errorData.error || response.statusText)
      }
      
      const data = await response.json()
      console.log(`Fetched ${data?.length || 0} transaction records from API`)
      
      // Data is already transformed by the API
      setTransactions(data)
      setFilteredTransactions(data)
    } catch (error) {
      console.error('Error fetching transactions:', error)
      let errorMessage = 'An unknown error occurred';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        // Try to extract message from error object
        errorMessage = (error as any).message || JSON.stringify(error);
      }
      
      setError(`Error: ${errorMessage}`)
      toast.error(`Gagal memuat data transaksi: ${errorMessage}`)
    } finally {
      setIsLoading(false)
    }
  }
  
  // Additional filter states
  const [dateStart, setDateStart] = useState('')
  const [dateEnd, setDateEnd] = useState('')
  const [amountMin, setAmountMin] = useState('')
  const [amountMax, setAmountMax] = useState('')

  // Apply all filters
  const applyFilters = () => {
    if (!transactions.length) return
    
    let filtered = [...transactions]
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(transaction => 
        (transaction.reference_number && transaction.reference_number.toLowerCase().includes(query)) ||
        (transaction.anggota?.nama && transaction.anggota.nama.toLowerCase().includes(query)) ||
        transaction.tipe_transaksi.toLowerCase().includes(query) ||
        transaction.kategori.toLowerCase().includes(query) ||
        (transaction.deskripsi && transaction.deskripsi.toLowerCase().includes(query))
      )
    }
    
    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(transaction => 
        transaction.tipe_transaksi.toLowerCase() === typeFilter.toLowerCase()
      )
    }
    
    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(transaction => 
        transaction.kategori.toLowerCase() === categoryFilter.toLowerCase()
      )
    }
    
    // Apply date range filter
    if (dateStart) {
      const startDate = new Date(dateStart)
      filtered = filtered.filter(transaction => {
        const transactionDate = new Date(transaction.created_at)
        return transactionDate >= startDate
      })
    }
    
    if (dateEnd) {
      const endDate = new Date(dateEnd)
      endDate.setHours(23, 59, 59, 999) // End of the day
      filtered = filtered.filter(transaction => {
        const transactionDate = new Date(transaction.created_at)
        return transactionDate <= endDate
      })
    }
    
    // Apply amount range filter
    if (amountMin) {
      const min = parseFloat(amountMin)
      if (!isNaN(min)) {
        filtered = filtered.filter(transaction => 
          Number(transaction.jumlah) >= min
        )
      }
    }
    
    if (amountMax) {
      const max = parseFloat(amountMax)
      if (!isNaN(max)) {
        filtered = filtered.filter(transaction => 
          Number(transaction.jumlah) <= max
        )
      }
    }
    
    setFilteredTransactions(filtered)
  }
  
  // Reset all filters
  const resetFilters = () => {
    setSearchQuery('')
    setTypeFilter('all')
    setCategoryFilter('all')
    setDateStart('')
    setDateEnd('')
    setAmountMin('')
    setAmountMax('')
    setFilteredTransactions(transactions)
  }
  
  // Handle search and filters
  useEffect(() => {
    applyFilters()
  }, [transactions, searchQuery, typeFilter, categoryFilter, dateStart, dateEnd, amountMin, amountMax])
  
  // Export transactions to CSV
  const exportTransactions = (): void => {
    if (filteredTransactions.length === 0) {
      toast.error('Tidak ada data untuk diekspor')
      return
    }
    
    // Define field mapping for export
    const fieldMap = {
      reference_number: 'ID Transaksi',
      'anggota.nama': 'Nama Anggota',
      tipe_transaksi: 'Jenis Transaksi',
      kategori: 'Kategori',
      jumlah: 'Jumlah',
      created_at: 'Tanggal'
    }
    
    // Format data with transformations
    const exportData = formatDataForExport(
      filteredTransactions,
      fieldMap,
      {
        'ID Transaksi': (value: string | undefined, row: Transaksi) => value || row.id.substring(0, 8),
        'Nama Anggota': (value: any, row: Transaksi) => row.anggota?.nama || 'Anggota',
        'Jumlah': (value: number) => formatCurrency(value),
        'Tanggal': (value: string) => formatDate(value)
      }
    )
    
    // Download as CSV
    downloadCSV(exportData, `transaksi-${new Date().toISOString().split('T')[0]}`)
    toast.success('Data transaksi berhasil diekspor')
  }
  
  // Load data on component mount
  useEffect(() => {
    fetchTransactions()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Manajemen Transaksi</h2>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Transaksi
        </Button>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            type="search" 
            placeholder="Cari transaksi..." 
            className="w-full pl-8" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Jenis Transaksi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Jenis</SelectItem>
              <SelectItem value="masuk">Masuk</SelectItem>
              <SelectItem value="keluar">Keluar</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kategori</SelectItem>
              <SelectItem value="setoran">Setoran</SelectItem>
              <SelectItem value="penarikan">Penarikan</SelectItem>
              <SelectItem value="pembayaran_pinjaman">Angsuran</SelectItem>
              <SelectItem value="pencairan_pinjaman">Pinjaman</SelectItem>
              <SelectItem value="biaya_admin">Biaya Admin</SelectItem>
              <SelectItem value="bunga">Bunga</SelectItem>
              <SelectItem value="lainnya">Lainnya</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="ml-auto"></div>
        <Button variant="outline" size="icon" onClick={fetchTransactions}>
          <RefreshCcw className="h-4 w-4" />
          <span className="sr-only">Refresh</span>
        </Button>
        <Button variant="outline" size="icon" onClick={exportTransactions}>
          <Download className="h-4 w-4" />
          <span className="sr-only">Export</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-destructive font-medium mb-2">Error connecting to database</p>
          <p className="text-muted-foreground text-sm">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchTransactions} className="mt-4">
            <RefreshCcw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Tidak ada transaksi yang ditemukan</p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID Transaksi</TableHead>
                <TableHead>Nama Anggota</TableHead>
                <TableHead>Jenis</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Jumlah</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="font-medium">
                    {transaction.reference_number || transaction.id.substring(0, 8)}
                  </TableCell>
                  <TableCell>{transaction.anggota?.nama || 'Anggota'}</TableCell>
                  <TableCell>
                    <Badge variant={transaction.tipe_transaksi === 'masuk' ? 'secondary' : 'destructive'}>
                      {transaction.tipe_transaksi === 'masuk' ? 'Masuk' : 'Keluar'}
                    </Badge>
                  </TableCell>
                  <TableCell>{getKategoriDisplay(transaction.kategori)}</TableCell>
                  <TableCell>
                    {transaction.tipe_transaksi === 'masuk' ? '+ ' : '- '}
                    {formatCurrency(Number(transaction.jumlah))}
                  </TableCell>
                  <TableCell>{formatDate(transaction.created_at.toString())}</TableCell>
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
                        <DropdownMenuItem>Cetak Bukti</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">Batalkan Transaksi</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {!isLoading && filteredTransactions.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Menampilkan {filteredTransactions.length} transaksi
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
