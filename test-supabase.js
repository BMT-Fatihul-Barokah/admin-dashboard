const { createClient } = require('@supabase/supabase-js');

// Create Supabase client with direct credentials
const supabaseUrl = 'https://hyiwhckxwrngegswagrb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5aXdoY2t4d3JuZ2Vnc3dhZ3JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0OTY4MzcsImV4cCI6MjA2MTA3MjgzN30.bpDSX9CUEA0F99x3cwNbeTVTVq-NHw5GC5jmp2QqnNM';
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
