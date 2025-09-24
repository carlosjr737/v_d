import { useState, useEffect } from 'react';
import {
  GameState,
  Player,
  Card,
  IntensityLevel,
  GameMode,
  StartGameResult,
} from '../types/game';
import { seedCards } from '../data/seedCards';
import { fetchCardsByIntensity, createRemoteCard } from '../services/cardService';

const STORAGE_KEY = 'verdade-ou-desafio-game';

const initialGameState: GameState = {
  phase: 'setup',
  mode: null,
  intensity: null,
  players: [],
  currentPlayerIndex: 0,
  availableCards: [],
  usedCards: [],
  currentCard: null,
};

export const useGameState = () => {
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const [isStartingGame, setIsStartingGame] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setGameState(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading game state:', error);
      }
    }
  }, []);

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
  }, [gameState]);

  const startGame = async (
    mode: GameMode,
    intensity: IntensityLevel,
    players: Player[]
  ): Promise<StartGameResult> => {
    setIsStartingGame(true);

    let usedFallback = false;
    let success = true;
    let errorMessage: string | undefined;
    let cardsToUse: Card[] = [];

    try {
      try {
        const remoteCards = await fetchCardsByIntensity(intensity);

        if (remoteCards.length > 0) {
          cardsToUse = remoteCards.map(card => ({
            ...card,
            isBoosted: Boolean(card.isBoosted),
          }));
        } else {
          usedFallback = true;
          success = false;
          errorMessage =
            'Nenhuma carta foi encontrada no baralho online para esse nível. Usamos o baralho padrão offline.';
        }
      } catch (error) {
        console.error('Erro ao carregar cartas do Firebase:', error);
        usedFallback = true;
        success = false;
        errorMessage =
          'Não foi possível carregar as cartas online. Usamos o baralho padrão offline.';
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
        players: players.map(p => ({ ...p, boostPoints: 3 })),
        currentPlayerIndex: 0,
        availableCards: [...cardsToUse],
        usedCards: [],
        currentCard: null,
      });

      return {
        success,
        usedFallback,
        errorMessage,
      };
    } finally {
      setIsStartingGame(false);
    }
  };

  const drawCard = (type: 'truth' | 'dare') => {
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
      const updatedCards = prev.availableCards.filter(card => card.id !== prev.currentCard!.id);
      const updatedUsedCards = [...prev.usedCards];
      
      // Only add to used cards if it wasn't boosted (boosted cards get discarded)
      if (!prev.currentCard!.isBoosted) {
        updatedUsedCards.push(prev.currentCard!);
      }

      // Award boost point (max 5)
      const updatedPlayers = prev.players.map((player, index) => 
        index === prev.currentPlayerIndex 
          ? { ...player, boostPoints: Math.min(player.boostPoints + 1, 5) }
          : player
      );

      return {
        ...prev,
        availableCards: updatedCards,
        usedCards: updatedUsedCards,
        players: updatedPlayers,
        currentCard: null,
        currentPlayerIndex: (prev.currentPlayerIndex + 1) % prev.players.length,
      };
    });
  };

  const passCard = () => {
    setGameState(prev => ({
      ...prev,
      currentCard: null,
      currentPlayerIndex: (prev.currentPlayerIndex + 1) % prev.players.length,
    }));
  };

  const addCustomCard = async (
    type: 'truth' | 'dare',
    text: string,
    applyBoost: boolean
  ): Promise<boolean> => {
    if (!gameState.intensity) return false;

    const intensity = gameState.intensity;
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];

    if (applyBoost && currentPlayer.boostPoints < 2) {
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
        const updatedPlayers = applyBoost
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
    localStorage.removeItem(STORAGE_KEY);
  };

  return {
    gameState,
    startGame,
    drawCard,
    fulfillCard,
    passCard,
    addCustomCard,
    resetGame,
    isStartingGame,
  };
};