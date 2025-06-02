import { createClient } from '@supabase/supabase-js';

// Custom error handler to properly format and log Supabase errors
export function handleSupabaseError(error: any, context: string = 'Supabase operation'): any {
  // If error is empty object, add more context
  if (error && Object.keys(error).length === 0) {
    console.error(`${context} failed with empty error object. This usually indicates a network issue or invalid credentials.`);
    return {
      message: 'Database connection error. Please check your network connection or contact support.',
      code: 'CONNECTION_ERROR',
      details: 'Empty error object received from Supabase',
      context
    };
  }
  
  // Return the original error with added context
  return {
    ...error,
    context
  };
}

// Supabase project credentials for koperasi fatihul barokah
const supabaseUrl = 'https://vszhxeamcxgqtwyaxhlu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzemh4ZWFtY3hncXR3eWF4aGx1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4NDQ0ODYsImV4cCI6MjA2NDQyMDQ4Nn0.x6Nj5UAHLA2nsNfvK4P8opRkB0U3--ZFt7Dc3Dj-q94';
// Service role key - will bypass RLS policies - use carefully and only for admin operations
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzemh4ZWFtY3hncXR3eWF4aGx1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODg0NDQ4NiwiZXhwIjoyMDY0NDIwNDg2fQ.FkK4YRjPQ0BczBelUVPCe5vEvvWEH5xtBxWVcnKGSSI';

console.log('Initializing Supabase client with URL:', supabaseUrl);

// Create the Supabase client with debug logging and proper configuration
let supabaseClient;
try {
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false
    },
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        'x-client-info': 'admin-dashboard'
      },
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  });
  
  // Set default headers for admin access
  supabaseClient.auth.onAuthStateChange((event, session) => {
    if (session) {
      console.log('Auth state changed:', event, 'User:', session.user?.email);
    } else {
      console.log('No active session');
    }
  });
  
  console.log('Supabase client initialized successfully');
} catch (error) {
  console.error('Error initializing Supabase client:', error);
  // Fallback to a basic client if there's an error
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = supabaseClient;

// Admin client using service role key to bypass RLS policies
// ONLY use this for admin operations where bypassing RLS is necessary
let supabaseAdminClient;
try {
  supabaseAdminClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false
    },
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        'x-client-info': 'admin-dashboard-admin'
      },
    }
  });
  console.log('Supabase admin client initialized successfully');
} catch (error) {
  console.error('Error initializing Supabase admin client:', error);
  // Fallback to a basic client if there's an error
  supabaseAdminClient = createClient(supabaseUrl, supabaseServiceKey);
}

export const supabaseAdmin = supabaseAdminClient;

