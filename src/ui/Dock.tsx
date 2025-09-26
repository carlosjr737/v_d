import React, { type ReactNode } from 'react';

interface DockProps {
  onCreate: () => void;
  onDeck: () => void;
  onReset: () => void;
  onChoosePower: () => void;
  canCreate?: boolean;
  powerButton?: ReactNode;
}

export const Dock: React.FC<DockProps> = ({
  onCreate,
  onDeck,
  onReset,
  onChoosePower,
  canCreate = true,
  powerButton,
}) => {
  return (
    <div className="h-[88px] border-t border-border bg-bg-800/90 p-3 backdrop-blur">
      <div className="grid h-full grid-cols-4 gap-3">
        <button
          type="button"
          onClick={onCreate}
          disabled={!canCreate}
          className="flex h-full flex-col items-center justify-center gap-1 rounded-card bg-bg-900/60 text-white transition-all hover:scale-105 hover:bg-primary-500/20 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <span className="text-xl">✚</span>
          <span className="text-xs font-semibold">Criar</span>
        </button>
        <div role="presentation" className="flex h-full w-full">
          {powerButton ?? (
            <button
              type="button"
              onClick={onChoosePower}
              className="flex h-full w-full flex-col items-center justify-center gap-1 rounded-card bg-bg-900/60 text-white transition-all hover:scale-105 hover:bg-accent-500/20 active:scale-95"
            >
              <span className="text-xl">🎯</span>
              <span className="text-[11px] font-semibold leading-tight text-center">Escolha do Destino</span>
              <span className="text-[11px] text-white/60">Custo: 5 pts</span>
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={onDeck}
          className="flex h-full flex-col items-center justify-center gap-1 rounded-card bg-bg-900/60 text-white transition-all hover:scale-105 hover:bg-primary-500/20 active:scale-95"
        >
          <span className="text-xl">🃏</span>
          <span className="text-xs font-semibold">Baralho</span>
        </button>
        <button
          type="button"
          onClick={onReset}
          className="flex h-full flex-col items-center justify-center gap-1 rounded-card bg-bg-900/60 text-white transition-all hover:scale-105 hover:bg-secondary-500/20 active:scale-95"
        >
          <span className="text-xl">⟲</span>
          <span className="text-xs font-semibold">Reset</span>
        </button>
      </div>
    </div>
  );
};

