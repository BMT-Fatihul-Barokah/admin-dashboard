import { createClient } from "@supabase/supabase-js";

// Create a direct Supabase client using environment variables
export const supabaseDirect = createClient(
	process.env.NEXT_PUBLIC_SUPABASE_URL!,
	process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
	{
		auth: {
			autoRefreshToken: true,
			persistSession: true,
			detectSessionInUrl: false,
		},
		global: {
			headers: {
				"x-client-info": "admin-dashboard",
			},
		},
	}
);
