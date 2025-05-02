import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Define transaction type for TypeScript
interface Transaksi {
  id: string;
  reference_number?: string;
  anggota_id: string;
  tipe_transaksi: string;
  kategori: string;
  deskripsi?: string;
  jumlah: number;
  saldo_sebelum?: number;
  saldo_sesudah?: number;
  pinjaman_id?: string;
  created_at: string;
  updated_at: string;
  anggota?: { nama: string } | null;
}

export async function GET() {
  try {
    console.log('Fetching transactions from Supabase...')
    
    // Fetch transactions with anggota information
    const { data, error } = await supabase
      .from('transaksi')
      .select(`
        *,
        anggota:anggota_id(nama)
      `)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching transactions:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    
    console.log(`Successfully fetched ${data?.length || 0} transactions`)
    
    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
