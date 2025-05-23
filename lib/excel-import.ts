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

// Define type for transaction Excel data
export type TransaksiExcelRow = {
  'Nama Anggota': string;
  'Jenis Transaksi': string; // masuk or keluar
  'Kategori': string; // setoran, penarikan, etc.
  'Jumlah': string | number; // Amount (might be formatted as currency)
  'Tanggal': string | number; // Might be Excel date or formatted date string
  'Deskripsi'?: string; // Optional description
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

// Process Excel file and return parsed data for anggota
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

// Process Excel file and return parsed data for transactions
export async function parseTransactionExcelFile(file: File): Promise<TransaksiExcelRow[]> {
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
        const jsonData = XLSX.utils.sheet_to_json<TransaksiExcelRow>(worksheet);
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
            const updateResponse = await supabase
              .from('anggota')
              .update({
                ...anggotaData,
                saldo: Number(row['Saldo'])
              })
              .eq('nomor_rekening', row['No. Rekening']);
            
            console.log('Update response:', updateResponse);
            
            if (!updateResponse.error) {
              updateSuccess = true;
            } else {
              // Approach 2: Update by ID
              console.log('Trying update by ID');
              const updateByIdResponse = await supabase
                .from('anggota')
                .update({
                  ...anggotaData,
                  saldo: Number(row['Saldo'])
                })
                .eq('id', existingAnggota.id);
              
              console.log('Update by ID response:', updateByIdResponse);
              
              if (!updateByIdResponse.error) {
                updateSuccess = true;
              } else {
                // Approach 3: Upsert
                console.log('Trying upsert');
                const upsertResponse = await supabase
                  .from('anggota')
                  .upsert({
                    id: existingAnggota.id,
                    ...anggotaData,
                    saldo: Number(row['Saldo'])
                  });
                
                console.log('Upsert response:', upsertResponse);
                
                if (!upsertResponse.error) {
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
          const insertResponse = await supabase
            .from('anggota')
            .insert({
              ...anggotaData,
              created_at: new Date().toISOString()
            });
          
          if (insertResponse.error) throw insertResponse.error;
          result.created++;
        }
      } catch (error: any) {
        result.errors.push({
          row: result.processed,
          data: row,
          error: error.message || 'Unknown error'
        });
      }
    }
    
    result.success = true;
    result.message = `Successfully processed ${result.processed} records. Created: ${result.created}, Updated: ${result.updated}, Errors: ${result.errors.length}`;
    
  } catch (error: any) {
    result.success = false;
    result.message = `Failed to import data: ${error.message || 'Unknown error'}`;
  }
  
  return result;
}

