import type {
  Card,
  GameMode,
  GamePhase,
  GameState,
  IntensityLevel,
  Player,
} from '@/types/game';

const validPhases: readonly GamePhase[] = ['setup', 'playing'];
const validModes = new Set<GameMode>(['grupo', 'casal']);
const validIntensity = new Set<IntensityLevel>(['leve', 'medio', 'pesado', 'extremo']);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const sanitizePlayer = (value: unknown): Player | null => {
  if (!isRecord(value)) {
    return null;
  }

  const { id, name, boostPoints } = value;

  if (typeof id !== 'string' || id.length === 0) {
    return null;
  }

  if (typeof name !== 'string') {
    return null;
  }

  let sanitizedBoostPoints = 3;
  if (typeof boostPoints === 'number' && Number.isFinite(boostPoints)) {
    sanitizedBoostPoints = Math.max(0, Math.min(5, Math.round(boostPoints)));
  }

  return {
    id,
    name,
    boostPoints: sanitizedBoostPoints,
  } satisfies Player;
};

const sanitizeCard = (value: unknown): Card | null => {
  if (!isRecord(value)) {
    return null;
  }

  const { id, type, text, level, isBoosted, isCustom } = value;

  if (typeof id !== 'string' || id.length === 0) {
    return null;
  }

  if (type !== 'truth' && type !== 'dare') {
    return null;
  }

  if (typeof text !== 'string' || text.length === 0) {
    return null;
  }

  if (typeof level !== 'string' || !validIntensity.has(level as IntensityLevel)) {
    return null;
  }

  return {
    id,
    type,
    text,
    level: level as IntensityLevel,
    isBoosted: Boolean(isBoosted),
    isCustom: Boolean(isCustom),
  } satisfies Card;
};

export function sanitizeGameState(input: unknown): GameState | null {
  if (!isRecord(input)) {
    return null;
  }

  const candidate = input as Record<string, unknown>;
  const phaseValue = candidate.phase;

  if (typeof phaseValue !== 'string' || !validPhases.includes(phaseValue as GamePhase)) {
    return null;
  }

  const phase = phaseValue as GamePhase;

  const modeValue = candidate.mode;
  let mode: GameMode | null = null;
  if (typeof modeValue === 'string') {
    if (!validModes.has(modeValue as GameMode)) {
      return null;
    }
    mode = modeValue as GameMode;
  } else if (modeValue !== null && modeValue !== undefined) {
    return null;
  }

  const intensityValue = candidate.intensity;
  let intensity: IntensityLevel | null = null;
  if (typeof intensityValue === 'string') {
    if (!validIntensity.has(intensityValue as IntensityLevel)) {
      return null;
    }
    intensity = intensityValue as IntensityLevel;
  } else if (intensityValue !== null && intensityValue !== undefined) {
    return null;
  }

  const playersValue = candidate.players;
  if (!Array.isArray(playersValue)) {
    return null;
  }

  const players: Player[] = [];
  for (const rawPlayer of playersValue) {
    const player = sanitizePlayer(rawPlayer);
    if (!player) {
      return null;
    }
    players.push(player);
  }

  const availableValue = candidate.availableCards;
  if (!Array.isArray(availableValue)) {
    return null;
  }

  const availableCards: Card[] = [];
  for (const rawCard of availableValue) {
    const card = sanitizeCard(rawCard);
    if (!card) {
      return null;
    }
    availableCards.push(card);
  }

  const usedValue = candidate.usedCards;
  if (!Array.isArray(usedValue)) {
    return null;
  }

  const usedCards: Card[] = [];
  for (const rawCard of usedValue) {
    const card = sanitizeCard(rawCard);
    if (!card) {
      return null;
    }
    usedCards.push(card);
  }

  const currentCardValue = candidate.currentCard;
  let currentCard: Card | null = null;
  if (currentCardValue !== null && currentCardValue !== undefined) {
    const card = sanitizeCard(currentCardValue);
    if (!card) {
      return null;
    }
    currentCard = card;
  }

  const currentPlayerIndexValue = candidate.currentPlayerIndex;
  let currentPlayerIndex: number | null = null;
  if (typeof currentPlayerIndexValue === 'number') {
    if (!Number.isInteger(currentPlayerIndexValue) || currentPlayerIndexValue < 0) {
      return null;
    }
    currentPlayerIndex = currentPlayerIndexValue;
  } else if (currentPlayerIndexValue !== null && currentPlayerIndexValue !== undefined) {
    return null;
  }

  if (currentPlayerIndex !== null && currentPlayerIndex >= players.length) {
    return null;
  }

  if (phase === 'playing') {
    if (!mode || !intensity) {
      return null;
    }

    if (players.length < 2) {
      return null;
    }
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
}
