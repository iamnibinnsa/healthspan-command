import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { supabase, type SupabaseProfile } from "./supabase";

export interface IntakeData {
  name: string;
  age: number;
  sex: string;
  goals: string[];
  sleepHours: number;
  exerciseFreq: number;
  stress: number;
  diet: number;
  familyHistory: string[];
  wearable: string;
}

const defaultIntake: IntakeData = {
  name: "Alex Morgan",
  age: 48,
  sex: "Male",
  goals: ["Longevity", "Energy"],
  sleepHours: 5.8,
  exerciseFreq: 2,
  stress: 7,
  diet: 5,
  familyHistory: ["Cardiovascular disease"],
  wearable: "Apple Watch",
};

function profileToIntake(p: SupabaseProfile): IntakeData {
  return {
    name: p.name ?? defaultIntake.name,
    age: p.age ?? defaultIntake.age,
    sex: p.sex ?? defaultIntake.sex,
    goals: p.goals ?? defaultIntake.goals,
    sleepHours: p.sleep_hours ?? defaultIntake.sleepHours,
    exerciseFreq: p.exercise_freq ?? defaultIntake.exerciseFreq,
    stress: p.stress ?? defaultIntake.stress,
    diet: p.diet ?? defaultIntake.diet,
    familyHistory: p.family_history ?? defaultIntake.familyHistory,
    wearable: p.wearable ?? defaultIntake.wearable,
  };
}

function intakeToProfile(d: IntakeData): Omit<SupabaseProfile, "id" | "updated_at"> {
  return {
    name: d.name,
    age: d.age,
    sex: d.sex,
    goals: d.goals,
    sleep_hours: d.sleepHours,
    exercise_freq: d.exerciseFreq,
    stress: d.stress,
    diet: d.diet,
    family_history: d.familyHistory,
    wearable: d.wearable,
  };
}

interface Ctx {
  user: User | null;
  authLoading: boolean;
  intake: IntakeData;
  setIntake: (d: IntakeData) => void;
  labsLoaded: boolean;
  setLabsLoaded: (b: boolean) => void;
  interventions: string[];
  toggleIntervention: (id: string) => void;
  setInterventions: (ids: string[]) => void;
}

const TwinCtx = createContext<Ctx | null>(null);

export function TwinProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [intake, setIntakeState] = useState<IntakeData>(defaultIntake);
  const [labsLoaded, setLabsLoaded] = useState(false);
  const [interventions, setInterventions] = useState<string[]>([]);

  const loadedForRef = useRef<string | null>(null);

  // ── Auth listener ──────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        if (!session?.user) {
          setIntakeState(defaultIntake);
          setLabsLoaded(false);
          setInterventions([]);
          loadedForRef.current = null;
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // ── Load profile from Supabase when user changes ───────────────────────────
  useEffect(() => {
    if (!user || loadedForRef.current === user.id) return;

    const load = async () => {
      const { data, error } = await (supabase as any)
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!error && data) {
        setIntakeState(profileToIntake(data as SupabaseProfile));
        loadedForRef.current = user.id;
      }
    };

    load();
  }, [user]);

  // ── Persist intake to Supabase on every change ────────────────────────────
  const setIntake = (d: IntakeData) => {
    setIntakeState(d);
    if (!user) return;
    (supabase as any)
      .from("profiles")
      .upsert({ id: user.id, ...intakeToProfile(d) })
      .then(({ error }: { error: { message: string } | null }) => {
        if (error) console.error("Profile save error:", error.message);
      });
  };

  const value = useMemo<Ctx>(
    () => ({
      user,
      authLoading,
      intake,
      setIntake,
      labsLoaded,
      setLabsLoaded,
      interventions,
      setInterventions,
      toggleIntervention: (id) =>
        setInterventions((curr) =>
          curr.includes(id) ? curr.filter((x) => x !== id) : [...curr, id]
        ),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, authLoading, intake, labsLoaded, interventions]
  );

  return <TwinCtx.Provider value={value}>{children}</TwinCtx.Provider>;
}

export function useTwin() {
  const ctx = useContext(TwinCtx);
  if (!ctx) throw new Error("useTwin must be inside TwinProvider");
  return ctx;
}
