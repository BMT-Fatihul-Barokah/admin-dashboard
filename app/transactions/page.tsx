"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { PermissionGuard } from "@/components/permission-guard";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
	ChevronLeft,
	ChevronRight,
	Download,
	MoreHorizontal,
	Plus,
	Search,
	SlidersHorizontal,
	RefreshCcw,
	Loader2,
	Trash2,
} from "lucide-react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import { downloadExcel, formatDataForExport } from "@/utils/export-data";
import { toast } from "sonner";
import { TransactionDetailModal } from "./components/transaction-detail-modal";
import { TransactionReceipt } from "./components/transaction-receipt";
import { TransactionFormModal } from "./components/transaction-form-modal";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Define transaction type
interface Transaksi {
	id: string;
	anggota_id: string;
	anggota?: {
		nama: string;
		nomor_rekening: string;
	} | null;
	tipe_transaksi: string; // This field contains 'masuk' or 'keluar'
	source_type?: string;
	deskripsi?: string;
	jumlah: number;
	sebelum?: number;
	sesudah?: number;
	pembiayaan_id?: string; // Database uses pembiayaan_id, not pinjaman_id
	tabungan_id?: string;
	created_at: string;
	updated_at: string;
	tabungan?: {
		saldo: number;
		jenis_tabungan_id: string;
		jenis_tabungan?: {
			nama: string;
			kode: string;
		} | null;
	} | null;
	pinjaman?: {
		id: string;
		jumlah: number;
		sisa_pembayaran: number;
		jenis_pinjaman: string;
	} | null;
}

