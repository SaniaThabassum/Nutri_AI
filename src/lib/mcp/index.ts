import { auth, defineMcp } from "@lovable.dev/mcp-js";
import searchFoods from "./tools/search-foods";
import logFood from "./tools/log-food";
import logCustomFood from "./tools/log-custom-food";
import listLog from "./tools/list-log";
import deleteLogEntry from "./tools/delete-log-entry";

// The OAuth issuer must be the direct Supabase host (not the .lovable.cloud
// proxy). VITE_SUPABASE_PROJECT_ID is inlined by Vite at build time; the
// fallback keeps the string well-formed during throwaway manifest evals.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "nutriai-mcp",
  title: "NutriAI",
  version: "0.1.0",
  instructions:
    "Tools for NutriAI, an AI-powered nutrition tracker. Use `search_foods` to look up dishes in the 870-entry Indian & global food database, then `log_food` with the returned id to add it to the signed-in user's log. Use `log_custom_food` for meals not in the database. `list_food_log` reads back entries with per-day and total calories/macros for a chosen date range. `delete_log_entry` removes a single entry. All tools act as the signed-in NutriAI user and are protected by row-level security.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [searchFoods, logFood, logCustomFood, listLog, deleteLogEntry],
});