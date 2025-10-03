import React from 'react';
import { IntensityLevel } from '../types/game';

const levelColors: Record<IntensityLevel, string> = {
  leve: '#FF6AA6',
  medio: '#FF2E7E', 
  pesado: '#D94C2E',
  extremo: '#C400FF',
};

const levelIcons: Record<IntensityLevel, string> = {
  leve: '🌸',
  medio: '🔥',
  pesado: '💥',
  extremo: '⚡',
};

const levelLabels: Record<IntensityLevel, string> = {
  leve: 'Leve',
  medio: 'Médio',
  pesado: 'Pesado',
  extremo: 'Extremo',
};

interface ChipLevelProps {
  level: IntensityLevel;
  size?: 'sm' | 'md' | 'lg';
}

export const ChipLevel: React.FC<ChipLevelProps> = ({ level, size = 'md' }) => {
  const sizeClasses = {
    sm: 'h-6 px-2 text-xs',
    md: 'h-8 px-3 text-sm',
    lg: 'h-10 px-4 text-base',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-pill font-semibold text-white ${sizeClasses[size]}`}
      style={{ backgroundColor: levelColors[level] }}
    >
      <span>{levelIcons[level]}</span>
      <span>{levelLabels[level]}</span>
    </span>
  );
};