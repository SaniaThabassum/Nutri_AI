import { createFileRoute } from "@tanstack/react-router";
import { Fragment, useEffect, useMemo, useState } from "react";
import { Sparkles, RefreshCw, ChefHat, Plus, X } from "lucide-react";
import { PageHeader, GlassCard } from "@/components/page-header";
import { FOODS, type Food } from "@/data/foods";
import { useGoals, GOALS_FALLBACK } from "@/lib/goals";
import { addFoodToLog } from "@/lib/food-log";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/meal-planner")({
  ssr: false,
  head: () => ({ meta: [{ title: "Meal Planner · NutriAI" }, { name: "description", content: "Plan your week of meals with AI-balanced macros." }] }),
  component: MealPlanner,
});

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const SLOTS = ["Breakfast", "Lunch", "Snack", "Dinner"] as const;

// Calorie split per slot (sums to 1)
const SLOT_SHARE = { Breakfast: 0.25, Lunch: 0.35, Snack: 0.1, Dinner: 0.3 } as const;

type Plan = Record<string, Food>; // key = `${slot}-${day}`
const STORAGE = "nutriai.plan.v1";

function pickClosest(pool: Food[], target: number, used: Set<string>): Food {
  let best = pool[0];
  let bestDiff = Infinity;
  for (const f of pool) {
    if (used.has(f.id)) continue;
    const d = Math.abs(f.cal - target);
    if (d < bestDiff) { best = f; bestDiff = d; }
  }
  used.add(best.id);
  return best;
}

function generatePlan(targetCal: number): Plan {
  const plan: Plan = {};
  const used = new Set<string>();
  // Categorize pool roughly by calories per slot
  const sorted = [...FOODS].sort(() => Math.random() - 0.5);
  for (const slot of SLOTS) {
    const target = Math.round(targetCal * SLOT_SHARE[slot]);
    // wider window for snacks/breakfast
    const lo = target * 0.6, hi = target * 1.4;
    const pool = sorted.filter((f) => f.cal >= lo && f.cal <= hi);
    const fallback = sorted;
    for (const day of DAYS) {
      plan[`${slot}-${day}`] = pickClosest(pool.length ? pool : fallback, target, used);
    }
  }
  return plan;
}

