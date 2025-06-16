import { NextRequest, NextResponse } from 'next/server';
import { getPembiayaanByAnggotaAndStatus } from '@/lib/pembiayaan';

export async function GET(request: NextRequest) {
  try {
    // Extract query parameters
    const searchParams = request.nextUrl.searchParams;
    const anggotaId = searchParams.get('anggota_id');
    const status = searchParams.get('status') || 'aktif'; // Default to 'aktif' if not provided
    
    // Validate required parameters
    if (!anggotaId) {
      return NextResponse.json(
        { error: 'Parameter anggota_id wajib diisi' },
        { status: 400 }
      );
    }
    
    // Fetch pembiayaan data
    const pembiayaanList = await getPembiayaanByAnggotaAndStatus(anggotaId, status);
    
    return NextResponse.json(pembiayaanList);
  } catch (error: any) {
    console.error('Error in pembiayaan by-anggota API:', error);
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan saat mengambil data pembiayaan' },
      { status: 500 }
    );
  }
}
