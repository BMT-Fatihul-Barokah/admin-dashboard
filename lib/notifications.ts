import { supabase } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";

// Types for notifications
export type GlobalNotification = {
	id: string;
	judul: string;
	pesan: string;
	jenis: string;
	data?: any;
	created_at: Date;
	updated_at: Date;
};

export type GlobalNotificationRead = {
	id: string;
	global_notifikasi_id: string;
	anggota_id: string;
	is_read: boolean;
	created_at: Date;
	updated_at: Date;
};

export type TransactionNotification = {
	id: string;
	judul: string;
	pesan: string;
	jenis: string;
	data?: any;
	is_read: boolean;
	created_at: Date;
	updated_at: Date;
	transaksi_id?: string;
};

export type CombinedNotification = {
	id: string;
	judul: string;
	pesan: string;
	jenis: string;
	is_read: boolean;
	data?: any;
	created_at: Date;
	updated_at: Date;
	source: "global" | "transaction";
	transaksi_id?: string;
};

// Get all global notifications
export async function getGlobalNotifications(): Promise<GlobalNotification[]> {
	try {
		console.log("Fetching global notifications...");
		const { data, error } = await supabase
			.from("global_notifikasi")
			.select("*")
			.order("created_at", { ascending: false });

		if (error) {
			console.error("Error fetching global notifications:", error);
			console.error("Error details:", JSON.stringify(error));

			// Try a simpler query as fallback
			console.log(
				"Attempting fallback query for global notifications..."
			);
			const fallback = await supabase
				.from("global_notifikasi")
				.select(
					"id, judul, pesan, jenis, created_at, updated_at"
				);

			if (fallback.error) {
				console.error(
					"Fallback query also failed:",
					fallback.error
				);
				return [];
			}

			return fallback.data || [];
		}

		console.log(`Retrieved ${data?.length || 0} global notifications`);
		return data || [];
	} catch (error) {
		console.error("Error in getGlobalNotifications:", error);
		return [];
	}
}

// Get global notification read status for a specific user
export async function getGlobalNotificationReadStatus(
	anggotaId: string
): Promise<GlobalNotificationRead[]> {
	try {
		const { data, error } = await supabase
			.from("global_notifikasi_read")
			.select("*")
			.eq("anggota_id", anggotaId);

		if (error) {
			console.error(
				"Error fetching notification read status:",
				error
			);
			throw error;
		}

		return data || [];
	} catch (error) {
		console.error("Error in getGlobalNotificationReadStatus:", error);
		return [];
	}
}

// Get transaction notifications
export async function getTransactionNotifications(): Promise<
	TransactionNotification[]
> {
	try {
		console.log("Fetching transaction notifications...");
		const { data, error } = await supabase
			.from("transaksi_notifikasi")
			.select("*")
			.order("created_at", { ascending: false });

		if (error) {
			console.error(
				"Error fetching transaction notifications:",
				error
			);
			console.error("Error details:", JSON.stringify(error));

			// Try a simpler query as fallback
			console.log(
				"Attempting fallback query for transaction notifications..."
			);
			const fallback = await supabase
				.from("transaksi_notifikasi")
				.select(
					"id, judul, pesan, jenis, is_read, created_at, updated_at"
				);

			if (fallback.error) {
				console.error(
					"Fallback query also failed:",
					fallback.error
				);
				return [];
			}

			return fallback.data || [];
		}

		console.log(
			`Retrieved ${data?.length || 0} transaction notifications`
		);
		return data || [];
	} catch (error) {
		console.error("Error in getTransactionNotifications:", error);
		return [];
	}
}

// Get combined notifications (global + transaction) using the new SQL function
// Use direct Supabase URL and key as a last resort if needed
const DIRECT_SUPABASE_URL = "https://vszhxeamcxgqtwyaxhlu.supabase.co";
const DIRECT_SUPABASE_KEY =
	"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzemh4ZWFtY3hncXR3eWF4aGx1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4NDQ0ODYsImV4cCI6MjA2NDQyMDQ4Nn0.x6Nj5UAHLA2nsNfvK4P8opRkB0U3--ZFt7Dc3Dj-q94";

