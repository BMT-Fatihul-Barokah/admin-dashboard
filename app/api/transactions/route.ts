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
  pembiayaan_id?: string;
  pinjaman_id?: string; // Alias for pembiayaan_id used in the frontend
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
    console.log('Fetching transactions from Supabase...')
    
    // Fetch transactions with complete tabungan and pinjaman information
    const { data, error } = await supabase
      .from('transaksi')
      .select(`
        *,
        anggota:anggota_id (nama),
        tabungan:tabungan_id (nomor_rekening, saldo, jenis_tabungan_id, jenis_tabungan:jenis_tabungan_id(nama, kode)),
        pinjaman:pembiayaan_id (id, jumlah, sisa_pembayaran, jenis_pinjaman)
      `)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching transactions:', error)
      
      // If the error is related to missing tables or relationships, try a simpler query
      if (error.message && (error.message.includes('does not exist') || error.message.includes('relation'))) {
        console.log('Trying simplified query without relationships...')
        
        const { data: simpleData, error: simpleError } = await supabase
          .from('transaksi')
          .select('*')
          .order('created_at', { ascending: false })
        
        if (simpleError) {
          console.error('Error with simplified query:', simpleError)
          return NextResponse.json(
            { error: simpleError.message },
            { status: 500 }
          )
        }
        
        console.log(`Successfully fetched ${simpleData?.length || 0} transactions with simplified query`)
        return NextResponse.json(simpleData || [])
      }
      
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    
    // Enhance the data with additional information if needed
    const enhancedData = data?.map(transaction => {
      // If we have tabungan data but not jenis_tabungan, try to add some default information
      if (transaction.tabungan && !transaction.tabungan.jenis_tabungan) {
        transaction.tabungan.jenis_tabungan = {
          nama: 'Tabungan',
          kode: 'TAB'
        }
      }
      return transaction
    }) || []
    
    console.log(`Successfully fetched ${enhancedData.length} transactions`)
    
    return NextResponse.json(enhancedData)
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
    if ((body.kategori === 'setoran' || body.kategori === 'penarikan') && !body.jenis_tabungan_id && !body.tabungan_id) {
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
    
    // Handle tabungan transactions (setoran or penarikan)
    if ((body.kategori === 'setoran' || body.kategori === 'penarikan')) {
      console.log(`Processing ${body.kategori} transaction`)
      
      // If tabungan_id is provided directly, use it
      if (body.tabungan_id) {
        console.log(`Using provided tabungan_id: ${body.tabungan_id}`)
        
        // Get the tabungan data to check the current balance
        console.log(`Fetching tabungan with ID: ${body.tabungan_id}`)
        
        // Attempt to get the tabungan record from multiple sources
        let tabunganData = null;
        
        // First, try the standard approach with the tabungan table
        const { data: standardData, error: standardError } = await supabase
          .from('tabungan')
          .select('id, saldo, anggota_id, jenis_tabungan_id')
          .eq('id', body.tabungan_id)
          .single();
        
        if (standardError) {
          console.error('Error fetching from tabungan table:', standardError);
        } else if (standardData) {
          console.log('Successfully fetched data from tabungan table');
          tabunganData = standardData;
        }
        
        // If not found, try from the view
        if (!tabunganData) {
          const { data: viewData, error: viewError } = await supabase
            .from('tabungan_display_view')
            .select('id, saldo, anggota_id, jenis_tabungan_id')
            .eq('id', body.tabungan_id)
            .single();
          
          if (viewError) {
            console.error('Error fetching from view:', viewError);
          } else if (viewData) {
            console.log('Successfully fetched data from tabungan_display_view');
            tabunganData = viewData;
          }
        }
        
        // If still not found, check if record exists at all
        if (!tabunganData) {
          const { count, error: countError } = await supabase
            .from('tabungan')
            .select('id', { count: 'exact', head: true })
            .eq('id', body.tabungan_id);
          
          if (countError) {
            console.error('Error checking if record exists:', countError);
          } else if (count && count > 0) {
            // Record exists but we can't access it properly
            console.error('Record exists but access is limited');
            return NextResponse.json(
              { error: 'Tabungan found but could not be accessed properly' },
              { status: 500 }
            );
          } else {
            // Record doesn't exist
            console.error(`No tabungan found with ID: ${body.tabungan_id}`);
            return NextResponse.json(
              { error: 'Tabungan not found' },
              { status: 404 }
            );
          }
        }
        
        if (!tabunganData) {
          // This should not happen due to previous checks, but just in case
          return NextResponse.json(
            { error: 'Could not retrieve tabungan data' },
            { status: 500 }
          );
        }
        
        // Set tabungan_id and current balance
        tabungan_id = tabunganData.id;
        // Handle the case where saldo might be a string or number
        currentBalance = parseFloat(typeof tabunganData.saldo === 'string' ? 
          tabunganData.saldo : tabunganData.saldo.toString()) || 0;
        
        console.log(`Using tabungan ID ${tabungan_id} with current balance: ${currentBalance}`)
      }
      // If jenis_tabungan_id is provided but not tabungan_id, try to find or create the tabungan
      else if (body.jenis_tabungan_id) {
        console.log(`Processing transaction for jenis_tabungan_id: ${body.jenis_tabungan_id}`)
        
        // Find the tabungan record for this jenis_tabungan and anggota
        const { data: tabunganDataList, error: tabunganError } = await supabase
          .from('tabungan')
          .select('id, saldo')
          .eq('anggota_id', body.anggota_id)
          .eq('jenis_tabungan_id', body.jenis_tabungan_id)
          .eq('status', 'aktif')
        
        if (tabunganError) {
          console.error('Error fetching tabungan:', tabunganError)
          return NextResponse.json(
            { error: `Failed to fetch tabungan: ${tabunganError.message}` },
            { status: 500 }
          )
        }
        
        console.log('Tabungan data retrieved:', tabunganDataList)
        
        // Use the first tabungan record if available, or create a new one if not
        let tabunganData = tabunganDataList && tabunganDataList.length > 0 ? tabunganDataList[0] : null
        
        if (!tabunganData) {
          console.log('No existing tabungan found, will create a new one')
          // Create a new tabungan record if none exists
          // Generate a unique account number for the new tabungan
          const timestamp = Date.now().toString();
          const randomDigits = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
          const nomor_rekening = `${timestamp.slice(-6)}${randomDigits}`;
          
          const { data: newTabunganData, error: createTabunganError } = await supabase
            .from('tabungan')
            .insert({
              anggota_id: body.anggota_id,
              jenis_tabungan_id: body.jenis_tabungan_id,
              nomor_rekening: nomor_rekening,
              saldo: 0,
              status: 'aktif'
            })
            .select('id, saldo')
            .single()
          
          if (createTabunganError) {
            console.error('Error creating tabungan:', createTabunganError)
            return NextResponse.json(
              { error: `Failed to create tabungan: ${createTabunganError.message}` },
              { status: 500 }
            )
          }
          
          if (!newTabunganData) {
            return NextResponse.json(
              { error: 'Failed to create new tabungan record' },
              { status: 500 }
            )
          }
          
          // Use the newly created tabungan
          tabunganData = newTabunganData
        }
        
        // Now we have tabunganData, either from the query or newly created
        if (tabunganData) {
          tabungan_id = tabunganData.id
          currentBalance = parseFloat(tabunganData.saldo?.toString() || '0') || 0
        } else {
          // This should not happen, but handle it just in case
          return NextResponse.json(
            { error: 'Could not retrieve tabungan data' },
            { status: 500 }
          )
        }
      }
      
      // Update tabungan balance for setoran/penarikan
      if (tabungan_id) {
        console.log(`Updating tabungan ${tabungan_id}. Current balance: ${currentBalance}`)
        if (body.kategori === 'setoran') {
          newBalance = currentBalance + body.jumlah
          console.log(`Setoran: ${body.jumlah}, new balance will be: ${newBalance}`)
        } else if (body.kategori === 'penarikan') {
          newBalance = currentBalance - body.jumlah
          console.log(`Penarikan: ${body.jumlah}, new balance will be: ${newBalance}`)
          
          // Validate the account has sufficient balance
          if (newBalance < 0) {
            return NextResponse.json(
              { error: 'Saldo tidak mencukupi untuk penarikan' },
              { status: 400 }
            )
          }
        }
        
        // Update tabungan balance using regular client
        console.log(`Updating tabungan ${tabungan_id} balance to ${newBalance}`)
        
        const { data: updateData, error: updateError } = await supabase
          .from('tabungan')
          .update({ saldo: newBalance, updated_at: new Date().toISOString() })
          .eq('id', tabungan_id)
          .select()
        
        if (updateError) {
          console.error('Error updating tabungan balance:', updateError)
          throw updateError
        }
        
        console.log('Tabungan balance updated successfully:', updateData)
      }
    } else if (body.pinjaman_id && body.kategori === 'pembayaran_pinjaman') {
      // Handle loan payment logic here if needed
      // For now, we'll just set the balances to 0 since they're not used for loan payments
      currentBalance = 0
      newBalance = 0
    } else {
      // For other transaction types, set balances to 0
      currentBalance = 0
      let newBalance = 0
    }
    
    // Generate a unique reference number
    const generateReferenceNumber = () => {
      const timestamp = Date.now().toString();
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      return `TRX-${timestamp.slice(-6)}${random}`;
    };
    
    // Prepare the transaction data - handle empty UUID fields
    interface TransactionData {
      reference_number: string;
      anggota_id: string;
      tipe_transaksi: string;
      kategori: string;
      deskripsi: string;
      jumlah: number;
      saldo_sebelum: number;
      saldo_sesudah: number;
      tabungan_id?: string;
      pembiayaan_id?: string;
    }
    
    const transactionData: TransactionData = {
      reference_number: generateReferenceNumber(),
      anggota_id: body.anggota_id,
      tipe_transaksi: body.tipe_transaksi,
      kategori: body.kategori,
      deskripsi: body.deskripsi || '',
      jumlah: body.jumlah,
      saldo_sebelum: currentBalance,
      saldo_sesudah: newBalance
    };
    
    // Add UUID fields only if they're not empty strings
    if (tabungan_id) {
      transactionData.tabungan_id = tabungan_id;
    }
    
    // Handle pinjaman_id/pembiayaan_id - convert empty string to null
    if (body.pinjaman_id && body.pinjaman_id.trim() !== '') {
      transactionData.pembiayaan_id = body.pinjaman_id;
    }
    
    // Insert the transaction
    const { data: newTransaction, error: insertError } = await supabase
      .from('transaksi')
      .insert(transactionData)
      .select()
    
    if (insertError) {
      console.error('Error creating transaction:', insertError)
      return NextResponse.json(
        { error: `Failed to create transaction: ${insertError.message}` },
        { status: 500 }
      )
    }
    
    // If this is a tabungan transaction, update the tabungan balance using the secure process endpoint
    if (tabungan_id && (body.kategori === 'setoran' || body.kategori === 'penarikan')) {
      try {
        // Use internal API call to process endpoint which uses the admin client
        const response = await fetch(new URL('/api/transactions/process', request.url).toString(), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tabungan_id,
            newBalance,
            operation: body.kategori
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Error from process API:', errorData);
          return NextResponse.json(
            { error: `Transaction created but failed to update balance: ${errorData.error || 'Unknown error'}` },
            { status: 500 }
          );
        }
      } catch (error: any) {
        console.error('Exception updating tabungan balance:', error);
        return NextResponse.json(
          { error: `Transaction created but failed to update balance: ${error?.message || 'Unknown error'}` },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Transaction created successfully',
      data: newTransaction
    })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
