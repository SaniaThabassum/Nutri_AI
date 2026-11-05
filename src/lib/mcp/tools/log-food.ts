import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { FOODS } from "@/data/foods";
import { supabaseForUser, notAuthed } from "../supabase";

const SLOTS = ["breakfast", "lunch", "snack", "dinner"] as const;

function inferSlot(): (typeof SLOTS)[number] {
  const h = new Date().getHours();
  if (h < 11) return "breakfast";
  if (h < 15) return "lunch";
  if (h < 18) return "snack";
  return "dinner";
}

export default defineTool({
  name: "log_food",
  title: "Log a food from the database",
  description:
    "Log a serving of a dish from the NutriAI database to the signed-in user's food log. Uses the food's built-in nutrition. Get valid `food_id` values from `search_foods`.",
  inputSchema: {
    food_id: z.string().describe("Food id returned by search_foods."),
    servings: z.number().optional().describe("Number of servings. Default 1."),
    slot: z.enum(SLOTS).optional().describe("Meal slot. Defaults to time-of-day."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  handler: async ({ food_id, servings, slot }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthed();
    const food = FOODS.find((f) => f.id === food_id);
    if (!food) return { content: [{ type: "text", text: `Unknown food_id: ${food_id}` }], isError: true };
    const mult = Math.max(0.1, Number(servings ?? 1) || 1);
    const now = new Date();
    const client_id = `mcp-${now.getTime()}-${Math.random().toString(36).slice(2, 7)}`;
    const row = {
      user_id: ctx.getUserId()!,
      user_email: ctx.getUserEmail() ?? null,
      client_id,
      food_id: food.id,
      name: food.name,
      slot: slot ?? inferSlot(),
      cal: Math.round(food.cal * mult),
      prot: Math.round(food.prot * mult),
      carb: Math.round(food.carb * mult),
      fat: Math.round(food.fat * mult),
      fiber: Math.round(food.fiber * mult),
      logged_at: now.toISOString(),
      log_date: now.toISOString().slice(0, 10),
    };
    const sb = supabaseForUser(ctx);
    const { data, error } = await sb.from("food_logs").insert(row).select().single();
    if (error) return { content: [{ type: "text", text: `Log failed: ${error.message}` }], isError: true };
    return {
      content: [{ type: "text", text: `Logged ${mult}× ${food.name} (${row.cal} kcal) to ${row.slot}.` }],
      structuredContent: { entry: data },
    };
  },
});