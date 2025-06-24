"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/lib/admin-auth-context";
import { RoleProtected } from "@/components/role-protected";
import { getRoleTheme } from "@/lib/role-theme";
import { createClient } from "@supabase/supabase-js";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import {
	format,
	parseISO,
	startOfMonth,
	endOfMonth,
	subMonths,
	differenceInMonths,
	addMonths,
} from "date-fns";
import {
	ImprovedTrendChart,
	ImprovedPieChart,
	ImprovedBarChart,
	ImprovedLineChart,
	ImprovedDarkLineChart,
	ImprovedDualAxisBarChart,
	CustomTooltip,
	CHART_COLORS,
} from "./fixed-charts";

import { ImprovedTransactionTrendChart } from "./transaction-chart";

import { StatusDistributionPieChart } from "./fixed-pie-charts";

import {
	AreaChart,
	Area,
	BarChart as RechartsBarChart,
	Bar,
	LineChart as RechartsLineChart,
	Line,
	PieChart as RechartsPieChart,
	Pie,
	Cell,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	ResponsiveContainer,
} from "recharts";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Define types for analytics data
type MonthlyData = {
	month: string;
	name: string;
	value: number;
	count?: number;
	amount?: number;
};

type StatusDistribution = {
	name: string;
	value: number;
	percentage?: number;
};

interface AnalyticsData {
	registrationData: MonthlyData[];
	loanData: MonthlyData[];
	transactionData: MonthlyData[];
	statusDistribution: StatusDistribution[];
	loanStatusDistribution: StatusDistribution[];
	loanTypeDistribution: StatusDistribution[];
	totalRegistrations: number;
	totalLoanAmount: number;
	totalTransactionAmount: number;
	activeLoans: number;
	approvalRate: number;
}

// Colors for charts - using the imported CHART_COLORS from fixed-charts.tsx

// Helper function to generate month ranges
const generateMonthRanges = (
	months: number
): { start: Date; end: Date; label: string }[] => {
	const ranges = [];
	const today = new Date();

	for (let i = months - 1; i >= 0; i--) {
		const date = subMonths(today, i);
		const start = startOfMonth(date);
		const end = endOfMonth(date);
		const label = format(date, "MMM yyyy");
		ranges.push({ start, end, label });
	}

	return ranges;
};

// Helper function to format currency
const formatCurrency = (amount: number) => {
	return new Intl.NumberFormat("id-ID", {
		style: "currency",
		currency: "IDR",
		minimumFractionDigits: 0,
	}).format(amount);
};

