import { supabase } from './supabase';

export type Pinjaman = {
  id: string;
  anggota_id: string;
  jenis_pinjaman: string;
  status: string;
  jumlah: number;
  jatuh_tempo: Date;
  total_pembayaran: number;
  sisa_pembayaran: number;
  durasi_bulan: number;
  progress_percentage: number;
  created_at: Date;
  updated_at: Date;
  anggota?: {
    nama: string;
  };
  alasan?: string;
}

export type PinjamanInput = {
  anggota_id: string;
  jenis_pinjaman: string;
  jumlah: number;
  jatuh_tempo: string;
  durasi_bulan: number;
  alasan?: string;
}

/**
 * Get all loans with member information
 */
export async function getAllPinjaman(): Promise<Pinjaman[]> {
  console.log('Supabase client:', supabase);
  console.log('Supabase URL:', (supabase as any).supabaseUrl);
  
  try {
    // First check if the pinjaman table exists
    const { data: tableCheck, error: tableError } = await supabase
      .from('pinjaman')
      .select('id')
      .limit(1);
    
    if (tableError) {
      console.error('Error checking pinjaman table:', tableError);
      // If the table doesn't exist, return placeholder data for development
      if (tableError.code === '42P01') { // PostgreSQL error code for undefined_table
        console.log('Pinjaman table does not exist, returning placeholder data');
        return generatePlaceholderPinjaman();
      }
      return [];
    }
    
    // If we get here, the table exists, so proceed with the actual query
    const { data, error } = await supabase
      .from('pinjaman')
      .select(`
        *,
        anggota:anggota_id(nama)
      `)
      .order('created_at', { ascending: false });
    
    console.log('Supabase response:', { data, error });
    
    if (error) {
      console.error('Error fetching pinjaman:', error);
      return generatePlaceholderPinjaman();
    }
    
    if (!data || data.length === 0) {
      console.log('No pinjaman data found, returning placeholder data');
      return generatePlaceholderPinjaman();
    }
    
    return data;
  } catch (e) {
    console.error('Exception in getAllPinjaman:', e);
    return generatePlaceholderPinjaman();
  }
}

// Generate placeholder loan data for development and testing
function generatePlaceholderPinjaman(): Pinjaman[] {
  const now = new Date();
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(now.getFullYear() + 1);
  
  return [
    {
      id: 'placeholder-1',
      anggota_id: 'placeholder-member-1',
      jenis_pinjaman: 'Pinjaman Umum',
      status: 'aktif',
      jumlah: 5000000,
      jatuh_tempo: oneYearFromNow,
      total_pembayaran: 5500000,
      sisa_pembayaran: 4000000,
      durasi_bulan: 12,
      progress_percentage: 30,
      created_at: now,
      updated_at: now,
      anggota: {
        nama: 'Anggota Contoh 1'
      }
    },
    {
      id: 'placeholder-2',
      anggota_id: 'placeholder-member-2',
      jenis_pinjaman: 'Pinjaman Usaha',
      status: 'lunas',
      jumlah: 3000000,
      jatuh_tempo: oneYearFromNow,
      total_pembayaran: 3300000,
      sisa_pembayaran: 0,
      durasi_bulan: 6,
      progress_percentage: 100,
      created_at: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
      updated_at: now,
      anggota: {
        nama: 'Anggota Contoh 2'
      }
    },
    {
      id: 'placeholder-3',
      anggota_id: 'placeholder-member-3',
      jenis_pinjaman: 'Pinjaman Pendidikan',
      status: 'diajukan',
      jumlah: 2000000,
      jatuh_tempo: oneYearFromNow,
      total_pembayaran: 2200000,
      sisa_pembayaran: 2200000,
      durasi_bulan: 12,
      progress_percentage: 0,
      created_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      updated_at: now,
      anggota: {
        nama: 'Anggota Contoh 3'
      }
    }
  ];
}

/**
 * Search loans by query
 */
export async function searchPinjaman(query: string): Promise<Pinjaman[]> {
  const { data, error } = await supabase
    .from('pinjaman')
    .select(`
      *,
      anggota:anggota_id(nama)
    `)
    .or(`jenis_pinjaman.ilike.%${query}%, status.ilike.%${query}%`)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error searching pinjaman:', error);
    return [];
  }
  
  return data || [];
}

/**
 * Get loans by status
 */
export async function getPinjamanByStatus(status: string): Promise<Pinjaman[]> {
  const { data, error } = await supabase
    .from('pinjaman')
    .select(`
      *,
      anggota:anggota_id(nama)
    `)
    .eq('status', status)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching pinjaman by status:', error);
    return [];
  }
  
  return data || [];
}

/**
 * Create a new loan directly with active status
 */
export async function createPinjaman(pinjamanData: PinjamanInput): Promise<{ success: boolean; error?: any; data?: any }> {
  try {
    // Basic validation
    if (!pinjamanData.anggota_id || !pinjamanData.jenis_pinjaman || !pinjamanData.jatuh_tempo || !pinjamanData.jumlah) {
      return {
        success: false,
        error: { message: 'Semua field wajib diisi' }
      };
    }

    // Prepare the loan data
    const jumlah = Number(pinjamanData.jumlah);
    
    // Simple insert with minimal fields to reduce potential errors
    const { data, error } = await supabase
      .from('pinjaman')
      .insert({
        anggota_id: pinjamanData.anggota_id,
        jenis_pinjaman: pinjamanData.jenis_pinjaman,
        jumlah: jumlah,
        jatuh_tempo: pinjamanData.jatuh_tempo,
        durasi_bulan: pinjamanData.durasi_bulan || 3,
        status: 'aktif',
        total_pembayaran: jumlah,
        sisa_pembayaran: jumlah,
        alasan: pinjamanData.alasan || ''
      })
      .select();
    
    if (error) {
      console.error('Error creating loan:', error);
      return {
        success: false,
        error: { message: 'Gagal membuat pinjaman: ' + (error.message || 'Unknown error') }
      };
    }
    
    if (!data || data.length === 0) {
      return {
        success: false,
        error: { message: 'Tidak ada data yang dikembalikan dari operasi insert' }
      };
    }
    
    return { success: true, data: data[0] };
  } catch (e: any) {
    console.error('Exception in createPinjaman:', e);
    return {
      success: false,
      error: { message: 'Terjadi kesalahan: ' + (e?.message || 'Unknown error') }
    };
  }
}
