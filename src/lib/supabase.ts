import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = (
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
) as string;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("[Supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env.local");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: typeof window !== "undefined" ? localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
  },
});

export type SupabaseProfile = {
  id: string;
  name: string | null;
  age: number | null;
  sex: string | null;
  goals: string[] | null;
  sleep_hours: number | null;
  exercise_freq: number | null;
  stress: number | null;
  diet: number | null;
  family_history: string[] | null;
  wearable: string | null;
  updated_at: string | null;
};
