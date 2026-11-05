import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { FOODS } from "@/data/foods";

export default defineTool({
  name: "search_foods",
  title: "Search NutriAI food database",
  description:
    "Search the built-in 870-dish nutrition database by name, ingredient, or region. Returns matching foods with id, per-serving calories and macros, and a health badge (good/warn/bad). Use the returned id with `log_food`.",
  inputSchema: {
    query: z.string().describe("Free-text query. Matches food name, ingredients, and region."),
    limit: z.number().int().optional().describe("Max results. Default 15, hard-capped to 50."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ query, limit }) => {
    const q = query.trim().toLowerCase();
    if (!q) return { content: [{ type: "text", text: "Query is empty." }], isError: true };
    const tokens = q.split(/\s+/).filter(Boolean);
    const scored = FOODS.map((f) => {
      const hay = `${f.name} ${f.ingredients} ${f.region}`.toLowerCase();
      let score = 0;
      for (const t of tokens) {
        if (!hay.includes(t)) return { f, score: -1 };
        if (f.name.toLowerCase().includes(t)) score += 5;
        if (f.ingredients.toLowerCase().includes(t)) score += 2;
        if (f.region.toLowerCase().includes(t)) score += 1;
      }
      return { f, score };
    })
      .filter((r) => r.score >= 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, Math.min(50, Math.max(1, limit ?? 15)))
      .map(({ f }) => ({
        id: f.id,
        name: f.name,
        region: f.region,
        cal: f.cal,
        prot: f.prot,
        carb: f.carb,
        fat: f.fat,
        fiber: f.fiber,
        badge: f.badge,
      }));
    return {
      content: [{ type: "text", text: JSON.stringify({ count: scored.length, results: scored }, null, 2) }],
      structuredContent: { count: scored.length, results: scored },
    };
  },
});