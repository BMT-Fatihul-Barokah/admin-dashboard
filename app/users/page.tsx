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
import { getAllAnggota, Anggota } from "@/lib/supabase"
import { format, parseISO } from "date-fns"

export default async function UsersPage() {
  // Fetch anggota data from Supabase
  const anggota = await getAllAnggota();
  
  // Format date function
  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, 'dd MMM yyyy');
    } catch (error) {
      return dateString;
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Manajemen Anggota</h2>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Anggota
        </Button>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input type="search" placeholder="Cari anggota..." className="w-full pl-8" />
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
              <TableHead>No. Rekening</TableHead>
              <TableHead>Nama</TableHead>
              <TableHead>Alamat</TableHead>
              <TableHead>Saldo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tanggal Bergabung</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {anggota.map((member) => (
              <TableRow key={member.id}>
                <TableCell className="font-medium">{member.nomor_rekening}</TableCell>
                <TableCell>{member.nama}</TableCell>
                <TableCell>{member.alamat || '-'}</TableCell>
                <TableCell>Rp {Number(member.saldo).toLocaleString('id-ID')}</TableCell>
                <TableCell>
                  <Badge
                    variant={member.is_active ? "default" : "destructive"}
                    className={member.is_active ? "bg-green-500 hover:bg-green-600" : ""}
                  >
                    {member.is_active ? 'Aktif' : 'Nonaktif'}
                  </Badge>
                </TableCell>
                <TableCell>{formatDate(member.created_at.toString())}</TableCell>
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
                      <DropdownMenuItem>Edit Anggota</DropdownMenuItem>
                      <DropdownMenuItem>Lihat Transaksi</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">
                        {member.is_active ? 'Nonaktifkan Anggota' : 'Aktifkan Anggota'}
                      </DropdownMenuItem>
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
          Menampilkan {anggota.length} anggota
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
