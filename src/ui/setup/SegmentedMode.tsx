import React from 'react';
import { GameMode } from '../../types/game';

interface SegmentedModeProps {
  value: GameMode | null;
  onChange: (value: GameMode) => void;
}

export const SegmentedMode: React.FC<SegmentedModeProps> = ({ value, onChange }) => {
  return (
    <div className="grid grid-cols-2 gap-2 max-[390px]:gap-1.5">
      <button
        type="button"
        onClick={() => onChange('casal')}
        className={`${value === 'casal' ? 'seg-on' : 'seg-off'} max-[390px]:h-10`}
        aria-pressed={value === 'casal'}
      >
        <span className="flex items-center justify-center gap-1 text-[clamp(14px,3.6vw,16px)]">
          👫<span>Casal</span>
        </span>
      </button>
      <button
        type="button"
        onClick={() => onChange('grupo')}
        className={`${value === 'grupo' ? 'seg-on' : 'seg-off'} max-[390px]:h-10`}
        aria-pressed={value === 'grupo'}
      >
        <span className="flex items-center justify-center gap-1 text-[clamp(14px,3.6vw,16px)]">
          👥<span>Grupo</span>
        </span>
      </button>
    </div>
  );
};
