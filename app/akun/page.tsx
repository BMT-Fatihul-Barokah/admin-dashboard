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
import { ChevronLeft, ChevronRight, Download, MoreHorizontal, Plus, Search, RefreshCcw, Loader2, Smartphone, UserCheck, Lock } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { format, parseISO } from "date-fns"
import { id } from "date-fns/locale"
import { useToast } from "@/components/ui/use-toast"
import { downloadCSV, formatDataForExport } from "@/utils/export-data"
import { supabase } from "@/lib/supabase"

// Import our custom components
import { AkunDetailDialog } from "./components/akun-detail-dialog"
import { EditAkunForm } from "./components/edit-akun-form"
import { ResetPinDialog } from "./components/reset-pin-dialog"
import { ToggleAkunStatus } from "./components/toggle-akun-status"

type Akun = {
  id: string
  nomor_telepon: string
  pin: string | null
  anggota_id: string | null
  created_at: Date | string
  updated_at: Date | string
  is_verified: boolean
  is_active: boolean
  anggota?: {
    nama: string
    nomor_rekening: string
  }
}

export default function AkunPage() {
  const { toast } = useToast()
  const [akun, setAkun] = useState<Akun[]>([])
  const [filteredAkun, setFilteredAkun] = useState<Akun[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [verificationFilter, setVerificationFilter] = useState<string>('all')
  
  // State for dialogs
  const [selectedAkun, setSelectedAkun] = useState<Akun | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [resetPinDialogOpen, setResetPinDialogOpen] = useState(false)
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  
  // Format date function
  const formatDate = (dateString: string | Date) => {
    try {
      const date = typeof dateString === 'string' ? parseISO(dateString) : dateString
      return format(date, 'dd MMM yyyy HH:mm', { locale: id })
    } catch (error) {
      return String(dateString)
    }
  }

  // Fetch akun data from Supabase
  const fetchAkun = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('akun')
        .select(`
          *,
          anggota:anggota_id (
            nama,
            nomor_rekening
          )
        `)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      setAkun(data || [])
      setFilteredAkun(data || [])
    } catch (error) {
      console.error('Error fetching akun:', error)
      toast({
        title: "Error",
        description: "Gagal memuat data akun. Silakan coba lagi.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Export akun data to CSV
  const exportAkunData = (): void => {
    if (filteredAkun.length === 0) {
      toast({
        title: "Info",
        description: "Tidak ada data untuk diekspor",
        variant: "default"
      })
      return
    }

    // Define field mapping for export
    const fieldMap = {
      nomor_telepon: "Nomor Telepon",
      "anggota.nama": "Nama Anggota",
      "anggota.nomor_rekening": "Nomor Rekening",
      is_verified: "Status Verifikasi",
      is_active: "Status Akun",
      created_at: "Tanggal Dibuat",
      updated_at: "Terakhir Diperbarui"
    }

    // Format data with transformations
    const exportData = formatDataForExport(
      filteredAkun,
      fieldMap,
      {
        "Tanggal Dibuat": (value: string) => formatDate(value),
        "Terakhir Diperbarui": (value: string) => formatDate(value),
        "Status Verifikasi": (value: boolean) => value ? "Terverifikasi" : "Belum Terverifikasi",
        "Status Akun": (value: boolean) => value ? "Aktif" : "Nonaktif",
        "Nama Anggota": (value: string | undefined) => value || "-",
        "Nomor Rekening": (value: string | undefined) => value || "-"
      }
    )

    // Download as CSV
    downloadCSV(exportData, `akun-${new Date().toISOString().split('T')[0]}`)
    
    toast({
      title: "Berhasil",
      description: "Data akun berhasil diekspor",
      variant: "default"
    })
  }

  // Apply all filters
  const applyFilters = () => {
    if (!akun.length) return
    
    let filtered = [...akun]
    
    // Apply search filter
    if (searchQuery.trim()) {
      const lowercaseQuery = searchQuery.toLowerCase()
      filtered = filtered.filter(account => 
        account.nomor_telepon.toLowerCase().includes(lowercaseQuery) ||
        (account.anggota?.nama && account.anggota.nama.toLowerCase().includes(lowercaseQuery)) ||
        (account.anggota?.nomor_rekening && account.anggota.nomor_rekening.toLowerCase().includes(lowercaseQuery))
      )
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      const isActive = statusFilter === 'active'
      filtered = filtered.filter(account => account.is_active === isActive)
    }
    
    // Apply verification filter
    if (verificationFilter !== 'all') {
      const isVerified = verificationFilter === 'verified'
      filtered = filtered.filter(account => account.is_verified === isVerified)
    }
    
    setFilteredAkun(filtered)
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
    setVerificationFilter('all')
    setFilteredAkun(akun)
  }

  // Load data on component mount
  useEffect(() => {
    fetchAkun()
  }, [])
  
  // Apply filters when filter values change
  useEffect(() => {
    applyFilters()
  }, [statusFilter, verificationFilter, searchQuery, akun])

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Manajemen Akun</h2>
        <PermissionGuard permission="edit_users">
          <Button onClick={() => {
            // Reset form and open dialog
            setSelectedAkun(null);
            setEditDialogOpen(true);
          }}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Akun
          </Button>
        </PermissionGuard>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            type="search" 
            placeholder="Cari akun..." 
            className="w-full pl-8" 
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Select 
            value={statusFilter} 
            onValueChange={setStatusFilter}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="active">Aktif</SelectItem>
              <SelectItem value="inactive">Nonaktif</SelectItem>
            </SelectContent>
          </Select>
          
          <Select 
            value={verificationFilter} 
            onValueChange={setVerificationFilter}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter Verifikasi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua</SelectItem>
              <SelectItem value="verified">Terverifikasi</SelectItem>
              <SelectItem value="unverified">Belum Terverifikasi</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm" onClick={resetFilters}>
            Reset
          </Button>
        </div>
        
        <div className="ml-auto"></div>
        <Button variant="outline" size="icon" onClick={fetchAkun} disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCcw className="h-4 w-4" />
          )}
          <span className="sr-only">Refresh</span>
        </Button>
        <PermissionGuard permission="generate_reports">
          <Button variant="outline" size="icon" onClick={exportAkunData}>
            <Download className="h-4 w-4" />
            <span className="sr-only">Export</span>
          </Button>
        </PermissionGuard>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredAkun.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Tidak ada akun yang ditemukan</p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nomor Telepon</TableHead>
                <TableHead>Nama Anggota</TableHead>
                <TableHead>Nomor Rekening</TableHead>
                <TableHead>Status Verifikasi</TableHead>
                <TableHead>Status Akun</TableHead>
                <TableHead>Tanggal Dibuat</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAkun.map((account) => (
                <TableRow key={account.id}>
                  <TableCell className="font-medium">{account.nomor_telepon}</TableCell>
                  <TableCell>{account.anggota?.nama || '-'}</TableCell>
                  <TableCell>{account.anggota?.nomor_rekening || '-'}</TableCell>
                  <TableCell>
                    <Badge
                      variant={account.is_verified ? "default" : "outline"}
                      className={account.is_verified ? "bg-blue-500 hover:bg-blue-600" : ""}
                    >
                      {account.is_verified ? 'Terverifikasi' : 'Belum Terverifikasi'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={account.is_active ? "default" : "destructive"}
                      className={account.is_active ? "bg-green-500 hover:bg-green-600" : ""}
                    >
                      {account.is_active ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(account.created_at)}</TableCell>
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
                          setSelectedAkun(account)
                          setDetailDialogOpen(true)
                        }}>
                          Lihat Detail
                        </DropdownMenuItem>
                        
                        {/* Edit Akun - Only users with edit_users permission */}
                        <PermissionGuard permission="edit_users">
                          <DropdownMenuItem onClick={() => {
                            setSelectedAkun(account)
                            setEditDialogOpen(true)
                          }}>
                            Edit Akun
                          </DropdownMenuItem>
                        </PermissionGuard>
                        
                        {/* Reset PIN - Only users with edit_users permission */}
                        <PermissionGuard permission="edit_users">
                          <DropdownMenuItem onClick={() => {
                            setSelectedAkun(account)
                            setResetPinDialogOpen(true)
                          }}>
                            Reset PIN
                          </DropdownMenuItem>
                        </PermissionGuard>
                        
                        {/* Only show separator if user has permission to activate/deactivate */}
                        <PermissionGuard permission="edit_users">
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className={account.is_active ? "text-destructive" : "text-green-600"}
                            onClick={() => {
                              setSelectedAkun(account)
                              setStatusDialogOpen(true)
                            }}
                          >
                            {account.is_active ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}
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
          Menampilkan {filteredAkun.length} dari {akun.length} akun
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
      <AkunDetailDialog 
        akun={selectedAkun} 
        open={detailDialogOpen} 
        onOpenChange={setDetailDialogOpen} 
      />
      
      <EditAkunForm 
        akun={selectedAkun} 
        open={editDialogOpen} 
        onOpenChange={setEditDialogOpen}
        onAkunUpdated={fetchAkun}
      />
      
      <ResetPinDialog 
        akun={selectedAkun} 
        open={resetPinDialogOpen} 
        onOpenChange={setResetPinDialogOpen}
        onPinReset={fetchAkun}
      />
      
      <ToggleAkunStatus 
        akun={selectedAkun} 
        open={statusDialogOpen} 
        onOpenChange={setStatusDialogOpen}
        onStatusChanged={fetchAkun}
      />
    </div>
  )
}
