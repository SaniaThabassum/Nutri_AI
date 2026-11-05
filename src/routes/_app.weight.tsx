import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Scale, Trophy, TrendingDown, TrendingUp, Plus } from "lucide-react";
import { PageHeader, GlassCard } from "@/components/page-header";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from "recharts";
import { useGoals, GOALS_FALLBACK } from "@/lib/goals";
import { useWeightLog } from "@/lib/food-log";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/weight")({
  ssr: false,
  head: () => ({ meta: [{ title: "Weight Tracker · NutriAI" }, { name: "description", content: "Track weight with smooth curves, milestones and trend indicators." }] }),
  component: Weight,
});

function Weight() {
  const { goals } = useGoals();
  const g = goals ?? GOALS_FALLBACK;
  const target = g.targetWeightKg;
  const startW = g.weightKg;
  const { entries, add } = useWeightLog();

  // Build data: if user has entries use them, else synthesize a starter trend
  const data = useMemo(() => {
    if (entries.length > 0) {
      return entries.map((e) => ({ d: e.date.slice(5), w: e.kg }));
    }
    const dir = target < startW ? 1 : target > startW ? -1 : 0;
    return Array.from({ length: 14 }, (_, i) => ({
      d: `D${i + 1}`,
      w: +(startW + dir * (13 - i) * 0.05 + Math.sin(i / 3) * 0.2).toFixed(2),
    }));
  }, [entries, startW, target]);

  const cur = data[data.length - 1]?.w ?? startW;
  const first = data[0]?.w ?? startW;
  const delta = +(cur - first).toFixed(1);
  const remaining = +(cur - target).toFixed(1);
  const goingDown = remaining > 0 ? delta < 0 : delta > 0;
  const progressPct = Math.max(0, Math.min(100, Math.round(((first - cur) / Math.max(0.1, first - target)) * 100)));

  const [input, setInput] = useState(String(cur));
  function logWeight(e: React.FormEvent) {
    e.preventDefault();
    const kg = parseFloat(input);
    if (!Number.isFinite(kg) || kg < 25 || kg > 350) {
      toast.error("Enter a valid weight in kg");
      return;
    }
    add(kg);
    toast.success(`Logged ${kg} kg for today`);
  }

  const yMin = Math.min(target, ...data.map((d) => d.w)) - 0.5;
  const yMax = Math.max(startW, ...data.map((d) => d.w)) + 0.5;

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader title="Weight Tracker" subtitle="Log a weigh-in and watch your trend bend toward your goal." />

      <div className="grid lg:grid-cols-[2fr_1fr] gap-4">
        <div>
          <div className="grid sm:grid-cols-3 gap-3 mb-4">
            <GlassCard>
              <div className="flex items-center justify-between">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Current</div>
                <Scale className="size-4 text-emerald" />
              </div>
              <div className="font-display text-5xl font-bold mt-2">{cur.toFixed(1)}<span className="text-sm font-normal text-muted-foreground"> kg</span></div>
              <div className={`text-xs mt-1 inline-flex items-center gap-1 ${goingDown ? "text-good" : "text-warn"}`}>
                {delta <= 0 ? <TrendingDown className="size-3.5" /> : <TrendingUp className="size-3.5" />}
                {Math.abs(delta)} kg this period
              </div>
            </GlassCard>
            <GlassCard>
              <div className="flex items-center justify-between">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Target</div>
                <Trophy className="size-4 text-gold" />
              </div>
              <div className="font-display text-5xl font-bold mt-2">{target.toFixed(1)}<span className="text-sm font-normal text-muted-foreground"> kg</span></div>
              <div className="text-xs text-primary mt-1">{Math.abs(remaining).toFixed(1)} kg {remaining > 0 ? "to lose" : remaining < 0 ? "to gain" : "— hit!"}</div>
            </GlassCard>
            <GlassCard>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Progress</div>
              <div className="font-display text-5xl font-bold mt-2">{progressPct}<span className="text-sm font-normal text-muted-foreground">%</span></div>
              <div className="mt-2 h-2 rounded-full bg-white/5 overflow-hidden">
                <div className="h-full gradient-primary" style={{ width: `${progressPct}%` }} />
              </div>
            </GlassCard>
          </div>

          <GlassCard>
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="font-display text-lg font-semibold">Trend</h3>
                <p className="text-xs text-muted-foreground">{entries.length > 0 ? `${entries.length} weigh-ins logged` : "Showing projected trend — log your first weigh-in →"}</p>
              </div>
            </div>
            <div className="h-72">
              <ResponsiveContainer>
                <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--emerald)" stopOpacity={0.55} />
                      <stop offset="100%" stopColor="var(--emerald)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--border)" />
                  <XAxis dataKey="d" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis domain={[yMin, yMax]} stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12 }} formatter={(v: number) => [`${v} kg`, "Weight"]} />
                  <ReferenceLine y={target} stroke="var(--gold)" strokeDasharray="4 4" label={{ value: `Target ${target}`, position: "insideTopRight", fill: "var(--gold)", fontSize: 10 }} />
                  <Area type="monotone" dataKey="w" stroke="var(--emerald)" strokeWidth={3} fill="url(#wg)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </div>

        <div className="grid gap-4 content-start">
          <GlassCard>
            <h3 className="font-display text-lg font-semibold">Log a weigh-in</h3>
            <p className="text-xs text-muted-foreground">Once a day, same time, after waking up.</p>
            <form onSubmit={logWeight} className="mt-4 flex gap-2">
              <input
                type="number" step="0.1" min={25} max={350}
                value={input} onChange={(e) => setInput(e.target.value)}
                className="flex-1 glass rounded-xl px-3 py-2.5 text-base font-mono outline-none"
              />
              <span className="self-center text-sm text-muted-foreground">kg</span>
              <button type="submit" className="inline-flex items-center gap-1.5 gradient-primary text-primary-foreground rounded-xl px-4 py-2.5 text-sm font-semibold glow-primary">
                <Plus className="size-4" /> Log
              </button>
            </form>
          </GlassCard>

          <GlassCard>
            <h3 className="font-display text-lg font-semibold">Recent</h3>
            {entries.length === 0 ? (
              <p className="text-xs text-muted-foreground mt-2">No entries yet. Your first log will replace the projected trend.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {[...entries].slice(-6).reverse().map((e) => (
                  <li key={e.date} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground font-mono text-xs">{e.date}</span>
                    <span className="font-semibold">{e.kg.toFixed(1)} kg</span>
                  </li>
                ))}
              </ul>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}