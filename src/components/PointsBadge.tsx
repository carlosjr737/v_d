import { useEffect, useState } from 'react';

type PointsBadgeProps = {
  points: number;
  lastDelta?: number | null;
  className?: string;
};

export function PointsBadge({ points, lastDelta = null, className }: PointsBadgeProps) {
  const [showDelta, setShowDelta] = useState<number | null>(null);

  useEffect(() => {
    if (typeof lastDelta === 'number' && lastDelta !== 0) {
      setShowDelta(lastDelta);
      const timeout = setTimeout(() => setShowDelta(null), 1000);
      return () => clearTimeout(timeout);
    }
  }, [lastDelta]);

  return (
    <div className={`relative z-30 inline-flex items-center justify-center ${className ?? ''}`}>
      <div className="rounded-2xl border border-white/10 bg-bg-900/70 px-4 py-2 shadow-inner">
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">Pontos</span>
        <div className="text-3xl font-bold leading-none text-white">{points}</div>
      </div>

      {showDelta !== null && (
        <span
          className={`absolute -top-3 right-1 text-xl font-bold ${
            showDelta >= 0 ? 'text-emerald-300' : 'text-rose-400'
          } animate-points-float`}
        >
          {showDelta > 0 ? `+${showDelta}` : `${showDelta}`}
        </span>
      )}
    </div>
  );
}
