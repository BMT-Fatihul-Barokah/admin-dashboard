import { createClient } from '@supabase/supabase-js';

// Supabase URL and service_role key from environment variables
// This client bypasses RLS policies and should only be used in admin contexts
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Check if environment variables are set
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables for admin client. Please check your .env file.');
}

// Create a Supabase client with the service role key
export const createAdminClient = () => {
  // For security, only create the admin client on the server side
  if (typeof window !== 'undefined') {
    console.error('Warning: Attempted to create admin client on the client side');
    // Return regular client instead for safety
    return createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};
