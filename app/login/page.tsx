import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Wallet } from "lucide-react"

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center">
            <Wallet className="h-12 w-12" />
          </div>
          <CardTitle className="text-2xl font-bold">FinAdmin</CardTitle>
          <CardDescription>Masuk ke panel admin untuk mengelola sistem</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" placeholder="admin@example.com" type="email" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link href="/forgot-password" className="text-sm text-primary underline-offset-4 hover:underline">
                Lupa password?
              </Link>
            </div>
            <Input id="password" type="password" />
          </div>
          <Button className="w-full">Masuk</Button>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-center text-sm text-muted-foreground">
            <span>Belum punya akun? Hubungi administrator sistem.</span>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
