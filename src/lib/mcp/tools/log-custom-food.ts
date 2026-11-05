import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
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
  name: "log_custom_food",
  title: "Log a custom meal with nutrients",
  description:
    "Log a meal not present in the NutriAI database. Provide the food name and per-serving nutrients (calories, protein, carbs, fat, fiber). Written to the signed-in user's food log.",
  inputSchema: {
    name: z.string().describe("Name of the food or meal, e.g. '2 idlis with sambar'."),
    cal: z.number().describe("Total calories (kcal)."),
    prot: z.number().optional().describe("Protein grams. Default 0."),
    carb: z.number().optional().describe("Carbohydrate grams. Default 0."),
    fat: z.number().optional().describe("Fat grams. Default 0."),
    fiber: z.number().optional().describe("Fiber grams. Default 0."),
    slot: z.enum(SLOTS).optional().describe("Meal slot. Defaults to time-of-day."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  handler: async ({ name, cal, prot, carb, fat, fiber, slot }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthed();
    const now = new Date();
    const client_id = `mcp-${now.getTime()}-${Math.random().toString(36).slice(2, 7)}`;
    const row = {
      user_id: ctx.getUserId()!,
      user_email: ctx.getUserEmail() ?? null,
      client_id,
      food_id: `mcp-${client_id}`,
      name: name.trim(),
      slot: slot ?? inferSlot(),
      cal: Math.max(0, Math.round(cal)),
      prot: Math.max(0, Math.round(prot ?? 0)),
      carb: Math.max(0, Math.round(carb ?? 0)),
      fat: Math.max(0, Math.round(fat ?? 0)),
      fiber: Math.max(0, Math.round(fiber ?? 0)),
      logged_at: now.toISOString(),
      log_date: now.toISOString().slice(0, 10),
    };
    const sb = supabaseForUser(ctx);
    const { data, error } = await sb.from("food_logs").insert(row).select().single();
    if (error) return { content: [{ type: "text", text: `Log failed: ${error.message}` }], isError: true };
    return {
      content: [{ type: "text", text: `Logged '${row.name}' (${row.cal} kcal) to ${row.slot}.` }],
      structuredContent: { entry: data },
    };
  },
});