import React, { useCallback, useEffect, useRef, useState } from 'react';
import { GameState, Card, Player } from '../types/game';
import { Heart, Zap, Plus, Eye, RotateCcw, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { CreateCardModal } from './CreateCardModal';
import { DeckModal } from './DeckModal';

interface GameScreenProps {
  gameState: GameState;
  onDrawCard: (type: 'truth' | 'dare') => Card | null;
  onFulfillCard: () => void;
  onPassCard: () => void;
  onAddCustomCard: (
    type: 'truth' | 'dare',
    text: string,
    applyBoost: boolean
  ) => Promise<boolean>;
  onResetGame: () => void;
  onDrawNextPlayer: () => Player | null;
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
  onDrawNextPlayer,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeckModal, setShowDeckModal] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isDrawingPlayer, setIsDrawingPlayer] = useState(false);
  const [highlightedName, setHighlightedName] = useState<string | null>(null);
  const [finalDrawName, setFinalDrawName] = useState<string | null>(null);

  const drawIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const drawTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const revealTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentPlayer =
    gameState.currentPlayerIndex !== null
      ? gameState.players[gameState.currentPlayerIndex]
      : null;
  const { currentCard } = gameState;
  const intensity = gameState.intensity!;

  const clearDrawTimers = useCallback(() => {
    if (drawIntervalRef.current) {
      clearInterval(drawIntervalRef.current);
      drawIntervalRef.current = null;
    }
    if (drawTimeoutRef.current) {
      clearTimeout(drawTimeoutRef.current);
      drawTimeoutRef.current = null;
    }
    if (revealTimeoutRef.current) {
      clearTimeout(revealTimeoutRef.current);
      revealTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearDrawTimers();
    };
  }, [clearDrawTimers]);

  const startPlayerDraw = useCallback(() => {
    if (isDrawingPlayer || gameState.players.length === 0) {
      return;
    }

    clearDrawTimers();
    setIsDrawingPlayer(true);
    setHighlightedName(null);
    setFinalDrawName(null);

    drawIntervalRef.current = setInterval(() => {
      const randomPlayer =
        gameState.players[Math.floor(Math.random() * gameState.players.length)];
      setHighlightedName(randomPlayer.name);
    }, 120);

    const highlightDuration = Math.max(2200, gameState.players.length * 260);

    drawTimeoutRef.current = setTimeout(() => {
      if (drawIntervalRef.current) {
        clearInterval(drawIntervalRef.current);
        drawIntervalRef.current = null;
      }
      drawTimeoutRef.current = null;

      const selectedPlayer = onDrawNextPlayer();

      if (selectedPlayer) {
        setHighlightedName(selectedPlayer.name);
        setFinalDrawName(selectedPlayer.name);

        revealTimeoutRef.current = setTimeout(() => {
          setIsDrawingPlayer(false);
          setHighlightedName(null);
          setFinalDrawName(null);
          revealTimeoutRef.current = null;
        }, 1100);
      } else {
        setIsDrawingPlayer(false);
        setHighlightedName(null);
        setFinalDrawName(null);
      }
    }, highlightDuration);
  }, [clearDrawTimers, gameState.players, isDrawingPlayer, onDrawNextPlayer]);

  useEffect(() => {
    if (gameState.phase !== 'playing') {
      return;
    }

    if (gameState.players.length === 0) {
      return;
    }

    if (gameState.currentPlayerIndex !== null) {
      return;
    }

    if (isDrawingPlayer) {
      return;
    }

    startPlayerDraw();
  }, [gameState.phase, gameState.players, gameState.currentPlayerIndex, isDrawingPlayer, startPlayerDraw]);

  useEffect(() => {
    if (!currentPlayer && showCreateModal) {
      setShowCreateModal(false);
    }
  }, [currentPlayer, showCreateModal]);

  const handleDrawCard = (type: 'truth' | 'dare') => {
    if (!currentPlayer) {
      return;
    }

    const card = onDrawCard(type);
    if (!card) {
      alert(`Não há mais cartas de ${type === 'truth' ? 'Verdade' : 'Desafio'} disponíveis!`);
    }
  };

  const playerNameDisplay = currentPlayer?.name ?? finalDrawName ?? highlightedName ?? 'Sorteando jogador...';
  const playerBoostLabel = currentPlayer
    ? `${currentPlayer.boostPoints} pontos de boost`
    : 'Aguardando sorteio';
  const playerPositionLabel =
    gameState.currentPlayerIndex !== null
      ? `Jogador ${gameState.currentPlayerIndex + 1} de ${gameState.players.length}`
      : `${gameState.players.length} jogadores na disputa`;

  const drawHighlightText = finalDrawName ?? highlightedName ?? 'Girando nomes...';
  const drawStatusText = finalDrawName ? 'Próximo jogador definido!' : 'Girando nomes...';

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
                {playerNameDisplay}
              </h2>
              <div className="flex flex-wrap items-center gap-3 text-sm text-text-subtle">
                <span className="inline-flex items-center gap-2 rounded-pill border border-border/50 bg-bg-900/60 px-4 py-1">
                  <Zap size={16} />
                  {playerBoostLabel}
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
              <span>{playerPositionLabel}</span>
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
                    disabled={!currentPlayer || isDrawingPlayer}
                    className="group flex h-[var(--button-height)] items-center justify-center gap-3 rounded-pill bg-[var(--color-primary-500)] px-6 text-lg font-semibold uppercase tracking-[0.2em] text-[var(--color-bg-900)] shadow-heat [--focus-shadow:var(--shadow-heat)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Heart className="h-6 w-6" />
                    Verdade
                  </button>
                  <button
                    onClick={() => handleDrawCard('dare')}
                    disabled={!currentPlayer || isDrawingPlayer}
                    className="group flex h-[var(--button-height)] items-center justify-center gap-3 rounded-pill bg-[var(--color-secondary-500)] px-6 text-lg font-semibold uppercase tracking-[0.2em] text-[var(--color-bg-900)] shadow-heat [--focus-shadow:var(--shadow-heat)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
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
            disabled={!currentPlayer}
            className="flex h-14 items-center justify-center gap-2 rounded-pill border border-border/60 bg-bg-800/70 px-4 text-sm font-semibold uppercase tracking-[0.2em] text-text transition hover:border-primary-500 hover:text-primary-300 disabled:cursor-not-allowed disabled:opacity-40"
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

        {showCreateModal && currentPlayer && (
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

      {isDrawingPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--overlay-veil)]/95 px-4 py-6 backdrop-blur-md">
          <div className="relative w-full max-w-md overflow-hidden rounded-card border border-border/60 bg-bg-900/85 p-8 text-center shadow-heat [--focus-shadow:var(--shadow-heat)]">
            <div className="pointer-events-none absolute -inset-20 opacity-40" aria-hidden="true">
              <div className="absolute inset-0 animate-spin-slower bg-grad-heat blur-3xl" />
            </div>
            <div className="pointer-events-none absolute inset-0 bg-[var(--texture-noise)] opacity-20 mix-blend-soft-light" aria-hidden="true" />
            <div className="relative z-10 space-y-5">
              <span className="inline-flex items-center gap-2 rounded-pill border border-border/40 bg-bg-800/70 px-5 py-2 text-xs font-semibold uppercase tracking-[0.4em] text-text-subtle animate-shuffle-pulse">
                Sorteando próxima rodada
              </span>
              <div className="min-h-[3rem] text-3xl font-display uppercase tracking-[0.18em] text-text" aria-live="polite">
                {drawHighlightText}
              </div>
              <div className="flex items-center justify-center gap-2 text-xs uppercase tracking-[0.3em] text-text-subtle">
                {finalDrawName ? (
                  <CheckCircle className="h-4 w-4 text-accent-500" />
                ) : (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                <span>{drawStatusText}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
