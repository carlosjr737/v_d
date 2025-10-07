import React, { useState } from 'react';
import { Card, IntensityLevel } from '../types/game';
import { X, Filter } from 'lucide-react';
import { GameCard } from './GameCard';

interface DeckModalProps {
  cards: Card[];
  intensity: IntensityLevel;
  onClose: () => void;
}

const intensityLabels: Record<IntensityLevel, string> = {
  leve: 'Leve',
  medio: 'Médio',
  pesado: 'Pesado',
  extremo: 'Extremo',
};

const intensityColors: Record<IntensityLevel, string> = {
  leve: 'bg-[var(--level-leve)]',
  medio: 'bg-[var(--level-medio)]',
  pesado: 'bg-[var(--level-pesado)]',
  extremo: 'bg-[var(--level-extremo)]',
};

export const DeckModal: React.FC<DeckModalProps> = ({ cards, intensity, onClose }) => {
  const [filter, setFilter] = useState<'all' | 'truth' | 'dare' | 'boosted' | 'custom'>('all');

  const filteredCards = cards.filter(card => {
    switch (filter) {
      case 'truth':
        return card.type === 'truth';
      case 'dare':
        return card.type === 'dare';
      case 'boosted':
        return card.isBoosted;
      case 'custom':
        return card.isCustom;
      default:
        return true;
    }
  });

  const stats = {
    total: cards.length,
    truths: cards.filter(c => c.type === 'truth').length,
    dares: cards.filter(c => c.type === 'dare').length,
    boosted: cards.filter(c => c.isBoosted).length,
    custom: cards.filter(c => c.isCustom).length,
  };

  const filterOptions = [
    { key: 'all', label: 'Todas', count: stats.total },
    { key: 'truth', label: 'Verdades', count: stats.truths },
    { key: 'dare', label: 'Desafios', count: stats.dares },
    { key: 'boosted', label: 'Boostadas', count: stats.boosted },
    { key: 'custom', label: 'Criadas', count: stats.custom },
  ] as const;

  const tiltClasses = ['-rotate-[2.5deg]', 'rotate-[2deg]', '-rotate-[1.5deg]', 'rotate-[1deg]'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--overlay-veil)] p-4">
      <div className="relative flex h-[85vh] w-full max-w-5xl flex-col overflow-hidden rounded-card border border-border/60 bg-bg-900/90 shadow-heat [--focus-shadow:var(--shadow-heat)] backdrop-blur-2xl">
        <div
          className="pointer-events-none absolute -inset-40 bg-grad-overlay opacity-55 blur-3xl animate-gradient-pulse"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-0 bg-[var(--texture-noise)] opacity-35 mix-blend-soft-light animate-noise-fade"
          aria-hidden="true"
        />

        <div className="relative z-10 flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-border/50 px-6 py-4">
            <div className="space-y-1">
              <span className="text-xs uppercase tracking-[0.4em] text-text-subtle">
                Baralho ativo
              </span>
              <div className="flex items-center gap-3">
                <h3 className="text-2xl font-display uppercase tracking-[0.18em] text-text">
                  Painel de cartas
                </h3>
                <span className={`rounded-pill px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-text ${intensityColors[intensity]}`}>
                  {intensityLabels[intensity]}
                </span>
              </div>
              <p className="text-xs text-text-subtle">
                {stats.total} carta{stats.total !== 1 ? 's' : ''} disponível{stats.total !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={onClose}
              className="grid h-10 w-10 place-items-center rounded-full border border-border/60 text-text-subtle transition hover:text-text"
            >
              <X size={18} />
              <span className="sr-only">Fechar</span>
            </button>
          </div>

          <div className="border-b border-border/50 bg-bg-900/60 px-6 py-4">
            <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-text-subtle">
              <Filter size={14} /> filtros
            </div>
            <div className="flex flex-wrap gap-2">
              {filterOptions.map(option => {
                const isActive = filter === option.key;

                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setFilter(option.key)}
                    disabled={option.count === 0}
                    aria-pressed={isActive}
                    className={`group inline-flex items-center gap-2 rounded-pill border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition ${
                      isActive
                        ? 'border-transparent bg-grad-heat text-text shadow-heat [--focus-shadow:var(--shadow-heat)]'
                        : 'border-border/60 bg-bg-900/60 text-text-subtle hover:border-primary-500 hover:text-text'
                    } ${option.count === 0 ? 'pointer-events-none opacity-40' : ''}`}
                  >
                    <span>{option.label}</span>
                    <span
                      className={`rounded-pill px-2 py-[2px] text-[0.65rem] font-normal tracking-[0.2em] ${
                        isActive ? 'bg-bg-900/70 text-text' : 'bg-bg-800/70 text-text-subtle'
                      }`}
                    >
                      {option.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex-1 overflow-auto px-6 py-6">
            {filteredCards.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-4 text-center text-text-subtle">
                <div className="text-4xl">🃏</div>
                <p className="max-w-sm text-sm">
                  Nenhuma carta corresponde a este filtro. Ajuste os chips acima para explorar outras combinações.
                </p>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {filteredCards.map((card, index) => (
                  <div
                    key={card.id}
                    className="group relative transition"
                    style={{ perspective: '1600px' }}
                  >
                    <GameCard
                      type={card.type}
                      text={card.text}
                      isBoosted={card.isBoosted}
                      isCustom={card.isCustom}
                      className={`h-full transition-transform duration-500 group-hover:-translate-y-2 group-hover:rotate-0 ${
                        tiltClasses[index % tiltClasses.length]
                      }`}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-border/50 bg-bg-900/60 px-6 py-4 text-center text-xs text-text-subtle">
            Mostrando {filteredCards.length} de {stats.total} carta{stats.total !== 1 ? 's' : ''}
            {stats.boosted > 0 && (
              <div className="mt-1 text-[0.7rem] uppercase tracking-[0.3em] text-accent-500">
                {stats.boosted} boost ativo acelerando a rodada
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
