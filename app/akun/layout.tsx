import type React from "react"
import { AdminSidebar } from "@/components/admin-sidebar"

export default function AkunLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="flex min-h-screen">
      <div className="sticky top-0 h-screen">
        <AdminSidebar />
      </div>
      <main className="flex-1 overflow-y-auto transition-all duration-200">
        {children}
      </main>
    </div>
  )
}
