import { createClient } from '@supabase/supabase-js';

// Hardcoded Supabase URL and service_role key for the koperasi-fatihul-barokah project
// This client bypasses RLS policies and should only be used in admin contexts
const supabaseUrl = 'https://vszhxeamcxgqtwyaxhlu.supabase.co';
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || '';

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
