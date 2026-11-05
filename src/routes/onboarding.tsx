import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowRight, ArrowLeft, Sparkles, User, Activity, Target,
  Droplets, Scale, Check, Salad,
} from "lucide-react";
import {
  computeTargets, saveGoals,
  type ActivityLevel, type GoalType, type Sex,
} from "@/lib/goals";

export const Route = createFileRoute("/onboarding")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Set your goals · NutriAI" },
      { name: "description", content: "Personalize your calorie, macro, water and weight goals in a minute." },
    ],
  }),
  component: Onboarding,
});

type Form = {
  name: string;
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  activity: ActivityLevel;
  goal: GoalType;
  targetWeightKg: number;
  waterGlasses: number | null; // null = auto
  caloriesOverride: number | null;
};

const ACTIVITY_OPTIONS: { id: ActivityLevel; title: string; body: string }[] = [
  { id: "sedentary", title: "Sedentary", body: "Mostly sitting, little exercise" },
  { id: "light", title: "Lightly active", body: "Light walks 1–3 days/week" },
  { id: "moderate", title: "Moderately active", body: "Exercise 3–5 days/week" },
  { id: "active", title: "Very active", body: "Hard training 6–7 days/week" },
  { id: "athlete", title: "Athlete", body: "2x/day training, physical job" },
];

const GOAL_OPTIONS: { id: GoalType; title: string; body: string }[] = [
  { id: "lose", title: "Lose weight", body: "Gentle calorie deficit (~−500 kcal)" },
  { id: "maintain", title: "Maintain", body: "Stay healthy at your current weight" },
  { id: "gain", title: "Build muscle", body: "Calorie surplus (~+300 kcal) + protein" },
];

const STEPS = ["Welcome", "About you", "Activity", "Goal", "Hydration", "Review"] as const;

function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) navigate({ to: "/auth", replace: true, search: { next: undefined } });
    });
  }, [navigate]);
  const [form, setForm] = useState<Form>({
    name: "",
    sex: "female",
    age: 30,
    heightCm: 170,
    weightKg: 70,
    activity: "moderate",
    goal: "maintain",
    targetWeightKg: 68,
    waterGlasses: null,
    caloriesOverride: null,
  });

  const computed = useMemo(() => computeTargets(form), [form]);
  const calories = form.caloriesOverride ?? computed.calories;
  const water = form.waterGlasses ?? computed.waterGlasses;

  function patch<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function next() { setStep((s) => Math.min(STEPS.length - 1, s + 1)); }
  function back() { setStep((s) => Math.max(0, s - 1)); }

  function finish() {
    saveGoals({
      name: form.name.trim() || "Friend",
      sex: form.sex,
      age: form.age,
      heightCm: form.heightCm,
      weightKg: form.weightKg,
      activity: form.activity,
      goal: form.goal,
      targetWeightKg: form.targetWeightKg,
      calories,
      protein: computed.protein,
      carbs: computed.carbs,
      fats: computed.fats,
      waterGlasses: water,
      completedAt: new Date().toISOString(),
    });
    navigate({ to: "/dashboard" });
  }

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl gradient-primary flex items-center justify-center">
              <Salad className="size-5 text-primary-foreground" />
            </div>
            <div className="font-display text-lg font-bold tracking-tight">NutriAI</div>
          </div>
          <div className="text-xs text-muted-foreground font-mono">
            Step {step + 1} of {STEPS.length}
          </div>
        </div>

        {/* Progress */}
        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden mb-8">
          <div className="h-full gradient-primary transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>

        <div className="glass-strong rounded-3xl p-7 sm:p-10 animate-fade-in">
          {step === 0 && (
            <StepWelcome name={form.name} onChange={(v) => patch("name", v)} />
          )}
          {step === 1 && (
            <StepBody form={form} patch={patch} />
          )}
          {step === 2 && (
            <StepActivity value={form.activity} onChange={(v) => patch("activity", v)} />
          )}
          {step === 3 && (
            <StepGoal
              goal={form.goal}
              onGoal={(v) => patch("goal", v)}
              targetWeightKg={form.targetWeightKg}
              onTarget={(v) => patch("targetWeightKg", v)}
              currentWeight={form.weightKg}
              calories={calories}
              caloriesOverride={form.caloriesOverride}
              onCaloriesOverride={(v) => patch("caloriesOverride", v)}
              suggested={computed.calories}
            />
          )}
          {step === 4 && (
            <StepWater
              suggested={computed.waterGlasses}
              value={water}
              custom={form.waterGlasses !== null}
              onChange={(v) => patch("waterGlasses", v)}
            />
          )}
          {step === 5 && (
            <StepReview
              form={form}
              calories={calories}
              protein={computed.protein}
              carbs={computed.carbs}
              fats={computed.fats}
              waterGlasses={water}
            />
          )}

          {/* Footer nav */}
          <div className="mt-10 flex items-center justify-between">
            <button
              type="button"
              onClick={back}
              disabled={step === 0}
              className="inline-flex items-center gap-1.5 rounded-full glass text-foreground text-sm font-medium px-5 py-2.5 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="size-4" /> Back
            </button>
            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={next}
                className="inline-flex items-center gap-1.5 rounded-full gradient-primary text-primary-foreground text-sm font-semibold px-6 py-2.5 glow-primary"
              >
                Continue <ArrowRight className="size-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={finish}
                className="inline-flex items-center gap-1.5 rounded-full gradient-primary text-primary-foreground text-sm font-semibold px-6 py-2.5 glow-primary"
              >
                <Check className="size-4" /> Finish & open dashboard
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Your data stays on this device. You can update goals anytime from your profile.
        </p>
      </div>
    </div>
  );
}

