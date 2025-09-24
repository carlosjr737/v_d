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
    <footer className="grid grid-cols-3 gap-3 border-t border-[var(--color-border)] bg-[var(--color-bg-800)]/60 p-3 backdrop-blur max-[390px]:gap-2">
      <button
        type="button"
        onClick={onDeck}
        disabled={deckDisabled}
        className="h-12 rounded-full border border-[var(--color-border)] text-sm font-semibold text-text transition-colors hover:text-primary-200 disabled:cursor-not-allowed disabled:opacity-40 max-[390px]:h-10"
      >
        {deckLabel}
      </button>
      <div />
      <button
        type="button"
        onClick={onStart}
        disabled={startDisabled}
        aria-busy={isBusy}
        className="flex h-12 items-center justify-center gap-2 rounded-full bg-[var(--grad-heat)] text-sm font-semibold text-white shadow-heat transition-opacity disabled:cursor-not-allowed disabled:opacity-50 max-[390px]:h-10"
      >
        {isBusy && <Loader2 className="h-4 w-4 animate-spin" />}
        {isBusy ? 'Preparando...' : 'Começar ▶'}
      </button>
    </footer>
  );
};
