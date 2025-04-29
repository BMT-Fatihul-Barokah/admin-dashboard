import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bell, CheckCircle, CreditCard, Info, Settings, User, Wallet, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function NotificationsPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Notifikasi</h2>
        <Button variant="outline">
          <Settings className="mr-2 h-4 w-4" />
          Pengaturan Notifikasi
        </Button>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
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
              {notifications.map((notification) => (
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
                        <span className="text-xs text-muted-foreground">{notification.time}</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{notification.message}</p>
                    {notification.action && (
                      <Button variant="link" className="h-auto p-0 text-sm">
                        {notification.action}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="ghost">Tandai Semua Dibaca</Button>
              <Button variant="outline">Lihat Semua Notifikasi</Button>
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
              {notifications
                .filter((n) => !n.read)
                .map((notification) => (
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
                          <span className="text-xs text-muted-foreground">{notification.time}</span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{notification.message}</p>
                      {notification.action && (
                        <Button variant="link" className="h-auto p-0 text-sm">
                          {notification.action}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notifikasi Transaksi</CardTitle>
              <CardDescription>Notifikasi terkait transaksi</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {notifications
                .filter((n) => n.type === "transaction")
                .map((notification) => (
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
                          <span className="text-xs text-muted-foreground">{notification.time}</span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{notification.message}</p>
                      {notification.action && (
                        <Button variant="link" className="h-auto p-0 text-sm">
                          {notification.action}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
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
              {notifications
                .filter((n) => n.type === "system")
                .map((notification) => (
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
                          <span className="text-xs text-muted-foreground">{notification.time}</span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{notification.message}</p>
                      {notification.action && (
                        <Button variant="link" className="h-auto p-0 text-sm">
                          {notification.action}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

const notifications = [
  {
    id: 1,
    type: "transaction",
    title: "Transaksi Baru",
    message: "Transaksi simpanan sebesar Rp 1.250.000 dari Budi Santoso telah berhasil.",
    time: "10 menit yang lalu",
    read: false,
    action: "Lihat Detail",
  },
  {
    id: 2,
    type: "loan",
    title: "Pengajuan Pinjaman",
    message: "Siti Rahayu mengajukan pinjaman sebesar Rp 5.000.000.",
    time: "30 menit yang lalu",
    read: false,
    action: "Tinjau Pengajuan",
  },
  {
    id: 3,
    type: "user",
    title: "Pendaftaran Anggota Baru",
    message: "Ahmad Hidayat telah mendaftar sebagai anggota baru.",
    time: "1 jam yang lalu",
    read: false,
    action: "Lihat Profil",
  },
  {
    id: 4,
    type: "system",
    title: "Pemeliharaan Sistem",
    message: "Sistem akan mengalami pemeliharaan pada tanggal 30 April 2023 pukul 23:00 - 01:00 WIB.",
    time: "3 jam yang lalu",
    read: true,
    action: null,
  },
  {
    id: 5,
    type: "transaction",
    title: "Pembayaran Pinjaman",
    message: "Dewi Lestari telah melakukan pembayaran pinjaman sebesar Rp 750.000.",
    time: "5 jam yang lalu",
    read: true,
    action: "Lihat Detail",
  },
  {
    id: 6,
    type: "alert",
    title: "Pinjaman Jatuh Tempo",
    message: "Terdapat 3 pinjaman yang akan jatuh tempo dalam 7 hari ke depan.",
    time: "1 hari yang lalu",
    read: true,
    action: "Lihat Daftar",
  },
  {
    id: 7,
    type: "system",
    title: "Pembaruan Sistem",
    message: "Sistem telah diperbarui ke versi 2.5.0. Lihat catatan rilis untuk detail perubahan.",
    time: "2 hari yang lalu",
    read: true,
    action: "Lihat Catatan Rilis",
  },
]

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
