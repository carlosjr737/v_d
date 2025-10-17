import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { GameState as LegacyGameState, Card as GameCard, Player } from '../types/game';
import { CheckCircle, Loader2 } from 'lucide-react';
import { CreateCardModal } from './CreateCardModal';
import { DeckModal } from './DeckModal';
import { ChooseNextCardModal } from './ChooseNextCardModal';
import { AuthModal } from './AuthModal';
import { TurnHeader } from '@/components/TurnHeader';
import { ChooseNextCardButton } from '@/components/ChooseNextCardButton';
import { ChoiceGrid } from '../ui/ChoiceGrid';
import { CardReveal } from '../ui/CardReveal';
import { Dock } from '../ui/Dock';
import { BeatReveal, WarmReveal, SparkOnSuccess } from '@/ui/animations/VdAnim';
import { playDeltaThen } from '@/ui/utils';
import type { GameState as ChooseGameState } from '@/models/game';
import type { CardIntensity } from '@/models/cards';
import { chooseNextCardReducer, type Action as ChooseAction } from '@/state/chooseNextCardReducer';
import { toGameCard, toPowerCard } from '@/utils/powerCardAdapter';
import { useEntitlement } from '@/hooks/useEntitlement';

function createPowerStateFromGame(gameState: LegacyGameState): ChooseGameState {
  const intensity = (gameState.intensity ?? 'leve') as CardIntensity;

  const remainingByIntensity: Record<CardIntensity, string[]> = {
    leve: [],
    medio: [],
    pesado: [],
    extremo: [],
  };

  const cardsForIntensity = gameState.availableCards.filter(card => card.level === intensity);
  remainingByIntensity[intensity] = cardsForIntensity.map(card => card.id);

  const cardsById: ChooseGameState['cardsById'] = {};
  cardsForIntensity.forEach(card => {
    cardsById[card.id] = toPowerCard(card, intensity);
  });

  const players: ChooseGameState['players'] = {};
  const queuedNextForPlayer: ChooseGameState['queuedNextForPlayer'] = {};
  const cooldowns: ChooseGameState['cooldowns'] = {};

  gameState.players.forEach(player => {
    players[player.id] = {
      id: player.id,
      name: player.name,
      points: 10,
      lastTargetedByChooseNextCard: null,
    };
    queuedNextForPlayer[player.id] = null;
    cooldowns[player.id] = { choose_next_card: 0 };
  });

  return {
    intensity,
    remainingByIntensity,
    cardsById,
    players,
    queuedNextForPlayer,
    cooldowns,
    logs: [],
  };
}

