import { supabase } from './supabase';

export type PembayaranPinjaman = {
  id: string;
  pinjaman_id: string;
  transaksi_id?: string;
  jumlah: number;
  tanggal_pembayaran: Date;
  bulan_ke: number;
  catatan?: string;
  created_at: Date;
  updated_at: Date;
}

export type PembayaranPinjamanInput = {
  pinjaman_id: string;
  jumlah: number;
  bulan_ke: number;
  catatan?: string;
}

/**
 * Get payment history for a specific loan
 */
export async function getPembayaranByPinjamanId(pinjamanId: string): Promise<PembayaranPinjaman[]> {
  try {
    const { data, error } = await supabase
      .from('pembayaran_pinjaman')
      .select('*')
      .eq('pinjaman_id', pinjamanId)
      .order('tanggal_pembayaran', { ascending: false });
    
    if (error) {
      console.error('Error fetching pembayaran pinjaman:', error);
      return [];
    }
    
    return data || [];
  } catch (e) {
    console.error('Exception in getPembayaranByPinjamanId:', e);
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
 * Record a loan payment with transaction
 */
export async function recordPembayaranPinjaman(
  pembayaranData: PembayaranPinjamanInput,
  anggotaId: string
): Promise<{ success: boolean; error?: any; data?: any }> {
  try {
    // Start a transaction
    const { data: pinjaman, error: pinjamanError } = await supabase
      .from('pinjaman')
      .select('*')
      .eq('id', pembayaranData.pinjaman_id)
      .single();
    
    if (pinjamanError || !pinjaman) {
      return {
        success: false,
        error: { message: 'Pinjaman tidak ditemukan: ' + (pinjamanError?.message || 'Unknown error') }
      };
    }
    
    // Calculate remaining balance after payment
    const sisaSebelum = pinjaman.sisa_pembayaran;
    const sisaSetelah = Math.max(sisaSebelum - pembayaranData.jumlah, 0);
    const status = sisaSetelah <= 0 ? 'lunas' : 'aktif';
    
    // Create a unique reference number with timestamp
    const timestamp = new Date().getTime();
    const uniqueRef = `LOAN-${pinjaman.id.substring(0, 8)}-${pembayaranData.bulan_ke}-${timestamp}`;
    
    // Create transaction record
    const { data: transaksi, error: transaksiError } = await supabase
      .from('transaksi')
      .insert({
        anggota_id: anggotaId,
        tipe_transaksi: 'masuk',
        kategori: 'pembayaran_pinjaman',
        deskripsi: `Pembayaran pinjaman bulan ke-${pembayaranData.bulan_ke}`,
        jumlah: pembayaranData.jumlah,
        saldo_sebelum: 0, // This will be calculated by a trigger
        saldo_sesudah: 0, // This will be calculated by a trigger
        pinjaman_id: pembayaranData.pinjaman_id,
        reference_number: uniqueRef
      })
      .select()
      .single();
    
    if (transaksiError) {
      return {
        success: false,
        error: { message: 'Gagal membuat transaksi: ' + (transaksiError.message || 'Unknown error') }
      };
    }
    
    // Create payment record
    const { data: pembayaran, error: pembayaranError } = await supabase
      .from('pembayaran_pinjaman')
      .insert({
        pinjaman_id: pembayaranData.pinjaman_id,
        transaksi_id: transaksi.id,
        jumlah: pembayaranData.jumlah,
        bulan_ke: pembayaranData.bulan_ke,
        catatan: pembayaranData.catatan || ''
      })
      .select()
      .single();
    
    if (pembayaranError) {
      return {
        success: false,
        error: { message: 'Gagal mencatat pembayaran: ' + (pembayaranError.message || 'Unknown error') }
      };
    }
    
    // Wait a moment to allow the database trigger to process
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Calculate total payments for this loan
    const { data: totalPayments } = await supabase
      .from('pembayaran_pinjaman')
      .select('jumlah')
      .eq('pinjaman_id', pembayaranData.pinjaman_id);
    
    const totalPaid = totalPayments ? totalPayments.reduce((sum, payment) => sum + Number(payment.jumlah), 0) : pembayaranData.jumlah;
    
    // Force update the loan balance directly
    const newBalance = Math.max(pinjaman.jumlah - totalPaid, 0);
    const newStatus = newBalance <= 0 ? 'lunas' : 'aktif';
    
    // Update the loan record with the new balance
    const { error: updateError } = await supabase
      .from('pinjaman')
      .update({
        sisa_pembayaran: newBalance,
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', pembayaranData.pinjaman_id);
    
    if (updateError) {
      console.error('Error updating loan balance:', updateError);
      
      // Try an alternative approach if the update failed
      await supabase.rpc('force_update_all_loan_balances');
    }
    
    // Get the updated loan data
    const { data: updatedLoan, error: refreshError } = await supabase
      .from('pinjaman')
      .select('*')
      .eq('id', pembayaranData.pinjaman_id)
      .single();
    
    if (refreshError || !updatedLoan) {
      console.error('Error refreshing loan data:', refreshError);
      // Return with the calculated values even if we couldn't refresh
      return { 
        success: true, 
        data: { 
          pembayaran,
          transaksi,
          pinjaman: {
            ...pinjaman,
            sisa_pembayaran: newBalance,
            status: newStatus,
            progress_percentage: Math.min(Math.floor((totalPaid / pinjaman.jumlah) * 100), 100)
          }
        } 
      };
    }
    
    return { 
      success: true, 
      data: { 
        pembayaran,
        transaksi,
        pinjaman: updatedLoan
      } 
    };
  } catch (e: any) {
    console.error('Exception in recordPembayaranPinjaman:', e);
    
    // Try to force update all loan balances as a last resort
    try {
      await supabase.rpc('force_update_all_loan_balances');
    } catch (rpcError) {
      console.error('Failed to force update loan balances:', rpcError);
    }
    
    return {
      success: false,
      error: { message: 'Terjadi kesalahan: ' + (e?.message || 'Unknown error') }
    };
  }
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
