"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { usePermission } from "@/hooks/use-permission"
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
import { getAllPembiayaan, Pembiayaan } from "@/lib/pembiayaan"
import { getAllAnggota, Anggota } from "@/lib/supabase"
import { format, parseISO, differenceInMonths } from "date-fns"
import { downloadCSV, formatDataForExport } from "@/utils/export-data"
import { toast } from "sonner"
import { LoanDetailModal } from "./components/loan-detail-modal"
import { PaymentScheduleModal } from "./components/payment-schedule-modal"
import { RecordPaymentModal } from "./components/record-payment-modal"
import { MarkProblematicModal } from "./components/mark-problematic-modal"
import { CreateLoanModal } from "./components/create-loan-modal"

export default function LoansPage() {
  const { hasPermission: canCreateLoans } = usePermission('approve_loans')
  const [pembiayaan, setPembiayaan] = useState<Pembiayaan[]>([])
  const [filteredPembiayaan, setFilteredPembiayaan] = useState<Pembiayaan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showFilters, setShowFilters] = useState(false)
  
  // Filter states
  const [amountMin, setAmountMin] = useState('')
  const [amountMax, setAmountMax] = useState('')
  const [dateStart, setDateStart] = useState('')
  const [dateEnd, setDateEnd] = useState('')
  
  // Modal states
  const [selectedLoan, setSelectedLoan] = useState<Pembiayaan | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showProblematicModal, setShowProblematicModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  
  // Members data for the create loan form
  const [members, setMembers] = useState<Anggota[]>([])

  // Format date function
  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, 'dd MMM yyyy');
    } catch (error) {
      return dateString;
    }
  };
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return `Rp ${amount.toLocaleString('id-ID')}`;
  };

  // Get badge variant based on status
  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'aktif':
        return {
          variant: 'default',
          className: 'bg-green-500'
        };
      case 'lunas':
        return {
          variant: 'outline',
          className: 'border-green-500 text-green-500'
        };
      case 'diajukan':
        return {
          variant: 'secondary',
          className: ''
        };
      case 'disetujui':
        return {
          variant: 'default',
          className: 'bg-blue-500'
        };
      case 'ditolak':
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

  // Fetch pembiayaan data from Supabase
  const fetchPembiayaan = async () => {
    setIsLoading(true)
    try {
      console.log('Fetching pembiayaan data...')
      const data = await getAllPembiayaan()
      console.log('Pembiayaan data received:', data)
      setPembiayaan(data)
      setFilteredPembiayaan(data)
      if (data.length === 0) {
        console.log('No pembiayaan data returned from API')
      }
    } catch (error) {
      console.error('Error fetching loans:', error)
      toast.error('Gagal memuat data pembiayaan')
    } finally {
      setIsLoading(false)
    }
  }
  
  // Apply all filters
  const applyFilters = () => {
    if (!pembiayaan.length) return
    
    let filtered = [...pembiayaan]
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(loan => 
        (loan.id && loan.id.toLowerCase().includes(query)) ||
        (loan.anggota?.nama && loan.anggota.nama.toLowerCase().includes(query)) ||
        loan.status.toLowerCase().includes(query) ||
        loan.jenis_pembiayaan.toLowerCase().includes(query)
      )
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(loan => 
        loan.status.toLowerCase() === statusFilter.toLowerCase()
      )
    }
    
    // Apply amount range filter
    if (amountMin) {
      const min = parseFloat(amountMin)
      if (!isNaN(min)) {
        filtered = filtered.filter(loan => 
          Number(loan.jumlah) >= min
        )
      }
    }
    
    if (amountMax) {
      const max = parseFloat(amountMax)
      if (!isNaN(max)) {
        filtered = filtered.filter(loan => 
          Number(loan.jumlah) <= max
        )
      }
    }
    
    // Apply date range filter
    if (dateStart) {
      const startDate = new Date(dateStart)
      filtered = filtered.filter(loan => {
        const loanDate = new Date(loan.created_at)
        return loanDate >= startDate
      })
    }
    
    if (dateEnd) {
      const endDate = new Date(dateEnd)
      // Set to end of day
      endDate.setHours(23, 59, 59, 999)
      filtered = filtered.filter(loan => {
        const loanDate = new Date(loan.created_at)
        return loanDate <= endDate
      })
    }
    
    setFilteredPembiayaan(filtered)
  }
  
  // Reset all filters
  const resetFilters = () => {
    setSearchQuery('')
    setStatusFilter('all')
    setAmountMin('')
    setAmountMax('')
    setDateStart('')
    setDateEnd('')
    setFilteredPembiayaan(pembiayaan)
  }
  
  // Export pembiayaan data to CSV
  const exportData = () => {
    if (filteredPembiayaan.length === 0) {
      toast.error('Tidak ada data untuk diekspor')
      return
    }
    
    const fieldMap = {
      id: 'ID Pembiayaan',
      'anggota.nama': 'Nama Anggota',
      jenis_pembiayaan: 'Jenis Pembiayaan',
      status: 'Status',
      jumlah: 'Jumlah Pembiayaan',
      jatuh_tempo: 'Jatuh Tempo',
      total_pembayaran: 'Total Pembayaran',
      sisa_pembayaran: 'Sisa Pembayaran',
      created_at: 'Tanggal Dibuat'
    }

    const exportData = filteredPembiayaan.map(loan => ({
      "ID Pembiayaan": loan.id,
      "Nama Anggota": loan.anggota?.nama || 'Anggota',
      "Jenis Pembiayaan": loan.jenis_pembiayaan,
      "Status": loan.status,
      "Jumlah Pembiayaan": formatCurrency(Number(loan.jumlah)),
      "Jatuh Tempo": formatDate(String(loan.jatuh_tempo)),
      "Total Pembayaran": formatCurrency(Number(loan.total_pembayaran)),
      "Sisa Pembayaran": formatCurrency(Number(loan.sisa_pembayaran)),
      "Tanggal Dibuat": formatDate(String(loan.created_at)),
    }))

    // Download as CSV
    downloadCSV(exportData, `pembiayaan-${new Date().toISOString().split('T')[0]}`)
    toast.success('Data pembiayaan berhasil diekspor')
  }

  // Load data on component mount
  useEffect(() => {
    fetchPembiayaan()
    
    // Fetch members for the create loan form
    const getMembers = async () => {
      try {
        const data = await getAllAnggota()
        setMembers(data)
      } catch (error) {
        console.error('Error fetching members:', error)
      }
    }
    
    getMembers()
  }, [])
  
  // Apply filters when search query or filters change
  useEffect(() => {
    applyFilters()
  }, [searchQuery, statusFilter, amountMin, amountMax, dateStart, dateEnd])
  
  // Refresh data
  const handleRefresh = () => {
    fetchPembiayaan()
    toast.success('Data pembiayaan berhasil diperbarui')
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Manajemen Pembiayaan</h2>
        {canCreateLoans && (
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Pembiayaan
          </Button>
        )}
      </div>

      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            type="search" 
            placeholder="Cari pembiayaan..." 
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
              <SelectItem value="diajukan">Diajukan</SelectItem>
              <SelectItem value="disetujui">Disetujui</SelectItem>
              <SelectItem value="ditolak">Ditolak</SelectItem>
              <SelectItem value="aktif">Aktif</SelectItem>
              <SelectItem value="lunas">Lunas</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="ml-auto"></div>
        <Button variant="outline" size="icon" onClick={handleRefresh}>
          <RefreshCcw className="h-4 w-4" />
          <span className="sr-only">Refresh</span>
        </Button>
        <Button variant="outline" size="icon" onClick={exportData}>
          <Download className="h-4 w-4" />
          <span className="sr-only">Export</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredPembiayaan.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Tidak ada pembiayaan yang ditemukan</p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">Nama Anggota</TableHead>
                <TableHead className="w-[200px]">Jenis Pembiayaan</TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
                <TableHead className="text-right w-[140px]">Jumlah</TableHead>
                <TableHead className="text-right w-[140px]">Sisa Pembayaran</TableHead>
                <TableHead className="w-[120px]">Jatuh Tempo</TableHead>
                <TableHead className="text-right w-[120px]">Tanggal Dibuat</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPembiayaan.map((loan) => (
                <TableRow key={loan.id}>
                  <TableCell className="font-medium truncate max-w-[180px]" title={loan.anggota?.nama || 'Tidak ada nama'}>
                    {loan.anggota?.nama || 'Tidak ada nama'}
                  </TableCell>
                  <TableCell className="truncate max-w-[200px]" title={loan.jenis_pembiayaan}>
                    {loan.jenis_pembiayaan}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={getStatusBadgeVariant(loan.status).variant as any}
                      className={`${getStatusBadgeVariant(loan.status).className} w-full justify-center`}
                    >
                      {loan.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(Number(loan.jumlah))}</TableCell>
                  <TableCell className="text-right">{formatCurrency(Number(loan.sisa_pembayaran))}</TableCell>
                  <TableCell className="text-center">{formatDate(String(loan.jatuh_tempo))}</TableCell>
                  <TableCell className="text-center">{formatDate(String(loan.created_at))}</TableCell>
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
                        <DropdownMenuItem onClick={() => {
                          setSelectedLoan(loan);
                          setShowDetailModal(true);
                        }}>
                          Detail Pembiayaan
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setSelectedLoan(loan);
                          setShowScheduleModal(true);
                        }}>
                          Jadwal Pembayaran
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => {
                            setSelectedLoan(loan);
                            setShowPaymentModal(true);
                          }}
                          disabled={loan.status === 'lunas'}
                        >
                          Catat Pembayaran
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => {
                            setSelectedLoan(loan);
                            setShowProblematicModal(true);
                          }}
                          disabled={loan.status === 'lunas'}
                        >
                          Tandai Bermasalah
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Menampilkan {filteredPembiayaan.length} dari {pembiayaan.length} pembiayaan
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" disabled>
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Halaman Sebelumnya</span>
          </Button>
          <Button variant="outline" size="icon" disabled>
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Halaman Berikutnya</span>
          </Button>
        </div>
      </div>

      {/* Loan Detail Modal */}
      <LoanDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        loan={selectedLoan}
        onViewSchedule={() => {
          setShowDetailModal(false);
          setShowScheduleModal(true);
        }}
        onRecordPayment={() => {
          setShowDetailModal(false);
          setShowPaymentModal(true);
        }}
      />

      {/* Payment Schedule Modal */}
      <PaymentScheduleModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        loan={selectedLoan}
      />

      {/* Record Payment Modal */}
      <RecordPaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        loan={selectedLoan}
        onPaymentRecorded={() => {
          toast.success("Pembayaran berhasil dicatat");
          fetchPembiayaan();
        }}
      />

      {/* Mark Problematic Modal */}
      <MarkProblematicModal
        isOpen={showProblematicModal}
        onClose={() => setShowProblematicModal(false)}
        loan={selectedLoan}
        onMarked={() => {
          toast.success("Pembiayaan berhasil ditandai bermasalah");
          fetchPembiayaan();
        }}
      />

      {/* Create new loan modal */}
      <CreateLoanModal 
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false)
          fetchPembiayaan()
          toast.success('Pembiayaan berhasil dibuat')
        }}
        members={members}
      />
    </div>
  )
}
