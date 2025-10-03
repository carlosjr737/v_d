import React from 'react';
import { GameMode } from '../../types/game';

interface SegmentedModeProps {
  value: GameMode | null;
  onChange: (value: GameMode) => void;
}

export const SegmentedMode: React.FC<SegmentedModeProps> = ({ value, onChange }) => {
  return (
    <div className="grid grid-cols-2 gap-3">
      <button
        type="button"
        onClick={() => onChange('casal')}
        className={`h-12 rounded-pill font-semibold transition-all hover:scale-105 active:scale-95 ${
          value === 'casal' 
            ? 'bg-grad-heat text-white shadow-heat' 
            : 'border-2 border-border bg-bg-900/60 text-white hover:border-primary-500'
        }`}
        aria-pressed={value === 'casal'}
      >
        <span className="flex items-center justify-center gap-2">
          <span className="text-xl">👫</span>
          <span>CASAL</span>
        </span>
      </button>
      <button
        type="button"
        onClick={() => onChange('grupo')}
        className={`h-12 rounded-pill font-semibold transition-all hover:scale-105 active:scale-95 ${
          value === 'grupo' 
            ? 'bg-grad-heat text-white shadow-heat' 
            : 'border-2 border-border bg-bg-900/60 text-white hover:border-primary-500'
        }`}
        aria-pressed={value === 'grupo'}
      >
        <span className="flex items-center justify-center gap-2">
          <span className="text-xl">👥</span>
          <span>GRUPO</span>
        </span>
      </button>
    </div>
  );
};
