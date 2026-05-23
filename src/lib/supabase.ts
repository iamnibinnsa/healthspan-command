import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseKey =
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string) ||
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string);

// Untyped client — the `profiles` table is managed outside the generated schema.
export const supabase = createClient(supabaseUrl, supabaseKey);

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
