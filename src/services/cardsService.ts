import type { CardType } from '@/models/cards';
import type { GameState } from '@/models/game';
import type { PlayerId } from '@/models/players';
import type { Card } from '@/models/cards';

export function getCandidateCards(state: GameState, n: number): Card[] {
  const ids = state.remainingByIntensity[state.intensity] || [];
  const shuffled = [...ids].sort(() => Math.random() - 0.5);
  const take = shuffled.slice(0, n);
  return take
    .map(id => state.cardsById[id])
    .filter((card): card is Card => Boolean(card));
}

export function createCardLocal(
  state: GameState,
  data: { type: CardType; text: string; createdBy?: PlayerId }
): Card {
  const id = `c_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const card: Card = {
    id,
    type: data.type,
    text: data.text.trim(),
    intensity: state.intensity,
    createdAt: Date.now(),
    createdBy: data.createdBy,
    source: 'created',
  };
  return card;
}
