import React, { useState } from 'react';
import { Card, IntensityLevel } from '../types/game';
import { X, Heart, Zap, Sparkles, Filter } from 'lucide-react';

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

const typeStyles = {
  truth: 'bg-[var(--color-primary-500)] text-[var(--color-bg-900)]',
  dare: 'bg-[var(--color-secondary-500)] text-[var(--color-bg-900)]',
} as const;

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--overlay-veil)] p-4">
      <div className="flex h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-card border border-border/60 bg-bg-900/85 shadow-heat [--focus-shadow:var(--shadow-heat)] backdrop-blur-2xl">
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
          </button>
        </div>

        <div className="border-b border-border/50 bg-bg-800/70 px-6 py-4">
          <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-text-subtle">
            <Filter size={14} /> filtros
          </div>
          <div className="flex flex-wrap gap-2">
            {filterOptions.map(option => (
              <button
                key={option.key}
                onClick={() => setFilter(option.key)}
                disabled={option.count === 0}
                className={`rounded-pill border px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] transition ${
                  filter === option.key
                    ? 'border-transparent bg-grad-heat text-text shadow-heat [--focus-shadow:var(--shadow-heat)]'
                    : 'border-border/60 bg-bg-900/60 text-text-subtle hover:border-border'
                } ${option.count === 0 ? 'opacity-40' : ''}`}
              >
                {option.label} ({option.count})
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-auto px-6 py-5">
          {filteredCards.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-text-subtle">
              <div className="text-4xl">🃏</div>
              <p className="max-w-xs text-sm">
                Nenhuma carta corresponde a este filtro. Tente outra combinação para variar a sessão.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCards.map(card => (
                <div
                  key={card.id}
                  className={`rounded-card border px-5 py-4 transition ${
                    card.isBoosted
                      ? 'border-accent-500/80 bg-accent-500/10 shadow-heat [--focus-shadow:var(--shadow-heat)]'
                      : 'border-border/60 bg-bg-800/70 hover:border-primary-500/80'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em]">
                      <span className={`inline-flex items-center gap-2 rounded-pill px-3 py-1 ${
                        card.type === 'truth' ? typeStyles.truth : typeStyles.dare
                      } shadow-heat [--focus-shadow:var(--shadow-heat)]`}
                      >
                        {card.type === 'truth' ? <Heart size={14} /> : <Zap size={14} />}
                        {card.type === 'truth' ? 'Verdade' : 'Desafio'}
                      </span>
                      {card.isCustom && (
                        <span className="rounded-pill border border-dashed border-border/60 px-3 py-1 text-[0.65rem] uppercase tracking-[0.3em] text-text-subtle">
                          Criada na sessão
                        </span>
                      )}
                    </div>
                    {card.isBoosted && (
                      <span className="inline-flex items-center gap-2 rounded-pill bg-accent-500 px-3 py-1 text-[0.65rem] uppercase tracking-[0.35em] text-text shadow-heat [--focus-shadow:var(--shadow-heat)]">
                        <Sparkles size={14} /> boost ativo
                      </span>
                    )}
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-text">
                    {card.text}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-border/50 bg-bg-800/70 px-6 py-4 text-center text-xs text-text-subtle">
          Mostrando {filteredCards.length} de {stats.total} carta{stats.total !== 1 ? 's' : ''}
          {stats.boosted > 0 && (
            <div className="mt-1 text-[0.7rem] uppercase tracking-[0.3em] text-accent-500">
              {stats.boosted} boost ativo acelerando a rodada
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
