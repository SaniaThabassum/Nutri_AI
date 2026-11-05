import { createFileRoute, Link } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";
import {
  ArrowRight, Sparkles, Mic, BarChart3, Droplets, Scale,
  Salad, Bot, ChefHat, Trophy, ShieldCheck,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Hero3D = lazy(() => import("@/components/hero-3d").then((m) => ({ default: m.Hero3D })));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NutriAI — AI-powered nutrition tracking" },
      { name: "description", content: "Track meals, macros, water and weight. Get personalized nutrition insights powered by AI, with voice logging and beautiful charts." },
      { property: "og:title", content: "NutriAI — AI nutrition platform" },
      { property: "og:description", content: "AI-powered food logging, macro analytics, water + weight trackers, and a built-in nutrition assistant." },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  { Icon: Salad, title: "AI food intelligence", body: "Search any dish, get instant macros, micros and a health score with AI reasoning." },
  { Icon: Mic, title: "Voice logging", body: "Just say what you ate. We transcribe, identify and log it in a single tap." },
  { Icon: BarChart3, title: "Macro analytics", body: "Animated radial rings, weekly trends, and nutrient radar charts that update live." },
  { Icon: Droplets, title: "Hydration tracker", body: "Visual water goal with quick-add glasses, daily goal pulse and weekly heatmap." },
  { Icon: Scale, title: "Weight & body", body: "Smooth weight curve fits, milestone celebrations, and trend indicators." },
  { Icon: ChefHat, title: "Smart recipes", body: "AI-generated recipes tuned to your remaining macros, prefs and pantry." },
  { Icon: Bot, title: "Nutrition assistant", body: "Ask anything — meal plans, post-workout snacks, ideal protein, late-night ideas." },
  { Icon: Trophy, title: "Achievements", body: "Streaks, badges and 3D milestone moments that make consistency feel great." },
];

const STATS = [
  { v: "2.4M+", k: "meals logged" },
  { v: "94%", k: "stay on streak" },
  { v: "12s", k: "avg. log time" },
  { v: "4.9★", k: "user rating" },
];

