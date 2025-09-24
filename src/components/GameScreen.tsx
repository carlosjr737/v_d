import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GameState, Card, Player } from '../types/game';
import {
  Zap,
  Plus,
  Eye,
  RotateCcw,
  CheckCircle,
  XCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { CreateCardModal } from './CreateCardModal';
import { DeckModal } from './DeckModal';

import { GameTable } from './GameTable';
import { cn } from '../utils/cn';


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
  const [cardPhase, setCardPhase] = useState<'idle' | 'drawing' | 'preparing' | 'revealed'>(
    gameState.currentCard ? 'revealed' : 'idle'
  );
  const [displayedCard, setDisplayedCard] = useState<Card | null>(gameState.currentCard);

  const drawIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const drawTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const revealTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cardAnimationTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

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

  const clearCardAnimationTimers = useCallback(() => {
    cardAnimationTimersRef.current.forEach((timer) => clearTimeout(timer));
    cardAnimationTimersRef.current = [];
  }, []);

  useEffect(() => {
    return () => {
      clearDrawTimers();
      clearCardAnimationTimers();
    };
  }, [clearCardAnimationTimers, clearDrawTimers]);

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

  useEffect(() => {
    if (cardPhase === 'drawing' || cardPhase === 'preparing') {
      return;
    }

    if (!gameState.currentCard) {
      clearCardAnimationTimers();
      setDisplayedCard(null);
      if (cardPhase !== 'idle') {
        setCardPhase('idle');
      }
      return;
    }

    setDisplayedCard(gameState.currentCard);
    if (cardPhase !== 'revealed') {
      setCardPhase('revealed');
    }
  }, [cardPhase, clearCardAnimationTimers, gameState.currentCard]);

  const handleDrawCard = (type: 'truth' | 'dare') => {
    if (!currentPlayer || cardPhase === 'drawing' || cardPhase === 'preparing') {
      return;
    }

    clearCardAnimationTimers();
    setCardPhase('drawing');
    setDisplayedCard(null);

    const card = onDrawCard(type);
    if (!card) {
      alert(`Não há mais cartas de ${type === 'truth' ? 'Verdade' : 'Desafio'} disponíveis!`);
      setCardPhase('idle');
      return;
    }

    cardAnimationTimersRef.current.push(
      setTimeout(() => {
        setCardPhase('preparing');
      }, 260)
    );

    cardAnimationTimersRef.current.push(
      setTimeout(() => {
        setCardPhase('revealed');
      }, 900)
    );
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

  const deckCounts = useMemo(() => {
    const counts = gameState.availableCards.reduce(
      (acc, cardItem) => {
        if (cardItem.type === 'truth') {
          acc.truth += 1;
        } else {
          acc.dare += 1;
        }
        return acc;
      },
      { truth: 0, dare: 0 }
    );

    return {
      truth: counts.truth,
      dare: counts.dare,
      total: gameState.availableCards.length,
      used: gameState.usedCards.length,
    };
  }, [gameState.availableCards, gameState.usedCards]);

  const boostsUsed = useMemo(
    () => gameState.usedCards.filter((cardItem) => cardItem.isBoosted).length,
    [gameState.usedCards]
  );

  const canDrawCard = Boolean(currentPlayer) && !isDrawingPlayer && cardPhase === 'idle';
  const canResolveCard = cardPhase === 'revealed' && Boolean(currentCard);
  const hasPlayers = gameState.players.length > 0;

  return (
    <div className="flex flex-1 justify-center px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex w-full max-w-6xl flex-1 flex-col gap-8">
        <header className="rounded-card border border-border/60 bg-bg-800/80 p-6 shadow-heat [--focus-shadow:var(--shadow-heat)] backdrop-blur-xl">
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div className="space-y-3">
                <span className="text-xs font-semibold uppercase tracking-[0.4em] text-text-subtle">
                  Rodada ativa
                </span>
                <h2 className="text-4xl sm:text-5xl font-display uppercase tracking-[0.18em] text-text">
                  {playerNameDisplay}
                </h2>
                <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.3em] text-text-subtle">
                  <span className="inline-flex items-center gap-2 rounded-pill border border-border/50 bg-bg-900/60 px-4 py-1">
                    <Zap size={16} />
                    {playerBoostLabel}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-pill border border-border/50 bg-bg-900/60 px-4 py-1">
                    {playerPositionLabel}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 text-right text-xs text-text-subtle">
                <span className="rounded-pill border border-border/50 bg-bg-900/60 px-4 py-1 uppercase tracking-[0.4em]">
                  Intensidade
                </span>
                <span
                  className={cn(
                    'inline-flex items-center gap-2 rounded-pill px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-text',
                    levelBarColors[intensity]
                  )}
                >
                  {intensityLabels[intensity]}
                </span>
              </div>
            </div>


            <div className="flex items-stretch gap-4 overflow-x-auto pb-2">
              {hasPlayers ? (
                gameState.players.map((player, index) => {
                  const isCurrent = currentPlayer?.id === player.id;
                  const isHighlighted = highlightedName === player.name && !isCurrent;
                  const isSelected = finalDrawName === player.name;
                  const statusLabel = isCurrent
                    ? 'Em jogo'
                    : isSelected
                    ? 'Selecionado'
                    : isHighlighted
                    ? 'Girando'
                    : null;

                  return (
                    <div
                      key={player.id}
                      className={cn(
                        'relative flex min-w-[140px] flex-col items-center gap-3 rounded-[28px] border border-border/40 bg-bg-900/40 px-4 py-4 text-center transition-shadow duration-300',
                        isCurrent && 'border-accent-500/70 shadow-[0_0_45px_-18px_rgba(255,138,76,0.9)]',
                        isHighlighted && !isSelected && 'border-[var(--color-primary-400)]/70',
                        isSelected && 'border-[var(--color-secondary-400)]/70'
                      )}
                    >
                      <div
                        className={cn(
                          'relative flex h-14 w-14 items-center justify-center rounded-full border-2 border-border/60 bg-bg-800/80 text-sm font-semibold uppercase tracking-[0.3em] text-text',
                          isCurrent && 'border-accent-400/80 text-accent-200',
                          isSelected && 'border-[var(--color-secondary-400)]/80 text-[var(--color-secondary-200)]'
                        )}
                      >
                        <span>{index + 1}</span>
                        {isCurrent && (
                          <span
                            className="pointer-events-none absolute inset-0 rounded-full border border-accent-400/60 opacity-80 blur-sm"
                            aria-hidden="true"
                          />
                        )}
                        {isHighlighted && !isCurrent && (
                          <span
                            className="pointer-events-none absolute inset-0 rounded-full border border-[var(--color-primary-400)]/60 animate-shuffle-pulse"
                            aria-hidden="true"
                          />
                        )}
                      </div>
                      <span className="text-[0.7rem] font-semibold uppercase tracking-[0.35em] text-text">
                        {player.name}
                      </span>
                      <div className="flex items-center gap-2 text-[0.6rem] uppercase tracking-[0.4em] text-text-subtle">
                        <Zap size={12} className="text-accent-300" />
                        {player.boostPoints}
                        <span className="hidden sm:inline">boosts</span>
                      </div>
                      {statusLabel && (
                        <span className="inline-flex items-center gap-1 rounded-pill border border-border/40 bg-bg-900/60 px-3 py-1 text-[0.55rem] uppercase tracking-[0.35em] text-text-subtle">
                          {isSelected ? (
                            <CheckCircle className="h-3 w-3 text-[var(--color-secondary-400)]" />
                          ) : isHighlighted ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Zap className="h-3 w-3 text-accent-300" />
                          )}
                          {statusLabel}
                        </span>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="flex min-w-[220px] flex-col items-center justify-center gap-2 rounded-[28px] border border-dashed border-border/50 bg-bg-900/40 px-6 py-8 text-center text-xs uppercase tracking-[0.35em] text-text-subtle">
                  Nenhum jogador inscrito
                  <span className="text-[0.6rem] text-text-subtle/70">Adicione participantes para iniciar</span>

                </div>
              )}
            </div>
          </div>
        </header>

        <GameTable
          intensity={intensity}
          phase={cardPhase}
          card={displayedCard}
          availableCounts={deckCounts}
          canDraw={canDrawCard}
          onDrawTruth={() => handleDrawCard('truth')}
          onDrawDare={() => handleDrawCard('dare')}
        />

        <footer className="mt-auto">
          <div className="rounded-[32px] border border-border/60 bg-bg-900/75 p-5 sm:p-6 shadow-heat [--focus-shadow:var(--shadow-heat)] backdrop-blur-xl">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center justify-center gap-3 text-[0.65rem] uppercase tracking-[0.35em] text-text-subtle">
                <span className="inline-flex items-center gap-2 rounded-pill border border-border/50 bg-bg-800/60 px-4 py-2">
                  <Zap size={14} className="text-accent-300" />
                  Boosts disponíveis: {currentPlayer?.boostPoints ?? 0}
                </span>
                <span className="inline-flex items-center gap-2 rounded-pill border border-border/50 bg-bg-800/60 px-4 py-2">
                  <Sparkles size={14} className="text-[var(--color-secondary-400)]" />
                  Boosts gastos: {boostsUsed}
                </span>
                <span className="inline-flex items-center gap-2 rounded-pill border border-border/50 bg-bg-800/60 px-4 py-2">
                  <Eye size={14} />
                  Cartas na pilha: {deckCounts.total}
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={onFulfillCard}
                  disabled={!canResolveCard}
                  className="flex h-12 items-center justify-center gap-2 rounded-pill bg-grad-heat px-6 text-sm font-semibold uppercase tracking-[0.2em] text-text shadow-heat [--focus-shadow:var(--shadow-heat)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <CheckCircle size={18} />
                  Cumprir
                </button>
                <button
                  onClick={onPassCard}
                  disabled={!canResolveCard}
                  className="flex h-12 items-center justify-center gap-2 rounded-pill border border-border px-6 text-sm font-semibold uppercase tracking-[0.2em] text-text transition hover:border-primary-500 hover:text-primary-300 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <XCircle size={18} />
                  Passar
                </button>
                <button
                  onClick={() => setShowCreateModal(true)}
                  disabled={!currentPlayer}
                  className="flex h-12 items-center justify-center gap-2 rounded-pill border border-border/60 bg-bg-800/70 px-4 text-sm font-semibold uppercase tracking-[0.2em] text-text transition hover:border-primary-500 hover:text-primary-300 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Plus size={18} />
                  Criar carta
                </button>
                <button
                  onClick={() => setShowDeckModal(true)}
                  className="flex h-12 items-center justify-center gap-2 rounded-pill border border-border/60 bg-bg-800/70 px-4 text-sm font-semibold uppercase tracking-[0.2em] text-text transition hover:border-primary-500 hover:text-primary-300"
                >
                  <Eye size={18} />
                  Baralho
                </button>
                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="flex h-12 items-center justify-center gap-2 rounded-pill border border-secondary-500/60 bg-transparent px-4 text-sm font-semibold uppercase tracking-[0.2em] text-secondary-300 transition hover:border-secondary-500 hover:text-secondary-500"
                >
                  <RotateCcw size={18} />
                  Reiniciar
                </button>
              </div>
            </div>
          </div>
        </footer>
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

export default GameScreen;
