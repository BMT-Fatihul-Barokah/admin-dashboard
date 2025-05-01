import { createClient } from '@supabase/supabase-js';

// Using direct URL and key for the koperasi fatihul barokah project
const supabaseUrl = 'https://hyiwhckxwrngegswagrb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5aXdoY2t4d3JuZ2Vnc3dhZ3JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0OTY4MzcsImV4cCI6MjA2MTA3MjgzN30.bpDSX9CUEA0F99x3cwNbeTVTVq-NHw5GC5jmp2QqnNM';

console.log('Initializing Supabase client with URL:', supabaseUrl);

// Create the Supabase client with debug logging
let supabaseClient;
try {
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true
    }
  });
  console.log('Supabase client initialized successfully');
} catch (error) {
  console.error('Error initializing Supabase client:', error);
  // Fallback to a basic client if there's an error
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = supabaseClient;

// Types based on the database schema
export type Anggota = {
  id: string;
  nama: string;
  nomor_rekening: string;
  saldo: number;
  alamat?: string;
  kota?: string;
  tempat_lahir?: string;
  tanggal_lahir?: Date;
  pekerjaan?: string;
  jenis_identitas?: string;
  nomor_identitas?: string;
  created_at: Date;
  updated_at: Date;
  closed_at?: Date;
  is_active: boolean;
}

export type Transaksi = {
  id: string;
  anggota_id: string;
  tipe_transaksi: string;
  kategori: string;
  deskripsi?: string;
  reference_number?: string;
  jumlah: number;
  saldo_sebelum: number;
  saldo_sesudah: number;
  pinjaman_id?: string;
  created_at: Date;
  updated_at: Date;
  anggota?: {
    nama: string;
  };
}

export type Pinjaman = {
  id: string;
  anggota_id: string;
  jenis_pinjaman: string;
  status: string;
  jumlah: number;
  jatuh_tempo: Date;
  bunga_persen: number;
  total_pembayaran: number;
  sisa_pembayaran: number;
  created_at: Date;
  updated_at: Date;
  anggota?: {
    nama: string;
  };
}

// Helper functions for data fetching
export async function getTotalAnggota(): Promise<number> {
  const { count, error } = await supabase
    .from('anggota')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);
  
  if (error) {
    console.error('Error fetching total anggota:', error);
    return 0;
  }
  
  return count || 0;
}

export async function getTotalSimpanan(): Promise<number> {
  const { data, error } = await supabase
    .from('anggota')
    .select('saldo')
    .eq('is_active', true);
  
  if (error) {
    console.error('Error fetching total simpanan:', error);
    return 0;
  }
  
  return data.reduce((sum, anggota) => sum + parseFloat(anggota.saldo), 0);
}

export async function getTotalPinjaman(): Promise<number> {
  const { data, error } = await supabase
    .from('pinjaman')
    .select('sisa_pembayaran')
    .eq('status', 'aktif');
  
  if (error) {
    console.error('Error fetching total pinjaman:', error);
    return 0;
  }
  
  return data.reduce((sum, pinjaman) => sum + parseFloat(pinjaman.sisa_pembayaran), 0);
}

export async function getRecentTransactions(limit: number = 5): Promise<Transaksi[]> {
  const { data, error } = await supabase
    .from('transaksi')
    .select(`
      *,
      anggota:anggota_id(nama)
    `)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error('Error fetching recent transactions:', error);
    return [];
  }
  
  return data;
}

export async function getMonthlyFinancialData(): Promise<any[]> {
  const currentYear = new Date().getFullYear();
  
  // Get monthly savings (simpanan) data
  const { data: simpananData, error: simpananError } = await supabase
    .from('transaksi')
    .select('jumlah, created_at')
    .eq('kategori', 'simpanan')
    .gte('created_at', `${currentYear}-01-01`)
    .lte('created_at', `${currentYear}-12-31`);
  
  if (simpananError) {
    console.error('Error fetching simpanan data:', simpananError);
    return [];
  }
  
  // Get monthly loan (pinjaman) data
  const { data: pinjamanData, error: pinjamanError } = await supabase
    .from('transaksi')
    .select('jumlah, created_at')
    .eq('kategori', 'pinjaman')
    .gte('created_at', `${currentYear}-01-01`)
    .lte('created_at', `${currentYear}-12-31`);
  
  if (pinjamanError) {
    console.error('Error fetching pinjaman data:', pinjamanError);
    return [];
  }
  
  // Process data by month
  const monthlyData = Array(12).fill(0).map((_, index) => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
    
    // Calculate monthly simpanan
    const monthSimpanan = simpananData
      .filter(item => new Date(item.created_at).getMonth() === index)
      .reduce((sum, item) => sum + parseFloat(item.jumlah), 0);
    
    // Calculate monthly pinjaman
    const monthPinjaman = pinjamanData
      .filter(item => new Date(item.created_at).getMonth() === index)
      .reduce((sum, item) => sum + parseFloat(item.jumlah), 0);
    
    return {
      name: monthNames[index],
      simpanan: monthSimpanan,
      pinjaman: monthPinjaman
    };
  });
  
  return monthlyData;
}

export async function getAllAnggota(): Promise<Anggota[]> {
  const { data, error } = await supabase
    .from('anggota')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching anggota:', error);
    return [];
  }
  
  return data || [];
}

export async function searchAnggota(query: string): Promise<Anggota[]> {
  const { data, error } = await supabase
    .from('anggota')
    .select('*')
    .or(`nama.ilike.%${query}%, nomor_rekening.ilike.%${query}%`)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error searching anggota:', error);
    return [];
  }
  
  return data || [];
}

export async function getAllTransactions(): Promise<Transaksi[]> {
  const { data, error } = await supabase
    .from('transaksi')
    .select(`
      *,
      anggota:anggota_id(nama)
    `)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
  
  return data || [];
}

export async function searchTransactions(query: string): Promise<Transaksi[]> {
  const { data, error } = await supabase
    .from('transaksi')
    .select(`
      *,
      anggota:anggota_id(nama)
    `)
    .or(`reference_number.ilike.%${query}%, deskripsi.ilike.%${query}%`)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error searching transactions:', error);
    return [];
  }
  
  return data || [];
}

export async function getTransactionsByType(type: string): Promise<Transaksi[]> {
  const { data, error } = await supabase
    .from('transaksi')
    .select(`
      *,
      anggota:anggota_id(nama)
    `)
    .eq('tipe_transaksi', type)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching transactions by type:', error);
    return [];
  }
  
  return data || [];
}

export async function getAllPinjaman(): Promise<Pinjaman[]> {
  const { data, error } = await supabase
    .from('pinjaman')
    .select(`
      *,
      anggota:anggota_id(nama)
    `)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching pinjaman:', error);
    return [];
  }
  
  return data || [];
}

export async function searchPinjaman(query: string): Promise<Pinjaman[]> {
  const { data, error } = await supabase
    .from('pinjaman')
    .select(`
      *,
      anggota:anggota_id(nama)
    `)
    .or(`jenis_pinjaman.ilike.%${query}%`)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error searching pinjaman:', error);
    return [];
  }
  
  return data || [];
}

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
