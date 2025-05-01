"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Download, Search, SlidersHorizontal, CheckCircle, XCircle } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from '@supabase/supabase-js'

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
  const [searchQuery, setSearchQuery] = useState("")
  const [rejectReason, setRejectReason] = useState("")
  const [selectedCustomer, setSelectedCustomer] = useState<Pendaftaran | null>(null)
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

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
  }

  // Filter data based on search query
  const filteredPendingApprovals = pendingApprovals.filter(customer => 
    customer.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.submission_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.noIdentitas.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredApprovedCustomers = approvedCustomers.filter(customer => 
    customer.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.submission_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.noIdentitas.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredRejectedCustomers = rejectedCustomers.filter(customer => 
    customer.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.submission_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.noIdentitas.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd MMM yyyy', { locale: id })
    } catch (error) {
      return dateString
    }
  }

  // Load data on component mount
  useEffect(() => {
    fetchData()
  }, [])

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
            <Button variant="outline" size="icon" className="ml-auto">
              <SlidersHorizontal className="h-4 w-4" />
              <span className="sr-only">Filter</span>
            </Button>
            <Button variant="outline" size="icon" onClick={() => fetchData()}>
              <Download className="h-4 w-4" />
              <span className="sr-only">Refresh</span>
            </Button>
          </div>

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
