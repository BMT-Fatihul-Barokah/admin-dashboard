import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET handler to fetch tabungan by anggota_id
export async function GET(request: Request) {
  try {
    // Get anggota_id from query params
    const { searchParams } = new URL(request.url)
    const anggota_id = searchParams.get('anggota_id')
    
    if (!anggota_id) {
      return NextResponse.json(
        { error: 'anggota_id parameter is required' },
        { status: 400 }
      )
    }
    
    console.log(`Fetching tabungan for anggota_id: ${anggota_id}`)
    
    // Try to fetch tabungan with jenis_tabungan details
    try {
      const { data, error } = await supabase
        .from('tabungan')
        .select(`
          id,
          anggota_id,
          jenis_tabungan_id,
          nomor_rekening,
          saldo,
          status,
          jenis_tabungan:jenis_tabungan_id(id, kode, nama)
        `)
        .eq('anggota_id', anggota_id)
        .eq('status', 'aktif')
      
      if (error) {
        throw error
      }
      
      console.log('Raw tabungan data:', JSON.stringify(data))
      
      // Transform data to include jenis_tabungan_nama
      const transformedData = data.map(item => {
        // Handle the case where jenis_tabungan might be an array or object or null
        let jenisTabunganNama = 'Tabungan';
        let jenisTabunganKode = '';
        
        if (item.jenis_tabungan) {
          // If it's an object (which it should be)
          if (typeof item.jenis_tabungan === 'object' && !Array.isArray(item.jenis_tabungan)) {
            const jenisTabungan = item.jenis_tabungan as { id?: string, kode?: string, nama?: string };
            jenisTabunganNama = jenisTabungan.nama || 'Tabungan';
            jenisTabunganKode = jenisTabungan.kode || '';
          }
        }
        
        return {
          id: item.id,
          anggota_id: item.anggota_id,
          jenis_tabungan_id: item.jenis_tabungan_id,
          nomor_rekening: item.nomor_rekening,
          jenis_tabungan_nama: jenisTabunganNama,
          jenis_tabungan_kode: jenisTabunganKode,
          saldo: parseFloat(item.saldo) || 0,
          status: item.status || 'aktif'
        };
      })
      
      console.log(`Successfully fetched ${transformedData.length} tabungan records`)
      
      // We no longer return a default account if none exists
      // This ensures we only show real accounts
      
      return NextResponse.json(transformedData)
    } catch (supabaseError) {
      console.error('Error with complex query:', supabaseError)
      
      // Fallback to a simpler query if the relationship query fails
      console.log('Trying simplified query without relationships...')
      const { data: simpleData, error: simpleError } = await supabase
        .from('tabungan')
        .select('id, jenis_tabungan_id, saldo, status')
        .eq('anggota_id', anggota_id)
        .eq('status', 'aktif')
      
      if (simpleError) {
        console.error('Error with simplified query:', simpleError)
        throw simpleError
      }
      
      // Transform data without jenis_tabungan info
      const transformedData = simpleData.map(item => ({
        id: item.id,
        jenis_tabungan_id: item.jenis_tabungan_id,
        jenis_tabungan_nama: 'Tabungan', // Default name since we couldn't get the real one
        saldo: item.saldo || 0,
        status: item.status || 'aktif'
      }))
      
      console.log(`Successfully fetched ${transformedData.length} tabungan records with simplified query`)
      return NextResponse.json(transformedData)
    }
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
