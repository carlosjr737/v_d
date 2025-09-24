import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GameState, Card, Player } from '../types/game';
import { CheckCircle, Loader2 } from 'lucide-react';
import { CreateCardModal } from './CreateCardModal';
import { DeckModal } from './DeckModal';

import { HUD } from '../ui/HUD';
import { ChoiceGrid } from '../ui/ChoiceGrid';
import { CardArea } from '../ui/CardArea';
import { Dock } from '../ui/Dock';


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

  const canDrawCard = Boolean(currentPlayer) && !isDrawingPlayer && cardPhase === 'idle';
  const canResolveCard = cardPhase === 'revealed' && Boolean(currentCard);

  const activeName = currentPlayer?.name ?? finalDrawName ?? highlightedName ?? '';
  const currentPlayerInitial = activeName ? activeName.charAt(0).toUpperCase() : '—';
  const boostPoints = currentPlayer?.boostPoints ?? 0;

  const activeCard = displayedCard ?? currentCard;
  const deckSummary = `V${deckCounts.truth}/D${deckCounts.dare}`;
  const pileCount = deckCounts.used;
  const hasBoost = Boolean(activeCard?.isBoosted);
  const isCardLoading = cardPhase !== 'revealed';

  const handleOpenCreate = () => {
    if (!currentPlayer) {
      return;
    }
    setShowCreateModal(true);
  };

  const handleOpenDeck = () => setShowDeckModal(true);
  const handleOpenReset = () => setShowResetConfirm(true);

  return (
    <div className="flex min-h-dvh w-full justify-center">
      <div className="grid min-h-dvh w-full max-w-md grid-rows-[56px_auto_88px] safe-px">
        <div className="py-3">
          {intensity ? (
            <HUD intensity={intensity} currentPlayerInitial={currentPlayerInitial} boostPoints={boostPoints} />
          ) : null}
        </div>
        <div className="flex flex-col justify-center overflow-hidden">
          {cardPhase === 'idle' ? (
            <ChoiceGrid
              onTruth={() => handleDrawCard('truth')}
              onDare={() => handleDrawCard('dare')}
              disabled={!canDrawCard}
            />
          ) : (
            <CardArea
              deckTotal={deckSummary}
              pileCount={pileCount}
              hasBoost={hasBoost}
              cardText={activeCard?.text ?? ''}
              onFulfill={onFulfillCard}
              onPass={onPassCard}
              canResolve={canResolveCard}
              isLoading={isCardLoading}
            />
          )}
        </div>
        <div className="pb-[max(env(safe-area-inset-bottom),12px)]">
          <Dock onCreate={handleOpenCreate} onDeck={handleOpenDeck} onReset={handleOpenReset} canCreate={Boolean(currentPlayer)} />
        </div>
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
