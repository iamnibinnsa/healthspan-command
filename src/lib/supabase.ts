export { supabase } from "@/integrations/supabase/client";

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
