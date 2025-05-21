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
    
    // Get current balance for the anggota
    const { data: anggotaData, error: anggotaError } = await supabase
      .from('anggota')
      .select('saldo')
      .eq('id', body.anggota_id)
      .single()
    
    if (anggotaError) {
      console.error('Error fetching anggota:', anggotaError)
      return NextResponse.json(
        { error: `Failed to fetch anggota: ${anggotaError.message}` },
        { status: 500 }
      )
    }
    
    if (!anggotaData) {
      return NextResponse.json(
        { error: 'Anggota not found' },
        { status: 404 }
      )
    }
    
    const currentBalance = parseFloat(anggotaData.saldo)
    let newBalance = currentBalance
    
    // Calculate new balance based on transaction type
    if (body.tipe_transaksi === 'masuk') {
      newBalance = currentBalance + parseFloat(body.jumlah)
    } else if (body.tipe_transaksi === 'keluar') {
      // Check if there's enough balance for withdrawal
      if (body.kategori === 'penarikan' && currentBalance < parseFloat(body.jumlah)) {
        return NextResponse.json(
          { error: 'Saldo tidak mencukupi untuk melakukan penarikan' },
          { status: 400 }
        )
      }
      newBalance = currentBalance - parseFloat(body.jumlah)
    }
    
    // Insert transaction
    const { data: transactionData, error: transactionError } = await supabase
      .from('transaksi')
      .insert({
        anggota_id: body.anggota_id,
        tipe_transaksi: body.tipe_transaksi,
        kategori: body.kategori,
        deskripsi: body.deskripsi || null,
        jumlah: body.jumlah,
        saldo_sebelum: currentBalance,
        saldo_sesudah: newBalance,
        pinjaman_id: body.pinjaman_id || null,
        tabungan_id: body.jenis_tabungan_id || null
      })
      .select()
      .single()
    
    if (transactionError) {
      console.error('Error creating transaction:', transactionError)
      return NextResponse.json(
        { error: `Failed to create transaction: ${transactionError.message}` },
        { status: 500 }
      )
    }
    
    // Update anggota balance
    const { error: updateError } = await supabase
      .from('anggota')
      .update({ saldo: newBalance })
      .eq('id', body.anggota_id)
    
    if (updateError) {
      console.error('Error updating anggota balance:', updateError)
      return NextResponse.json(
        { error: `Transaction created but failed to update balance: ${updateError.message}` },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Transaction created successfully',
      data: transactionData
    })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
