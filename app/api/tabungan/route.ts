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
    
    // Fetch tabungan with jenis_tabungan details
    const { data, error } = await supabase
      .from('tabungan')
      .select(`
        id,
        jenis_tabungan_id,
        saldo,
        status,
        jenis_tabungan:jenis_tabungan_id(nama)
      `)
      .eq('anggota_id', anggota_id)
      .eq('status', 'aktif')
    
    if (error) {
      console.error('Error fetching tabungan:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    
    // Transform data to include jenis_tabungan_nama
    const transformedData = data.map((item: any) => ({
      id: item.id,
      jenis_tabungan_id: item.jenis_tabungan_id,
      jenis_tabungan_nama: item.jenis_tabungan?.nama,
      saldo: item.saldo,
      status: item.status
    }))
    
    console.log(`Successfully fetched ${transformedData.length} tabungan records`)
    
    return NextResponse.json(transformedData)
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
