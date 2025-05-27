"use client"

import { useState, useEffect } from "react"
import { useAdminAuth } from "@/lib/admin-auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { PermissionGuard } from "@/components/permission-guard"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronLeft, ChevronRight, Download, MoreHorizontal, Plus, Search, SlidersHorizontal, RefreshCcw, Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { format, parseISO } from "date-fns"
import { id } from "date-fns/locale"
import { useToast } from "@/components/ui/use-toast"
import { downloadCSV, formatDataForExport } from "@/utils/export-data"
import { supabase, type Anggota as AnggotaType } from "@/lib/supabase"

// Import our custom components
import { UserDetailDialog } from "./components/user-detail-dialog"
import { EditUserForm } from "./components/edit-user-form"
import { UserTransactions } from "./components/user-transactions"
import { ToggleUserStatus } from "./components/toggle-user-status"
import { SavingsDetails } from "./components/savings-details"

type Anggota = {
  id: string
  nama: string
  nomor_rekening: string
  saldo: number
  alamat?: string
  kota?: string
  tempat_lahir?: string
  tanggal_lahir?: Date | string
  pekerjaan?: string
  jenis_identitas?: string
  nomor_identitas?: string
  created_at: Date | string
  updated_at: Date | string
  closed_at?: Date | string
  is_active: boolean
}

