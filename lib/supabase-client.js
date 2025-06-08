// This file uses the Supabase client from CDN to avoid dependency conflicts
// We'll load the client via script tag in the layout file

// Types are defined as JSDoc comments for better IDE support
/**
 * @typedef {Object} Anggota
 * @property {string} id
 * @property {string} nama
 * @property {string} nomor_rekening
 * @property {number} saldo
 * @property {string} [alamat]
 * @property {string} [kota]
 * @property {string} [tempat_lahir]
 * @property {Date} [tanggal_lahir]
 * @property {string} [pekerjaan]
 * @property {string} [jenis_identitas]
 * @property {string} [nomor_identitas]
 * @property {Date} created_at
 * @property {Date} updated_at
 * @property {Date} [closed_at]
 * @property {boolean} is_active
 */

/**
 * @typedef {Object} Transaksi
 * @property {string} id
 * @property {string} anggota_id
 * @property {string} tipe_transaksi
 * @property {string} source_type
 * @property {string} [deskripsi]
 * @property {number} jumlah
 * @property {number} saldo_sebelum
 * @property {number} saldo_sesudah
 * @property {string} [pinjaman_id]
 * @property {Date} created_at
 * @property {Date} updated_at
 */

/**
 * @typedef {Object} Pinjaman
 * @property {string} id
 * @property {string} anggota_id
 * @property {string} jenis_pinjaman
 * @property {string} status
 * @property {number} jumlah
 * @property {Date} jatuh_tempo
 * @property {number} bunga_persen
 * @property {number} total_pembayaran
 * @property {number} sisa_pembayaran
 * @property {Date} created_at
 * @property {Date} updated_at
 */

// Initialize Supabase client
let supabase = null;

export function initSupabase() {
  if (typeof window !== 'undefined') {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabase && window.supabase && supabaseUrl && supabaseAnonKey) {
      supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
    }
    
    return supabase;
  }
  return null;
}

/**
 * Get total number of active members
 * @returns {Promise<number>}
 */
export async function getTotalAnggota() {
  const client = initSupabase();
  if (!client) return 0;
  
  const { count, error } = await client
    .from('anggota')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);
  
  if (error) {
    console.error('Error fetching total anggota:', error);
    return 0;
  }
  
  return count || 0;
}

/**
 * Get total savings amount
 * @returns {Promise<number>}
 */
export async function getTotalSimpanan() {
  const client = initSupabase();
  if (!client) return 0;
  
  const { data, error } = await client
    .from('anggota')
    .select('saldo')
    .eq('is_active', true);
  
  if (error) {
    console.error('Error fetching total simpanan:', error);
    return 0;
  }
  
  return data.reduce((sum, anggota) => sum + parseFloat(anggota.saldo), 0);
}

/**
 * Get total active loans amount
 * @returns {Promise<number>}
 */
export async function getTotalPinjaman() {
  const client = initSupabase();
  if (!client) return 0;
  
  const { data, error } = await client
    .from('pinjaman')
    .select('sisa_pembayaran')
    .eq('status', 'aktif');
  
  if (error) {
    console.error('Error fetching total pinjaman:', error);
    return 0;
  }
  
  return data.reduce((sum, pinjaman) => sum + parseFloat(pinjaman.sisa_pembayaran), 0);
}

/**
 * Get total revenue (from loan interest)
 * @returns {Promise<number>}
 */
export async function getTotalPendapatan() {
  const client = initSupabase();
  if (!client) return 0;
  
  const { data, error } = await client
    .from('transaksi')
    .select('jumlah')
    .eq('source_type', 'pembiayaan')
    .eq('tipe_transaksi', 'kredit');
  
  if (error) {
    console.error('Error fetching total pendapatan:', error);
    return 0;
  }
  
  return data.reduce((sum, transaksi) => sum + parseFloat(transaksi.jumlah), 0);
}

/**
 * Get recent transactions
 * @param {number} limit - Number of transactions to fetch
 * @returns {Promise<Array>}
 */
export async function getRecentTransactions(limit = 5) {
  const client = initSupabase();
  if (!client) return [];
  
  const { data, error } = await client
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

/**
 * Get monthly financial data for charts
 * @returns {Promise<Array>}
 */
export async function getMonthlyFinancialData() {
  const client = initSupabase();
  if (!client) return [];
  
  const currentYear = new Date().getFullYear();
  
  // Get monthly savings (simpanan) data
  const { data: simpananData, error: simpananError } = await client
    .from('transaksi')
    .select('jumlah, created_at')
    .eq('source_type', 'tabungan')
    .gte('created_at', `${currentYear}-01-01`)
    .lte('created_at', `${currentYear}-12-31`);
  
  if (simpananError) {
    console.error('Error fetching simpanan data:', simpananError);
    return [];
  }
  
  // Get monthly loan (pinjaman) data
  const { data: pinjamanData, error: pinjamanError } = await client
    .from('transaksi')
    .select('jumlah, created_at')
    .eq('source_type', 'pembiayaan')
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

/**
 * Get new members count by month
 * @returns {Promise<Array>}
 */
export async function getNewMembersData() {
  const client = initSupabase();
  if (!client) return [];
  
  const currentYear = new Date().getFullYear();
  
  const { data, error } = await client
    .from('anggota')
    .select('created_at')
    .gte('created_at', `${currentYear}-01-01`)
    .lte('created_at', `${currentYear}-12-31`);
  
  if (error) {
    console.error('Error fetching new members data:', error);
    return [];
  }
  
  // Process data by month
  const monthlyData = Array(12).fill(0).map((_, index) => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
    
    // Count new members for this month
    const newMembers = data.filter(item => new Date(item.created_at).getMonth() === index).length;
    
    return {
      name: monthNames[index],
      anggota: newMembers
    };
  });
  
  return monthlyData;
}
