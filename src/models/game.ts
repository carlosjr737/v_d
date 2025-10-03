import type { Card, CardIntensity } from './cards';
import type { PlayerId, Player } from './players';

export interface GameState {
  intensity: CardIntensity;
  remainingByIntensity: Record<CardIntensity, string[]>;
  cardsById: Record<string, Card>;
  players: Record<PlayerId, Player>;
  queuedNextForPlayer: Record<PlayerId, string | null>;
  cooldowns: Record<PlayerId, { choose_next_card?: number }>;
  logs: string[];
}
