"use client";

import { Suspense } from "react";
import { AdminDashboard, KetuaDashboard, SekretarisDashboard, BendaraDashboard } from "@/components/role-dashboards"
import { useAdminAuth } from "@/lib/admin-auth-context"
import { Loader2 } from "lucide-react"

// Client component that uses hooks like useAdminAuth
export default function DashboardContent() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center p-4">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      }
    >
      <DashboardUI />
    </Suspense>
  );
}

function DashboardUI() {
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

  // Render the appropriate dashboard based on user role
  switch (user.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'ketua':
      return <KetuaDashboard />;
    case 'sekretaris':
      return <SekretarisDashboard />;
    case 'bendahara':
      return <BendaraDashboard />;
    default:
      // Fallback to admin dashboard if role is unknown
      return <AdminDashboard />;
  }
}
