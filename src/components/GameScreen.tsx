import React, { useState } from 'react';
import { GameState, Card } from '../types/game';
import { Heart, Zap, Plus, Eye, RotateCcw, CheckCircle, XCircle } from 'lucide-react';
import { CreateCardModal } from './CreateCardModal';
import { DeckModal } from './DeckModal';

interface GameScreenProps {
  gameState: GameState;
  onDrawCard: (type: 'truth' | 'dare') => Card | null;
  onFulfillCard: () => void;
  onPassCard: () => void;
  onAddCustomCard: (type: 'truth' | 'dare', text: string, applyBoost: boolean) => boolean;
  onResetGame: () => void;
}

const intensityLabels = {
  leve: 'Leve',
  medio: 'Médio',
  pesado: 'Pesado',
  extremo: 'Extremo',
} as const;

const levelBarColors = {
  leve: 'bg-[var(--level-leve)]',
  medio: 'bg-[var(--level-medio)]',
  pesado: 'bg-[var(--level-pesado)]',
  extremo: 'bg-[var(--level-extremo)]',
} as const;

const cardTypeStyles = {
  truth: 'bg-[var(--color-primary-500)] text-[var(--color-bg-900)]',
  dare: 'bg-[var(--color-secondary-500)] text-[var(--color-bg-900)]',
} as const;

