import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Salad, Mail, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

const AUTH_REDIRECT_KEY = "nutriai.auth.redirect";
const DEFAULT_REDIRECT = "/dashboard";
const AUTH_TIMEOUT_MS = 20_000;

export const Route = createFileRoute("/auth")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    next: typeof s.next === "string" ? s.next : undefined,
  }),
  head: () => ({ meta: [{ title: "Sign in · NutriAI" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { next } = Route.useSearch();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingLabel, setLoadingLabel] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted && data.session) navigateAfterAuth(navigate, next);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) navigateAfterAuth(navigate, next);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [navigate, next]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setLoadingLabel(mode === "signin" ? "Signing in…" : "Creating account…");
    try {
      const cleanEmail = email.trim().toLowerCase();
      if (mode === "signup") {
        const redirectTo = authReturnUrl(next);
        const { data, error } = await withAuthTimeout(supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: { emailRedirectTo: redirectTo, data: { full_name: name.trim() || undefined } },
        }));
        if (error) throw error;
        if (data.session) {
          toast.success("Account created");
          navigateAfterAuth(navigate, next);
        } else {
          toast.success("Account created — check your email to confirm it.");
        }
      } else {
        const { error } = await withAuthTimeout(supabase.auth.signInWithPassword({ email: cleanEmail, password }));
        if (error) throw error;
        toast.success("Welcome back!");
        navigateAfterAuth(navigate, next);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Authentication failed";
      toast.error(msg.includes("Invalid login") ? "Wrong email or password" : msg);
    } finally {
      setLoading(false);
      setLoadingLabel(null);
    }
  }

  async function google() {
    setLoading(true);
    setLoadingLabel("Opening Google…");
    try {
      window.sessionStorage.setItem(AUTH_REDIRECT_KEY, safeNext(next) ?? DEFAULT_REDIRECT);
      const res = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: authReturnUrl(next),
      });
      if (res.error) throw res.error;
      if (res.redirected) return;
      navigateAfterAuth(navigate, next);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Google sign-in failed");
    } finally {
      setLoading(false);
      setLoadingLabel(null);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2.5 mb-8">
          <div className="size-11 rounded-2xl gradient-primary flex items-center justify-center glow-primary">
            <Salad className="size-5 text-primary-foreground" />
          </div>
          <div className="font-display text-2xl font-bold">NutriAI</div>
        </Link>

        <div className="glass-strong rounded-3xl p-7">
          <div className="flex gap-2 p-1 rounded-full bg-white/5 mb-6">
            {(["signin", "signup"] as const).map((m) => (
              <button key={m} type="button" onClick={() => setMode(m)}
                className={`flex-1 py-2 rounded-full text-sm font-semibold transition ${mode === m ? "gradient-primary text-primary-foreground" : "text-muted-foreground"}`}>
                {m === "signin" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>

          <button type="button" onClick={google} disabled={loading}
            className="w-full glass rounded-xl py-2.5 text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-white/10 transition">
            {loadingLabel === "Opening Google…" ? <Loader2 className="size-4 animate-spin" /> : <GoogleMark />} Continue with Google
          </button>

          <div className="relative my-5 text-center">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
            <span className="relative bg-transparent px-3 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">or with email</span>
          </div>

          <form onSubmit={submit} className="space-y-3">
            {mode === "signup" && (
              <Field icon={<Mail className="size-4" />} type="text" placeholder="Your name" value={name} onChange={setName} />
            )}
            <Field icon={<Mail className="size-4" />} type="email" placeholder="you@email.com" value={email} onChange={setEmail} required />
            <Field icon={<Lock className="size-4" />} type="password" placeholder="Password" value={password} onChange={setPassword} required minLength={6} />
            <button type="submit" disabled={loading}
              className="w-full gradient-primary text-primary-foreground rounded-xl py-2.5 text-sm font-semibold inline-flex items-center justify-center gap-2 glow-primary disabled:opacity-60">
              {loading && <Loader2 className="size-4 animate-spin" />}
              {loadingLabel ?? (mode === "signin" ? "Sign in" : "Create account")}
            </button>
          </form>

          <p className="text-[11px] text-muted-foreground text-center mt-5">
            By continuing you agree to use NutriAI for educational tracking only — not medical advice.
          </p>
        </div>
      </div>
    </div>
  );
}

type FieldProps = {
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">;

function Field({ icon, value, onChange, ...rest }: FieldProps) {
  return (
    <label className="flex items-center gap-2 glass rounded-xl px-3 py-2.5 focus-within:ring-1 focus-within:ring-primary/40">
      <span className="text-muted-foreground">{icon}</span>
      <input {...rest} value={value} onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground" />
    </label>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.4-1.6 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1S8.7 6 12 6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.5 14.6 2.5 12 2.5 6.8 2.5 2.6 6.7 2.6 12s4.2 9.5 9.4 9.5c5.4 0 9-3.8 9-9.2 0-.6-.1-1.1-.2-1.6H12z"/>
    </svg>
  );
}

function withAuthTimeout<T>(promise: Promise<T>) {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      window.setTimeout(() => reject(new Error("Authentication is taking too long. Please check your connection and try again.")), AUTH_TIMEOUT_MS);
    }),
  ]);
}

function safeNext(next?: string): string | undefined {
  // Only allow same-origin relative paths.
  if (!next) return undefined;
  if (!next.startsWith("/") || next.startsWith("//")) return undefined;
  return next;
}

function authReturnUrl(next?: string): string {
  const base = `${window.location.origin}/auth`;
  const n = safeNext(next);
  return n ? `${base}?next=${encodeURIComponent(n)}` : base;
}

function navigateAfterAuth(navigate: ReturnType<typeof useNavigate>, next?: string) {
  const target = safeNext(next) ?? window.sessionStorage.getItem(AUTH_REDIRECT_KEY) ?? DEFAULT_REDIRECT;
  window.sessionStorage.removeItem(AUTH_REDIRECT_KEY);
  // Use full navigation for arbitrary same-origin paths so consent routes (with dots)
  // and other public routes resolve correctly without needing typed router params.
  if (target === "/dashboard" || target === "/onboarding") {
    navigate({ to: target, replace: true });
  } else {
    window.location.replace(target);
  }
}