function MealPlanner() {
  const { goals } = useGoals();
  const targetCal = (goals ?? GOALS_FALLBACK).calories;
  const [plan, setPlan] = useState<Plan | null>(null);
  const [activeKey, setActiveKey] = useState<string | null>(null);

  // Load saved plan
  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" && window.localStorage.getItem(STORAGE);
      if (raw) {
        const ids = JSON.parse(raw) as Record<string, string>;
        const map: Plan = {};
        for (const [k, id] of Object.entries(ids)) {
          const f = FOODS.find((x) => x.id === id);
          if (f) map[k] = f;
        }
        if (Object.keys(map).length > 0) { setPlan(map); return; }
      }
    } catch { /* ignore */ }
    // First load: auto-generate so users see a populated planner
    setPlan(generatePlan(targetCal));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist when plan changes
  useEffect(() => {
    if (!plan || typeof window === "undefined") return;
    const ids: Record<string, string> = {};
    for (const [k, f] of Object.entries(plan)) ids[k] = f.id;
    window.localStorage.setItem(STORAGE, JSON.stringify(ids));
  }, [plan]);

  const dayTotals = useMemo(() => {
    if (!plan) return DAYS.map(() => 0);
    return DAYS.map((day) => SLOTS.reduce((sum, s) => sum + (plan[`${s}-${day}`]?.cal ?? 0), 0));
  }, [plan]);

  function regenerate() {
    setPlan(generatePlan(targetCal));
    toast.success("New weekly plan generated");
  }

  function swap(key: string, food: Food) {
    setPlan((p) => ({ ...(p ?? {}), [key]: food }));
    setActiveKey(null);
    toast.message(`Swapped to ${food.name}`);
  }

  function logDay(day: string) {
    if (!plan) return;
    let n = 0;
    for (const s of SLOTS) {
      const f = plan[`${s}-${day}`];
      if (f) { addFoodToLog(f, s.toLowerCase() as "breakfast" | "lunch" | "snack" | "dinner"); n++; }
    }
    toast.success(`Logged ${n} meals from ${day} to today`);
  }

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Meal Planner"
        subtitle={`A balanced week of meals tuned to your ${targetCal} kcal target.`}
        actions={
          <div className="flex gap-2">
            <Link to="/recipes" className="inline-flex items-center gap-1.5 glass rounded-full px-4 py-2.5 text-sm font-semibold">
              <ChefHat className="size-4" /> Recipes
            </Link>
            <button onClick={regenerate} className="inline-flex items-center gap-1.5 gradient-primary text-primary-foreground rounded-full px-5 py-2.5 text-sm font-semibold glow-primary">
              <Sparkles className="size-4" /> Generate week
            </button>
          </div>
        }
      />

      <GlassCard className="overflow-x-auto">
        <div className="grid grid-cols-[88px_repeat(7,minmax(150px,1fr))] gap-3 min-w-[1000px]">
          <div />
          {DAYS.map((d, i) => (
            <div key={d} className="text-center">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">{d}</div>
              <div className="text-[10px] font-mono text-primary mt-0.5">{dayTotals[i]} kcal</div>
            </div>
          ))}
          {SLOTS.map((slot) => (
            <Fragment key={slot}>
              <div className="text-xs uppercase tracking-wider text-muted-foreground self-center">{slot}</div>
              {DAYS.map((d) => {
                const key = `${slot}-${d}`;
                const f = plan?.[key];
                return (
                  <button key={key} type="button" onClick={() => setActiveKey(key)}
                    className="text-left rounded-xl bg-white/5 hover:bg-white/10 transition p-3 ring-1 ring-transparent hover:ring-primary/30">
                    {f ? (
                      <>
                        <div className="text-sm font-medium line-clamp-2">{f.name}</div>
                        <div className="text-[10px] text-muted-foreground mt-1">{f.cal} kcal · {f.prot}g P</div>
                      </>
                    ) : (
                      <div className="text-xs text-muted-foreground inline-flex items-center gap-1"><Plus className="size-3" /> Add</div>
                    )}
                  </button>
                );
              })}
            </Fragment>
          ))}
        </div>
      </GlassCard>

      <div className="flex flex-wrap gap-2 mt-4">
        {DAYS.map((d) => (
          <button key={d} onClick={() => logDay(d)} className="glass rounded-full px-4 py-2 text-xs font-semibold">
            Log {d} to today
          </button>
        ))}
      </div>

      {activeKey && (
        <SwapDialog
          onClose={() => setActiveKey(null)}
          onPick={(f) => swap(activeKey, f)}
        />
      )}
    </div>
  );
}

function SwapDialog({ onClose, onPick }: { onClose: () => void; onPick: (f: Food) => void }) {
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const query = q.trim().toLowerCase();
    const arr = query
      ? FOODS.filter((f) => f.name.toLowerCase().includes(query) || f.ingredients.toLowerCase().includes(query))
      : [...FOODS].sort((a, b) => b.score - a.score);
    return arr.slice(0, 40);
  }, [q]);
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="glass-strong rounded-3xl w-full max-w-xl max-h-[80vh] flex flex-col p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-lg font-semibold">Swap meal</h3>
          <button onClick={onClose} className="size-9 rounded-xl hover:bg-white/10 inline-flex items-center justify-center"><X className="size-4" /></button>
        </div>
        <input
          autoFocus value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="Search 870 dishes…"
          className="glass rounded-xl px-3 py-2.5 text-sm outline-none mb-3"
        />
        <div className="overflow-y-auto -mr-2 pr-2 space-y-1">
          {list.map((f) => (
            <button key={f.id} onClick={() => onPick(f)} className="w-full text-left rounded-xl px-3 py-2 hover:bg-white/10 transition flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{f.name}</div>
                <div className="text-[11px] text-muted-foreground truncate">{f.region} · {f.cal} kcal · {f.prot}g P</div>
              </div>
              <div className="text-xs font-mono text-primary">{f.score}</div>
            </button>
          ))}
          {list.length === 0 && <div className="text-sm text-muted-foreground py-6 text-center">No matches</div>}
        </div>
        <button onClick={() => { /* clear */ }} className="hidden">
          <RefreshCw className="size-4" />
        </button>
      </div>
    </div>
  );
}