import { createFileRoute } from "@tanstack/react-router";
import { Trophy, Flame, Droplets, Apple, Target, Zap, Award, Star } from "lucide-react";
import { PageHeader } from "@/components/page-header";

export const Route = createFileRoute("/_app/achievements")({
  head: () => ({ meta: [{ title: "Achievements · NutriAI" }, { name: "description", content: "Streaks, badges and milestones that celebrate consistency." }] }),
  component: Achievements,
});

const BADGES = [
  { Icon: Flame, name: "12-day streak", desc: "Logged every day for 12 days", earned: true },
  { Icon: Droplets, name: "Hydration hero", desc: "Hit water goal 7 days running", earned: true },
  { Icon: Apple, name: "Macro master", desc: "All macros within 10% of target", earned: true },
  { Icon: Target, name: "Goal crusher", desc: "Reach your weight target", earned: false },
  { Icon: Zap, name: "Voice ninja", desc: "Log 25 meals by voice", earned: true },
  { Icon: Award, name: "First milestone", desc: "Lose 1 kg", earned: true },
  { Icon: Star, name: "Perfect week", desc: "All targets hit for 7 days", earned: false },
  { Icon: Trophy, name: "Marathon", desc: "100-day streak", earned: false },
];

function Achievements() {
  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader title="Achievements" subtitle="The little wins add up. Keep showing up." />
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {BADGES.map((b) => (
          <div
            key={b.name}
            className={`glass rounded-2xl p-6 text-center animate-fade-in ${b.earned ? "" : "opacity-50"}`}
          >
            <div className={`size-16 mx-auto rounded-2xl flex items-center justify-center ${b.earned ? "gradient-primary glow-primary animate-breathe" : "bg-white/5"}`}>
              <b.Icon className={`size-8 ${b.earned ? "text-primary-foreground" : "text-muted-foreground"}`} />
            </div>
            <div className="font-display text-base font-semibold mt-4">{b.name}</div>
            <div className="text-xs text-muted-foreground mt-1">{b.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}