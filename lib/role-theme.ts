import { AdminRole } from "./admin-auth";

// Define role-specific theme colors
export interface RoleTheme {
  primary: string;
  secondary: string;
  accent: string;
  badge: string;
  name: string;
}

// Theme configuration for each role
export const roleThemes: Record<AdminRole, RoleTheme> = {
  admin: {
    primary: "bg-blue-600 hover:bg-blue-700",
    secondary: "bg-blue-100 text-blue-800",
    accent: "from-blue-500 to-blue-600",
    badge: "bg-blue-100 text-blue-800",
    name: "Administrator"
  },
  ketua: {
    primary: "bg-indigo-600 hover:bg-indigo-700",
    secondary: "bg-indigo-100 text-indigo-800",
    accent: "from-indigo-500 to-indigo-600",
    badge: "bg-indigo-100 text-indigo-800",
    name: "Ketua"
  },
  sekretaris: {
    primary: "bg-purple-600 hover:bg-purple-700",
    secondary: "bg-purple-100 text-purple-800",
    accent: "from-purple-500 to-purple-600",
    badge: "bg-purple-100 text-purple-800",
    name: "Sekretaris"
  },
  bendahara: {
    primary: "bg-green-600 hover:bg-green-700",
    secondary: "bg-green-100 text-green-800",
    accent: "from-green-500 to-green-600",
    badge: "bg-green-100 text-green-800",
    name: "Bendahara"
  }
};

// Get theme for a specific role
export function getRoleTheme(role: AdminRole): RoleTheme {
  return roleThemes[role] || roleThemes.admin;
}

// Get role badge component classes
export function getRoleBadgeClasses(role: AdminRole): string {
  const theme = getRoleTheme(role);
  return `${theme.badge} px-3 py-1 rounded-full text-sm font-medium`;
}
