import { createClient } from "@supabase/supabase-js";

// Initialize the Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for admin authentication
export type AdminRole = string;

export interface AdminUser {
	id: string;
	username: string;
	role: AdminRole;
	nama: string;
	email?: string;
}

export interface AdminSession {
	user: AdminUser;
	token: string;
	expires_at: string;
}

// Function to login admin user
export async function loginAdmin(
	username: string,
	password: string
): Promise<{
	success: boolean;
	data?: AdminSession;
	error?: string;
}> {
	try {
		const { data, error } = await supabase.rpc("admin_login", {
			p_username: username,
			p_password: password,
		});

		if (error) {
			return { success: false, error: error.message };
		}

		if (!data.success) {
			return { success: false, error: data.message };
		}

		// Store the session in localStorage
		localStorage.setItem(
			"adminSession",
			JSON.stringify({
				user: data.user,
				token: data.token,
				expires_at: data.expires_at,
			})
		);

		return {
			success: true,
			data: {
				user: data.user,
				token: data.token,
				expires_at: data.expires_at,
			},
		};
	} catch (error) {
		return { success: false, error: "An unexpected error occurred" };
	}
}

// Function to get current admin session
export function getAdminSession(): AdminSession | null {
	if (typeof window === "undefined") {
		return null;
	}

	const sessionStr = localStorage.getItem("adminSession");
	if (!sessionStr) {
		return null;
	}

	try {
		const session = JSON.parse(sessionStr) as AdminSession;

		// Check if session is expired
		if (new Date(session.expires_at) < new Date()) {
			localStorage.removeItem("adminSession");
			return null;
		}

		return session;
	} catch (error) {
		localStorage.removeItem("adminSession");
		return null;
	}
}

// Function to verify admin session
export async function verifyAdminSession(token: string): Promise<{
	valid: boolean;
	user?: AdminUser;
	error?: string;
}> {
	try {
		const { data, error } = await supabase.rpc("verify_admin_session", {
			p_token: token,
		});

		if (error) {
			return { valid: false, error: error.message };
		}

		if (!data.valid) {
			return { valid: false, error: data.message };
		}

		return { valid: true, user: data.user };
	} catch (error) {
		return { valid: false, error: "An unexpected error occurred" };
	}
}

// Function to logout admin user
export function logoutAdmin(): void {
	if (typeof window === "undefined") {
		return;
	}

	localStorage.removeItem("adminSession");
	window.location.href = "/login";
}

// Function to check if user has permission for a specific action
export function hasPermission(role: AdminRole, action: string): boolean {
	const permissions: Record<string, string[]> = {
		ketua: ["view_dashboard", "view_reports"],
		admin: [
			"view_all",
			"edit_all",
			"approve_all",
			"reject_all",
			"view_roles",
			"manage_roles",
		],
		sekretaris: [
			"view_dashboard",
			"view_users",
			"edit_users",
			"delete_users",
			"approve_customers",
			"reject_customers",
			"view_notifications",
		],
		bendahara: [
			"view_all",
			"edit_transactions",
			"approve_transactions",
			"reject_transactions",
		],
	};

	// Special case for admin role
	if (role === "admin" && action.startsWith("view_")) {
		return true;
	}

	return permissions[role as string]?.includes(action) || false;
}

// Role-based access control for navigation items
export function getAuthorizedNavigation(role: AdminRole) {
	// All roles can see the dashboard
	const authorizedNavigation = [
		{ name: "Dashboard", href: "/", icon: "Home" },
	];

	// Role-specific navigation items
	const navigationByRole: Record<string, string[]> = {
		ketua: ["Laporan"],
		admin: [
			"Manajemen User",
			"Transaksi",
			"Pinjaman",
			"Laporan",
			"Analitik",
			"Notifikasi",
			"Import Data",
			"Role Management",
		],
		sekretaris: ["Manajemen User", "Notifikasi"],
		bendahara: [
			"Transaksi",
			"Pinjaman",
			"Laporan",
			"Analitik",
			"Notifikasi",
		],
	};

	// Default to empty array if role doesn't exist in the mapping
	return navigationByRole[role as string] || [];
}
