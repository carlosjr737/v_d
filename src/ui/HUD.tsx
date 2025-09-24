import React from 'react';
import { IntensityLevel } from '../types/game';

const intensityLabels: Record<IntensityLevel, string> = {
  leve: 'Leve',
  medio: 'Médio',
  pesado: 'Pesado',
  extremo: 'Extremo',
};

interface HUDProps {
  intensity: IntensityLevel;
  currentPlayerInitial: string;
  boostPoints: number;
}

export const HUD: React.FC<HUDProps> = ({ intensity, currentPlayerInitial, boostPoints }) => {
  return (
    <div className="h-14 grid grid-cols-3 items-center rounded-2xl border border-[var(--color-border)]/60 bg-[var(--color-bg-900)]/80 px-3 text-[clamp(14px,4vw,16px)] shadow-heat/30">
      <span className="justify-self-start text-[11px] uppercase tracking-[0.28em] text-[var(--color-text-2)]">
        <span className="inline-flex items-center rounded-full border border-[var(--color-border)]/70 bg-[var(--color-bg-800)]/60 px-2 py-1">
          {intensityLabels[intensity]}
        </span>
      </span>
      <span className="justify-self-center font-semibold uppercase tracking-[0.3em] text-[clamp(16px,5vw,20px)]">
        Vez: {currentPlayerInitial}
      </span>
      <span className="justify-self-end text-xs font-medium uppercase tracking-[0.28em] text-[var(--color-text-2)]">
        <span className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border)]/70 bg-[var(--color-bg-800)]/60 px-2 py-1 text-[11px]">
          <span aria-hidden="true">⚡</span>
          {boostPoints}
        </span>
      </span>
    </div>
  );
};

