import { useState, useEffect } from "react";
import { useAdminAuth } from "@/lib/admin-auth-context";
import { supabase } from "@/lib/supabase";

export type Permission =
	| "view_dashboard"
	| "view_users"
	| "edit_users"
	| "delete_users"
	| "view_transactions"
	| "create_transactions"
	| "edit_transactions"
	| "view_loans"
	| "approve_loans"
	| "reject_loans"
	| "view_approvals"
	| "approve_customers"
	| "reject_customers"
	| "view_reports"
	| "generate_reports"
	| "view_analytics"
	| "view_notifications"
	| "manage_roles"
	| "import_data";

export interface PermissionDetail {
	id: string;
	code: string;
	description: string;
}

export interface RolePermission {
	role_id: string;
	permission_id: string;
}

export interface PageAccess {
	id: string;
	role_id: string;
	page_path: string;
	page_name: string;
	page_description: string;
	is_accessible: boolean;
}

// Cache for permissions to avoid repeated database queries
const permissionsCache: Record<string, Permission[]> = {};

/**
 * Custom hook to check if the current user has a specific permission
 * @param permission The permission to check
 * @returns Object containing hasPermission boolean and isLoading state
 */
export function usePermission(permission: Permission) {
	const { user } = useAdminAuth();
	const [hasPermission, setHasPermission] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		async function checkPermission() {
			if (!user?.id) {
				setHasPermission(false);
				setIsLoading(false);
				return;
			}

			try {
				// Try to get from cache first
				if (permissionsCache[user.id]) {
					setHasPermission(
						permissionsCache[user.id].includes(
							permission
						)
					);
					setIsLoading(false);
					return;
				}

				// Define role-based permissions mapping
				const rolePermissions: Record<string, Permission[]> = {
					admin: [
						"view_dashboard",
						"view_users",
						"edit_users",
						"delete_users",
						"view_transactions",
						"create_transactions",
						"edit_transactions",
						"view_loans",
						"approve_loans",
						"reject_loans",
						"view_approvals",
						"approve_customers",
						"reject_customers",
						"view_reports",
						"generate_reports",
						"view_analytics",
						"view_notifications",
						"manage_roles",
						"import_data",
					],
					ketua: ["view_dashboard", "view_reports"],
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
						"view_dashboard",
						"view_users",
						"view_transactions",
						"create_transactions",
						"edit_transactions",
						"view_loans",
						"view_reports",
						"generate_reports",
						"view_analytics",
					],
				};

				// Get permissions based on user role
				if (user.role && rolePermissions[user.role]) {
					const userPermissions =
						rolePermissions[user.role];
					permissionsCache[user.id] = userPermissions;
					setHasPermission(
						userPermissions.includes(permission)
					);
				} else {
					setHasPermission(false);
				}
			} catch (error) {
				console.error("Error checking permission:", error);
				setHasPermission(false);
			} finally {
				setIsLoading(false);
			}
		}

		checkPermission();
	}, [user?.id, permission]);

	return { hasPermission, isLoading };
}

/**
 * Custom hook to check if the current user has any of the specified permissions
 * @param permissions Array of permissions to check
 * @returns Object containing hasAnyPermission boolean and isLoading state
 */