function syncPowerStateWithGame(prev: ChooseGameState, gameState: LegacyGameState): ChooseGameState {
  if (!gameState.intensity) {
    return prev;
  }

  const intensity = gameState.intensity as CardIntensity;

  if (intensity !== prev.intensity) {
    const fresh = createPowerStateFromGame(gameState);
    Object.keys(fresh.players).forEach(pid => {
      if (prev.players[pid]) {
        fresh.players[pid].points = prev.players[pid].points;
        fresh.players[pid].lastTargetedByChooseNextCard =
          prev.players[pid].lastTargetedByChooseNextCard ?? null;
        const prevCooldown = prev.cooldowns[pid]?.choose_next_card ?? 0;
        fresh.cooldowns[pid] = { choose_next_card: prevCooldown };
        fresh.queuedNextForPlayer[pid] = prev.queuedNextForPlayer[pid] ?? null;
      }
    });
    fresh.logs = prev.logs;
    return fresh;
  }

  const cardsForIntensity = gameState.availableCards.filter(card => card.level === intensity);
  const cardsById = { ...prev.cardsById };
  cardsForIntensity.forEach(card => {
    cardsById[card.id] = toPowerCard(card, intensity);
  });

  const availableIds = new Set(cardsForIntensity.map(card => card.id));
  const previousQueue = prev.remainingByIntensity[intensity] ?? [];
  const filteredQueue = previousQueue.filter(id => availableIds.has(id));
  const missing: string[] = [];
  availableIds.forEach(id => {
    if (!filteredQueue.includes(id)) {
      missing.push(id);
    }
  });

  const remainingByIntensity: ChooseGameState['remainingByIntensity'] = {
    ...prev.remainingByIntensity,
    [intensity]: [...filteredQueue, ...missing],
  };

  const players: ChooseGameState['players'] = {};
  const queuedNextForPlayer: ChooseGameState['queuedNextForPlayer'] = {};
  const cooldowns: ChooseGameState['cooldowns'] = {};

  gameState.players.forEach(player => {
    const prevPlayer = prev.players[player.id];
    players[player.id] = {
      id: player.id,
      name: player.name,
      points: prevPlayer?.points ?? 10,
      lastTargetedByChooseNextCard: prevPlayer?.lastTargetedByChooseNextCard ?? null,
    };
    queuedNextForPlayer[player.id] = prev.queuedNextForPlayer[player.id] ?? null;
    cooldowns[player.id] = {
      choose_next_card: prev.cooldowns[player.id]?.choose_next_card ?? 0,
    };
  });

  Object.keys(prev.players).forEach(pid => {
    if (!players[pid]) {
      delete queuedNextForPlayer[pid];
      delete cooldowns[pid];
    }
  });

  return {
    ...prev,
    intensity,
    cardsById,
    remainingByIntensity,
    players,
    queuedNextForPlayer,
    cooldowns,
  };
}

interface GameScreenProps {
  gameState: LegacyGameState;
  onDrawCard: (type: 'truth' | 'dare') => GameCard | null;
  onForceCard: (card: GameCard) => GameCard | null;
  onFulfillCard: () => void;
  onPassCard: () => void;
  onAddCustomCard: (
    type: 'truth' | 'dare',
    text: string,
    applyBoost: boolean
  ) => Promise<boolean>;
  onResetGame: () => void;
  onDrawNextPlayer: () => Player | null;
  onAddCardToDeck: (card: GameCard) => void;
  onRemoveCardFromDeck: (cardId: string) => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({
  gameState,
  onDrawCard,
  onForceCard,
  onFulfillCard,
  onPassCard,
  onAddCustomCard,
  onResetGame,
  onDrawNextPlayer,
  onAddCardToDeck,
  onRemoveCardFromDeck,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeckModal, setShowDeckModal] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isDrawingPlayer, setIsDrawingPlayer] = useState(false);
  const [drawOverlayVisible, setDrawOverlayVisible] = useState(false);
  const [highlightedName, setHighlightedName] = useState<string | null>(null);
  const [finalDrawName, setFinalDrawName] = useState<string | null>(null);
  const [cardPhase, setCardPhase] = useState<'idle' | 'drawing' | 'preparing' | 'revealed'>(
    gameState.currentCard ? 'revealed' : 'idle'
  );
  const [displayedCard, setDisplayedCard] = useState<GameCard | null>(gameState.currentCard);
  const [ui, setUi] = useState({ drawing: false, justFulfilled: false });
  const [isChooseModalOpen, setIsChooseModalOpen] = useState(false);
  const [powerState, setPowerState] = useState<ChooseGameState>(() => createPowerStateFromGame(gameState));
  const [pointDeltas, setPointDeltas] = useState<Record<string, number | null>>({});
  const {
    user,
    loginGoogle,
    loginEmailPassword,
    logout,
    loading: entitlementLoading,
    active: hasPremiumEntitlement,
    openCustomerPortal,
  } = useEntitlement();

