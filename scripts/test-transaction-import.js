const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read environment variables from .env file
const envContent = fs.readFileSync('.env', 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
  // Skip empty lines and comments
  if (!line.trim() || line.trim().startsWith('#')) return;
  
  // Split at the first equals sign
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const value = parts.slice(1).join('=').trim();
    envVars[key] = value;
  }
});

console.log('Environment variables loaded:', Object.keys(envVars));

// Create Supabase client
const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL or key not found in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Define the TransaksiExcelRow type in JavaScript
/**
 * @typedef {Object} TransaksiExcelRow
 * @property {string} 'Nama Anggota'
 * @property {string} 'Jenis Transaksi' - masuk or keluar
 * @property {string} 'Kategori' - setoran, penarikan, etc.
 * @property {number|string} 'Jumlah' - Amount
 * @property {string} 'Rekening/Pinjaman' - Account or loan type
 * @property {string|number} 'Tanggal' - Date
 * @property {string} [Deskripsi] - Optional description
 */

/**
 * Process the Excel file and test the import logic
 */
async function testImport() {
  try {
    // Read the Excel file
    const workbook = XLSX.readFile('c:/Project/admin-dashboard/transaksi-2025-05-27 (4).xlsx');
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`Found ${data.length} transactions in the Excel file`);
    console.log('First 3 transactions:');
    console.log(JSON.stringify(data.slice(0, 3), null, 2));
    
    // Group transactions by account/loan type
    const groupedByAccount = {};
    for (const row of data) {
      const accountType = row['Rekening/Pinjaman'];
      if (!groupedByAccount[accountType]) {
        groupedByAccount[accountType] = [];
      }
      groupedByAccount[accountType].push(row);
    }
    
    console.log('\nTransactions grouped by account/loan type:');
    for (const [accountType, transactions] of Object.entries(groupedByAccount)) {
      console.log(`${accountType}: ${transactions.length} transactions`);
    }
    
    // Group transactions by member
    const groupedByMember = {};
    for (const row of data) {
      const memberName = row['Nama Anggota'];
      if (!groupedByMember[memberName]) {
        groupedByMember[memberName] = [];
      }
      groupedByMember[memberName].push(row);
    }
    
    console.log('\nTransactions grouped by member:');
    console.log(`Total unique members: ${Object.keys(groupedByMember).length}`);
    
    // Test finding a member in the database
    const testMemberName = data[0]['Nama Anggota'];
    console.log(`\nTesting member lookup for: ${testMemberName}`);
    
    const { data: memberData, error: memberError } = await supabase
      .from('anggota')
      .select('id, nama')
      .eq('nama', testMemberName)
      .limit(1);
      
    if (memberError) {
      console.error('Error looking up member:', memberError);
    } else if (memberData && memberData.length > 0) {
      console.log(`Found member: ${memberData[0].nama} (ID: ${memberData[0].id})`);
      
      // Test finding accounts for this member
      const { data: accountsData, error: accountsError } = await supabase
        .from('tabungan')
        .select('id, jenis_tabungan_id, jenis_tabungan(nama), saldo, status')
        .eq('anggota_id', memberData[0].id)
        .eq('status', 'aktif');
        
      if (accountsError) {
        console.error('Error looking up accounts:', accountsError);
      } else {
        console.log(`Found ${accountsData.length} active accounts for this member:`);
        for (const account of accountsData) {
          console.log(`- ${account.jenis_tabungan?.nama || 'Unknown'}: ${account.saldo}`);
        }
      }
      
      // Test finding loans for this member
      const { data: loansData, error: loansError } = await supabase
        .from('pinjaman')
        .select('id, jenis_pinjaman, sisa_pembayaran, status')
        .eq('anggota_id', memberData[0].id);
        
      if (loansError) {
        console.error('Error looking up loans:', loansError);
      } else {
        console.log(`Found ${loansData.length} loans for this member:`);
        for (const loan of loansData) {
          console.log(`- ${loan.jenis_pinjaman} (${loan.status}): ${loan.sisa_pembayaran}`);
        }
      }
    } else {
      console.log(`Member not found: ${testMemberName}`);
    }
    
    console.log('\nTest completed successfully');
    
  } catch (error) {
    console.error('Error in test import:', error);
  }
}

// Run the test
testImport().then(() => {
  console.log('Test completed');
  process.exit(0);
}).catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
