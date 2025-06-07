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
  sisa_bulan?: number;
  created_at: Date;
  updated_at: Date;
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
 * Create a new pembiayaan with active status using the RPC function
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
    
    // Use the RPC function to add the pembiayaan
    const { data, error } = await supabase.rpc('add_pembiayaan', {
      p_anggota_id: pembiayaanData.anggota_id,
      p_jenis_pembiayaan: pembiayaanData.jenis_pembiayaan,
      p_jumlah: jumlah,
      p_jatuh_tempo: pembiayaanData.jatuh_tempo,
      p_durasi_bulan: pembiayaanData.durasi_bulan || 3,
      p_deskripsi: pembiayaanData.deskripsi || ''
    });
    
    if (error) {
      console.error('Error creating pembiayaan:', error);
      return {
        success: false,
        error: { message: 'Gagal membuat pembiayaan: ' + (error.message || 'Unknown error') }
      };
    }
    
    if (!data) {
      return {
        success: false,
        error: { message: 'Tidak ada data yang dikembalikan dari RPC function' }
      };
    }
    
    // Type check the response
    const rpcResponse = data as { success: boolean; pembiayaan_id?: string; error?: string };
    
    if (!rpcResponse.success) {
      return {
        success: false,
        error: { message: rpcResponse.error || 'Gagal membuat pembiayaan' }
      };
    }
    
    // Fetch the newly created pembiayaan data
    const { data: newPembiayaan, error: fetchError } = await supabase
      .from('pembiayaan')
      .select('*')
      .eq('id', rpcResponse.pembiayaan_id)
      .single();
      
    if (fetchError) {
      console.error('Error fetching created pembiayaan:', fetchError);
      // Still return success since the creation was successful
      return { 
        success: true, 
        data: { id: rpcResponse.pembiayaan_id }
      };
    }
    
    return { success: true, data: newPembiayaan };
  } catch (e: any) {
    console.error('Exception in createPembiayaan:', e);
    return {
      success: false,
      error: { message: 'Terjadi kesalahan: ' + (e?.message || 'Unknown error') }
    };
  }
}