export function useAnyPermission(permissions: Permission[]) {
	const { user } = useAdminAuth();
	const [hasAnyPermission, setHasAnyPermission] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		async function checkPermissions() {
			if (!user?.id || permissions.length === 0) {
				setHasAnyPermission(false);
				setIsLoading(false);
				return;
			}

			try {
				// Try to get from cache first
				if (permissionsCache[user.id]) {
					const hasAny = permissions.some((p) =>
						permissionsCache[user.id].includes(p)
					);
					setHasAnyPermission(hasAny);
					setIsLoading(false);
					return;
				}

				// Define role-based permissions mapping
				const rolePermissions: Record<string, Permission[]> = {
					admin: [
						"view_dashboard",
						"view_users",
						"edit_users",
						"delete_users",
						"view_transactions",
						"create_transactions",
						"edit_transactions",
						"view_loans",
						"approve_loans",
						"reject_loans",
						"view_approvals",
						"approve_customers",
						"reject_customers",
						"view_reports",
						"generate_reports",
						"view_analytics",
						"view_notifications",
						"manage_roles",
						"import_data",
					],
					ketua: ["view_dashboard", "view_reports"],
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
						"view_dashboard",
						"view_users",
						"view_transactions",
						"create_transactions",
						"edit_transactions",
						"view_loans",
						"view_reports",
						"generate_reports",
						"view_analytics",
					],
				};

				// Get permissions based on user role
				if (user.role && rolePermissions[user.role]) {
					const userPermissions =
						rolePermissions[user.role];
					permissionsCache[user.id] = userPermissions;
					const hasAny = permissions.some((p) =>
						userPermissions.includes(p)
					);
					setHasAnyPermission(hasAny);
				} else {
					setHasAnyPermission(false);
				}
			} catch (error) {
				console.error("Error checking permissions:", error);
				setHasAnyPermission(false);
			} finally {
				setIsLoading(false);
			}
		}

		checkPermissions();
	}, [user?.id, permissions]);

	return { hasAnyPermission, isLoading };
}

/**
 * Custom hook for comprehensive permission and page access management
 * @returns Object containing permission checking functions and page access management
 */
export function useRolePermissions() {
	const { user } = useAdminAuth();
	const [permissions, setPermissions] = useState<PermissionDetail[]>([]);
	const [rolePermissions, setRolePermissions] = useState<RolePermission[]>(
		[]
	);
	const [pageAccesses, setPageAccesses] = useState<PageAccess[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchPermissions = async () => {
			if (!user) {
				setIsLoading(false);
				return;
			}

			try {
				const [
					permissionsResult,
					rolePermissionsResult,
					pageAccessResult,
				] = await Promise.all([
					supabase.from("admin_permissions").select("*"),
					supabase
						.from("admin_role_permissions")
						.select("*"),
					supabase.from("admin_role_pages").select("*"),
				]);

				if (permissionsResult.error)
					throw permissionsResult.error;
				if (rolePermissionsResult.error)
					throw rolePermissionsResult.error;
				if (pageAccessResult.error)
					throw pageAccessResult.error;

				setPermissions(permissionsResult.data || []);
				setRolePermissions(rolePermissionsResult.data || []);
				setPageAccesses(pageAccessResult.data || []);
			} catch (error) {
				console.error("Error fetching permissions:", error);
			} finally {
				setIsLoading(false);
			}
		};

		fetchPermissions();
	}, [user]);

	const hasPermissionByCode = (permissionCode: string): boolean => {
		if (!user?.role) return false;

		// Admin always has all permissions
		if (user.role === "admin") return true;

		const permission = permissions.find(
			(p) => p.code === permissionCode
		);
		if (!permission) return false;

		return rolePermissions.some(
			(rp) =>
				rp.role_id === user.role &&
				rp.permission_id === permission.id
		);
	};

	const hasPageAccess = (pagePath: string): boolean => {
		if (!user?.role) return false;

		// Admin always has access to all pages
		if (user.role === "admin") return true;

		const pageAccess = pageAccesses.find(
			(page) =>
				page.role_id === user.role &&
				page.page_path === pagePath
		);

		return pageAccess?.is_accessible || false;
	};

	const getUserPageAccesses = (): PageAccess[] => {
		if (!user?.role) return [];

		// Admin gets all pages as accessible
		if (user.role === "admin") {
			return pageAccesses.filter(
				(page) => page.role_id === user.role
			);
		}

		return pageAccesses.filter(
			(page) => page.role_id === user.role && page.is_accessible
		);
	};

	return {
		permissions,
		rolePermissions,
		pageAccesses,
		isLoading,
		hasPermissionByCode,
		hasPageAccess,
		getUserPageAccesses,
	};
}
