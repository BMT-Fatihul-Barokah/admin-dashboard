"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Download, Search, SlidersHorizontal, CheckCircle, XCircle, RefreshCcw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { downloadCSV, formatDataForExport } from "@/utils/export-data";
import { createClient } from "@/utils/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface Loan {
  id: string;
  anggota_id: string;
  anggota_nama: string;
  jumlah: number;
  tenor: number;
  tujuan: string;
  status: string;
  created_at: string;
  updated_at: string;
  alasan_penolakan?: string;
}

export default function LoanApprovalsPage() {
  const [pendingLoans, setPendingLoans] = useState<Loan[]>([]);
  const [approvedLoans, setApprovedLoans] = useState<Loan[]>([]);
  const [rejectedLoans, setRejectedLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);

  const supabase = createClient();

  const fetchLoans = async () => {
    setIsLoading(true);
    try {
      // Fetch pending loans
      const { data: pendingData, error: pendingError } = await supabase
        .from("pinjaman")
        .select(`
          *,
          anggota:anggota_id (
            nama
          )
        `)
        .eq("status", "menunggu");

      if (pendingError) throw pendingError;

      // Fetch approved loans
      const { data: approvedData, error: approvedError } = await supabase
        .from("pinjaman")
        .select(`
          *,
          anggota:anggota_id (
            nama
          )
        `)
        .eq("status", "disetujui");

      if (approvedError) throw approvedError;

      // Fetch rejected loans
      const { data: rejectedData, error: rejectedError } = await supabase
        .from("pinjaman")
        .select(`
          *,
          anggota:anggota_id (
            nama
          )
        `)
        .eq("status", "ditolak");

      if (rejectedError) throw rejectedError;

      // Format the data
      const formattedPending = pendingData.map((loan) => ({
        ...loan,
        anggota_nama: loan.anggota?.nama || "Unknown",
      }));

      const formattedApproved = approvedData.map((loan) => ({
        ...loan,
        anggota_nama: loan.anggota?.nama || "Unknown",
      }));

      const formattedRejected = rejectedData.map((loan) => ({
        ...loan,
        anggota_nama: loan.anggota?.nama || "Unknown",
      }));

      setPendingLoans(formattedPending);
      setApprovedLoans(formattedApproved);
      setRejectedLoans(formattedRejected);
    } catch (error) {
      console.error("Error fetching loans:", error);
      toast.error("Gagal memuat data pinjaman");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  const handleApprove = async (loan: Loan) => {
    try {
      const { error } = await supabase
        .from("pinjaman")
        .update({ status: "disetujui", updated_at: new Date().toISOString() })
        .eq("id", loan.id);

      if (error) throw error;

      toast.success("Pinjaman berhasil disetujui");
      fetchLoans();
    } catch (error) {
      console.error("Error approving loan:", error);
      toast.error("Gagal menyetujui pinjaman");
    }
  };

  const openRejectDialog = (loan: Loan) => {
    setSelectedLoan(loan);
    setRejectionReason("");
    setIsRejectDialogOpen(true);
  };

  const handleReject = async () => {
    if (!selectedLoan) return;

    try {
      const { error } = await supabase
        .from("pinjaman")
        .update({
          status: "ditolak",
          alasan_penolakan: rejectionReason,
          updated_at: new Date().toISOString()
        })
        .eq("id", selectedLoan.id);

      if (error) throw error;

      toast.success("Pinjaman berhasil ditolak");
      setIsRejectDialogOpen(false);
      fetchLoans();
    } catch (error) {
      console.error("Error rejecting loan:", error);
      toast.error("Gagal menolak pinjaman");
    }
  };

  const filteredPendingLoans = pendingLoans.filter(loan => 
    loan.anggota_nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    loan.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };
  
  // Export functions for each tab
  const exportPendingLoans = (): void => {
    if (filteredPendingLoans.length === 0) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }

    // Define field mapping for export
    const fieldMap = {
      id: "ID Pinjaman",
      anggota_nama: "Nama Anggota",
      jumlah: "Jumlah Pinjaman",
      tenor: "Tenor (bulan)",
      tujuan: "Tujuan",
      created_at: "Tanggal Pengajuan",
      status: "Status"
    };

    // Format data with transformations
    const exportData = formatDataForExport(
      filteredPendingLoans,
      fieldMap,
      {
        "Jumlah Pinjaman": (value: number) => formatCurrency(value),
        "Tanggal Pengajuan": (value: string) => new Date(value).toLocaleDateString('id-ID'),
        "Status": () => "Menunggu"
      }
    );

    // Download as CSV
    downloadCSV(exportData, `pinjaman-menunggu-${new Date().toISOString().split('T')[0]}`);
    toast.success("Data pinjaman berhasil diekspor");
  };
  
  const exportApprovedLoans = (): void => {
    if (approvedLoans.length === 0) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }

    // Define field mapping for export
    const fieldMap = {
      id: "ID Pinjaman",
      anggota_nama: "Nama Anggota",
      jumlah: "Jumlah Pinjaman",
      tenor: "Tenor (bulan)",
      tujuan: "Tujuan",
      created_at: "Tanggal Pengajuan",
      updated_at: "Tanggal Disetujui",
      status: "Status"
    };

    // Format data with transformations
    const exportData = formatDataForExport(
      approvedLoans,
      fieldMap,
      {
        "Jumlah Pinjaman": (value: number) => formatCurrency(value),
        "Tanggal Pengajuan": (value: string) => new Date(value).toLocaleDateString('id-ID'),
        "Tanggal Disetujui": (value: string) => new Date(value).toLocaleDateString('id-ID'),
        "Status": () => "Disetujui"
      }
    );

    // Download as CSV
    downloadCSV(exportData, `pinjaman-disetujui-${new Date().toISOString().split('T')[0]}`);
    toast.success("Data pinjaman berhasil diekspor");
  };
  
  const exportRejectedLoans = (): void => {
    if (rejectedLoans.length === 0) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }

    // Define field mapping for export
    const fieldMap = {
      id: "ID Pinjaman",
      anggota_nama: "Nama Anggota",
      jumlah: "Jumlah Pinjaman",
      tenor: "Tenor (bulan)",
      tujuan: "Tujuan",
      created_at: "Tanggal Pengajuan",
      updated_at: "Tanggal Ditolak",
      status: "Status",
      alasan_penolakan: "Alasan Penolakan"
    };

    // Format data with transformations
    const exportData = formatDataForExport(
      rejectedLoans,
      fieldMap,
      {
        "Jumlah Pinjaman": (value: number) => formatCurrency(value),
        "Tanggal Pengajuan": (value: string) => new Date(value).toLocaleDateString('id-ID'),
        "Tanggal Ditolak": (value: string) => new Date(value).toLocaleDateString('id-ID'),
        "Status": () => "Ditolak",
        "Alasan Penolakan": (value: string | undefined) => value || "-"
      }
    );

    // Download as CSV
    downloadCSV(exportData, `pinjaman-ditolak-${new Date().toISOString().split('T')[0]}`);
    toast.success("Data pinjaman berhasil diekspor");
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Persetujuan Pinjaman</h2>
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
              <Input 
                type="search" 
                placeholder="Cari pinjaman..." 
                className="w-full pl-8" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon" className="ml-auto" onClick={() => fetchLoans()}>
              <RefreshCcw className="h-4 w-4" />
              <span className="sr-only">Refresh</span>
            </Button>
            <Button variant="outline" size="icon" onClick={exportPendingLoans}>
              <Download className="h-4 w-4" />
              <span className="sr-only">Export</span>
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <p>Memuat data...</p>
            </div>
          ) : filteredPendingLoans.length === 0 ? (
            <div className="flex justify-center items-center h-40">
              <p>Tidak ada pinjaman yang menunggu persetujuan</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredPendingLoans.map((loan) => (
                <Card key={loan.id}>
                  <CardHeader>
                    <CardTitle>{loan.anggota_nama}</CardTitle>
                    <CardDescription>ID: {loan.id}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Jumlah:</span>
                      <span className="text-sm font-medium">{formatCurrency(loan.jumlah)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Tenor:</span>
                      <span className="text-sm font-medium">{loan.tenor} bulan</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Tujuan:</span>
                      <span className="text-sm font-medium">{loan.tujuan}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Tanggal Pengajuan:</span>
                      <span className="text-sm font-medium">{new Date(loan.created_at).toLocaleDateString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Status:</span>
                      <Badge variant="outline">Menunggu</Badge>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline">Lihat Detail</Button>
                    <div className="flex gap-2">
                      <Button 
                        variant="destructive" 
                        size="icon"
                        onClick={() => openRejectDialog(loan)}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="default" 
                        size="icon" 
                        className="bg-green-500 hover:bg-green-600"
                        onClick={() => handleApprove(loan)}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder="Cari pinjaman..." className="w-full pl-8" />
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <p>Memuat data...</p>
            </div>
          ) : approvedLoans.length === 0 ? (
            <div className="flex justify-center items-center h-40">
              <p>Tidak ada pinjaman yang disetujui</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>Jumlah</TableHead>
                    <TableHead>Tenor</TableHead>
                    <TableHead>Tujuan</TableHead>
                    <TableHead>Tanggal Disetujui</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {approvedLoans.map((loan) => (
                    <TableRow key={loan.id}>
                      <TableCell className="font-medium">{loan.id}</TableCell>
                      <TableCell>{loan.anggota_nama}</TableCell>
                      <TableCell>{formatCurrency(loan.jumlah)}</TableCell>
                      <TableCell>{loan.tenor} bulan</TableCell>
                      <TableCell>{loan.tujuan}</TableCell>
                      <TableCell>{new Date(loan.updated_at).toLocaleDateString('id-ID')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder="Cari pinjaman..." className="w-full pl-8" />
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <p>Memuat data...</p>
            </div>
          ) : rejectedLoans.length === 0 ? (
            <div className="flex justify-center items-center h-40">
              <p>Tidak ada pinjaman yang ditolak</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>Jumlah</TableHead>
                    <TableHead>Tenor</TableHead>
                    <TableHead>Tanggal Ditolak</TableHead>
                    <TableHead>Alasan Penolakan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rejectedLoans.map((loan) => (
                    <TableRow key={loan.id}>
                      <TableCell className="font-medium">{loan.id}</TableCell>
                      <TableCell>{loan.anggota_nama}</TableCell>
                      <TableCell>{formatCurrency(loan.jumlah)}</TableCell>
                      <TableCell>{loan.tenor} bulan</TableCell>
                      <TableCell>{new Date(loan.updated_at).toLocaleDateString('id-ID')}</TableCell>
                      <TableCell>{loan.alasan_penolakan || "Tidak ada alasan"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tolak Pinjaman</DialogTitle>
            <DialogDescription>
              Masukkan alasan penolakan pinjaman ini. Alasan ini akan dicatat dalam sistem.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="reason" className="text-right">
                Alasan
              </Label>
              <Textarea
                id="reason"
                className="col-span-3"
                placeholder="Masukkan alasan penolakan..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>Batal</Button>
            <Button onClick={handleReject}>Konfirmasi Penolakan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
