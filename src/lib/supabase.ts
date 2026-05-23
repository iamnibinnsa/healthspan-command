import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
