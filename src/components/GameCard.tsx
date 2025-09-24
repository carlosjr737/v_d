import React from 'react';
import { Heart, Loader2, Sparkles, Zap } from 'lucide-react';
import { Card, IntensityLevel } from '../types/game';
import { cn } from '../utils/cn';

const levelAccentBorders: Record<IntensityLevel, string> = {
  leve: 'via-[rgba(160,247,205,0.25)]',
  medio: 'via-[rgba(255,204,92,0.3)]',
  pesado: 'via-[rgba(255,134,92,0.3)]',
  extremo: 'via-[rgba(255,90,112,0.35)]',
};

const cardTypeLabels = {
  truth: 'Verdade',
  dare: 'Desafio',
} as const;

const cardTypeBadges = {
  truth:
    'bg-[var(--color-primary-500)]/95 text-[var(--color-bg-900)] shadow-[0_10px_30px_-12px_rgba(160,247,205,0.45)]',
  dare:
    'bg-[var(--color-secondary-500)]/95 text-[var(--color-bg-900)] shadow-[0_10px_30px_-12px_rgba(255,138,76,0.55)]',
} as const;

export type GameCardStatus = 'face-down' | 'preparing' | 'revealed';

interface GameCardProps {
  card: Card | null;
  intensity: IntensityLevel;
  status: GameCardStatus;
}

export const GameCard: React.FC<GameCardProps> = ({ card, intensity, status }) => {
  const isRevealed = status === 'revealed' && !!card;
  const isPreparing = status === 'preparing';

  return (
    <div className="relative w-full max-w-md">
      <div className="pointer-events-none absolute -inset-6 rounded-[36px] bg-grad-heat opacity-20 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -inset-3 rounded-[34px] border border-border/40 bg-bg-900/60" aria-hidden="true" />
      <div className="relative aspect-[3/4] w-full [perspective:1800px]">
        <div
          className={cn(
            'relative h-full w-full rounded-[28px] border border-border/70 bg-bg-900/80 p-6 shadow-[0_35px_80px_-28px_rgba(0,0,0,0.95)] transition-all duration-500 [transform-style:preserve-3d]',
            status === 'face-down' && 'animate-card-draw [transform:rotateY(180deg)]',
            status !== 'face-down' && '[transform:rotateY(0deg)]',
            isPreparing && 'animate-card-prep',
            isRevealed && 'animate-card-flip'
          )}
        >
          <div className="absolute inset-0 rounded-[24px] border border-border/50 bg-bg-800/85 p-6 text-text [backface-visibility:hidden]">
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between text-[0.7rem] uppercase tracking-[0.35em] text-text-subtle">
                <span>Mesa secreta</span>
                <span className="text-text/60">Intensidade</span>
              </div>
              <div
                className={cn(
                  'mt-2 h-1 rounded-full bg-gradient-to-r from-transparent via-50% to-transparent',
                  levelAccentBorders[intensity]
                )}
              />
              <div className="relative mt-6 flex-1">
                {isPreparing && (
                  <div className="flex h-full flex-col items-center justify-center gap-4 text-center text-sm text-text-subtle">
                    <div className="inline-flex items-center gap-2 rounded-pill border border-border/60 bg-bg-900/70 px-4 py-2 text-[0.65rem] uppercase tracking-[0.4em]">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Carta em preparação
                    </div>
                    <p className="max-w-[18ch] text-sm leading-relaxed">
                      Ajustando desafios perfeitos para esta rodada...
                    </p>
                  </div>
                )}

                {isRevealed && card && (
                  <div className="flex h-full flex-col gap-6">
                    <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-semibold uppercase tracking-[0.35em]">
                      <span
                        className={cn(
                          'inline-flex items-center gap-2 rounded-pill px-4 py-2 transition-shadow duration-500',
                          cardTypeBadges[card.type]
                        )}
                      >
                        {card.type === 'truth' ? <Heart size={18} /> : <Zap size={18} />}
                        {cardTypeLabels[card.type]}
                      </span>
                      {card.isBoosted && (
                        <span className="inline-flex items-center gap-2 rounded-pill border border-accent-500/70 bg-accent-500/15 px-4 py-2 text-[0.65rem] uppercase tracking-[0.4em] text-accent-300">
                          <Sparkles size={16} /> Boost ativado
                        </span>
                      )}
                    </div>
                    <p className="text-lg leading-relaxed text-text">{card.text}</p>
                    {card.isCustom && (
                      <div className="inline-flex items-center gap-2 self-start rounded-pill border border-dashed border-border/60 px-3 py-1 text-[0.6rem] uppercase tracking-[0.35em] text-text-subtle">
                        Carta personalizada
                      </div>
                    )}
                  </div>
                )}

                {!isPreparing && !isRevealed && (
                  <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                    <span className="text-[0.7rem] uppercase tracking-[0.4em] text-text-subtle">Monte principal</span>
                    <p className="text-sm text-text/70">
                      Puxe uma carta para descobrir o próximo desafio.
                    </p>
                  </div>
                )}
              </div>
              <div className="mt-6 flex items-center justify-between text-[0.65rem] uppercase tracking-[0.4em] text-text/50">
                <span>Fundo</span>
                <span>Segredos</span>
              </div>
            </div>
          </div>

          <div className="absolute inset-0 rounded-[24px] border border-border/40 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.12),rgba(14,11,20,0.6))] p-6 text-text-subtle [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <div className="flex h-full flex-col items-center justify-center gap-4">
              <div className="h-16 w-16 rounded-full border border-border/60 bg-bg-900/80" />
              <div className="flex gap-2 text-xs uppercase tracking-[0.4em]">
                <span>Verdade</span>
                <span>•</span>
                <span>Desafio</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameCard;
