"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Download, Search, SlidersHorizontal, CheckCircle, XCircle, RefreshCcw } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from '@supabase/supabase-js'
import { downloadCSV, formatDataForExport } from '@/utils/export-data'

// Create a direct Supabase client instance to ensure we're using the latest credentials
const supabaseUrl = 'https://hyiwhckxwrngegswagrb.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5aXdoY2t4d3JuZ2Vnc3dhZ3JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0OTY4MzcsImV4cCI6MjA2MTA3MjgzN30.bpDSX9CUEA0F99x3cwNbeTVTVq-NHw5GC5jmp2QqnNM'
const supabase = createClient(supabaseUrl, supabaseAnonKey)
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { useToast } from "@/components/ui/use-toast"

// Define types based on database schema
type Pendaftaran = {
  id: string
  submission_id: string
  nama: string
  noIdentitas: string
  noTelepon: string
  status: string
  created_at: string
  updated_at: string
  akun_id: string
  alasan_penolakan: string | null
}

export default function ApprovalsPage() {
  const { toast } = useToast()
  const [pendingApprovals, setPendingApprovals] = useState<Pendaftaran[]>([])
  const [approvedCustomers, setApprovedCustomers] = useState<Pendaftaran[]>([])
  const [rejectedCustomers, setRejectedCustomers] = useState<Pendaftaran[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [rejectReason, setRejectReason] = useState("")
  const [selectedCustomer, setSelectedCustomer] = useState<Pendaftaran | null>(null)
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  
  // Advanced filter states
  const [dateStart, setDateStart] = useState('')
  const [dateEnd, setDateEnd] = useState('')
  const [identityType, setIdentityType] = useState('')
  const [city, setCity] = useState('')

  // Function to fetch data from Supabase
  const fetchData = async () => {
    setIsLoading(true)
    try {
      console.log('Fetching data from Supabase...')
      
      // First, let's check all statuses to debug
      const { data: allStatuses, error: statusError } = await supabase
        .from('pendaftaran')
        .select('status')
        .order('status')
      
      if (statusError) throw statusError
      console.log('All statuses in database:', allStatuses.map(s => s.status))
      
      // Fetch all records to debug
      const { data: allRecords, error: allError } = await supabase
        .from('pendaftaran')
        .select('*')
      
      if (allError) throw allError
      console.log('Total records in pendaftaran:', allRecords.length)
      
      // Fetch pending approvals - use ilike for case insensitive matching
      const { data: pending, error: pendingError } = await supabase
        .from('pendaftaran')
        .select('*')
        .ilike('status', '%menunggu%') // Case insensitive, trim whitespace with %
        .order('created_at', { ascending: false })
      
      if (pendingError) throw pendingError
      console.log('Pending approvals found:', pending?.length || 0)
      console.log('Pending approvals data:', pending)
      
      // Fetch approved customers
      const { data: approved, error: approvedError } = await supabase
        .from('pendaftaran')
        .select('*')
        .ilike('status', '%diterima%') // Case insensitive
        .order('created_at', { ascending: false })
      
      if (approvedError) throw approvedError
      
      // Fetch rejected customers
      const { data: rejected, error: rejectedError } = await supabase
        .from('pendaftaran')
        .select('*')
        .ilike('status', '%ditolak%') // Case insensitive
        .order('created_at', { ascending: false })
      
      if (rejectedError) throw rejectedError
      
      // Set state with the fetched data
      setPendingApprovals(pending || [])
      setApprovedCustomers(approved || [])
      setRejectedCustomers(rejected || [])
      
      // Log the state update
      console.log('State updated with:', {
        pending: pending?.length || 0,
        approved: approved?.length || 0,
        rejected: rejected?.length || 0
      })
    } catch (error) {
      console.error('Error fetching data:', error)
      toast({
        title: 'Error',
        description: 'Gagal memuat data. Silakan coba lagi.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Function to approve a customer
  const approveCustomer = async (customer: Pendaftaran) => {
    setIsProcessing(true)
    try {
      console.log('Approving customer:', customer) // Debug log
      
      // Verify customer data is valid
      if (!customer || !customer.id) {
        throw new Error('Data nasabah tidak valid')
      }
      
      if (!customer.akun_id) {
        throw new Error('ID akun tidak ditemukan')
      }
      
      // Start a transaction by using the same timestamp for both updates
      const now = new Date().toISOString()
      
      // First, verify the current status to ensure we're not processing an already approved customer
      const { data: currentData, error: checkError } = await supabase
        .from('pendaftaran')
        .select('status')
        .eq('id', customer.id)
        .single()
      
      if (checkError) {
        console.error('Error checking current status:', checkError)
        throw checkError
      }
      
      if (currentData.status !== 'menunggu') {
        console.warn(`Customer ${customer.nama} is not in 'menunggu' status (current: ${currentData.status})`)
        toast({
          title: 'Perhatian',
          description: `Nasabah ${customer.nama} tidak dalam status menunggu persetujuan.`,
          variant: 'default'
        })
        return
      }
      
      // Update pendaftaran status to 'diterima'
      const { error: updatePendaftaranError } = await supabase
        .from('pendaftaran')
        .update({ 
          status: 'diterima',
          updated_at: now
        })
        .eq('id', customer.id)
      
      if (updatePendaftaranError) {
        console.error('Error updating pendaftaran:', updatePendaftaranError)
        throw updatePendaftaranError
      }
      
      console.log(`Successfully updated pendaftaran status to 'diterima' for customer ${customer.nama}`)
      
      // Update akun is_active to true
      const { error: updateAkunError } = await supabase
        .from('akun')
        .update({ 
          is_active: true,
          updated_at: now
        })
        .eq('id', customer.akun_id)
      
      if (updateAkunError) {
        console.error('Error updating akun:', updateAkunError)
        // If akun update fails, revert pendaftaran status
        const { error: revertError } = await supabase
          .from('pendaftaran')
          .update({ 
            status: 'menunggu',
            updated_at: now
          })
          .eq('id', customer.id)
        
        if (revertError) {
          console.error('Error reverting pendaftaran status:', revertError)
        }
        
        throw updateAkunError
      }
      
      console.log(`Successfully updated akun.is_active to true for customer ${customer.nama}`)
      
      toast({
        title: 'Berhasil',
        description: `Nasabah ${customer.nama} telah disetujui.`,
        variant: 'default'
      })
      
      // Refresh data
      await fetchData()
    } catch (error) {
      console.error('Error approving customer:', error)
      toast({
        title: 'Error',
        description: `Gagal menyetujui nasabah: ${error instanceof Error ? error.message : 'Silakan coba lagi.'}`,
        variant: 'destructive'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Function to reject a customer
  const rejectCustomer = async () => {
    // Validate inputs
    if (!selectedCustomer) {
      console.error('No customer selected for rejection')
      return
    }
    
    if (!rejectReason.trim()) {
      toast({
        title: 'Error',
        description: 'Alasan penolakan harus diisi.',
        variant: 'destructive'
      })
      return
    }
    
    setIsProcessing(true)
    try {
      console.log('Rejecting customer:', selectedCustomer)
      
      // Verify customer data is valid
      if (!selectedCustomer.id) {
        throw new Error('Data nasabah tidak valid')
      }
      
      // Start a transaction by using the same timestamp for both updates
      const now = new Date().toISOString()
      
      // First, verify the current status to ensure we're not processing an already rejected customer
      const { data: currentData, error: checkError } = await supabase
        .from('pendaftaran')
        .select('status')
        .eq('id', selectedCustomer.id)
        .single()
      
      if (checkError) {
        console.error('Error checking current status:', checkError)
        throw checkError
      }
      
      if (currentData.status !== 'menunggu') {
        console.warn(`Customer ${selectedCustomer.nama} is not in 'menunggu' status (current: ${currentData.status})`)
        toast({
          title: 'Perhatian',
          description: `Nasabah ${selectedCustomer.nama} tidak dalam status menunggu persetujuan.`,
          variant: 'default'
        })
        
        // Reset form and close dialog
        setRejectReason('')
        setIsRejectDialogOpen(false)
        setSelectedCustomer(null)
        return
      }
      
      // Update pendaftaran status to 'ditolak' and add rejection reason
      const { error: updatePendaftaranError } = await supabase
        .from('pendaftaran')
        .update({ 
          status: 'ditolak',
          alasan_penolakan: rejectReason,
          updated_at: now
        })
        .eq('id', selectedCustomer.id)
      
      if (updatePendaftaranError) {
        console.error('Error updating pendaftaran:', updatePendaftaranError)
        throw updatePendaftaranError
      }
      
      console.log(`Successfully updated pendaftaran status to 'ditolak' for customer ${selectedCustomer.nama}`)
      
      // Ensure akun remains inactive (is_active = false)
      if (selectedCustomer.akun_id) {
        const { error: updateAkunError } = await supabase
          .from('akun')
          .update({ 
            is_active: false,
            updated_at: now
          })
          .eq('id', selectedCustomer.akun_id)
        
        if (updateAkunError) {
          console.error('Error updating akun:', updateAkunError)
          // If akun update fails, revert pendaftaran status
          const { error: revertError } = await supabase
            .from('pendaftaran')
            .update({ 
              status: 'menunggu',
              alasan_penolakan: null,
              updated_at: now
            })
            .eq('id', selectedCustomer.id)
          
          if (revertError) {
            console.error('Error reverting pendaftaran status:', revertError)
          }
          
          throw updateAkunError
        }
        
        console.log(`Successfully confirmed akun.is_active is false for customer ${selectedCustomer.nama}`)
      } else {
        console.warn(`No akun_id found for customer ${selectedCustomer.nama}, skipping akun update`)
      }
      
      toast({
        title: 'Berhasil',
        description: `Nasabah ${selectedCustomer.nama} telah ditolak.`,
        variant: 'default'
      })
      
      // Reset form and close dialog
      setRejectReason('')
      setIsRejectDialogOpen(false)
      setSelectedCustomer(null)
      
      // Refresh data
      await fetchData()
    } catch (error) {
      console.error('Error rejecting customer:', error)
      toast({
        title: 'Error',
        description: `Gagal menolak nasabah: ${error instanceof Error ? error.message : 'Silakan coba lagi.'}`,
        variant: 'destructive'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Function to handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query)
    console.log('Search query:', query)
  }

  // Apply all filters
  const applyFilters = (data: Pendaftaran[]) => {
    if (!data.length) return []
    
    let filtered = [...data]
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(customer => 
        (customer.nama && customer.nama.toLowerCase().includes(query)) ||
        (customer.submission_id && customer.submission_id.toLowerCase().includes(query)) ||
        (customer.noIdentitas && customer.noIdentitas.toLowerCase().includes(query))
      )
    }
    
    // Apply date range filter
    if (dateStart) {
      const startDate = new Date(dateStart)
      filtered = filtered.filter(customer => {
        const customerDate = new Date(customer.created_at)
        return customerDate >= startDate
      })
    }
    
    if (dateEnd) {
      const endDate = new Date(dateEnd)
      // Set to end of day
      endDate.setHours(23, 59, 59, 999)
      filtered = filtered.filter(customer => {
        const customerDate = new Date(customer.created_at)
        return customerDate <= endDate
      })
    }
    
    // Apply identity type filter
    if (identityType) {
      filtered = filtered.filter(customer => 
        customer.noIdentitas && customer.noIdentitas.toLowerCase().includes(identityType.toLowerCase())
      )
    }
    
    // Apply city filter
    if (city) {
      filtered = filtered.filter(customer => {
        // This is a placeholder since the city field might not be directly in the Pendaftaran type
        // In a real implementation, you would check the appropriate field
        return true
      })
    }
    
    return filtered
  }
  
  // Reset all filters
  const resetFilters = () => {
    setSearchQuery('')
    setDateStart('')
    setDateEnd('')
    setIdentityType('')
    setCity('')
  }

  // Apply filters to each dataset
  const filteredPendingApprovals = applyFilters(pendingApprovals)
  const filteredApprovedCustomers = applyFilters(approvedCustomers)
  const filteredRejectedCustomers = applyFilters(rejectedCustomers)

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd MMM yyyy', { locale: id })
    } catch (error) {
      return dateString
    }
  }

  // Export functions for each tab
  const exportPendingData = (): void => {
    if (filteredPendingApprovals.length === 0) {
      toast({
        title: "Info",
        description: "Tidak ada data untuk diekspor",
        variant: "default"
      })
      return
    }

    // Define field mapping for export
    const fieldMap = {
      submission_id: "ID Pengajuan",
      nama: "Nama Nasabah",
      noIdentitas: "Nomor Identitas",
      noTelepon: "Nomor Telepon",
      created_at: "Tanggal Pengajuan",
      status: "Status"
    }

    // Format data with transformations
    const exportData = formatDataForExport(
      filteredPendingApprovals,
      fieldMap,
      {
        "Tanggal Pengajuan": (value) => formatDate(value),
        "Status": () => "Menunggu"
      }
    )

    // Download as CSV
    downloadCSV(exportData, `nasabah-menunggu-${new Date().toISOString().split('T')[0]}`)
    
    toast({
      title: "Berhasil",
      description: "Data nasabah berhasil diekspor",
      variant: "default"
    })
  }

  const exportApprovedData = (): void => {
    if (filteredApprovedCustomers.length === 0) {
      toast({
        title: "Info",
        description: "Tidak ada data untuk diekspor",
        variant: "default"
      })
      return
    }

    // Define field mapping for export
    const fieldMap = {
      submission_id: "ID Pengajuan",
      nama: "Nama Nasabah",
      noIdentitas: "Nomor Identitas",
      noTelepon: "Nomor Telepon",
      created_at: "Tanggal Pengajuan",
      updated_at: "Tanggal Disetujui",
      status: "Status"
    }

    // Format data with transformations
    const exportData = formatDataForExport(
      filteredApprovedCustomers,
      fieldMap,
      {
        "Tanggal Pengajuan": (value: string) => formatDate(value),
        "Tanggal Disetujui": (value: string) => formatDate(value),
        "Status": () => "Disetujui"
      }
    )

    // Download as CSV
    downloadCSV(exportData, `nasabah-disetujui-${new Date().toISOString().split('T')[0]}`)
    
    toast({
      title: "Berhasil",
      description: "Data nasabah berhasil diekspor",
      variant: "default"
    })
  }

  const exportRejectedData = (): void => {
    if (filteredRejectedCustomers.length === 0) {
      toast({
        title: "Info",
        description: "Tidak ada data untuk diekspor",
        variant: "default"
      })
      return
    }

    // Define field mapping for export
    const fieldMap = {
      submission_id: "ID Pengajuan",
      nama: "Nama Nasabah",
      noIdentitas: "Nomor Identitas",
      noTelepon: "Nomor Telepon",
      created_at: "Tanggal Pengajuan",
      updated_at: "Tanggal Ditolak",
      status: "Status",
      alasan_penolakan: "Alasan Penolakan"
    }

    // Format data with transformations
    const exportData = formatDataForExport(
      filteredRejectedCustomers,
      fieldMap,
      {
        "Tanggal Pengajuan": (value: string) => formatDate(value),
        "Tanggal Ditolak": (value: string) => formatDate(value),
        "Status": () => "Ditolak",
        "Alasan Penolakan": (value: string | null) => value || "-"
      }
    )

    // Download as CSV
    downloadCSV(exportData, `nasabah-ditolak-${new Date().toISOString().split('T')[0]}`)
    
    toast({
      title: "Berhasil",
      description: "Data nasabah berhasil diekspor",
      variant: "default"
    })
  }

  // Load data on component mount
  useEffect(() => {
    fetchData()
  }, [])
  
  // Apply filters when filter values change
  useEffect(() => {
    // The filters are applied in the filteredPendingApprovals, filteredApprovedCustomers, and filteredRejectedCustomers variables
    // This useEffect ensures the component re-renders when filter values change
  }, [searchQuery, dateStart, dateEnd, identityType, city, pendingApprovals, approvedCustomers, rejectedCustomers])

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Persetujuan Nasabah</h2>
      </div>
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">Menunggu Persetujuan</TabsTrigger>
          <TabsTrigger value="approved">Disetujui</TabsTrigger>
          <TabsTrigger value="rejected">Ditolak</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                type="search" 
                placeholder="Cari nasabah..." 
                className="w-full pl-8" 
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon" className="ml-auto" onClick={() => setShowFilters(!showFilters)}>
              <SlidersHorizontal className="h-4 w-4" />
              <span className="sr-only">Filter</span>
            </Button>
            <Button variant="outline" size="icon" onClick={() => fetchData()}>
              <RefreshCcw className="h-4 w-4" />
              <span className="sr-only">Refresh</span>
            </Button>
            <Button variant="outline" size="icon" onClick={exportPendingData}>
              <Download className="h-4 w-4" />
              <span className="sr-only">Export</span>
            </Button>
          </div>

          {showFilters && (
            <div className="rounded-md border p-4 shadow-sm mb-4">
              <h3 className="font-medium mb-2">Filter Lanjutan</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Tanggal Pengajuan</label>
                  <div className="flex gap-2 items-center">
                    <Input 
                      type="date" 
                      className="w-full" 
                      placeholder="Dari" 
                      value={dateStart}
                      onChange={(e) => setDateStart(e.target.value)}
                    />
                    <span>-</span>
                    <Input 
                      type="date" 
                      className="w-full" 
                      placeholder="Sampai" 
                      value={dateEnd}
                      onChange={(e) => setDateEnd(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Jenis Identitas</label>
                  <Input 
                    type="text" 
                    className="w-full" 
                    placeholder="KTP/SIM/Passport" 
                    value={identityType}
                    onChange={(e) => setIdentityType(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Asal Kota</label>
                  <Input 
                    type="text" 
                    className="w-full" 
                    placeholder="Kota" 
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <Button variant="outline" className="mr-2" onClick={() => {
                  resetFilters()
                  setShowFilters(false)
                }}>
                  Reset
                </Button>
                <Button onClick={() => setShowFilters(false)}>
                  Terapkan Filter
                </Button>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : filteredPendingApprovals.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Tidak ada nasabah yang menunggu persetujuan</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredPendingApprovals.map((customer) => (
                <Card key={customer.id}>
                  <CardHeader>
                    <CardTitle>{customer.nama}</CardTitle>
                    <CardDescription>ID: {customer.submission_id}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">No. Identitas:</span>
                      <span className="text-sm font-medium">{customer.noIdentitas}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Telepon:</span>
                      <span className="text-sm font-medium">{customer.noTelepon}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Tanggal Pengajuan:</span>
                      <span className="text-sm font-medium">{formatDate(customer.created_at)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Status:</span>
                      <Badge variant="outline">Menunggu</Badge>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline">Lihat Detail</Button>
                    <div className="flex gap-2">
                      <Button 
                        variant="destructive" 
                        size="icon"
                        disabled={isProcessing}
                        onClick={() => {
                          setSelectedCustomer(customer)
                          setIsRejectDialogOpen(true)
                        }}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="default" 
                        size="icon" 
                        className="bg-green-500 hover:bg-green-600"
                        disabled={isProcessing}
                        onClick={() => approveCustomer(customer)}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}

          {filteredPendingApprovals.length > 0 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Menampilkan {filteredPendingApprovals.length} nasabah
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                type="search" 
                placeholder="Cari nasabah..." 
                className="w-full pl-8" 
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon" className="ml-auto" onClick={() => fetchData()}>
              <Download className="h-4 w-4" />
              <span className="sr-only">Refresh</span>
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : filteredApprovedCustomers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Tidak ada nasabah yang disetujui</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>No. Identitas</TableHead>
                    <TableHead>Telepon</TableHead>
                    <TableHead>Tanggal Disetujui</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApprovedCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">{customer.submission_id}</TableCell>
                      <TableCell>{customer.nama}</TableCell>
                      <TableCell>{customer.noIdentitas}</TableCell>
                      <TableCell>{customer.noTelepon}</TableCell>
                      <TableCell>{formatDate(customer.updated_at)}</TableCell>
                      <TableCell>
                        <Badge className="bg-green-500">Disetujui</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                type="search" 
                placeholder="Cari nasabah..." 
                className="w-full pl-8" 
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon" className="ml-auto" onClick={() => fetchData()}>
              <Download className="h-4 w-4" />
              <span className="sr-only">Refresh</span>
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : filteredRejectedCustomers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Tidak ada nasabah yang ditolak</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>No. Identitas</TableHead>
                    <TableHead>Telepon</TableHead>
                    <TableHead>Tanggal Ditolak</TableHead>
                    <TableHead>Alasan Penolakan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRejectedCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">{customer.submission_id}</TableCell>
                      <TableCell>{customer.nama}</TableCell>
                      <TableCell>{customer.noIdentitas}</TableCell>
                      <TableCell>{customer.noTelepon}</TableCell>
                      <TableCell>{formatDate(customer.updated_at)}</TableCell>
                      <TableCell>{customer.alasan_penolakan}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Rejection Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tolak Pendaftaran Nasabah</DialogTitle>
            <DialogDescription>
              Masukkan alasan penolakan untuk nasabah {selectedCustomer?.nama}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="reason">Alasan Penolakan</Label>
              <Textarea
                id="reason"
                placeholder="Masukkan alasan penolakan"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)} disabled={isProcessing}>
              Batal
            </Button>
            <Button onClick={rejectCustomer} disabled={isProcessing || !rejectReason.trim()}>
              {isProcessing ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></div>
                  Memproses
                </>
              ) : (
                'Tolak Nasabah'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
