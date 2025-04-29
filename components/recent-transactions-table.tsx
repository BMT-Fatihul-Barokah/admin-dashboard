"use client"

import { useEffect, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { getRecentTransactions, Transaksi } from "@/lib/supabase"
import { format } from "date-fns"

export function RecentTransactionsTable() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTransactions() {
      try {
        const data = await getRecentTransactions(5);
        setTransactions(data);
      } catch (error) {
        console.error("Error fetching transactions:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchTransactions();
  }, []);

  // Format currency
  const formatCurrency = (amount: number) => {
    return `Rp ${amount.toLocaleString('id-ID')}`;
  };

  // Map transaction type to status for display
  const getStatusFromType = (type: string) => {
    switch (type.toLowerCase()) {
      case 'setoran':
      case 'simpanan':
        return 'success';
      case 'pinjaman':
        return 'processing';
      case 'penarikan':
        return 'warning';
      default:
        return 'default';
    }
  };

  if (loading) {
    return <div className="flex justify-center py-4">Memuat data transaksi...</div>;
  }

  if (transactions.length === 0) {
    return <div className="text-center py-4 text-muted-foreground">Tidak ada transaksi terbaru</div>;
  }

  return (
    <div className="space-y-4">
      {transactions.map((transaction) => (
        <div key={transaction.id} className="flex items-center">
          <Avatar className="h-9 w-9">
            <AvatarImage src={`/placeholder.svg`} alt={transaction.anggota?.nama || 'Anggota'} />
            <AvatarFallback>{(transaction.anggota?.nama || 'A').charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">{transaction.anggota?.nama || 'Anggota'}</p>
            <p className="text-sm text-muted-foreground">{transaction.kategori}</p>
          </div>
          <div className="ml-auto font-medium">{formatCurrency(transaction.jumlah)}</div>
          <div className="ml-2">
            <Badge
              variant={
                getStatusFromType(transaction.tipe_transaksi) === "success"
                  ? "default"
                  : getStatusFromType(transaction.tipe_transaksi) === "processing"
                    ? "outline"
                    : getStatusFromType(transaction.tipe_transaksi) === "warning"
                      ? "secondary"
                      : "destructive"
              }
            >
              {transaction.tipe_transaksi}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  )
}
