import { createClient } from '@supabase/supabase-js';

// Create a direct Supabase admin client with service role key
// This bypasses RLS policies completely - use with caution
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vszhxeamcxgqtwyaxhlu.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzemh4ZWFtY3hncXR3eWF4aGx1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODg0NDQ4NiwiZXhwIjoyMDY0NDIwNDg2fQ.StbmDOrtbbiuRkh-cXQtDFBf5hxY5pB0AJpxxUyH07c',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    global: {
      headers: {
        'x-client-info': 'admin-dashboard-server'
      },
    },
  }
);
