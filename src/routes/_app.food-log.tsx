import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Trash2, Flame, Sparkles, Loader2, Plus } from "lucide-react";
import { PageHeader, GlassCard } from "@/components/page-header";
import { FOODS } from "@/data/foods";
import { FoodCard } from "@/components/food-card";
import { VoiceInput } from "@/components/voice-input";
import { addFoodToLog, addCustomToLog, removeFromLog, useFoodLog, type LogSlot, type CustomFoodInput } from "@/lib/food-log";
import { toast } from "sonner";
import { useWebMCP } from "use-webmcp-tool";
import { runWebMCPTool } from "@/lib/webmcp-telemetry";
import type { Food } from "@/data/foods";

// Shared with the browser agent tools; the UI search box calls this via useMemo.
function searchFoods(rawQuery: string, limit = 60) {
  const query = rawQuery.trim().toLowerCase();
  if (!query) {
    const top = [...FOODS].sort((a, b) => b.score - a.score).slice(0, limit);
    return { results: top, total: FOODS.length };
  }
  const tokens = query.split(/\s+/).filter(Boolean);
  const scored: { f: Food; rank: number }[] = [];
  for (const f of FOODS) {
    const name = f.name.toLowerCase();
    const region = f.region.toLowerCase();
    const ing = f.ingredients.toLowerCase();
    let rank = 0;
    if (name === query) rank += 1000;
    if (name.startsWith(query)) rank += 400;
    if (name.includes(query)) rank += 200;
    if (region.includes(query)) rank += 60;
    if (ing.includes(query)) rank += 40;
    for (const t of tokens) {
      if (name.includes(t)) rank += 25;
      else if (ing.includes(t)) rank += 8;
      else if (region.includes(t)) rank += 5;
      else { rank = 0; break; }
    }
    if (rank > 0) scored.push({ f, rank: rank + f.score / 10 });
  }
  scored.sort((a, b) => b.rank - a.rank);
  return { results: scored.slice(0, limit).map((s) => s.f), total: scored.length };
}

const SLOTS: LogSlot[] = ["breakfast", "lunch", "snack", "dinner"];

export const Route = createFileRoute("/_app/food-log")({
  head: () => ({ meta: [{ title: "Food Log · NutriAI" }, { name: "description", content: "Search any dish, log it instantly with voice, and see AI-powered health scores." }] }),
  component: FoodLog,
});