/* ---------- Steps ---------- */

function StepHeader({ icon: Icon, eyebrow, title, subtitle }: { icon: typeof Sparkles; eyebrow: string; title: string; subtitle: string }) {
  return (
    <div className="mb-7">
      <div className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.18em] text-primary">
        <Icon className="size-3.5" /> {eyebrow}
      </div>
      <h2 className="mt-3 font-display text-3xl font-bold">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function StepWelcome({ name, onChange }: { name: string; onChange: (v: string) => void }) {
  return (
    <>
      <StepHeader
        icon={Sparkles}
        eyebrow="Welcome"
        title="Let's personalize NutriAI"
        subtitle="A minute of setup, and every chart, ring and recommendation will be tuned to you."
      />
      <label className="block">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">Your name</span>
        <input
          type="text"
          autoFocus
          value={name}
          onChange={(e) => onChange(e.target.value)}
          placeholder="e.g. Alex"
          className="mt-2 w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-base font-medium outline-none focus:border-primary/60 focus:bg-white/10 transition"
        />
      </label>
    </>
  );
}

function NumberField({ label, value, onChange, suffix, min, max, step = 1 }: {
  label: string; value: number; onChange: (v: number) => void;
  suffix: string; min: number; max: number; step?: number;
}) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="mt-2 flex items-center rounded-2xl bg-white/5 border border-white/10 focus-within:border-primary/60 focus-within:bg-white/10 transition">
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (!Number.isNaN(n)) onChange(Math.max(min, Math.min(max, n)));
          }}
          className="flex-1 bg-transparent px-4 py-3 text-base font-medium outline-none"
        />
        <span className="pr-4 text-sm text-muted-foreground">{suffix}</span>
      </div>
    </label>
  );
}

function StepBody({ form, patch }: { form: Form; patch: <K extends keyof Form>(k: K, v: Form[K]) => void }) {
  return (
    <>
      <StepHeader icon={User} eyebrow="About you" title="Tell us a bit about you" subtitle="We use this to estimate calories with the Mifflin–St Jeor formula." />
      <div className="grid grid-cols-2 gap-3 mb-5">
        {(["female", "male"] as Sex[]).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => patch("sex", s)}
            className={`rounded-2xl px-4 py-3 text-sm font-semibold border transition capitalize ${
              form.sex === s
                ? "border-primary/60 bg-primary/10 text-foreground glow-primary"
                : "border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10"
            }`}
          >
            {s}
          </button>
        ))}
      </div>
      <div className="grid sm:grid-cols-3 gap-3">
        <NumberField label="Age" value={form.age} onChange={(v) => patch("age", v)} suffix="yrs" min={13} max={100} />
        <NumberField label="Height" value={form.heightCm} onChange={(v) => patch("heightCm", v)} suffix="cm" min={120} max={230} />
        <NumberField label="Weight" value={form.weightKg} onChange={(v) => patch("weightKg", v)} suffix="kg" min={35} max={250} />
      </div>
    </>
  );
}

