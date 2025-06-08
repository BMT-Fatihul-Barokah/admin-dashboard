// Direct SQL update script for Supabase using fetch API
// Using dynamic import for node-fetch (ESM module)

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

// Account to update
const accountNumber = '02.1.0006'; // Galih Aghni Wicaksono
const newBalance = 123456789;

async function main() {
  try {
    console.log(`Attempting to update balance for account ${accountNumber} to ${newBalance}`);
    
    // Step 1: Get the current account data
    const getResponse = await fetch(`${supabaseUrl}/rest/v1/anggota?nomor_rekening=eq.${accountNumber}&limit=1`, {
      method: 'GET',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });
    
    if (!getResponse.ok) {
      console.error('Error getting account:', await getResponse.text());
      process.exit(1);
    }
    
    const accounts = await getResponse.json();
    if (!accounts || accounts.length === 0) {
      console.error(`Account ${accountNumber} not found`);
      process.exit(1);
    }
    
    const account = accounts[0];
    console.log('Current account data:', account);
    console.log(`Current balance: ${account.saldo}`);
    
    // Step 2: Update the account with PATCH
    console.log('\nAttempting direct PATCH update...');
    const patchResponse = await fetch(`${supabaseUrl}/rest/v1/anggota?id=eq.${account.id}`, {
      method: 'PATCH',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        saldo: newBalance,
        updated_at: new Date().toISOString()
      })
    });
    
    const patchStatus = patchResponse.status;
    const patchText = await patchResponse.text();
    console.log(`PATCH status: ${patchStatus}`);
    console.log('PATCH response:', patchText);
    
    // Step 3: Verify the update
    console.log('\nVerifying update...');
    const verifyResponse = await fetch(`${supabaseUrl}/rest/v1/anggota?nomor_rekening=eq.${accountNumber}&limit=1`, {
      method: 'GET',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!verifyResponse.ok) {
      console.error('Error verifying update:', await verifyResponse.text());
      process.exit(1);
    }
    
    const verifiedAccounts = await verifyResponse.json();
    if (!verifiedAccounts || verifiedAccounts.length === 0) {
      console.error(`Account ${accountNumber} not found during verification`);
      process.exit(1);
    }
    
    const verifiedAccount = verifiedAccounts[0];
    console.log('Verified account data:', verifiedAccount);
    console.log(`Verified balance: ${verifiedAccount.saldo}`);
    
    if (verifiedAccount.saldo === newBalance) {
      console.log('\n✅ SUCCESS: Balance successfully updated!');
    } else {
      console.log('\n❌ FAILED: Balance not updated correctly.');
      console.log(`Expected: ${newBalance}, Actual: ${verifiedAccount.saldo}`);
      
      // Try one more approach with PUT
      console.log('\nAttempting PUT update as a last resort...');
      const putResponse = await fetch(`${supabaseUrl}/rest/v1/anggota?id=eq.${account.id}`, {
        method: 'PUT',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          ...account,
          saldo: newBalance,
          updated_at: new Date().toISOString()
        })
      });
      
      const putStatus = putResponse.status;
      const putText = await putResponse.text();
      console.log(`PUT status: ${putStatus}`);
      console.log('PUT response:', putText);
      
      // Final verification
      const finalResponse = await fetch(`${supabaseUrl}/rest/v1/anggota?nomor_rekening=eq.${accountNumber}&limit=1`, {
        method: 'GET',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      const finalAccounts = await finalResponse.json();
      const finalAccount = finalAccounts[0];
      console.log('Final account data:', finalAccount);
      console.log(`Final balance: ${finalAccount.saldo}`);
      
      if (finalAccount.saldo === newBalance) {
        console.log('\n✅ SUCCESS: Balance successfully updated with PUT!');
      } else {
        console.log('\n❌ FAILED: Balance not updated correctly with PUT either.');
      }
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

// Run the main function
main();
