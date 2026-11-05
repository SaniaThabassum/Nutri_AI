import { useEffect, useState } from "react";
import type { Food } from "@/data/foods";
import { supabase } from "@/integrations/supabase/client";

export type LogSlot = "breakfast" | "lunch" | "snack" | "dinner";

export type LogEntry = {
  id: string;
  foodId: string;
  name: string;
  slot: LogSlot;
  cal: number;
  prot: number;
  carb: number;
  fat: number;
  fiber: number;
  loggedAt: string; // ISO
};

const KEY = "nutriai.log.v1";
const EVT = "nutriai:log-updated";

function todayKey(d: Date = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

type Store = Record<string, LogEntry[]>; // YYYY-MM-DD -> entries

function readAll(): Store {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Store) : {};
  } catch {
    return {};
  }
}

function writeAll(s: Store) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(s));
  window.dispatchEvent(new Event(EVT));
}

export function addFoodToLog(food: Food, slot: LogSlot = inferSlot()) {
  const store = readAll();
  const key = todayKey();
  const entry: LogEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    foodId: food.id,
    name: food.name,
    slot,
    cal: food.cal,
    prot: food.prot,
    carb: food.carb,
    fat: food.fat,
    fiber: food.fiber,
    loggedAt: new Date().toISOString(),
  };
  store[key] = [...(store[key] ?? []), entry];
  writeAll(store);
  // Background sync to the signed-in user's account (by email)
  void syncEntryToCloud(entry);
  return entry;
}

export type CustomFoodInput = {
  name: string; cal: number; prot: number; carb: number; fat: number; fiber: number;
};

export function addCustomToLog(item: CustomFoodInput, slot: LogSlot = inferSlot()) {
  const store = readAll();
  const key = todayKey();
  const entry: LogEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    foodId: `ai-${Date.now()}`,
    name: item.name,
    slot,
    cal: Math.round(item.cal),
    prot: Math.round(item.prot),
    carb: Math.round(item.carb),
    fat: Math.round(item.fat),
    fiber: Math.round(item.fiber),
    loggedAt: new Date().toISOString(),
  };
  store[key] = [...(store[key] ?? []), entry];
  writeAll(store);
  void syncEntryToCloud(entry);
  return entry;
}

export function removeFromLog(id: string) {
  const store = readAll();
  const key = todayKey();
  store[key] = (store[key] ?? []).filter((e) => e.id !== id);
  writeAll(store);
  void supabase.from("food_logs").delete().eq("client_id", id).then(() => {});
}

async function syncEntryToCloud(e: LogEntry) {
  try {
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user) return;
    await supabase.from("food_logs").insert({
      user_id: user.id,
      user_email: user.email,
      client_id: e.id,
      food_id: e.foodId,
      name: e.name,
      slot: e.slot,
      cal: e.cal,
      prot: e.prot,
      carb: e.carb,
      fat: e.fat,
      fiber: e.fiber,
      logged_at: e.loggedAt,
      log_date: e.loggedAt.slice(0, 10),
    });
  } catch {
    /* offline / not signed in — kept in localStorage cache */
  }
}

export function inferSlot(d: Date = new Date()): LogSlot {
  const h = d.getHours();
  if (h < 11) return "breakfast";
  if (h < 15) return "lunch";
  if (h < 18) return "snack";
  return "dinner";
}

export type DailyTotals = {
  cal: number;
  prot: number;
  carb: number;
  fat: number;
  fiber: number;
  bySlot: Record<LogSlot, number>;
};

function sumEntries(entries: LogEntry[]): DailyTotals {
  const t: DailyTotals = {
    cal: 0, prot: 0, carb: 0, fat: 0, fiber: 0,
    bySlot: { breakfast: 0, lunch: 0, snack: 0, dinner: 0 },
  };
  for (const e of entries) {
    t.cal += e.cal; t.prot += e.prot; t.carb += e.carb; t.fat += e.fat; t.fiber += e.fiber;
    t.bySlot[e.slot] += e.cal;
  }
  return t;
}

