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
 * Create a new loan application
 */
export async function createPinjaman(pinjamanData: PinjamanInput): Promise<{ success: boolean; error?: any; data?: any }> {
  try {
    const now = new Date().toISOString();
    
    // Calculate loan details
    const jumlah = Number(pinjamanData.jumlah);
    // For simplicity, we're setting total_pembayaran and sisa_pembayaran to the same value as jumlah
    // In a real application, you might calculate interest or other fees
    const total_pembayaran = jumlah;
    const sisa_pembayaran = jumlah;
    
    // Insert new loan with status 'diajukan' (applied)
    const { data, error } = await supabase
      .from('pinjaman')
      .insert([
        {
          anggota_id: pinjamanData.anggota_id,
          jenis_pinjaman: pinjamanData.jenis_pinjaman,
          jumlah: jumlah,
          jatuh_tempo: pinjamanData.jatuh_tempo,
          status: 'diajukan',
          total_pembayaran: total_pembayaran,
          sisa_pembayaran: sisa_pembayaran,
          created_at: now,
          updated_at: now
        }
      ])
      .select();
    
    if (error) {
      console.error('Error creating pinjaman:', error);
      return { success: false, error };
    }
    
    return { success: true, data };
  } catch (e) {
    console.error('Exception in createPinjaman:', e);
    return { success: false, error: e };
  }
}
