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
    
    // For setoran or penarikan, we need a tabungan_id
    if ((body.kategori === 'setoran' || body.kategori === 'penarikan') && !body.jenis_tabungan_id) {
      return NextResponse.json(
        { error: 'Jenis tabungan harus dipilih untuk setoran atau penarikan' },
        { status: 400 }
      )
    }
    
    // Get anggota to verify it exists
    const { data: anggotaData, error: anggotaError } = await supabase
      .from('anggota')
      .select('id, nama')
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
    
    let currentBalance = 0
    let newBalance = 0
    let tabungan_id = null
    
    // If this is a tabungan transaction (setoran or penarikan), get the tabungan balance
    if (body.jenis_tabungan_id && (body.kategori === 'setoran' || body.kategori === 'penarikan')) {
      // Find the tabungan record for this jenis_tabungan and anggota
      const { data: tabunganData, error: tabunganError } = await supabase
        .from('tabungan')
        .select('id, saldo')
        .eq('anggota_id', body.anggota_id)
        .eq('jenis_tabungan_id', body.jenis_tabungan_id)
        .eq('status', 'aktif')
        .single()
      
      if (tabunganError) {
        console.error('Error fetching tabungan:', tabunganError)
        return NextResponse.json(
          { error: `Failed to fetch tabungan: ${tabunganError.message}` },
          { status: 500 }
        )
      }
      
      if (!tabunganData) {
        return NextResponse.json(
          { error: 'Tabungan not found for this anggota and jenis tabungan' },
          { status: 404 }
        )
      }
      
      currentBalance = parseFloat(tabunganData.saldo)
      tabungan_id = tabunganData.id
      
      // Calculate new balance based on transaction type
      if (body.tipe_transaksi === 'masuk') {
        newBalance = currentBalance + parseFloat(body.jumlah)
      } else if (body.tipe_transaksi === 'keluar') {
        // Check if there's enough balance for withdrawal
        if (currentBalance < parseFloat(body.jumlah)) {
          return NextResponse.json(
            { error: 'Saldo tidak mencukupi untuk melakukan penarikan' },
            { status: 400 }
          )
        }
        newBalance = currentBalance - parseFloat(body.jumlah)
      }
    } else if (body.pinjaman_id && body.kategori === 'pembayaran_pinjaman') {
      // Handle loan payment logic here if needed
      // For now, we'll just set the balances to 0 since they're not used for loan payments
      currentBalance = 0
      newBalance = 0
    } else {
      // For other transaction types, set balances to 0
      currentBalance = 0
      newBalance = 0
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
        tabungan_id: tabungan_id || body.jenis_tabungan_id || null
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
    
    // If this is a tabungan transaction, update the tabungan balance
    if (tabungan_id && (body.kategori === 'setoran' || body.kategori === 'penarikan')) {
      const { error: updateError } = await supabase
        .from('tabungan')
        .update({ 
          saldo: newBalance,
          last_transaction_date: new Date().toISOString()
        })
        .eq('id', tabungan_id)
      
      if (updateError) {
        console.error('Error updating tabungan balance:', updateError)
        return NextResponse.json(
          { error: `Transaction created but failed to update balance: ${updateError.message}` },
          { status: 500 }
        )
      }
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
