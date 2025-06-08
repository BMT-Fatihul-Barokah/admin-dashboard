import { createClient } from '@supabase/supabase-js';

// Supabase project credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

console.log('Initializing Supabase client with URL:', supabaseUrl);

// Create the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  },
  global: {
    headers: {
      'x-client-info': 'admin-dashboard'
    },
  },
});

// Log auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  if (session) {
    console.log('Auth state changed:', event, 'User:', session.user?.email);
  } else {
    console.log('No active session');
  }
});

console.log('Supabase client initialized successfully');

// Types based on the database schema

// Global notification type
export type GlobalNotification = {
  id: string;
  judul: string;
  pesan: string;
  jenis: string;
  data?: any;
  created_at: Date;
  updated_at: Date;
};

// Global notification read status type
export type GlobalNotificationRead = {
  id: string;
  global_notifikasi_id: string;
  anggota_id: string;
  is_read: boolean;
  created_at: Date;
  updated_at: Date;
  global_notifikasi?: GlobalNotification;
  anggota?: {
    nama: string;
  };
};

// Transaction notification type
export type TransactionNotification = {
  id: string;
  transaksi_id: string;
  judul: string;
  pesan: string;
  jenis: string;
  data?: any;
  is_read: boolean;
  created_at: Date;
  updated_at: Date;
  transaksi?: {
    anggota_id: string;
    anggota?: {
      nama: string;
    };
  };
};

// Legacy notification type for backward compatibility
export type Notification = GlobalNotificationRead | TransactionNotification;

export type Anggota = {
  id: string;
  nama: string;
  nomor_rekening: string;
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
  // Relationship fields
  tabungan?: {
    id: string;
    saldo: number;
  }[];
}

export type Transaksi = {
  id: string;
  anggota_id: string;
  tipe_transaksi: string;
  deskripsi?: string;
  jumlah: number;
  sebelum: number;
  sesudah: number;
  pembiayaan_id?: string;
  tabungan_id?: string;
  source_type: 'tabungan' | 'pembiayaan';
  created_at: Date;
  updated_at: Date;
  anggota?: {
    nama: string;
    nomor_rekening: string;
  };
  tabungan?: {
    id: string;
    jenis_tabungan_id: string;
    jenis_tabungan?: {
      nama: string;
      kode: string;
    };
  };
  pembiayaan?: {
    id: string;
    jenis_pembiayaan_id: string;
    jenis_pembiayaan?: {
      nama: string;
      kode: string;
    };
  };
}

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
  tanggal_jatuh_tempo_bulanan?: Date;
  sisa_bulan?: number;
  deskripsi?: string;
  created_at: Date;
  updated_at: Date;
  anggota?: {
    nama: string;
  };
  jenis_pembiayaan?: {
    nama: string;
    kode: string;
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
    .from('tabungan')
    .select('saldo')
    .eq('status', 'aktif');
  
  if (error) {
    console.error('Error fetching total simpanan:', error);
    return 0;
  }
  
  return data.reduce((sum, tabungan) => sum + parseFloat(tabungan.saldo.toString()), 0);
}

