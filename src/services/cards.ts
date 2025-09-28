import { seedCards } from '@/data/seedCards';
import type { Card, IntensityLevel } from '@/types/game';
import { fetchCardsByIntensity, REMOTE_DECK_ERROR_FLAG } from './cardService';

export type Intensity = 'leve' | 'medio' | 'forte' | 'extremo';
export type CardType = 'truth' | 'dare';

type RemoteStatus = {
  error: boolean;
  hasData: boolean;
};

const intensityMap: Record<Intensity, IntensityLevel> = {
  leve: 'leve',
  medio: 'medio',
  forte: 'pesado',
  extremo: 'extremo',
};

const reverseIntensityMap: Record<IntensityLevel, Intensity> = {
  leve: 'leve',
  medio: 'medio',
  pesado: 'forte',
  extremo: 'extremo',
};

const remoteCache = new Map<Intensity, Card[]>();
const remoteStatusCache = new Map<Intensity, RemoteStatus>();
const remoteByTypeCache = new Map<string, Card[]>();

const getTypeCacheKey = (intensity: Intensity, type: CardType) => `${intensity}:${type}`;

const defaultStatus: RemoteStatus = { error: false, hasData: false };

const toServiceIntensity = (level: IntensityLevel): Intensity => reverseIntensityMap[level];

const normalizeCard = (card: Card): Card => ({
  ...card,
  text: card.text.trim(),
});

const fetchRemoteCardsForIntensity = async (intensity: Intensity): Promise<Card[]> => {
  if (remoteCache.has(intensity)) {
    return remoteCache.get(intensity)!;
  }

  const level = intensityMap[intensity];

  try {
    const remoteCards = await fetchCardsByIntensity(level);
    const metadata = remoteCards as { [REMOTE_DECK_ERROR_FLAG]?: true };
    const error = Boolean(metadata[REMOTE_DECK_ERROR_FLAG]);

    if (error) {
      remoteCache.set(intensity, []);
      remoteStatusCache.set(intensity, { error: true, hasData: false });
      return [];
    }

    const normalized = remoteCards.map(normalizeCard);
    remoteCache.set(intensity, normalized);
    remoteStatusCache.set(intensity, { error: false, hasData: normalized.length > 0 });
    return normalized;
  } catch (error) {
    if (import.meta.env?.DEV) {
      console.warn('[cards] Erro ao buscar cartas remotas:', error);
    }
    remoteCache.set(intensity, []);
    remoteStatusCache.set(intensity, { error: true, hasData: false });
    return [];
  }
};

const fetchRemoteCardsByIntensity = async (
  intensity: Intensity,
  type: CardType
): Promise<string[]> => {
  const cards = await fetchRemoteCardsForIntensity(intensity);
  const filtered = cards.filter(card => card.type === type);
  const key = getTypeCacheKey(intensity, type);
  remoteByTypeCache.set(key, filtered);
  return filtered.map(card => card.text);
};

const getLocalSeedByIntensity = (intensity: Intensity, type: CardType): string[] => {
  const level = intensityMap[intensity];
  return seedCards
    .filter(card => card.level === level && card.type === type)
    .map(card => card.text.trim())
    .filter(Boolean);
};

const shuffle = <T,>(arr: T[]): T[] => {
  const result = [...arr];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
  }
  return result;
};

export async function getDeck(intensity: Intensity, type: CardType): Promise<string[]> {
  const [remote, localSeed] = await Promise.all([
    fetchRemoteCardsByIntensity(intensity, type),
    Promise.resolve(getLocalSeedByIntensity(intensity, type)),
  ]);

  const merged = [...remote, ...localSeed].map(text => text.trim()).filter(Boolean);

  const seen = new Set<string>();
  const deduped: string[] = [];
  for (const text of merged) {
    const key = text.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(text);
    }
  }

  return shuffle(deduped);
}

const getRemoteStatus = (intensity: Intensity): RemoteStatus =>
  remoteStatusCache.get(intensity) ?? defaultStatus;

const getRemoteCardsForType = (intensity: Intensity, type: CardType): Card[] => {
  const key = getTypeCacheKey(intensity, type);
  return remoteByTypeCache.get(key) ?? [];
};

const getLocalSeedCards = (level: IntensityLevel, type: CardType): Card[] =>
  seedCards
    .filter(card => card.level === level && card.type === type)
    .map(normalizeCard);

const buildCardsFromDeck = (
  level: IntensityLevel,
  type: CardType,
  deck: string[]
): Card[] => {
  const intensity = toServiceIntensity(level);
  const remoteCards = getRemoteCardsForType(intensity, type);
  const remoteMap = new Map(remoteCards.map(card => [card.text.toLowerCase(), card]));
  const localCards = getLocalSeedCards(level, type);
  const localMap = new Map(localCards.map(card => [card.text.toLowerCase(), card]));

  const result: Card[] = [];

  for (const entry of deck) {
    const text = entry.trim();
    if (!text) continue;

    const key = text.toLowerCase();
    if (remoteMap.has(key)) {
      const card = remoteMap.get(key)!;
      result.push({ ...card, text });
      remoteMap.delete(key);
      continue;
    }

    if (localMap.has(key)) {
      const card = localMap.get(key)!;
      result.push({ ...card, text });
      localMap.delete(key);
      continue;
    }

    result.push({
      id: `${type}-${key}`,
      type,
      text,
      level,
      isBoosted: false,
      isCustom: false,
    });
  }

  return result;
};

export interface DeckCardsResult {
  cards: Card[];
  remoteFailed: boolean;
  remoteHasData: boolean;
}

export async function getCardsForType(
  level: IntensityLevel,
  type: CardType
): Promise<DeckCardsResult> {
  const intensity = toServiceIntensity(level);
  const deck = await getDeck(intensity, type);
  const status = getRemoteStatus(intensity);
  const cards = buildCardsFromDeck(level, type, deck);

  return {
    cards,
    remoteFailed: status.error,
    remoteHasData: status.hasData,
  };
}

export function clearDeckCaches() {
  remoteCache.clear();
  remoteStatusCache.clear();
  remoteByTypeCache.clear();
}
