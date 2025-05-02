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
