import { NextResponse } from 'next/server'
import { getAllJenisTabungan } from '@/lib/supabase'

// GET handler to fetch all active jenis tabungan
export async function GET() {
  try {
    console.log('Fetching jenis tabungan from Supabase...')
    
    // Use the helper function to fetch jenis tabungan
    const data = await getAllJenisTabungan()
    
    console.log(`Successfully fetched ${data?.length || 0} jenis tabungan`)
    
    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
