"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, Lock } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"

type Akun = {
  id: string
  nomor_telepon: string
  pin: string | null
  anggota_id: string | null
  created_at: Date | string
  updated_at: Date | string
  is_verified: boolean
  is_active: boolean
  anggota?: {
    nama: string
    nomor_rekening: string
  }
}

interface ResetPinDialogProps {
  akun: Akun | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onPinReset: () => void
}

// Form schema
const formSchema = z.object({
  pin: z.string()
    .min(6, "PIN minimal 6 digit")
    .max(6, "PIN maksimal 6 digit")
    .regex(/^[0-9]+$/, "PIN harus berupa angka"),
  confirmPin: z.string()
    .min(6, "PIN minimal 6 digit")
    .max(6, "PIN maksimal 6 digit")
    .regex(/^[0-9]+$/, "PIN harus berupa angka"),
}).refine((data) => data.pin === data.confirmPin, {
  message: "PIN konfirmasi tidak cocok",
  path: ["confirmPin"],
});

export function ResetPinDialog({ akun, open, onOpenChange, onPinReset }: ResetPinDialogProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      pin: "",
      confirmPin: "",
    },
  })

  // Form submission handler
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!akun) return;
    
    setIsSubmitting(true)
    try {
      const { error } = await supabase
        .from('akun')
        .update({ pin: values.pin })
        .eq('id', akun.id)
      
      if (error) throw error
      
      toast({
        title: "Berhasil",
        description: "PIN berhasil direset",
      })
      
      onOpenChange(false)
      form.reset()
      onPinReset()
    } catch (error: any) {
      console.error('Error resetting PIN:', error)
      toast({
        title: "Error",
        description: `Gagal mereset PIN: ${error.message}`,
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) form.reset();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Reset PIN
          </DialogTitle>
          <DialogDescription>
            {akun ? `Reset PIN untuk akun ${akun.nomor_telepon}` : 'Reset PIN akun'}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="pin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>PIN Baru</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder="Masukkan 6 digit PIN" 
                      {...field} 
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    PIN harus terdiri dari 6 digit angka
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="confirmPin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Konfirmasi PIN</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder="Masukkan PIN yang sama" 
                      {...field} 
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    Masukkan PIN yang sama untuk konfirmasi
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Reset PIN
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
