"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Loader2, Plus } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AddSavingsAccount } from "./add-savings-account"

interface MemberSavingsTypesProps {
  userId: string
  userName: string
}

interface SavingsType {
  id: string
  kode: string
  nama: string
  is_active: boolean
  has_account: boolean
  account_id?: string
  balance: number
}

export function MemberSavingsTypes({ userId, userName }: MemberSavingsTypesProps) {
  const { toast } = useToast()
  const [savingsTypes, setSavingsTypes] = useState<SavingsType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [addSavingsDialogOpen, setAddSavingsDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [accountToDelete, setAccountToDelete] = useState<{id: string, name: string} | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Format currency function
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  // Fetch savings types with info about whether the member has an account of that type
  const fetchMemberSavingsTypes = async () => {
    setIsLoading(true)
    setError(null) // Reset error state
    
    try {
      // Get all savings types
      const { data: allTypes, error: typesError } = await supabase
        .from('jenis_tabungan')
        .select('id, kode, nama')
        .order('kode', { ascending: true })
      
      if (typesError) throw typesError
      
      if (!allTypes || allTypes.length === 0) {
        setSavingsTypes([])
        return
      }
      
      // Get member's active accounts with balance
      const { data: memberAccounts, error: accountsError } = await supabase
        .from('tabungan')
        .select('id, jenis_tabungan_id, saldo')
        .eq('anggota_id', userId)
        .eq('status', 'aktif')
      
      if (accountsError) throw accountsError
      
      // Create map of member's account types with balance
      const memberAccountMap = new Map();
      const balanceMap = new Map();
      (memberAccounts || []).forEach(account => {
        memberAccountMap.set(account.jenis_tabungan_id, account.id);
        balanceMap.set(account.jenis_tabungan_id, account.saldo || 0);
      });
      
      // Combine information
      const typesWithAccountInfo = allTypes.map((type: any) => ({
        id: type.id,
        kode: type.kode,
        nama: type.nama,
        is_active: true, // Default value
        has_account: memberAccountMap.has(type.id),
        account_id: memberAccountMap.get(type.id),
        balance: balanceMap.get(type.id) || 0
      }))
      
      setSavingsTypes(typesWithAccountInfo)
    } catch (error) {
      console.error('Error fetching member savings types:', error)
      setError('Gagal memuat data jenis tabungan')
    } finally {
      setIsLoading(false)
    }
  }

  // Fungsi untuk menghapus tabungan
  const deleteAccount = async (accountId: string) => {
    setIsDeleting(true)
    try {
      const { data, error } = await supabase.rpc('delete_tabungan', {
        p_tabungan_id: accountId
      });
      
      if (error) throw error;
      
      if (data === false) {
        toast({
          title: "Tidak dapat menghapus tabungan",
          description: "Tabungan ini memiliki transaksi atau sedang digunakan",
          variant: "destructive"
        });
        return;
      }
      
      toast({
        title: "Berhasil",
        description: "Tabungan berhasil dihapus",
        variant: "default"
      });
      
      // Refresh data
      fetchMemberSavingsTypes();
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error deleting savings account:', error);
      toast({
        title: "Error",
        description: "Gagal menghapus tabungan",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchMemberSavingsTypes()
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
        <Button variant="outline" onClick={() => fetchMemberSavingsTypes()}>
          Coba Lagi
        </Button>
      </div>
    )
  }

  if (savingsTypes.length === 0) {
    return (
      <div className="flex flex-col items-center py-8 text-center">
        <p className="text-muted-foreground mb-4">Tidak ada jenis tabungan yang tersedia</p>
      </div>
    )
  }

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Jenis Tabungan {userName}</h3>
        <Button onClick={() => setAddSavingsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah Tabungan
        </Button>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kode</TableHead>
              <TableHead>Nama</TableHead>
              <TableHead>Saldo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {savingsTypes.map((type) => (
              <TableRow key={type.id}>
                <TableCell className="font-medium">{type.kode}</TableCell>
                <TableCell>{type.nama}</TableCell>
                <TableCell>{type.has_account ? formatCurrency(type.balance) : '-'}</TableCell>
                <TableCell>
                  <Badge
                    variant={type.has_account ? "default" : "outline"}
                    className={type.has_account ? "bg-green-500 hover:bg-green-600" : ""}
                  >
                    {type.has_account ? 'Dimiliki' : 'Belum Dimiliki'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {type.has_account && (
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => {
                        setAccountToDelete({
                          id: type.account_id || '',
                          name: type.nama
                        });
                        setDeleteDialogOpen(true);
                      }}
                    >
                      Hapus
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {/* Add Savings Account Dialog */}
      <Dialog open={addSavingsDialogOpen} onOpenChange={setAddSavingsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Tambah Tabungan Baru</DialogTitle>
            <DialogDescription>
              Tambahkan jenis tabungan baru untuk {userName}.
            </DialogDescription>
          </DialogHeader>
          <AddSavingsAccount 
            userId={userId} 
            userName={userName} 
            onSuccess={() => {
              setAddSavingsDialogOpen(false)
              fetchMemberSavingsTypes()
            }} 
          />
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Hapus Tabungan</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus tabungan {accountToDelete?.name}?
              <br /><br />
              <strong className="text-destructive">Perhatian:</strong> Tabungan yang memiliki riwayat transaksi tidak dapat dihapus.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Batal</Button>
            <Button 
              variant="destructive" 
              onClick={() => accountToDelete && deleteAccount(accountToDelete.id)}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menghapus...
                </>
              ) : (
                'Hapus'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