export async function getTotalPembiayaan(): Promise<number> {
  const { data, error } = await supabase
    .from('pembiayaan')
    .select('sisa_pembayaran')
    .eq('status', 'aktif');
  
  if (error) {
    console.error('Error fetching total pembiayaan:', error);
    return 0;
  }
  
  return data.reduce((sum, pembiayaan) => sum + parseFloat(pembiayaan.sisa_pembayaran), 0);
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
    .select('jumlah, created_at, source_type, tipe_transaksi')
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
      .filter(item => item.source_type === 'tabungan' && item.tipe_transaksi === 'setoran')
      .reduce((sum, item) => sum + parseFloat(item.jumlah.toString()), 0);
    
    // Calculate monthly penarikan (withdrawals) as negative values
    const monthPenarikan = monthTransactions
      .filter(item => item.source_type === 'tabungan' && item.tipe_transaksi === 'penarikan')
      .reduce((sum, item) => sum + parseFloat(item.jumlah.toString()), 0);
    
    // Calculate monthly pinjaman (loans)
    const monthPinjaman = monthTransactions
      .filter(item => item.source_type === 'pembiayaan' && item.tipe_transaksi === 'pencairan')
      .reduce((sum, item) => sum + parseFloat(item.jumlah.toString()), 0);
    
    // Calculate monthly pembayaran pinjaman (loan payments)
    const monthPembayaranPinjaman = monthTransactions
      .filter(item => item.source_type === 'pembiayaan' && item.tipe_transaksi === 'pembayaran')
      .reduce((sum, item) => sum + parseFloat(item.jumlah.toString()), 0);
    
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
      anggota:anggota_id(nama, nomor_rekening)
    `)
    .or(`deskripsi.ilike.%${query}%, tipe_transaksi.ilike.%${query}%`)
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

export async function getAllPembiayaan(): Promise<Pembiayaan[]> {
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
}

export async function searchPembiayaan(query: string): Promise<Pembiayaan[]> {
  const { data, error } = await supabase
    .from('pembiayaan')
    .select(`
      *,
      anggota:anggota_id(nama),
      jenis_pembiayaan:jenis_pembiayaan_id(nama, kode)
    `)
    .or(`status.ilike.%${query}%, deskripsi.ilike.%${query}%`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error searching pembiayaan:', error);
    return [];
  }

  return data || [];
}

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

export async function searchPembiayaanByStatus(status: string): Promise<Pembiayaan[]> {
  const { data, error } = await supabase
    .from('pembiayaan')
    .select(`
      *,
      anggota:anggota_id(nama)
    `)
    .eq('status', status)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error searching pembiayaan by status:', error);
    return [];
  }

  return data || [];
}

// Notification functions
export async function getAllNotifications(): Promise<Notification[]> {
  // Get global notifications with read status
  const { data: globalData, error: globalError } = await supabase
    .from('global_notifikasi_read')
    .select(`
      *,
      global_notifikasi(*),
      anggota:anggota_id(nama)
    `)
    .order('created_at', { ascending: false });

  if (globalError) {
    console.error('Error fetching global notifications:', globalError);
  }
  
  // Get transaction notifications
  const { data: transactionData, error: transactionError } = await supabase
    .from('transaksi_notifikasi')
    .select(`
      *,
      transaksi(anggota_id, anggota:anggota_id(nama))
    `)
    .order('created_at', { ascending: false });

  if (transactionError) {
    console.error('Error fetching transaction notifications:', transactionError);
  }

  // Combine both types of notifications
  const combinedData = [
    ...(globalData || []),
    ...(transactionData || [])
  ].sort((a, b) => {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return combinedData;
}

export async function getUnreadNotifications(): Promise<Notification[]> {
  // Get unread global notifications
  const { data: globalData, error: globalError } = await supabase
    .from('global_notifikasi_read')
    .select(`
      *,
      global_notifikasi(*),
      anggota:anggota_id(nama)
    `)
    .eq('is_read', false)
    .order('created_at', { ascending: false });

  if (globalError) {
    console.error('Error fetching unread global notifications:', globalError);
  }
  
  // Get unread transaction notifications
  const { data: transactionData, error: transactionError } = await supabase
    .from('transaksi_notifikasi')
    .select(`
      *,
      transaksi(anggota_id, anggota:anggota_id(nama))
    `)
    .eq('is_read', false)
    .order('created_at', { ascending: false });

  if (transactionError) {
    console.error('Error fetching unread transaction notifications:', transactionError);
  }

  // Combine both types of unread notifications
  const combinedData = [
    ...(globalData || []),
    ...(transactionData || [])
  ].sort((a, b) => {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return combinedData;
}

export async function getNotificationsByType(jenis: string): Promise<Notification[]> {
  // Get global notifications of specific type
  const { data: globalData, error: globalError } = await supabase
    .from('global_notifikasi_read')
    .select(`
      *,
      global_notifikasi(*),
      anggota:anggota_id(nama)
    `)
    .eq('global_notifikasi.jenis', jenis)
    .order('created_at', { ascending: false });

  if (globalError) {
    console.error('Error fetching global notifications by type:', globalError);
  }
  
  // Get transaction notifications of specific type
  const { data: transactionData, error: transactionError } = await supabase
    .from('transaksi_notifikasi')
    .select(`
      *,
      transaksi(anggota_id, anggota:anggota_id(nama))
    `)
    .eq('jenis', jenis)
    .order('created_at', { ascending: false });

  if (transactionError) {
    console.error('Error fetching transaction notifications by type:', transactionError);
  }

  // Combine both types of notifications
  const combinedData = [
    ...(globalData || []),
    ...(transactionData || [])
  ].sort((a, b) => {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return combinedData;
}

export async function markNotificationAsRead(id: string, type: 'global' | 'transaction' = 'global'): Promise<boolean> {
  let error;
  
  if (type === 'global') {
    // Mark global notification as read
    const response = await supabase
      .from('global_notifikasi_read')
      .update({ is_read: true })
      .eq('id', id);
    error = response.error;
  } else {
    // Mark transaction notification as read
    const response = await supabase
      .from('transaksi_notifikasi')
      .update({ is_read: true })
      .eq('id', id);
    error = response.error;
  }

  if (error) {
    console.error(`Error marking ${type} notification as read:`, error);
    return false;
  }

  return true;
}

export async function markAllNotificationsAsRead(anggotaId?: string): Promise<boolean> {
  let hasError = false;
  
  // Mark all global notifications as read
  const globalQuery = supabase
    .from('global_notifikasi_read')
    .update({ is_read: true })
    .eq('is_read', false);
    
  // If anggota_id is provided, only mark notifications for that member
  if (anggotaId) {
    globalQuery.eq('anggota_id', anggotaId);
  }
  
  const { error: globalError } = await globalQuery;
  
  if (globalError) {
    console.error('Error marking all global notifications as read:', globalError);
    hasError = true;
  }
  
  // Mark all transaction notifications as read
  const transactionQuery = supabase
    .from('transaksi_notifikasi')
    .update({ is_read: true })
    .eq('is_read', false);
  
  // If anggota_id is provided, only mark notifications for transactions of that member
  if (anggotaId) {
    // We need to join with transaksi to filter by anggota_id
    // This is a limitation of Supabase, so we'll need to fetch the IDs first
    
    // First get all transaction IDs for the member
    const { data: memberTransactions } = await supabase
      .from('transaksi')
      .select('id')
      .eq('anggota_id', anggotaId);
      
    if (!memberTransactions || memberTransactions.length === 0) {
      return !hasError; // No transactions to process
    }
    
    const transactionIds = memberTransactions.map(t => t.id);
    
    // Then get notification IDs for those transactions
    const { data: notificationIds } = await supabase
      .from('transaksi_notifikasi')
      .select('id')
      .eq('is_read', false)
      .in('transaksi_id', transactionIds);
      
    if (notificationIds && notificationIds.length > 0) {
      const ids = notificationIds.map(item => item.id);
      const { error: transactionError } = await supabase
        .from('transaksi_notifikasi')
        .update({ is_read: true })
        .in('id', ids);
        
      if (transactionError) {
        console.error('Error marking transaction notifications as read:', transactionError);
        hasError = true;
      }
    }
  } else {
    // Mark all transaction notifications as read
    const { error: transactionError } = await transactionQuery;
    
    if (transactionError) {
      console.error('Error marking all transaction notifications as read:', transactionError);
      hasError = true;
    }
  }

  return !hasError;
}

// Jenis Tabungan functions
export type JenisTabungan = {
  id: string;
  kode: string;
  nama: string;
  deskripsi: string;
}

export async function getAllJenisTabungan(): Promise<JenisTabungan[]> {
  try {
    // First try using the RPC function
    const { data, error } = await supabase
      .rpc('get_all_jenis_tabungan');
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error fetching jenis tabungan with RPC:', error);
    
    // Fallback to direct query if RPC fails
    try {
      const { data, error: fallbackError } = await supabase
        .from('jenis_tabungan')
        .select('*')
        .eq('is_active', true)
        .order('kode', { ascending: true });
      
      if (fallbackError) {
        console.error('Fallback query also failed:', fallbackError);
        return [];
      }
      
      // Map the results to include any missing fields with default values
      const mappedData = (data || []).map((item: any) => ({
        ...item,
        biaya_admin: item.biaya_admin || 0,
        bagi_hasil: item.bagi_hasil || 0,
        is_required: item.is_required || false,
        is_reguler: item.is_reguler || false,
        display_order: item.display_order || 0
      }));
      
      return mappedData;
    } catch (fallbackError) {
      console.error('Error in fallback query:', fallbackError);
      return [];
    }
  }
}
