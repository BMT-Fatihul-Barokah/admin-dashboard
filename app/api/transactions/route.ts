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
  tabungan_id?: string;
  created_at: string;
  updated_at: string;
  anggota?: { nama: string } | null;
  tabungan?: { 
    nomor_rekening: string;
    saldo: number;
    jenis_tabungan_id: string;
    jenis_tabungan?: {
      nama: string;
      kode: string;
    } | null;
  } | null;
  pinjaman?: {
    id: string;
    jumlah: number;
    sisa_pembayaran: number;
    jenis_pinjaman: string;
  } | null;
}

export async function GET() {
  try {
    console.log('Fetching transactions from Supabase using RPC function...')
    
    // Use the RPC function to fetch transactions with all related data
    const { data, error } = await supabase
      .rpc('get_all_transactions')
      .limit(100)
    
    if (error) {
      console.error('Error fetching transactions:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    
    // Define the type for our RPC function result
    type TransactionRPCResult = {
      id: string;
      reference_number: string | null;
      anggota_id: string;
      tipe_transaksi: string;
      kategori: string;
      deskripsi: string | null;
      jumlah: number;
      saldo_sebelum: number;
      saldo_sesudah: number;
      pembiayaan_id: string | null;
      tabungan_id: string | null;
      created_at: string;
      updated_at: string;
      anggota_nama: string | null;
      tabungan_nomor_rekening: string | null;
      tabungan_saldo: number | null;
      tabungan_jenis_id: string | null;
      tabungan_jenis_nama: string | null;
      tabungan_jenis_kode: string | null;
      pembiayaan_jumlah: number | null;
      pembiayaan_sisa: number | null;
      pembiayaan_jenis: string | null;
    };
    
    // Transform the flat data structure into the nested structure expected by the frontend
    const transformedData = data?.map((item: TransactionRPCResult) => ({
      id: item.id,
      reference_number: item.reference_number,
      anggota_id: item.anggota_id,
      tipe_transaksi: item.tipe_transaksi,
      kategori: item.kategori,
      deskripsi: item.deskripsi,
      jumlah: item.jumlah,
      saldo_sebelum: item.saldo_sebelum,
      saldo_sesudah: item.saldo_sesudah,
      pembiayaan_id: item.pembiayaan_id,  // Note: frontend expects pinjaman_id
      tabungan_id: item.tabungan_id,
      created_at: item.created_at,
      updated_at: item.updated_at,
      anggota: item.anggota_nama ? { nama: item.anggota_nama } : null,
      tabungan: item.tabungan_nomor_rekening ? {
        nomor_rekening: item.tabungan_nomor_rekening,
        saldo: item.tabungan_saldo,
        jenis_tabungan_id: item.tabungan_jenis_id,
        jenis_tabungan: item.tabungan_jenis_nama ? {
          nama: item.tabungan_jenis_nama,
          kode: item.tabungan_jenis_kode
        } : null
      } : null,
      pinjaman: item.pembiayaan_jumlah ? {  // Map pembiayaan to pinjaman for frontend compatibility
        id: item.pembiayaan_id,
        jumlah: item.pembiayaan_jumlah,
        sisa_pembayaran: item.pembiayaan_sisa,
        jenis_pinjaman: item.pembiayaan_jenis
      } : null
    })) || []
    
    console.log(`Successfully fetched ${transformedData.length} transactions`)
    
    return NextResponse.json(transformedData)
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log('Creating new transaction with data:', body)
    
    // Validate required fields
    const requiredFields = ['anggota_id', 'tipe_transaksi', 'kategori', 'jumlah']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Field '${field}' is required` },
          { status: 400 }
        )
      }
    }
    
    // For setoran or penarikan, we need a jenis_tabungan_id
    if ((body.kategori === 'setoran' || body.kategori === 'penarikan') && !body.jenis_tabungan_id) {
      return NextResponse.json(
        { error: 'Jenis tabungan harus dipilih untuk setoran atau penarikan' },
        { status: 400 }
      )
    }
    
    // Use the RPC function to add the transaction
    const { data, error } = await supabase.rpc('add_transaction', {
      p_anggota_id: body.anggota_id,
      p_tipe_transaksi: body.tipe_transaksi,
      p_kategori: body.kategori,
      p_jumlah: body.jumlah,
      p_deskripsi: body.deskripsi || null,
      p_jenis_tabungan_id: body.jenis_tabungan_id || null,
      // Use pembiayaan_id if provided, otherwise fall back to pinjaman_id for backward compatibility
      p_pembiayaan_id: body.pembiayaan_id || body.pinjaman_id || null
    })
    
    if (error) {
      console.error('Error creating transaction:', error)
      return NextResponse.json(
        { error: `Failed to create transaction: ${error.message}` },
        { status: 500 }
      )
    }
    
    // Check if the transaction was successful
    if (!data.success) {
      return NextResponse.json(
        { error: data.error },
        { status: 400 }
      )
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Transaction created successfully',
      data: {
        id: data.transaction_id,
        reference_number: data.reference_number
      }
    })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
