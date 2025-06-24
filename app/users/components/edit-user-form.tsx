"use client";

import { useState, useEffect } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { createClient } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

// Create a direct Supabase client instance using environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

// Use anon key for all operations - RLS policies will handle permissions
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create a single Supabase client instance
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function to generate a UUID
function generateUUID() {
	// This is a simple implementation that creates a random UUID
	return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
		/[xy]/g,
		function (c) {
			const r = (Math.random() * 16) | 0,
				v = c === "x" ? r : (r & 0x3) | 0x8;
			return v.toString(16);
		}
	);
}

type Anggota = {
	id: string;
	nama: string;
	nomor_rekening: string;
	alamat?: string;
	kota?: string;
	tempat_lahir?: string;
	tanggal_lahir?: Date | string;
	pekerjaan?: string;
	jenis_identitas?: string;
	nomor_identitas?: string;
	created_at: Date | string;
	updated_at: Date | string;
	closed_at?: Date | string;
	is_active: boolean;
};

interface EditUserFormProps {
	user: Anggota | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onUserUpdated: () => void;
}

export function EditUserForm({
	user,
	open,
	onOpenChange,
	onUserUpdated,
}: EditUserFormProps) {
	const { toast } = useToast();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [formData, setFormData] = useState<Partial<Anggota>>({
		nama: "",
		alamat: "",
		kota: "",
		tempat_lahir: "",
		tanggal_lahir: "",
		pekerjaan: "",
		jenis_identitas: "",
		nomor_identitas: "",
		nomor_rekening: "",
	});

	// Initialize form data when user changes or dialog opens
	useEffect(() => {
		if (user) {
			// Editing existing user
			setFormData({
				nama: user.nama,
				alamat: user.alamat || "",
				kota: user.kota || "",
				tempat_lahir: user.tempat_lahir || "",
				tanggal_lahir: user.tanggal_lahir
					? typeof user.tanggal_lahir === "string"
						? user.tanggal_lahir.split("T")[0]
						: format(user.tanggal_lahir, "yyyy-MM-dd")
					: "",
				pekerjaan: user.pekerjaan || "",
				jenis_identitas: user.jenis_identitas || "",
				nomor_identitas: user.nomor_identitas || "",
				nomor_rekening: user.nomor_rekening,
			});
		} else {
			// Adding new user - reset to defaults
			setFormData({
				nama: "",
				alamat: "",
				kota: "",
				tempat_lahir: "",
				tanggal_lahir: "",
				pekerjaan: "",
				jenis_identitas: "",
				nomor_identitas: "",
				nomor_rekening: "",
			});
		}
	}, [user, open]); // Dependencies to prevent infinite rendering

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleSelectChange = (name: string, value: string) => {
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		// Validate form data before setting isSubmitting
		// This prevents showing the loading state if validation fails immediately
		const validationError = validateFormData(formData);
		if (validationError) {
			toast({
				title: "Validasi Gagal",
				description: validationError,
				variant: "destructive",
			});
			return;
		}

		setIsSubmitting(true);
		try {
			let result;
			if (user) {
				await updateExistingUser();
				// After successful operation
				onUserUpdated();
				onOpenChange(false);
			} else {
				result = await addNewUser();
				if (result.success) {
					// After successful operation
					onUserUpdated();
					onOpenChange(false);
				} else {
					// Handle validation/business logic errors without throwing
					toast({
						title: "Gagal Menyimpan Data",
						description: result.error,
						variant: "destructive",
					});
				}
			}
		} catch (error: any) {
			// Only for unexpected technical errors
			console.error("Unexpected error in handleSubmit:", error);
			handleSubmissionError(error);
		} finally {
			setIsSubmitting(false);
		}
	};

	// Validate form data and return error message if invalid
	const validateFormData = (data: Partial<Anggota>): string | null => {
		if (!data.nama || data.nama.trim() === "") {
			return "Nama anggota harus diisi";
		}

		if (!data.nomor_rekening || data.nomor_rekening.trim() === "") {
			return "Nomor rekening harus diisi";
		}

		// Additional validations can be added here
		return null;
	};

	// Handle updating an existing user
	const updateExistingUser = async () => {
		try {
			if (!user || !user.id) {
				throw new Error("ID anggota tidak valid");
			}

			// Format date properly for Supabase
			let formattedDate = null;
			if (formData.tanggal_lahir) {
				try {
					// Ensure date is in YYYY-MM-DD format
					formattedDate =
						typeof formData.tanggal_lahir === "string"
							? formData.tanggal_lahir.split("T")[0]
							: format(
									formData.tanggal_lahir,
									"yyyy-MM-dd"
							  );
				} catch (e) {
					console.warn("Error formatting date:", e);
					formattedDate = null;
				}
			}

			const now = new Date().toISOString();
			const updateData = {
				nama: formData.nama?.trim() || "",
				alamat: formData.alamat?.trim() || null,
				kota: formData.kota?.trim() || null,
				tempat_lahir: formData.tempat_lahir?.trim() || null,
				tanggal_lahir: formattedDate,
				pekerjaan: formData.pekerjaan?.trim() || null,
				jenis_identitas: formData.jenis_identitas || null,
				nomor_identitas:
					formData.nomor_identitas?.trim() || null,
				updated_at: now,
			};

			console.log(
				"Updating user with data:",
				JSON.stringify(updateData, null, 2)
			);

			// Update anggota in database
			const { data, error } = await supabase
				.from("anggota")
				.update(updateData)
				.eq("id", user.id)
				.select();

			if (error) {
				console.error(
					"Update error:",
					JSON.stringify(error, null, 2)
				);
				throw error;
			}

			if (!data || data.length === 0) {
				// Try to verify if the update happened
				const { data: checkData, error: checkError } =
					await supabase
						.from("anggota")
						.select()
						.eq("id", user.id)
						.single();

				if (checkError) {
					console.error(
						"Error checking updated data:",
						checkError
					);
					throw new Error(
						"Gagal memverifikasi data yang diperbarui"
					);
				}

				if (!checkData) {
					throw new Error("Tidak ada data yang diperbarui");
				}

				toast({
					title: "Berhasil",
					description: `Data anggota ${formData.nama} telah diperbarui.`,
				});

				return checkData;
			}

			toast({
				title: "Berhasil",
				description: `Data anggota ${formData.nama} telah diperbarui.`,
			});

			return data[0];
		} catch (error) {
			console.error("Error in updateExistingUser:", error);
			throw error;
		}
	};

	// Handle adding a new user
	const addNewUser = async () => {
		// Generate a unique account number if not provided
		let accountNumber = formData.nomor_rekening?.trim();
		if (!accountNumber) {
			const now = new Date();
			const year = now.getFullYear().toString().slice(-2);
			const month = (now.getMonth() + 1)
				.toString()
				.padStart(2, "0");
			const day = now.getDate().toString().padStart(2, "0");
			const timestamp = Date.now().toString().slice(-6);
			const randomDigits = Math.floor(Math.random() * 10000)
				.toString()
				.padStart(4, "0");
			accountNumber = `${year}${month}${day}${timestamp}${randomDigits}`;
		}

		// Check if nomor_rekening already exists
		const { data: existingByAccount, error: accountCheckError } =
			await supabase
				.from("anggota")
				.select("id, nama")
				.eq("nomor_rekening", accountNumber)
				.maybeSingle();

		if (accountCheckError) {
			console.error(
				"Error checking existing account number:",
				accountCheckError
			);
			return {
				success: false,
				error: "Gagal memverifikasi nomor rekening",
			};
		}

		if (existingByAccount) {
			const errorMsg = `Nomor rekening ${accountNumber} sudah terdaftar atas nama ${existingByAccount.nama}`;
			return {
				success: false,
				error: errorMsg,
			};
		}

		// Check if nama already exists
		const { data: existingByName, error: nameCheckError } =
			await supabase
				.from("anggota")
				.select("id, nomor_rekening")
				.eq("nama", formData.nama?.trim())
				.maybeSingle();

		if (nameCheckError) {
			console.error(
				"Error checking existing name:",
				nameCheckError
			);
			return {
				success: false,
				error: "Gagal memverifikasi nama anggota",
			};
		}

		if (existingByName) {
			const errorMsg = `Anggota dengan nama ${formData.nama?.trim()} sudah terdaftar dengan nomor rekening ${
				existingByName.nomor_rekening
			}`;
			return {
				success: false,
				error: errorMsg,
			};
		}

		try {
			// Format date properly for Supabase
			let formattedDate = null;
			if (formData.tanggal_lahir) {
				try {
					// Ensure date is in YYYY-MM-DD format
					formattedDate =
						typeof formData.tanggal_lahir === "string"
							? formData.tanggal_lahir.split("T")[0]
							: format(
									formData.tanggal_lahir,
									"yyyy-MM-dd"
							  );
				} catch (e) {
					console.warn("Error formatting date:", e);
					formattedDate = null;
				}
			}

			const now = new Date().toISOString();

			// Prepare data for insert - ensure all fields are properly formatted
			const insertData = {
				id: generateUUID(), // Generate a UUID for the new user
				nama: formData.nama?.trim() || "",
				nomor_rekening: accountNumber,
				alamat: formData.alamat?.trim() || null,
				kota: formData.kota?.trim() || null,
				tempat_lahir: formData.tempat_lahir?.trim() || null,
				tanggal_lahir: formattedDate,
				pekerjaan: formData.pekerjaan?.trim() || null,
				jenis_identitas: formData.jenis_identitas || null,
				nomor_identitas:
					formData.nomor_identitas?.trim() || null,
				created_at: now,
				updated_at: now,
				is_active: true,
			};

			// Log the exact data being sent to Supabase
			console.log(
				"Adding new user with data:",
				JSON.stringify(insertData, null, 2)
			);

			// Use insert instead of upsert to prevent unwanted updates
			const { data, error } = await supabase
				.from("anggota")
				.insert(insertData)
				.select();

			if (error) {
				console.error(
					"Insert error:",
					JSON.stringify(error, null, 2)
				);

				// Handle specific database constraint errors
				if (error.code === "23505") {
					if (error.message.includes("nomor_rekening")) {
						return {
							success: false,
							error: "Nomor rekening sudah digunakan. Silakan gunakan nomor rekening lain.",
						};
					} else if (error.message.includes("nama")) {
						return {
							success: false,
							error: "Nama anggota sudah terdaftar. Silakan gunakan nama lain.",
						};
					} else {
						return {
							success: false,
							error: "Data yang dimasukkan sudah ada. Silakan periksa kembali.",
						};
					}
				}

				return {
					success: false,
					error:
						error.message ||
						"Terjadi kesalahan database",
				};
			}

			if (!data || data.length === 0) {
				return {
					success: false,
					error: "Gagal menambahkan data baru",
				};
			}

			toast({
				title: "Berhasil",
				description: `Anggota baru "${formData.nama?.trim()}" dengan nomor rekening ${accountNumber} telah ditambahkan.`,
			});

			return {
				success: true,
				data: data[0],
			};
		} catch (error) {
			console.error("Unexpected error in addNewUser:", error);
			return {
				success: false,
				error:
					error instanceof Error
						? error.message
						: "Terjadi kesalahan yang tidak terduga",
			};
		}
	};

	// Handle submission errors
	const handleSubmissionError = (error: any) => {
		console.error("Form submission error:", error);

		// Extract user-friendly error message
		let errorMessage = "";

		if (error instanceof Error) {
			errorMessage = error.message;
		} else if (error && typeof error === "object") {
			if ("message" in error) {
				errorMessage = error.message;
			} else if ("details" in error) {
				errorMessage = error.details;
			} else if ("code" in error && error.code === "23505") {
				errorMessage =
					"Data yang dimasukkan sudah ada dalam database.";
			} else {
				errorMessage =
					"Terjadi kesalahan pada server. Silakan coba lagi.";
			}
		} else {
			errorMessage =
				"Terjadi kesalahan yang tidak diketahui. Silakan coba lagi.";
		}

		// Show toast notification for unexpected errors
		toast({
			title: "Gagal Menyimpan Data",
			description: errorMessage,
			variant: "destructive",
		});
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[600px]">
				<DialogHeader>
					<DialogTitle>
						{user
							? "Edit Anggota"
							: "Tambah Anggota Baru"}
					</DialogTitle>
					<DialogDescription>
						{user
							? `Edit informasi anggota ${user.nama}`
							: "Masukkan informasi anggota baru"}
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit}>
					<div className="grid gap-4 py-4">
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="nomor_rekening">
									Nomor Rekening
								</Label>
								<Input
									id="nomor_rekening"
									name="nomor_rekening"
									value={
										formData.nomor_rekening ||
										""
									}
									onChange={
										!user
											? handleChange
											: undefined
									}
									disabled={!!user}
									placeholder={
										user
											? ""
											: "Wajib Diisi"
									}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="nama">
									Nama Lengkap
								</Label>
								<Input
									id="nama"
									name="nama"
									value={
										formData.nama || ""
									}
									onChange={handleChange}
									required
								/>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="alamat">Alamat</Label>
							<Input
								id="alamat"
								name="alamat"
								value={formData.alamat || ""}
								onChange={handleChange}
							/>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="kota">
									Kota
								</Label>
								<Input
									id="kota"
									name="kota"
									value={
										formData.kota || ""
									}
									onChange={handleChange}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="tempat_lahir">
									Tempat Lahir
								</Label>
								<Input
									id="tempat_lahir"
									name="tempat_lahir"
									value={
										formData.tempat_lahir ||
										""
									}
									onChange={handleChange}
								/>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="tanggal_lahir">
									Tanggal Lahir
								</Label>
								<Input
									id="tanggal_lahir"
									name="tanggal_lahir"
									type="date"
									value={
										formData.tanggal_lahir
											? String(
													formData.tanggal_lahir
											  ).split(
													"T"
											  )[0]
											: ""
									}
									onChange={handleChange}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="pekerjaan">
									Pekerjaan
								</Label>
								<Input
									id="pekerjaan"
									name="pekerjaan"
									value={
										formData.pekerjaan ||
										""
									}
									onChange={handleChange}
								/>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="jenis_identitas">
									Jenis Identitas
								</Label>
								<Select
									value={
										formData.jenis_identitas ||
										""
									}
									onValueChange={(value) =>
										handleSelectChange(
											"jenis_identitas",
											value
										)
									}
								>
									<SelectTrigger>
										<SelectValue placeholder="Pilih jenis identitas" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="KTP">
											KTP
										</SelectItem>
										<SelectItem value="SIM">
											SIM
										</SelectItem>
										<SelectItem value="Paspor">
											Paspor
										</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-2">
								<Label htmlFor="nomor_identitas">
									Nomor Identitas
								</Label>
								<Input
									id="nomor_identitas"
									name="nomor_identitas"
									value={
										formData.nomor_identitas ||
										""
									}
									onChange={handleChange}
								/>
							</div>
						</div>
					</div>
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							Batal
						</Button>
						<Button
							type="submit"
							disabled={isSubmitting}
						>
							{isSubmitting
								? "Menyimpan..."
								: user
								? "Simpan Perubahan"
								: "Tambah Anggota"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
