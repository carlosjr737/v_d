import React from 'react';

interface CardAreaProps {
  deckTotal: string;
  pileCount: number;
  hasBoost: boolean;
  cardText: string;
  onFulfill: () => void;
  onPass: () => void;
  canResolve: boolean;
  isLoading?: boolean;
}

export const CardArea: React.FC<CardAreaProps> = ({
  deckTotal,
  pileCount,
  hasBoost,
  cardText,
  onFulfill,
  onPass,
  canResolve,
  isLoading,
}) => {
  return (
    <div className="grid h-full grid-rows-[minmax(0,1fr)_auto] items-center">
      <div className="px-3">
        <div className="rounded-2xl border border-[var(--color-border)]/70 bg-[var(--color-bg-900)]/80 p-4 text-white shadow-heat/40 max-[390px]:p-3">
          <div className="flex flex-wrap gap-2 text-[11px] text-[var(--color-text-2)]">
            <span className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border)]/70 bg-[var(--color-bg-800)]/60 px-2 py-1">
              🃏 {deckTotal}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border)]/70 bg-[var(--color-bg-800)]/60 px-2 py-1">
              👁️ {pileCount}
            </span>
            {hasBoost && (
              <span className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border)]/70 bg-[var(--color-bg-800)]/60 px-2 py-1">
                🔥 Boost
              </span>
            )}
          </div>
          <div
            className="mt-3 min-h-[96px] text-[clamp(14px,3.8vw,18px)] font-medium leading-tight line-clamp-4"
            aria-live={isLoading ? 'polite' : undefined}
          >
            {isLoading ? 'Revelando…' : cardText}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 p-3 max-[390px]:gap-2">
        <button
          type="button"
          onClick={onFulfill}
          disabled={!canResolve}
          className="h-12 max-[390px]:h-11 rounded-full text-white text-[clamp(14px,3.6vw,16px)] font-semibold tracking-[0.1em] shadow-heat transition disabled:cursor-not-allowed disabled:opacity-40"
          style={{ background: 'var(--grad-heat)' }}
        >
          ✔︎ Cumprir
        </button>
        <button
          type="button"
          onClick={onPass}
          disabled={!canResolve}
          className="h-12 max-[390px]:h-11 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-900)]/70 text-[clamp(14px,3.6vw,16px)] font-semibold tracking-[0.1em] text-white transition hover:border-[var(--color-primary-500)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          ✖︎ Passar
        </button>
      </div>
    </div>
  );
};

