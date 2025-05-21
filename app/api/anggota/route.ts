import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET handler to fetch all anggota
export async function GET() {
  try {
    console.log('Fetching anggota from Supabase...')
    
    // Fetch all active anggota
    const { data, error } = await supabase
      .from('anggota')
      .select('*')
      .eq('is_active', true)
      .order('nama')
    
    if (error) {
      console.error('Error fetching anggota:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    
    console.log(`Successfully fetched ${data?.length || 0} anggota`)
    
    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

// POST handler to create a new anggota
export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log('Creating new anggota with data:', body)
    
    // Validate required fields
    const requiredFields = ['nama', 'nomor_rekening']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Field '${field}' is required` },
          { status: 400 }
        )
      }
    }
    
    // Set default values
    const newAnggota = {
      nama: body.nama,
      nomor_rekening: body.nomor_rekening,
      saldo: body.saldo || 0,
      alamat: body.alamat || null,
      kota: body.kota || null,
      tempat_lahir: body.tempat_lahir || null,
      tanggal_lahir: body.tanggal_lahir || null,
      pekerjaan: body.pekerjaan || null,
      jenis_identitas: body.jenis_identitas || null,
      nomor_identitas: body.nomor_identitas || null,
      is_active: true
    }
    
    // Insert new anggota
    const { data, error } = await supabase
      .from('anggota')
      .insert(newAnggota)
      .select()
      .single()
    
    if (error) {
      console.error('Error creating anggota:', error)
      return NextResponse.json(
        { error: `Failed to create anggota: ${error.message}` },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Anggota created successfully',
      data
    })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
