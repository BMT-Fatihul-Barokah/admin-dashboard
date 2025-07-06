// Test script for loan creation
const { createClient } = require("@supabase/supabase-js");

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testLoanCreation() {
	console.log("Starting loan creation test...");

	try {
		// 1. Get a test anggota (member)
		console.log("Fetching a test anggota...");
		const { data: anggotaData, error: anggotaError } = await supabase
			.from("anggota")
			.select("id")
			.limit(1);

		if (anggotaError) {
			console.error("Error fetching anggota:", anggotaError);
			return;
		}

		if (!anggotaData || anggotaData.length === 0) {
			console.error("No anggota found in the database");
			return;
		}

		const anggotaId = anggotaData[0].id;
		console.log("Using anggota ID:", anggotaId);

		// 2. Get a test jenis_pembiayaan (loan type)
		console.log("Fetching a test jenis_pembiayaan...");
		const { data: jenisPembiayaanData, error: jenisPembiayaanError } =
			await supabase.from("jenis_pembiayaan").select("id").limit(1);

		if (jenisPembiayaanError) {
			console.error(
				"Error fetching jenis_pembiayaan:",
				jenisPembiayaanError
			);
			return;
		}

		if (!jenisPembiayaanData || jenisPembiayaanData.length === 0) {
			console.error("No jenis_pembiayaan found in the database");
			return;
		}

		const jenisPembiayaanId = jenisPembiayaanData[0].id;
		console.log("Using jenis_pembiayaan ID:", jenisPembiayaanId);

		// 3. Call the add_pembiayaan RPC function
		console.log("Calling add_pembiayaan RPC function...");
		const today = new Date();
		const nextMonth = new Date(
			today.getFullYear(),
			today.getMonth() + 1,
			today.getDate()
		);
		const formattedDate = nextMonth.toISOString().split("T")[0]; // Format as YYYY-MM-DD

		const { data, error } = await supabase.rpc("add_pembiayaan", {
			p_anggota_id: anggotaId,
			p_jenis_pembiayaan_id: jenisPembiayaanId,
			p_jumlah: 1000000,
			p_jatuh_tempo: formattedDate,
			p_durasi_bulan: 3,
			p_deskripsi: "Test loan creation",
		});

		if (error) {
			console.error(
				"Error calling add_pembiayaan RPC function:",
				error
			);
			return;
		}

		console.log("RPC function response:", data);

		if (data && data.success) {
			console.log(
				"Loan creation successful! Pembiayaan ID:",
				data.pembiayaan_id
			);

			// 4. Verify the loan was created
			const { data: pembiayaanData, error: pembiayaanError } =
				await supabase
					.from("pembiayaan")
					.select("*")
					.eq("id", data.pembiayaan_id)
					.single();

			if (pembiayaanError) {
				console.error(
					"Error fetching created pembiayaan:",
					pembiayaanError
				);
				return;
			}

			console.log("Created pembiayaan details:", pembiayaanData);
		} else {
			console.error("Loan creation failed:", data);
		}
	} catch (error) {
		console.error("Exception in testLoanCreation:", error);
	}
}

// Run the test
testLoanCreation();