// Helper function to check if a notification is a jatuh tempo notification
export function isJatuhTempoNotification(
	notification: CombinedNotification
): boolean {
	return (
		notification.jenis === "jatuh_tempo" ||
		(notification.jenis === "transaksi" &&
			notification.data &&
			notification.data.jatuh_tempo &&
			notification.pesan &&
			notification.pesan.toLowerCase().includes("jatuh tempo"))
	);
}

export async function getCombinedNotifications(
	anggotaId?: string
): Promise<CombinedNotification[]> {
	try {
		console.log(
			"Fetching combined notifications using SQL function..."
		);

		// Use the new SQL function that bypasses RLS
		const { data, error } = await supabase.rpc("get_all_notifications");

		if (error) {
			console.error(
				"Error fetching notifications with RPC:",
				error
			);
			console.error("Error details:", JSON.stringify(error));

			// Fallback to the old method if RPC fails
			console.log("Falling back to separate queries...");
			return getFallbackCombinedNotifications(anggotaId);
		}

		console.log(
			`Retrieved ${
				data?.length || 0
			} notifications from SQL function`
		);

		// Get read status for global notifications if anggotaId is provided
		let readStatusMap: Record<string, boolean> = {};
		if (anggotaId) {
			try {
				const { data: readStatus, error: readError } =
					await supabase.rpc(
						"get_notification_read_status",
						{ p_anggota_id: anggotaId }
					);

				if (!readError && readStatus) {
					readStatusMap = readStatus.reduce(
						(
							acc: Record<string, boolean>,
							item: {
								notification_id: string;
								is_read: boolean;
							}
						) => {
							acc[item.notification_id] =
								item.is_read;
							return acc;
						},
						{} as Record<string, boolean>
					);
				}
			} catch (readError) {
				console.error("Error getting read status:", readError);
			}
		}

		// Process the notifications
		const combined: CombinedNotification[] =
			data?.map((notification: any) => {
				// For global notifications, check the read status map
				const isRead =
					notification.source === "global"
						? readStatusMap[notification.id] || false
						: notification.is_read || false;

				return {
					...notification,
					is_read: isRead,
					source: notification.source as
						| "global"
						| "transaction",
				};
			}) || [];

		console.log(`Processed ${combined.length} total notifications`);
		return combined;
	} catch (error) {
		console.error("Error in getCombinedNotifications:", error);
		return [];
	}
}

// Fallback method using separate queries
async function getFallbackCombinedNotifications(
	anggotaId?: string
): Promise<CombinedNotification[]> {
	try {
		console.log("Using fallback method for notifications...");

		// Try direct queries with minimal fields
		const { data: globalData } = await supabase
			.from("global_notifikasi")
			.select("id, judul, pesan, jenis, created_at, updated_at")
			.order("created_at", { ascending: false });

		const { data: transactionData } = await supabase
			.from("transaksi_notifikasi")
			.select(
				"id, judul, pesan, jenis, is_read, created_at, updated_at, transaksi_id"
			)
			.order("created_at", { ascending: false });

		console.log(
			`Fallback retrieved: ${globalData?.length || 0} global, ${
				transactionData?.length || 0
			} transaction`
		);

		// Get read status for global notifications if anggotaId is provided
		let readStatusMap: Record<string, boolean> = {};
		if (anggotaId && globalData?.length) {
			const { data: readStatus } = await supabase
				.from("global_notifikasi_read")
				.select("global_notifikasi_id, is_read")
				.eq("anggota_id", anggotaId);

			if (readStatus) {
				readStatusMap = readStatus.reduce(
					(
						acc: Record<string, boolean>,
						item: {
							global_notifikasi_id: string;
							is_read: boolean;
						}
					) => {
						acc[item.global_notifikasi_id] =
							item.is_read;
						return acc;
					},
					{} as Record<string, boolean>
				);
			}
		}

		// Combine notifications
		const combined: CombinedNotification[] = [
			...(globalData || []).map((notification: any) => ({
				...notification,
				data: {},
				is_read: readStatusMap[notification.id] || false,
				source: "global" as const,
			})),
			...(transactionData || []).map((notification: any) => ({
				...notification,
				data: {},
				source: "transaction" as const,
			})),
		];

		// Sort by created_at (newest first)
		return combined.sort((a, b) => {
			return (
				new Date(b.created_at).getTime() -
				new Date(a.created_at).getTime()
			);
		});
	} catch (error) {
		console.error("Error in fallback notifications:", error);

		// Last resort: try with direct hardcoded client
		try {
			console.log("Attempting last resort direct query...");
			const directClient = createClient(
				DIRECT_SUPABASE_URL,
				DIRECT_SUPABASE_KEY
			);

			const { data: globalData } = await directClient
				.from("global_notifikasi")
				.select(
					"id, judul, pesan, jenis, created_at, updated_at"
				)
				.limit(10);

			const { data: transactionData } = await directClient
				.from("transaksi_notifikasi")
				.select(
					"id, judul, pesan, jenis, is_read, created_at, updated_at"
				)
				.limit(10);

			console.log(
				`Last resort retrieved: ${
					globalData?.length || 0
				} global, ${transactionData?.length || 0} transaction`
			);

			// Combine notifications
			const combined: CombinedNotification[] = [
				...(globalData || []).map((notification: any) => ({
					...notification,
					data: {},
					is_read: false,
					source: "global" as const,
				})),
				...(transactionData || []).map((notification: any) => ({
					...notification,
					data: {},
					source: "transaction" as const,
				})),
			];

			return combined.sort((a, b) => {
				return (
					new Date(b.created_at).getTime() -
					new Date(a.created_at).getTime()
				);
			});
		} catch (lastError) {
			console.error("Even last resort failed:", lastError);
			return [];
		}
	}
}

