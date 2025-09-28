import React from 'react';
import { Card } from '../types/game';

interface GameCardProps {
  type: 'truth' | 'dare';
  text?: string;
  isBoosted?: boolean;
  isCustom?: boolean;
  className?: string;
  footer?: React.ReactNode;
  children?: React.ReactNode;
}

export const GameCard: React.FC<GameCardProps> = ({
  type,
  text,
  isBoosted = false,
  isCustom = false,
  className = '',
  footer,
  children,
}) => {
  const typeColors = {
    truth: 'from-primary-500/20 via-secondary-500/20 to-accent-500/20',
    dare: 'from-accent-500/20 via-primary-500/20 to-secondary-500/20',
  };

  const typeLabels = {
    truth: 'VERDADE',
    dare: 'DESAFIO',
  };

  const typeIcons = {
    truth: '❤️',
    dare: '⚡',
  };

  return (
    <div
      className={`relative overflow-hidden rounded-card border border-border/60 bg-gradient-to-br ${typeColors[type]} backdrop-blur-sm ${className}`}
      style={{ perspective: '1000px' }}
    >
      {/* Background effects */}
      <div
        className="pointer-events-none absolute -inset-6 bg-gradient-to-br from-white/8 via-transparent to-white/5 opacity-70"
        aria-hidden="true"
      />
      <div 
        className="pointer-events-none absolute inset-0 bg-[var(--texture-noise)] opacity-10" 
        aria-hidden="true" 
      />
      
      {/* Boost indicator */}
      {isBoosted && (
        <div className="absolute right-3 top-3 z-10">
          <span className="inline-flex items-center gap-1 rounded-pill bg-accent-500/90 px-2 py-1 text-xs font-semibold text-white">
            🔥 BOOST
          </span>
        </div>
      )}

      {/* Custom indicator */}
      {isCustom && (
        <div className="absolute left-3 top-3 z-10">
          <span className="inline-flex items-center gap-1 rounded-pill bg-bg-900/70 px-2 py-1 text-xs font-semibold text-white">
            ✨ CRIADA
          </span>
        </div>
      )}

      <div className="relative z-10 flex h-full flex-col p-6">
        {/* Card header */}
        <div className="mb-4 flex items-center gap-3">
          <span className="text-2xl" aria-hidden="true">
            {typeIcons[type]}
          </span>
          <span className="font-display text-lg font-bold uppercase tracking-[0.2em] text-white">
            {typeLabels[type]}
          </span>
        </div>

        {/* Card content */}
        <div className="flex-1">
          {children ? (
            children
          ) : text ? (
            <p className="text-base leading-relaxed text-white line-clamp-4">
              {text}
            </p>
          ) : (
            <div className="flex h-full items-center justify-center text-center text-text-subtle">
              <p className="text-sm">
                {type === 'truth' 
                  ? 'Uma pergunta reveladora aparecerá aqui...' 
                  : 'Um desafio ousado aparecerá aqui...'
                }
              </p>
            </div>
          )}
        </div>

        {/* Card footer */}
        {footer && (
          <div className="mt-4 pt-4 border-t border-border/30">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};