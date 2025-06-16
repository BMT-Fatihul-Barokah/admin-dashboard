// Import Transactions Script
// This script imports transaction data from an Excel file into the Supabase database
// It can be scheduled to run daily at 3 PM

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const xlsx = require('xlsx');
const { v4: uuidv4 } = require('uuid');

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Initialize Supabase client with service role key for admin access
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Function to read Excel file and convert to JSON
async function readExcelFile(filePath) {
  try {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);
    return data;
  } catch (error) {
    console.error('Error reading Excel file:', error);
    throw error;
  }
}

// Function to find anggota_id by name
async function findAnggotaIdByName(name) {
  try {
    const { data, error } = await supabase
      .from('anggota')
      .select('id')
      .ilike('nama', `%${name}%`)
      .limit(1);
    
    if (error) throw error;
    
    if (data && data.length > 0) {
      return data[0].id;
    } else {
      console.warn(`No anggota found with name: ${name}`);
      return null;
    }
  } catch (error) {
    console.error('Error finding anggota:', error);
    throw error;
  }
}

// Function to find tabungan_id by anggota_id and account name
async function findTabunganId(anggotaId, accountName) {
  try {
    // Check if the account name matches a savings account type
    const { data: jenisTabungan, error: jenisError } = await supabase
      .from('jenis_tabungan')
      .select('id')
      .ilike('nama', `%${accountName}%`)
      .limit(1);
    
    if (jenisError) throw jenisError;
    
    if (jenisTabungan && jenisTabungan.length > 0) {
      // If it's a savings account, find the tabungan record
      const { data, error } = await supabase
        .from('tabungan')
        .select('id, saldo')
        .eq('anggota_id', anggotaId)
        .eq('jenis_tabungan_id', jenisTabungan[0].id)
        .limit(1);
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        return { id: data[0].id, saldo: data[0].saldo, type: 'tabungan' };
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error finding tabungan:', error);
    throw error;
  }
}

// Function to find pembiayaan_id by anggota_id and loan name
async function findPembiayaanId(anggotaId, loanName) {
  try {
    // Check if the account name matches a loan type
    const { data: jenisPembiayaan, error: jenisError } = await supabase
      .from('jenis_pembiayaan')
      .select('id')
      .ilike('nama', `%${loanName}%`)
      .limit(1);
    
    if (jenisError) throw jenisError;
    
    if (jenisPembiayaan && jenisPembiayaan.length > 0) {
      // If it's a loan, find the pembiayaan record
      const { data, error } = await supabase
        .from('pembiayaan')
        .select('id, sisa_pembayaran')
        .eq('anggota_id', anggotaId)
        .eq('jenis_pembiayaan_id', jenisPembiayaan[0].id)
        .limit(1);
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        return { id: data[0].id, saldo: data[0].sisa_pembayaran, type: 'pembiayaan' };
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error finding pembiayaan:', error);
    throw error;
  }
}

// Function to create a transaction
async function createTransaction(transaction) {
  try {
    const { data, error } = await supabase
      .from('transaksi')
      .insert([transaction])
      .select();
    
    if (error) throw error;
    
    return data[0];
  } catch (error) {
    console.error('Error creating transaction:', error);
    throw error;
  }
}

// Function to create a notification for a transaction
async function createNotification(transaksiId, anggotaName, jumlah, accountName, jenis) {
  try {
    const notificationData = {
      id: uuidv4(),
      judul: `Transaksi ${jenis}`,
      pesan: `${anggotaName} melakukan transaksi ${jenis} sebesar Rp ${jumlah.toLocaleString('id-ID')} pada ${accountName}`,
      jenis: 'transaksi',
      data: { transaksi_id: transaksiId },
      is_read: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      transaksi_id: transaksiId
    };
    
    const { data, error } = await supabase
      .from('transaksi_notifikasi')
      .insert([notificationData]);
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

// Function to update account balance
async function updateAccountBalance(accountId, accountType, currentBalance, amount, transactionType) {
  try {
    let newBalance = currentBalance;
    
    // Calculate new balance based on transaction type
    if (transactionType === 'masuk') {
      newBalance += amount;
    } else if (transactionType === 'keluar') {
      newBalance -= amount;
    }
    
    // Update the appropriate table based on account type
    if (accountType === 'tabungan') {
      const { data, error } = await supabase
        .from('tabungan')
        .update({ saldo: newBalance })
        .eq('id', accountId);
      
      if (error) throw error;
    } else if (accountType === 'pembiayaan') {
      const { data, error } = await supabase
        .from('pembiayaan')
        .update({ sisa_pembayaran: newBalance })
        .eq('id', accountId);
      
      if (error) throw error;
    }
    
    return newBalance;
  } catch (error) {
    console.error('Error updating account balance:', error);
    throw error;
  }
}

// Main function to process Excel file and import transactions
async function importTransactions(filePath) {
  try {
    console.log(`Starting import of transactions from ${filePath}`);
    
    // Read Excel file
    const transactions = await readExcelFile(filePath);
    console.log(`Found ${transactions.length} transactions to import`);
    
    // Process each transaction
    for (const transaction of transactions) {
      const anggotaName = transaction['Nama Anggota'];
      const jenisTransaksi = transaction['Jenis Transaksi'];
      const jumlah = transaction['Jumlah'];
      const accountName = transaction['Rekening/Pinjaman'];
      const tanggal = new Date(transaction['Tanggal']);
      
      console.log(`Processing transaction for ${anggotaName}: ${jenisTransaksi} ${jumlah} on ${accountName}`);
      
      // Find anggota_id
      const anggotaId = await findAnggotaIdByName(anggotaName);
      if (!anggotaId) {
        console.error(`Skipping transaction: Anggota not found for name ${anggotaName}`);
        continue;
      }
      
      // Find account ID (tabungan or pembiayaan)
      let accountId = null;
      let accountType = null;
      let currentBalance = 0;
      
      // Try to find as tabungan first
      const tabunganInfo = await findTabunganId(anggotaId, accountName);
      if (tabunganInfo) {
        accountId = tabunganInfo.id;
        accountType = 'tabungan';
        currentBalance = tabunganInfo.saldo;
      } else {
        // If not found as tabungan, try as pembiayaan
        const pembiayaanInfo = await findPembiayaanId(anggotaId, accountName);
        if (pembiayaanInfo) {
          accountId = pembiayaanInfo.id;
          accountType = 'pembiayaan';
          currentBalance = pembiayaanInfo.saldo;
        }
      }
      
      if (!accountId) {
        console.error(`Skipping transaction: Account not found for ${anggotaName} with name ${accountName}`);
        continue;
      }
      
      // Calculate new balance
      const newBalance = currentBalance + (jenisTransaksi === 'masuk' ? jumlah : -jumlah);
      
      // Create transaction record
      const transactionRecord = {
        id: uuidv4(),
        anggota_id: anggotaId,
        tipe_transaksi: jenisTransaksi,
        deskripsi: `Import otomatis: ${accountName}`,
        jumlah: jumlah,
        sebelum: currentBalance,
        sesudah: newBalance,
        created_at: tanggal.toISOString(),
        updated_at: new Date().toISOString(),
        source_type: accountType === 'tabungan' ? 'tabungan' : 'pembiayaan',
        [accountType === 'tabungan' ? 'tabungan_id' : 'pembiayaan_id']: accountId
      };
      
      // Insert transaction
      const createdTransaction = await createTransaction(transactionRecord);
      console.log(`Created transaction with ID: ${createdTransaction.id}`);
      
      // Update account balance
      await updateAccountBalance(accountId, accountType, currentBalance, jumlah, jenisTransaksi);
      
      // Create notification
      await createNotification(createdTransaction.id, anggotaName, jumlah, accountName, jenisTransaksi);
      
      console.log(`Transaction processed successfully for ${anggotaName}`);
    }
    
    console.log('Import completed successfully');
    return { success: true, count: transactions.length };
  } catch (error) {
    console.error('Error importing transactions:', error);
    return { success: false, error: error.message };
  }
}

// Check if this script is being run directly
if (require.main === module) {
  // Get file path from command line arguments or use default
  const filePath = process.argv[2] || path.join(process.cwd(), 'transaksi-2025-06-16.xlsx');
  
  // Run the import
  importTransactions(filePath)
    .then(result => {
      console.log('Import result:', result);
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Import failed:', error);
      process.exit(1);
    });
}

module.exports = {
  importTransactions
};
