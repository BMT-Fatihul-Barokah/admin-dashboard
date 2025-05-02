"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, Database, RefreshCw } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { parseExcelFile, importAnggotaData, getImportHistory, recordImportHistory, AnggotaExcelRow, formatDate, excelDateToJSDate } from "@/lib/excel-import"

type ImportResult = {
  success: boolean;
  message: string;
  processed: number;
  created: number;
  updated: number;
  errors: any[];
};

type ImportHistory = {
  id: number;
  type: string;
  count: number;
  created_at: string;
  status: string;
  user: string;
};

export default function ImportPage() {
  const [activeTab, setActiveTab] = useState("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<AnggotaExcelRow[] | null>(null);
  const [importStatus, setImportStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importHistoryData, setImportHistoryData] = useState<ImportHistory[]>([]);
  const [importType, setImportType] = useState<string>("anggota");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchImportHistory = async () => {
      const history = await getImportHistory();
      setImportHistoryData(history);
    };

    if (activeTab === "history") {
      fetchImportHistory();
    }
  }, [activeTab]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setSelectedFile(file);
      setError(null);

      const fileExtension = file.name.split(".").pop()?.toLowerCase();
      if (fileExtension !== "xlsx" && fileExtension !== "xls") {
        throw new Error("Format file tidak valid. Harap unggah file Excel (.xlsx atau .xls)");
      }

      if (file.size > 10 * 1024 * 1024) {
        throw new Error("Ukuran file terlalu besar. Maksimal 10MB");
      }

      const excelData = await parseExcelFile(file);
      if (excelData.length === 0) {
        throw new Error("File Excel kosong atau tidak memiliki data yang valid");
      }

      setPreviewData(excelData);
      setActiveTab("preview");
    } catch (err: any) {
      console.error("Error processing file:", err);
      setError(err.message || "Terjadi kesalahan saat memproses file");
      setPreviewData(null);
    }
  };

  const handleImport = async () => {
    if (!previewData || previewData.length === 0) {
      setError("Tidak ada data untuk diimpor");
      return;
    }

    setImportStatus("processing");
    setProgress(0);
    setError(null);

    let progressInterval: NodeJS.Timeout | undefined;

    try {
      const totalItems = previewData.length;
      const progressStep = 100 / totalItems;
      let currentProgress = 0;

      progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 95) {
            return prev;
          }
          return Math.min(prev + 1, 95);
        });
      }, 100);

      let result;
      if (importType === "anggota") {
        result = await importAnggotaData(previewData);
      } else {
        throw new Error("Tipe import tidak didukung");
      }

      if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = undefined;
      }
      setProgress(100);

      setImportResult(result);

      if (result.success) {
        setImportStatus("success");

        await recordImportHistory(
          `Data ${importType.charAt(0).toUpperCase() + importType.slice(1)}`,
          result.processed,
          "Berhasil",
          `Berhasil: ${result.created} ditambahkan, ${result.updated} diperbarui, ${result.errors.length} gagal`
        );
      } else {
        setImportStatus("error");
        setError(result.message);

        await recordImportHistory(
          `Data ${importType.charAt(0).toUpperCase() + importType.slice(1)}`,
          result.processed,
          "Gagal",
          result.message
        );
      }
    } catch (err: any) {
      if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = undefined;
      }
      setImportStatus("error");
      setError(err.message || "Terjadi kesalahan saat mengimpor data");
      console.error("Import error:", err);

      await recordImportHistory(
        `Data ${importType.charAt(0).toUpperCase() + importType.slice(1)}`,
        0,
        "Gagal",
        err.message || "Terjadi kesalahan saat mengimpor data"
      );
    }
  };

  const resetImport = () => {
    setSelectedFile(null);
    setPreviewData(null);
    setImportStatus("idle");
    setProgress(0);
    setActiveTab("upload");
    setImportResult(null);
    setError(null);
  };

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

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <h3 className="font-medium">Template File</h3>
                <p className="text-sm text-muted-foreground">
                  Unduh template file Excel untuk memastikan format data yang benar.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => setImportType("anggota")}>
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Template Data Anggota
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setImportType("transaksi")}>
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Template Data Transaksi
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setImportType("pinjaman")}>
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Template Data Pinjaman
                  </Button>
                </div>
                <div className="mt-2">
                  <p className="text-sm text-muted-foreground">
                    Tipe Data Terpilih: <span className="font-medium">{importType.charAt(0).toUpperCase() + importType.slice(1)}</span>
                  </p>
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
                <Select value={importType} onValueChange={setImportType}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Pilih Jenis Data" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="anggota">Data Anggota</SelectItem>
                    <SelectItem value="transaksi">Data Transaksi</SelectItem>
                    <SelectItem value="pinjaman">Data Pinjaman</SelectItem>
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
                      <TableHead>No.</TableHead>
                      <TableHead>Nama Anggota</TableHead>
                      <TableHead>No. Rekening</TableHead>
                      <TableHead>Saldo</TableHead>
                      <TableHead>Alamat</TableHead>
                      <TableHead>Kota</TableHead>
                      <TableHead>Tanggal Lahir</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData?.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{row["NO."]}</TableCell>
                        <TableCell>{row["Nama Anggota"]}</TableCell>
                        <TableCell>{row["No. Rekening"]}</TableCell>
                        <TableCell>Rp {row["Saldo"].toLocaleString("id-ID")}</TableCell>
                        <TableCell>{row["Alamat"]}</TableCell>
                        <TableCell>{row["Kota"]}</TableCell>
                        <TableCell>
                          {formatDate(excelDateToJSDate(row["Tanggal Lahir"]))}
                        </TableCell>
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
                    <div className="space-y-1">
                      <p>{importResult?.message}</p>
                      <p>Total data diproses: {importResult?.processed}</p>
                      <p>Data baru ditambahkan: {importResult?.created}</p>
                      <p>Data diperbarui: {importResult?.updated}</p>
                      <p>Data gagal: {importResult?.errors.length}</p>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {importStatus === "error" && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Import gagal</AlertTitle>
                  <AlertDescription>
                    {error || "Terjadi kesalahan saat mengimpor data. Silakan coba lagi atau hubungi administrator."}
                    {importResult && (
                      <div className="mt-2">
                        <p>Total data diproses: {importResult.processed}</p>
                        <p>Data berhasil: {importResult.created + importResult.updated}</p>
                        <p>Data gagal: {importResult.errors.length}</p>
                      </div>
                    )}
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
                    {importHistoryData.length > 0 ? (
                      importHistoryData.map((history, index) => (
                        <TableRow key={history.id || index}>
                          <TableCell className="font-medium">IMP-{String(index + 1).padStart(3, "0")}</TableCell>
                          <TableCell>{history.type}</TableCell>
                          <TableCell>{history.count}</TableCell>
                          <TableCell>{formatDisplayDate(history.created_at)}</TableCell>
                          <TableCell>
                            <Badge
                              variant={history.status === "Berhasil" ? "default" : "destructive"}
                              className={history.status === "Berhasil" ? "bg-green-500 hover:bg-green-600" : ""}
                            >
                              {history.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{history.user || "Admin"}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                          Belum ada riwayat import
                        </TableCell>
                      </TableRow>
                    )}
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

// Format date for display
function formatDisplayDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}
