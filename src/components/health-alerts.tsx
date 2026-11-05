import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { GlassCard } from "@/components/page-header";
import { useFoodLog } from "@/lib/food-log";
import { useGoals, GOALS_FALLBACK } from "@/lib/goals";

type Alert = { level: "good" | "warn" | "bad"; title: string; detail: string };

export function HealthAlerts() {
  const { goals } = useGoals();
  const g = goals ?? GOALS_FALLBACK;
  const { totals, entries } = useFoodLog();

  const alerts: Alert[] = [];
  if (entries.length === 0) {
    alerts.push({ level: "warn", title: "No meals logged yet", detail: "Log breakfast to start tracking." });
  } else {
    const pctCal = totals.cal / g.calories;
    const pctProt = totals.prot / g.protein;
    const pctFat = totals.fat / g.fats;
    if (pctCal > 1.1) alerts.push({ level: "bad", title: "Excess calories", detail: `${totals.cal} / ${g.calories} kcal — over by ${totals.cal - g.calories}.` });
    else if (pctCal < 0.6 && new Date().getHours() >= 18) alerts.push({ level: "warn", title: "Low calorie day", detail: `Only ${totals.cal} kcal — consider a balanced dinner.` });
    if (pctProt < 0.6) alerts.push({ level: "warn", title: "Low protein intake", detail: `${totals.prot}g of ${g.protein}g target. Try dal, paneer, chicken or eggs.` });
    else if (pctProt >= 0.9) alerts.push({ level: "good", title: "Protein on track", detail: `${totals.prot}g — great job hitting your protein goal.` });
    if (totals.fiber < 20) alerts.push({ level: "warn", title: "Low fiber", detail: `${totals.fiber}g today. Add veggies, fruit or whole grains.` });
    if (pctFat > 1.2) alerts.push({ level: "bad", title: "High fat intake", detail: `${totals.fat}g vs ${g.fats}g target. Ease up on fried items.` });
  }
  if (alerts.length === 0) alerts.push({ level: "good", title: "Balanced day so far", detail: "Macros are within range. Keep it up." });

  return (
    <GlassCard>
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-primary inline-flex items-center gap-1.5"><AlertTriangle className="size-3.5" /> AI health alerts</div>
          <h3 className="mt-1 font-display text-lg font-semibold">Today's insights</h3>
        </div>
      </div>
      <ul className="space-y-2">
        {alerts.map((a, i) => {
          const Icon = a.level === "good" ? CheckCircle2 : a.level === "bad" ? AlertTriangle : Info;
          const color = a.level === "good" ? "text-good" : a.level === "bad" ? "text-bad" : "text-gold";
          return (
            <li key={i} className="flex gap-3 p-3 rounded-xl bg-foreground/[0.03] border border-border">
              <Icon className={`size-4 mt-0.5 shrink-0 ${color}`} />
              <div className="min-w-0">
                <div className="text-sm font-medium">{a.title}</div>
                <div className="text-xs text-muted-foreground">{a.detail}</div>
              </div>
            </li>
          );
        })}
      </ul>
    </GlassCard>
  );
}