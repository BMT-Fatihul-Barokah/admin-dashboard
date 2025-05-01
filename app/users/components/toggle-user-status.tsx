"use client"

import { useState } from "react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { createClient } from '@supabase/supabase-js'
import { useToast } from "@/components/ui/use-toast"

// Create a direct Supabase client instance
const supabaseUrl = 'https://hyiwhckxwrngegswagrb.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5aXdoY2t4d3JuZ2Vnc3dhZ3JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0OTY4MzcsImV4cCI6MjA2MTA3MjgzN30.bpDSX9CUEA0F99x3cwNbeTVTVq-NHw5GC5jmp2QqnNM'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

type Anggota = {
  id: string
  nama: string
  is_active: boolean
}

interface ToggleUserStatusProps {
  user: Anggota | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onStatusChanged: () => void
}

export function ToggleUserStatus({ user, open, onOpenChange, onStatusChanged }: ToggleUserStatusProps) {
  const { toast } = useToast()
  const [isProcessing, setIsProcessing] = useState(false)

  const handleToggleStatus = async () => {
    if (!user) return
    
    setIsProcessing(true)
    try {
      const now = new Date().toISOString()
      const newStatus = !user.is_active
      
      // Update user status
      const updateData: any = { 
        is_active: newStatus,
        updated_at: now
      }
      
      // If deactivating, set closed_at
      if (!newStatus) {
        updateData.closed_at = now
      }
      
      const { error } = await supabase
        .from('anggota')
        .update(updateData)
        .eq('id', user.id)
      
      if (error) throw error
      
      // Also update the akun table if exists
      const { data: akunData } = await supabase
        .from('akun')
        .select('id')
        .eq('anggota_id', user.id)
        .single()
      
      if (akunData) {
        const { error: akunError } = await supabase
          .from('akun')
          .update({ 
            is_active: newStatus,
            updated_at: now
          })
          .eq('anggota_id', user.id)
        
        if (akunError) {
          console.error('Error updating akun:', akunError)
          // Continue anyway since the main anggota update succeeded
        }
      }
      
      toast({
        title: "Berhasil",
        description: `Status anggota ${user.nama} telah ${newStatus ? 'diaktifkan' : 'dinonaktifkan'}.`,
      })
      
      onStatusChanged()
      onOpenChange(false)
    } catch (error) {
      console.error('Error toggling user status:', error)
      toast({
        title: "Error",
        description: `Gagal ${user.is_active ? 'menonaktifkan' : 'mengaktifkan'} anggota. Silakan coba lagi.`,
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
    }
  }

  if (!user) return null

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {user.is_active ? 'Nonaktifkan Anggota' : 'Aktifkan Anggota'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {user.is_active 
              ? `Apakah Anda yakin ingin menonaktifkan anggota ${user.nama}? Anggota tidak akan dapat melakukan transaksi setelah dinonaktifkan.`
              : `Apakah Anda yakin ingin mengaktifkan kembali anggota ${user.nama}?`
            }
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isProcessing}>Batal</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleToggleStatus}
            disabled={isProcessing}
            className={user.is_active ? "bg-destructive hover:bg-destructive/90" : ""}
          >
            {isProcessing 
              ? 'Memproses...' 
              : (user.is_active ? 'Ya, Nonaktifkan' : 'Ya, Aktifkan')
            }
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