// Function to fetch analytics data from Supabase
const fetchAnalyticsData = async (
	timeRange: string
): Promise<AnalyticsData> => {
	// Determine date range based on selected time range
	const months = timeRange === "6months" ? 6 : 12;
	const monthRanges = generateMonthRanges(months);
	const startDate = monthRanges[0].start.toISOString();

	// Initialize empty data structure
	const registrationData: MonthlyData[] = [];
	const loanData: MonthlyData[] = [];
	const transactionData: MonthlyData[] = [];
	const statusDistribution: StatusDistribution[] = [];
	const loanStatusDistribution: StatusDistribution[] = [];
	const loanTypeDistribution: StatusDistribution[] = [];

	// 1. Fetch registration data directly from anggota table
	try {
		console.log("Fetching registration data from anggota table...");
		const { data: anggotaData, error: anggotaError } = await supabase
			.from("anggota")
			.select("created_at, is_active")
			.gte("created_at", startDate);

		if (anggotaError) {
			console.error("Error fetching anggota data:", anggotaError);
			throw anggotaError;
		}

		if (!anggotaData) {
			console.error("No anggota data returned");
			throw new Error("No anggota data returned");
		}

		// Process registration data by month
		monthRanges.forEach((range) => {
			const count =
				anggotaData.filter((anggota) => {
					const createdAt = new Date(anggota.created_at);
					return (
						createdAt >= range.start &&
						createdAt <= range.end
					);
				}).length || 0;

			registrationData.push({
				month: range.label,
				name: range.label,
				value: count,
				count,
			});
		});
	} catch (error) {
		console.error("Error processing registration data:", error);
		// Provide empty data if there's an error
		monthRanges.forEach((range) => {
			registrationData.push({
				month: range.label,
				name: range.label,
				value: 0,
				count: 0,
			});
		});
	}

	// 2. Fetch loan data directly from pembiayaan table
	let pembiayaanDataForDistribution: any[] = [];
	try {
		console.log("Fetching loan data from pembiayaan table...");
		// Log environment variables for debugging
		console.log(
			"NEXT_PUBLIC_SUPABASE_URL:",
			process.env.NEXT_PUBLIC_SUPABASE_URL
		);
		console.log(
			"NEXT_PUBLIC_SUPABASE_ANON_KEY available:",
			!!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
		);

		// Use the correct schema for pembiayaan table
		const { data: pembiayaanData, error: pembiayaanError } =
			await supabase
				.from("pembiayaan")
				.select(
					`
        id, 
        jumlah, 
        created_at, 
        status, 
        jenis_pembiayaan_id,
        jenis_pembiayaan:jenis_pembiayaan_id(nama, kode)
      `
				)
				.gte("created_at", startDate);

		if (pembiayaanError) {
			console.error(
				"Error fetching pembiayaan data:",
				pembiayaanError
			);
			console.error(
				"Error details:",
				pembiayaanError.message,
				pembiayaanError.details
			);
			throw pembiayaanError;
		}

		if (!pembiayaanData) {
			console.error("No pembiayaan data returned");
			throw new Error("No pembiayaan data returned");
		}

		console.log(
			"Pembiayaan data fetched successfully:",
			pembiayaanData.length,
			"records"
		);
		if (pembiayaanData.length > 0) {
			console.log("Sample record:", pembiayaanData[0]);
		}

		// Process loan data by month
		monthRanges.forEach((range) => {
			// Filter loans for this month
			const monthLoans = pembiayaanData.filter((loan: any) => {
				const loanDate = new Date(loan.created_at);
				return loanDate >= range.start && loanDate <= range.end;
			});

			const amount = monthLoans.reduce(
				(sum: number, loan: any) => sum + Number(loan.jumlah),
				0
			);
			const count = monthLoans.length;

			loanData.push({
				month: range.label,
				name: range.label,
				value: amount,
				amount,
				count,
			});
		});

		// Use the same pembiayaan data for other calculations
		// Store the pembiayaan data for later use in status and type distributions
		pembiayaanDataForDistribution = pembiayaanData;
	} catch (error) {
		console.error("Error processing loan trend data:", error);
		// Provide empty data if there's an error
		monthRanges.forEach((range) => {
			loanData.push({
				month: range.label,
				name: range.label,
				value: 0,
				amount: 0,
				count: 0,
			});
		});
	}

	// 3. Fetch transaction data by month using stored procedure
	try {
		console.log(
			"Fetching transaction data using get_monthly_transactions RPC..."
		);
		const { data: monthlyTransactions, error: transactionError } =
			await supabase.rpc("get_monthly_transactions", {
				start_date: startDate,
			});

		if (transactionError) {
			console.error(
				"Error fetching transaction data from RPC:",
				transactionError
			);
			console.error(
				"Error details:",
				transactionError.message,
				transactionError.details
			);
			throw transactionError;
		}

		console.log(
			"Transaction data fetched successfully:",
			monthlyTransactions
		);

		if (monthlyTransactions && monthlyTransactions.length > 0) {
			// Process data from the RPC function
			monthRanges.forEach((range) => {
				const monthKey = `${range.start.getFullYear()}-${String(
					range.start.getMonth() + 1
				).padStart(2, "0")}`;
				console.log(
					`Looking for month key: ${monthKey} in transaction data`
				);

				const matchingData = monthlyTransactions.find(
					(item: {
						month: string;
						total_amount: number;
						count: number;
					}) => item.month === monthKey
				);

				const amount = matchingData
					? Number(matchingData.total_amount)
					: 0;
				const count = matchingData
					? Number(matchingData.count)
					: 0;

				console.log(
					`Month: ${
						range.label
					}, Found data: ${!!matchingData}, Amount: ${amount}, Count: ${count}`
				);

				transactionData.push({
					month: range.label,
					name: range.label,
					value: amount,
					amount,
					count,
				});
			});
		} else {
			console.log(
				"No transaction data returned from RPC, using empty data"
			);
			// No transaction data, provide empty data
			monthRanges.forEach((range) => {
				transactionData.push({
					month: range.label,
					name: range.label,
					value: 0,
					amount: 0,
					count: 0,
				});
			});
		}
	} catch (rpcError) {
		console.error(
			"Falling back to direct query due to RPC error:",
			rpcError
		);

		try {
			// Fallback to direct query if stored procedure fails
			const { data: transaksiData, error: transaksiError } =
				await supabase
					.from("transaksi")
					.select("jumlah, created_at, tipe_transaksi")
					.gte("created_at", startDate);

			if (transaksiError) {
				console.error(
					"Error fetching transaksi data:",
					transaksiError
				);
				throw transaksiError;
			}

			// Process transaction data by month
			if (transaksiData && transaksiData.length > 0) {
				monthRanges.forEach((range) => {
					const transactionsInMonth = transaksiData.filter(
						(transaksi) => {
							const createdAt = new Date(
								transaksi.created_at
							);
							return (
								createdAt >= range.start &&
								createdAt <= range.end
							);
						}
					);

					const amount = transactionsInMonth.reduce(
						(sum, transaction) => {
							// Only count incoming transactions for the total
							if (
								transaction.tipe_transaksi ===
								"masuk"
							) {
								return (
									sum +
									Number(transaction.jumlah)
								);
							}
							return sum;
						},
						0
					);

					transactionData.push({
						month: range.label,
						name: range.label,
						value: amount,
						amount,
						count: transactionsInMonth.length,
					});
				});
			} else {
				// If no data found, initialize with zeros
				monthRanges.forEach((range) => {
					transactionData.push({
						month: range.label,
						name: range.label,
						value: 0,
						amount: 0,
						count: 0,
					});
				});
			}
		} catch (fallbackError) {
			console.error("Error in fallback query:", fallbackError);
			// Initialize with zeros if both methods fail
			monthRanges.forEach((range) => {
				transactionData.push({
					month: range.label,
					name: range.label,
					value: 0,
					amount: 0,
					count: 0,
				});
			});
		}
	}

	// 4. Calculate transaction totals for later use
	let transactionTotal = transactionData.reduce(
		(sum: number, item: any) => sum + (item.amount || 0),
		0
	);

	// Fetch anggota data for status distribution
	let anggotaDataForStatus;
	// Always fetch anggota data separately for status distribution to avoid errors
	const { data: fetchedAnggotaData, error: fetchAnggotaError } =
		await supabase
			.from("anggota")
			.select("created_at, is_active")
			.gte("created_at", startDate);

	if (fetchAnggotaError) {
		console.error(
			"Error fetching anggota data for status:",
			fetchAnggotaError
		);
		throw new Error("Failed to fetch anggota status data");
	}

	anggotaDataForStatus = fetchedAnggotaData;

	// Calculate status distribution
	const activeCount =
		anggotaDataForStatus?.filter(
			(anggota: { is_active: boolean }) => anggota.is_active
		).length || 0;
	const inactiveCount = (anggotaDataForStatus?.length || 0) - activeCount;

	statusDistribution.push(
		{ name: "Aktif", value: activeCount },
		{ name: "Tidak Aktif", value: inactiveCount }
	);

	// 5. Calculate loan status distribution
	try {
		console.log("Calculating loan status distribution...");
		const loanStatusCounts: Record<string, number> = {};

		if (
			pembiayaanDataForDistribution &&
			pembiayaanDataForDistribution.length > 0
		) {
			pembiayaanDataForDistribution.forEach((pembiayaan: any) => {
				// Make sure status exists and is a string
				const status = pembiayaan.status || "unknown";
				loanStatusCounts[status] =
					(loanStatusCounts[status] || 0) + 1;
			});

			console.log("Loan status counts:", loanStatusCounts);

			Object.entries(loanStatusCounts).forEach(
				([status, count]) => {
					const total =
						pembiayaanDataForDistribution.length || 1;
					const percentage = (count / total) * 100;
					loanStatusDistribution.push({
						name:
							status.charAt(0).toUpperCase() +
							status.slice(1),
						value: count,
						percentage,
					});
				}
			);
		} else {
			console.log("No loan data available for status distribution");
			// Add default data
			loanStatusDistribution.push(
				{ name: "Aktif", value: 0, percentage: 0 },
				{ name: "Lunas", value: 0, percentage: 0 },
				{ name: "Menunggu", value: 0, percentage: 0 }
			);
		}
	} catch (error) {
		console.error("Error calculating loan status distribution:", error);
		// Add default data
		loanStatusDistribution.push(
			{ name: "Aktif", value: 0, percentage: 0 },
			{ name: "Lunas", value: 0, percentage: 0 },
			{ name: "Menunggu", value: 0, percentage: 0 }
		);
	}

	// 6. Calculate loan type distribution
	try {
		console.log("Calculating loan type distribution...");
		const loanTypeCounts: Record<string, number> = {};

		if (
			pembiayaanDataForDistribution &&
			pembiayaanDataForDistribution.length > 0
		) {
			pembiayaanDataForDistribution.forEach((pembiayaan: any) => {
				// Use the nested jenis_pembiayaan object to get the name
				const typeName =
					pembiayaan.jenis_pembiayaan?.nama || "unknown";
				loanTypeCounts[typeName] =
					(loanTypeCounts[typeName] || 0) + 1;
			});

			console.log("Loan type counts:", loanTypeCounts);

			Object.entries(loanTypeCounts).forEach(([type, count]) => {
				const total = pembiayaanDataForDistribution.length || 1;
				const percentage = (count / total) * 100;
				loanTypeDistribution.push({
					name:
						type.charAt(0).toUpperCase() +
						type.slice(1),
					value: count,
					percentage,
				});
			});
		} else {
			console.log("No loan data available for type distribution");
			// Add default data
			loanTypeDistribution.push(
				{ name: "Murabahah", value: 0, percentage: 0 },
				{ name: "Mudharabah", value: 0, percentage: 0 }
			);
		}
	} catch (error) {
		console.error("Error calculating loan type distribution:", error);
		// Add default data
		loanTypeDistribution.push(
			{ name: "Murabahah", value: 0, percentage: 0 },
			{ name: "Mudharabah", value: 0, percentage: 0 }
		);
	}

	// Calculate summary metrics
	const totalRegistrations = registrationData.reduce(
		(sum: number, item: any) => sum + item.value,
		0
	);
	const totalLoanAmount = loanData.reduce(
		(sum: number, item: any) => sum + item.value,
		0
	);
	const totalTransactionAmount = transactionData.reduce(
		(sum: number, item: any) => sum + (item.amount || 0),
		0
	);

	// Handle potential undefined values safely
	let activeLoans = 0;
	let approvedLoans = 0;
	let totalLoans = 0;
	let approvalRate = 0;

	try {
		if (
			pembiayaanDataForDistribution &&
			pembiayaanDataForDistribution.length > 0
		) {
			activeLoans =
				pembiayaanDataForDistribution.filter(
					(loan: any) => loan.status === "aktif"
				).length || 0;
			approvedLoans =
				pembiayaanDataForDistribution.filter((loan: any) =>
					["aktif", "lunas", "disetujui"].includes(
						loan.status || ""
					)
				).length || 0;
			totalLoans = pembiayaanDataForDistribution.length || 0;
			approvalRate =
				totalLoans > 0
					? Math.round((approvedLoans / totalLoans) * 100)
					: 0;
		}
	} catch (error) {
		console.error("Error calculating loan metrics:", error);
	}

	return {
		registrationData,
		loanData,
		transactionData,
		statusDistribution,
		loanStatusDistribution,
		loanTypeDistribution,
		totalRegistrations,
		totalLoanAmount,
		totalTransactionAmount,
		activeLoans,
		approvalRate,
	};
};

