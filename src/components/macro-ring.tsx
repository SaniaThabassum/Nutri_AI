export function MacroRing({
  value, max, label, unit, color = "var(--teal)", size = 160,
}: { value: number; max: number; label: string; unit: string; color?: string; size?: number }) {
  const pct = Math.min(100, (value / max) * 100);
  const r = (size - 18) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="oklch(1 0 0 / 8%)" strokeWidth={10} fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          stroke={color} strokeWidth={10} strokeLinecap="round" fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ filter: `drop-shadow(0 0 8px ${color})`, transition: "stroke-dashoffset 700ms ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="font-mono text-2xl font-semibold">{value}</div>
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{unit}</div>
        <div className="text-[10px] mt-1 text-muted-foreground">{label}</div>
        <div className="text-[10px] text-primary mt-0.5">{Math.round(pct)}% of {max}</div>
      </div>
    </div>
  );
}