import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// These environment variables are set in the .env file
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const createClient = () => {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey);
};
