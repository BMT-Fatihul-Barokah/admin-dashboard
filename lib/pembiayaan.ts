import { supabase } from './supabase';

export type Pembiayaan = {
  id: string;
  anggota_id: string;
  jenis_pembiayaan: string;
  status: string;
  jumlah: number;
  jatuh_tempo: Date;
  total_pembayaran: number;
  sisa_pembayaran: number;
  durasi_bulan: number;
  created_at: Date;
  updated_at: Date;
  kategori: string;
  deskripsi?: string;
  anggota?: {
    nama: string;
  };
}

export type PembiayaanInput = {
  anggota_id: string;
  jenis_pembiayaan: string;
  jumlah: number;
  jatuh_tempo: string;
  durasi_bulan: number;
  kategori: string;
  deskripsi?: string;
}

/**
 * Get all pembiayaan with member information
 */
export async function getAllPembiayaan(): Promise<Pembiayaan[]> {
  console.log('Fetching all pembiayaan data');
  
  try {
    const { data, error } = await supabase
      .from('pembiayaan')
      .select(`
        *,
        anggota:anggota_id(nama)
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching pembiayaan:', error);
      return [];
    }
    
    return data || [];
  } catch (e) {
    console.error('Exception in getAllPembiayaan:', e);
    return [];
  }
}

/**
 * Search pembiayaan by query
 */
export async function searchPembiayaan(query: string): Promise<Pembiayaan[]> {
  const { data, error } = await supabase
    .from('pembiayaan')
    .select(`
      *,
      anggota:anggota_id(nama)
    `)
    .or(`jenis_pembiayaan.ilike.%${query}%, status.ilike.%${query}%, kategori.ilike.%${query}%`)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error searching pembiayaan:', error);
    return [];
  }
  
  return data || [];
}

/**
 * Get pembiayaan by status
 */
export async function getPembiayaanByStatus(status: string): Promise<Pembiayaan[]> {
  const { data, error } = await supabase
    .from('pembiayaan')
    .select(`
      *,
      anggota:anggota_id(nama)
    `)
    .eq('status', status)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching pembiayaan by status:', error);
    return [];
  }
  
  return data || [];
}

/**
 * Create a new pembiayaan with active status
 */
export async function createPembiayaan(pembiayaanData: PembiayaanInput): Promise<{ success: boolean; error?: any; data?: any }> {
  try {
    // Basic validation
    if (!pembiayaanData.anggota_id || !pembiayaanData.jenis_pembiayaan || !pembiayaanData.jatuh_tempo || !pembiayaanData.jumlah) {
      return {
        success: false,
        error: { message: 'Semua field wajib diisi' }
      };
    }

    // Prepare the loan data
    const jumlah = Number(pembiayaanData.jumlah);
    
    // Insert with fields matching the new pembiayaan table structure
    const { data, error } = await supabase
      .from('pembiayaan')
      .insert({
        anggota_id: pembiayaanData.anggota_id,
        jenis_pembiayaan: pembiayaanData.jenis_pembiayaan,
        jumlah: jumlah,
        jatuh_tempo: pembiayaanData.jatuh_tempo,
        durasi_bulan: pembiayaanData.durasi_bulan || 3,
        status: 'aktif',
        total_pembayaran: jumlah,
        sisa_pembayaran: jumlah,
        kategori: pembiayaanData.kategori || 'umum',
        deskripsi: pembiayaanData.deskripsi || ''
      })
      .select();
    
    if (error) {
      console.error('Error creating pembiayaan:', error);
      return {
        success: false,
        error: { message: 'Gagal membuat pembiayaan: ' + (error.message || 'Unknown error') }
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
    console.error('Exception in createPembiayaan:', e);
    return {
      success: false,
      error: { message: 'Terjadi kesalahan: ' + (e?.message || 'Unknown error') }
    };
  }
}