export default function UsersPage() {
  const { toast } = useToast()
  const [anggota, setAnggota] = useState<Anggota[]>([])
  const [filteredAnggota, setFilteredAnggota] = useState<Anggota[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [cityFilter, setCityFilter] = useState<string>('')
  const [joinDateStart, setJoinDateStart] = useState<string>('')
  const [joinDateEnd, setJoinDateEnd] = useState<string>('')
  
  // State for dialogs
  const [selectedUser, setSelectedUser] = useState<Anggota | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [transactionsDialogOpen, setTransactionsDialogOpen] = useState(false)
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [savingsDialogOpen, setSavingsDialogOpen] = useState(false)
  
  // Format date function
  const formatDate = (dateString: string | Date) => {
    try {
      const date = typeof dateString === 'string' ? parseISO(dateString) : dateString
      return format(date, 'dd MMM yyyy', { locale: id })
    } catch (error) {
      return String(dateString)
    }
  }

  // Fetch anggota data from Supabase
  const fetchAnggota = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('anggota')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      setAnggota(data || [])
      setFilteredAnggota(data || [])
    } catch (error) {
      console.error('Error fetching anggota:', error)
      toast({
        title: "Error",
        description: "Gagal memuat data anggota. Silakan coba lagi.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Export anggota data to CSV
  const exportAnggotaData = (): void => {
    if (filteredAnggota.length === 0) {
      toast({
        title: "Info",
        description: "Tidak ada data untuk diekspor",
        variant: "default"
      })
      return
    }

    // Define field mapping for export
    const fieldMap = {
      nomor_rekening: "No. Rekening",
      nama: "Nama",
      alamat: "Alamat",
      kota: "Kota",
      tempat_lahir: "Tempat Lahir",
      tanggal_lahir: "Tanggal Lahir",
      pekerjaan: "Pekerjaan",
      jenis_identitas: "Jenis Identitas",
      nomor_identitas: "Nomor Identitas",
      saldo: "Saldo",
      created_at: "Tanggal Bergabung",
      is_active: "Status"
    }

    // Format data with transformations
    const exportData = formatDataForExport(
      filteredAnggota,
      fieldMap,
      {
        "Tanggal Bergabung": (value: string) => formatDate(value),
        "Tanggal Lahir": (value: string) => value ? formatDate(value) : "-",
        "Alamat": (value: string | undefined) => value || "-",
        "Kota": (value: string | undefined) => value || "-",
        "Tempat Lahir": (value: string | undefined) => value || "-",
        "Pekerjaan": (value: string | undefined) => value || "-",
        "Jenis Identitas": (value: string | undefined) => value || "-",
        "Nomor Identitas": (value: string | undefined) => value || "-",
        "Saldo": (value: number) => `Rp ${Number(value).toLocaleString('id-ID')}`,
        "Status": (value: boolean) => value ? "Aktif" : "Nonaktif"
      }
    )

    // Download as CSV
    downloadCSV(exportData, `anggota-${new Date().toISOString().split('T')[0]}`)
    
    toast({
      title: "Berhasil",
      description: "Data anggota berhasil diekspor",
      variant: "default"
    })
  }

  // Apply all filters
  const applyFilters = () => {
    if (!anggota.length) return
    
    let filtered = [...anggota]
    
    // Apply search filter
    if (searchQuery.trim()) {
      const lowercaseQuery = searchQuery.toLowerCase()
      filtered = filtered.filter(member => 
        member.nama.toLowerCase().includes(lowercaseQuery) ||
        member.nomor_rekening.toLowerCase().includes(lowercaseQuery) ||
        (member.alamat && member.alamat.toLowerCase().includes(lowercaseQuery)) ||
        (member.nomor_identitas && member.nomor_identitas.toLowerCase().includes(lowercaseQuery))
      )
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      const isActive = statusFilter === 'active'
      filtered = filtered.filter(member => member.is_active === isActive)
    }
    
    // Apply city filter
    if (cityFilter) {
      filtered = filtered.filter(member => 
        member.kota && member.kota.toLowerCase().includes(cityFilter.toLowerCase())
      )
    }
    
    // Apply date range filter
    if (joinDateStart) {
      const startDate = new Date(joinDateStart)
      filtered = filtered.filter(member => {
        const memberDate = new Date(member.created_at as string)
        return memberDate >= startDate
      })
    }
    
    if (joinDateEnd) {
      const endDate = new Date(joinDateEnd)
      endDate.setHours(23, 59, 59, 999) // End of the day
      filtered = filtered.filter(member => {
        const memberDate = new Date(member.created_at as string)
        return memberDate <= endDate
      })
    }
    
    setFilteredAnggota(filtered)
  }
  
  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query)
    applyFilters()
  }
  
  // Reset all filters
  const resetFilters = () => {
    setSearchQuery('')
    setStatusFilter('all')
    setCityFilter('')
    setJoinDateStart('')
    setJoinDateEnd('')
    setFilteredAnggota(anggota)
  }

  // Load data on component mount
  useEffect(() => {
    fetchAnggota()
  }, [])
  
  // Apply filters when filter values change
  useEffect(() => {
    applyFilters()
  }, [statusFilter, cityFilter, joinDateStart, joinDateEnd, searchQuery, anggota])

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Manajemen Anggota</h2>
        <PermissionGuard permission="edit_users">
          <Button onClick={() => {
            // Reset form and open dialog
            setSelectedUser(null);
            setEditDialogOpen(true);
          }}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Anggota
          </Button>
        </PermissionGuard>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            type="search" 
            placeholder="Cari anggota..." 
            className="w-full pl-8" 
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        <div className="ml-auto"></div>
        <Button variant="outline" size="icon" onClick={fetchAnggota} disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCcw className="h-4 w-4" />
          )}
          <span className="sr-only">Refresh</span>
        </Button>
        <PermissionGuard permission="generate_reports">
          <Button variant="outline" size="icon" onClick={exportAnggotaData}>
            <Download className="h-4 w-4" />
            <span className="sr-only">Export</span>
          </Button>
        </PermissionGuard>
      </div>



      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredAnggota.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Tidak ada anggota yang ditemukan</p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. Rekening</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Alamat</TableHead>
                <TableHead>Tabungan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tanggal Bergabung</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAnggota.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">{member.nomor_rekening}</TableCell>
                  <TableCell>{member.nama}</TableCell>
                  <TableCell>{member.alamat || '-'}</TableCell>
                  <TableCell>
                    <PermissionGuard permission="view_transactions">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedUser(member);
                          setSavingsDialogOpen(true);
                        }}
                      >
                        Lihat Detail Tabungan
                      </Button>
                    </PermissionGuard>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={member.is_active ? "default" : "destructive"}
                      className={member.is_active ? "bg-green-500 hover:bg-green-600" : ""}
                    >
                      {member.is_active ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(member.created_at)}</TableCell>
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
                          setSelectedUser(member)
                          setDetailDialogOpen(true)
                        }}>
                          Lihat Detail
                        </DropdownMenuItem>
                        
                        {/* Edit Member - Only users with edit_users permission */}
                        <PermissionGuard permission="edit_users">
                          <DropdownMenuItem onClick={() => {
                            setSelectedUser(member)
                            setEditDialogOpen(true)
                          }}>
                            Edit Anggota
                          </DropdownMenuItem>
                        </PermissionGuard>
                        
                        {/* View Transactions - Only users with view_transactions permission */}
                        <PermissionGuard permission="view_transactions">
                          <DropdownMenuItem onClick={() => {
                            setSelectedUser(member)
                            setTransactionsDialogOpen(true)
                          }}>
                            Lihat Transaksi
                          </DropdownMenuItem>
                        </PermissionGuard>
                        
                        {/* View Savings Types - Only users with view_transactions permission */}
                        <PermissionGuard permission="view_transactions">
                          <DropdownMenuItem onClick={() => {
                            setSelectedUser(member)
                            setSavingsDialogOpen(true)
                          }}>
                            Lihat Jenis Tabungan
                          </DropdownMenuItem>
                        </PermissionGuard>
                        
                        {/* Only show separator if user has permission to activate/deactivate */}
                        <PermissionGuard permission="edit_users">
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className={member.is_active ? "text-destructive" : "text-green-600"}
                            onClick={() => {
                              setSelectedUser(member)
                              setStatusDialogOpen(true)
                            }}
                          >
                            {member.is_active ? 'Nonaktifkan Anggota' : 'Aktifkan Anggota'}
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

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Menampilkan {filteredAnggota.length} dari {anggota.length} anggota
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
      
      {/* Dialogs */}
      <UserDetailDialog 
        user={selectedUser} 
        open={detailDialogOpen} 
        onOpenChange={setDetailDialogOpen} 
      />
      
      <EditUserForm 
        user={selectedUser} 
        open={editDialogOpen} 
        onOpenChange={setEditDialogOpen}
        onUserUpdated={fetchAnggota}
      />
      
      <UserTransactions 
        user={selectedUser} 
        open={transactionsDialogOpen} 
        onOpenChange={setTransactionsDialogOpen} 
      />
      
      <ToggleUserStatus 
        user={selectedUser} 
        open={statusDialogOpen} 
        onOpenChange={setStatusDialogOpen}
        onStatusChanged={fetchAnggota}
      />
      
      {selectedUser && (
        <Dialog open={savingsDialogOpen} onOpenChange={setSavingsDialogOpen}>
          <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-hidden p-0">
            <div className="flex justify-between items-center px-6 py-4 sticky top-0 bg-background z-10 border-b">
              <div>
                <DialogTitle>Jenis Tabungan {selectedUser.nama}</DialogTitle>
                <DialogDescription>
                  Berikut adalah daftar jenis tabungan yang dimiliki oleh anggota ini.
                </DialogDescription>
              </div>
              <DialogClose className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 15 15" fill="none" className="h-4 w-4">
                  <path d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z" fill="currentColor"></path>
                </svg>
                <span className="sr-only">Close</span>
              </DialogClose>
            </div>
            <SavingsDetails userId={selectedUser.id} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
