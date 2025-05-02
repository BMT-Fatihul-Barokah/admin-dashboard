import * as XLSX from 'xlsx';
import { supabase } from './supabase';
import { PostgrestResponse } from '@supabase/supabase-js';

// Flag to track if import_history table exists
let importHistoryTableExists = false;

// Create import_history table if it doesn't exist
async function ensureImportHistoryTable(): Promise<boolean> {
  if (importHistoryTableExists) {
    return true;
  }
  
  try {
    // Check if table exists by querying it
    const { data, error } = await supabase
      .from('import_history')
      .select('id')
      .limit(1);
    
    if (!error) {
      importHistoryTableExists = true;
      return true;
    }
    
    // Table doesn't exist or other error, we'll skip recording history
    console.log('Import history table not available:', error.message);
    return false;
  } catch (err) {
    console.error('Error checking import_history table:', err);
    return false;
  }
}

// Define types for the Excel data
export type AnggotaExcelRow = {
  'NO.': number;
  'Nama Anggota': string;
  'No. Rekening': string;
  'Saldo': number;
  'Alamat': string;
  'Kota': string;
  'Tempat Lahir': string;
  'Tanggal Lahir': number; // Excel date (need to convert)
  'Pekerjaan': string;
  'Jenis Identitas': string;
  'Nomor Identitas': number | string;
};

// Function to convert Excel date to JavaScript Date
export function excelDateToJSDate(excelDate: number): Date {
  // Excel dates are number of days since 1900-01-01
  // JavaScript dates are milliseconds since 1970-01-01
  // Need to account for Excel's leap year bug (1900 is not a leap year)
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  const excelEpoch = new Date(1900, 0, 1); // Excel epoch (1900-01-01)
  
  // Adjust for Excel's leap year bug (Excel thinks 1900 was a leap year)
  const daysSince1900 = excelDate <= 60 ? excelDate - 1 : excelDate - 2;
  const timeInMilliseconds = daysSince1900 * millisecondsPerDay;
  const resultDate = new Date(excelEpoch.getTime() + timeInMilliseconds);
  
  return resultDate;
}

// Format date to ISO string (YYYY-MM-DD)
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Process Excel file and return parsed data
export async function parseExcelFile(file: File): Promise<AnggotaExcelRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get the first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json<AnggotaExcelRow>(worksheet);
        resolve(jsonData);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = (error) => {
      reject(error);
    };
    
    reader.readAsArrayBuffer(file);
  });
}

