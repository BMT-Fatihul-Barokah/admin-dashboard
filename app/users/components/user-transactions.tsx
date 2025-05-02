"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { createClient } from '@supabase/supabase-js'
import { format, parseISO } from "date-fns"
import { id } from "date-fns/locale"
import { ArrowDownIcon, ArrowUpIcon, Loader2 } from "lucide-react"

// Create a direct Supabase client instance
const supabaseUrl = 'https://hyiwhckxwrngegswagrb.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5aXdoY2t4d3JuZ2Vnc3dhZ3JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0OTY4MzcsImV4cCI6MjA2MTA3MjgzN30.bpDSX9CUEA0F99x3cwNbeTVTVq-NHw5GC5jmp2QqnNM'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

type Anggota = {
  id: string
  nama: string
  nomor_rekening: string
  saldo: number
}

type Transaksi = {
  id: string
  anggota_id: string
  tipe_transaksi: string
  kategori: string
  deskripsi?: string
  reference_number?: string
  jumlah: number
  saldo_sebelum: number
  saldo_sesudah: number
  pinjaman_id?: string
  created_at: string
  updated_at: string
}

interface UserTransactionsProps {
  user: Anggota | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UserTransactions({ user, open, onOpenChange }: UserTransactionsProps) {
  const [transactions, setTransactions] = useState<Transaksi[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Format date function
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'dd MMM yyyy HH:mm', { locale: id })
    } catch (error) {
      return dateString
    }
  }

  // Fetch user transactions
  useEffect(() => {
    if (open && user) {
      fetchTransactions()
    }
  }, [open, user])

  const fetchTransactions = async () => {
    if (!user) return
    
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('transaksi')
        .select('*')
        .eq('anggota_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)
      
      if (error) throw error
      
      setTransactions(data || [])
    } catch (error) {
      console.error('Error fetching transactions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Riwayat Transaksi</DialogTitle>
          <DialogDescription>
            Riwayat transaksi untuk anggota {user.nama} ({user.nomor_rekening})
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Tidak ada riwayat transaksi</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead>Referensi</TableHead>
                  <TableHead className="text-right">Jumlah</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{formatDate(transaction.created_at)}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={transaction.tipe_transaksi === 'kredit' ? 'default' : 'outline'}
                        className={transaction.tipe_transaksi === 'kredit' 
                          ? "bg-green-500 hover:bg-green-600" 
                          : "text-red-500 border-red-500"
                        }
                      >
                        {transaction.tipe_transaksi === 'kredit' ? (
                          <ArrowDownIcon className="mr-1 h-3 w-3" />
                        ) : (
                          <ArrowUpIcon className="mr-1 h-3 w-3" />
                        )}
                        {transaction.tipe_transaksi === 'kredit' ? 'Masuk' : 'Keluar'}
                      </Badge>
                    </TableCell>
                    <TableCell>{transaction.kategori}</TableCell>
                    <TableCell>{transaction.deskripsi || '-'}</TableCell>
                    <TableCell>{transaction.reference_number || '-'}</TableCell>
                    <TableCell className="text-right font-medium">
                      <span className={transaction.tipe_transaksi === 'kredit' ? 'text-green-600' : 'text-red-600'}>
                        {transaction.tipe_transaksi === 'kredit' ? '+' : '-'} Rp {Number(transaction.jumlah).toLocaleString('id-ID')}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      Rp {Number(transaction.saldo_sesudah).toLocaleString('id-ID')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        
        <div className="flex justify-between items-center mt-4">
          <p className="text-sm text-muted-foreground">
            Menampilkan {transactions.length} transaksi terakhir
          </p>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Tutup
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
