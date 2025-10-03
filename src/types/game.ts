export interface Player {
  id: string;
  name: string;
  boostPoints: number;
}

export interface Card {
  id: string;
  type: 'truth' | 'dare';
  text: string;
  level: IntensityLevel;
  isBoosted: boolean;
  isCustom: boolean;
}

export type IntensityLevel = 'leve' | 'medio' | 'pesado' | 'extremo';
export type GameMode = 'grupo' | 'casal';
export type GamePhase = 'setup' | 'playing';

export interface GameState {
  phase: GamePhase;
  mode: GameMode | null;
  intensity: IntensityLevel | null;
  players: Player[];
  currentPlayerIndex: number | null;
  availableCards: Card[];
  usedCards: Card[];
  currentCard: Card | null;
}

export interface StartGameResult {
  success: boolean;
  usedFallback: boolean;
  errorMessage?: string;
}

export interface StartGameOptions {
  shouldShuffle?: boolean;
}