  const [authBusy, setAuthBusyState] = useState(false);
  const handleAuthBusyChange = useCallback((busy: boolean) => {
    setAuthBusyState(busy);
  }, []);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);


  const drawIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const drawTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const revealTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cardAnimationTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const isMountedRef = useRef(true);
  const deltaGuardsRef = useRef<Record<string, symbol>>({});

  // ✅ ref correta aqui dentro do componente
  const deltaTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const playDeltaForPlayer = useCallback(
    (playerId: string, delta: number, delay = 900) => {
      if (!playerId || delta === 0) return Promise.resolve();

      const token = Symbol('delta');
      deltaGuardsRef.current[playerId] = token;

      const setDelta = (pid: string, value: number | null) => {
        if (!isMountedRef.current || pid !== playerId) return;

        if (value === null) {
          if (deltaGuardsRef.current[playerId] !== token) return;
          setPointDeltas(prev => {
            if (prev[playerId] === undefined) return prev;
            const next = { ...prev };
            delete next[playerId];
            return next;
          });
          delete deltaGuardsRef.current[playerId];
          return;
        }

        deltaGuardsRef.current[playerId] = token;
        setPointDeltas(prev => ({ ...prev, [playerId]: value }));
      };

      return playDeltaThen(setDelta, playerId, delta, delay);
    },
    [setPointDeltas]
  );

  const currentPlayer =
    gameState.currentPlayerIndex !== null
      ? gameState.players[gameState.currentPlayerIndex]
      : null;
  const { currentCard } = gameState;
  const intensity = gameState.intensity!;

  const dispatchPower = useCallback(
    (action: ChooseAction): Promise<void> => {
      const deltaPromises: Promise<void>[] = [];

      setPowerState(prev => {
        const next = chooseNextCardReducer(prev, action);

        Object.keys(next.players).forEach(pid => {
          const before = prev.players[pid]?.points ?? 0;
          const after = next.players[pid]?.points ?? 0;
          if (before !== after) {
            deltaPromises.push(playDeltaForPlayer(pid, after - before));
          }
        });

        if (action.type === 'POWER_CHOOSE_NEXT_COMMIT') {
          const { targetId, chosenCardId } = action.payload;
          if (next.queuedNextForPlayer[targetId] === chosenCardId && prev.queuedNextForPlayer[targetId] !== chosenCardId) {
            onRemoveCardFromDeck(chosenCardId);
          }
        }

        return next;
      });

      if (deltaPromises.length === 0) return Promise.resolve();
      return Promise.all(deltaPromises).then(() => undefined);
    },
    [onRemoveCardFromDeck, playDeltaForPlayer]
  );

  useEffect(() => {
    setPowerState(prev => syncPowerStateWithGame(prev, gameState));
  }, [gameState.availableCards, gameState.intensity, gameState.players]);

  const adjustPlayerPoints = useCallback((playerId: string, delta: number) => {
    if (!playerId || delta === 0) return;
    setPowerState(prev => {
      const player = prev.players[playerId];
      if (!player) return prev;
      const updatedPlayer = { ...player, points: Math.max(0, player.points + delta) };
      return { ...prev, players: { ...prev.players, [playerId]: updatedPlayer } };
    });
  }, []);

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
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      deltaGuardsRef.current = {};
      clearDrawTimers();
      clearCardAnimationTimers();
      // ✅ limpa timeouts que registramos
      deltaTimeoutsRef.current.forEach(clearTimeout);
      deltaTimeoutsRef.current = [];
    };
  }, [clearCardAnimationTimers, clearDrawTimers]);

  useEffect(() => {
    if (!currentPlayer && isChooseModalOpen) {
      setIsChooseModalOpen(false);
    }
  }, [currentPlayer, isChooseModalOpen]);

  const startPlayerDraw = useCallback(() => {
    if (isDrawingPlayer || gameState.players.length === 0) return;

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
    if (gameState.phase !== 'playing') return;
    if (gameState.players.length === 0) return;
    if (gameState.currentPlayerIndex !== null) return;
    if (isDrawingPlayer) return;
    startPlayerDraw();
  }, [gameState.phase, gameState.players, gameState.currentPlayerIndex, isDrawingPlayer, startPlayerDraw]);

  useEffect(() => {
    if (!currentPlayer && showCreateModal) {
      setShowCreateModal(false);
    }
  }, [currentPlayer, showCreateModal]);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    if (isDrawingPlayer) {
      timeout = setTimeout(() => setDrawOverlayVisible(true), 900);
      if (timeout) deltaTimeoutsRef.current.push(timeout);
    } else {
      setDrawOverlayVisible(false);
    }

    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [isDrawingPlayer]);

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

  const handleDraw = (kind: 'verdade' | 'desafio') => {
    setUi((s) => ({ ...s, drawing: true }));
    try {
      navigator.vibrate?.(35);
    } catch (err) {
      if (import.meta.env.DEV) {
        // Alguns navegadores lançam erro quando a API de vibração não está disponível.
        console.warn('Vibração indisponível neste dispositivo.', err);
      }
    }
    const t = setTimeout(() => {
      if (kind === 'verdade') {
        handleDrawCard('truth');
      } else {
        handleDrawCard('dare');
      }
      setUi((s) => ({ ...s, drawing: false }));
    }, 650);
    deltaTimeoutsRef.current.push(t);
  };

  const handleDrawCard = (type: 'truth' | 'dare') => {
    if (!currentPlayer || cardPhase === 'drawing' || cardPhase === 'preparing') {
      return;
    }

    clearCardAnimationTimers();
    setCardPhase('drawing');
    setDisplayedCard(null);

    const forcedCardId = powerState.queuedNextForPlayer[currentPlayer.id];
    if (forcedCardId) {
      const forced = powerState.cardsById[forcedCardId];
      if (forced) {
        onForceCard(toGameCard(forced));
        void dispatchPower({ type: 'POWER_CHOOSE_NEXT_CONSUMED', targetId: currentPlayer.id });
        void dispatchPower({
          type: 'LOG',
          message: `Carta forçada entregue para ${currentPlayer.name}.`,
        });
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
        return;
      }
      void dispatchPower({ type: 'POWER_CHOOSE_NEXT_CONSUMED', targetId: currentPlayer.id });
    }

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

  const handleFulfill = async () => {
    const fulfillingPlayerId = currentPlayer?.id;
    if (fulfillingPlayerId) {
      adjustPlayerPoints(fulfillingPlayerId, 1);
      await playDeltaForPlayer(fulfillingPlayerId, 1, 900);
    }

    onFulfillCard(); // lógica existente
    await dispatchPower({ type: 'TICK_TURN' });
    setUi((s) => ({ ...s, justFulfilled: true }));
    const t = setTimeout(() => setUi((s) => ({ ...s, justFulfilled: false })), 520);
    deltaTimeoutsRef.current.push(t);
  };

  const handlePass = async () => {
    onPassCard();
    await dispatchPower({ type: 'TICK_TURN' });
  };


  const authLoading = authBusy || entitlementLoading;
  const userLabel = user?.displayName || user?.email || null;
  const handleOpenAuthModal = useCallback(() => {
    if (authBusy) {
      return;
    }
    setIsAuthModalOpen(true);
  }, [authBusy]);

  const handleCloseAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);


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

  const boostPoints = currentPlayer?.boostPoints ?? 0;

  const activeCard = displayedCard ?? currentCard;
  const deckSummary = `V${deckCounts.truth}/D${deckCounts.dare}`;
  const pileCount = deckCounts.used;
  const hasBoost = Boolean(activeCard?.isBoosted);
  const isCardLoading = cardPhase !== 'revealed';

  const chooserPower = currentPlayer ? powerState.players[currentPlayer.id] : undefined;
  const chooseCooldown = currentPlayer
    ? powerState.cooldowns[currentPlayer.id]?.choose_next_card ?? 0
    : 0;
  const chooserPoints = chooserPower?.points ?? 0;
  const currentPlayerPoints = currentPlayer ? chooserPoints : 0;
  const currentPlayerDelta = currentPlayer ? pointDeltas[currentPlayer.id] ?? null : null;

  const handleOpenCreate = () => {
    if (!currentPlayer) {
      return;
    }
    setShowCreateModal(true);
  };

  const handleOpenDeck = () => setShowDeckModal(true);
  const handleOpenReset = () => setShowResetConfirm(true);
  const handleOpenChoosePower = () => {
    if (!currentPlayer || !chooserPower) {
      return;
    }

    if (chooserPower.points < 5 || chooseCooldown !== 0) {
      return;
    }
    void dispatchPower({ type: 'POWER_CHOOSE_NEXT_REQUEST', chooserId: currentPlayer.id });
    setIsChooseModalOpen(true);
  };

  return (
    <>
      <div className="grid min-h-dvh grid-rows-[auto_auto_88px] overflow-hidden">
        <div className="px-4 py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <TurnHeader
              currentPlayer={currentPlayer}
              intensity={intensity}
              boostPoints={boostPoints}
              points={currentPlayerPoints}
              lastDelta={currentPlayerDelta}
            />
            <div className="flex shrink-0 flex-col items-end gap-2 text-right text-xs text-text-subtle">
              {userLabel && <span className="max-w-[12rem] truncate">Logado como {userLabel}</span>}

              <button
                type="button"
                onClick={handleOpenAuthModal}
                disabled={authLoading}
                className="rounded-pill border border-white/30 px-4 py-2 text-sm font-semibold text-white transition hover:border-white focus:outline-none focus:ring-2 focus:ring-white/40 disabled:opacity-60"
              >
                {authLoading ? 'Carregando...' : user ? 'Conta' : 'Entrar'}
              </button>

            </div>
          </div>
        </div>
        <div className="overflow-hidden">
          {cardPhase === 'idle' ? (
            <BeatReveal run={ui.drawing}>
              <ChoiceGrid
                onTruth={() => handleDraw('verdade')}
                onDare={() => handleDraw('desafio')}
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
                  onPass={handlePass}
                  canResolve={canResolveCard}
                  isLoading={isCardLoading}
                />
              </WarmReveal>
            </SparkOnSuccess>
          )}
        </div>
        <div>
          <Dock
            onCreate={handleOpenCreate}
            onDeck={handleOpenDeck}
            onReset={handleOpenReset}
            onChoosePower={handleOpenChoosePower}
            canCreate={Boolean(currentPlayer)}
            powerButton={
              <ChooseNextCardButton
                currentPlayerId={currentPlayer?.id ?? null}
                state={powerState}
                onOpenModal={handleOpenChoosePower}
              />
            }
          />
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

      {isChooseModalOpen && currentPlayer && (
        <ChooseNextCardModal
          isOpen={isChooseModalOpen}
          onClose={() => setIsChooseModalOpen(false)}
          state={powerState}
          chooserId={currentPlayer.id}
          dispatch={dispatchPower}
          onCardCreated={card => {
            onAddCardToDeck(toGameCard(card));
          }}
        />
      )}

      {(isDrawingPlayer || drawOverlayVisible) && (
        <div
          className={`fixed inset-0 flex items-center justify-center bg-bg-900/95 backdrop-blur-md transition-opacity duration-200 ${
            drawOverlayVisible
              ? 'z-40 opacity-100 pointer-events-auto'
              : 'z-10 opacity-0 pointer-events-none'
          }`}
        >
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
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={handleCloseAuthModal}

        onBusyChange={handleAuthBusyChange}

        user={user}
        loginWithGoogle={loginGoogle}
        loginWithEmailPassword={loginEmailPassword}
        logout={logout}
        isPremium={hasPremiumEntitlement}
        onManageSubscription={openCustomerPortal}
      />
    </>
  );
};

export default GameScreen;
