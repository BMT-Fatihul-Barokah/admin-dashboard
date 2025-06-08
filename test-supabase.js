const { createClient } = require('@supabase/supabase-js');

// Load environment variables from .env file when running locally
require('dotenv').config();

// Create Supabase client with credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Check if environment variables are set
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test function to fetch pending registrations
async function testFetchPendingRegistrations() {
  console.log('Testing Supabase connection...');
  
  try {
    // Fetch pending approvals
    const { data, error } = await supabase
      .from('pendaftaran')
      .select('*')
      .eq('status', 'menunggu')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching data:', error);
      return;
    }
    
    console.log('Pending registrations found:', data.length);
    console.log('Data:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the test
testFetchPendingRegistrations();
