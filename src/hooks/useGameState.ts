import { useState, useEffect } from 'react';
import {
  GameState,
  Player,
  Card,
  IntensityLevel,
  GameMode,
  StartGameResult,
  StartGameOptions,
} from '@/types/game';
import { seedCards } from '@/data/seedCards';

import {
  fetchCardsByIntensity,
  createRemoteCard,
  REMOTE_DECK_ERROR_FLAG,
} from '@/services/cardService';

import { shuffleArray } from '@/utils/shuffle';
import { sanitizeGameState } from '@/utils/sanitizeGameState';

const STORAGE_KEY = 'verdade-ou-desafio-game';

const initialGameState: GameState = {
  phase: 'setup',
  mode: null,
  intensity: null,
  players: [],
  currentPlayerIndex: null,
  availableCards: [],
  usedCards: [],
  currentCard: null,
};

function safeRestore(): GameState | null {
  if (typeof window === 'undefined' || !('localStorage' in window)) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as unknown;
    const sanitized = sanitizeGameState(parsed);

    if (!sanitized) {
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
    }

    return sanitized;
  } catch {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    return null;
  }
}

const loadInitialState = (): GameState => safeRestore() ?? initialGameState;

export const useGameState = () => {
  const [gameState, setGameState] = useState<GameState>(loadInitialState);
  const [isStartingGame, setIsStartingGame] = useState(false);

  // Save to localStorage whenever state changes
  useEffect(() => {
    if (typeof window === 'undefined' || !('localStorage' in window)) {
      return;
    }

    try {
      const serialized = JSON.stringify(gameState);
      window.localStorage.setItem(STORAGE_KEY, serialized);
    } catch {
      // ignore
    }
  }, [gameState]);


  const startGame = async (
    mode: GameMode,
    intensity: IntensityLevel,
    players: Player[],
    options?: StartGameOptions
  ): Promise<StartGameResult> => {
    setIsStartingGame(true);

    const shouldShuffle = options?.shouldShuffle ?? true;
    const preparedPlayers = shouldShuffle ? shuffleArray(players) : players;

    const sanitizedPlayers = preparedPlayers.map(player => ({
      ...player,
      name: player.name.trim(),
    }));

    let usedFallback = false;
    let success = true;
    let errorMessage: string | undefined;
    let cardsToUse: Card[] = [];

    try {
      const remoteCards = await fetchCardsByIntensity(intensity);
      const remoteMetadata = remoteCards as {
        [REMOTE_DECK_ERROR_FLAG]?: true;
      };
      const remoteFailed = Boolean(remoteMetadata[REMOTE_DECK_ERROR_FLAG]);

      if (remoteCards.length > 0) {
        cardsToUse = remoteCards.map(card => ({
          ...card,
          isBoosted: Boolean(card.isBoosted),
        }));
      } else {
        usedFallback = true;
        success = false;
        errorMessage = remoteFailed
          ? 'Não foi possível carregar as cartas online. Usamos o baralho padrão offline.'
          : 'Nenhuma carta foi encontrada no baralho online para esse nível. Usamos o baralho padrão offline.';
      }

      if (cardsToUse.length === 0) {
        cardsToUse = seedCards.filter(card => card.level === intensity);
      }

      if (cardsToUse.length === 0) {
        usedFallback = true;
        success = false;
        errorMessage =
          errorMessage ??
          'Não encontramos cartas disponíveis para este nível. Adicione cartas personalizadas para começar.';
      }

      setGameState({
        phase: 'playing',
        mode,
        intensity,
        players: sanitizedPlayers.map(p => ({ ...p, boostPoints: 3 })),

        currentPlayerIndex: null,

        availableCards: [...cardsToUse],
        usedCards: [],
        currentCard: null,
      });

      return {
        success,
        usedFallback,
        errorMessage,
      };
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('Erro inesperado ao carregar cartas remotas:', error);
      }
      throw error;
    } finally {
      setIsStartingGame(false);
    }
  };

  const drawCard = (type: 'truth' | 'dare') => {
    if (gameState.currentPlayerIndex === null) {
      return null;
    }

    const { availableCards, intensity } = gameState;
    
    // First, check for boosted cards of the chosen type
    const boostedCards = availableCards.filter(card => 
      card.isBoosted && card.type === type && card.level === intensity
    );
    
    let selectedCard: Card;
    
    if (boostedCards.length > 0) {
      // Draw from boosted cards
      const randomIndex = Math.floor(Math.random() * boostedCards.length);
      selectedCard = boostedCards[randomIndex];
    } else {
      // Draw from non-used cards of the chosen type
      const availableCardsOfType = availableCards.filter(card => 
        card.type === type && card.level === intensity
      );
      
      if (availableCardsOfType.length === 0) {
        return null; // No cards available
      }
      
      const randomIndex = Math.floor(Math.random() * availableCardsOfType.length);
      selectedCard = availableCardsOfType[randomIndex];
    }

    setGameState(prev => ({
      ...prev,
      currentCard: selectedCard,
    }));

    return selectedCard;
  };

  const fulfillCard = () => {
    if (!gameState.currentCard) return;

    setGameState(prev => {
      if (!prev.currentCard) {
        return prev;
      }

      const updatedCards = prev.availableCards.filter(card => card.id !== prev.currentCard.id);
      const updatedUsedCards = [...prev.usedCards];

      if (!prev.currentCard.isBoosted) {
        updatedUsedCards.push(prev.currentCard);
      }

      const shouldRewardBoost = prev.currentPlayerIndex !== null;

      const updatedPlayers = shouldRewardBoost
        ? prev.players.map((player, index) =>
            index === prev.currentPlayerIndex
              ? { ...player, boostPoints: Math.min(player.boostPoints + 1, 5) }
              : player
          )
        : prev.players;

      return {
        ...prev,
        availableCards: updatedCards,
        usedCards: updatedUsedCards,
        players: updatedPlayers,
        currentCard: null,
        currentPlayerIndex: null,
      };
    });
  };

  const passCard = () => {
    setGameState(prev => ({
      ...prev,
      currentCard: null,
      currentPlayerIndex: null,
    }));
  };

  const drawNextPlayer = () => {
    let selectedPlayer: Player | null = null;

    setGameState(prev => {
      if (prev.players.length === 0) {
        return prev;
      }

      const randomIndex = Math.floor(Math.random() * prev.players.length);
      selectedPlayer = prev.players[randomIndex];

      return {
        ...prev,
        currentPlayerIndex: randomIndex,
      };
    });

    return selectedPlayer;
  };

  const addCustomCard = async (
    type: 'truth' | 'dare',
    text: string,
    applyBoost: boolean
  ): Promise<boolean> => {
    if (!gameState.intensity) return false;

    const intensity = gameState.intensity;
    const currentIndex = gameState.currentPlayerIndex;
    const currentPlayer = currentIndex !== null ? gameState.players[currentIndex] : null;

    if (applyBoost && (!currentPlayer || currentPlayer.boostPoints < 2)) {
      return false; // Not enough points
    }

    try {
      const remoteId = await createRemoteCard({
        type,
        text,
        level: intensity,
        isCustom: true,
      });

      const newCard: Card = {
        id: remoteId,
        type,
        text,
        level: intensity,
        isBoosted: applyBoost,
        isCustom: true,
      };

      setGameState(prev => {
        const updatedPlayers = applyBoost && prev.currentPlayerIndex !== null
          ? prev.players.map((player, index) =>
              index === prev.currentPlayerIndex
                ? { ...player, boostPoints: player.boostPoints - 2 }
                : player
            )
          : prev.players;

        return {
          ...prev,
          availableCards: [...prev.availableCards, newCard],
          players: updatedPlayers,
        };
      });

      return true;
    } catch (error) {
      console.error('Erro ao criar carta personalizada:', error);
      return false;
    }
  };

  const resetGame = () => {
    setGameState(initialGameState);

    if (typeof window === 'undefined' || !('localStorage' in window)) {
      return;
    }

    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  return {
    gameState,
    startGame,
    drawCard,
    fulfillCard,
    passCard,
    drawNextPlayer,
    addCustomCard,
    resetGame,
    isStartingGame,
  };
};