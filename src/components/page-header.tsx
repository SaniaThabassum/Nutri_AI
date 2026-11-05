import type { ReactNode } from "react";

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8 animate-fade-in">
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gradient-primary">{title}</h1>
        {subtitle ? <p className="mt-2 text-muted-foreground max-w-2xl">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
    </header>
  );
}

export function GlassCard({ children, className = "" }: { children: import("react").ReactNode; className?: string }) {
  return <div className={`glass rounded-2xl p-6 ${className}`}>{children}</div>;
}