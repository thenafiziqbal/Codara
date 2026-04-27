"use client";

export function MetricRing({ value = 0, label, color = "#00b3ff", size = 120 }) {
  const v = Math.max(0, Math.min(100, Number(value) || 0));
  const r = (size - 16) / 2;
  const c = 2 * Math.PI * r;
  const dash = (v / 100) * c;
  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="8"
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth="8"
          fill="none"
          strokeDasharray={`${dash} ${c}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="-mt-[4.5rem] text-center">
        <div className="text-2xl font-semibold">{Math.round(v)}</div>
        <div className="text-xs text-ink-dim">{label}</div>
      </div>
      <div className="h-12" />
    </div>
  );
}
