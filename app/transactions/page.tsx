"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PermissionGuard } from "@/components/permission-guard"
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
import { downloadExcel, formatDataForExport } from "@/utils/export-data"
import { toast } from "sonner"
import { TransactionDetailModal } from "./components/transaction-detail-modal"
import { TransactionReceipt } from "./components/transaction-receipt"
import { TransactionFormModal } from "./components/transaction-form-modal"

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
  pembiayaan_id?: string; // Database uses pembiayaan_id, not pinjaman_id
  tabungan_id?: string;
  created_at: string;
  updated_at: string;
  tabungan?: { 
    nomor_rekening: string;
    saldo: number;
    jenis_tabungan_id: string;
    jenis_tabungan?: {
      nama: string;
      kode: string;
    } | null;
  } | null;
  pinjaman?: {
    id: string;
    jumlah: number;
    sisa_pembayaran: number;
    jenis_pinjaman: string;
  } | null;
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
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [totalPages, setTotalPages] = useState(1)
  
  // Modal states
  const [selectedTransaction, setSelectedTransaction] = useState<Transaksi | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [showFormModal, setShowFormModal] = useState(false)
  
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
  
  // Fetch transactions from API route with fallback mechanism
  const fetchTransactions = async () => {
    setIsLoading(true)
    setError(null)
    try {
      console.log('Attempting to fetch transactions from API...')
      
      // Primary approach: Use the API route to fetch transactions
      const response = await fetch('/api/transactions')
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('Error response from API:', errorData)
        throw new Error(errorData.error || response.statusText)
      }
      
      const data = await response.json()
      console.log(`Fetched ${data?.length || 0} transaction records from API`)
      
      // Data is already transformed by the API
      setTransactions(data)
      setFilteredTransactions(data)
    } catch (apiError) {
      console.error('API fetch error:', apiError)
      
      // Fallback approach: Use direct Supabase RPC call from client
      try {
        console.log('Attempting fallback: Direct Supabase RPC call...')
        
        // Import supabase client dynamically to avoid SSR issues
        const { supabase } = await import('@/lib/supabase')
        
        const { data, error } = await supabase
          .rpc('get_all_transactions')
          .limit(100)
        
        if (error) {
          console.error('Supabase RPC error:', error)
          throw error
        }
        
        if (!data || data.length === 0) {
          console.warn('No transaction data returned from fallback')
          setTransactions([])
          setFilteredTransactions([])
          return
        }
        
        console.log(`Fallback successful: ${data.length} transactions fetched directly`)
        
        // Transform the flat data structure into the nested structure expected by the component
        const transformedData = data.map(item => ({
          id: item.id,
          reference_number: item.reference_number,
          anggota_id: item.anggota_id,
          tipe_transaksi: item.tipe_transaksi,
          kategori: item.kategori,
          deskripsi: item.deskripsi,
          jumlah: item.jumlah,
          saldo_sebelum: item.saldo_sebelum,
          saldo_sesudah: item.saldo_sesudah,
          pembiayaan_id: item.pembiayaan_id,
          tabungan_id: item.tabungan_id,
          created_at: item.created_at,
          updated_at: item.updated_at,
          anggota: item.anggota_nama ? { nama: item.anggota_nama } : null,
          tabungan: item.tabungan_nomor_rekening ? {
            nomor_rekening: item.tabungan_nomor_rekening,
            saldo: item.tabungan_saldo,
            jenis_tabungan_id: item.tabungan_jenis_id,
            jenis_tabungan: item.tabungan_jenis_nama ? {
              nama: item.tabungan_jenis_nama,
              kode: item.tabungan_jenis_kode
            } : null
          } : null,
          pinjaman: item.pembiayaan_jumlah ? {
            id: item.pembiayaan_id,
            jumlah: item.pembiayaan_jumlah,
            sisa_pembayaran: item.pembiayaan_sisa,
            jenis_pinjaman: item.pembiayaan_jenis
          } : null
        }))
        
        setTransactions(transformedData)
        setFilteredTransactions(transformedData)
      } catch (fallbackError) {
        console.error('Fallback approach failed:', fallbackError)
        
        let errorMessage = 'An unknown error occurred';
        if (fallbackError instanceof Error) {
          errorMessage = fallbackError.message;
        } else if (typeof fallbackError === 'object' && fallbackError !== null) {
          errorMessage = (fallbackError as any).message || JSON.stringify(fallbackError);
        }
        
        setError(`Error: ${errorMessage}`)
        toast.error(`Gagal memuat data transaksi: ${errorMessage}`)
      }
    } finally {
      setIsLoading(false)
    }
  }
  
  // Additional filter states
  const [dateStart, setDateStart] = useState('')
  const [dateEnd, setDateEnd] = useState('')
  const [amountMin, setAmountMin] = useState('')
  const [amountMax, setAmountMax] = useState('')

  // Calculate total pages based on filtered data
  const calculatePagination = (data: Transaksi[]) => {
    const total = Math.ceil(data.length / itemsPerPage)
    setTotalPages(total > 0 ? total : 1)
    
    // Reset to first page if current page is out of bounds
    if (currentPage > total && total > 0) {
      setCurrentPage(1)
    }
  }
  
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
    calculatePagination(filtered)
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
  
  // Handle pagination changes
  useEffect(() => {
    calculatePagination(filteredTransactions)
  }, [filteredTransactions, itemsPerPage])
  
  // Export transactions to Excel
  const exportTransactions = (): void => {
    if (filteredTransactions.length === 0) {
      toast.error('Tidak ada data untuk diekspor')
      return
    }
    
    // Define field mapping for export (removed ID Transaksi)
    const fieldMap = {
      'anggota.nama': 'Nama Anggota',
      tipe_transaksi: 'Jenis Transaksi',
      kategori: 'Kategori',
      jumlah: 'Jumlah',
      'rekening_pinjaman': 'Rekening/Pinjaman',
      created_at: 'Tanggal'
    }
    
    // Format data with transformations
    const exportData = formatDataForExport(
      filteredTransactions.map(transaction => ({
        ...transaction,
        // Add a virtual field for rekening/pinjaman
        rekening_pinjaman: transaction.tabungan 
          ? `${transaction.tabungan.jenis_tabungan?.nama || 'Tabungan'}` 
          : transaction.pinjaman 
            ? `${transaction.pinjaman.jenis_pinjaman || 'Pinjaman'}` 
            : '-'
      })),
      fieldMap,
      {
        'Nama Anggota': (value: any, row: Transaksi) => row.anggota?.nama || 'Anggota',
        // Export Jumlah as a number, not as formatted currency
        'Jumlah': (value: number) => Number(value),
        'Tanggal': (value: string) => formatDate(value)
      }
    )
    
    // Download as Excel
    downloadExcel(exportData, `transaksi-${new Date().toISOString().split('T')[0]}`)
    toast.success('Data transaksi berhasil diekspor ke Excel')
  }
  
  // Load data on component mount
  useEffect(() => {
    fetchTransactions()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Get current page data
  const getCurrentPageData = () => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredTransactions.slice(startIndex, endIndex)
  }
  
  // Handle page change
  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return
    setCurrentPage(page)
  }
  
  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = []
    const maxVisiblePages = 5
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total pages is less than max visible pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Always show first page
      pages.push(1)
      
      // Calculate start and end of visible pages
      let start = Math.max(2, currentPage - 1)
      let end = Math.min(totalPages - 1, currentPage + 1)
      
      // Adjust if we're near the start or end
      if (currentPage <= 2) {
        end = 4
      } else if (currentPage >= totalPages - 1) {
        start = totalPages - 3
      }
      
      // Add ellipsis if needed
      if (start > 2) {
        pages.push(-1) // -1 represents ellipsis
      }
      
      // Add middle pages
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }
      
      // Add ellipsis if needed
      if (end < totalPages - 1) {
        pages.push(-2) // -2 represents ellipsis
      }
      
      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages)
      }
    }
    
    return pages
  }
  
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Manajemen Transaksi</h2>
        <PermissionGuard permission="create_transactions">
          <Button onClick={() => setShowFormModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Transaksi
          </Button>
        </PermissionGuard>
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
              <SelectItem value="lainnya">Lainnya</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="ml-auto"></div>
        <Button variant="outline" size="icon" onClick={fetchTransactions}>
          <RefreshCcw className="h-4 w-4" />
          <span className="sr-only">Refresh</span>
        </Button>
        <PermissionGuard permission="generate_reports">
          <Button variant="outline" size="icon" onClick={exportTransactions}>
            <Download className="h-4 w-4" />
            <span className="sr-only">Export</span>
          </Button>
        </PermissionGuard>
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
                <TableHead>Rekening/Pinjaman</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {getCurrentPageData().map((transaction) => (
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
                  <TableCell>
                    {transaction.tabungan ? (
                      <div className="flex flex-col">
                        <span className="text-xs font-medium">{transaction.tabungan.jenis_tabungan?.nama || 'Tabungan'}</span>
                        <span className="text-xs text-muted-foreground">{transaction.tabungan.nomor_rekening}</span>
                      </div>
                    ) : transaction.pinjaman ? (
                      <div className="flex flex-col">
                        <span className="text-xs font-medium">{transaction.pinjaman.jenis_pinjaman || 'Pinjaman'}</span>
                        <span className="text-xs text-muted-foreground">ID: {transaction.pinjaman.id.substring(0, 8)}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
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
                        {/* View Detail - Everyone can see this */}
                        <DropdownMenuItem onClick={() => {
                          setSelectedTransaction(transaction);
                          setShowDetailModal(true);
                        }}>
                          Lihat Detail
                        </DropdownMenuItem>
                        
                        {/* Print Receipt - Only users with view_transactions permission */}
                        <PermissionGuard permission="view_transactions">
                          <DropdownMenuItem onClick={() => {
                            setSelectedTransaction(transaction);
                            setShowReceiptModal(true);
                          }}>
                            Cetak Bukti
                          </DropdownMenuItem>
                        </PermissionGuard>
                        
                        {/* Cancel Transaction - Only users with edit_transactions permission */}
                        <PermissionGuard permission="edit_transactions">
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            Batalkan Transaksi
                          </DropdownMenuItem>
                        </PermissionGuard>
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
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="text-sm text-muted-foreground">
              Menampilkan {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredTransactions.length)} dari {filteredTransactions.length} transaksi
            </div>
            <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Per halaman" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 per halaman</SelectItem>
                <SelectItem value="20">20 per halaman</SelectItem>
                <SelectItem value="50">50 per halaman</SelectItem>
                <SelectItem value="100">100 per halaman</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Halaman sebelumnya</span>
            </Button>
            
            {getPageNumbers().map((page, index) => (
              page < 0 ? (
                <div key={`ellipsis-${index}`} className="px-2">...</div>
              ) : (
                <Button 
                  key={page}
                  variant={currentPage === page ? "default" : "outline"} 
                  size="sm" 
                  className={`h-8 w-8 ${currentPage === page ? 'pointer-events-none' : ''}`}
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </Button>
              )
            ))}
            
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Halaman berikutnya</span>
            </Button>
          </div>
        </div>
      )}
      {/* Transaction Detail Modal */}
      <TransactionDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        transaction={selectedTransaction}
        onPrint={() => {
          setShowDetailModal(false);
          setShowReceiptModal(true);
        }}
      />

      {/* Transaction Receipt Modal */}
      <TransactionReceipt
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        transaction={selectedTransaction}
      />

      {/* Transaction Form Modal */}
      <TransactionFormModal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        onSuccess={fetchTransactions}
      />
    </div>
  )
}