export default function TransactionsPage() {
	const [transactions, setTransactions] = useState<Transaksi[]>([]);
	const [filteredTransactions, setFilteredTransactions] = useState<
		Transaksi[]
	>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");
	const [typeFilter, setTypeFilter] = useState("all");
	const [categoryFilter, setCategoryFilter] = useState("all");
	const [showFilters, setShowFilters] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Pagination states
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage, setItemsPerPage] = useState(20);
	const [totalPages, setTotalPages] = useState(1);

	// Modal states
	const [selectedTransaction, setSelectedTransaction] =
		useState<Transaksi | null>(null);
	const [showDetailModal, setShowDetailModal] = useState(false);
	const [showReceiptModal, setShowReceiptModal] = useState(false);
	const [showFormModal, setShowFormModal] = useState(false);
	const [isDeletingTransaction, setIsDeletingTransaction] = useState(false);
	const [showDeleteConfirmation, setShowDeleteConfirmation] =
		useState(false);
	const [transactionToDelete, setTransactionToDelete] =
		useState<Transaksi | null>(null);

	// Component initialization

	// Format date function
	const formatDate = (dateString: string) => {
		try {
			const date = parseISO(dateString);
			return format(date, "dd MMM yyyy", { locale: id });
		} catch (error) {
			return dateString;
		}
	};

	// Format currency
	const formatCurrency = (amount: number) => {
		return `Rp ${amount.toLocaleString("id-ID")}`;
	};

	// Map transaction type to status for display
	const getStatusFromType = (type: string) => {
		// All transactions are considered successful
		return "Berhasil";
	};

	// Show delete confirmation dialog
	const showDeleteTransactionDialog = (transaction: Transaksi) => {
		setTransactionToDelete(transaction);
		setShowDeleteConfirmation(true);
	};

	// Delete transaction function
	const deleteTransaction = async () => {
		if (!transactionToDelete) {
			toast.error("ID transaksi tidak valid");
			return;
		}

		console.log("Starting delete transaction:", transactionToDelete.id);
		setIsDeletingTransaction(true);

		try {
			const deleteUrl = `/api/transactions?id=${transactionToDelete.id}`;
			console.log("DELETE URL:", deleteUrl);

			const response = await fetch(deleteUrl, {
				method: "DELETE",
				headers: {
					"Content-Type": "application/json",
				},
			});

			console.log("Delete response status:", response.status);
			console.log("Delete response ok:", response.ok);

			let responseData;
			try {
				responseData = await response.json();
				console.log("Delete response data:", responseData);
			} catch (parseError) {
				console.error(
					"Error parsing response JSON:",
					parseError
				);
				throw new Error("Gagal memproses respons dari server");
			}

			if (!response.ok) {
				throw new Error(
					responseData.error ||
						`HTTP Error: ${response.status} ${response.statusText}`
				);
			}

			// Show success message
			toast.success(
				"Transaksi berhasil dibatalkan dan dihapus dari sistem"
			);

			// Close the confirmation dialog
			setShowDeleteConfirmation(false);
			setTransactionToDelete(null);

			// Refresh the transaction list
			await fetchTransactions();
		} catch (error) {
			console.error("Error deleting transaction:", error);
			const errorMessage =
				error instanceof Error
					? error.message
					: "Terjadi kesalahan tidak dikenal";
			toast.error(`Gagal membatalkan transaksi: ${errorMessage}`);
		} finally {
			setIsDeletingTransaction(false);
		}
	};

	// Fetch transactions from API route with fallback mechanism
	const fetchTransactions = async () => {
		setIsLoading(true);
		setError(null);
		try {
			console.log("Attempting to fetch transactions from API...");

			// Primary approach: Use the API route to fetch transactions
			const response = await fetch("/api/transactions");

			if (!response.ok) {
				const errorData = await response.json();
				console.error("Error response from API:", errorData);
				throw new Error(errorData.error || response.statusText);
			}

			const data = await response.json();
			console.log(
				`Fetched ${
					data?.length || 0
				} transaction records from API`
			);

			// Data is already transformed by the API
			setTransactions(data);
			setFilteredTransactions(data);
		} catch (apiError) {
			console.error("API fetch error:", apiError);

			// Fallback approach: Use direct Supabase RPC call from client
			try {
				console.log(
					"Attempting fallback: Direct Supabase RPC call..."
				);

				// Import supabase client dynamically to avoid SSR issues
				const { supabase } = await import("@/lib/supabase");

				const { data, error } = await supabase
					.rpc("get_all_transactions")
					.limit(100);

				if (error) {
					console.error("Supabase RPC error:", error);
					throw error;
				}

				if (!data || data.length === 0) {
					console.warn(
						"No transaction data returned from fallback"
					);
					setTransactions([]);
					setFilteredTransactions([]);
					return;
				}

				console.log(
					`Fallback successful: ${data.length} transactions fetched directly`
				);

				// Define the type for the flattened data from RPC
				type FlattenedTransaksi = {
					id: string;
					anggota_id: string;
					anggota_nama?: string;
					tipe_transaksi: string; // This field contains 'masuk' or 'keluar'
					source_type?: string;
					deskripsi?: string;
					jumlah: number;
					sebelum?: number;
					sesudah?: number;
					pembiayaan_id?: string;
					pembiayaan_jumlah?: number;
					pembiayaan_sisa?: number;
					pembiayaan_jenis?: string;
					tabungan_id?: string;
					tabungan_saldo?: number;
					tabungan_jenis_id?: string;
					tabungan_jenis_nama?: string;
					tabungan_jenis_kode?: string;
					created_at: string;
					updated_at: string;
				};

				// Transform the flat data structure into the nested structure expected by the component
				const transformedData = data.map(
					(item: FlattenedTransaksi) => {
						// Ensure jumlah is displayed with the correct sign based on tipe_transaksi field
						// For 'masuk' transactions, the amount should be positive
						// For 'keluar' transactions, the amount should be negative
						const jumlah =
							item.tipe_transaksi === "masuk"
								? Math.abs(Number(item.jumlah))
								: -Math.abs(
										Number(item.jumlah)
								  );

						return {
							id: item.id,
							anggota_id: item.anggota_id,
							tipe_transaksi: item.tipe_transaksi,
							source_type: item.source_type,
							deskripsi: item.deskripsi,
							jumlah: jumlah,
							sebelum: item.sebelum,
							sesudah: item.sesudah,
							pembiayaan_id: item.pembiayaan_id,
							tabungan_id: item.tabungan_id,
							created_at: item.created_at,
							updated_at: item.updated_at,
							anggota: item.anggota_nama
								? { nama: item.anggota_nama }
								: null,
							tabungan: item.tabungan_jenis_id
								? {
										saldo: item.tabungan_saldo,
										jenis_tabungan_id:
											item.tabungan_jenis_id,
										jenis_tabungan:
											item.tabungan_jenis_nama
												? {
														nama: item.tabungan_jenis_nama,
														kode: item.tabungan_jenis_kode,
												  }
												: null,
								  }
								: null,
							pinjaman: item.pembiayaan_jumlah
								? {
										id: item.pembiayaan_id,
										jumlah: item.pembiayaan_jumlah,
										sisa_pembayaran:
											item.pembiayaan_sisa,
										jenis_pinjaman:
											item.pembiayaan_jenis ||
											"Unknown",
								  }
								: null,
						};
					}
				);

				setTransactions(transformedData);
				setFilteredTransactions(transformedData);
			} catch (fallbackError) {
				console.error(
					"Fallback approach failed:",
					fallbackError
				);

				let errorMessage = "An unknown error occurred";
				if (fallbackError instanceof Error) {
					errorMessage = fallbackError.message;
				} else if (
					typeof fallbackError === "object" &&
					fallbackError !== null
				) {
					errorMessage =
						(fallbackError as any).message ||
						JSON.stringify(fallbackError);
				}

				setError(`Error: ${errorMessage}`);
				toast.error(
					`Gagal memuat data transaksi: ${errorMessage}`
				);
			}
		} finally {
			setIsLoading(false);
		}
	};

	// Additional filter states
	const [dateStart, setDateStart] = useState("");
	const [dateEnd, setDateEnd] = useState("");
	const [amountMin, setAmountMin] = useState("");
	const [amountMax, setAmountMax] = useState("");

	// Calculate total pages based on filtered data
	const calculatePagination = (data: Transaksi[]) => {
		const total = Math.ceil(data.length / itemsPerPage);
		setTotalPages(total > 0 ? total : 1);

		// Reset to first page if current page is out of bounds
		if (currentPage > total && total > 0) {
			setCurrentPage(1);
		}
	};

	// Apply all filters
	const applyFilters = () => {
		if (!transactions.length) return;

		let filtered = [...transactions];

		// Apply search filter
		if (searchQuery) {
			const query = searchQuery.toLowerCase();
			filtered = filtered.filter(
				(transaction) =>
					(transaction.id &&
						transaction.id
							.toLowerCase()
							.includes(query)) ||
					(transaction.anggota?.nama &&
						transaction.anggota.nama
							.toLowerCase()
							.includes(query)) ||
					transaction.tipe_transaksi
						.toLowerCase()
						.includes(query) ||
					(transaction.deskripsi &&
						transaction.deskripsi
							.toLowerCase()
							.includes(query))
			);
		}

		// Apply type filter
		if (typeFilter !== "all") {
			filtered = filtered.filter(
				(transaction) =>
					transaction.tipe_transaksi.toLowerCase() ===
					typeFilter.toLowerCase()
			);
		}

		// Apply date range filter
		if (dateStart) {
			const startDate = new Date(dateStart);
			filtered = filtered.filter((transaction) => {
				const transactionDate = new Date(
					transaction.created_at
				);
				return transactionDate >= startDate;
			});
		}

		if (dateEnd) {
			const endDate = new Date(dateEnd);
			endDate.setHours(23, 59, 59, 999); // End of the day
			filtered = filtered.filter((transaction) => {
				const transactionDate = new Date(
					transaction.created_at
				);
				return transactionDate <= endDate;
			});
		}

		// Apply amount range filter
		if (amountMin) {
			const min = parseFloat(amountMin);
			if (!isNaN(min)) {
				filtered = filtered.filter(
					(transaction) => Number(transaction.jumlah) >= min
				);
			}
		}

		if (amountMax) {
			const max = parseFloat(amountMax);
			if (!isNaN(max)) {
				filtered = filtered.filter(
					(transaction) => Number(transaction.jumlah) <= max
				);
			}
		}

		setFilteredTransactions(filtered);
		calculatePagination(filtered);
	};

	// Reset all filters
	const resetFilters = () => {
		setSearchQuery("");
		setTypeFilter("all");
		setDateStart("");
		setDateEnd("");
		setAmountMin("");
		setAmountMax("");
		setFilteredTransactions(transactions);
	};

	// Handle search and filters
	useEffect(() => {
		applyFilters();
	}, [
		transactions,
		searchQuery,
		typeFilter,
		dateStart,
		dateEnd,
		amountMin,
		amountMax,
	]);

	// Handle pagination changes
	useEffect(() => {
		calculatePagination(filteredTransactions);
	}, [filteredTransactions, itemsPerPage]);

	// Export transactions to Excel
	const exportTransactions = (): void => {
		if (filteredTransactions.length === 0) {
			toast.error("Tidak ada data untuk diekspor");
			return;
		}

		// Define field mapping for export (removed ID Transaksi)
		const fieldMap = {
			"anggota.nama": "Nama Anggota",
			tipe_transaksi: "Jenis Transaksi",
			jumlah: "Jumlah",
			rekening_pinjaman: "Rekening/Pinjaman",
			created_at: "Tanggal",
		};

		// Define the export format type
		type ExportFormat = {
			"Nama Anggota": string;
			"Jenis Transaksi": string;
			Jumlah: number;
			"Rekening/Pinjaman": string;
			Tanggal: string;
		};

		// Format data with transformations
		const exportData = formatDataForExport<
			Transaksi & { rekening_pinjaman: string },
			ExportFormat
		>(
			filteredTransactions.map((transaction) => ({
				...transaction,
				// Add a virtual field for rekening/pinjaman
				rekening_pinjaman: transaction.tabungan
					? `${
							transaction.tabungan.jenis_tabungan
								?.nama || "Tabungan"
					  }`
					: transaction.pinjaman
					? `${
							transaction.pinjaman.jenis_pinjaman ||
							"Pinjaman"
					  }`
					: "-",
			})),
			fieldMap,
			{
				"Nama Anggota": (
					value: any,
					row: Transaksi & { rekening_pinjaman: string }
				) => row.anggota?.nama || "Anggota",
				// Export Jumlah as a number, not as formatted currency
				Jumlah: (value: number) => Number(value),
				// Convert string date to JavaScript Date object for proper Excel date formatting
				Tanggal: (value: string) =>
					value ? parseISO(value) : null,
			}
		);

		// Download as Excel
		downloadExcel(
			exportData,
			`transaksi-${new Date().toISOString().split("T")[0]}`
		);
		toast.success("Data transaksi berhasil diekspor ke Excel");
	};

	// Load data on component mount
	useEffect(() => {
		fetchTransactions();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Get current page data
	const getCurrentPageData = () => {
		const startIndex = (currentPage - 1) * itemsPerPage;
		const endIndex = startIndex + itemsPerPage;
		return filteredTransactions.slice(startIndex, endIndex);
	};

	// Handle page change
	const handlePageChange = (page: number) => {
		if (page < 1 || page > totalPages) return;
		setCurrentPage(page);
	};

	// Generate page numbers for pagination
	const getPageNumbers = () => {
		const pages = [];
		const maxVisiblePages = 5;

		if (totalPages <= maxVisiblePages) {
			// Show all pages if total pages is less than max visible pages
			for (let i = 1; i <= totalPages; i++) {
				pages.push(i);
			}
		} else {
			// Always show first page
			pages.push(1);

			// Calculate start and end of visible pages
			let start = Math.max(2, currentPage - 1);
			let end = Math.min(totalPages - 1, currentPage + 1);

			// Adjust if we're near the start or end
			if (currentPage <= 2) {
				end = 4;
			} else if (currentPage >= totalPages - 1) {
				start = totalPages - 3;
			}

			// Add ellipsis if needed
			if (start > 2) {
				pages.push(-1); // -1 represents ellipsis
			}

			// Add middle pages
			for (let i = start; i <= end; i++) {
				pages.push(i);
			}

			// Add ellipsis if needed
			if (end < totalPages - 1) {
				pages.push(-2); // -2 represents ellipsis
			}

			// Always show last page
			if (totalPages > 1) {
				pages.push(totalPages);
			}
		}

		return pages;
	};

	return (
		<div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
			<div className="flex items-center justify-between">
				<h2 className="text-3xl font-bold tracking-tight">
					Manajemen Transaksi
				</h2>
				<PermissionGuard permission="create_transactions">
					<Button onClick={() => setShowFormModal(true)}>
						<Plus className="mr-2 h-4 w-4" />
						Tambah Transaksi
					</Button>
				</PermissionGuard>
			</div>

			<div className="flex flex-col md:flex-row items-center gap-4">
				<div className="relative w-full md:w-80">
					<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
					<Input
						type="search"
						placeholder="Cari transaksi..."
						className="w-full pl-8"
						value={searchQuery}
						onChange={(e) =>
							setSearchQuery(e.target.value)
						}
					/>
				</div>
				<div className="flex items-center gap-2">
					<Select
						value={typeFilter}
						onValueChange={setTypeFilter}
					>
						<SelectTrigger className="w-[180px]">
							<SelectValue placeholder="Jenis Transaksi" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">
								Semua Jenis
							</SelectItem>
							<SelectItem value="masuk">
								Masuk
							</SelectItem>
							<SelectItem value="keluar">
								Keluar
							</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<div className="ml-auto"></div>
				<Button
					variant="outline"
					size="icon"
					onClick={fetchTransactions}
				>
					<RefreshCcw className="h-4 w-4" />
					<span className="sr-only">Refresh</span>
				</Button>
				<PermissionGuard permission="generate_reports">
					<Button
						variant="outline"
						size="icon"
						onClick={exportTransactions}
					>
						<Download className="h-4 w-4" />
						<span className="sr-only">Export</span>
					</Button>
				</PermissionGuard>
			</div>

			{isLoading ? (
				<div className="flex justify-center items-center py-8">
					<Loader2 className="h-8 w-8 animate-spin text-primary" />
				</div>
			) : error ? (
				<div className="text-center py-8">
					<p className="text-destructive font-medium mb-2">
						Error connecting to database
					</p>
					<p className="text-muted-foreground text-sm">
						{error}
					</p>
					<Button
						variant="outline"
						size="sm"
						onClick={fetchTransactions}
						className="mt-4"
					>
						<RefreshCcw className="h-4 w-4 mr-2" />
						Try Again
					</Button>
				</div>
			) : filteredTransactions.length === 0 ? (
				<div className="text-center py-8">
					<p className="text-muted-foreground">
						Tidak ada transaksi yang ditemukan
					</p>
				</div>
			) : (
				<div className="rounded-md border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>
									ID Transaksi
								</TableHead>
								<TableHead>
									Nama Anggota
								</TableHead>
								<TableHead>Jenis</TableHead>
								<TableHead>Jumlah</TableHead>
								<TableHead>
									Rekening/Pinjaman
								</TableHead>
								<TableHead>Tanggal</TableHead>
								<TableHead className="text-right">
									Aksi
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{getCurrentPageData().map(
								(transaction) => (
									<TableRow
										key={transaction.id}
									>
										<TableCell className="font-medium">
											{transaction.id.substring(
												0,
												8
											)}
										</TableCell>
										<TableCell>
											{transaction
												.anggota
												?.nama ||
												"Anggota"}
										</TableCell>
										<TableCell>
											<Badge
												variant={
													transaction.tipe_transaksi ===
													"masuk"
														? "secondary"
														: "destructive"
												}
											>
												{transaction.tipe_transaksi ===
												"masuk"
													? "Masuk"
													: "Keluar"}
											</Badge>
										</TableCell>
										<TableCell>
											{transaction.tipe_transaksi ===
											"masuk"
												? "+ "
												: "- "}
											{formatCurrency(
												Math.abs(
													Number(
														transaction.jumlah
													)
												)
											)}
										</TableCell>
										<TableCell>
											{transaction.tabungan ? (
												<div className="flex flex-col">
													<span className="text-xs font-medium">
														{transaction
															.tabungan
															.jenis_tabungan
															?.nama ||
															"Tabungan"}
													</span>
													<span className="text-xs text-muted-foreground">
														Saldo:{" "}
														{formatCurrency(
															Number(
																transaction
																	.tabungan
																	.saldo ||
																	0
															)
														)}
													</span>
												</div>
											) : transaction.pinjaman ? (
												<div className="flex flex-col">
													<span className="text-xs font-medium">
														{transaction
															.pinjaman
															.jenis_pinjaman ||
															"Pinjaman"}
													</span>
													<span className="text-xs text-muted-foreground">
														ID:{" "}
														{transaction.pinjaman.id.substring(
															0,
															8
														)}
													</span>
												</div>
											) : (
												<span className="text-xs text-muted-foreground">
													-
												</span>
											)}
										</TableCell>
										<TableCell>
											{formatDate(
												transaction.created_at.toString()
											)}
										</TableCell>
										<TableCell className="text-right">
											<DropdownMenu>
												<DropdownMenuTrigger
													asChild
												>
													<Button
														variant="ghost"
														size="icon"
													>
														<MoreHorizontal className="h-4 w-4" />
														<span className="sr-only">
															Menu
														</span>
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end">
													<DropdownMenuLabel>
														Aksi
													</DropdownMenuLabel>
													<DropdownMenuSeparator />
													{/* View Detail - Everyone can see this */}
													<DropdownMenuItem
														onClick={() => {
															setSelectedTransaction(
																transaction
															);
															setShowDetailModal(
																true
															);
														}}
													>
														Lihat
														Detail
													</DropdownMenuItem>

													{/* Print Receipt - Only users with view_transactions permission */}
													<PermissionGuard permission="view_transactions">
														<DropdownMenuItem
															onClick={() => {
																setSelectedTransaction(
																	transaction
																);
																setShowReceiptModal(
																	true
																);
															}}
														>
															Cetak
															Bukti
														</DropdownMenuItem>
													</PermissionGuard>

													{/* Cancel Transaction - Only users with edit_transactions permission */}
													<PermissionGuard permission="edit_transactions">
														<DropdownMenuSeparator />
														<DropdownMenuItem
															className="text-destructive"
															onClick={() =>
																showDeleteTransactionDialog(
																	transaction
																)
															}
															disabled={
																isDeletingTransaction
															}
														>
															<Trash2 className="mr-2 h-4 w-4" />
															Batalkan
															Transaksi
														</DropdownMenuItem>
													</PermissionGuard>
												</DropdownMenuContent>
											</DropdownMenu>
										</TableCell>
									</TableRow>
								)
							)}
						</TableBody>
					</Table>
				</div>
			)}

			{!isLoading && filteredTransactions.length > 0 && (
				<div className="flex flex-col sm:flex-row items-center justify-between gap-4">
					<div className="flex items-center gap-2">
						<div className="text-sm text-muted-foreground">
							Menampilkan{" "}
							{(currentPage - 1) * itemsPerPage + 1}
							-
							{Math.min(
								currentPage * itemsPerPage,
								filteredTransactions.length
							)}{" "}
							dari {filteredTransactions.length}{" "}
							transaksi
						</div>
						<Select
							value={itemsPerPage.toString()}
							onValueChange={(value) =>
								setItemsPerPage(Number(value))
							}
						>
							<SelectTrigger className="w-[120px]">
								<SelectValue placeholder="Per halaman" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="10">
									10 per halaman
								</SelectItem>
								<SelectItem value="20">
									20 per halaman
								</SelectItem>
								<SelectItem value="50">
									50 per halaman
								</SelectItem>
								<SelectItem value="100">
									100 per halaman
								</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div className="flex items-center space-x-2">
						<Button
							variant="outline"
							size="icon"
							onClick={() =>
								handlePageChange(
									currentPage - 1
								)
							}
							disabled={currentPage === 1}
						>
							<ChevronLeft className="h-4 w-4" />
							<span className="sr-only">
								Halaman sebelumnya
							</span>
						</Button>

						{getPageNumbers().map((page, index) =>
							page < 0 ? (
								<div
									key={`ellipsis-${index}`}
									className="px-2"
								>
									...
								</div>
							) : (
								<Button
									key={page}
									variant={
										currentPage === page
											? "default"
											: "outline"
									}
									size="sm"
									className={`h-8 w-8 ${
										currentPage === page
											? "pointer-events-none"
											: ""
									}`}
									onClick={() =>
										handlePageChange(
											page
										)
									}
								>
									{page}
								</Button>
							)
						)}

						<Button
							variant="outline"
							size="icon"
							onClick={() =>
								handlePageChange(
									currentPage + 1
								)
							}
							disabled={currentPage === totalPages}
						>
							<ChevronRight className="h-4 w-4" />
							<span className="sr-only">
								Halaman berikutnya
							</span>
						</Button>
					</div>
				</div>
			)}
			{/* Transaction Detail Modal */}
			<TransactionDetailModal
				isOpen={showDetailModal}
				onClose={() => setShowDetailModal(false)}
				transaction={selectedTransaction}
				onPrint={() => {
					setShowDetailModal(false);
					setShowReceiptModal(true);
				}}
			/>

			{/* Transaction Receipt Modal */}
			<TransactionReceipt
				isOpen={showReceiptModal}
				onClose={() => setShowReceiptModal(false)}
				transaction={selectedTransaction}
			/>

			{/* Transaction Form Modal */}
			<TransactionFormModal
				isOpen={showFormModal}
				onClose={() => setShowFormModal(false)}
				onSuccess={fetchTransactions}
			/>

			{/* Delete Confirmation Dialog */}
			<AlertDialog
				open={showDeleteConfirmation}
				onOpenChange={setShowDeleteConfirmation}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							Konfirmasi Pembatalan Transaksi
						</AlertDialogTitle>
						<AlertDialogDescription>
							Apakah Anda yakin ingin membatalkan
							transaksi ini? Transaksi akan dihapus
							dari sistem dan tidak dapat
							dikembalikan.
							<br />
							<br />
							<strong>Detail Transaksi:</strong>
							<br />• ID:{" "}
							{transactionToDelete?.id.substring(
								0,
								8
							)}
							<br />• Anggota:{" "}
							{transactionToDelete?.anggota?.nama ||
								"Tidak diketahui"}
							<br />• Jumlah:{" "}
							{transactionToDelete &&
								formatCurrency(
									Math.abs(
										Number(
											transactionToDelete.jumlah
										)
									)
								)}
							<br />• Jenis:{" "}
							{transactionToDelete?.tipe_transaksi ===
							"masuk"
								? "Masuk"
								: "Keluar"}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Batal</AlertDialogCancel>
						<AlertDialogAction
							onClick={deleteTransaction}
							disabled={isDeletingTransaction}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{isDeletingTransaction ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Membatalkan...
								</>
							) : (
								<>
									<Trash2 className="mr-2 h-4 w-4" />
									Ya, Batalkan Transaksi
								</>
							)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
