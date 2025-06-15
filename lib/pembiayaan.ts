import { supabase } from "./supabase";

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
  tanggal_jatuh_tempo_bulanan?: number;
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
  jangka_waktu: number; // This is used in the RPC function as p_durasi_bulan
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
 * Get all pembiayaan (loans) with member information
 */
export async function getAllPembiayaan(): Promise<Pembiayaan[]> {
  console.log('Fetching all pembiayaan data');
  
  try {
    // Check if Supabase client is initialized
    if (!supabase) {
      console.error('Supabase client is not initialized');
      return [];
    }
    
    // Log Supabase URL and key (partial for security)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    console.log('Supabase client initialized with URL:', supabaseUrl);
    console.log('Supabase key available:', !!supabaseKey, 
      supabaseKey ? `Key prefix: ${supabaseKey.substring(0, 10)}...` : '');
    
    // Debug Supabase environment variables
    if (typeof window !== 'undefined') {
      console.log('NEXT_PUBLIC_SUPABASE_URL available in browser:', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
      console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY available in browser:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
      console.log('Service role key available:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
    }
    
    // We've updated the RLS policy to allow anonymous access
    console.log('Using regular client with updated RLS policies');
    
    console.log('Querying pembiayaan table...');
    const { data, error } = await supabase
      .from('pembiayaan')
      .select(`
        *,
        anggota:anggota_id(nama, nomor_rekening),
        jenis_pembiayaan:jenis_pembiayaan_id(nama, kode, deskripsi)
      `)
      .order('created_at', { ascending: false });
    
    console.log('Raw response from Supabase:', { 
      dataReceived: !!data, 
      dataLength: data?.length || 0, 
      errorReceived: !!error,
      errorMessage: error?.message,
      errorDetails: error?.details,
      error: error // Log the full error object
    });
    
    if (error) {
      console.error('Error fetching pembiayaan:', error);
      return [];
    }
    
    if (!data) {
      console.log('No data returned from Supabase (data is null or undefined)');
      return [];
    }
    
    if (data.length === 0) {
      console.log('Empty array returned from Supabase (no records found)');
      return [];
    }
    
    console.log('First raw data item:', JSON.stringify(data[0], null, 2));
    
    // Map the data to include jenis_pembiayaan_nama for backward compatibility
    const mappedData = data.map((item: any) => {
      return {
        ...item,
        // Add jenis_pembiayaan_nama for backward compatibility with UI code
        jenis_pembiayaan_nama: item.jenis_pembiayaan?.nama || 'Unknown'
      };
    });
    
    console.log('Mapped pembiayaan data count:', mappedData.length);
    if (mappedData.length > 0) {
      console.log('Sample mapped item:', JSON.stringify(mappedData[0], null, 2));
    }
    
    return mappedData;
  } catch (e) {
    console.error('Exception in getAllPembiayaan:', e);
    console.error('Error details:', e instanceof Error ? e.message : String(e));
    console.error('Error stack:', e instanceof Error ? e.stack : 'No stack available');
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
 * Get pembiayaan by anggota_id and status
 */
export async function getPembiayaanByAnggotaAndStatus(anggotaId: string, status: string): Promise<Pembiayaan[]> {
  const { data, error } = await supabase
    .from('pembiayaan')
    .select(`
      *,
      anggota:anggota_id(nama, nomor_rekening),
      jenis_pembiayaan:jenis_pembiayaan_id(nama, kode, deskripsi)
    `)
    .eq('anggota_id', anggotaId)
    .eq('status', status)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching pembiayaan by anggota and status:', error);
    return [];
  }
  
  return data || [];
}

/**
 * Create a new pembiayaan with active status using the RPC function
 */
export async function createPembiayaan(pembiayaanData: PembiayaanInput): Promise<{ success: boolean; error?: any; data?: any; pembiayaan_id?: string }> {
  console.log('createPembiayaan called with data:', JSON.stringify(pembiayaanData, null, 2));
  try {
    // Validate required fields
    if (!pembiayaanData.anggota_id || !pembiayaanData.jenis_pembiayaan_id || !pembiayaanData.jumlah || !pembiayaanData.jatuh_tempo) {
      console.error('Validation failed: Missing required fields');
      return {
        success: false,
        error: { message: 'Semua field wajib diisi' }
      };
    }
    
    // Prepare the loan data
    const jumlah = Number(pembiayaanData.jumlah);
    
    // We no longer need to fetch the jenis_pembiayaan name since our updated RPC function accepts the ID directly
    console.log('Using jenis_pembiayaan_id directly:', pembiayaanData.jenis_pembiayaan_id);
    
    // Use the updated RPC function to add the pembiayaan
    const rpcParams = {
      p_anggota_id: pembiayaanData.anggota_id,
      p_jenis_pembiayaan_id: pembiayaanData.jenis_pembiayaan_id,
      p_jumlah: jumlah,
      p_jatuh_tempo: pembiayaanData.jatuh_tempo,
      p_durasi_bulan: pembiayaanData.jangka_waktu || 3,
      p_deskripsi: pembiayaanData.deskripsi || ''
    };
    
    console.log('Calling add_pembiayaan RPC with params:', JSON.stringify(rpcParams, null, 2));
    const { data, error } = await supabase.rpc('add_pembiayaan', rpcParams);
    console.log('RPC response:', { data, error });
    
    if (error) {
      console.error('Error in add_pembiayaan RPC:', error);
      return {
        success: false,
        error
      };
    }
    
    if (!data) {
      console.error('No data returned from RPC function');
      return {
        success: false,
        error: { message: 'Tidak ada data yang dikembalikan dari RPC function' }
      };
    }
    
    console.log('RPC returned data:', JSON.stringify(data, null, 2));
    
    // Type check the response
    const rpcResponse = data as { success: boolean; pembiayaan_id?: string; error?: string };
    console.log('Parsed RPC response:', JSON.stringify(rpcResponse, null, 2));
    
    if (!rpcResponse.success) {
      console.error('RPC function reported failure:', rpcResponse.error);
      return {
        success: false,
        error: { message: rpcResponse.error || 'Gagal membuat pembiayaan' }
      };
    }
    
    console.log('RPC function reported success with ID:', rpcResponse.pembiayaan_id);
    
    return {
      success: true,
      data: rpcResponse,
      pembiayaan_id: rpcResponse.pembiayaan_id
    };
  } catch (error: any) {
    console.error('Exception in createPembiayaan:', error);
    return {
      success: false,
      error: { message: error?.message || 'Terjadi kesalahan saat membuat pembiayaan' }
    };
  }
}
