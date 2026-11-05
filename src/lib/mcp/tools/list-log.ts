import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, notAuthed } from "../supabase";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function daysAgoISO(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

type Row = {
  id: string;
  name: string;
  slot: string;
  cal: number;
  prot: number;
  carb: number;
  fat: number;
  fiber: number;
  logged_at: string;
  log_date: string;
};

function summarize(rows: Row[]) {
  const byDate: Record<string, { cal: number; prot: number; carb: number; fat: number; fiber: number; count: number }> = {};
  const totals = { cal: 0, prot: 0, carb: 0, fat: 0, fiber: 0, count: rows.length };
  for (const r of rows) {
    totals.cal += r.cal; totals.prot += r.prot; totals.carb += r.carb; totals.fat += r.fat; totals.fiber += r.fiber;
    const b = byDate[r.log_date] ??= { cal: 0, prot: 0, carb: 0, fat: 0, fiber: 0, count: 0 };
    b.cal += r.cal; b.prot += r.prot; b.carb += r.carb; b.fat += r.fat; b.fiber += r.fiber; b.count += 1;
  }
  return { totals, byDate };
}

export default defineTool({
  name: "list_food_log",
  title: "List logged foods",
  description:
    "List the signed-in user's food-log entries for a date range and return per-day and overall totals. Defaults to today.",
  inputSchema: {
    days: z.number().int().optional().describe("Number of trailing days to include (1 = today, 7 = last week). Default 1. Ignored if `from`/`to` provided."),
    from: z.string().optional().describe("Inclusive start date, YYYY-MM-DD."),
    to: z.string().optional().describe("Inclusive end date, YYYY-MM-DD. Defaults to today."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ days, from, to }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthed();
    const end = to ?? todayISO();
    const start = from ?? daysAgoISO(Math.max(0, (days ?? 1) - 1));
    const sb = supabaseForUser(ctx);
    const { data, error } = await sb
      .from("food_logs")
      .select("id, name, slot, cal, prot, carb, fat, fiber, logged_at, log_date")
      .gte("log_date", start)
      .lte("log_date", end)
      .order("logged_at", { ascending: true });
    if (error) return { content: [{ type: "text", text: `Read failed: ${error.message}` }], isError: true };
    const rows = (data ?? []) as Row[];
    const summary = summarize(rows);
    const payload = { range: { from: start, to: end }, ...summary, entries: rows };
    return {
      content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
      structuredContent: payload,
    };
  },
});