import { createFileRoute } from "@tanstack/react-router";
import { Plus, Minus, Droplets, Sparkles } from "lucide-react";
import { PageHeader, GlassCard } from "@/components/page-header";
import { useGoals, GOALS_FALLBACK } from "@/lib/goals";
import { useWaterLog } from "@/lib/food-log";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/water")({
  ssr: false,
  head: () => ({ meta: [{ title: "Water Tracker · NutriAI" }, { name: "description", content: "Stay hydrated with a goal-driven water tracker and weekly heatmap." }] }),
  component: Water,
});

const QUICK = [
  { ml: 250, label: "Glass", emoji: "🥛" },
  { ml: 500, label: "Bottle", emoji: "🍶" },
  { ml: 750, label: "Sport", emoji: "💪" },
];

function Water() {
  const { goals } = useGoals();
  const goal = (goals ?? GOALS_FALLBACK).waterGlasses;
  const { today, week, add } = useWaterLog();
  const glasses = today;
  const pct = Math.min(100, (glasses / goal) * 100);
  const ml = glasses * 250;
  const goalMl = goal * 250;
  const remaining = Math.max(0, goal - glasses);

  function addGlasses(n: number) {
    add(n);
    if (n > 0) toast.success(`+${n} glass${n === 1 ? "" : "es"} (${n * 250} ml)`);
  }

  const avg = Math.round(week.reduce((a, b) => a + b, 0) / 7);
  const best = Math.max(...week, 0);

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader title="Water Tracker" subtitle="Quick-add a glass, watch your daily goal fill in real time." />

      <div className="grid lg:grid-cols-[1.1fr_1fr] gap-4">
        {/* Animated bottle */}
        <GlassCard className="relative overflow-hidden">
          <div className="grid sm:grid-cols-[260px_1fr] gap-6 items-center">
            <div className="relative mx-auto">
              <div className="relative w-44 h-72 rounded-[2.5rem] border-2 border-white/15 overflow-hidden bg-white/5 shadow-inner">
                <div
                  className="absolute bottom-0 left-0 right-0 gradient-ocean"
                  style={{ height: `${pct}%`, filter: "drop-shadow(0 -4px 20px var(--ocean))", transition: "height 500ms ease-out" }}
                >
                  <div className="absolute -top-2 left-0 right-0 h-4 bg-white/30 rounded-full blur-sm" />
                </div>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  <Droplets className="size-6 text-white drop-shadow" />
                  <div className="font-display text-5xl font-bold mt-1 drop-shadow">{glasses}</div>
                  <div className="text-[10px] uppercase tracking-[0.18em] text-white/85">of {goal} glasses</div>
                  <div className="text-[10px] font-mono text-white/70 mt-1">{ml} / {goalMl} ml</div>
                </div>
              </div>
            </div>

            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-primary inline-flex items-center gap-1.5"><Sparkles className="size-3.5" /> Hydration</div>
              <div className="font-display text-3xl font-bold mt-2">
                {pct >= 100 ? "Goal hit! 🎉" : `${remaining} glass${remaining === 1 ? "" : "es"} to go`}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Personalized to your body weight — keep sips steady through the day.
              </p>

              <div className="grid grid-cols-3 gap-2 mt-5">
                {QUICK.map((q) => (
                  <button key={q.ml} onClick={() => addGlasses(q.ml / 250)}
                    className="glass rounded-2xl py-3 text-center hover:bg-white/10 transition">
                    <div className="text-2xl">{q.emoji}</div>
                    <div className="text-xs font-semibold mt-1">{q.label}</div>
                    <div className="text-[10px] text-muted-foreground">+{q.ml} ml</div>
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3 mt-5">
                <button onClick={() => addGlasses(-1)} disabled={glasses === 0}
                  className="size-11 rounded-full glass flex items-center justify-center disabled:opacity-40"><Minus className="size-4" /></button>
                <button onClick={() => addGlasses(1)}
                  className="flex-1 h-11 rounded-full gradient-ocean text-primary-foreground font-semibold inline-flex items-center justify-center gap-2 glow-primary">
                  <Plus className="size-4" /> Add glass
                </button>
              </div>
            </div>
          </div>
        </GlassCard>

        <div className="grid gap-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              { k: "Avg / day", v: avg, u: "🥛" },
              { k: "Best day", v: best, u: "🏆" },
              { k: "Goal", v: goal, u: "🎯" },
            ].map((s) => (
              <GlassCard key={s.k} className="text-center !p-4">
                <div className="text-2xl">{s.u}</div>
                <div className="font-display text-2xl font-bold mt-1">{s.v}</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">{s.k}</div>
              </GlassCard>
            ))}
          </div>

          <GlassCard>
            <h3 className="font-display text-lg font-semibold">This week</h3>
            <p className="text-xs text-muted-foreground">Glasses per day</p>
            <div className="grid grid-cols-7 gap-2 mt-4">
              {["M","T","W","T","F","S","S"].map((d, i) => {
                const v = week[i] ?? 0;
                const h = Math.max(4, (v / Math.max(goal, 1)) * 100);
                return (
                  <div key={i} className="flex flex-col items-center gap-1.5">
                    <div className="h-32 w-full rounded-xl bg-white/5 relative overflow-hidden flex items-end">
                      <div className="w-full gradient-ocean rounded-xl transition-[height] duration-500 ease-out" style={{ height: `${Math.min(h, 100)}%` }} />
                    </div>
                    <div className="text-[10px] text-muted-foreground">{d}</div>
                    <div className="text-xs font-mono">{v}</div>
                  </div>
                );
              })}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}