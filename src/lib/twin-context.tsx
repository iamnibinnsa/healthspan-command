import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { fetchScoreCompute, type MediTwinScore } from "./scoreApi";
import { supabase, type SupabaseProfile } from "./supabase";

export interface ParsedBiomarkers {
  hba1c: number;
  fasting_glucose: number;
  apob: number;
  ldl_c: number;
  hdl_c: number;
  triglycerides: number;
  hs_crp: number;
  vitamin_d: number;
  resting_hr: number;
  hrv: number;
  sleep_duration: number;
  vo2_max: number;
}

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
  name: "",
  age: 0,
  sex: "Male",
  goals: [],
  sleepHours: 7,
  exerciseFreq: 3,
  stress: 5,
  diet: 5,
  familyHistory: [],
  wearable: "None",
};

function profileToIntake(p: SupabaseProfile): IntakeData {
  return {
    name: p.name ?? "",
    age: p.age ?? 0,
    sex: p.sex ?? "Male",
    goals: p.goals ?? [],
    sleepHours: p.sleep_hours ?? 7,
    exerciseFreq: p.exercise_freq ?? 3,
    stress: p.stress ?? 5,
    diet: p.diet ?? 5,
    familyHistory: p.family_history ?? [],
    wearable: p.wearable ?? "None",
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
  parsedBiomarkers: ParsedBiomarkers | null;
  setParsedBiomarkers: (data: ParsedBiomarkers | null) => void;
  score: MediTwinScore | null;
  scoreLoading: boolean;
  scoreError: string | null;
  scoredBiomarkerKey: string | null;
  computeScore: (biomarkersOverride?: ParsedBiomarkers) => Promise<MediTwinScore | null>;
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
  const [parsedBiomarkers, setParsedBiomarkersState] = useState<ParsedBiomarkers | null>(null);
  const [score, setScore] = useState<MediTwinScore | null>(null);
  const [scoreLoading, setScoreLoading] = useState(false);
  const [scoreError, setScoreError] = useState<string | null>(null);
  const [scoredBiomarkerKey, setScoredBiomarkerKey] = useState<string | null>(null);
  const [interventions, setInterventions] = useState<string[]>([]);
  const scoreInFlightRef = useRef<Map<string, Promise<MediTwinScore | null>>>(new Map());

  const setParsedBiomarkers = useCallback((data: ParsedBiomarkers | null) => {
    setParsedBiomarkersState(data);
    setScore(null);
    setScoreError(null);
    setScoredBiomarkerKey(null);
  }, []);

  const computeScore = useCallback(async (biomarkersOverride?: ParsedBiomarkers) => {
    const biomarkers = biomarkersOverride ?? parsedBiomarkers;
    if (!biomarkers) return null;

    const key = JSON.stringify(biomarkers);
    const inFlight = scoreInFlightRef.current.get(key);
    if (inFlight) return inFlight;

    const run = (async () => {
      setScoreLoading(true);
      setScoreError(null);
      try {
        const result = await fetchScoreCompute({
          userId: user?.id ?? null,
          intake,
          biomarkers,
          interventions,
        });
        setScore(result);
        setScoredBiomarkerKey(key);
        return result;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Score compute failed";
        setScoreError(msg);
        console.error("Score compute error:", msg);
        return null;
      } finally {
        setScoreLoading(false);
        scoreInFlightRef.current.delete(key);
      }
    })();

    scoreInFlightRef.current.set(key, run);
    return run;
  }, [intake, interventions, parsedBiomarkers, user?.id]);

  // Track the last userId whose profile was loaded so we don't re-fetch
  // when unrelated state changes trigger a re-render.
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
          // Signed out — reset to defaults
          setIntakeState(defaultIntake);
          setLabsLoaded(false);
          setParsedBiomarkersState(null);
          setScore(null);
          setScoreError(null);
          setScoredBiomarkerKey(null);
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
    // Fire-and-forget UPSERT (no await — UI stays snappy)
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
      parsedBiomarkers,
      setParsedBiomarkers,
      score,
      scoreLoading,
      scoreError,
      scoredBiomarkerKey,
      computeScore,
      interventions,
      setInterventions,
      toggleIntervention: (id) =>
        setInterventions((curr) =>
          curr.includes(id) ? curr.filter((x) => x !== id) : [...curr, id]
        ),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, authLoading, intake, labsLoaded, parsedBiomarkers, score, scoreLoading, scoreError, scoredBiomarkerKey, computeScore, interventions]
  );

  return <TwinCtx.Provider value={value}>{children}</TwinCtx.Provider>;
}

export type { MediTwinScore };

export function useTwin() {
  const ctx = useContext(TwinCtx);
  if (!ctx) throw new Error("useTwin must be inside TwinProvider");
  return ctx;
}
