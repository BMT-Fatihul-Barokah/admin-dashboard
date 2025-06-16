"use client";

import { ReactNode } from "react";
import { AdminSidebar } from "../admin-sidebar";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <div className="flex-1 overflow-auto">
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
