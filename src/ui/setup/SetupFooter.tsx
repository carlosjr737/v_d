import React from 'react';
import { Loader2 } from 'lucide-react';

interface SetupFooterProps {
  canStart: boolean;
  onStart: () => void;
  onDeck?: () => void;
  deckLabel?: string;
  isBusy?: boolean;
}

export const SetupFooter: React.FC<SetupFooterProps> = ({
  canStart,
  onStart,
  onDeck,
  deckLabel = '🃏 Baralho',
  isBusy,
}) => {
  const deckDisabled = !onDeck;
  const startDisabled = !canStart;

  return (
    <footer className="border-t border-border bg-bg-800/90 p-4 backdrop-blur">
      <button
        type="button"
        onClick={onStart}
        disabled={startDisabled}
        aria-busy={isBusy}
        className="flex h-16 w-full items-center justify-center gap-3 rounded-pill bg-grad-heat font-display text-xl font-bold text-white shadow-heat transition-all hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isBusy && <Loader2 className="h-4 w-4 animate-spin" />}
        {isBusy ? 'PREPARANDO...' : 'COMEÇAR ▶'}
      </button>
    </footer>
  );
};
