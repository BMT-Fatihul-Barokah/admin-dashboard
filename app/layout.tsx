import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AdminSidebar } from "@/components/admin-sidebar"
import { Toaster } from "@/components/ui/toaster"
import { AdminAuthProvider } from "@/lib/admin-auth-context"
import { ThemeToggle } from "@/components/theme-toggle"
import { NavigationProgress } from "@/components/navigation-progress"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Admin Panel",
  description: "Admin Panel for Financial Management System",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Supabase JS is imported via npm, no need for a script tag here */}
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <AdminAuthProvider>
            <NavigationProgress />
            <div className="flex min-h-screen">
              <div className="sticky top-0 h-screen">
                <AdminSidebar />
              </div>
              <main className="flex-1 overflow-y-auto transition-all duration-200">
                {children}
              </main>
            </div>
            <Toaster />
          </AdminAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
