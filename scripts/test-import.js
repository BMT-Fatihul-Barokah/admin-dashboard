// Script to test Excel import functionality
const { createClient } = require('@supabase/supabase-js');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env file when running locally
require('dotenv').config();

// Supabase connection from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Check if environment variables are set
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Function to convert Excel date to JavaScript Date
function excelDateToJSDate(excelDate) {
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  const excelEpoch = new Date(1900, 0, 1);
  const daysSince1900 = excelDate <= 60 ? excelDate - 1 : excelDate - 2;
  const timeInMilliseconds = daysSince1900 * millisecondsPerDay;
  return new Date(excelEpoch.getTime() + timeInMilliseconds);
}

// Format date to ISO string (YYYY-MM-DD)
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

// Process Excel file
async function processExcelFile(filePath) {
  try {
    console.log(`Reading Excel file: ${filePath}`);
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`Found ${jsonData.length} records in the Excel file`);
    console.log('Sample data:', jsonData[0]);
    
    return jsonData;
  } catch (error) {
    console.error('Error processing Excel file:', error);
    throw error;
  }
}

// Import data to Supabase
async function importDataToSupabase(data) {
  console.log('Starting import to Supabase...');
  
  const result = {
    success: false,
    message: '',
    processed: 0,
    created: 0,
    updated: 0,
    errors: []
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
          console.log(`Updating existing anggota: ${row['Nama Anggota']} (${row['No. Rekening']})`);
          response = await supabase
            .from('anggota')
            .update(anggotaData)
            .eq('id', existingAnggota.id);
          
          if (response.error) throw response.error;
          result.updated++;
        } else {
          // Create new anggota
          console.log(`Creating new anggota: ${row['Nama Anggota']} (${row['No. Rekening']})`);
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
        console.error(`Error processing row ${result.processed}:`, error);
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

// Record import history
async function recordImportHistory(type, count, status, details) {
  try {
    const { data, error } = await supabase
      .from('import_history')
      .insert({
        type,
        count,
        status,
        details,
        user: 'Admin',
        created_at: new Date().toISOString()
      });
    
    if (error) {
      console.error('Error recording import history:', error);
      return false;
    }
    
    console.log('Import history recorded successfully');
    return true;
  } catch (error) {
    console.error('Error recording import history:', error);
    return false;
  }
}

// Main function
async function main() {
  try {
    // Check if file path is provided
    const filePath = process.argv[2];
    if (!filePath) {
      console.error('Please provide the path to the Excel file as a command-line argument');
      console.log('Example: node test-import.js "path/to/excel/file.xlsx"');
      process.exit(1);
    }
    
    // Process Excel file
    const data = await processExcelFile(filePath);
    
    // Import data to Supabase
    const result = await importDataToSupabase(data);
    
    // Log result
    console.log('\nImport Result:');
    console.log(result.message);
    console.log(`Total processed: ${result.processed}`);
    console.log(`Created: ${result.created}`);
    console.log(`Updated: ${result.updated}`);
    console.log(`Errors: ${result.errors.length}`);
    
    // Record import history
    if (result.success) {
      await recordImportHistory(
        'Data Anggota',
        result.processed,
        'Berhasil',
        `Berhasil: ${result.created} ditambahkan, ${result.updated} diperbarui, ${result.errors.length} gagal`
      );
    } else {
      await recordImportHistory(
        'Data Anggota',
        result.processed,
        'Gagal',
        result.message
      );
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error in main function:', error);
    process.exit(1);
  }
}

// Run the main function
main();