// Mark global notification as read
export async function markGlobalNotificationAsRead(
	notificationId: string,
	anggotaId: string
): Promise<boolean> {
	try {
		// Check if read status exists
		const { data: existingStatus } = await supabase
			.from("global_notifikasi_read")
			.select("*")
			.eq("global_notifikasi_id", notificationId)
			.eq("anggota_id", anggotaId)
			.single();

		if (existingStatus) {
			// Update existing status
			const { error } = await supabase
				.from("global_notifikasi_read")
				.update({ is_read: true, updated_at: new Date() })
				.eq("id", existingStatus.id);

			if (error) throw error;
		} else {
			// Create new read status
			const { error } = await supabase
				.from("global_notifikasi_read")
				.insert({
					global_notifikasi_id: notificationId,
					anggota_id: anggotaId,
					is_read: true,
				});

			if (error) throw error;
		}

		return true;
	} catch (error) {
		console.error("Error marking global notification as read:", error);
		return false;
	}
}

// Mark transaction notification as read
export async function markTransactionNotificationAsRead(
	notificationId: string
): Promise<boolean> {
	try {
		const { error } = await supabase
			.from("transaksi_notifikasi")
			.update({ is_read: true, updated_at: new Date() })
			.eq("id", notificationId);

		if (error) throw error;
		return true;
	} catch (error) {
		console.error(
			"Error marking transaction notification as read:",
			error
		);
		return false;
	}
}

// Mark notification as read (handles both types)
export async function markNotificationAsRead(
	notification: CombinedNotification,
	anggotaId?: string
): Promise<boolean> {
	if (notification.source === "global" && anggotaId) {
		return markGlobalNotificationAsRead(notification.id, anggotaId);
	} else if (notification.source === "transaction") {
		return markTransactionNotificationAsRead(notification.id);
	}
	return false;
}

