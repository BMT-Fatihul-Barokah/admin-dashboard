import { supabase } from './supabase';

export type Pembiayaan = {
  id: string;
  anggota_id: string;
  jenis_pembiayaan_id: string;
  status: string;
  jumlah: number;
  jatuh_tempo: Date;
  total_pembayaran: number;
  sisa_pembayaran: number;
  jangka_waktu: number;
  sisa_bulan?: number;
  created_at: Date;
  updated_at: Date;
  deskripsi?: string;
  anggota?: {
    nama: string;
    nomor_rekening: string;
  };
  jenis_pembiayaan?: {
    nama: string;
    kode: string;
    deskripsi?: string;
  };
  // For backward compatibility with UI code
  jenis_pembiayaan_nama?: string;
}

export type PembiayaanInput = {
  anggota_id: string;
  jenis_pembiayaan_id: string;
  jumlah: number;
  jatuh_tempo: string;
  jangka_waktu: number;
  durasi_bulan: number;
  deskripsi?: string;
}

export type JenisPembiayaan = {
  id: string;
  kode: string;
  nama: string;
  deskripsi?: string;
}

/**
 * Get all jenis pembiayaan
 */
export async function getAllJenisPembiayaan(): Promise<JenisPembiayaan[]> {
  try {
    const { data, error } = await supabase
      .from('jenis_pembiayaan')
      .select('*')
      .order('nama');
    
    if (error) {
      console.error('Error fetching jenis_pembiayaan:', error);
      return [];
    }
    
    return data || [];
  } catch (e) {
    console.error('Exception in getAllJenisPembiayaan:', e);
    return [];
  }
}

/**
 * Get all pembiayaan with member information
 */
export async function getAllPembiayaan(): Promise<Pembiayaan[]> {
  console.log('Fetching all pembiayaan data');
  
  try {
    console.log('Supabase client initialized:', !!supabase);
    
    const { data, error } = await supabase
      .from('pembiayaan')
      .select(`
        *,
        anggota:anggota_id(nama, nomor_rekening),
        jenis_pembiayaan:jenis_pembiayaan_id(nama, kode, deskripsi)
      `)
      .order('created_at', { ascending: false });
    
    console.log('Raw response from Supabase:', { data: data?.length || 0, error });
    
    if (error) {
      console.error('Error fetching pembiayaan:', error);
      return [];
    }
    
    if (!data || data.length === 0) {
      console.log('No pembiayaan data returned from Supabase');
      return [];
    }
    
    console.log('Sample raw data item:', data[0]);
    
    // Map the data to include jenis_pembiayaan_nama for backward compatibility
    const mappedData = data.map(item => {
      console.log('Processing item:', item.id, 'jenis_pembiayaan:', item.jenis_pembiayaan);
      return {
        ...item,
        // Add jenis_pembiayaan_nama for backward compatibility with UI code
        jenis_pembiayaan_nama: item.jenis_pembiayaan?.nama || 'Unknown'
      };
    });
    
    console.log('Mapped pembiayaan data count:', mappedData.length);
    console.log('Sample mapped item:', mappedData[0]);
    return mappedData;
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
      anggota:anggota_id(nama, nomor_rekening),
      jenis_pembiayaan:jenis_pembiayaan_id(nama, kode, deskripsi)
    `)
    .or(`status.ilike.%${query}%, deskripsi.ilike.%${query}%`)
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
      anggota:anggota_id(nama, nomor_rekening),
      jenis_pembiayaan:jenis_pembiayaan_id(nama, kode, deskripsi)
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
    if (!pembiayaanData.anggota_id || !pembiayaanData.jenis_pembiayaan_id || !pembiayaanData.jatuh_tempo || !pembiayaanData.jumlah) {
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
      p_jenis_pembiayaan_id: pembiayaanData.jenis_pembiayaan_id,
      p_jumlah: jumlah,
      p_jatuh_tempo: pembiayaanData.jatuh_tempo,
      p_jangka_waktu: pembiayaanData.jangka_waktu || 3,
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
