import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { FOODS } from "@/data/foods";
import { FoodCard } from "@/components/food-card";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/recipes")({
  head: () => ({ meta: [{ title: "Recipes · NutriAI" }, { name: "description", content: "AI-curated recipes matched to your remaining macros and preferences." }] }),
  component: Recipes,
});

function Recipes() {
  const [q, setQ] = useState("");

  const visible = useMemo(() => {
    const query = q.trim().toLowerCase();
    const list = query
      ? FOODS.filter((f) => `${f.name} ${f.ingredients} ${f.region}`.toLowerCase().includes(query))
      : FOODS;
    return list.slice(0, 80);
  }, [q]);

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader title="Recipe Suggestions" subtitle="Curated by AI based on your goals, remaining macros and dietary preferences." />
      <div className="glass-strong rounded-2xl p-3 sm:p-4 flex items-center gap-3 mb-5">
        <Search className="size-5 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search all 870 recipes…"
          className="flex-1 bg-transparent outline-none text-base placeholder:text-muted-foreground"
        />
        <span className="text-xs text-muted-foreground whitespace-nowrap">Showing {visible.length}</span>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {visible.map((f) => <FoodCard key={f.id} food={f} onAdd={(food) => toast.success(`${food.name} saved`)} />)}
      </div>
      {visible.length === 80 && <p className="text-center text-xs text-muted-foreground mt-6">Search to narrow the full recipe dataset.</p>}
    </div>
  );
}