function Landing() {
  const [showHero3d, setShowHero3d] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px) and (prefers-reduced-motion: no-preference)");
    setShowHero3d(media.matches);
    const pending = window.sessionStorage.getItem("nutriai.auth.redirect");
    if (pending) {
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) {
          window.sessionStorage.removeItem("nutriai.auth.redirect");
          window.location.assign("/dashboard");
        }
      });
    }
  }, []);

  return (
    <div className="min-h-screen text-foreground">
      {/* NAV */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/40 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl gradient-primary flex items-center justify-center">
              <Salad className="size-5 text-primary-foreground" />
            </div>
            <div className="font-display text-xl font-bold tracking-tight">NutriAI</div>
          </Link>
          <nav className="hidden md:flex items-center gap-7 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition">Features</a>
            <a href="#how" className="hover:text-foreground transition">How it works</a>
            <a href="#stats" className="hover:text-foreground transition">Why NutriAI</a>
          </nav>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-full gradient-primary text-primary-foreground text-sm font-semibold px-5 py-2.5 glow-primary hover:opacity-95 transition"
          >
            Launch app <ArrowRight className="size-4" />
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-6 pt-20 pb-28 lg:pt-28 lg:pb-40">
          <div className="absolute inset-0 -z-10 pointer-events-none">
            {showHero3d ? (
              <Suspense fallback={<div className="absolute inset-0 opacity-50" style={{ background: "var(--gradient-mesh)" }} />}>
                <Hero3D />
              </Suspense>
            ) : (
              <div className="absolute inset-0 opacity-50" style={{ background: "var(--gradient-mesh)" }} />
            )}
          </div>
          <div className="max-w-3xl animate-fade-in">
            <div className="inline-flex items-center gap-2 glass rounded-full px-3.5 py-1.5 text-xs text-muted-foreground">
              <Sparkles className="size-3.5 text-primary" />
              Powered by Lovable AI · Voice, vision & insights
            </div>
            <h1 className="mt-6 text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight">
              Nutrition that
              <br />
              <span className="text-gradient-primary">thinks with you.</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-xl">
              Log meals by voice, watch your macros rebalance in real time, and get
              AI coaching tuned to your goals — all in one beautifully calm dashboard.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-full gradient-primary text-primary-foreground text-sm font-semibold px-6 py-3.5 glow-primary hover:opacity-95 transition"
              >
                Open the dashboard <ArrowRight className="size-4" />
              </Link>
              <Link
                to="/ai-assistant"
                className="inline-flex items-center gap-2 rounded-full glass text-foreground text-sm font-semibold px-6 py-3.5 hover:bg-white/10 transition"
              >
                <Bot className="size-4" /> Talk to NutriAI
              </Link>
            </div>

            <div className="mt-12 flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="size-4 text-primary" />
              HIPAA-aware · End-to-end encrypted · No ads, ever
            </div>
          </div>

          {/* Floating preview card */}
          <div className="absolute right-6 top-32 hidden lg:block w-[360px] animate-fade-in">
            <div className="glass-strong rounded-3xl p-5 shadow-[var(--shadow-elevated)] animate-float-y">
              <div className="flex items-center justify-between">
                <div className="text-xs uppercase tracking-widest text-muted-foreground">Today</div>
                <div className="text-xs text-primary font-mono">73%</div>
              </div>
              <div className="mt-4 font-display text-3xl font-bold">1,450<span className="text-base font-normal text-muted-foreground ml-1">/ 2,000 kcal</span></div>
              <div className="mt-4 h-2 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full gradient-primary" style={{ width: "73%" }} />
              </div>
              <div className="grid grid-cols-3 gap-2 mt-5">
                {[["Protein", "85g", "var(--teal)"], ["Carbs", "180g", "var(--ocean)"], ["Fats", "45g", "var(--gold)"]].map(([k, v, c]) => (
                  <div key={k as string} className="rounded-xl bg-white/5 p-3">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{k}</div>
                    <div className="font-mono text-lg font-semibold mt-1" style={{ color: c as string }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section id="stats" className="max-w-7xl mx-auto px-6 py-10">
        <div className="glass rounded-3xl p-6 sm:p-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map((s) => (
            <div key={s.k}>
              <div className="font-display text-3xl sm:text-4xl font-bold text-gradient-primary">{s.v}</div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground mt-1">{s.k}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-20">
        <div className="max-w-2xl">
          <div className="text-xs uppercase tracking-[0.2em] text-primary">Everything in one place</div>
          <h2 className="mt-3 text-4xl sm:text-5xl font-bold">A nutrition OS built for humans, not spreadsheets.</h2>
          <p className="mt-4 text-muted-foreground">From the moment you log a meal to the milestone celebration, every interaction is designed to feel calm, fast and intelligent.</p>
        </div>
        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map(({ Icon, title, body }) => (
            <div
              key={title}
              className="glass rounded-2xl p-6 hover:-translate-y-1 transition-transform"
            >
              <div className="size-11 rounded-xl gradient-ocean flex items-center justify-center">
                <Icon className="size-5 text-primary-foreground" />
              </div>
              <h3 className="mt-5 font-display text-lg font-semibold">{title}</h3>
              <p className="text-sm text-muted-foreground mt-2">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW */}
      <section id="how" className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-3 gap-6">
          {[
            { n: "01", t: "Tell us your goal", b: "Weight, performance, recovery — set targets in seconds." },
            { n: "02", t: "Log effortlessly", b: "Voice, search or quick-add. NutriAI handles the math." },
            { n: "03", t: "Get smart guidance", b: "Daily insights, weekly trends and AI coaching tuned to you." },
          ].map((s) => (
            <div key={s.n} className="glass rounded-2xl p-7">
              <div className="font-mono text-sm text-primary">{s.n}</div>
              <div className="mt-3 font-display text-2xl font-semibold">{s.t}</div>
              <p className="mt-2 text-sm text-muted-foreground">{s.b}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="relative overflow-hidden rounded-3xl glass-strong p-10 sm:p-14 text-center">
          <div className="absolute inset-0 -z-10 opacity-50" style={{ background: "var(--gradient-mesh)" }} />
          <h2 className="text-4xl sm:text-5xl font-bold">Your healthiest year starts here.</h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">Open the dashboard and meet a nutrition platform that actually feels good to use, every day.</p>
          <Link
            to="/dashboard"
            className="mt-8 inline-flex items-center gap-2 rounded-full gradient-primary text-primary-foreground text-sm font-semibold px-7 py-4 glow-primary hover:opacity-95 transition"
          >
            Launch NutriAI <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      <footer className="max-w-7xl mx-auto px-6 py-10 text-xs text-muted-foreground flex items-center justify-between">
        <div>© {new Date().getFullYear()} NutriAI. Crafted with intention.</div>
        <div className="flex gap-6">
          <a href="#" className="hover:text-foreground">Privacy</a>
          <a href="#" className="hover:text-foreground">Terms</a>
          <a href="#" className="hover:text-foreground">Contact</a>
        </div>
      </footer>
    </div>
  );
}
