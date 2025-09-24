import { useState, useEffect } from 'react';
import { GameState, Player, Card, IntensityLevel, GameMode } from '../types/game';
import { seedCards } from '../data/seedCards';

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

  const startGame = (mode: GameMode, intensity: IntensityLevel, players: Player[]) => {
    const levelCards = seedCards.filter(card => card.level === intensity);
    setGameState({
      phase: 'playing',
      mode,
      intensity,
      players: players.map(p => ({ ...p, boostPoints: 3 })),
      currentPlayerIndex: 0,
      availableCards: [...levelCards],
      usedCards: [],
      currentCard: null,
    });
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

  const addCustomCard = (type: 'truth' | 'dare', text: string, applyBoost: boolean) => {
    if (!gameState.intensity) return;

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    
    if (applyBoost && currentPlayer.boostPoints < 2) {
      return false; // Not enough points
    }

    const newCard: Card = {
      id: `custom-${Date.now()}`,
      type,
      text,
      level: gameState.intensity,
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
  };
};