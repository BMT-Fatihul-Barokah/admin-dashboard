"use client";

import { useAdminAuth } from "@/lib/admin-auth-context";
import { getRoleTheme, getRoleBadgeClasses } from "@/lib/role-theme";
import { cn } from "@/lib/utils";
import { Bell, HelpCircle, Search } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";

export function RoleHeader() {
  const { user } = useAdminAuth();
  
  if (!user) return null;
  
  const roleTheme = getRoleTheme(user.role);
  const roleBadgeClasses = getRoleBadgeClasses(user.role);
  
  return (
    <header className={cn(
      "sticky top-0 z-10 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
      `border-${roleTheme.secondary.split(' ')[0].replace('bg-', '')}-200`
    )}>
      <div className="container flex h-14 items-center">
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search..."
                className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[300px]"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className={roleBadgeClasses}>
              {roleTheme.name}
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-4 w-4" />
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                    3
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Notifikasi</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {[1, 2, 3].map((i) => (
                  <DropdownMenuItem key={i} className="cursor-pointer p-4">
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-medium">
                        {i === 1 ? "Pendaftaran baru" : i === 2 ? "Transaksi baru" : "Pinjaman baru"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {i === 1 
                          ? "Ada pendaftaran nasabah baru yang menunggu persetujuan" 
                          : i === 2 
                            ? "Transaksi baru telah dibuat" 
                            : "Pengajuan pinjaman baru menunggu persetujuan"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {`${i * 5} menit yang lalu`}
                      </p>
                    </div>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer justify-center">
                  <Button variant="ghost" size="sm" className="w-full">
                    Lihat semua notifikasi
                  </Button>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button variant="ghost" size="icon">
              <HelpCircle className="h-4 w-4" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/placeholder.svg" alt={user.nama} />
                    <AvatarFallback>{user.nama.charAt(0)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Akun Saya</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="flex flex-col items-start">
                  <span className="font-medium">{user.nama}</span>
                  <span className="text-xs text-muted-foreground">{user.username}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Profil</DropdownMenuItem>
                <DropdownMenuItem>Pengaturan</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-500">Keluar</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
