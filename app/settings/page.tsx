import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"

export default function SettingsPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Pengaturan</h2>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">Umum</TabsTrigger>
          <TabsTrigger value="users">Manajemen User</TabsTrigger>
          <TabsTrigger value="notifications">Notifikasi</TabsTrigger>
          <TabsTrigger value="security">Keamanan</TabsTrigger>
          <TabsTrigger value="appearance">Tampilan</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informasi Aplikasi</CardTitle>
              <CardDescription>Pengaturan dasar aplikasi</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="app-name">Nama Aplikasi</Label>
                <Input id="app-name" defaultValue="FinAdmin" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="app-description">Deskripsi</Label>
                <Textarea
                  id="app-description"
                  defaultValue="Sistem manajemen keuangan dan administrasi untuk lembaga keuangan mikro."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="app-contact">Email Kontak</Label>
                <Input id="app-contact" type="email" defaultValue="admin@finadmin.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="app-timezone">Zona Waktu</Label>
                <Select defaultValue="asia-jakarta">
                  <SelectTrigger id="app-timezone">
                    <SelectValue placeholder="Pilih zona waktu" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asia-jakarta">Asia/Jakarta (GMT+7)</SelectItem>
                    <SelectItem value="asia-makassar">Asia/Makassar (GMT+8)</SelectItem>
                    <SelectItem value="asia-jayapura">Asia/Jayapura (GMT+9)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="app-currency">Mata Uang</Label>
                <Select defaultValue="idr">
                  <SelectTrigger id="app-currency">
                    <SelectValue placeholder="Pilih mata uang" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="idr">Rupiah (IDR)</SelectItem>
                    <SelectItem value="usd">Dollar (USD)</SelectItem>
                    <SelectItem value="eur">Euro (EUR)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter>
              <Button>Simpan Perubahan</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pengaturan Bisnis</CardTitle>
              <CardDescription>Konfigurasi informasi bisnis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="business-name">Nama Bisnis</Label>
                <Input id="business-name" defaultValue="Koperasi Sejahtera Bersama" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="business-address">Alamat</Label>
                <Textarea id="business-address" defaultValue="Jl. Merdeka No. 123, Jakarta Pusat, DKI Jakarta" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="business-phone">Telepon</Label>
                <Input id="business-phone" defaultValue="021-1234567" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="business-email">Email</Label>
                <Input id="business-email" type="email" defaultValue="info@koperasisejahtera.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="business-tax">NPWP</Label>
                <Input id="business-tax" defaultValue="01.234.567.8-123.000" />
              </div>
            </CardContent>
            <CardFooter>
              <Button>Simpan Perubahan</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pengaturan Role</CardTitle>
              <CardDescription>Konfigurasi role dan izin pengguna</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <h3 className="font-medium">Admin</h3>
                    <p className="text-sm text-muted-foreground">Akses penuh ke semua fitur</p>
                  </div>
                  <Button variant="outline">Edit Izin</Button>
                </div>
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <h3 className="font-medium">Manajer</h3>
                    <p className="text-sm text-muted-foreground">
                      Akses ke sebagian besar fitur kecuali pengaturan sistem
                    </p>
                  </div>
                  <Button variant="outline">Edit Izin</Button>
                </div>
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <h3 className="font-medium">Staf</h3>
                    <p className="text-sm text-muted-foreground">Akses terbatas ke fitur operasional</p>
                  </div>
                  <Button variant="outline">Edit Izin</Button>
                </div>
                <div className="flex items-center justify-between pb-4">
                  <div>
                    <h3 className="font-medium">Anggota</h3>
                    <p className="text-sm text-muted-foreground">Akses hanya ke profil dan transaksi sendiri</p>
                  </div>
                  <Button variant="outline">Edit Izin</Button>
                </div>
              </div>
              <Button>Tambah Role Baru</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Kebijakan Pengguna</CardTitle>
              <CardDescription>Konfigurasi kebijakan pengguna</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="password-policy">Kebijakan Kata Sandi</Label>
                  <p className="text-sm text-muted-foreground">
                    Minimal 8 karakter dengan kombinasi huruf, angka, dan simbol
                  </p>
                </div>
                <Switch id="password-policy" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="two-factor">Autentikasi Dua Faktor</Label>
                  <p className="text-sm text-muted-foreground">Wajib untuk admin dan manajer</p>
                </div>
                <Switch id="two-factor" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="session-timeout">Batas Waktu Sesi</Label>
                  <p className="text-sm text-muted-foreground">Logout otomatis setelah 30 menit tidak aktif</p>
                </div>
                <Switch id="session-timeout" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="login-attempts">Batasi Percobaan Login</Label>
                  <p className="text-sm text-muted-foreground">Kunci akun setelah 5 kali percobaan gagal</p>
                </div>
                <Switch id="login-attempts" defaultChecked />
              </div>
            </CardContent>
            <CardFooter>
              <Button>Simpan Perubahan</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pengaturan Notifikasi</CardTitle>
              <CardDescription>Konfigurasi notifikasi sistem</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications">Notifikasi Email</Label>
                  <p className="text-sm text-muted-foreground">Kirim notifikasi melalui email</p>
                </div>
                <Switch id="email-notifications" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="sms-notifications">Notifikasi SMS</Label>
                  <p className="text-sm text-muted-foreground">Kirim notifikasi melalui SMS</p>
                </div>
                <Switch id="sms-notifications" />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="push-notifications">Notifikasi Push</Label>
                  <p className="text-sm text-muted-foreground">Kirim notifikasi push ke aplikasi mobile</p>
                </div>
                <Switch id="push-notifications" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="transaction-alerts">Peringatan Transaksi</Label>
                  <p className="text-sm text-muted-foreground">Kirim peringatan untuk transaksi baru</p>
                </div>
                <Switch id="transaction-alerts" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="loan-alerts">Peringatan Pinjaman</Label>
                  <p className="text-sm text-muted-foreground">Kirim peringatan untuk pinjaman yang akan jatuh tempo</p>
                </div>
                <Switch id="loan-alerts" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="system-alerts">Peringatan Sistem</Label>
                  <p className="text-sm text-muted-foreground">Kirim peringatan untuk perubahan sistem</p>
                </div>
                <Switch id="system-alerts" defaultChecked />
              </div>
            </CardContent>
            <CardFooter>
              <Button>Simpan Perubahan</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pengaturan Keamanan</CardTitle>
              <CardDescription>Konfigurasi keamanan sistem</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="ssl-encryption">Enkripsi SSL</Label>
                  <p className="text-sm text-muted-foreground">Aktifkan enkripsi SSL untuk semua koneksi</p>
                </div>
                <Switch id="ssl-encryption" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="data-encryption">Enkripsi Data</Label>
                  <p className="text-sm text-muted-foreground">Enkripsi data sensitif dalam database</p>
                </div>
                <Switch id="data-encryption" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="ip-restriction">Pembatasan IP</Label>
                  <p className="text-sm text-muted-foreground">Batasi akses berdasarkan alamat IP</p>
                </div>
                <Switch id="ip-restriction" />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="audit-logs">Log Audit</Label>
                  <p className="text-sm text-muted-foreground">Aktifkan pencatatan aktivitas pengguna</p>
                </div>
                <Switch id="audit-logs" defaultChecked />
              </div>
              <div className="space-y-2">
                <Label htmlFor="backup-frequency">Frekuensi Backup</Label>
                <Select defaultValue="daily">
                  <SelectTrigger id="backup-frequency">
                    <SelectValue placeholder="Pilih frekuensi backup" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Setiap Jam</SelectItem>
                    <SelectItem value="daily">Harian</SelectItem>
                    <SelectItem value="weekly">Mingguan</SelectItem>
                    <SelectItem value="monthly">Bulanan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter>
              <Button>Simpan Perubahan</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pengaturan Tampilan</CardTitle>
              <CardDescription>Kustomisasi tampilan aplikasi</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="theme-mode">Mode Tema</Label>
                <Select defaultValue="light">
                  <SelectTrigger id="theme-mode">
                    <SelectValue placeholder="Pilih mode tema" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Terang</SelectItem>
                    <SelectItem value="dark">Gelap</SelectItem>
                    <SelectItem value="system">Ikuti Sistem</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="primary-color">Warna Utama</Label>
                <Select defaultValue="green">
                  <SelectTrigger id="primary-color">
                    <SelectValue placeholder="Pilih warna utama" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blue">Biru</SelectItem>
                    <SelectItem value="green">Hijau</SelectItem>
                    <SelectItem value="red">Merah</SelectItem>
                    <SelectItem value="purple">Ungu</SelectItem>
                    <SelectItem value="orange">Oranye</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="font-size">Ukuran Font</Label>
                <Select defaultValue="medium">
                  <SelectTrigger id="font-size">
                    <SelectValue placeholder="Pilih ukuran font" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Kecil</SelectItem>
                    <SelectItem value="medium">Sedang</SelectItem>
                    <SelectItem value="large">Besar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="compact-mode">Mode Kompak</Label>
                  <p className="text-sm text-muted-foreground">Tampilkan antarmuka dalam mode kompak</p>
                </div>
                <Switch id="compact-mode" />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="animations">Animasi</Label>
                  <p className="text-sm text-muted-foreground">Aktifkan animasi antarmuka</p>
                </div>
                <Switch id="animations" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="custom-logo">Logo Kustom</Label>
                  <p className="text-sm text-muted-foreground">Gunakan logo kustom untuk aplikasi</p>
                </div>
                <Switch id="custom-logo" defaultChecked />
              </div>
            </CardContent>
            <CardFooter>
              <Button>Simpan Perubahan</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