export function useFoodLog() {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const read = () => setEntries(readAll()[todayKey()] ?? []);
    read();
    setHydrated(true);
    window.addEventListener(EVT, read);
    window.addEventListener("storage", read);
    return () => {
      window.removeEventListener(EVT, read);
      window.removeEventListener("storage", read);
    };
  }, []);

  return { entries, hydrated, totals: sumEntries(entries) };
}

export function useWeeklyCalories(): { d: string; cal: number }[] {
  const [data, setData] = useState<{ d: string; cal: number }[]>(() => emptyWeek());
  useEffect(() => {
    const build = () => {
      const store = readAll();
      const arr: { d: string; cal: number }[] = [];
      const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      const today = new Date();
      const dow = (today.getDay() + 6) % 7; // 0 = Mon
      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - (dow - i));
        const totals = sumEntries(store[todayKey(date)] ?? []);
        arr.push({ d: labels[i], cal: totals.cal });
      }
      setData(arr);
    };
    build();
    window.addEventListener(EVT, build);
    return () => window.removeEventListener(EVT, build);
  }, []);
  return data;
}

function emptyWeek() {
  return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => ({ d, cal: 0 }));
}

// ============= Water log =============
const WATER_KEY = "nutriai.water.v1";
const WATER_EVT = "nutriai:water-updated";

function readWater(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(WATER_KEY);
    return raw ? (JSON.parse(raw) as Record<string, number>) : {};
  } catch {
    return {};
  }
}
function writeWater(s: Record<string, number>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(WATER_KEY, JSON.stringify(s));
  window.dispatchEvent(new Event(WATER_EVT));
}
export function useWaterLog() {
  const [today, setToday] = useState(0);
  const [week, setWeek] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  useEffect(() => {
    const build = () => {
      const s = readWater();
      setToday(s[todayKey()] ?? 0);
      const arr: number[] = [];
      const t = new Date();
      const dow = (t.getDay() + 6) % 7;
      for (let i = 0; i < 7; i++) {
        const d = new Date(t);
        d.setDate(t.getDate() - (dow - i));
        arr.push(s[todayKey(d)] ?? 0);
      }
      setWeek(arr);
    };
    build();
    window.addEventListener(WATER_EVT, build);
    window.addEventListener("storage", build);
    return () => {
      window.removeEventListener(WATER_EVT, build);
      window.removeEventListener("storage", build);
    };
  }, []);
  const add = (delta: number) => {
    const s = readWater();
    const k = todayKey();
    s[k] = Math.max(0, (s[k] ?? 0) + delta);
    writeWater(s);
  };
  return { today, week, add };
}

// ============= Weight log =============
const WEIGHT_KEY = "nutriai.weight.v1";
const WEIGHT_EVT = "nutriai:weight-updated";

export type WeightEntry = { date: string; kg: number };

function readWeights(): WeightEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(WEIGHT_KEY);
    return raw ? (JSON.parse(raw) as WeightEntry[]) : [];
  } catch {
    return [];
  }
}
function writeWeights(arr: WeightEntry[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(WEIGHT_KEY, JSON.stringify(arr));
  window.dispatchEvent(new Event(WEIGHT_EVT));
}
export function useWeightLog() {
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  useEffect(() => {
    const read = () => setEntries(readWeights());
    read();
    window.addEventListener(WEIGHT_EVT, read);
    window.addEventListener("storage", read);
    return () => {
      window.removeEventListener(WEIGHT_EVT, read);
      window.removeEventListener("storage", read);
    };
  }, []);
  const add = (kg: number) => {
    const d = todayKey();
    const arr = readWeights().filter((e) => e.date !== d);
    arr.push({ date: d, kg });
    arr.sort((a, b) => (a.date < b.date ? -1 : 1));
    writeWeights(arr);
  };
  return { entries, add };
}