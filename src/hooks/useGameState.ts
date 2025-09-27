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
import { createRemoteCard } from '@/services/cardService';
import { getCardsForType } from '@/services/cards';

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


  const setSetupIntensity = (level: IntensityLevel) => {
    setGameState(prev => {
      if (prev.phase !== 'setup' || prev.intensity === level) {
        return prev;
      }

      return {
        ...prev,
        intensity: level,
      };
    });
  };

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
      const [truthDeck, dareDeck] = await Promise.all([
        getCardsForType(intensity, 'truth'),
        getCardsForType(intensity, 'dare'),
      ]);

      const remoteFailed = truthDeck.remoteFailed || dareDeck.remoteFailed;
      const remoteProvidedCards = truthDeck.remoteHasData || dareDeck.remoteHasData;

      if (remoteFailed) {
        usedFallback = true;
        success = false;
        errorMessage =
          'Não foi possível carregar as cartas online. Usamos o baralho padrão offline.';
      } else if (!remoteProvidedCards) {
        usedFallback = true;
        success = false;
        errorMessage =
          'Nenhuma carta foi encontrada no baralho online para esse nível. Usamos o baralho padrão offline.';
      }

      cardsToUse = shuffleArray([...truthDeck.cards, ...dareDeck.cards]);

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

  const addCardToDeck = (card: Card) => {
    setGameState(prev => {
      const alreadyExists = prev.availableCards.some(existing => existing.id === card.id);
      if (alreadyExists) {
        return prev;
      }
      return {
        ...prev,
        availableCards: [...prev.availableCards, card],
      };
    });
  };

  const removeCardFromDeck = (cardId: string) => {
    setGameState(prev => ({
      ...prev,
      availableCards: prev.availableCards.filter(card => card.id !== cardId),
    }));
  };

  const forceCard = (card: Card) => {
    setGameState(prev => ({
      ...prev,
      currentCard: card,
    }));
    return card;
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
    setSetupIntensity,
    startGame,
    drawCard,
    forceCard,
    fulfillCard,
    passCard,
    drawNextPlayer,
    addCustomCard,
    addCardToDeck,
    removeCardFromDeck,
    resetGame,
    isStartingGame,
  };
};