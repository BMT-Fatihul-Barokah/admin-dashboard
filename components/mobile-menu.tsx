"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false)

  const toggleMenu = () => setIsOpen(!isOpen)

  const menuItems = [
    { href: "#tentang", label: "Tentang Kami" },
    { href: "#layanan", label: "Layanan" },
    { href: "#simpanan", label: "Simpanan" },
    { href: "#pinjaman", label: "Pinjaman" },
    { href: "#kontak", label: "Kontak" },
  ]

  return (
    <div className="md:hidden">
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleMenu}
        className="text-gray-700 hover:text-blue-600"
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 bg-white border-t border-blue-100 shadow-lg z-50">
          <nav className="container px-4 py-4">
            <div className="flex flex-col space-y-4">
              {menuItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="text-gray-700 hover:text-blue-600 transition-colors font-medium py-2"
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </a>
              ))}
              <div className="pt-4 border-t border-blue-100">
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => window.location.href = '/admin/login'}
                >
                  Admin Login
                </Button>
              </div>
            </div>
          </nav>
        </div>
      )}
    </div>
  )
}
