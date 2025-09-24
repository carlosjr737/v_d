import React from 'react';

interface DockProps {
  onCreate: () => void;
  onDeck: () => void;
  onReset: () => void;
  canCreate?: boolean;
}

export const Dock: React.FC<DockProps> = ({ onCreate, onDeck, onReset, canCreate = true }) => {
  return (
    <div className="h-[88px] rounded-t-3xl border border-[var(--color-border)]/60 bg-[var(--color-bg-800)]/70 p-3 backdrop-blur">
      <div className="grid h-full grid-cols-3 gap-3 max-[390px]:gap-2">
        <button
          type="button"
          onClick={onCreate}
          disabled={!canCreate}
          className="h-12 max-[390px]:h-11 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-900)]/60 text-[clamp(12px,3vw,14px)] font-semibold tracking-[0.08em] text-white transition hover:border-[var(--color-primary-500)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          ✚ Criar
        </button>
        <button
          type="button"
          onClick={onDeck}
          className="h-12 max-[390px]:h-11 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-900)]/60 text-[clamp(12px,3vw,14px)] font-semibold tracking-[0.08em] text-white transition hover:border-[var(--color-primary-500)]"
        >
          🃏 Baralho
        </button>
        <button
          type="button"
          onClick={onReset}
          className="h-12 max-[390px]:h-11 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-900)]/60 text-[clamp(12px,3vw,14px)] font-semibold tracking-[0.08em] text-white transition hover:border-[var(--color-secondary-500)] hover:text-[var(--color-secondary-300)]"
        >
          ⟲ Reset
        </button>
      </div>
    </div>
  );
};

