import { supabase } from './supabase';

export type PembayaranPembiayaan = {
  id: string;
  pembiayaan_id: string;
  transaksi_id?: string;
  jumlah: number;
  tanggal_pembayaran: Date;
  bulan_ke: number;
  catatan?: string;
  created_at: Date;
  updated_at: Date;
}

export type PembayaranPembiayaanInput = {
  pembiayaan_id: string;
  jumlah: number;
  bulan_ke: number;
  metode_pembayaran?: string;
  nomor_referensi?: string;
  catatan?: string;
}

// For backward compatibility
export type PembayaranPinjaman = PembayaranPembiayaan;
export type PembayaranPinjamanInput = Omit<PembayaranPembiayaanInput, 'pembiayaan_id'> & { pinjaman_id: string };

/**
 * Get payment history for a specific loan
 */
export async function getPembayaranByPinjamanId(pinjamanId: string): Promise<PembayaranPinjaman[]> {
  return getPembayaranByPembiayaanId(pinjamanId);
}

/**
 * Get payment history for a specific loan using the new schema
 */
export async function getPembayaranByPembiayaanId(pembiayaanId: string): Promise<PembayaranPembiayaan[]> {
  try {
    // First try the new table
    const { data, error } = await supabase
      .from('pembayaran_pembiayaan')
      .select('*')
      .eq('pembiayaan_id', pembiayaanId)
      .order('tanggal_pembayaran', { ascending: false });
    
    if (error) {
      console.error('Error fetching pembayaran pembiayaan:', error);
      
      // Fallback to old table if needed
      try {
        const { data: oldData, error: oldError } = await supabase
          .from('pembayaran_pinjaman')
          .select('*')
          .eq('pinjaman_id', pembiayaanId)
          .order('tanggal_pembayaran', { ascending: false });
        
        if (oldError) {
          console.error('Error fetching from old table:', oldError);
          return [];
        }
        
        // Map old data to new structure
        return (oldData || []).map(item => ({
          ...item,
          pembiayaan_id: item.pinjaman_id
        }));
      } catch (fallbackError) {
        console.error('Exception in fallback query:', fallbackError);
        return [];
      }
    }
    
    return data || [];
  } catch (e) {
    console.error('Exception in getPembayaranByPembiayaanId:', e);
    return [];
  }
}

/**
 * Calculate monthly installment amount for a loan
 */
export function calculateMonthlyInstallment(loanAmount: number, durationMonths: number): number {
  // Simple calculation - equal monthly payments
  return Math.ceil(loanAmount / durationMonths);
}

/**
 * Record a loan payment with transaction using the new RPC function
 */
export async function recordPembayaranPembiayaan(
  pembayaranData: PembayaranPembiayaanInput,
  anggotaId: string
): Promise<{ success: boolean; error?: any; data?: any }> {
  try {
    // Use the RPC function to record the payment
    const { data, error } = await supabase.rpc('record_pembayaran_pembiayaan', {
      p_pembiayaan_id: pembayaranData.pembiayaan_id,
      p_anggota_id: anggotaId,
      p_jumlah: pembayaranData.jumlah,
      p_bulan_ke: pembayaranData.bulan_ke,
      p_catatan: pembayaranData.catatan || null,
      p_metode_pembayaran: pembayaranData.metode_pembayaran || 'tunai',
      p_nomor_referensi: pembayaranData.nomor_referensi || null
    });
    
    if (error) {
      console.error('Error recording pembayaran pembiayaan:', error);
      return {
        success: false,
        error: { message: 'Gagal mencatat pembayaran: ' + (error.message || 'Unknown error') }
      };
    }
    
    if (!data) {
      return {
        success: false,
        error: { message: 'Tidak ada data yang dikembalikan dari RPC function' }
      };
    }
    
    // Type check the response
    const rpcResponse = data as { 
      success: boolean; 
      error?: string; 
      transaksi_id?: string; 
      pembayaran_id?: string;
      sisa_pembayaran?: number;
      status?: string;
    };
    
    if (!rpcResponse.success) {
      return {
        success: false,
        error: { message: rpcResponse.error || 'Gagal mencatat pembayaran' }
      };
    }
    
    return {
      success: true,
      data: {
        pembayaran_id: rpcResponse.pembayaran_id,
        transaksi_id: rpcResponse.transaksi_id,
        sisa_pembayaran: rpcResponse.sisa_pembayaran,
        status: rpcResponse.status
      }
    };
  } catch (e: any) {
    console.error('Exception in recordPembayaranPembiayaan:', e);
    return {
      success: false,
      error: { message: 'Terjadi kesalahan: ' + (e?.message || 'Unknown error') }
    };
  }
}

/**
 * Record a loan payment with transaction (backward compatibility)
 */
export async function recordPembayaranPinjaman(
  pembayaranData: PembayaranPinjamanInput,
  anggotaId: string
): Promise<{ success: boolean; error?: any; data?: any }> {
  // Map old format to new format
  const newData: PembayaranPembiayaanInput = {
    ...pembayaranData,
    pembiayaan_id: pembayaranData.pinjaman_id
  };
  
  // Use the new function
  return recordPembayaranPembiayaan(newData, anggotaId);
}

/**
 * Get payment schedule for a loan
 */
export function generatePaymentSchedule(
  loanAmount: number, 
  durationMonths: number, 
  startDate: Date
): Array<{ bulan_ke: number; tanggal_jatuh_tempo: Date; jumlah: number; status: string }> {
  const monthlyPayment = calculateMonthlyInstallment(loanAmount, durationMonths);
  const schedule = [];
  
  for (let i = 1; i <= durationMonths; i++) {
    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + i);
    
    schedule.push({
      bulan_ke: i,
      tanggal_jatuh_tempo: dueDate,
      jumlah: i === durationMonths ? loanAmount - (monthlyPayment * (durationMonths - 1)) : monthlyPayment,
      status: 'belum_bayar'
    });
  }
  
  return schedule;
}