export default function AnalyticsPage() {
	const { toast } = useToast();
	const { user } = useAdminAuth();
	const [isLoading, setIsLoading] = useState(true);
	const [timeRange, setTimeRange] = useState("6months");
	const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
		null
	);

	// Get role-specific theme
	const roleTheme = user
		? getRoleTheme(user.role)
		: { primary: "", secondary: "", badge: "" };

	// Function to load data
	const loadData = async () => {
		setIsLoading(true);
		try {
			const data = await fetchAnalyticsData(timeRange);
			setAnalyticsData(data);
		} catch (error) {
			console.error("Error loading analytics data:", error);
			toast({
				title: "Error",
				description: "Gagal memuat data analitik",
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
		}
	};

	// Load data on component mount or when timeRange changes
	useEffect(() => {
		loadData();
	}, [timeRange]);

	// Using the CustomTooltip from fixed-charts.tsx

	// Render the summary cards
	const renderSummaryCards = () => {
		if (!analyticsData) return null;

		return (
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium">
							Total Anggota
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{analyticsData.totalRegistrations}
						</div>
						<p className="text-xs text-muted-foreground mt-1">
							Dalam{" "}
							{timeRange === "6months"
								? "6 bulan"
								: "1 tahun"}{" "}
							terakhir
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium">
							Total Pinjaman
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{formatCurrency(
								analyticsData.totalLoanAmount
							)}
						</div>
						<p className="text-xs text-muted-foreground mt-1">
							Dalam{" "}
							{timeRange === "6months"
								? "6 bulan"
								: "1 tahun"}{" "}
							terakhir
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium">
							Pinjaman Aktif
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{analyticsData.activeLoans}
						</div>
						<p className="text-xs text-muted-foreground mt-1">
							Pinjaman yang sedang berjalan
						</p>
					</CardContent>
				</Card>
			</div>
		);
	};

	// Role-specific content
	const renderRoleSpecificContent = () => {
		if (!user || !analyticsData) return null;

		switch (user.role) {
			case "admin":
				return (
					<>
						<div className="bg-gray-900 rounded-lg shadow-lg overflow-hidden mb-6">
							<div className="p-6">
								<h2 className="text-xl font-bold text-white mb-2">
									Tren Pinjaman dan
									Pendaftaran
								</h2>
								<p className="text-gray-300 text-sm">
									Perbandingan tren pinjaman
									dan pendaftaran nasabah
									dalam{" "}
									{timeRange === "6months"
										? "6 bulan"
										: "1 tahun"}{" "}
									terakhir
								</p>
							</div>
							<div className="px-6 pb-6">
								<ImprovedDualAxisBarChart
									data={
										analyticsData.loanData
									}
									formatCurrency={
										formatCurrency
									}
								/>
							</div>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
							<Card className="overflow-hidden">
								<CardHeader>
									<CardTitle>
										Distribusi Status
										Pinjaman
									</CardTitle>
									<CardDescription>
										Distribusi pinjaman
										berdasarkan status
									</CardDescription>
								</CardHeader>
								<CardContent className="px-6 pb-6">
									<ImprovedPieChart
										data={
											analyticsData.loanStatusDistribution
										}
										formatCurrency={
											formatCurrency
										}
									/>
								</CardContent>
							</Card>

							<Card className="overflow-hidden">
								<CardHeader>
									<CardTitle>
										Tren Transaksi
									</CardTitle>
									<CardDescription>
										Tren transaksi masuk
										dalam{" "}
										{timeRange ===
										"6months"
											? "6 bulan"
											: "1 tahun"}{" "}
										terakhir
									</CardDescription>
								</CardHeader>
								<CardContent className="px-6 pb-6">
									<div className="h-80">
										<ImprovedTransactionTrendChart
											data={
												analyticsData.transactionData
											}
										/>
									</div>
								</CardContent>
							</Card>
						</div>
					</>
				);

			case "sekretaris":
				return (
					<>
						<div className="bg-gray-900 rounded-lg shadow-lg overflow-hidden mb-6">
							<div className="p-6">
								<h2 className="text-xl font-bold text-white mb-2">
									Tren Pendaftaran Nasabah
								</h2>
								<p className="text-gray-300 text-sm">
									Tren pendaftaran nasabah
									dalam{" "}
									{timeRange === "6months"
										? "6 bulan"
										: "1 tahun"}{" "}
									terakhir
								</p>
							</div>
							<div className="px-6 pb-6">
								<ImprovedDualAxisBarChart
									data={
										analyticsData.registrationData
									}
									formatCurrency={
										formatCurrency
									}
									isRegistrationData={true}
								/>
							</div>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
							<Card className="overflow-hidden">
								<CardHeader>
									<CardTitle>
										Distribusi Status
										Anggota
									</CardTitle>
									<CardDescription>
										Distribusi status
										anggota koperasi
									</CardDescription>
								</CardHeader>
								<CardContent className="px-4 pb-4">
									<div className="h-80">
										<ResponsiveContainer
											width="100%"
											height="100%"
										>
											<RechartsPieChart>
												<Pie
													data={
														analyticsData.statusDistribution
													}
													cx="50%"
													cy="50%"
													labelLine={
														false
													}
													label={({
														name,
														percent,
													}) =>
														`${name}: ${(
															percent *
															100
														).toFixed(
															0
														)}%`
													}
													outerRadius={
														80
													}
													fill="#8884d8"
													dataKey="value"
												>
													{analyticsData.statusDistribution.map(
														(
															entry,
															index
														) => (
															<Cell
																key={`cell-${index}`}
																fill={
																	CHART_COLORS[
																		index %
																			CHART_COLORS.length
																	]
																}
															/>
														)
													)}
												</Pie>
												<Tooltip />
												<Legend />
											</RechartsPieChart>
										</ResponsiveContainer>
									</div>
								</CardContent>
							</Card>

							<Card className="overflow-hidden">
								<CardHeader>
									<CardTitle>
										Aktivitas
										Pendaftaran Bulanan
									</CardTitle>
									<CardDescription>
										Jumlah pendaftaran
										per bulan
									</CardDescription>
								</CardHeader>
								<CardContent className="px-4 pb-4">
									<ImprovedBarChart
										data={
											analyticsData.registrationData
										}
										dataKey="value"
										name="Jumlah Pendaftaran"
										formatCurrency={
											formatCurrency
										}
									/>
								</CardContent>
							</Card>
						</div>
					</>
				);

			case "bendahara":
				return (
					<>
						<Card
							className={`${roleTheme.secondary} border-none overflow-hidden`}
						>
							<CardHeader>
								<CardTitle>
									Tren Pinjaman
								</CardTitle>
								<CardDescription className="text-white/70">
									Tren pinjaman dalam{" "}
									{timeRange === "6months"
										? "6 bulan"
										: "1 tahun"}{" "}
									terakhir
								</CardDescription>
							</CardHeader>
							<CardContent className="px-6 pb-6">
								<ImprovedTrendChart
									data={
										analyticsData.loanData
									}
									dataKey="value"
									name="Jumlah Pinjaman"
									formatCurrency={
										formatCurrency
									}
									isDarkTheme={true}
								/>
							</CardContent>
						</Card>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
							<Card className="overflow-hidden">
								<CardHeader>
									<CardTitle>
										Distribusi Jenis
										Pinjaman
									</CardTitle>
									<CardDescription>
										Distribusi jenis
										pinjaman
									</CardDescription>
								</CardHeader>
								<CardContent className="px-6 pb-6">
									<ImprovedPieChart
										data={
											analyticsData.loanTypeDistribution
										}
										formatCurrency={
											formatCurrency
										}
									/>
								</CardContent>
							</Card>

							<Card className="overflow-hidden">
								<CardHeader>
									<CardTitle>
										Status Pinjaman
									</CardTitle>
									<CardDescription>
										Distribusi status
										pinjaman
									</CardDescription>
								</CardHeader>
								<CardContent className="px-6 pb-6">
									<ImprovedBarChart
										data={
											analyticsData.loanStatusDistribution
										}
										dataKey="value"
										name="Jumlah Pinjaman"
										formatCurrency={
											formatCurrency
										}
									/>
								</CardContent>
							</Card>
						</div>
					</>
				);

			default:
				return null;
		}
	};

	return (
		<RoleProtected allowedRoles={["admin", "sekretaris", "bendahara"]}>
			<div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8 max-w-7xl">
				<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
					<h1 className="text-3xl font-bold">Analitik</h1>
					<div className="flex items-center gap-4">
						<Select
							value={timeRange}
							onValueChange={setTimeRange}
						>
							<SelectTrigger className="w-[180px]">
								<SelectValue placeholder="Pilih Rentang Waktu" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="6months">
									6 Bulan Terakhir
								</SelectItem>
								<SelectItem value="1year">
									1 Tahun Terakhir
								</SelectItem>
							</SelectContent>
						</Select>
						<Button
							variant="outline"
							disabled={isLoading}
							onClick={loadData}
						>
							{isLoading ? (
								<>
									<div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></div>
									Memuat
								</>
							) : (
								"Refresh"
							)}
						</Button>
					</div>
				</div>

				{isLoading ? (
					<div className="flex flex-col items-center justify-center py-12">
						<Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
						<p className="text-muted-foreground">
							Memuat data analitik...
						</p>
					</div>
				) : analyticsData ? (
					<>
						{renderSummaryCards()}
						{renderRoleSpecificContent()}
					</>
				) : (
					<div className="flex flex-col items-center justify-center py-12">
						<p className="text-muted-foreground">
							Tidak ada data analitik yang tersedia
						</p>
						<Button
							variant="outline"
							className="mt-4"
							onClick={loadData}
						>
							Coba Lagi
						</Button>
					</div>
				)}
			</div>
		</RoleProtected>
	);
}
