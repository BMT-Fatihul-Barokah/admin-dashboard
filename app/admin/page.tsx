import { Suspense } from 'react';
import { Loader2 } from "lucide-react";
import DashboardContent from "../dashboard-content";

// Server component wrapper for the dashboard
export default function AdminDashboard() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
