import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function makeMissingClient() {
	const err = new Error('Supabase client unavailable: missing environment variables');
	return new Proxy({}, {
		get() {
			return () => Promise.reject(err);
		}
	});
}

let supabase;
if (!supabaseUrl || !supabaseAnonKey) {
	// Expose a stub that throws useful errors instead of crashing the host
	supabase = makeMissingClient();
} else {
	// Use the anon key for client-side usage; server code should use service role where needed
	supabase = createClient(supabaseUrl, supabaseAnonKey, {
		auth: { persistSession: false }
	});
}

export default supabase;
