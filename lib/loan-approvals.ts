import { supabase } from './supabase';

export type LoanApplication = {
  id: string;
  anggota_id: string;
  jenis_pinjaman: string;
  jumlah: number;
  alasan: string;
  status: string;
  created_at: string;
  updated_at: string;
  alasan_penolakan?: string;
  anggota?: {
    nama: string;
    nomor_rekening: string;
  };
}

/**
 * Get all pending loan applications
 */
export async function getPendingLoanApplications(): Promise<LoanApplication[]> {
  try {
    const { data, error } = await supabase
      .from('pinjaman')
      .select(`
        *,
        anggota:anggota_id(nama, nomor_rekening)
      `)
      .eq('status', 'diajukan')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching pending loan applications:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Exception in getPendingLoanApplications:', error);
    return [];
  }
}

/**
 * Get all approved loan applications
 */
export async function getApprovedLoanApplications(): Promise<LoanApplication[]> {
  try {
    const { data, error } = await supabase
      .from('pinjaman')
      .select(`
        *,
        anggota:anggota_id(nama, nomor_rekening)
      `)
      .eq('status', 'disetujui')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching approved loan applications:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Exception in getApprovedLoanApplications:', error);
    return [];
  }
}

/**
 * Get all rejected loan applications
 */
export async function getRejectedLoanApplications(): Promise<LoanApplication[]> {
  try {
    const { data, error } = await supabase
      .from('pinjaman')
      .select(`
        *,
        anggota:anggota_id(nama, nomor_rekening)
      `)
      .eq('status', 'ditolak')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching rejected loan applications:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Exception in getRejectedLoanApplications:', error);
    return [];
  }
}

/**
 * Approve a loan application
 */
export async function approveLoanApplication(id: string): Promise<boolean> {
  try {
    const now = new Date().toISOString();
    
    // Update loan status to 'disetujui'
    const { error } = await supabase
      .from('pinjaman')
      .update({ 
        status: 'disetujui',
        updated_at: now
      })
      .eq('id', id);
    
    if (error) {
      console.error('Error approving loan application:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Exception in approveLoanApplication:', error);
    return false;
  }
}

/**
 * Reject a loan application
 */
export async function rejectLoanApplication(id: string, reason: string): Promise<boolean> {
  try {
    const now = new Date().toISOString();
    
    // Update loan status to 'ditolak'
    const { error } = await supabase
      .from('pinjaman')
      .update({ 
        status: 'ditolak',
        alasan_penolakan: reason,
        updated_at: now
      })
      .eq('id', id);
    
    if (error) {
      console.error('Error rejecting loan application:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Exception in rejectLoanApplication:', error);
    return false;
  }
}

/**
 * Activate an approved loan (change status to 'aktif')
 */
export async function activateLoan(id: string): Promise<boolean> {
  try {
    const now = new Date().toISOString();
    
    // Update loan status to 'aktif'
    const { error } = await supabase
      .from('pinjaman')
      .update({ 
        status: 'aktif',
        updated_at: now
      })
      .eq('id', id)
      .eq('status', 'disetujui'); // Only activate if currently 'disetujui'
    
    if (error) {
      console.error('Error activating loan:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Exception in activateLoan:', error);
    return false;
  }
}
