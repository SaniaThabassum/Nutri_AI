import { Plus, MapPin } from "lucide-react";
import type { Food } from "@/data/foods";
import { cn } from "@/lib/utils";

const BADGES = {
  good: { dot: "bg-emerald-500", label: "Healthy", chip: "bg-emerald-100 text-emerald-700", ring: "ring-emerald-200", stroke: "stroke-emerald-500" },
  warn: { dot: "bg-amber-500", label: "Moderate", chip: "bg-amber-100 text-amber-700", ring: "ring-amber-200", stroke: "stroke-amber-500" },
  bad: { dot: "bg-rose-500", label: "Caution", chip: "bg-rose-100 text-rose-700", ring: "ring-rose-200", stroke: "stroke-rose-500" },
} as const;

function Metric({ k, v, u, color }: { k: string; v: number | string; u?: string; color: string }) {
  return (
    <div className="rounded-xl bg-foreground/5 px-2 py-2 text-center">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{k}</div>
      <div className="mt-0.5">
        <span className={cn("font-mono text-base font-bold", color)}>{v}</span>
        {u && <span className="text-[10px] text-muted-foreground ml-0.5">{u}</span>}
      </div>
    </div>
  );
}

export function FoodCard({ food, onAdd }: { food: Food; onAdd?: (f: Food) => void }) {
  const b = BADGES[food.badge];
  const R = 26;
  const C = 2 * Math.PI * R;
  const dash = (food.score / 100) * C;
  return (
    <article className={cn("glass rounded-2xl ring-1 flex flex-col p-5 transition-transform duration-200 hover:-translate-y-1", b.ring)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-lg font-semibold leading-tight truncate">{food.name}</h3>
          <p className="text-xs text-muted-foreground mt-0.5 inline-flex items-center gap-1">
            <MapPin className="size-3" /> {food.region}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onAdd?.(food)}
          aria-label={`Add ${food.name} to log`}
          className="shrink-0 size-9 rounded-full gradient-primary text-primary-foreground inline-flex items-center justify-center hover:opacity-95 transition shadow"
        >
          <Plus className="size-4" />
        </button>
      </div>

      <p className="text-xs text-muted-foreground mt-3 line-clamp-2">{food.ingredients}</p>

      <div className="grid grid-cols-4 gap-2 mt-4">
        <Metric k="Cal" v={food.cal} u="kcal" color="text-rose-500" />
        <Metric k="Prot" v={food.prot} u="g" color="text-emerald-600" />
        <Metric k="Carb" v={food.carb} u="g" color="text-sky-500" />
        <Metric k="Fat" v={food.fat} u="g" color="text-amber-500" />
      </div>

      <div className="grid grid-cols-4 gap-2 mt-2">
        <Metric k="Fiber" v={food.fiber ?? 0} u="g" color="text-foreground" />
        <Metric k="Chol" v={food.chol ?? 0} u="mg" color="text-foreground" />
        <Metric k="Sodium" v={food.sodium ?? 0} u="mg" color="text-foreground" />
        <div className="rounded-xl flex items-center justify-center text-xs font-semibold text-emerald-600">/serving</div>
      </div>

      <div className="mt-4 pt-4 border-t border-foreground/10 flex items-start gap-4">
        <div className="relative shrink-0">
          <svg width="64" height="64" viewBox="0 0 64 64" className="-rotate-90">
            <circle cx="32" cy="32" r={R} className="stroke-foreground/10" strokeWidth="6" fill="none" />
            <circle
              cx="32" cy="32" r={R}
              className={b.stroke}
              strokeWidth="6"
              strokeLinecap="round"
              fill="none"
              strokeDasharray={`${dash} ${C}`}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center font-mono text-sm font-bold">{food.score}</div>
        </div>
        <div className="min-w-0 flex-1">
          <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold", b.chip)}>
            <span className={cn("size-1.5 rounded-full", b.dot)} />
            {b.label}
          </span>
          <ul className="mt-2 space-y-0.5">
            {food.reasons.slice(0, 3).map((r) => (
              <li key={r} className="text-[11px] text-muted-foreground flex gap-1.5"><span>•</span>{r}</li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  );
}