// Import anggota data to Supabase
export async function importAnggotaData(
  data: AnggotaExcelRow[],
  onProgress?: (progress: number) => void
): Promise<{
  success: boolean;
  message: string;
  processed: number;
  created: number;
  updated: number;
  errors: any[];
}> {
  const result = {
    success: false,
    message: '',
    processed: 0,
    created: 0,
    updated: 0,
    errors: [] as any[]
  };
  
  try {
    // First check if the update_anggota_balance RPC function exists
    let rpcExists = false;
    try {
      const testRpc = await supabase.rpc('update_anggota_balance', {
        p_nomor_rekening: 'test',
        p_saldo: 0
      });
      // Check if the RPC function exists based on the error message
      if (testRpc.error) {
        const errorMsg = testRpc.error.message || '';
        rpcExists = !errorMsg.includes('Could not find');
      } else {
        rpcExists = true;
      }
      console.log('RPC function exists:', rpcExists);
    } catch (e) {
      console.log('RPC function check failed, assuming it does not exist');
      rpcExists = false;
    }
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      let response: PostgrestResponse<any>;
      
      try {
        // Check if anggota already exists by nomor_rekening
        const { data: existingAnggota, error: fetchError } = await supabase
          .from('anggota')
          .select('id, nomor_rekening, saldo')
          .eq('nomor_rekening', row['No. Rekening'])
          .maybeSingle();
        
        if (fetchError) throw fetchError;
        
        // Prepare anggota data
        const anggotaData = {
          nomor_rekening: row['No. Rekening'],
          nama: row['Nama Anggota'],
          saldo: Number(row['Saldo']), // Convert to number
          alamat: row['Alamat'],
          kota: row['Kota'],
          tempat_lahir: row['Tempat Lahir'],
          tanggal_lahir: formatDate(excelDateToJSDate(row['Tanggal Lahir'])),
          pekerjaan: row['Pekerjaan'],
          jenis_identitas: row['Jenis Identitas'],
          nomor_identitas: String(row['Nomor Identitas']),
          is_active: true,
          updated_at: new Date().toISOString()
        };
        
        if (existingAnggota) {
          // Update existing anggota
          console.log(`Updating account ${row['No. Rekening']} with new balance: ${row['Saldo']}`);
          console.log('Current balance in database:', existingAnggota.saldo);
          
          let updateSuccess = false;
          
          // If RPC exists, use it as the primary method (most reliable)
          if (rpcExists) {
            console.log('Using RPC function to update balance');
            const rpcResponse = await supabase.rpc('update_anggota_balance', {
              p_nomor_rekening: row['No. Rekening'],
              p_saldo: Number(row['Saldo'])
            });
            
            console.log('RPC update response:', rpcResponse);
            if (!rpcResponse.error) {
              updateSuccess = true;
            }
          }
          
          // If RPC failed or doesn't exist, try standard update methods
          if (!updateSuccess) {
            // Approach 1: Standard update by nomor_rekening
            console.log('Trying standard update by nomor_rekening');
            response = await supabase
              .from('anggota')
              .update({
                ...anggotaData,
                saldo: Number(row['Saldo'])
              })
              .eq('nomor_rekening', row['No. Rekening']);
            
            console.log('Update response:', response);
            
            if (!response.error) {
              updateSuccess = true;
            } else {
              // Approach 2: Update by ID
              console.log('Trying update by ID');
              response = await supabase
                .from('anggota')
                .update({
                  ...anggotaData,
                  saldo: Number(row['Saldo'])
                })
                .eq('id', existingAnggota.id);
              
              console.log('Update by ID response:', response);
              
              if (!response.error) {
                updateSuccess = true;
              } else {
                // Approach 3: Upsert
                console.log('Trying upsert');
                response = await supabase
                  .from('anggota')
                  .upsert({
                    id: existingAnggota.id,
                    ...anggotaData,
                    saldo: Number(row['Saldo'])
                  });
                
                console.log('Upsert response:', response);
                
                if (!response.error) {
                  updateSuccess = true;
                }
              }
            }
          }
          
          // Verify the update was successful
          const { data: verifyData, error: verifyError } = await supabase
            .from('anggota')
            .select('*')
            .eq('nomor_rekening', row['No. Rekening'])
            .single();
          
          if (verifyError) {
            console.error('Error verifying update:', verifyError);
          } else {
            console.log('Updated data in database:', verifyData);
            
            // Check if the balance was actually updated
            if (verifyData.saldo === Number(row['Saldo'])) {
              console.log('✅ Balance successfully updated!');
              updateSuccess = true;
            } else {
              console.log('❌ Balance not updated correctly. Expected:', Number(row['Saldo']), 'Actual:', verifyData.saldo);
              console.log('The update appeared to succeed but the balance was not updated. This is likely due to RLS policies.');
            }
          }
          
          // Count as updated if any of the approaches succeeded
          if (updateSuccess) {
            result.updated++;
          } else {
            throw new Error(`Failed to update account ${row['No. Rekening']} after multiple attempts`);
          }
        } else {
          // Create new anggota
          response = await supabase
            .from('anggota')
            .insert({
              ...anggotaData,
              created_at: new Date().toISOString()
            });
          
          if (response.error) throw response.error;
          result.created++;
        }
      } catch (error) {
        result.errors.push({
          row: result.processed,
          data: row,
          error
        });
      }
    }
    
    result.success = true;
    result.message = `Successfully processed ${result.processed} records. Created: ${result.created}, Updated: ${result.updated}, Errors: ${result.errors.length}`;
    
  } catch (error) {
    result.success = false;
    result.message = `Failed to import data: ${error.message}`;
  }
  
  return result;
}

// Function to check if the database has the necessary tables
export async function checkDatabaseStructure(): Promise<boolean> {
  try {
    // Check if anggota table exists
    const { data, error } = await supabase
      .from('anggota')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('Error checking database structure:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error checking database structure:', error);
    return false;
  }
}

// Function to get import history
export async function getImportHistory(): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('import_history')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching import history:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching import history:', error);
    return [];
  }
}

// Function to record import history
export async function recordImportHistory(
  type: string,
  count: number,
  status: 'Berhasil' | 'Gagal',
  details: string
): Promise<void> {
  try {
    // Check if import_history table exists
    const tableExists = await ensureImportHistoryTable();
    if (!tableExists) {
      console.log('Skipping import history recording as table does not exist');
      return;
    }
    
    // Record the import history
    const { error } = await supabase
      .from('import_history')
      .insert({
        type,
        count,
        status,
        details,
        created_at: new Date().toISOString(),
        user: 'Admin' // In a real app, this would be the current user
      });
    
    if (error) {
      const errorMessage = typeof error === 'object' && error !== null && 'message' in error
        ? (error.message as string)
        : 'Unknown error';
      console.log('Error recording import history (non-critical):', errorMessage);
    } else {
      console.log('Import history recorded successfully');
    }
  } catch (error: any) {
    console.log('Error in recordImportHistory (non-critical):', error?.message || error);
  }
}
