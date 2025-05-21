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
