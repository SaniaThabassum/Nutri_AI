import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, notAuthed } from "../supabase";

export default defineTool({
  name: "delete_log_entry",
  title: "Delete a food-log entry",
  description: "Remove a single food-log entry by its id. Get ids from `list_food_log`.",
  inputSchema: {
    id: z.string().describe("Food-log entry id (UUID) returned by list_food_log."),
  },
  annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ id }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthed();
    const sb = supabaseForUser(ctx);
    const { error, count } = await sb.from("food_logs").delete({ count: "exact" }).eq("id", id);
    if (error) return { content: [{ type: "text", text: `Delete failed: ${error.message}` }], isError: true };
    if (!count) return { content: [{ type: "text", text: `No entry found for id ${id}.` }], isError: true };
    return { content: [{ type: "text", text: `Deleted entry ${id}.` }], structuredContent: { id, deleted: true } };
  },
});