// Direct fetch method that can be called from components
export async function fetchNotifications(): Promise<CombinedNotification[]> {
	console.log("Direct fetch method called");

	try {
		// Try SQL function first with explicit authentication
		console.log("Trying to fetch notifications using RPC function...");
		const { data: rpcData, error: rpcError } = await supabase.rpc(
			"get_all_notifications"
		);

		if (!rpcError && rpcData && rpcData.length > 0) {
			console.log(
				`SQL function returned ${rpcData.length} notifications`
			);
			return rpcData.map((item: any) => ({
				...item,
				is_read: item.is_read || false,
				source: item.source as "global" | "transaction",
			}));
		}

		if (rpcError) {
			console.error("RPC error:", rpcError);
		}

		// Try separate direct queries as fallback
		console.log("Trying direct queries as fallback...");

		// Use the same supabase client for consistency
		const [globalResult, transactionResult] = await Promise.all([
			supabase
				.from("global_notifikasi")
				.select("*")
				.order("created_at", { ascending: false })
				.limit(50),
			supabase
				.from("transaksi_notifikasi")
				.select("*")
				.order("created_at", { ascending: false })
				.limit(50),
		]);

		if (globalResult.error) {
			console.error(
				"Global notifications query error:",
				globalResult.error
			);
		}

		if (transactionResult.error) {
			console.error(
				"Transaction notifications query error:",
				transactionResult.error
			);
		}

		const globalData = globalResult.data || [];
		const transactionData = transactionResult.data || [];

		console.log(
			`Direct queries returned ${globalData.length} global and ${transactionData.length} transaction notifications`
		);

		// If both direct queries failed, try with hardcoded client as last resort
		if (globalData.length === 0 && transactionData.length === 0) {
			console.log(
				"Both direct queries failed, trying with hardcoded client..."
			);
			const directClient = createClient(
				"https://vszhxeamcxgqtwyaxhlu.supabase.co",
				"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzemh4ZWFtY3hncXR3eWF4aGx1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4NDQ0ODYsImV4cCI6MjA2NDQyMDQ4Nn0.x6Nj5UAHLA2nsNfvK4P8opRkB0U3--ZFt7Dc3Dj-q94"
			);

			const [hardcodedGlobalResult, hardcodedTransactionResult] =
				await Promise.all([
					directClient
						.from("global_notifikasi")
						.select("*")
						.order("created_at", { ascending: false })
						.limit(50),
					directClient
						.from("transaksi_notifikasi")
						.select("*")
						.order("created_at", { ascending: false })
						.limit(50),
				]);

			const hardcodedGlobalData = hardcodedGlobalResult.data || [];
			const hardcodedTransactionData =
				hardcodedTransactionResult.data || [];

			console.log(
				`Hardcoded client returned ${hardcodedGlobalData.length} global and ${hardcodedTransactionData.length} transaction notifications`
			);

			const combined: CombinedNotification[] = [
				...hardcodedGlobalData.map((item: any) => ({
					...item,
					is_read: false,
					source: "global" as const,
				})),
				...hardcodedTransactionData.map((item: any) => ({
					...item,
					source: "transaction" as const,
				})),
			];

			return combined.sort((a, b) => {
				return (
					new Date(b.created_at).getTime() -
					new Date(a.created_at).getTime()
				);
			});
		}

		// Process results from direct queries if they succeeded
		const combined: CombinedNotification[] = [
			...globalData.map((item: any) => ({
				...item,
				is_read: false,
				source: "global" as const,
			})),
			...transactionData.map((item: any) => ({
				...item,
				source: "transaction" as const,
			})),
		];

		return combined.sort((a, b) => {
			return (
				new Date(b.created_at).getTime() -
				new Date(a.created_at).getTime()
			);
		});
	} catch (error) {
		console.error("All notification fetch methods failed:", error);
		return [];
	}
}

// Mark all notifications as read
export async function markAllNotificationsAsRead(
	anggotaId: string
): Promise<boolean> {
	try {
		// Get all global notifications
		const globalNotifications = await getGlobalNotifications();

		// Create read status for each global notification
		for (const notification of globalNotifications) {
			await markGlobalNotificationAsRead(
				notification.id,
				anggotaId
			);
		}

		// Mark all transaction notifications as read
		const { error } = await supabase
			.from("transaksi_notifikasi")
			.update({ is_read: true, updated_at: new Date() })
			.eq("is_read", false);

		if (error) throw error;

		return true;
	} catch (error) {
		console.error("Error marking all notifications as read:", error);
		return false;
	}
}

// Get unread notification count
export async function getUnreadNotificationCount(
	anggotaId?: string
): Promise<number> {
	try {
		const notifications = await getCombinedNotifications(anggotaId);
		return notifications.filter((notification) => !notification.is_read)
			.length;
	} catch (error) {
		console.error("Error getting unread notification count:", error);
		return 0;
	}
}
