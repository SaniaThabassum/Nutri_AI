import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Utensils, BarChart3, CalendarDays, ChefHat,
  Droplets, Scale, Trophy, Bot, User, Salad, Menu, X, LogOut, History,
} from "lucide-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useGoals } from "@/lib/goals";
import { toast } from "sonner";

const ITEMS = [
  { to: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { to: "/food-log", label: "Food Log", Icon: Utensils },
  { to: "/analytics", label: "Analytics", Icon: BarChart3 },
  { to: "/history", label: "History", Icon: History },
  { to: "/meal-planner", label: "Meal Planner", Icon: CalendarDays },
  { to: "/recipes", label: "Recipes", Icon: ChefHat },
  { to: "/water", label: "Water Tracker", Icon: Droplets },
  { to: "/weight", label: "Weight Tracker", Icon: Scale },
  { to: "/achievements", label: "Achievements", Icon: Trophy },
  { to: "/ai-assistant", label: "AI Assistant", Icon: Bot },
  { to: "/profile", label: "Profile", Icon: User },
] as const;

export function AppSidebar({ email }: { email?: string }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { goals } = useGoals();
  const displayName = goals?.name || (email ? email.split("@")[0] : "Friend");
  const initial = (displayName[0] ?? "N").toUpperCase();

  async function logout() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/auth", replace: true, search: { next: undefined } });
  }

  return (
    <>
      <button
        type="button"
        aria-label="Open menu"
        onClick={() => setOpen((v) => !v)}
        className="lg:hidden fixed top-4 left-4 z-50 glass rounded-xl p-2.5 text-foreground"
      >
        {open ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>

      <aside
        className={cn(
          "fixed lg:sticky top-0 left-0 z-40 h-screen w-72 shrink-0 transition-transform duration-300",
          "glass-strong border-r border-white/5 flex flex-col",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <Link to="/" className="flex items-center gap-2.5 px-6 pt-6 pb-4">
          <div className="size-10 rounded-2xl gradient-primary flex items-center justify-center glow-primary">
            <Salad className="size-5 text-primary-foreground" />
          </div>
          <div>
            <div className="font-display text-xl font-bold">NutriAI</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">AI Nutrition</div>
          </div>
        </Link>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {ITEMS.map(({ to, label, Icon }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                onClick={() => setOpen(false)}
                className={cn(
                  "group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all",
                  active
                    ? "gradient-primary text-primary-foreground shadow-[0_8px_30px_-10px_oklch(0.78_0.16_175/60%)]"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5",
                )}
              >
                <Icon className="size-4.5 shrink-0" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="m-3 p-3 rounded-2xl glass">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-full gradient-ocean flex items-center justify-center text-sm font-semibold">{initial}</div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium truncate">{displayName}</div>
              <div className="text-xs text-muted-foreground truncate">{email ?? "Signed in"}</div>
            </div>
            <button onClick={logout} aria-label="Sign out" className="size-9 rounded-xl hover:bg-white/10 inline-flex items-center justify-center text-muted-foreground hover:text-foreground">
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}