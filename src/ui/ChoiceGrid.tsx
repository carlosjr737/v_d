import React from 'react';

interface ChoiceGridProps {
  onTruth: () => void;
  onDare: () => void;
  disabled?: boolean;
}

export const ChoiceGrid: React.FC<ChoiceGridProps> = ({ onTruth, onDare, disabled }) => {
  return (
    <div className="grid h-full grid-rows-[minmax(0,1fr)] items-center">
      <div className="grid grid-cols-2 gap-3 p-3 max-[390px]:gap-2">
        <button
          type="button"
          onClick={onTruth}
          disabled={disabled}
          className="h-14 max-[390px]:h-12 rounded-full text-white text-[clamp(14px,3.6vw,16px)] font-semibold tracking-[0.1em] shadow-heat transition disabled:cursor-not-allowed disabled:opacity-40"
          style={{ background: 'var(--grad-heat)' }}
        >
          ❤️ Verdade
        </button>
        <button
          type="button"
          onClick={onDare}
          disabled={disabled}
          className="h-14 max-[390px]:h-12 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-900)]/70 text-[clamp(14px,3.6vw,16px)] font-semibold tracking-[0.1em] text-white transition hover:border-[var(--color-primary-500)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          ⚡ Desafio
        </button>
      </div>
    </div>
  );
};

