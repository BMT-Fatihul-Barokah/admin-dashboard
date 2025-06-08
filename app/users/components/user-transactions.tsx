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

// Create a direct Supabase client instance using environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

type Anggota = {
  id: string
  nama: string
}

type Transaksi = {
  id: string
  anggota_id: string
  tipe_transaksi: string
  source_type: string
  deskripsi?: string
  jumlah: number
  sebelum: number
  sesudah: number
  pembiayaan_id?: string
  tabungan_id?: string
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
      // Use the RPC function to get transactions
      const { data, error } = await supabase
        .rpc('get_anggota_transactions', {
          anggota_id_param: user.id
        })
      
      if (error) throw error
      
      setTransactions(data || [])
    } catch (error) {
      console.error('Error fetching transactions:', error)
      
      // Fallback to direct query if RPC fails
      try {
        const { data, error: fallbackError } = await supabase
          .from('transaksi')
          .select('*')
          .eq('anggota_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50)
        
        if (fallbackError) throw fallbackError
        
        setTransactions(data || [])
      } catch (fallbackError) {
        console.error('Fallback query also failed:', fallbackError)
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px]">
        <DialogHeader>
          <DialogTitle>Riwayat Transaksi</DialogTitle>
          <DialogDescription>
            Riwayat transaksi untuk anggota {user.nama}
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
            <div className="max-h-[60vh] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Jenis</TableHead>
                    <TableHead>Sumber</TableHead>
                    <TableHead>Deskripsi</TableHead>
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
                      <TableCell>{transaction.source_type}</TableCell>
                      <TableCell>{transaction.deskripsi || '-'}</TableCell>
                      <TableCell className="text-right font-medium">
                        <span className={transaction.tipe_transaksi === 'kredit' ? 'text-green-600' : 'text-red-600'}>
                          {transaction.tipe_transaksi === 'kredit' ? '+' : '-'} Rp {Number(transaction.jumlah).toLocaleString('id-ID')}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        Rp {Number(transaction.sesudah).toLocaleString('id-ID')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
        
        <div className="flex justify-center items-center mt-4">
          <p className="text-sm text-muted-foreground">
            Menampilkan {transactions.length} transaksi terakhir
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