// Types based on the database schema
export type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  time: Date;
  read: boolean;
  action?: string | null;
  action_link?: string | null;
  anggota_id?: string | null;
  pinjaman_id?: string | null;
  transaksi_id?: string | null;
  created_at: Date;
  updated_at: Date;
  anggota?: {
    nama: string;
  };
}

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
  // Get total from tabungan table instead of anggota.saldo
  const { data, error } = await supabase
    .from('tabungan')
    .select('saldo')
    .eq('status', 'aktif');
  
  if (error || !data) {
    console.error('Error fetching total simpanan:', error);
    return 0;
  }
  
  return data.reduce((sum, tabungan) => sum + parseFloat(tabungan.saldo), 0);
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
  
  // Get all transaction data for the current year
  const { data: transactionData, error: transactionError } = await supabase
    .from('transaksi')
    .select('jumlah, created_at, kategori, tipe_transaksi')
    .or('kategori.eq.setoran,kategori.eq.penarikan,kategori.eq.pinjaman,kategori.eq.pembayaran_pinjaman')
    .gte('created_at', `${currentYear}-01-01`)
    .lte('created_at', `${currentYear}-12-31`);
  
  if (transactionError) {
    console.error('Error fetching transaction data:', transactionError);
    return [];
  }
  
  // Process data by month
  const monthlyData = Array(12).fill(0).map((_, index) => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
    
    // Filter transactions for this month
    const monthTransactions = transactionData
      .filter(item => new Date(item.created_at).getMonth() === index);
    
    // Calculate monthly simpanan (deposits)
    const monthSimpanan = monthTransactions
      .filter(item => item.kategori === 'setoran')
      .reduce((sum, item) => sum + parseFloat(item.jumlah), 0);
    
    // Calculate monthly penarikan (withdrawals) as negative values
    const monthPenarikan = monthTransactions
      .filter(item => item.kategori === 'penarikan')
      .reduce((sum, item) => sum + parseFloat(item.jumlah), 0);
    
    // Calculate monthly pinjaman (loans)
    const monthPinjaman = monthTransactions
      .filter(item => item.kategori === 'pinjaman')
      .reduce((sum, item) => sum + parseFloat(item.jumlah), 0);
    
    // Calculate monthly pembayaran pinjaman (loan payments)
    const monthPembayaranPinjaman = monthTransactions
      .filter(item => item.kategori === 'pembayaran_pinjaman')
      .reduce((sum, item) => sum + parseFloat(item.jumlah), 0);
    
    return {
      name: monthNames[index],
      simpanan: monthSimpanan - monthPenarikan, // Net savings (deposits - withdrawals)
      pinjaman: monthPinjaman - monthPembayaranPinjaman // Net loans (loans - payments)
    };
  });
  
  // If there's no data for any month, add fallback data to show something on the chart
  const hasData = monthlyData.some(month => month.simpanan !== 0 || month.pinjaman !== 0);
  
  if (!hasData) {
    // Get the current month and add some sample data
    const currentMonth = new Date().getMonth();
    monthlyData[currentMonth].simpanan = 1000000; // 1 million sample data
    monthlyData[currentMonth].pinjaman = 500000; // 500k sample data
  }
  
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

export async function searchPinjamanByStatus(status: string): Promise<Pinjaman[]> {
  const { data, error } = await supabase
    .from('pinjaman')
    .select(`
      *,
      anggota:anggota_id(nama)
    `)
    .eq('status', status)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error searching pinjaman by status:', error);
    return [];
  }
  
  return data || [];
}

// Notification functions
export async function getAllNotifications(): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select(`
      *,
      anggota:anggota_id(nama)
    `)
    .order('time', { ascending: false });
  
  if (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
  
  return data || [];
}

export async function getUnreadNotifications(): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select(`
      *,
      anggota:anggota_id(nama)
    `)
    .eq('read', false)
    .order('time', { ascending: false });
  
  if (error) {
    console.error('Error fetching unread notifications:', error);
    return [];
  }
  
  return data || [];
}

export async function getNotificationsByType(type: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select(`
      *,
      anggota:anggota_id(nama)
    `)
    .eq('type', type)
    .order('time', { ascending: false });
  
  if (error) {
    console.error('Error fetching notifications by type:', error);
    return [];
  }
  
  return data || [];
}

export async function markNotificationAsRead(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true, updated_at: new Date() })
    .eq('id', id);
  
  if (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
  
  return true;
}

export async function markAllNotificationsAsRead(): Promise<boolean> {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true, updated_at: new Date() })
    .eq('read', false);
  
  if (error) {
    console.error('Error marking all notifications as read:', error);
    return false;
  }
  
  return true;
}

// Jenis Tabungan functions
export type JenisTabungan = {
  id: string;
  kode: string;
  nama: string;
  deskripsi: string;
  minimum_setoran: number;
  is_active: boolean;
  created_at?: Date | string;
  updated_at?: Date | string;
  biaya_admin?: number;
  bagi_hasil?: number | null;
  is_required?: boolean;
  is_reguler?: boolean;
  display_order?: number;
}

export async function getAllJenisTabungan(): Promise<JenisTabungan[]> {
  const { data, error } = await supabase
    .from('jenis_tabungan')
    .select('*')
    .eq('is_active', true)
    .order('kode', { ascending: true });
  
  if (error) {
    console.error('Error fetching jenis tabungan:', error);
    return [];
  }
  
  const processedData = (data || []).map(item => ({
    ...item,
    biaya_admin: item.biaya_admin || 0,
    bagi_hasil: item.bagi_hasil || null,
    is_required: item.is_required || false,
    is_reguler: item.is_reguler || true,
    display_order: item.display_order || 0
  }));
  
  return processedData;
}
