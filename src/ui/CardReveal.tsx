import React from 'react';

interface CardRevealProps {
  cardText: string;
  deckTotal: string;
  pileCount: number;
  hasBoost: boolean;
  onFulfill: () => void | Promise<void>;
  onPass: () => void | Promise<void>;
  canResolve: boolean;
  isLoading?: boolean;
}

export const CardReveal: React.FC<CardRevealProps> = ({
  cardText,
  deckTotal,
  pileCount,
  hasBoost,
  onFulfill,
  onPass,
  canResolve,
  isLoading,
}) => {
  return (
    <div className="flex h-full flex-col p-4">
      <div className="flex-1 rounded-card bg-gradient-to-br from-primary-500/20 via-secondary-500/20 to-accent-500/20 p-6 backdrop-blur-sm">
        <div className="mb-4 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1 rounded-pill bg-bg-800/80 px-3 py-1 text-xs font-semibold text-white">
            🃏 {deckTotal}
          </span>
          <span className="inline-flex items-center gap-1 rounded-pill bg-bg-800/80 px-3 py-1 text-xs font-semibold text-white">
            👁️ {pileCount}
          </span>
          {hasBoost && (
            <span className="inline-flex items-center gap-1 rounded-pill bg-accent-500/80 px-3 py-1 text-xs font-semibold text-white">
              🔥 Boost
            </span>
          )}
        </div>
        
        <div className="flex h-full min-h-[120px] items-center justify-center">
          <p 
            className="text-center text-lg font-semibold leading-tight text-white line-clamp-4"
            style={{ fontSize: 'clamp(14px, 3.8vw, 18px)' }}
          >
            {isLoading ? 'Revelando carta...' : cardText}
          </p>
        </div>
      </div>
      
      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onFulfill}
          disabled={!canResolve}
          className="flex h-14 items-center justify-center gap-2 rounded-pill bg-grad-heat font-display text-lg font-bold text-white shadow-heat transition-all hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 max-[390px]:h-12"
        >
          <span>✔︎</span>
          <span>CUMPRIR</span>
        </button>
        <button
          type="button"
          onClick={onPass}
          disabled={!canResolve}
          className="flex h-14 items-center justify-center gap-2 rounded-pill border-2 border-border bg-bg-800/80 font-display text-lg font-bold text-white transition-all hover:scale-105 hover:border-secondary-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 max-[390px]:h-12"
        >
          <span>✖︎</span>
          <span>PASSAR</span>
        </button>
      </div>
    </div>
  );
};