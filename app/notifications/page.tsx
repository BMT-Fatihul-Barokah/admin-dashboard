"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bell, CheckCircle, CreditCard, Info, Settings, User, Wallet, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/use-toast"
import { getAllNotifications, getNotificationsByType, getUnreadNotifications, markAllNotificationsAsRead, markNotificationAsRead, Notification } from "@/lib/supabase"
import Link from "next/link"

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadNotifications, setUnreadNotifications] = useState<Notification[]>([])
  const [transactionNotifications, setTransactionNotifications] = useState<Notification[]>([])
  const [systemNotifications, setSystemNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")
  
  // Format the date to a readable format
  const formatDate = (date: Date) => {
    const now = new Date()
    const notificationDate = new Date(date)
    const diffTime = Math.abs(now.getTime() - notificationDate.getTime())
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60))
    const diffMinutes = Math.floor(diffTime / (1000 * 60))
    
    if (diffMinutes < 1) {
      return "Baru saja"
    } else if (diffMinutes < 60) {
      return `${diffMinutes} menit yang lalu`
    } else if (diffHours < 24) {
      return `${diffHours} jam yang lalu`
    } else {
      return `${diffDays} hari yang lalu`
    }
  }
  
  // Fetch all notifications
  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const allNotifications = await getAllNotifications()
      const unread = await getUnreadNotifications()
      const transactions = await getNotificationsByType("transaction")
      const system = await getNotificationsByType("system")
      
      setNotifications(allNotifications)
      setUnreadNotifications(unread)
      setTransactionNotifications(transactions)
      setSystemNotifications(system)
    } catch (error) {
      console.error("Error fetching notifications:", error)
      toast({
        title: "Error",
        description: "Gagal memuat notifikasi. Silakan coba lagi nanti.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }
  
  // Mark a notification as read
  const handleMarkAsRead = async (id: string) => {
    try {
      const success = await markNotificationAsRead(id)
      if (success) {
        // Update local state
        fetchNotifications()
        toast({
          title: "Sukses",
          description: "Notifikasi telah ditandai sebagai dibaca.",
        })
      }
    } catch (error) {
      console.error("Error marking notification as read:", error)
      toast({
        title: "Error",
        description: "Gagal menandai notifikasi sebagai dibaca.",
        variant: "destructive",
      })
    }
  }
  
  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    try {
      const success = await markAllNotificationsAsRead()
      if (success) {
        // Update local state
        fetchNotifications()
        toast({
          title: "Sukses",
          description: "Semua notifikasi telah ditandai sebagai dibaca.",
        })
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
      toast({
        title: "Error",
        description: "Gagal menandai semua notifikasi sebagai dibaca.",
        variant: "destructive",
      })
    }
  }
  
  // Fetch notifications on component mount
  useEffect(() => {
    fetchNotifications()
  }, [])
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Notifikasi</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/notifications/manage">
              <Bell className="mr-2 h-4 w-4" />
              Kelola Notifikasi
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/notifications/settings">
              <Settings className="mr-2 h-4 w-4" />
              Pengaturan Notifikasi
            </Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="space-y-4" onValueChange={(value) => setActiveTab(value)}>
        <TabsList>
          <TabsTrigger value="all">Semua</TabsTrigger>
          <TabsTrigger value="unread">Belum Dibaca</TabsTrigger>
          <TabsTrigger value="transactions">Transaksi</TabsTrigger>
          <TabsTrigger value="system">Sistem</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notifikasi Terbaru</CardTitle>
              <CardDescription>Semua notifikasi dalam 7 hari terakhir</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                // Loading skeleton
                Array(5).fill(0).map((_, index) => (
                  <div key={index} className="flex items-start gap-4 border-b pb-4 last:border-0 last:pb-0">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-4 w-[150px]" />
                        <Skeleton className="h-4 w-[100px]" />
                      </div>
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-[120px]" />
                    </div>
                  </div>
                ))
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">Tidak ada notifikasi</p>
                  <p className="text-sm text-muted-foreground">Anda akan melihat notifikasi baru di sini</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div key={notification.id} className="flex items-start gap-4 border-b pb-4 last:border-0 last:pb-0">
                    <div className={`rounded-full p-2 ${getNotificationIconBg(notification.type)}`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{notification.title}</p>
                        <div className="flex items-center gap-2">
                          {!notification.read && (
                            <Badge variant="outline" className="bg-blue-500 text-white hover:bg-blue-600">
                              Baru
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">{formatDate(new Date(notification.time))}</span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{notification.message}</p>
                      {notification.action && (
                        <Button 
                          variant="link" 
                          className="h-auto p-0 text-sm"
                          onClick={() => !notification.read && handleMarkAsRead(notification.id)}
                        >
                          {notification.action}
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="ghost" 
                onClick={handleMarkAllAsRead}
                disabled={loading || unreadNotifications.length === 0}
              >
                Tandai Semua Dibaca
              </Button>
              <Button 
                variant="outline" 
                onClick={() => fetchNotifications()}
                disabled={loading}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`}
                >
                  <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/>
                  <path d="M21 3v5h-5"/>
                </svg>
                Muat Ulang
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="unread" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notifikasi Belum Dibaca</CardTitle>
              <CardDescription>Notifikasi yang belum dibaca</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                // Loading skeleton
                Array(3).fill(0).map((_, index) => (
                  <div key={index} className="flex items-start gap-4 border-b pb-4 last:border-0 last:pb-0">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-4 w-[150px]" />
                        <Skeleton className="h-4 w-[100px]" />
                      </div>
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-[120px]" />
                    </div>
                  </div>
                ))
              ) : unreadNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">Tidak ada notifikasi yang belum dibaca</p>
                  <p className="text-sm text-muted-foreground">Semua notifikasi telah dibaca</p>
                </div>
              ) : (
                unreadNotifications.map((notification) => (
                  <div key={notification.id} className="flex items-start gap-4 border-b pb-4 last:border-0 last:pb-0">
                    <div className={`rounded-full p-2 ${getNotificationIconBg(notification.type)}`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{notification.title}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-blue-500 text-white hover:bg-blue-600">
                            Baru
                          </Badge>
                          <span className="text-xs text-muted-foreground">{formatDate(new Date(notification.time))}</span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{notification.message}</p>
                      {notification.action && (
                        <Button 
                          variant="link" 
                          className="h-auto p-0 text-sm"
                          onClick={() => handleMarkAsRead(notification.id)}
                        >
                          {notification.action}
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
            {unreadNotifications.length > 0 && (
              <CardFooter>
                <Button 
                  variant="ghost" 
                  className="w-full"
                  onClick={handleMarkAllAsRead}
                  disabled={loading}
                >
                  Tandai Semua Dibaca
                </Button>
              </CardFooter>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notifikasi Transaksi</CardTitle>
              <CardDescription>Notifikasi terkait transaksi</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                // Loading skeleton
                Array(3).fill(0).map((_, index) => (
                  <div key={index} className="flex items-start gap-4 border-b pb-4 last:border-0 last:pb-0">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-4 w-[150px]" />
                        <Skeleton className="h-4 w-[100px]" />
                      </div>
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-[120px]" />
                    </div>
                  </div>
                ))
              ) : transactionNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">Tidak ada notifikasi transaksi</p>
                  <p className="text-sm text-muted-foreground">Notifikasi transaksi akan muncul di sini</p>
                </div>
              ) : (
                transactionNotifications.map((notification) => (
                  <div key={notification.id} className="flex items-start gap-4 border-b pb-4 last:border-0 last:pb-0">
                    <div className={`rounded-full p-2 ${getNotificationIconBg(notification.type)}`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{notification.title}</p>
                        <div className="flex items-center gap-2">
                          {!notification.read && (
                            <Badge variant="outline" className="bg-blue-500 text-white hover:bg-blue-600">
                              Baru
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">{formatDate(new Date(notification.time))}</span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{notification.message}</p>
                      {notification.action && (
                        <Button 
                          variant="link" 
                          className="h-auto p-0 text-sm"
                          onClick={() => !notification.read && handleMarkAsRead(notification.id)}
                        >
                          {notification.action}
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notifikasi Sistem</CardTitle>
              <CardDescription>Notifikasi terkait sistem</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                // Loading skeleton
                Array(2).fill(0).map((_, index) => (
                  <div key={index} className="flex items-start gap-4 border-b pb-4 last:border-0 last:pb-0">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-4 w-[150px]" />
                        <Skeleton className="h-4 w-[100px]" />
                      </div>
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-[120px]" />
                    </div>
                  </div>
                ))
              ) : systemNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Settings className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">Tidak ada notifikasi sistem</p>
                  <p className="text-sm text-muted-foreground">Notifikasi sistem akan muncul di sini</p>
                </div>
              ) : (
                systemNotifications.map((notification) => (
                  <div key={notification.id} className="flex items-start gap-4 border-b pb-4 last:border-0 last:pb-0">
                    <div className={`rounded-full p-2 ${getNotificationIconBg(notification.type)}`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{notification.title}</p>
                        <div className="flex items-center gap-2">
                          {!notification.read && (
                            <Badge variant="outline" className="bg-blue-500 text-white hover:bg-blue-600">
                              Baru
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">{formatDate(new Date(notification.time))}</span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{notification.message}</p>
                      {notification.action && (
                        <Button 
                          variant="link" 
                          className="h-auto p-0 text-sm"
                          onClick={() => !notification.read && handleMarkAsRead(notification.id)}
                        >
                          {notification.action}
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Removed placeholder notifications array as we're now using real data from Supabase

function getNotificationIcon(type: string) {
  switch (type) {
    case "transaction":
      return <CreditCard className="h-4 w-4 text-white" />
    case "loan":
      return <Wallet className="h-4 w-4 text-white" />
    case "user":
      return <User className="h-4 w-4 text-white" />
    case "system":
      return <Settings className="h-4 w-4 text-white" />
    case "alert":
      return <Bell className="h-4 w-4 text-white" />
    case "success":
      return <CheckCircle className="h-4 w-4 text-white" />
    case "error":
      return <X className="h-4 w-4 text-white" />
    default:
      return <Info className="h-4 w-4 text-white" />
  }
}

function getNotificationIconBg(type: string) {
  switch (type) {
    case "transaction":
      return "bg-blue-500"
    case "loan":
      return "bg-green-500"
    case "user":
      return "bg-purple-500"
    case "system":
      return "bg-gray-500"
    case "alert":
      return "bg-orange-500"
    case "success":
      return "bg-green-500"
    case "error":
      return "bg-red-500"
    default:
      return "bg-blue-500"
  }
}
