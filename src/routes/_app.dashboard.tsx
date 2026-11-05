import { createFileRoute, Link } from "@tanstack/react-router";
import { Flame, Plus, TrendingUp, Droplet, Scale, Sparkles, Trash2 } from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, CartesianGrid,
  RadialBarChart, RadialBar,
} from "recharts";
import { MacroRing } from "@/components/macro-ring";
import { PageHeader, GlassCard } from "@/components/page-header";
import { FOODS } from "@/data/foods";
import { FoodCard } from "@/components/food-card";
import { useGoals, GOALS_FALLBACK } from "@/lib/goals";
import { useFoodLog, useWeeklyCalories, useWaterLog, removeFromLog } from "@/lib/food-log";
import { HealthAlerts } from "@/components/health-alerts";
import { toast } from "sonner";
import { useWebMCP } from "use-webmcp-tool";
import { runWebMCPTool } from "@/lib/webmcp-telemetry";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard · NutriAI" }, { name: "description", content: "Daily nutrition overview, macros, hydration and weight at a glance." }] }),
  component: Dashboard,
});

function Dashboard() {
  const { goals } = useGoals();
  const g = goals ?? GOALS_FALLBACK;
  const { totals, entries } = useFoodLog();
  const weekly = useWeeklyCalories();
  const { today: waterToday } = useWaterLog();

  useWebMCP({
    name: "get_today_nutrition",
    description: "Read today's consumed calories, protein, carbs, fat and water glasses against the user's daily goals, as shown on the dashboard.",
    annotations: { readOnlyHint: true },
    execute: () => runWebMCPTool("get_today_nutrition", () =>
      `Calories ${Math.round(totals.cal)}/${g.calories} kcal · Protein ${Math.round(totals.prot)}/${g.protein} g · Carbs ${Math.round(totals.carb)}/${g.carbs} g · Fat ${Math.round(totals.fat)}/${g.fats} g · Water ${waterToday} glass(es)`),
  });

  const consumed = {
    calories: totals.cal,
    protein: totals.prot,
    carbs: totals.carb,
    fats: totals.fat,
    waterGlasses: waterToday,
  };

  const mealDist = [
    { meal: "Breakfast", cal: totals.bySlot.breakfast },
    { meal: "Lunch", cal: totals.bySlot.lunch },
    { meal: "Snacks", cal: totals.bySlot.snack },
    { meal: "Dinner", cal: totals.bySlot.dinner },
  ];

  const macroProgress = [
    { name: "Cal", value: Math.round((consumed.calories / Math.max(g.calories, 1)) * 100), fill: "var(--teal)" },
    { name: "Pro", value: Math.round((consumed.protein / Math.max(g.protein, 1)) * 100), fill: "var(--emerald)" },
    { name: "Carb", value: Math.round((consumed.carbs / Math.max(g.carbs, 1)) * 100), fill: "var(--ocean)" },
    { name: "Fat", value: Math.round((consumed.fats / Math.max(g.fats, 1)) * 100), fill: "var(--gold)" },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title={goals ? `Welcome back, ${goals.name}` : "Today's Nutrition"}
        subtitle="Track your daily intake, hydration and progress — personalized to your goals."
        actions={
          <Link to="/food-log" className="inline-flex items-center gap-1.5 rounded-full gradient-primary text-primary-foreground text-sm font-semibold px-5 py-2.5 glow-primary">
            <Plus className="size-4" /> Log food
          </Link>
        }
      />

      {/* Macro rings */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {([
          { v: consumed.calories, max: g.calories, label: "Calories", unit: "kcal", color: "var(--teal)" },
          { v: consumed.protein, max: g.protein, label: "Protein", unit: "g", color: "var(--emerald)" },
          { v: consumed.carbs, max: g.carbs, label: "Carbs", unit: "g", color: "var(--ocean)" },
          { v: consumed.fats, max: g.fats, label: "Fats", unit: "g", color: "var(--gold)" },
        ]).map((m) => (
          <div
            key={m.label}
            className="glass rounded-2xl p-5 flex flex-col items-center animate-fade-in"
          >
            <MacroRing value={m.v} max={m.max} label={m.label} unit={m.unit} color={m.color} size={150} />
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <GlassCard className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display text-lg font-semibold">Weekly calories</h3>
              <p className="text-xs text-muted-foreground">Last 7 days · trending up</p>
            </div>
            <div className="inline-flex items-center gap-1.5 text-xs text-good"><TrendingUp className="size-3.5" /> +6%</div>
          </div>
          <div className="h-64">
            <ResponsiveContainer>
              <AreaChart data={weekly} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--teal)" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="var(--teal)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="d" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--popover-foreground)" }} />
                <Area type="monotone" dataKey="cal" stroke="var(--teal)" strokeWidth={2.5} fill="url(#g1)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard>
          <h3 className="font-display text-lg font-semibold mb-2">Macro progress</h3>
          <p className="text-xs text-muted-foreground mb-2">% of daily goal</p>
          <div className="h-56">
            <ResponsiveContainer>
              <RadialBarChart innerRadius="30%" outerRadius="100%" data={macroProgress} startAngle={90} endAngle={-270}>
                <RadialBar background={{ fill: "var(--border)" }} dataKey="value" cornerRadius={10} />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {macroProgress.map((m) => (
              <div key={m.name} className="flex items-center gap-2 text-xs">
                <span className="size-2.5 rounded-full" style={{ background: m.fill }} />
                <span className="text-muted-foreground">{m.name}</span>
                <span className="ml-auto font-mono">{m.value}%</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Bottom row: meals, water, weight */}
      <div className="mb-6">
        <HealthAlerts />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <GlassCard>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-lg font-semibold">Today by meal</h3>
            <Flame className="size-4 text-coral" />
          </div>
          <div className="h-44">
            <ResponsiveContainer>
              <BarChart data={mealDist}>
                <XAxis dataKey="meal" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis hide />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--popover-foreground)" }} />
                <Bar dataKey="cal" radius={[10, 10, 0, 0]} fill="var(--ocean)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-lg font-semibold">Water</h3>
            <Droplet className="size-4 text-ocean" />
          </div>
          <div className="font-display text-4xl font-bold">{consumed.waterGlasses}<span className="text-lg font-normal text-muted-foreground">/{g.waterGlasses} glasses</span></div>
          <div className="flex gap-1.5 mt-4 flex-wrap">
            {Array.from({ length: g.waterGlasses }).map((_, i) => (
              <div key={i} className={`size-7 rounded-lg border ${i < consumed.waterGlasses ? "gradient-ocean border-transparent" : "border-white/10 bg-white/5"}`} />
            ))}
          </div>
          <Link to="/water" className="mt-4 inline-flex text-xs text-primary hover:underline">Open water tracker →</Link>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-lg font-semibold">Weight</h3>
            <Scale className="size-4 text-emerald" />
          </div>
          <div className="font-display text-4xl font-bold">{g.weightKg}<span className="text-lg font-normal text-muted-foreground"> kg</span></div>
          <div className="text-xs text-good mt-1">Target {g.targetWeightKg} kg · {(g.weightKg - g.targetWeightKg).toFixed(1)} kg to go</div>
          <div className="h-20 mt-3">
            <ResponsiveContainer>
              <AreaChart data={[73.6,73.4,73.1,72.9,72.7,72.5,72.4].map((w,i)=>({i,w}))}>
                <defs>
                  <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--emerald)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--emerald)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="w" stroke="var(--emerald)" strokeWidth={2} fill="url(#g2)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      {/* Recipe suggestions */}
      <div className="mt-10 mb-6">
        <GlassCard>
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-primary inline-flex items-center gap-1.5"><Flame className="size-3.5" /> Today's logged foods</div>
              <h2 className="mt-1 font-display text-2xl font-bold">{entries.length} item{entries.length === 1 ? "" : "s"}</h2>
            </div>
            <Link to="/food-log" className="text-sm text-primary hover:underline">Log more →</Link>
          </div>
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing logged yet today. Head to Food Log and tap "Add to log" on any dish.</p>
          ) : (
            <ul className="divide-y divide-border">
              {entries.slice().reverse().map((e) => (
                <li key={e.id} className="py-3 flex items-center gap-3">
                  <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full bg-secondary text-secondary-foreground">{e.slot}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{e.name}</div>
                    <div className="text-[11px] text-muted-foreground">{e.cal} kcal · {e.prot}g P · {e.carb}g C · {e.fat}g F</div>
                  </div>
                  <button onClick={() => { removeFromLog(e.id); toast.message("Removed from log"); }}
                    className="size-8 rounded-lg hover:bg-secondary inline-flex items-center justify-center text-muted-foreground hover:text-bad">
                    <Trash2 className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>
      </div>

      <div className="flex items-end justify-between mb-4 mt-10">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-primary inline-flex items-center gap-1.5"><Sparkles className="size-3.5" /> AI picks for you</div>
          <h2 className="mt-2 font-display text-2xl font-bold">Recipe suggestions</h2>
        </div>
        <Link to="/recipes" className="text-sm text-primary hover:underline">View all →</Link>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {FOODS.slice(0, 4).map((f) => <FoodCard key={f.id} food={f} />)}
      </div>
    </div>
  );
}