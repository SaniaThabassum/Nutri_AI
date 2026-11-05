import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { Salad, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// Local typed wrapper around the beta supabase.auth.oauth namespace.
type AuthorizationDetails = {
  client?: { name?: string; client_uri?: string; logo_uri?: string };
  redirect_url?: string;
  redirect_to?: string;
  scopes?: string[];
};
type OAuthNs = {
  getAuthorizationDetails: (id: string) => Promise<{ data: AuthorizationDetails | null; error: Error | null }>;
  approveAuthorization: (id: string) => Promise<{ data: AuthorizationDetails | null; error: Error | null }>;
  denyAuthorization: (id: string) => Promise<{ data: AuthorizationDetails | null; error: Error | null }>;
};
function oauth(): OAuthNs {
  return (supabase.auth as unknown as { oauth: OAuthNs }).oauth;
}

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s.authorization_id === "string" ? s.authorization_id : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("Missing authorization_id");
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      const next = location.pathname + location.searchStr;
      throw redirect({ to: "/auth", search: { next } as never });
    }
  },
  loader: async ({ location }) => {
    const authorizationId = new URLSearchParams(location.search).get("authorization_id")!;
    const { data, error } = await oauth().getAuthorizationDetails(authorizationId);
    if (error) throw error;
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) throw redirect({ href: immediate } as never);
    return data;
  },
  component: Consent,
  errorComponent: ({ error }) => (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="glass-strong rounded-3xl p-7 max-w-md text-center">
        <h1 className="font-display text-xl font-bold mb-2">Couldn't load this request</h1>
        <p className="text-sm text-muted-foreground">{String((error as Error)?.message ?? error)}</p>
      </div>
    </main>
  ),
});

function Consent() {
  const details = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState<"approve" | "deny" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const clientName = details?.client?.name ?? "an app";

  async function decide(approve: boolean) {
    setBusy(approve ? "approve" : "deny");
    setError(null);
    const { data, error } = approve
      ? await oauth().approveAuthorization(authorization_id)
      : await oauth().denyAuthorization(authorization_id);
    if (error) { setBusy(null); setError(error.message); return; }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) { setBusy(null); setError("No redirect returned by the authorization server."); return; }
    window.location.href = target;
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2.5 mb-6">
          <div className="size-11 rounded-2xl gradient-primary flex items-center justify-center glow-primary">
            <Salad className="size-5 text-primary-foreground" />
          </div>
          <div className="font-display text-2xl font-bold">NutriAI</div>
        </div>

        <div className="glass-strong rounded-3xl p-7">
          <h1 className="font-display text-xl font-bold text-center mb-2">Connect {clientName}</h1>
          <p className="text-sm text-muted-foreground text-center mb-6">
            {clientName} is asking to act on NutriAI as you. It will be able to search your food
            database, read your food log, and add or remove entries on your behalf. You can revoke
            access at any time.
          </p>

          {error && (
            <div role="alert" className="mb-4 text-sm text-destructive text-center">{error}</div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={!!busy}
              onClick={() => decide(false)}
              className="glass rounded-xl py-2.5 text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-white/10 transition disabled:opacity-60"
            >
              {busy === "deny" && <Loader2 className="size-4 animate-spin" />} Deny
            </button>
            <button
              type="button"
              disabled={!!busy}
              onClick={() => decide(true)}
              className="gradient-primary text-primary-foreground rounded-xl py-2.5 text-sm font-semibold inline-flex items-center justify-center gap-2 glow-primary disabled:opacity-60"
            >
              {busy === "approve" && <Loader2 className="size-4 animate-spin" />} Approve
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}