"use client";

import { useAdminAuth } from "@/lib/admin-auth-context";
import { getRoleTheme } from "@/lib/role-theme";
import { cn } from "@/lib/utils";
import { RoleHeader } from "./role-header";
import { AdminSidebar } from "./admin-sidebar";
import { Loader2 } from "lucide-react";

interface RoleLayoutProps {
  children: React.ReactNode;
}

export function RoleLayout({ children }: RoleLayoutProps) {
  const { user, isAuthenticated, isLoading } = useAdminAuth();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If not authenticated, don't render anything (will be redirected by auth context)
  if (!isAuthenticated || !user) {
    return null;
  }

  const roleTheme = getRoleTheme(user.role);

  return (
    <div className={cn(
      "min-h-screen bg-background",
      `role-theme-${user.role}`
    )}>
      <div className="flex min-h-screen flex-col">
        <RoleHeader />
        <div className="flex flex-1">
          <AdminSidebar />
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
