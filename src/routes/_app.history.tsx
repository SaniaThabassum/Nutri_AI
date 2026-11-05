import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Loader2 } from "lucide-react";
import { PageHeader, GlassCard } from "@/components/page-header";
import { supabase } from "@/integrations/supabase/client";

type Row = {
  id: string; name: string; slot: string; cal: number; prot: number;
  carb: number; fat: number; fiber: number; log_date: string; logged_at: string;
};

export const Route = createFileRoute("/_app/history")({
  head: () => ({ meta: [{ title: "Nutrition History · NutriAI" }, { name: "description", content: "Your past meals, daily totals and weekly nutrition history." }] }),
  component: History,
});

function History() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) { setLoading(false); return; }
      const since = new Date(); since.setDate(since.getDate() - 30);
      const { data } = await supabase
        .from("food_logs")
        .select("id,name,slot,cal,prot,carb,fat,fiber,log_date,logged_at")
        .gte("log_date", since.toISOString().slice(0, 10))
        .order("logged_at", { ascending: false });
      if (!alive) return;
      setRows((data as Row[] | null) ?? []);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, []);

  const byDay = useMemo(() => {
    const m = new Map<string, Row[]>();
    for (const r of rows) {
      const arr = m.get(r.log_date) ?? [];
      arr.push(r);
      m.set(r.log_date, arr);
    }
    return Array.from(m.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [rows]);

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader title="Nutrition history" subtitle="Every meal you've logged — synced to your account." />
      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Loading history…</div>
      ) : byDay.length === 0 ? (
        <GlassCard><p className="text-sm text-muted-foreground">No history yet. Log a meal in Food Log — it'll appear here across all your devices.</p></GlassCard>
      ) : (
        <div className="space-y-4">
          {byDay.map(([date, items]) => {
            const totals = items.reduce((a, r) => ({
              cal: a.cal + Number(r.cal), prot: a.prot + Number(r.prot),
              carb: a.carb + Number(r.carb), fat: a.fat + Number(r.fat), fiber: a.fiber + Number(r.fiber),
            }), { cal: 0, prot: 0, carb: 0, fat: 0, fiber: 0 });
            return (
              <GlassCard key={date}>
                <div className="flex items-center justify-between mb-3">
                  <div className="inline-flex items-center gap-2">
                    <CalendarDays className="size-4 text-primary" />
                    <div className="font-display text-lg font-semibold">{new Date(date).toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">{items.length} item{items.length === 1 ? "" : "s"}</div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
                  {[["Cal", totals.cal, "kcal"], ["Protein", totals.prot, "g"], ["Carbs", totals.carb, "g"], ["Fat", totals.fat, "g"], ["Fiber", totals.fiber, "g"]].map(([k, v, u]) => (
                    <div key={k as string} className="rounded-xl bg-foreground/[0.03] border border-border p-2">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{k as string}</div>
                      <div className="text-sm font-mono font-semibold">{Math.round(v as number)}<span className="text-muted-foreground text-[10px] ml-1">{u as string}</span></div>
                    </div>
                  ))}
                </div>
                <ul className="divide-y divide-border">
                  {items.map((r) => (
                    <li key={r.id} className="py-2 flex items-center gap-3 text-sm">
                      <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full bg-secondary text-secondary-foreground">{r.slot}</span>
                      <span className="flex-1 min-w-0 truncate">{r.name}</span>
                      <span className="text-xs text-muted-foreground">{Math.round(Number(r.cal))} kcal</span>
                    </li>
                  ))}
                </ul>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
}