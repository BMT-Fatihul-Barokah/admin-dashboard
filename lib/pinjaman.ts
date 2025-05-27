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
  created_at: Date;
  updated_at: Date;
  anggota?: {
    nama: string;
  };
}

export type PinjamanInput = {
  anggota_id: string;
  jenis_pinjaman: string;
  jumlah: number;
  jatuh_tempo: string;
  alasan?: string;
}

/**
 * Get all loans with member information
 */
export async function getAllPinjaman(): Promise<Pinjaman[]> {
  console.log('Supabase client:', supabase);
  console.log('Supabase URL:', (supabase as any).supabaseUrl);
  
  try {
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
      return [];
    }
    
    return data || [];
  } catch (e) {
    console.error('Exception in getAllPinjaman:', e);
    return [];
  }
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
