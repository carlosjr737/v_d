export type CardIntensity = 'leve' | 'medio' | 'pesado' | 'extremo';
export type CardType = 'truth' | 'dare';

export interface Card {
  id: string;
  type: CardType;
  text: string;
  intensity: CardIntensity;
  createdAt: number;
  createdBy?: string;
  source: 'remote' | 'seed' | 'created';
}
