"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { Loader2 } from "lucide-react"
import { UserTransactions } from "./user-transactions"

interface SavingsDetailsProps {
  userId: string
}

interface SavingsAccount {
  id: string
  nomor_rekening: string
  anggota_id: string
  anggota_nama: string
  jenis_tabungan_id: string
  jenis_tabungan_kode: string
  jenis_tabungan_nama: string
  jenis_tabungan_deskripsi: string
  minimum_setoran: number
  saldo: number
  status: string
  tanggal_buka: string
  last_transaction_date?: string
}

export function SavingsDetails({ userId }: SavingsDetailsProps) {
  const [savingsAccounts, setSavingsAccounts] = useState<SavingsAccount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [transactionsOpen, setTransactionsOpen] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<SavingsAccount | null>(null)

  // Format currency function
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  // Format date function
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    try {
      return format(new Date(dateString), 'dd MMMM yyyy', { locale: id })
    } catch (error) {
      return dateString
    }
  }

  // Fetch savings accounts data using the tabungan_display_view
  const fetchSavingsAccounts = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      console.log('Fetching tabungan for anggota:', userId)
      
      // Use tabungan_display_view to get all data in one query
      const { data, error } = await supabase
        .from('tabungan_display_view')
        .select('*')
        .eq('anggota_id', userId)
      
      if (error) {
        console.error('Error fetching from view:', error)
        throw error
      }
      
      console.log('Received tabungan data:', data)
      
      if (!data || data.length === 0) {
        setSavingsAccounts([])
        return
      }
      
      // Transform data to match our component's expected format
      const accounts = data.map(item => ({
        id: item.id,
        nomor_rekening: item.nomor_rekening,
        anggota_id: item.anggota_id,
        anggota_nama: item.anggota_nama,
        jenis_tabungan_id: item.jenis_tabungan_id,
        jenis_tabungan_kode: item.jenis_tabungan_kode,
        jenis_tabungan_nama: item.jenis_tabungan_nama,
        jenis_tabungan_deskripsi: item.jenis_tabungan_deskripsi,
        minimum_setoran: item.minimum_setoran,
        saldo: parseFloat(item.saldo),
        status: item.status,
        tanggal_buka: item.tanggal_buka,
        last_transaction_date: item.last_transaction_date
      }));
      
      setSavingsAccounts(accounts)
    } catch (error: unknown) {
      console.error('Error fetching savings accounts:', error)
      setError('Gagal memuat data tabungan. Silakan coba lagi nanti.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (userId) {
      fetchSavingsAccounts()
    }
  }, [userId])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center py-8 text-center">
        <p className="text-destructive mb-4">{error}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Coba Lagi
        </Button>
      </div>
    )
  }

  if (savingsAccounts.length === 0) {
    return (
      <div className="flex flex-col items-center py-8 text-center">
        <p className="text-muted-foreground mb-4">Anggota ini belum memiliki tabungan</p>
      </div>
    )
  }

  return (
    <>
      <div className="overflow-y-auto px-6 py-4" style={{ maxHeight: 'calc(80vh - 150px)' }}>
        <div className="space-y-6">
        {savingsAccounts.map((account) => (
          <Card key={account.id}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{account.jenis_tabungan_nama}</CardTitle>
                  <CardDescription>{account.nomor_rekening}</CardDescription>
                </div>
                <Badge variant={account.status === 'active' ? 'default' : 'destructive'}>
                  {account.status === 'active' ? 'Aktif' : account.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <p className="text-sm font-medium">Saldo</p>
                  <p className="text-2xl font-bold">{formatCurrency(account.saldo)}</p>
                </div>
              </div>
              
              <div className="mt-3 space-y-1">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Jenis Tabungan</span>
                  <span className="text-sm font-medium">{account.jenis_tabungan_kode} - {account.jenis_tabungan_nama}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Deskripsi</span>
                  <span className="text-sm font-medium text-right max-w-[180px] truncate" title={account.jenis_tabungan_deskripsi}>{account.jenis_tabungan_deskripsi}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Tanggal Buka</span>
                  <span className="text-sm font-medium">{formatDate(account.tanggal_buka)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Setoran Minimum</span>
                  <span className="text-sm font-medium">{formatCurrency(account.minimum_setoran)}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => {
                  setSelectedAccount(account);
                  setTransactionsOpen(true);
                }}
              >
                Lihat Riwayat Transaksi
              </Button>
            </CardFooter>
          </Card>
        ))}
        </div>
      </div>


      {/* Transaction History Dialog */}
      {selectedAccount && (
        <UserTransactions 
          user={{
            id: userId,
            nama: selectedAccount.anggota_nama,
            nomor_rekening: selectedAccount.nomor_rekening,
            saldo: selectedAccount.saldo
          }}
          open={transactionsOpen}
          onOpenChange={setTransactionsOpen}
        />
      )}
      



    </>
  )
}
