import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Hardcoded Supabase URL and anon key for the koperasi-fatihul-barokah project
const supabaseUrl = 'https://vszhxeamcxgqtwyaxhlu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzemh4ZWFtY3hncXR3eWF4aGx1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4NDQ0ODYsImV4cCI6MjA2NDQyMDQ4Nn0.x6Nj5UAHLA2nsNfvK4P8opRkB0U3--ZFt7Dc3Dj-q94';

export const createClient = () => {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey);
};
