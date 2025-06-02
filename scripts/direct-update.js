// Direct update script for Supabase
const { createClient } = require('@supabase/supabase-js');

// Supabase connection
const supabaseUrl = 'https://vszhxeamcxgqtwyaxhlu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzemh4ZWFtY3hncXR3eWF4aGx1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4NDQ0ODYsImV4cCI6MjA2NDQyMDQ4Nn0.x6Nj5UAHLA2nsNfvK4P8opRkB0U3--ZFt7Dc3Dj-q94';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    }
  }
});

// Account to update
const accountNumber = '02.1.0006'; // Galih Aghni Wicaksono
const newBalance = 123456789;

async function main() {
  try {
    console.log('Starting direct update test...');
    
    // Step 1: Get the current account data
    console.log(`Looking up account: ${accountNumber}`);
    const { data: account, error: getError } = await supabase
      .from('anggota')
      .select('*')
      .eq('nomor_rekening', accountNumber)
      .maybeSingle();
    
    if (getError) {
      console.error('Error getting account:', getError);
      return;
    }
    
    if (!account) {
      console.error(`Account ${accountNumber} not found`);
      return;
    }
    
    console.log('Found account:', account);
    console.log(`Current balance: ${account.saldo}`);
    
    // Step 2: Perform the update
    console.log(`Updating balance to: ${newBalance}`);
    
    // Try direct SQL if available
    try {
      const { data: sqlResult, error: sqlError } = await supabase.rpc(
        'execute_sql', 
        { 
          query: `UPDATE tabungan SET saldo = ${newBalance} WHERE nomor_rekening = '${accountNumber}' RETURNING *` 
        }
      );
      
      if (sqlError) {
        console.log('SQL RPC not available or error:', sqlError);
      } else {
        console.log('SQL update result:', sqlResult);
      }
    } catch (rpcError) {
      console.log('RPC method not available, trying standard update');
    }
    
    // Try standard update
    const { data: updateResult, error: updateError } = await supabase
      .from('tabungan')
      .update({ 
        saldo: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('nomor_rekening', accountNumber)
      .select();
    
    if (updateError) {
      console.error('Error updating account:', updateError);
      
      // Try with anggota_id instead
      console.log('Trying update with anggota_id instead of account number');
      const { data: idUpdateResult, error: idUpdateError } = await supabase
        .from('tabungan')
        .update({ 
          saldo: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('anggota_id', account.id)
        .select();
      
      if (idUpdateError) {
        console.error('Error updating with ID:', idUpdateError);
      } else {
        console.log('Update with ID successful:', idUpdateResult);
      }
    } else {
      console.log('Update successful:', updateResult);
    }
    
    // Step 3: Verify the update
    console.log('Verifying update...');
    const { data: verifiedAccount, error: verifyError } = await supabase
      .from('tabungan')
      .select('*')
      .eq('nomor_rekening', accountNumber)
      .maybeSingle();
    
    if (verifyError) {
      console.error('Error verifying update:', verifyError);
      return;
    }
    
    console.log('Final account data:', verifiedAccount);
    console.log(`Final balance: ${verifiedAccount.saldo}`);
    
    if (verifiedAccount.saldo === newBalance) {
      console.log('✅ UPDATE SUCCESSFUL!');
    } else {
      console.log('❌ UPDATE FAILED! Balance not updated correctly.');
      
      // One last attempt with raw SQL using the REST API directly
      console.log('Attempting raw SQL via REST API...');
      
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/execute_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`
        },
        body: JSON.stringify({
          query: `UPDATE tabungan SET saldo = ${newBalance} WHERE nomor_rekening = '${accountNumber}'`
        })
      }).catch(e => {
        console.error('Fetch error:', e);
        return null;
      });
      
      if (response) {
        const result = await response.text();
        console.log('REST API result:', result);
      }
    }
    
    // Create import_history table if it doesn't exist
    console.log('Creating import_history table if it doesn\'t exist...');
    
    const createTableSQL = `
    CREATE TABLE IF NOT EXISTS import_history (
      id SERIAL PRIMARY KEY,
      type VARCHAR(255) NOT NULL,
      count INTEGER NOT NULL,
      status VARCHAR(50) NOT NULL,
      details TEXT,
      user_id UUID,
      user VARCHAR(255),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );`;
    
    try {
      const { error: createTableError } = await supabase.rpc(
        'execute_sql', 
        { query: createTableSQL }
      );
      
      if (createTableError) {
        console.log('Error creating table or RPC not available:', createTableError);
      } else {
        console.log('Table created or already exists');
      }
    } catch (tableError) {
      console.log('Error creating table:', tableError);
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the main function
main();