export const GameScreen: React.FC<GameScreenProps> = ({
  gameState,
  onDrawCard,
  onFulfillCard,
  onPassCard,
  onAddCustomCard,
  onResetGame,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeckModal, setShowDeckModal] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const { currentCard } = gameState;

  const handleDrawCard = (type: 'truth' | 'dare') => {
    const card = onDrawCard(type);
    if (!card) {
      alert(`Não há mais cartas de ${type === 'truth' ? 'Verdade' : 'Desafio'} disponíveis!`);
    }
  };

  const intensity = gameState.intensity!;

  return (
    <div className="flex flex-1 justify-center px-4 py-10 sm:px-6 lg:px-8">
      <div className="w-full max-w-5xl space-y-8">
        <header className="rounded-card border border-border/60 bg-bg-800/80 p-6 shadow-heat [--focus-shadow:var(--shadow-heat)] backdrop-blur-xl">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-3">
              <span className="text-xs font-semibold uppercase tracking-[0.4em] text-text-subtle">
                Vez de jogar
              </span>
              <h2 className="text-4xl sm:text-5xl font-display uppercase tracking-[0.18em] text-text">
                {currentPlayer.name}
              </h2>
              <div className="flex flex-wrap items-center gap-3 text-sm text-text-subtle">
                <span className="inline-flex items-center gap-2 rounded-pill border border-border/50 bg-bg-900/60 px-4 py-1">
                  <Zap size={16} />
                  {currentPlayer.boostPoints} pontos de boost
                </span>
                <span
                  className={`inline-flex items-center gap-2 rounded-pill px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-text ${levelBarColors[intensity]}`}
                >
                  {intensityLabels[intensity]}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 text-right text-xs text-text-subtle">
              <span className="rounded-pill border border-border/50 bg-bg-900/60 px-4 py-1 uppercase tracking-[0.4em]">
                rodada viva
              </span>
              <span>
                Jogador {gameState.currentPlayerIndex + 1} de {gameState.players.length}
              </span>
            </div>
          </div>
        </header>

        <div className="relative overflow-hidden rounded-card border border-border/60 bg-bg-900/70 p-8 shadow-heat [--focus-shadow:var(--shadow-heat)] backdrop-blur-xl">
          <div className={`absolute inset-x-0 top-0 h-2 ${levelBarColors[intensity]}`} aria-hidden="true" />
          <div className="pointer-events-none absolute -inset-16 bg-glow-dare opacity-30 blur-2xl" aria-hidden="true" />
          <div className="relative z-10 space-y-8">
            {!currentCard ? (
              <div className="space-y-8">
                <div className="text-center space-y-3">
                  <span className="text-xs uppercase tracking-[0.4em] text-text-subtle">
                    escolha sua carta
                  </span>
                  <h3 className="text-3xl font-display uppercase tracking-[0.18em] text-text">
                    Verdade ou Consequência?
                  </h3>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <button
                    onClick={() => handleDrawCard('truth')}
                    className="group flex h-[var(--button-height)] items-center justify-center gap-3 rounded-pill bg-[var(--color-primary-500)] px-6 text-lg font-semibold uppercase tracking-[0.2em] text-[var(--color-bg-900)] shadow-heat [--focus-shadow:var(--shadow-heat)] transition hover:brightness-110"
                  >
                    <Heart className="h-6 w-6" />
                    Verdade
                  </button>
                  <button
                    onClick={() => handleDrawCard('dare')}
                    className="group flex h-[var(--button-height)] items-center justify-center gap-3 rounded-pill bg-[var(--color-secondary-500)] px-6 text-lg font-semibold uppercase tracking-[0.2em] text-[var(--color-bg-900)] shadow-heat [--focus-shadow:var(--shadow-heat)] transition hover:brightness-110"
                  >
                    <Zap className="h-6 w-6" />
                    Desafio
                  </button>
                </div>
                <p className="text-center text-sm text-text-subtle">
                  Cada escolha muda o ritmo. Use seus boosts com sabedoria.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-center gap-3 text-sm font-semibold uppercase tracking-[0.3em]">
                  <span
                    className={`inline-flex items-center gap-2 rounded-pill px-4 py-2 shadow-heat [--focus-shadow:var(--shadow-heat)] ${
                      currentCard.type === 'truth'
                        ? cardTypeStyles.truth
                        : cardTypeStyles.dare
                    }`}
                  >
                    {currentCard.type === 'truth' ? <Heart size={18} /> : <Zap size={18} />}
                    {currentCard.type === 'truth' ? 'Verdade' : 'Desafio'}
                  </span>
                  {currentCard.isBoosted && (
                    <span className="inline-flex items-center gap-2 rounded-pill bg-accent-500 px-4 py-2 text-xs uppercase tracking-[0.4em] text-text shadow-heat [--focus-shadow:var(--shadow-heat)]">
                      BOOST
                    </span>
                  )}
                </div>
                <div className="relative overflow-hidden rounded-card border border-border/50 bg-bg-800/80 p-8">
                  <div className="absolute inset-x-6 top-0 h-1 rounded-full  bg-text/10" aria-hidden="true" />
                  <p className="relative z-10 text-lg leading-relaxed text-text">
                    {currentCard.text}
                  </p>
                  {currentCard.isCustom && (
                    <div className="relative z-10 mt-4 inline-flex items-center gap-2 rounded-pill border border-dashed border-border/60 px-3 py-1 text-xs uppercase tracking-[0.3em] text-text-subtle">
                      Carta personalizada
                    </div>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    onClick={onFulfillCard}
                    className="flex h-14 items-center justify-center gap-2 rounded-pill bg-grad-heat px-6 text-sm font-semibold uppercase tracking-[0.2em] text-text shadow-heat [--focus-shadow:var(--shadow-heat)] transition hover:brightness-110"
                  >
                    <CheckCircle size={20} />
                    Cumprir
                  </button>
                  <button
                    onClick={onPassCard}
                    className="flex h-14 items-center justify-center gap-2 rounded-pill border border-border px-6 text-sm font-semibold uppercase tracking-[0.2em] text-text transition hover:border-primary-500 hover:text-primary-300"
                  >
                    <XCircle size={20} />
                    Passar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex h-14 items-center justify-center gap-2 rounded-pill border border-border/60 bg-bg-800/70 px-4 text-sm font-semibold uppercase tracking-[0.2em] text-text transition hover:border-primary-500 hover:text-primary-300"
          >
            <Plus size={18} />
            Criar carta
          </button>
          <button
            onClick={() => setShowDeckModal(true)}
            className="flex h-14 items-center justify-center gap-2 rounded-pill border border-border/60 bg-bg-800/70 px-4 text-sm font-semibold uppercase tracking-[0.2em] text-text transition hover:border-primary-500 hover:text-primary-300"
          >
            <Eye size={18} />
            Baralho
          </button>
          <button
            onClick={() => setShowResetConfirm(true)}
            className="flex h-14 items-center justify-center gap-2 rounded-pill border border-secondary-500/60 bg-transparent px-4 text-sm font-semibold uppercase tracking-[0.2em] text-secondary-300 transition hover:border-secondary-500 hover:text-secondary-500"
          >
            <RotateCcw size={18} />
            Reiniciar
          </button>
        </div>

        {showCreateModal && (
          <CreateCardModal
            currentPlayer={currentPlayer}
            intensity={intensity}
            onAddCard={onAddCustomCard}
            onClose={() => setShowCreateModal(false)}
          />
        )}

        {showDeckModal && (
          <DeckModal
            cards={gameState.availableCards}
            intensity={intensity}
            onClose={() => setShowDeckModal(false)}
          />
        )}

        {showResetConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--overlay-veil)] p-4">
            <div className="w-full max-w-sm space-y-4 rounded-card border border-border/60 bg-bg-900/80 p-6 shadow-heat [--focus-shadow:var(--shadow-heat)] backdrop-blur-xl">
              <h3 className="text-xl font-display uppercase tracking-[0.18em] text-text">
                Reiniciar sessão?
              </h3>
              <p className="text-sm text-text-subtle">
                Isso irá apagar todo o progresso e cartas criadas. Esta ação não pode ser desfeita.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="flex h-12 items-center justify-center rounded-pill border border-border px-4 text-sm font-semibold uppercase tracking-[0.2em] text-text transition hover:border-primary-500 hover:text-primary-300"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    onResetGame();
                    setShowResetConfirm(false);
                  }}
                  className="flex h-12 items-center justify-center rounded-pill bg-[var(--color-secondary-500)] px-4 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-bg-900)] shadow-heat [--focus-shadow:var(--shadow-heat)] transition hover:brightness-110"
                >
                  Reiniciar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
