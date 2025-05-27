import { supabase } from './supabase';

export type Loan = {
  id: string;
  anggota_id: string;
  jenis_pinjaman: string;
  jumlah: number;
  alasan: string;
  status: string;
  created_at: string;
  updated_at: string;
  anggota?: {
    nama: string;
    nomor_rekening: string;
  };
}

/**
 * Get all active loans
 */
export async function getActiveLoans(): Promise<Loan[]> {
  try {
    const { data, error } = await supabase
      .from('pinjaman')
      .select(`
        *,
        anggota:anggota_id(nama, nomor_rekening)
      `)
      .eq('status', 'aktif')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching active loans:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Exception in getActiveLoans:', error);
    return [];
  }
}

/**
 * Get all completed loans
 */
export async function getCompletedLoans(): Promise<Loan[]> {
  try {
    const { data, error } = await supabase
      .from('pinjaman')
      .select(`
        *,
        anggota:anggota_id(nama, nomor_rekening)
      `)
      .eq('status', 'lunas')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching completed loans:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Exception in getCompletedLoans:', error);
    return [];
  }
}

/**
 * Get all loans
 */
export async function getAllLoans(): Promise<Loan[]> {
  try {
    const { data, error } = await supabase
      .from('pinjaman')
      .select(`
        *,
        anggota:anggota_id(nama, nomor_rekening)
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching all loans:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Exception in getAllLoans:', error);
    return [];
  }
}

/**
 * Mark a loan as completed (paid in full)
 */
export async function completeLoan(id: string): Promise<boolean> {
  try {
    const now = new Date().toISOString();
    
    // Update loan status to 'lunas'
    const { error } = await supabase
      .from('pinjaman')
      .update({ 
        status: 'lunas',
        sisa_pembayaran: 0,
        updated_at: now
      })
      .eq('id', id);
    
    if (error) {
      console.error('Error completing loan:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Exception in completeLoan:', error);
    return false;
  }
}

/**
 * Update loan payment amount
 */
export async function updateLoanPayment(id: string, paymentAmount: number): Promise<boolean> {
  try {
    const now = new Date().toISOString();
    
    // First get the current loan details
    const { data: loanData, error: fetchError } = await supabase
      .from('pinjaman')
      .select('sisa_pembayaran')
      .eq('id', id)
      .single();
    
    if (fetchError || !loanData) {
      console.error('Error fetching loan details:', fetchError);
      return false;
    }
    
    const currentAmount = loanData.sisa_pembayaran;
    const newAmount = Math.max(0, currentAmount - paymentAmount);
    const newStatus = newAmount <= 0 ? 'lunas' : 'aktif';
    
    // Update loan with new payment amount
    const { error } = await supabase
      .from('pinjaman')
      .update({ 
        sisa_pembayaran: newAmount,
        status: newStatus,
        updated_at: now
      })
      .eq('id', id);
    
    if (error) {
      console.error('Error updating loan payment:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Exception in updateLoanPayment:', error);
    return false;
  }
}

/**
 * Update loan details
 */
export async function updateLoan(id: string, updates: { jumlah?: number, jatuh_tempo?: string }): Promise<boolean> {
  try {
    const now = new Date().toISOString();
    
    // Prepare update data
    const updateData: any = {
      updated_at: now
    };
    
    if (updates.jumlah !== undefined) {
      updateData.jumlah = updates.jumlah;
      updateData.total_pembayaran = updates.jumlah;
      updateData.sisa_pembayaran = updates.jumlah;
    }
    
    if (updates.jatuh_tempo) {
      updateData.jatuh_tempo = updates.jatuh_tempo;
    }
    
    // Update loan with new details
    const { error } = await supabase
      .from('pinjaman')
      .update(updateData)
      .eq('id', id);
    
    if (error) {
      console.error('Error updating loan details:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Exception in updateLoan:', error);
    return false;
  }
}
