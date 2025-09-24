import React from 'react';

interface SetupHeaderProps {
  intensityLabel?: string;
}

export const SetupHeader: React.FC<SetupHeaderProps> = ({ intensityLabel }) => {
  return (
    <header className="h-14 grid grid-cols-3 items-center px-3">
      <div className="justify-self-start font-bold tracking-[0.2em] text-[clamp(16px,4vw,18px)]">VC</div>
      <div className="justify-self-center font-semibold uppercase tracking-[0.3em] text-[clamp(16px,4vw,18px)]">
        Setup
      </div>
      <span className="justify-self-end rounded-full border border-[var(--color-border)] px-2 py-1 text-xs uppercase tracking-[0.25em] text-text-subtle">
        {intensityLabel ?? '—'}
      </span>
    </header>
  );
};
