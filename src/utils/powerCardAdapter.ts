import type { Card as PowerCard, CardIntensity } from '@/models/cards';
import type { Card as GameCard } from '@/types/game';

export function toPowerCard(card: GameCard, fallbackIntensity?: CardIntensity): PowerCard {
  return {
    id: card.id,
    type: card.type,
    text: card.text,
    intensity: (card.level as CardIntensity) ?? fallbackIntensity ?? 'leve',
    createdAt: card.isCustom ? Date.now() : 0,
    source: card.isCustom ? 'created' : 'seed',
  };
}

export function toGameCard(card: PowerCard): GameCard {
  return {
    id: card.id,
    type: card.type,
    text: card.text,
    level: card.intensity,
    isBoosted: false,
    isCustom: card.source === 'created',
  };
}
