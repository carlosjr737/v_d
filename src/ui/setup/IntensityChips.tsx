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
    <div className="grid grid-cols-2 gap-3">
      {LEVELS.map(level => (
        <button
          key={level.key}
          type="button"
          onClick={() => onSelect(level.key)}
          className={`h-12 rounded-pill font-semibold text-white transition-all hover:scale-105 active:scale-95 ${
            value === level.key 
              ? 'shadow-heat' 
              : 'border-2 border-border bg-bg-900/60 hover:border-primary-500'
          }`}
          aria-pressed={value === level.key}
          style={{ 
            backgroundColor: value === level.key ? CHIP_COLORS[level.key] : undefined 
          } as CSSProperties}
        >
          <span className="flex items-center justify-center gap-2">
            <span className="text-lg">{level.key === 'leve' ? '🌸' : level.key === 'medio' ? '🔥' : level.key === 'pesado' ? '💥' : '⚡'}</span>
            <span>{level.label.toUpperCase()}</span>
          </span>
        </button>
      ))}
    </div>
  );
};
