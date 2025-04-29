import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { ChevronLeft, ChevronRight, Download, MoreHorizontal, Plus, Search, SlidersHorizontal } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getAllTransactions, Transaksi } from "@/lib/supabase"
import { format, parseISO } from "date-fns"

export default async function TransactionsPage() {
  // Fetch transactions data from Supabase
  const transactions = await getAllTransactions();
  
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
  
  // Map transaction type to status for display
  const getStatusFromType = (type: string) => {
    switch (type.toLowerCase()) {
      case 'setoran':
      case 'simpanan':
        return 'Berhasil';
      case 'pinjaman':
        return 'Diproses';
      case 'penarikan':
        return 'Berhasil';
      default:
        return 'Berhasil';
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Manajemen Transaksi</h2>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Transaksi
        </Button>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input type="search" placeholder="Cari transaksi..." className="w-full pl-8" />
        </div>
        <div className="flex items-center gap-2">
          <Select defaultValue="all">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Jenis Transaksi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Jenis</SelectItem>
              <SelectItem value="simpanan">Simpanan</SelectItem>
              <SelectItem value="pinjaman">Pinjaman</SelectItem>
              <SelectItem value="penarikan">Penarikan</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="all">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kategori</SelectItem>
              <SelectItem value="simpanan">Simpanan</SelectItem>
              <SelectItem value="pinjaman">Pinjaman</SelectItem>
              <SelectItem value="angsuran">Angsuran</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="icon" className="ml-auto">
          <SlidersHorizontal className="h-4 w-4" />
          <span className="sr-only">Filter</span>
        </Button>
        <Button variant="outline" size="icon">
          <Download className="h-4 w-4" />
          <span className="sr-only">Download</span>
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID Transaksi</TableHead>
              <TableHead>Nama Anggota</TableHead>
              <TableHead>Jenis</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Jumlah</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell className="font-medium">
                  {transaction.reference_number || transaction.id.substring(0, 8)}
                </TableCell>
                <TableCell>{transaction.anggota?.nama || 'Anggota'}</TableCell>
                <TableCell>{transaction.tipe_transaksi}</TableCell>
                <TableCell>{transaction.kategori}</TableCell>
                <TableCell>{formatCurrency(Number(transaction.jumlah))}</TableCell>
                <TableCell>{formatDate(transaction.created_at.toString())}</TableCell>
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
                      <DropdownMenuItem>Lihat Detail</DropdownMenuItem>
                      <DropdownMenuItem>Cetak Bukti</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">Batalkan Transaksi</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Menampilkan {transactions.length} transaksi
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
    </div>
  )
}
