import type { CardIntensity } from '@/models/cards';
import type { Player } from '@/types/game';
import { ChipLevel } from '@/ui/ChipLevel';
import { PointsBadge } from './PointsBadge';

type TurnHeaderProps = {
  currentPlayer?: Player | null;
  intensity?: CardIntensity | null;
  boostPoints?: number;
  points?: number;
  lastDelta?: number | null;
};

export function TurnHeader({
  currentPlayer,
  intensity,
  boostPoints = 0,
  points = 0,
  lastDelta = null,
}: TurnHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/10 bg-bg-900/80 px-5 py-4 shadow-lg backdrop-blur">
      <div className="flex min-w-[180px] flex-1 items-center gap-3">
        {intensity && <ChipLevel level={intensity} size="sm" />}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-white/50">Vez de</p>
          <p className="text-xl font-bold text-white">
            {currentPlayer?.name ?? 'Aguardando jogador'}
          </p>
        </div>
      </div>

      <div className="flex flex-none items-center gap-4">
        <span className="inline-flex items-center gap-1 rounded-full bg-bg-800/70 px-3 py-1 text-sm font-semibold text-white">
          <span aria-hidden>⚡</span>
          <span>{boostPoints}</span>
        </span>
        <PointsBadge points={points} lastDelta={lastDelta} />
      </div>
    </div>
  );
}
