export type PlayerId = string;

export interface Player {
  id: PlayerId;
  name: string;
  points: number;
  lastTargetedByChooseNextCard?: PlayerId | null;
}
