import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GameState, Card, Player } from '../types/game';
import { CheckCircle, Loader2 } from 'lucide-react';
import { CreateCardModal } from './CreateCardModal';
import { DeckModal } from './DeckModal';
import { HUD } from '../ui/HUD';
import { ChoiceGrid } from '../ui/ChoiceGrid';
import { CardReveal } from '../ui/CardReveal';
import { Dock } from '../ui/Dock';
import { BeatReveal, WarmReveal, SparkOnSuccess } from '../ui/animations/VdAnim';


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
  const [ui, setUi] = useState({ sweeping: false, justFulfilled: false });

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

  const handleDraw = (kind: 'truth' | 'dare') => {
    setUi(s => ({ ...s, sweeping: true }));
    
    // Vibração tátil se disponível
    if ('vibrate' in navigator) {
      navigator.vibrate([20, 50, 20]);
    }
    
    setTimeout(() => {
      // Chama a lógica existente
      handleDrawCard(kind);
      setUi(s => ({ ...s, sweeping: false }));
    }, 650); // duração do batimento
  };

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

  const handleFulfill = () => {
    onFulfillCard(); // lógica existente
    setUi(s => ({ ...s, justFulfilled: true }));
    setTimeout(() => setUi(s => ({ ...s, justFulfilled: false })), 520);
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
    <div className="grid min-h-dvh grid-rows-[56px_auto_88px] overflow-hidden">
      <div className="px-4 py-2">
        {intensity && (
          <HUD intensity={intensity} currentPlayerInitial={currentPlayerInitial} boostPoints={boostPoints} />
        )}
      </div>
      <div className="overflow-hidden">
        {cardPhase === 'idle' ? (
          <BeatReveal run={ui.sweeping}>
          <BeatReveal run={ui.sweeping}>
            <ChoiceGrid
              onTruth={() => handleDraw('truth')}
              onDare={() => handleDraw('dare')}
              disabled={!canDrawCard}
            />
          </BeatReveal>
          </BeatReveal>
        ) : (
          <SparkOnSuccess success={ui.justFulfilled}>
            <WarmReveal show={!!activeCard}>
          <SparkOnSuccess success={ui.justFulfilled}>
            <WarmReveal show={!!activeCard}>
              <CardReveal
                cardText={activeCard?.text ?? ''}
                deckTotal={deckSummary}
                pileCount={pileCount}
                hasBoost={hasBoost}
                onFulfill={handleFulfill}
                onPass={onPassCard}
                canResolve={canResolveCard}
                isLoading={isCardLoading}
              />
            </WarmReveal>
          </SparkOnSuccess>
            </WarmReveal>
          </SparkOnSuccess>
        )}
      </div>
      <div>
        <Dock onCreate={handleOpenCreate} onDeck={handleOpenDeck} onReset={handleOpenReset} canCreate={Boolean(currentPlayer)} />
      </div>
    </div>
  );

  return (
    <>
      <div className="grid min-h-dvh grid-rows-[56px_auto_88px] overflow-hidden">
        <div className="px-4 py-2">
          {intensity && (
            <HUD intensity={intensity} currentPlayerInitial={currentPlayerInitial} boostPoints={boostPoints} />
          )}
        </div>
        <div className="overflow-hidden">
          {cardPhase === 'idle' ? (
            <BeatReveal run={ui.sweeping}>
              <ChoiceGrid
                onTruth={() => handleDraw('truth')}
                onDare={() => handleDraw('dare')}
                disabled={!canDrawCard}
              />
            </BeatReveal>
          ) : (
            <SparkOnSuccess success={ui.justFulfilled}>
              <WarmReveal show={!!activeCard}>
                <CardReveal
                  cardText={activeCard?.text ?? ''}
                  deckTotal={deckSummary}
                  pileCount={pileCount}
                  hasBoost={hasBoost}
                  onFulfill={handleFulfill}
                  onPass={onPassCard}
                  canResolve={canResolveCard}
                  isLoading={isCardLoading}
                />
              </WarmReveal>
            </SparkOnSuccess>
          )}
        </div>
        <div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-900/95 p-4 backdrop-blur-md">
          <div className="w-full max-w-sm space-y-6 rounded-card bg-bg-800/90 p-6">
            <div className="text-center">
              <div className="mb-4 text-6xl">⚠️</div>
              <h3 className="mb-2 font-display text-2xl font-bold text-white">
                REINICIAR?
              </h3>
              <p className="text-sm text-text-subtle">
                Todo progresso será perdido
              </p>
            </div>
            <div className="grid gap-3 grid-cols-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="h-12 rounded-pill border-2 border-border bg-transparent font-semibold text-white transition-all hover:scale-105 hover:border-primary-500 active:scale-95"
              >
                CANCELAR
              </button>
              <button
                onClick={() => {
                  onResetGame();
                  setShowResetConfirm(false);
                }}
                className="h-12 rounded-pill bg-secondary-500 font-semibold text-white transition-all hover:scale-105 active:scale-95"
              >
                REINICIAR
              </button>
            </div>
          </div>
        </div>
      )}

      {isDrawingPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-900/95 backdrop-blur-md">
          <div className="w-full max-w-md rounded-card bg-bg-800/90 p-8 text-center">
            <div className="space-y-6">
              <div className="text-6xl">🎯</div>
              <div className="min-h-[3rem] font-display text-3xl font-bold text-white" aria-live="polite">
                {drawHighlightText}
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-text-subtle">
                {finalDrawName ? (
                  <CheckCircle className="h-5 w-5 text-primary-500" />
                ) : (
                  <Loader2 className="h-5 w-5 animate-spin" />
                )}
                <span>{drawStatusText}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GameScreen;
