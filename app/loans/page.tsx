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
import { getAllPinjaman, Pinjaman } from "@/lib/supabase"
import { format, parseISO, differenceInMonths } from "date-fns"

export default async function LoansPage() {
  // Fetch pinjaman data from Supabase
  const pinjaman = await getAllPinjaman();
  
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
  
  // Calculate tenor in months
  const calculateTenor = (jatuhTempo: string, createdAt: string) => {
    try {
      const endDate = parseISO(jatuhTempo);
      const startDate = parseISO(createdAt);
      const months = differenceInMonths(endDate, startDate);
      return `${months} bulan`;
    } catch (error) {
      return '-';
    }
  };
  
  // Map status to badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'aktif':
        return {
          variant: 'default',
          className: 'bg-green-500 hover:bg-green-600'
        };
      case 'menunggu':
        return {
          variant: 'outline',
          className: ''
        };
      case 'lunas':
        return {
          variant: 'secondary',
          className: 'bg-blue-500 hover:bg-blue-600'
        };
      case 'terlambat':
        return {
          variant: 'destructive',
          className: ''
        };
      default:
        return {
          variant: 'default',
          className: ''
        };
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Manajemen Pinjaman</h2>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Pinjaman
        </Button>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input type="search" placeholder="Cari pinjaman..." className="w-full pl-8" />
        </div>
        <div className="flex items-center gap-2">
          <Select defaultValue="all">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="aktif">Aktif</SelectItem>
              <SelectItem value="menunggu">Menunggu</SelectItem>
              <SelectItem value="lunas">Lunas</SelectItem>
              <SelectItem value="terlambat">Terlambat</SelectItem>
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
              <TableHead>ID Pinjaman</TableHead>
              <TableHead>Nama Anggota</TableHead>
              <TableHead>Jumlah</TableHead>
              <TableHead>Sisa</TableHead>
              <TableHead>Bunga</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tanggal Pengajuan</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pinjaman.map((loan) => (
              <TableRow key={loan.id}>
                <TableCell className="font-medium">{loan.id.substring(0, 8)}</TableCell>
                <TableCell>{loan.anggota?.nama || 'Anggota'}</TableCell>
                <TableCell>{formatCurrency(Number(loan.jumlah))}</TableCell>
                <TableCell>{formatCurrency(Number(loan.sisa_pembayaran))}</TableCell>
                <TableCell>{loan.bunga_persen}%</TableCell>
                <TableCell>
                  <Badge
                    variant={getStatusBadgeVariant(loan.status).variant as any}
                    className={getStatusBadgeVariant(loan.status).className}
                  >
                    {loan.status}
                  </Badge>
                </TableCell>
                <TableCell>{formatDate(loan.created_at.toString())}</TableCell>
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
                      <DropdownMenuItem>Jadwal Pembayaran</DropdownMenuItem>
                      <DropdownMenuItem>Catat Pembayaran</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">Tandai Bermasalah</DropdownMenuItem>
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
          Menampilkan {pinjaman.length} pinjaman
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