function StepActivity({ value, onChange }: { value: ActivityLevel; onChange: (v: ActivityLevel) => void }) {
  return (
    <>
      <StepHeader icon={Activity} eyebrow="Activity" title="How active are you?" subtitle="Pick the line that best matches an average week." />
      <div className="grid gap-2">
        {ACTIVITY_OPTIONS.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            className={`text-left rounded-2xl px-5 py-4 border transition ${
              value === o.id
                ? "border-primary/60 bg-primary/10 glow-primary"
                : "border-white/10 bg-white/5 hover:bg-white/10"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="font-semibold">{o.title}</div>
              {value === o.id && <Check className="size-4 text-primary" />}
            </div>
            <div className="text-xs text-muted-foreground mt-1">{o.body}</div>
          </button>
        ))}
      </div>
    </>
  );
}

function StepGoal(props: {
  goal: GoalType; onGoal: (v: GoalType) => void;
  targetWeightKg: number; onTarget: (v: number) => void;
  currentWeight: number;
  calories: number; suggested: number;
  caloriesOverride: number | null;
  onCaloriesOverride: (v: number | null) => void;
}) {
  const { goal, onGoal, targetWeightKg, onTarget, currentWeight, calories, suggested, caloriesOverride, onCaloriesOverride } = props;
  return (
    <>
      <StepHeader icon={Target} eyebrow="Goal" title="What's your main goal?" subtitle="We'll tune your calorie target and macro split for it." />
      <div className="grid sm:grid-cols-3 gap-2 mb-6">
        {GOAL_OPTIONS.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => onGoal(o.id)}
            className={`text-left rounded-2xl px-4 py-4 border transition ${
              goal === o.id ? "border-primary/60 bg-primary/10 glow-primary" : "border-white/10 bg-white/5 hover:bg-white/10"
            }`}
          >
            <div className="font-semibold text-sm">{o.title}</div>
            <div className="text-xs text-muted-foreground mt-1">{o.body}</div>
          </button>
        ))}
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <NumberField
          label="Target weight"
          value={targetWeightKg}
          onChange={onTarget}
          suffix="kg"
          min={35}
          max={250}
          step={0.5}
        />
        <NumberField
          label="Daily calories"
          value={calories}
          onChange={(v) => onCaloriesOverride(v === suggested ? null : v)}
          suffix="kcal"
          min={1200}
          max={5000}
          step={50}
        />
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>Suggested for you: <span className="font-mono text-foreground">{suggested.toLocaleString()} kcal</span> · {currentWeight} → {targetWeightKg} kg</span>
        {caloriesOverride !== null && (
          <button type="button" onClick={() => onCaloriesOverride(null)} className="text-primary hover:underline">Use suggestion</button>
        )}
      </div>
    </>
  );
}

function StepWater({ suggested, value, custom, onChange }: { suggested: number; value: number; custom: boolean; onChange: (v: number | null) => void }) {
  return (
    <>
      <StepHeader icon={Droplets} eyebrow="Hydration" title="Daily water goal" subtitle="One glass ≈ 250 ml. We've estimated this from your bodyweight." />
      <div className="rounded-3xl bg-white/5 border border-white/10 p-6 flex flex-col items-center">
        <div className="font-display text-6xl font-bold text-gradient-primary">{value}</div>
        <div className="text-xs uppercase tracking-wider text-muted-foreground mt-1">glasses · {(value * 250).toLocaleString()} ml</div>
        <div className="flex items-center gap-3 mt-5">
          <button type="button" onClick={() => onChange(Math.max(4, value - 1))} className="size-10 rounded-full glass flex items-center justify-center font-bold">−</button>
          <input
            type="range"
            min={4}
            max={16}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-48 accent-[var(--ocean)]"
          />
          <button type="button" onClick={() => onChange(Math.min(16, value + 1))} className="size-10 rounded-full glass flex items-center justify-center font-bold">+</button>
        </div>
        <div className="mt-4 text-xs text-muted-foreground">
          Suggested: <span className="font-mono text-foreground">{suggested} glasses</span>
          {custom && (
            <button type="button" onClick={() => onChange(null)} className="ml-3 text-primary hover:underline">Reset</button>
          )}
        </div>
      </div>
    </>
  );
}

function StepReview({ form, calories, protein, carbs, fats, waterGlasses }: {
  form: Form; calories: number; protein: number; carbs: number; fats: number; waterGlasses: number;
}) {
  return (
    <>
      <StepHeader icon={Scale} eyebrow="Review" title={`Here's your plan, ${form.name.trim() || "friend"}`} subtitle="You can update any of this later from your profile." />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { k: "Calories", v: `${calories.toLocaleString()}`, u: "kcal", c: "var(--teal)" },
          { k: "Protein", v: protein, u: "g", c: "var(--emerald)" },
          { k: "Carbs", v: carbs, u: "g", c: "var(--ocean)" },
          { k: "Fats", v: fats, u: "g", c: "var(--gold)" },
        ].map((m) => (
          <div key={m.k} className="rounded-2xl bg-white/5 border border-white/10 p-4">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{m.k}</div>
            <div className="font-display text-2xl font-bold mt-1" style={{ color: m.c }}>{m.v}</div>
            <div className="text-xs text-muted-foreground">{m.u} / day</div>
          </div>
        ))}
      </div>
      <div className="grid sm:grid-cols-2 gap-3 mt-3">
        <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Water</div>
          <div className="font-display text-2xl font-bold mt-1 text-ocean">{waterGlasses} glasses</div>
          <div className="text-xs text-muted-foreground">{(waterGlasses * 250).toLocaleString()} ml / day</div>
        </div>
        <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Weight</div>
          <div className="font-display text-2xl font-bold mt-1 text-emerald">{form.weightKg} → {form.targetWeightKg} kg</div>
          <div className="text-xs text-muted-foreground capitalize">Goal: {form.goal}</div>
        </div>
      </div>
    </>
  );
}