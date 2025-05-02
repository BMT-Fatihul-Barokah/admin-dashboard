"use client";

import { useState, useEffect } from "react";
import {
	BarChart3,
	Bell,
	ChevronLeft,
	CreditCard,
	FileText,
	Home,
	LogOut,
	Menu,
	Settings,
	Users,
	UserPlus,
	Wallet,
	Upload,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAdminAuth } from "@/lib/admin-auth-context";
import { logoutAdmin } from "@/lib/admin-auth";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";

// Define all navigation items
const allNavigation = [
	{ name: "Dashboard", href: "/", icon: Home, roles: ["ketua", "admin", "sekretaris", "bendahara"] },
	{ name: "Manajemen User", href: "/users", icon: Users, roles: ["ketua", "admin", "sekretaris"] },
	{ name: "Transaksi", href: "/transactions", icon: CreditCard, roles: ["ketua", "admin", "bendahara"] },
	{ name: "Pinjaman", href: "/loans", icon: Wallet, roles: ["ketua", "admin", "bendahara"] },
	{ name: "Persetujuan Nasabah", href: "/approvals", icon: UserPlus, roles: ["ketua", "admin", "sekretaris"] },
	{ name: "Laporan", href: "/reports", icon: FileText, roles: ["ketua", "admin", "bendahara"] },
	{ name: "Analitik", href: "/analytics", icon: BarChart3, roles: ["ketua", "admin", "bendahara"] },
	{ name: "Notifikasi", href: "/notifications", icon: Bell, roles: ["ketua", "admin", "sekretaris", "bendahara"] },
	{ name: "Import Data", href: "/import", icon: Upload, roles: ["admin"] },
];

const bottomNavigation = [
	{ name: "Pengaturan", href: "/settings", icon: Settings },
];

export function AdminSidebar() {
	const pathname = usePathname();
	const router = useRouter();
	const { user, isAuthenticated, isLoading } = useAdminAuth();
	const [isCollapsed, setIsCollapsed] = useState(false);
	const [isMobileOpen, setIsMobileOpen] = useState(false);
	
	// Filter navigation items based on user role
	const navigation = user ? allNavigation.filter(item => item.roles.includes(user.role)) : [];
	
	// Redirect to login if not authenticated and not already on login page
	useEffect(() => {
		if (!isLoading && !isAuthenticated && pathname !== "/login") {
			router.push("/login");
		}
	}, [isAuthenticated, isLoading, pathname, router]);
	
	// Don't render sidebar on login page
	if (pathname === "/login" || !isAuthenticated) {
		return null;
	}

	interface NavItemProps {
		item: {
			name: string;
			href: string;
			icon: React.ComponentType<{ className?: string }>;
			roles?: string[];
		};
	}

	const NavItem = ({ item }: NavItemProps) => (
		<Tooltip delayDuration={0}>
			<TooltipTrigger asChild>
				<Link
					href={item.href}
					className={cn(
						"flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
						pathname === item.href ||
							pathname?.startsWith(`${item.href}/`)
							? "bg-secondary text-secondary-foreground"
							: "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground",
						isCollapsed && "justify-center px-2"
					)}
				>
					<item.icon
						className={cn(
							"h-4 w-4",
							!isCollapsed && "mr-3"
						)}
					/>
					{!isCollapsed && <span>{item.name}</span>}
				</Link>
			</TooltipTrigger>
			{isCollapsed && (
				<TooltipContent
					side="right"
					className="flex items-center gap-4"
				>
					{item.name}
				</TooltipContent>
			)}
		</Tooltip>
	);

	return (
		<TooltipProvider>
			<>
				<button
					className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-background rounded-md shadow-md"
					onClick={() => setIsMobileOpen(!isMobileOpen)}
					aria-label="Toggle sidebar"
				>
					<Menu className="h-6 w-6" />
				</button>
				<div
					className={cn(
						"fixed inset-y-0 z-20 flex flex-col bg-background border-r transition-all duration-300 ease-in-out lg:static",
						isCollapsed ? "w-[72px]" : "w-72",
						isMobileOpen
							? "translate-x-0"
							: "-translate-x-full lg:translate-x-0"
					)}
				>
					<div className="border-b">
						<div
							className={cn(
								"flex h-16 items-center gap-2 px-4",
								isCollapsed &&
									"justify-center px-2"
							)}
						>
							{!isCollapsed && (
								<Link
									href="/"
									className="flex items-center font-semibold"
								>
									<Wallet className="h-6 w-6 mr-2" />
									<span className="text-lg font-bold">
										Admin Panel
									</span>
								</Link>
							)}
							<Button
								variant="ghost"
								size="sm"
								className={cn(
									"ml-auto h-8 w-8",
									isCollapsed && "ml-0"
								)}
								onClick={() =>
									setIsCollapsed(
										!isCollapsed
									)
								}
							>
								<ChevronLeft
									className={cn(
										"h-4 w-4 transition-transform",
										isCollapsed &&
											"rotate-180"
									)}
								/>
								<span className="sr-only">
									{isCollapsed
										? "Expand"
										: "Collapse"}{" "}
									Sidebar
								</span>
							</Button>
						</div>
					</div>
					<div className="flex-1 overflow-auto">
						<nav className="flex-1 space-y-1 px-2 py-4">
							{navigation.map((item) => (
								<NavItem
									key={item.name}
									item={item}
								/>
							))}
						</nav>
					</div>
					<div className="border-t p-2">
						<nav className="space-y-1">
							{bottomNavigation.map((item) => (
								<NavItem
									key={item.name}
									item={item}
								/>
							))}
						</nav>
						<div className="mt-4 px-2">
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										variant="ghost"
										className={cn(
											"w-full gap-2",
											isCollapsed &&
												"justify-center px-2"
										)}
									>
										<Avatar className="h-6 w-6 shrink-0">
											<AvatarImage
												src="/placeholder.svg"
												alt="Admin"
											/>
											<AvatarFallback>
												AD
											</AvatarFallback>
										</Avatar>
										{!isCollapsed && (
											<span className="truncate">
												{user?.nama || "User"}
											</span>
										)}
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent
									align="end"
									className="w-56"
								>
									<DropdownMenuLabel>
										Akun Saya
									</DropdownMenuLabel>
									<DropdownMenuSeparator />
									<DropdownMenuItem>
										<Settings className="mr-2 h-4 w-4" />
										<span>Profil</span>
									</DropdownMenuItem>
									<DropdownMenuItem onClick={() => logoutAdmin()}>
										<LogOut className="mr-2 h-4 w-4" />
										<span>Keluar</span>
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					</div>
				</div>
			</>
		</TooltipProvider>
	);
}