// Import transaction data to Supabase
export async function importTransactionData(
  data: TransaksiExcelRow[],
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
    // Get today's date range for checking duplicates
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    console.log(`Processing ${data.length} transactions for date: ${startOfDay.toISOString().split('T')[0]}`);

    // Check for existing transactions today to avoid duplicates
    const { data: existingTransactions, error: fetchError } = await supabase
      .from('transaksi')
      .select('reference_number, anggota_id, tipe_transaksi, kategori, jumlah, created_at')
      .gte('created_at', startOfDay.toISOString())
      .lte('created_at', endOfDay.toISOString());

    if (fetchError) {
      console.error('Error fetching existing transactions:', fetchError);
      result.message = `Error fetching existing transactions: ${fetchError.message}`;
      return result;
    }

    console.log(`Found ${existingTransactions?.length || 0} existing transactions for today`);

    // Process each row
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      result.processed++;

      try {
        console.log(`Processing row ${i + 1}/${data.length}:`, row);

        // Parse amount - handle currency format (e.g., "Rp 1.500.000")
        let amount = 0;
        if (typeof row['Jumlah'] === 'number') {
          amount = row['Jumlah'];
        } else if (typeof row['Jumlah'] === 'string') {
          // Remove currency symbol and dots, replace comma with dot
          const amountStr = String(row['Jumlah'])
            .replace(/[^\d,.-]/g, '') // Remove all non-numeric characters except comma, dot, and minus
            .replace(/\./g, '')       // Remove dots (thousand separators in ID locale)
            .replace(/,/g, '.');      // Replace comma with dot for decimal

          amount = parseFloat(amountStr);
          if (isNaN(amount)) {
            throw new Error(`Invalid amount format: ${row['Jumlah']}`);
          }
        }

        console.log(`Parsed amount: ${amount}`);

        if (amount <= 0) {
          throw new Error(`Amount must be greater than zero: ${amount}`);
        }

        // Parse transaction date from the Excel file
        let transactionDate: Date;
        
        if (row['Tanggal']) {
          console.log(`Processing date from Excel: ${row['Tanggal']}`);
          
          if (typeof row['Tanggal'] === 'number') {
            // Excel date format (serial number)
            transactionDate = excelDateToJSDate(row['Tanggal']);
            console.log(`Parsed Excel serial date: ${transactionDate.toISOString()}`);
          } else if (typeof row['Tanggal'] === 'string') {
            // Try to parse Indonesian date format (e.g., "24 Mei 2025")
            const dateParts = row['Tanggal'].split(' ');
            if (dateParts.length === 3) {
              const day = parseInt(dateParts[0]);
              const monthMap: {[key: string]: number} = {
                'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'mei': 4, 'jun': 5,
                'jul': 6, 'agt': 7, 'agu': 7, 'aug': 7, 'sep': 8, 'okt': 9, 'oct': 9, 'nov': 10, 'des': 11, 'dec': 11
              };
              const monthKey = dateParts[1].toLowerCase().substring(0, 3);
              const month = monthMap[monthKey];
              const year = parseInt(dateParts[2]);
              
              console.log(`Parsing date parts: day=${day}, month=${monthKey}(${month}), year=${year}`);
              
              if (!isNaN(day) && month !== undefined && !isNaN(year)) {
                transactionDate = new Date(year, month, day, 12, 0, 0);
                console.log(`Parsed Indonesian date format: ${transactionDate.toISOString()}`);
              } else {
                console.error(`Invalid date parts: day=${day}, month=${month}, year=${year}`);
                throw new Error(`Invalid date format: ${row['Tanggal']}`);
              }
            } else {
              // Try standard date parsing
              transactionDate = new Date(row['Tanggal']);
              if (isNaN(transactionDate.getTime())) {
                console.error(`Failed to parse date: ${row['Tanggal']}`);
                throw new Error(`Invalid date format: ${row['Tanggal']}`);
              }
              console.log(`Parsed standard date format: ${transactionDate.toISOString()}`);
            }
          } else {
            // Default to today if date type is unexpected
            console.log(`Unexpected date type: ${typeof row['Tanggal']}, using today's date`);
            transactionDate = new Date();
            transactionDate.setHours(12, 0, 0, 0);
          }
        } else {
          // No date provided, use today
          console.log('No date provided in Excel, using today\'s date');
          transactionDate = new Date();
          transactionDate.setHours(12, 0, 0, 0);
        }

        // Find anggota by name - use exact match first, then try partial match if not found
        console.log(`Looking for member: "${row['Nama Anggota']}"`);  

        // Try exact match first
        let { data: anggotaData, error: anggotaError } = await supabase
          .from('anggota')
          .select('id, nomor_rekening, nama')
          .eq('nama', row['Nama Anggota'])
          .limit(1)
          .single();

        // If exact match fails, try case-insensitive partial match
        if (anggotaError || !anggotaData) {
          console.log(`No exact match found for "${row['Nama Anggota']}", trying partial match...`);
          const { data: partialMatchData, error: partialMatchError } = await supabase
            .from('anggota')
            .select('id, nomor_rekening, nama')
            .ilike('nama', `%${row['Nama Anggota']}%`)
            .limit(1)
            .single();
            
          if (partialMatchError || !partialMatchData) {
            console.error(`No member found for "${row['Nama Anggota']}", error:`, partialMatchError);
            throw new Error(`Anggota not found: ${row['Nama Anggota']}`);
          }
          
          anggotaData = partialMatchData;
          console.log(`Found member via partial match: ${anggotaData.nama} (ID: ${anggotaData.id})`);
        } else {
          console.log(`Found member via exact match: ${anggotaData.nama} (ID: ${anggotaData.id})`);
        }

        // Find the tabungan (savings account) for this anggota
        console.log(`Looking for savings account for member ID: ${anggotaData.id}`);

        // Try to get the default tabungan first
        const { data: defaultTabungan, error: defaultTabunganError } = await supabase
          .from('tabungan')
          .select('id, saldo, is_default')
          .eq('anggota_id', anggotaData.id)
          .eq('is_default', true)
          .limit(1)
          .single();

        // If no default tabungan found, try to get any tabungan
        let tabunganData: { id: any, saldo: any };

        if (defaultTabunganError || !defaultTabungan) {
          console.log(`No default savings account found, trying to find any savings account...`);
          const { data: anyTabungan, error: anyTabunganError } = await supabase
            .from('tabungan')
            .select('id, saldo')
            .eq('anggota_id', anggotaData.id)
            .limit(1)
            .single();
            
          if (anyTabunganError || !anyTabungan) {
            console.error(`No savings account found for member: ${anggotaData.nama}, error:`, anyTabunganError);
            throw new Error(`No savings account found for member: ${row['Nama Anggota']}`);
          }
          
          tabunganData = anyTabungan;
          console.log(`Found non-default savings account: ${tabunganData.id} with balance ${tabunganData.saldo}`);
        } else {
          tabunganData = defaultTabungan;
          console.log(`Found default savings account: ${tabunganData.id} with balance ${tabunganData.saldo}`);
        }

        // Normalize transaction type and category
        const tipeTransaksi = row['Jenis Transaksi'].toLowerCase() === 'keluar' ? 'keluar' : 'masuk';
        let kategori = row['Kategori'].toLowerCase();

        // Map common categories
        const kategoriMap: {[key: string]: string} = {
          'setoran': 'setoran',
          'penarikan': 'penarikan',
          'bunga': 'bunga',
          'biaya admin': 'biaya_admin',
          'biaya_admin': 'biaya_admin',
          'angsuran': 'pembayaran_pinjaman',
          'pembayaran pinjaman': 'pembayaran_pinjaman',
          'pembayaran_pinjaman': 'pembayaran_pinjaman',
          'pinjaman': 'pencairan_pinjaman',
          'pencairan pinjaman': 'pencairan_pinjaman',
          'pencairan_pinjaman': 'pencairan_pinjaman'
        };

        kategori = kategoriMap[kategori] || 'lainnya';

        // Check for potential duplicates
        const isDuplicate = existingTransactions?.some(t => {
          // Check if there's already a transaction with same member, type, category, and amount today
          return t.anggota_id === anggotaData.id &&
                 t.tipe_transaksi === tipeTransaksi &&
                 t.kategori === kategori &&
                 Math.abs(Number(t.jumlah) - amount) < 0.01; // Allow for small floating point differences
        });

        if (isDuplicate) {
          console.log(`Potential duplicate transaction detected for ${row['Nama Anggota']}, ${tipeTransaksi}, ${kategori}, ${amount}`);
          // We'll still add it, but log the warning
        }

        // Generate reference number
        const dateStr = transactionDate.toISOString().split('T')[0].replace(/-/g, '');
        const randomStr = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        const referenceNumber = `TRX-${dateStr}-${randomStr}`;

        // Calculate new balance
        let newBalance = Number(tabunganData.saldo);
        if (tipeTransaksi === 'masuk') {
          newBalance += amount;
        } else {
          newBalance -= amount;
        }

        // Prepare transaction data
        const transactionData = {
          anggota_id: anggotaData.id,
          tabungan_id: tabunganData.id,
          reference_number: referenceNumber,
          tipe_transaksi: tipeTransaksi,
          kategori: kategori,
          jumlah: amount,
          deskripsi: row['Deskripsi'] || `${tipeTransaksi.charAt(0).toUpperCase() + tipeTransaksi.slice(1)} ${kategori}`,
          saldo_sebelum: tabunganData.saldo,
          saldo_sesudah: newBalance,
          created_at: transactionDate.toISOString(),
          updated_at: new Date().toISOString()
        };

        console.log('Attempting to insert transaction with data:', transactionData);

        // Insert transaction
        const { data: insertedTransaction, error: transactionError } = await supabase
          .from('transaksi')
          .insert(transactionData)
          .select();

        if (transactionError) {
          console.error('Transaction insert error:', transactionError);
          throw new Error(`Failed to insert transaction: ${transactionError.message || 'Unknown error'}`);
        }

        console.log('Transaction inserted successfully:', insertedTransaction);

        // Update tabungan balance
        console.log(`Updating tabungan ${tabunganData.id} balance from ${tabunganData.saldo} to ${newBalance}`);

        const { error: updateError } = await supabase
          .from('tabungan')
          .update({ 
            saldo: newBalance,
            last_transaction_date: new Date().toISOString()
          })
          .eq('id', tabunganData.id);

        if (updateError) {
          console.error('Error updating tabungan balance:', updateError);
          throw new Error(`Failed to update balance: ${updateError.message || 'Unknown error'}`);
        }

        console.log('Balance updated successfully');
        result.created++;

        // Report progress
        if (onProgress) {
          onProgress(Math.floor((i + 1) / data.length * 100));
        }
      } catch (error: any) {
        console.error(`Error processing transaction for ${row['Nama Anggota']}:`, error);
        
        // Get detailed error message
        let errorMessage = 'Unknown error';
        if (error.message) {
          errorMessage = error.message;
        } else if (error.code) {
          errorMessage = `Database error code: ${error.code}`;
        } else if (typeof error === 'string') {
          errorMessage = error;
        }
        
        result.errors.push({
          row: result.processed,
          data: row,
          error: errorMessage
        });
      }
    }
    
    result.success = result.created > 0;
    result.message = `Successfully processed ${result.processed} transactions for today. Created: ${result.created}, Errors: ${result.errors.length}`;
    
  } catch (error: any) {
    console.error('Error in importTransactionData:', error);
    result.success = false;
    result.message = `Failed to import transactions: ${error.message || 'Unknown error'}`;
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
    // First check if the import_history table exists
    const tableExists = await ensureImportHistoryTable();
    if (!tableExists) {
      console.log('Import history table does not exist yet, returning empty array');
      return [];
    }
    
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

// Test function to directly insert a transaction
export async function testInsertTransaction(): Promise<any> {
  try {
    // First, get a valid anggota
    const { data: anggotaData, error: anggotaError } = await supabase
      .from('anggota')
      .select('id, nomor_rekening, nama')
      .limit(1)
      .single();
    
    if (anggotaError || !anggotaData) {
      console.error('Error fetching anggota:', anggotaError);
      return { success: false, message: 'Failed to find a valid anggota' };
    }
    
    // Get the tabungan for this anggota
    const { data: tabunganData, error: tabunganError } = await supabase
      .from('tabungan')
      .select('id, saldo')
      .eq('anggota_id', anggotaData.id)
      .limit(1)
      .single();
    
    if (tabunganError || !tabunganData) {
      console.error('Error fetching tabungan:', tabunganError);
      return { success: false, message: 'Failed to find a valid tabungan' };
    }
    
    // Create a test transaction
    const amount = 10000; // 10,000 currency units
    const currentBalance = Number(tabunganData.saldo);
    const newBalance = currentBalance + amount;
    const transactionDate = new Date();
    const dateStr = transactionDate.toISOString().split('T')[0].replace(/-/g, '');
    const randomStr = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const referenceNumber = `TRX-${dateStr}-${randomStr}`;
    
    console.log('Attempting to insert test transaction:', {
      anggota_id: anggotaData.id,
      tabungan_id: tabunganData.id,
      reference_number: referenceNumber,
      tipe_transaksi: 'masuk',
      kategori: 'setoran',
      jumlah: amount,
      saldo_sebelum: currentBalance,
      saldo_sesudah: newBalance,
      created_at: transactionDate.toISOString()
    });
    
    // Insert the transaction
    const { data: transaction, error: transactionError } = await supabase
      .from('transaksi')
      .insert({
        anggota_id: anggotaData.id,
        tabungan_id: tabunganData.id,
        reference_number: referenceNumber,
        tipe_transaksi: 'masuk',
        kategori: 'setoran',
        jumlah: amount,
        deskripsi: 'Test transaction',
        saldo_sebelum: currentBalance,
        saldo_sesudah: newBalance,
        created_at: transactionDate.toISOString(),
        updated_at: transactionDate.toISOString()
      })
      .select();
    
    if (transactionError) {
      console.error('Error inserting transaction:', transactionError);
      return { success: false, message: `Failed to insert transaction: ${transactionError.message}` };
    }
    
    // Update the tabungan balance
    const { error: updateError } = await supabase
      .from('tabungan')
      .update({ 
        saldo: newBalance,
        last_transaction_date: transactionDate.toISOString()
      })
      .eq('id', tabunganData.id);
    
    if (updateError) {
      console.error('Error updating tabungan balance:', updateError);
      return { success: false, message: `Transaction inserted but failed to update balance: ${updateError.message}` };
    }
    
    return { success: true, message: 'Test transaction inserted successfully', transaction };
  } catch (error: any) {
    console.error('Error in testInsertTransaction:', error);
    return { success: false, message: `Error: ${error.message || 'Unknown error'}` };
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
