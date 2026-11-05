import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, GlassCard } from "@/components/page-header";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend,
} from "recharts";

export const Route = createFileRoute("/_app/analytics")({
  head: () => ({ meta: [{ title: "Analytics · NutriAI" }, { name: "description", content: "Weekly trends, nutrient radar and meal heatmaps to understand your patterns." }] }),
  component: Analytics,
});

const TREND = Array.from({ length: 14 }, (_, i) => ({ d: `D${i + 1}`, cal: 1700 + Math.round(Math.sin(i) * 200 + i * 12) }));
const RADAR = [
  { axis: "Protein", you: 78, target: 100 },
  { axis: "Carbs", you: 72, target: 100 },
  { axis: "Fats", you: 69, target: 100 },
  { axis: "Fiber", you: 58, target: 100 },
  { axis: "Vitamins", you: 81, target: 100 },
  { axis: "Minerals", you: 64, target: 100 },
];

function Analytics() {
  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader title="Analytics" subtitle="Trends, distributions and nutrient density over the past two weeks." />

      <div className="grid lg:grid-cols-2 gap-4">
        <GlassCard>
          <h3 className="font-display text-lg font-semibold mb-3">Calorie trend (14 days)</h3>
          <div className="h-72">
            <ResponsiveContainer>
              <LineChart data={TREND}>
                <CartesianGrid stroke="var(--border)" />
                <XAxis dataKey="d" stroke="var(--muted-foreground)" fontSize={10} />
                <YAxis stroke="var(--muted-foreground)" fontSize={10} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12 }} />
                <Line type="monotone" dataKey="cal" stroke="var(--teal)" strokeWidth={2.5} dot={{ r: 3, fill: "var(--teal)" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard>
          <h3 className="font-display text-lg font-semibold mb-3">Nutrient radar</h3>
          <div className="h-72">
            <ResponsiveContainer>
              <RadarChart data={RADAR}>
                <PolarGrid stroke="oklch(1 0 0 / 10%)" />
                <PolarAngleAxis dataKey="axis" stroke="oklch(1 0 0 / 60%)" fontSize={11} />
                <PolarRadiusAxis stroke="transparent" />
                <Radar name="You" dataKey="you" stroke="var(--teal)" fill="var(--teal)" fillOpacity={0.35} />
                <Radar name="Target" dataKey="target" stroke="var(--ocean)" fill="var(--ocean)" fillOpacity={0.1} />
                <Legend wrapperStyle={{ color: "var(--popover-foreground)", fontSize: 12 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      <GlassCard className="mt-4">
        <h3 className="font-display text-lg font-semibold mb-3">Consistency heatmap</h3>
        <div className="grid grid-cols-14 gap-1.5" style={{ gridTemplateColumns: "repeat(14, minmax(0, 1fr))" }}>
          {Array.from({ length: 14 * 7 }).map((_, i) => {
            const intensity = (Math.sin(i * 0.7) + 1) / 2;
            return (
              <div
                key={i}
                className="aspect-square rounded-md"
                style={{ background: `oklch(0.78 0.16 175 / ${0.08 + intensity * 0.6})` }}
              />
            );
          })}
        </div>
      </GlassCard>
    </div>
  );
}