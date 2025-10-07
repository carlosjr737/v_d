import type { PlayerId } from './players';

export interface ChooseNextCardPayload {
  chooserId: PlayerId;
  targetId: PlayerId;
  chosenCardId: string;
}
