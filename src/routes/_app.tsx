import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { Loader2 } from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { useGoals } from "@/lib/goals";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_app")({
  ssr: false,
  component: AppLayout,
});

function AppLayout() {
  const { goals, hydrated } = useGoals();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    let alive = true;
    const fallback = window.setTimeout(() => {
      if (alive) setAuthReady(true);
    }, 8000);
    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      setSession(data.session);
      setAuthReady(true);
    }).finally(() => window.clearTimeout(fallback));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setAuthReady(true);
    });
    return () => {
      alive = false;
      window.clearTimeout(fallback);
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!authReady) return;
    if (!session) { navigate({ to: "/auth", replace: true, search: { next: undefined } }); return; }
    if (hydrated && !goals) { navigate({ to: "/onboarding", replace: true }); }
  }, [authReady, session, hydrated, goals, navigate]);

  if (!authReady || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        <Loader2 className="size-5 animate-spin mr-2" /> Loading your dashboard…
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <AppSidebar email={session.user.email ?? undefined} />
      <main className="flex-1 min-w-0 px-4 sm:px-8 lg:px-10 py-8 lg:py-10">
        <Outlet />
      </main>
    </div>
  );
}