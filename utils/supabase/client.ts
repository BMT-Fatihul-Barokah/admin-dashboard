import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Hardcoded Supabase URL and anon key for the koperasi-fatihul-barokah project
const supabaseUrl = 'https://hyiwhckxwrngegswagrb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5aXdoY2t4d3JuZ2Vnc3dhZ3JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0OTY4MzcsImV4cCI6MjA2MTA3MjgzN30.bpDSX9CUEA0F99x3cwNbeTVTVq-NHw5GC5jmp2QqnNM';

export const createClient = () => {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey);
};