function FoodLog() {
  const [q, setQ] = useState("");
  const [slot, setSlot] = useState<LogSlot | "auto">("auto");
  const [aiText, setAiText] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [aiItems, setAiItems] = useState<CustomFoodInput[]>([]);
  const [aiTotals, setAiTotals] = useState<{ cal: number; prot: number; carb: number; fat: number; fiber: number } | null>(null);
  const { entries, totals } = useFoodLog();
  const LIMIT = 60;
  const { results, total } = useMemo(() => searchFoods(q, LIMIT), [q]);

  // Shared log action: used by the FoodCard buttons and the browser agent tool.
  const logDish = (food: Food, chosenSlot?: LogSlot) => {
    addFoodToLog(food, chosenSlot);
    toast.success(`${food.name} logged in`);
  };

  useWebMCP({
    name: "search_dishes",
    description: "Search the 870-dish NutriAI food database by name, ingredient or region and return the best matches with calories, macros and health score. Use before logging a dish.",
    annotations: { readOnlyHint: true, untrustedContentHint: true },
    inputSchema: {
      type: "object",
      properties: { query: { type: "string", description: "Dish name, ingredient or region, e.g. 'biryani' or 'paneer'." } },
      required: ["query"],
    },
    execute: ({ query }) => runWebMCPTool("search_dishes", () => {
      const found = searchFoods(String(query), 15);
      if (!found.results.length) return `No dishes match "${query}".`;
      return `${found.total} match(es), showing top ${found.results.length}:\n` +
        found.results.map((f) => `${f.name} — ${Math.round(f.cal)} kcal, ${Math.round(f.prot)}g protein, ${Math.round(f.carb)}g carbs, ${Math.round(f.fat)}g fat, health score ${f.score}`).join("\n");
    }),
  });

  useWebMCP({
    name: "log_dish",
    description: "Log one serving of a dish that is currently shown in the food-log search results to today's log.",
    annotations: { untrustedContentHint: true },
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Dish name exactly as shown in the search results." },
        slot: { type: "string", enum: ["breakfast", "lunch", "snack", "dinner"], description: "Meal slot; defaults to the current time of day." },
      },
      required: ["name"],
    },
    execute: ({ name, slot }) => runWebMCPTool("log_dish", () => {
      if (typeof name !== "string" || !name.trim()) throw new Error("Dish name is required.");
      let chosenSlot: LogSlot | undefined;
      if (slot !== undefined) {
        const found = SLOTS.find((s) => s === slot);
        if (!found) {
          throw new Error("Unknown meal slot; expected breakfast, lunch, snack or dinner.");
        }
        chosenSlot = found;
      }
      const needle = name.trim().toLowerCase();
      const exact = results.filter((f) => f.name.toLowerCase() === needle);
      const matches = exact.length ? exact : results.filter((f) => f.name.toLowerCase().includes(needle));
      if (!matches.length) throw new Error(`"${name}" is not in the current search results. Search for it first.`);
      if (matches.length > 1) throw new Error(`"${name}" matches ${matches.length} dishes on screen; be more specific.`);
      logDish(matches[0], chosenSlot);
      return `Logged "${matches[0].name}" (${Math.round(matches[0].cal)} kcal) to today's log.`;
    }),
  });

  useWebMCP({
    name: "list_today_log",
    description: "List today's logged foods with their meal slot, calories and macros, as shown on the food log page.",
    annotations: { readOnlyHint: true, untrustedContentHint: true },
    execute: () => runWebMCPTool("list_today_log", () =>
      entries.length === 0
        ? "Nothing logged yet today."
        : entries.map((e) => `${e.slot}: ${e.name} — ${e.cal} kcal, ${e.prot}g protein, ${e.carb}g carbs, ${e.fat}g fat`).join("\n")),
  });


  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Food Search"
        subtitle="Type or speak the name of any dish. Tap Add to log it instantly."
      />

      {/* Today summary */}
      <div className="grid sm:grid-cols-4 gap-3 mb-6">
        {[
          { k: "Calories", v: totals.cal, u: "kcal", c: "text-teal" },
          { k: "Protein", v: totals.prot, u: "g", c: "text-emerald" },
          { k: "Carbs", v: totals.carb, u: "g", c: "text-ocean" },
          { k: "Fat", v: totals.fat, u: "g", c: "text-gold" },
        ].map((m) => (
          <div key={m.k} className="glass rounded-2xl p-4">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Today · {m.k}</div>
            <div className={`font-display text-2xl font-bold mt-1 ${m.c}`}>{m.v}<span className="text-xs font-normal text-muted-foreground ml-1">{m.u}</span></div>
          </div>
        ))}
      </div>

      {/* AI free-text meal analyzer */}
      <GlassCard className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="size-4 text-primary" />
          <h3 className="font-display text-lg font-semibold">Describe your meal</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-3">Type or speak anything — "2 rotis, dal and salad" — AI will estimate nutrients.</p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={aiText}
            onChange={(e) => setAiText(e.target.value)}
            placeholder="e.g. 2 idlis with sambar and coconut chutney"
            className="flex-1 bg-foreground/5 rounded-xl px-3 py-2 text-sm border border-border outline-none"
          />
          <VoiceInput onTranscript={(t) => setAiText(t)} />
          <button
            type="button"
            disabled={!aiText.trim() || aiBusy}
            onClick={async () => {
              setAiBusy(true); setAiItems([]);
              try {
                const r = await fetch("/api/analyze-food", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text: aiText }) });
                if (!r.ok) throw new Error(await r.text());
                const j = await r.json() as { items: CustomFoodInput[]; total_nutrition?: { cal: number; prot: number; carb: number; fat: number; fiber: number } };
                const items = j.items ?? [];
                setAiItems(items);
                const t = j.total_nutrition ?? items.reduce((a, i) => ({
                  cal: a.cal + i.cal, prot: a.prot + i.prot, carb: a.carb + i.carb, fat: a.fat + i.fat, fiber: a.fiber + i.fiber,
                }), { cal: 0, prot: 0, carb: 0, fat: 0, fiber: 0 });
                setAiTotals(items.length ? t : null);
                if (!items.length) toast.error("No items detected");
              } catch (e) { toast.error((e as Error).message || "AI error"); }
              finally { setAiBusy(false); }
            }}
            className="inline-flex items-center gap-1.5 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold px-4 py-2 disabled:opacity-50"
          >
            {aiBusy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />} Analyze
          </button>
        </div>
        {aiItems.length > 0 && (
          <>
          <ul className="mt-3 space-y-2">
            {aiItems.map((it, i) => (
              <li key={i} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-foreground/[0.03]">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{it.name}</div>
                  <div className="text-[11px] text-muted-foreground">{Math.round(it.cal)} kcal · {Math.round(it.prot)}g P · {Math.round(it.carb)}g C · {Math.round(it.fat)}g F · {Math.round(it.fiber)}g fiber</div>
                </div>
                <button
                  onClick={() => {
                    addCustomToLog(it, slot === "auto" ? undefined : slot);
                    toast.success(`${it.name} logged in`);
                    setAiItems((prev) => prev.filter((_, idx) => idx !== i));
                  }}
                  className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold gradient-primary text-primary-foreground">
                  <Plus className="size-3.5" /> Log
                </button>
              </li>
            ))}
          </ul>
          {aiTotals && (
            <div className="mt-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs uppercase tracking-[0.18em] text-primary font-semibold">Total meal nutrition</div>
                <button
                  onClick={() => {
                    const used = slot === "auto" ? undefined : slot;
                    aiItems.forEach((it) => addCustomToLog(it, used));
                    toast.success(`${aiItems.length} items logged in`);
                    setAiItems([]); setAiTotals(null);
                  }}
                  className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold gradient-primary text-primary-foreground">
                  <Plus className="size-3.5" /> Log all
                </button>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {[
                  { k: "Calories", v: aiTotals.cal, u: "kcal" },
                  { k: "Protein", v: aiTotals.prot, u: "g" },
                  { k: "Carbs", v: aiTotals.carb, u: "g" },
                  { k: "Fat", v: aiTotals.fat, u: "g" },
                  { k: "Fiber", v: aiTotals.fiber, u: "g" },
                ].map((m) => (
                  <div key={m.k} className="rounded-lg bg-background/60 px-2 py-2 text-center">
                    <div className="text-[9px] uppercase tracking-wider text-muted-foreground">{m.k}</div>
                    <div className="font-mono text-sm font-bold mt-0.5 text-foreground">{Math.round(m.v)}<span className="text-[10px] text-muted-foreground ml-0.5">{m.u}</span></div>
                  </div>
                ))}
              </div>
            </div>
          )}
          </>
        )}
      </GlassCard>

      <div className="glass-strong rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <div className="flex items-center gap-3 flex-1">
          <Search className="size-5 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Try 'biryani', 'palak paneer', 'idli'…"
            className="flex-1 bg-transparent outline-none text-base placeholder:text-muted-foreground"
          />
          <VoiceInput onTranscript={(t) => { setQ(t); toast.success(`Heard: "${t}"`); }} />
        </div>
        <select
          value={slot}
          onChange={(e) => setSlot(e.target.value as LogSlot | "auto")}
          className="bg-white/5 rounded-xl px-3 py-2 text-sm border border-white/10 outline-none"
        >
          <option value="auto">Auto slot</option>
          {SLOTS.map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
        </select>
      </div>

      <div className="text-xs uppercase tracking-[0.18em] text-primary mb-3 flex items-center justify-between">
        <span>{q.trim() ? `${total} match${total === 1 ? "" : "es"}` : `Top of ${total} dishes`}</span>
        {total > results.length && <span className="text-muted-foreground normal-case tracking-normal">Showing first {results.length}</span>}
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {results.map((f) => (
          <FoodCard key={f.id} food={f} onAdd={(food) => logDish(food, slot === "auto" ? undefined : slot)} />
        ))}
        {results.length === 0 && <div className="text-muted-foreground text-sm col-span-full">No dishes match "{q}".</div>}
      </div>

      {/* Today's log */}
      <div className="mt-10">
        <div className="flex items-end justify-between mb-3">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-primary inline-flex items-center gap-1.5"><Flame className="size-3.5" /> Today's log</div>
            <h2 className="mt-1 font-display text-2xl font-bold">{entries.length} item{entries.length === 1 ? "" : "s"} logged</h2>
          </div>
        </div>
        <GlassCard>
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing logged yet today. Tap "Add to log" on any dish above.</p>
          ) : (
            <ul className="divide-y divide-white/5">
              {entries.map((e) => (
                <li key={e.id} className="py-3 flex items-center gap-3">
                  <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full bg-white/5 text-muted-foreground">{e.slot}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{e.name}</div>
                    <div className="text-[11px] text-muted-foreground">{e.cal} kcal · {e.prot}g P · {e.carb}g C · {e.fat}g F</div>
                  </div>
                  <button onClick={() => { removeFromLog(e.id); toast.message("Removed from log"); }}
                    className="size-8 rounded-lg hover:bg-white/10 inline-flex items-center justify-center text-muted-foreground hover:text-bad">
                    <Trash2 className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>
      </div>
    </div>
  );
}