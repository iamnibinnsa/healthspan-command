import { supabase as typedSupabase } from "@/integrations/supabase/client";

// Untyped client — the `profiles` table is managed outside the generated schema.
export const supabase = typedSupabase as unknown as ReturnType<typeof createUntyped>;
function createUntyped() {
  return typedSupabase as any;
}

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
