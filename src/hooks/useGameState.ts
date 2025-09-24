import { useState, useEffect } from 'react';
import {
  GameState,
  Player,
  Card,
  IntensityLevel,
  GameMode,
  StartGameResult,
  StartGameOptions,
} from '../types/game';
import { seedCards } from '../data/seedCards';
import { fetchCardsByIntensity, createRemoteCard } from '../services/cardService';
import { shuffleArray } from '../utils/shuffle';

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

const intensityLevels: IntensityLevel[] = ['leve', 'medio', 'pesado', 'extremo'];
const gameModes: GameMode[] = ['grupo', 'casal'];


const getSafeLocalStorage = (): Storage | null => {
  try {
    if (typeof globalThis === 'undefined') {
      return null;
    }

    if (!('localStorage' in globalThis)) {
      return null;
    }

    const storage = (globalThis as typeof globalThis & { localStorage?: Storage }).localStorage ?? null;

    return storage ?? null;
  } catch (error) {
    console.error('Error accessing localStorage:', error);
    return null;
  }
};

const isIntensityLevel = (value: unknown): value is IntensityLevel =>
  typeof value === 'string' && intensityLevels.includes(value as IntensityLevel);

const isGameMode = (value: unknown): value is GameMode =>
  typeof value === 'string' && gameModes.includes(value as GameMode);

const sanitizePlayers = (players: unknown): Player[] => {
  if (!Array.isArray(players)) {
    return [];
  }

  return players
    .map((rawPlayer, index) => {
      if (!rawPlayer || typeof rawPlayer !== 'object') {
        return null;
      }

      const candidate = rawPlayer as Partial<Player> & { name?: unknown; boostPoints?: unknown; id?: unknown };
      const name = typeof candidate.name === 'string' ? candidate.name : '';
      const id = typeof candidate.id === 'string' && candidate.id.trim().length > 0 ? candidate.id : `player-${index}`;
      const boostPoints =
        typeof candidate.boostPoints === 'number' && Number.isFinite(candidate.boostPoints)
          ? Math.max(0, Math.min(5, Math.round(candidate.boostPoints)))
          : 3;

      return {
        id,
        name,
        boostPoints,
      } satisfies Player;
    })
    .filter((player): player is Player => Boolean(player));
};

const sanitizeCards = (cards: unknown): Card[] => {
  if (!Array.isArray(cards)) {
    return [];
  }

  return cards
    .map(card => {
      if (!card || typeof card !== 'object') {
        return null;
      }

      const candidate = card as Partial<Card> & {
        id?: unknown;
        type?: unknown;
        text?: unknown;
        level?: unknown;
        isBoosted?: unknown;
        isCustom?: unknown;
      };

      if (typeof candidate.id !== 'string' || candidate.id.length === 0) {
        return null;
      }

      if (candidate.type !== 'truth' && candidate.type !== 'dare') {
        return null;
      }

      if (typeof candidate.text !== 'string' || candidate.text.length === 0) {
        return null;
      }

      if (!isIntensityLevel(candidate.level)) {
        return null;
      }

      return {
        id: candidate.id,
        type: candidate.type,
        text: candidate.text,
        level: candidate.level,
        isBoosted: Boolean(candidate.isBoosted),
        isCustom: Boolean(candidate.isCustom),
      } satisfies Card;
    })
    .filter((card): card is Card => Boolean(card));
};

const sanitizeGameState = (rawState: unknown): GameState | null => {
  if (!rawState || typeof rawState !== 'object') {
    return null;
  }

  const candidate = rawState as Partial<GameState> & {
    players?: unknown;
    availableCards?: unknown;
    usedCards?: unknown;
    currentCard?: unknown;
  };

  const phase: GameState['phase'] = candidate.phase === 'playing' ? 'playing' : 'setup';
  const mode = isGameMode(candidate.mode) ? candidate.mode : null;
  const intensity = isIntensityLevel(candidate.intensity) ? candidate.intensity : null;
  const players = sanitizePlayers(candidate.players);
  const availableCards = sanitizeCards(candidate.availableCards);
  const usedCards = sanitizeCards(candidate.usedCards);

  const currentPlayerIndex =
    typeof candidate.currentPlayerIndex === 'number' &&
    Number.isInteger(candidate.currentPlayerIndex) &&
    candidate.currentPlayerIndex >= 0 &&
    candidate.currentPlayerIndex < players.length
      ? candidate.currentPlayerIndex
      : null;

  const currentCardCandidate = candidate.currentCard ? sanitizeCards([candidate.currentCard])[0] : null;
  const currentCard = currentCardCandidate ?? null;

  if (phase === 'playing' && (!mode || !intensity || players.length < 2)) {
    return null;
  }

  return {
    phase,
    mode,
    intensity,
    players,
    currentPlayerIndex,
    availableCards,
    usedCards,
    currentCard,
  } satisfies GameState;
};

const loadInitialState = (): GameState => {
  const storage = getSafeLocalStorage();

  if (!storage) {
    return initialGameState;
  }

  try {
    const saved = storage.getItem(STORAGE_KEY);

    if (!saved) {
      return initialGameState;
    }

    const parsed = JSON.parse(saved) as unknown;
    const sanitized = sanitizeGameState(parsed);

    return sanitized ?? initialGameState;
  } catch (error) {
    console.error('Error loading game state:', error);
    return initialGameState;
  }
};

export const useGameState = () => {
  const [gameState, setGameState] = useState<GameState>(loadInitialState);
  const [isStartingGame, setIsStartingGame] = useState(false);

  // Save to localStorage whenever state changes
  useEffect(() => {
    const storage = getSafeLocalStorage();

    if (!storage) {

      return;
    }

    try {

      storage.setItem(STORAGE_KEY, JSON.stringify(gameState));
    } catch (error) {
      console.error('Error saving game state:', error);
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


    const storage = getSafeLocalStorage();

    if (!storage) {
      return;
    }

    try {
      storage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing saved game state:', error);

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