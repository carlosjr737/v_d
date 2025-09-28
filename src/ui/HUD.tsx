import React from 'react';
import { IntensityLevel } from '../types/game';
import { ChipLevel } from './ChipLevel';

interface HUDProps {
  intensity: IntensityLevel;
  currentPlayerInitial: string;
  boostPoints: number;
}

export const HUD: React.FC<HUDProps> = ({ intensity, currentPlayerInitial, boostPoints }) => {
  return (
    <div className="h-14 grid grid-cols-3 items-center px-3">
      <div className="justify-self-start">
        <ChipLevel level={intensity} size="sm" />
      </div>
      <div className="justify-self-center font-display text-xl font-bold text-white">
        Vez: {currentPlayerInitial}
      </div>
      <div className="justify-self-end">
        <span className="inline-flex items-center gap-1 rounded-pill bg-bg-800/80 px-3 py-1 text-sm font-semibold text-white">
          <span>⚡</span>
          <span>{boostPoints}</span>
        </span>
      </div>
    </div>
  );
};

