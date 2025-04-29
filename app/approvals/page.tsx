import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Download, Search, SlidersHorizontal, CheckCircle, XCircle } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function ApprovalsPage() {
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
              <Input type="search" placeholder="Cari nasabah..." className="w-full pl-8" />
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

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pendingApprovals.map((approval) => (
              <Card key={approval.id}>
                <CardHeader>
                  <CardTitle>{approval.name}</CardTitle>
                  <CardDescription>ID: {approval.id}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">NIK:</span>
                    <span className="text-sm font-medium">{approval.nik}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Email:</span>
                    <span className="text-sm font-medium">{approval.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Telepon:</span>
                    <span className="text-sm font-medium">{approval.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Tanggal Pengajuan:</span>
                    <span className="text-sm font-medium">{approval.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <Badge variant="outline">Menunggu</Badge>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline">Lihat Detail</Button>
                  <div className="flex gap-2">
                    <Button variant="destructive" size="icon">
                      <XCircle className="h-4 w-4" />
                    </Button>
                    <Button variant="default" size="icon" className="bg-green-500 hover:bg-green-600">
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">Menampilkan 1-6 dari 15 nasabah</div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="icon">
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Halaman sebelumnya</span>
              </Button>
              <Button variant="outline" size="sm" className="h-8 w-8">
                1
              </Button>
              <Button variant="outline" size="sm" className="h-8 w-8">
                2
              </Button>
              <Button variant="outline" size="sm" className="h-8 w-8">
                3
              </Button>
              <Button variant="outline" size="icon">
                <ChevronRight className="h-4 w-4" />
                <span className="sr-only">Halaman berikutnya</span>
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder="Cari nasabah..." className="w-full pl-8" />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>NIK</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telepon</TableHead>
                  <TableHead>Tanggal Disetujui</TableHead>
                  <TableHead>Disetujui Oleh</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {approvedCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.id}</TableCell>
                    <TableCell>{customer.name}</TableCell>
                    <TableCell>{customer.nik}</TableCell>
                    <TableCell>{customer.email}</TableCell>
                    <TableCell>{customer.phone}</TableCell>
                    <TableCell>{customer.approvedDate}</TableCell>
                    <TableCell>{customer.approvedBy}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder="Cari nasabah..." className="w-full pl-8" />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>NIK</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telepon</TableHead>
                  <TableHead>Tanggal Ditolak</TableHead>
                  <TableHead>Alasan Penolakan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rejectedCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.id}</TableCell>
                    <TableCell>{customer.name}</TableCell>
                    <TableCell>{customer.nik}</TableCell>
                    <TableCell>{customer.email}</TableCell>
                    <TableCell>{customer.phone}</TableCell>
                    <TableCell>{customer.rejectedDate}</TableCell>
                    <TableCell>{customer.reason}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

const pendingApprovals = [
  {
    id: "APP-001",
    name: "Budi Santoso",
    nik: "3271046504980001",
    email: "budi.santoso@example.com",
    phone: "081234567890",
    date: "27 Apr 2023",
  },
  {
    id: "APP-002",
    name: "Siti Rahayu",
    nik: "3271046504980002",
    email: "siti.rahayu@example.com",
    phone: "081234567891",
    date: "27 Apr 2023",
  },
  {
    id: "APP-003",
    name: "Ahmad Hidayat",
    nik: "3271046504980003",
    email: "ahmad.hidayat@example.com",
    phone: "081234567892",
    date: "26 Apr 2023",
  },
  {
    id: "APP-004",
    name: "Dewi Lestari",
    nik: "3271046504980004",
    email: "dewi.lestari@example.com",
    phone: "081234567893",
    date: "26 Apr 2023",
  },
  {
    id: "APP-005",
    name: "Eko Prasetyo",
    nik: "3271046504980005",
    email: "eko.prasetyo@example.com",
    phone: "081234567894",
    date: "25 Apr 2023",
  },
  {
    id: "APP-006",
    name: "Rina Wati",
    nik: "3271046504980006",
    email: "rina.wati@example.com",
    phone: "081234567895",
    date: "25 Apr 2023",
  },
]

const approvedCustomers = [
  {
    id: "APP-007",
    name: "Joko Widodo",
    nik: "3271046504980007",
    email: "joko.widodo@example.com",
    phone: "081234567896",
    approvedDate: "24 Apr 2023",
    approvedBy: "Admin",
  },
  {
    id: "APP-008",
    name: "Ani Yudhoyono",
    nik: "3271046504980008",
    email: "ani.yudhoyono@example.com",
    phone: "081234567897",
    approvedDate: "24 Apr 2023",
    approvedBy: "Admin",
  },
  {
    id: "APP-009",
    name: "Bambang Pamungkas",
    nik: "3271046504980009",
    email: "bambang.pamungkas@example.com",
    phone: "081234567898",
    approvedDate: "23 Apr 2023",
    approvedBy: "Admin",
  },
  {
    id: "APP-010",
    name: "Ratna Sari",
    nik: "3271046504980010",
    email: "ratna.sari@example.com",
    phone: "081234567899",
    approvedDate: "23 Apr 2023",
    approvedBy: "Admin",
  },
]

const rejectedCustomers = [
  {
    id: "APP-011",
    name: "Agus Salim",
    nik: "3271046504980011",
    email: "agus.salim@example.com",
    phone: "081234567800",
    rejectedDate: "22 Apr 2023",
    reason: "Dokumen tidak lengkap",
  },
  {
    id: "APP-012",
    name: "Dian Sastro",
    nik: "3271046504980012",
    email: "dian.sastro@example.com",
    phone: "081234567801",
    rejectedDate: "22 Apr 2023",
    reason: "Data tidak valid",
  },
  {
    id: "APP-013",
    name: "Rudi Hartono",
    nik: "3271046504980013",
    email: "rudi.hartono@example.com",
    phone: "081234567802",
    rejectedDate: "21 Apr 2023",
    reason: "Riwayat kredit buruk",
  },
  {
    id: "APP-014",
    name: "Tuti Wibowo",
    nik: "3271046504980014",
    email: "tuti.wibowo@example.com",
    phone: "081234567803",
    rejectedDate: "21 Apr 2023",
    reason: "Alamat tidak ditemukan",
  },
]
