import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Public values — safe to hardcode as fallbacks (anon key is intentionally public)
const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://xzgccthebdjchdumgrvv.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6Z2NjdGhlYmRqY2hkdW1ncnZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0NTE2NTgsImV4cCI6MjA5MDAyNzY1OH0.x07A7TTZSv5hVdcoklkN-2YoNjGjmoTElN6fLRtOvvk";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
