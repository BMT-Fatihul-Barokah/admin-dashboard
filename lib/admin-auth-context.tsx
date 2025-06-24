"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
	AdminUser,
	AdminRole,
	getAdminSession,
	verifyAdminSession,
	logoutAdmin,
} from "./admin-auth";
import { useRouter, usePathname } from "next/navigation";

interface AdminAuthContextType {
	user: AdminUser | null;
	role: AdminRole | null;
	isLoading: boolean;
	isAuthenticated: boolean;
	logout: () => void;
	setUser: (user: AdminUser) => void;
	hasPermission: (action: string) => boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType>({
	user: null,
	role: null,
	isLoading: true,
	isAuthenticated: false,
	logout: () => {},
	setUser: () => {},
	hasPermission: () => false,
});

export const useAdminAuth = () => useContext(AdminAuthContext);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<AdminUser | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const router = useRouter();
	const pathname = usePathname();

	useEffect(() => {
		const checkAuth = async () => {
			const session = getAdminSession();

			if (!session) {
				setIsLoading(false);
				if (pathname !== "/login") {
					router.push("/login");
				}
				return;
			}

			try {
				const { valid, user: verifiedUser } =
					await verifyAdminSession(session.token);

				if (valid && verifiedUser) {
					setUser(verifiedUser);
				} else {
					logoutAdmin();
					if (pathname !== "/login") {
						router.push("/login");
					}
				}
			} catch (error) {
				console.error("Auth verification error:", error);
				logoutAdmin();
			} finally {
				setIsLoading(false);
			}
		};

		checkAuth();
	}, [pathname, router]);

	const logout = () => {
		logoutAdmin();
		setUser(null);
		router.push("/login");
	};

	const hasPermission = (action: string): boolean => {
		if (!user) return false;

		// Special case for role management
		if (action === "view_roles" && user.role === "admin") {
			return true;
		}

		// Special case for manage_roles permission
		if (
			action === "view_roles" &&
			hasPermissionFromDB("manage_roles")
		) {
			return true;
		}

		// Check if user has the permission from the database
		return hasPermissionFromDB(action);
	};

	// Helper function to check permissions from the database
	const hasPermissionFromDB = (action: string): boolean => {
		// For admin users, grant all permissions
		if (user?.role === "admin") {
			return true;
		}

		if (!user || !user.role) {
			return false;
		}

		// Hardcoded permissions as fallback
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
				"view_all",
				"edit_users",
				"approve_users",
				"reject_users",
			],
			bendahara: [
				"view_all",
				"edit_transactions",
				"approve_transactions",
				"reject_transactions",
			],
		};

		const userRole = user.role as string;
		return permissions[userRole]?.includes(action) || false;
	};

	return (
		<AdminAuthContext.Provider
			value={{
				user,
				role: user?.role || null,
				isLoading,
				isAuthenticated: !!user,
				logout,
				setUser,
				hasPermission,
			}}
		>
			{children}
		</AdminAuthContext.Provider>
	);
}

export function withAdminAuth<P extends object>(
	Component: React.ComponentType<P>,
	requiredPermission?: string
) {
	return function ProtectedComponent(props: P) {
		const { isAuthenticated, isLoading, hasPermission } =
			useAdminAuth();
		const router = useRouter();

		useEffect(() => {
			if (!isLoading && !isAuthenticated) {
				router.push("/login");
			}

			if (
				!isLoading &&
				isAuthenticated &&
				requiredPermission &&
				!hasPermission(requiredPermission)
			) {
				router.push("/unauthorized");
			}
		}, [isAuthenticated, isLoading, router, requiredPermission]);

		if (isLoading) {
			return (
				<div className="flex min-h-screen items-center justify-center">
					Loading...
				</div>
			);
		}

		if (!isAuthenticated) {
			return null;
		}

		if (requiredPermission && !hasPermission(requiredPermission)) {
			return null;
		}

		return <Component {...props} />;
	};
}
