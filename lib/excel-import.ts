import * as XLSX from 'xlsx';
import { supabase } from './supabase';

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
export async function importAnggotaData(data: AnggotaExcelRow[]): Promise<{
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
    // Process each row
    for (const row of data) {
      result.processed++;
      
      try {
        // Check if anggota with this nomor_rekening already exists
        const { data: existingAnggota, error: fetchError } = await supabase
          .from('anggota')
          .select('id, nomor_rekening')
          .eq('nomor_rekening', row['No. Rekening'])
          .maybeSingle();
        
        if (fetchError) throw fetchError;
        
        // Convert Excel date to JavaScript Date
        const tanggalLahir = excelDateToJSDate(row['Tanggal Lahir']);
        
        // Prepare anggota data
        const anggotaData = {
          nama: row['Nama Anggota'],
          nomor_rekening: row['No. Rekening'],
          saldo: row['Saldo'],
          alamat: row['Alamat'],
          kota: row['Kota'],
          tempat_lahir: row['Tempat Lahir'],
          tanggal_lahir: formatDate(tanggalLahir),
          pekerjaan: row['Pekerjaan'],
          jenis_identitas: row['Jenis Identitas'],
          nomor_identitas: String(row['Nomor Identitas']),
          is_active: true,
          updated_at: new Date().toISOString()
        };
        
        let response;
        
        if (existingAnggota) {
          // Update existing anggota
          response = await supabase
            .from('anggota')
            .update(anggotaData)
            .eq('id', existingAnggota.id);
          
          if (response.error) throw response.error;
          result.updated++;
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
      console.error('Error recording import history:', error);
    }
  } catch (error) {
    console.error('Error recording import history:', error);
  }
}
