import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, RefreshCw, Loader2, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader, GlassCard } from "@/components/page-header";
import { useGoals, GOALS_FALLBACK, clearGoals, saveGoals, computeTargets } from "@/lib/goals";

export const Route = createFileRoute("/_app/profile")({
  head: () => ({ meta: [{ title: "Profile · NutriAI" }, { name: "description", content: "Your goals, preferences and account details." }] }),
  component: Profile,
});

const ACTIVITY_LABEL: Record<string, string> = {
  sedentary: "Sedentary",
  light: "Lightly active",
  moderate: "Moderately active",
  active: "Very active",
  athlete: "Athlete",
};

function Profile() {
  const { goals } = useGoals();
  const g = goals ?? GOALS_FALLBACK;
  const initial = (g.name || "?").trim().charAt(0).toUpperCase();

  const [heightInput, setHeightInput] = useState<string>(String(g.heightCm));
  const [weightInput, setWeightInput] = useState<string>(String(g.weightKg));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setHeightInput(String(g.heightCm));
    setWeightInput(String(g.weightKg));
  }, [g.heightCm, g.weightKg]);

  const heightNum = Number(heightInput);
  const weightNum = Number(weightInput);
  const heightEmpty = heightInput.trim() === "";
  const weightEmpty = weightInput.trim() === "";
  const heightError = heightEmpty
    ? "Height is required"
    : !Number.isFinite(heightNum)
      ? "Enter a valid number"
      : heightNum < 50 || heightNum > 300
        ? "Height must be between 50 and 300 cm"
        : "";
  const weightError = weightEmpty
    ? "Weight is required"
    : !Number.isFinite(weightNum)
      ? "Enter a valid number"
      : weightNum < 20 || weightNum > 500
        ? "Weight must be between 20 and 500 kg"
        : "";
  const heightValid = !heightError;
  const weightValid = !weightError;
  const dirty = heightNum !== g.heightCm || weightNum !== g.weightKg;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!heightValid) { toast.error("Height must be between 50 and 300 cm"); return; }
    if (!weightValid) { toast.error("Weight must be between 20 and 500 kg"); return; }
    setSaving(true);
    try {
      const targets = computeTargets({
        sex: g.sex, age: g.age, heightCm: heightNum, weightKg: weightNum,
        activity: g.activity, goal: g.goal,
      });
      saveGoals({
        ...g,
        heightCm: heightNum,
        weightKg: weightNum,
        ...targets,
        completedAt: g.completedAt || new Date().toISOString(),
      });
      // brief delay so loading state is visible
      await new Promise((r) => setTimeout(r, 200));
      toast.success("Profile updated");
    } catch (err) {
      toast.error("Could not save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const fields = [
    { label: "Name", value: g.name },
    { label: "Sex", value: g.sex.charAt(0).toUpperCase() + g.sex.slice(1) },
    { label: "Age", value: `${g.age}` },
    { label: "Target weight", value: `${g.targetWeightKg} kg` },
    { label: "Activity level", value: ACTIVITY_LABEL[g.activity] ?? g.activity },
    { label: "Goal", value: g.goal === "lose" ? "Lose weight" : g.goal === "gain" ? "Build muscle" : "Maintain" },
    { label: "Daily calorie goal", value: `${g.calories.toLocaleString()} kcal` },
    { label: "Protein goal", value: `${g.protein} g` },
    { label: "Carbs goal", value: `${g.carbs} g` },
    { label: "Fats goal", value: `${g.fats} g` },
    { label: "Water goal", value: `${g.waterGlasses} glasses` },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title="Profile"
        subtitle="Your goals, preferences and personal details."
        actions={
          <Link
            to="/onboarding"
            className="inline-flex items-center gap-1.5 rounded-full gradient-primary text-primary-foreground text-sm font-semibold px-5 py-2.5 glow-primary"
          >
            <Sparkles className="size-4" /> Update goals
          </Link>
        }
      />
      <div className="flex items-center gap-5 mb-6">
        <div className="size-20 rounded-2xl gradient-ocean flex items-center justify-center text-3xl font-bold glow-primary">{initial}</div>
        <div>
          <div className="font-display text-2xl font-bold">{g.name}</div>
          <div className="text-sm text-muted-foreground">
            {goals ? `Goals personalized · updated ${new Date(goals.completedAt).toLocaleDateString()}` : "Default plan · personalize for better insights"}
          </div>
        </div>
      </div>
      <GlassCard className="mb-6">
        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <div className="font-display text-lg font-semibold">Body metrics</div>
            <div className="text-xs text-muted-foreground">Update height or weight. Targets recalculate automatically.</div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Height (cm)</span>
              <input
                type="number"
                inputMode="decimal"
                min={50}
                max={300}
                step="0.1"
                value={heightInput}
                onChange={(e) => setHeightInput(e.target.value)}
                aria-invalid={!heightValid}
                aria-describedby="height-help"
                className={`mt-1.5 w-full rounded-xl bg-white/5 border px-4 py-2.5 text-sm focus:outline-none transition ${
                  !heightValid
                    ? "border-destructive/60 focus:border-destructive ring-1 ring-destructive/30"
                    : "border-white/10 focus:border-primary/50"
                }`}
              />
              <span
                id="height-help"
                className={`text-xs mt-1 block ${heightValid ? "text-muted-foreground" : "text-destructive"}`}
              >
                {heightValid ? "Allowed range: 50–300 cm" : heightError}
              </span>
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Weight (kg)</span>
              <input
                type="number"
                inputMode="decimal"
                min={20}
                max={500}
                step="0.1"
                value={weightInput}
                onChange={(e) => setWeightInput(e.target.value)}
                aria-invalid={!weightValid}
                aria-describedby="weight-help"
                className={`mt-1.5 w-full rounded-xl bg-white/5 border px-4 py-2.5 text-sm focus:outline-none transition ${
                  !weightValid
                    ? "border-destructive/60 focus:border-destructive ring-1 ring-destructive/30"
                    : "border-white/10 focus:border-primary/50"
                }`}
              />
              <span
                id="weight-help"
                className={`text-xs mt-1 block ${weightValid ? "text-muted-foreground" : "text-destructive"}`}
              >
                {weightValid ? "Allowed range: 20–500 kg" : weightError}
              </span>
            </label>
          </div>
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => { setHeightInput(String(g.heightCm)); setWeightInput(String(g.weightKg)); }}
              disabled={!dirty || saving}
              className="text-sm text-muted-foreground hover:text-foreground transition disabled:opacity-40"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={!dirty || !heightValid || !weightValid || saving}
              className="inline-flex items-center gap-1.5 rounded-full gradient-primary text-primary-foreground text-sm font-semibold px-5 py-2.5 glow-primary disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </GlassCard>
      <GlassCard>
        <div className="grid sm:grid-cols-2 gap-x-8 gap-y-5">
          {fields.map((f) => (
            <div key={f.label} className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="text-sm text-muted-foreground">{f.label}</div>
              <div className="text-sm font-medium">{f.value}</div>
            </div>
          ))}
        </div>
      </GlassCard>
      {goals && (
        <button
          type="button"
          onClick={() => { if (confirm("Reset all goals? You'll redo the onboarding.")) clearGoals(); }}
          className="mt-6 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition"
        >
          <RefreshCw className="size-3.5" /> Reset goals
        </button>
      )}
    </div>
  );
}