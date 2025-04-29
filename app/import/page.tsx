"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, Database, RefreshCw } from "lucide-react"
import { Progress } from "@/components/ui/progress"

export default function ImportPage() {
  const [activeTab, setActiveTab] = useState("upload")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewData, setPreviewData] = useState<any[] | null>(null)
  const [importStatus, setImportStatus] = useState<"idle" | "processing" | "success" | "error">("idle")
  const [progress, setProgress] = useState(0)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      // Simulasi preview data
      // Dalam implementasi nyata, Anda akan membaca file Excel dan mengekstrak data
      setTimeout(() => {
        const mockPreviewData = [
          {
            id: "USR-001",
            name: "Budi Santoso",
            email: "budi.santoso@example.com",
            role: "Anggota",
            status: "Aktif",
            joinDate: "12 Jan 2023",
          },
          {
            id: "USR-002",
            name: "Siti Rahayu",
            email: "siti.rahayu@example.com",
            role: "Anggota",
            status: "Aktif",
            joinDate: "15 Jan 2023",
          },
          {
            id: "USR-003",
            name: "Ahmad Hidayat",
            email: "ahmad.hidayat@example.com",
            role: "Anggota",
            status: "Aktif",
            joinDate: "20 Jan 2023",
          },
          {
            id: "USR-004",
            name: "Dewi Lestari",
            email: "dewi.lestari@example.com",
            role: "Admin",
            status: "Aktif",
            joinDate: "25 Jan 2023",
          },
          {
            id: "USR-005",
            name: "Eko Prasetyo",
            email: "eko.prasetyo@example.com",
            role: "Anggota",
            status: "Nonaktif",
            joinDate: "01 Feb 2023",
          },
        ]
        setPreviewData(mockPreviewData)
        setActiveTab("preview")
      }, 1000)
    }
  }

  const handleImport = () => {
    setImportStatus("processing")
    setProgress(0)

    // Simulasi proses import
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setImportStatus("success")
          return 100
        }
        return prev + 10
      })
    }, 300)
  }

  const resetImport = () => {
    setSelectedFile(null)
    setPreviewData(null)
    setImportStatus("idle")
    setProgress(0)
    setActiveTab("upload")
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Import Data</h2>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="upload" disabled={importStatus === "processing"}>
            Upload File
          </TabsTrigger>
          <TabsTrigger value="preview" disabled={!previewData || importStatus === "processing"}>
            Preview Data
          </TabsTrigger>
          <TabsTrigger value="history">Riwayat Import</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upload File Excel</CardTitle>
              <CardDescription>
                Upload file Excel yang berisi data untuk diimpor ke dalam sistem. Format file harus sesuai dengan
                template yang disediakan.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg p-12">
                <div className="flex flex-col items-center justify-center space-y-4 text-center">
                  <div className="rounded-full bg-primary/10 p-4">
                    <FileSpreadsheet className="h-8 w-8 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-medium">Drag & drop file Excel atau klik untuk memilih</h3>
                    <p className="text-sm text-muted-foreground">
                      Mendukung format .xlsx dan .xls dengan ukuran maksimal 10MB
                    </p>
                  </div>
                  <label htmlFor="file-upload">
                    <div className="inline-flex cursor-pointer items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90">
                      <Upload className="mr-2 h-4 w-4" />
                      Pilih File
                    </div>
                    <input
                      id="file-upload"
                      type="file"
                      accept=".xlsx,.xls"
                      className="sr-only"
                      onChange={handleFileChange}
                      disabled={importStatus === "processing"}
                    />
                  </label>
                </div>
              </div>

              {selectedFile && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>File dipilih</AlertTitle>
                  <AlertDescription>
                    {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <h3 className="font-medium">Template File</h3>
                <p className="text-sm text-muted-foreground">
                  Unduh template file Excel untuk memastikan format data yang benar.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm">
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Template Data User
                  </Button>
                  <Button variant="outline" size="sm">
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Template Data Transaksi
                  </Button>
                  <Button variant="outline" size="sm">
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Template Data Pinjaman
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={resetImport} disabled={!selectedFile || importStatus === "processing"}>
                Reset
              </Button>
              <Button onClick={() => setActiveTab("preview")} disabled={!selectedFile || importStatus === "processing"}>
                Lanjutkan ke Preview
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Preview Data</CardTitle>
              <CardDescription>
                Tinjau data yang akan diimpor ke dalam sistem. Pastikan data sudah benar sebelum melanjutkan.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Select defaultValue="users">
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Pilih Jenis Data" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="users">Data User</SelectItem>
                    <SelectItem value="transactions">Data Transaksi</SelectItem>
                    <SelectItem value="loans">Data Pinjaman</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Menampilkan {previewData?.length || 0} dari {previewData?.length || 0} baris data
                </p>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Nama</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Tanggal Bergabung</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData?.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.id}</TableCell>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.role}</TableCell>
                        <TableCell>
                          <Badge
                            variant={user.status === "Aktif" ? "default" : "destructive"}
                            className={user.status === "Aktif" ? "bg-green-500 hover:bg-green-600" : ""}
                          >
                            {user.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{user.joinDate}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {importStatus === "processing" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Mengimpor data...</span>
                    <span className="text-sm text-muted-foreground">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}

              {importStatus === "success" && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <AlertTitle>Import berhasil</AlertTitle>
                  <AlertDescription>
                    {previewData?.length || 0} data telah berhasil diimpor ke dalam sistem.
                  </AlertDescription>
                </Alert>
              )}

              {importStatus === "error" && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Import gagal</AlertTitle>
                  <AlertDescription>
                    Terjadi kesalahan saat mengimpor data. Silakan coba lagi atau hubungi administrator.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setActiveTab("upload")} disabled={importStatus === "processing"}>
                Kembali
              </Button>
              <div className="flex gap-2">
                {importStatus === "success" ? (
                  <Button onClick={resetImport}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Import Baru
                  </Button>
                ) : (
                  <Button
                    onClick={handleImport}
                    disabled={importStatus === "processing"}
                    className={importStatus === "processing" ? "opacity-50 cursor-not-allowed" : ""}
                  >
                    <Database className="mr-2 h-4 w-4" />
                    {importStatus === "processing" ? "Mengimpor..." : "Import Data"}
                  </Button>
                )}
              </div>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Riwayat Import</CardTitle>
              <CardDescription>Daftar aktivitas import data yang telah dilakukan.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Jenis Data</TableHead>
                      <TableHead>Jumlah Data</TableHead>
                      <TableHead>Tanggal Import</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Diimpor Oleh</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importHistory.map((history) => (
                      <TableRow key={history.id}>
                        <TableCell className="font-medium">{history.id}</TableCell>
                        <TableCell>{history.type}</TableCell>
                        <TableCell>{history.count}</TableCell>
                        <TableCell>{history.date}</TableCell>
                        <TableCell>
                          <Badge
                            variant={history.status === "Berhasil" ? "default" : "destructive"}
                            className={history.status === "Berhasil" ? "bg-green-500 hover:bg-green-600" : ""}
                          >
                            {history.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{history.user}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

const importHistory = [
  {
    id: "IMP-001",
    type: "Data User",
    count: 150,
    date: "27 Apr 2023",
    status: "Berhasil",
    user: "Admin",
  },
  {
    id: "IMP-002",
    type: "Data Transaksi",
    count: 500,
    date: "26 Apr 2023",
    status: "Berhasil",
    user: "Admin",
  },
  {
    id: "IMP-003",
    type: "Data Pinjaman",
    count: 75,
    date: "25 Apr 2023",
    status: "Berhasil",
    user: "Admin",
  },
  {
    id: "IMP-004",
    type: "Data User",
    count: 50,
    date: "24 Apr 2023",
    status: "Gagal",
    user: "Admin",
  },
  {
    id: "IMP-005",
    type: "Data Transaksi",
    count: 300,
    date: "23 Apr 2023",
    status: "Berhasil",
    user: "Admin",
  },
]
