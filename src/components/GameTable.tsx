import React from 'react';
import { Heart, Zap } from 'lucide-react';
import { Card, IntensityLevel } from '../types/game';
import { cn } from '../utils/cn';
import { GameCard, GameCardStatus } from './GameCard';

const levelBarColors: Record<IntensityLevel, string> = {
  leve: 'bg-[var(--level-leve)]',
  medio: 'bg-[var(--level-medio)]',
  pesado: 'bg-[var(--level-pesado)]',
  extremo: 'bg-[var(--level-extremo)]',
};

interface GameTableProps {
  intensity: IntensityLevel;
  phase: 'idle' | 'drawing' | 'preparing' | 'revealed';
  card: Card | null;
  availableCounts: {
    truth: number;
    dare: number;
    total: number;
    used: number;
  };
  canDraw: boolean;
  onDrawTruth: () => void;
  onDrawDare: () => void;
}

export const GameTable: React.FC<GameTableProps> = ({
  intensity,
  phase,
  card,
  availableCounts,
  canDraw,
  onDrawTruth,
  onDrawDare,
}) => {
  const cardStatus: GameCardStatus =
    phase === 'revealed' ? 'revealed' : phase === 'preparing' ? 'preparing' : 'face-down';

  return (
    <section className="relative overflow-hidden rounded-card border border-border/60 bg-bg-900/70 p-6 sm:p-8 shadow-heat [--focus-shadow:var(--shadow-heat)] backdrop-blur-xl">
      <div className={cn('absolute inset-x-0 top-0 h-2', levelBarColors[intensity])} aria-hidden="true" />
      <div className="pointer-events-none absolute -inset-16 bg-grad-heat/35 opacity-30 blur-3xl" aria-hidden="true" />
      <div className="relative z-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="flex flex-col items-center gap-8">
          <GameCard card={cardStatus === 'revealed' ? card : null} intensity={intensity} status={cardStatus} />

          {phase === 'idle' && (
            <div className="flex w-full flex-col items-center gap-5 text-center">
              <div className="space-y-2">
                <span className="text-[0.7rem] uppercase tracking-[0.4em] text-text-subtle">
                  escolha sua carta
                </span>
                <h3 className="text-3xl font-display uppercase tracking-[0.18em] text-text">
                  Verdade ou Consequência?
                </h3>
              </div>
              <div className="grid w-full gap-4 sm:grid-cols-2">
                <button
                  onClick={onDrawTruth}
                  disabled={!canDraw}
                  className="group flex h-[var(--button-height)] items-center justify-center gap-3 rounded-pill bg-[var(--color-primary-500)] px-6 text-lg font-semibold uppercase tracking-[0.2em] text-[var(--color-bg-900)] shadow-heat [--focus-shadow:var(--shadow-heat)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Heart className="h-6 w-6" />
                  Verdade
                </button>
                <button
                  onClick={onDrawDare}
                  disabled={!canDraw}
                  className="group flex h-[var(--button-height)] items-center justify-center gap-3 rounded-pill bg-[var(--color-secondary-500)] px-6 text-lg font-semibold uppercase tracking-[0.2em] text-[var(--color-bg-900)] shadow-heat [--focus-shadow:var(--shadow-heat)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Zap className="h-6 w-6" />
                  Desafio
                </button>
              </div>
              <p className="max-w-xl text-sm text-text-subtle">
                Cada escolha muda o ritmo. Use seus boosts com sabedoria.
              </p>
            </div>
          )}
        </div>

        <aside className="flex h-full flex-col justify-between gap-6 rounded-[26px] border border-border/50 bg-bg-800/60 p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-text-subtle">
              <span>Cartas restantes</span>
              <span className="text-text">{availableCounts.total}</span>
            </div>
            <div className="flex flex-col gap-3 text-sm text-text-subtle">
              <div className="flex items-center justify-between rounded-2xl border border-border/40 bg-bg-900/50 px-4 py-3">
                <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em]">
                  <Heart className="h-4 w-4 text-[var(--color-primary-400)]" /> Verdades
                </div>
                <span className="text-text">{availableCounts.truth}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-border/40 bg-bg-900/50 px-4 py-3">
                <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em]">
                  <Zap className="h-4 w-4 text-[var(--color-secondary-400)]" /> Desafios
                </div>
                <span className="text-text">{availableCounts.dare}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 text-xs text-text-subtle">
            <p className="rounded-2xl border border-dashed border-border/50 bg-bg-900/40 px-4 py-3 uppercase tracking-[0.35em]">
              {availableCounts.used} cartas já queimadas nesta sessão
            </p>
            <p className="text-[0.7rem] leading-relaxed">
              O monte vibra a cada rodada. Observe a pilha ficar mais fina e prepare o próximo movimento.
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
};

export default GameTable;
