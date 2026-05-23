import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

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

interface Ctx {
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
  const [intake, setIntake] = useState<IntakeData>(defaultIntake);
  const [labsLoaded, setLabsLoaded] = useState(false);
  const [interventions, setInterventions] = useState<string[]>([]);

  const value = useMemo<Ctx>(
    () => ({
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
    [intake, labsLoaded, interventions]
  );

  return <TwinCtx.Provider value={value}>{children}</TwinCtx.Provider>;
}

export function useTwin() {
  const ctx = useContext(TwinCtx);
  if (!ctx) throw new Error("useTwin must be inside TwinProvider");
  return ctx;
}
