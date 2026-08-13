import { createClient } from '@supabase/supabase-js';
import { triggerRestore } from './db-wake.js';

// Guard initialization so missing env vars don't crash the function host.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

function createMissingStub(msg) {
  const err = new Error(msg);
  const stubReturn = new Proxy({}, {
    get() {
      return () => Promise.reject(err);
    }
  });

  return new Proxy({}, {
    get(target, prop) {
      if (prop === 'from') {
        return () => stubReturn;
      }
      // any other chainable method returns a rejecting function
      return () => Promise.reject(err);
    }
  });
}

let supabase;
if (!supabaseUrl || !serviceRole) {
  console.error('Supabase env missing. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.');
  supabase = createMissingStub('Supabase not configured on server. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
} else {
  supabase = createClient(
    supabaseUrl,
    serviceRole,
    {
      global: {
        fetch: async (url, options) => {
          const res = await fetch(url, options);
          if (!res.ok && res.status >= 500) triggerRestore();
          return res;
        },
      },
    }
  );
}

export default supabase;
