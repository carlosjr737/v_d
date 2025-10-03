import React from 'react';

interface ChoiceGridProps {
  onTruth: () => void;
  onDare: () => void;
  disabled?: boolean;
}

export const ChoiceGrid: React.FC<ChoiceGridProps> = ({ onTruth, onDare, disabled }) => {
  return (
    <div className="flex h-full items-center justify-center p-4">
      <div className="grid w-full max-w-sm grid-cols-2 gap-4">
        <button
          type="button"
          onClick={onTruth}
          disabled={disabled}
          className="group flex h-32 flex-col items-center justify-center gap-3 rounded-card bg-grad-heat text-white shadow-heat transition-all hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <span className="text-4xl">❤️</span>
          <span className="font-display text-2xl font-bold">VERDADE</span>
        </button>
        <button
          type="button"
          onClick={onDare}
          disabled={disabled}
          className="group flex h-32 flex-col items-center justify-center gap-3 rounded-card border-2 border-border bg-bg-800/80 text-white transition-all hover:scale-105 hover:border-primary-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <span className="text-4xl">⚡</span>
          <span className="font-display text-2xl font-bold">DESAFIO</span>
        </button>
      </div>
    </div>
  );
};

