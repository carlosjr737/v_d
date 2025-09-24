import React, { CSSProperties } from 'react';
import { IntensityLevel } from '../../types/game';

interface IntensityChipsProps {
  value?: IntensityLevel | null;
  onSelect: (level: IntensityLevel) => void;
}

const CHIP_COLORS: Record<IntensityLevel, string> = {
  leve: 'var(--level-leve)',
  medio: 'var(--level-medio)',
  pesado: 'var(--level-pesado)',
  extremo: 'var(--level-extremo)',
};

const LEVELS: { key: IntensityLevel; label: string }[] = [
  { key: 'leve', label: 'Leve' },
  { key: 'medio', label: 'Médio' },
  { key: 'pesado', label: 'Pesado' },
  { key: 'extremo', label: 'Extremo' },
];

export const IntensityChips: React.FC<IntensityChipsProps> = ({ value, onSelect }) => {
  return (
    <div className="flex flex-wrap gap-2 max-[390px]:gap-1.5">
      {LEVELS.map(level => (
        <button
          key={level.key}
          type="button"
          onClick={() => onSelect(level.key)}
          className={`chip ${value === level.key ? 'chip-on' : ''} max-[390px]:h-9`}
          aria-pressed={value === level.key}
          style={{ '--chip-color': CHIP_COLORS[level.key] } as CSSProperties}
        >
          {level.label}
        </button>
      ))}
    </div>
  );
};
