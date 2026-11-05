import { useEffect, useState } from "react";

export type Sex = "male" | "female";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "athlete";
export type GoalType = "lose" | "maintain" | "gain";

export type Goals = {
  name: string;
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  activity: ActivityLevel;
  goal: GoalType;
  targetWeightKg: number;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  waterGlasses: number;
  completedAt: string;
};

const KEY = "nutriai.goals.v1";

const ACTIVITY_MULT: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  athlete: 1.9,
};

const GOAL_ADJUST: Record<GoalType, number> = {
  lose: -500,
  maintain: 0,
  gain: 300,
};

export function computeTargets(input: {
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  activity: ActivityLevel;
  goal: GoalType;
}) {
  // Mifflin–St Jeor
  const base =
    10 * input.weightKg + 6.25 * input.heightCm - 5 * input.age + (input.sex === "male" ? 5 : -161);
  const tdee = base * ACTIVITY_MULT[input.activity];
  const calories = Math.max(1200, Math.round((tdee + GOAL_ADJUST[input.goal]) / 10) * 10);

  // Macro split
  const proteinPerKg = input.goal === "gain" ? 2.0 : input.goal === "lose" ? 1.8 : 1.6;
  const protein = Math.round(input.weightKg * proteinPerKg);
  const fats = Math.round((calories * 0.28) / 9);
  const carbs = Math.max(60, Math.round((calories - protein * 4 - fats * 9) / 4));

  // Water: 30 ml per kg, 250 ml per glass
  const waterGlasses = Math.max(4, Math.min(16, Math.round((input.weightKg * 30) / 250)));

  return { calories, protein, carbs, fats, waterGlasses };
}

const DEFAULT_GOALS: Goals = {
  name: "Friend",
  sex: "female",
  age: 30,
  heightCm: 170,
  weightKg: 70,
  activity: "moderate",
  goal: "maintain",
  targetWeightKg: 68,
  calories: 2000,
  protein: 150,
  carbs: 250,
  fats: 65,
  waterGlasses: 8,
  completedAt: "",
};

export function readGoals(): Goals | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Goals>;
    if (!parsed.completedAt) return null;
    return { ...DEFAULT_GOALS, ...parsed } as Goals;
  } catch {
    return null;
  }
}

export function saveGoals(g: Goals) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(g));
  window.dispatchEvent(new Event("nutriai:goals-updated"));
}

export function clearGoals() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("nutriai:goals-updated"));
}

/**
 * Client-only hook. Returns null on the server and on the very first client
 * render (avoids hydration mismatch), then hydrates from localStorage.
 */
export function useGoals(): { goals: Goals | null; hydrated: boolean } {
  const [goals, setGoals] = useState<Goals | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setGoals(readGoals());
    setHydrated(true);
    const handler = () => setGoals(readGoals());
    window.addEventListener("nutriai:goals-updated", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("nutriai:goals-updated", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  return { goals, hydrated };
}

export const GOALS_FALLBACK = DEFAULT_GOALS;