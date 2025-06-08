import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Supabase URL and anon key from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Check if environment variables are set
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env file.');
}

export const createClient = () => {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey);
};
