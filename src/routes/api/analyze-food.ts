import { createFileRoute } from "@tanstack/react-router";
import { generateText, Output, NoObjectGeneratedError } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const SYSTEM = `You are a nutrition estimator for Indian and global meals.

PARSING RULES — split the meal into individual food items:
- Break on connectors: "with", "and", ",", "plus", "&".
- Detect quantity words: numerals (1, 2, 3), words (one, two, three, half, quarter),
  and units (bowl, cup, plate, glass, serving, piece, slice, katori, roti, chapati, idli, dosa).
- Emit ONE item per distinct food. If the user says "2 idlis with sambar",
  emit { name: "Idli", quantity: 2, unit: "piece" } AND { name: "Sambar", quantity: 1, unit: "serving" }.
- If exact food isn't in your knowledge, ESTIMATE using standard Indian nutrition values. Never skip.

NUTRITION RULES:
- cal/prot/carb/fat/fiber are TOTALS for that item at the given quantity (already multiplied).
  e.g. 2 idlis → cal ≈ 140 (70 × 2), not 70.
- Metric units, integers or one decimal. No ranges, no strings.
- confidence 0..1 reflecting how sure you are.
- meal_type: one of breakfast, lunch, snack, dinner (best guess from items/time-of-day).

ALWAYS return valid JSON matching the schema. Never return prose.`;

// Keep schema flat & constraint-free — bounds live in the prompt.
const ItemSchema = z.object({
  name: z.string(),
  quantity: z.number(),
  unit: z.string(),
  cal: z.number(),
  prot: z.number(),
  carb: z.number(),
  fat: z.number(),
  fiber: z.number(),
});
const ResponseSchema = z.object({
  items: z.array(ItemSchema),
  meal_type: z.string(),
  confidence: z.number(),
});

type Item = z.infer<typeof ItemSchema>;

function tryParseJson(text: string): unknown {
  if (!text) return null;
  // Strip markdown fences and grab the first {...} block.
  const cleaned = text.replace(/```json|```/gi, "").trim();
  try { return JSON.parse(cleaned); } catch { /* try substring */ }
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start >= 0 && end > start) {
    try { return JSON.parse(cleaned.slice(start, end + 1)); } catch { /* fall through */ }
  }
  return null;
}

function coerceItems(raw: unknown): Item[] {
  const obj = raw as { items?: unknown[] } | null;
  const arr = Array.isArray(obj?.items) ? obj!.items : [];
  const out: Item[] = [];
  for (const it of arr) {
    const r = it as Record<string, unknown>;
    const qty = Number(r.quantity ?? 1) || 1;
    const item: Item = {
      name: String(r.name ?? "Food item"),
      quantity: qty,
      unit: String(r.unit ?? "serving"),
      cal: Math.max(0, Number(r.cal ?? 0) || 0),
      prot: Math.max(0, Number(r.prot ?? 0) || 0),
      carb: Math.max(0, Number(r.carb ?? 0) || 0),
      fat: Math.max(0, Number(r.fat ?? 0) || 0),
      fiber: Math.max(0, Number(r.fiber ?? 0) || 0),
    };
    out.push(item);
  }
  return out;
}

function totals(items: Item[]) {
  return items.reduce((t, i) => ({
    cal: t.cal + i.cal, prot: t.prot + i.prot, carb: t.carb + i.carb,
    fat: t.fat + i.fat, fiber: t.fiber + i.fiber,
  }), { cal: 0, prot: 0, carb: 0, fat: 0, fiber: 0 });
}

export const Route = createFileRoute("/api/analyze-food")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { text } = (await request.json()) as { text?: string };
        if (!text || !text.trim()) return new Response("text required", { status: 400 });
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });
        const gw = createLovableAiGatewayProvider(key);
        const model = gw("google/gemini-3-flash-preview");
        const prompt = `Meal description: "${text}".
Split into individual items with per-item TOTAL nutrients (already multiplied by quantity).
Include every food mentioned. Estimate unknowns.`;

        let items: Item[] = [];
        let meal_type = "snack";
        let confidence = 0.6;

        try {
          const { output } = await generateText({
            model,
            system: SYSTEM,
            prompt,
            output: Output.object({ schema: ResponseSchema }),
          });
          items = coerceItems(output);
          meal_type = (output as { meal_type?: string }).meal_type ?? meal_type;
          confidence = (output as { confidence?: number }).confidence ?? confidence;
        } catch (err) {
          // Fallback: parse raw model text so the user always gets a response.
          if (NoObjectGeneratedError.isInstance(err)) {
            const parsed = tryParseJson(err.text ?? "");
            items = coerceItems(parsed);
            const p = parsed as { meal_type?: string; confidence?: number } | null;
            meal_type = p?.meal_type ?? meal_type;
            confidence = p?.confidence ?? 0.4;
          } else {
            // Non-schema errors: try one more shot in plain-JSON mode.
            try {
              const { text: raw } = await generateText({
                model,
                system: SYSTEM + "\nReturn ONLY minified JSON, no prose, no code fences.",
                prompt,
              });
              items = coerceItems(tryParseJson(raw));
            } catch { /* still empty */ }
          }
        }

        // Last-resort fallback so we never return an error to the client.
        if (items.length === 0) {
          items = [{
            name: text.trim().slice(0, 60),
            quantity: 1, unit: "serving",
            cal: 200, prot: 6, carb: 30, fat: 6, fiber: 2,
          }];
          confidence = 0.2;
        }

        return Response.json({
          items,
          meal_items: items,
          nutrition_per_item: items,
          total_nutrition: totals(items),
          meal_type,
          confidence_score: confidence,
          timestamp: new Date().toISOString(),
        });
      },
    },
  },
});