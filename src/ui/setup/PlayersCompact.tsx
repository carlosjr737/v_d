import React, { KeyboardEvent } from 'react';
import { Player } from '../../types/game';

interface PlayersCompactProps {
  players: Player[];
  draftName: string;
  canAddMore: boolean;
  disableRemove: boolean;
  onDraftChange: (value: string) => void;
  onAdd: (name: string) => void;
  onName: (id: string, value: string) => void;
  onDel: (id: string) => void;
  onUp: (id: string) => void;
  onDown: (id: string) => void;
}

export const PlayersCompact: React.FC<PlayersCompactProps> = ({
  players,
  draftName,
  canAddMore,
  disableRemove,
  onDraftChange,
  onAdd,
  onName,
  onDel,
  onUp,
  onDown,
}) => {
  const handleSubmit = () => {
    onAdd(draftName);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSubmit();
    }
  };

  const addDisabled = !canAddMore || draftName.trim().length === 0;

  return (
    <div className="flex flex-col gap-2 max-h-[36vh] overflow-auto pr-1">
      {players.map((player, index) => {
        const initial = player.name?.trim()?.[0]?.toUpperCase() ?? '?';
        const isFirst = index === 0;
        const isLast = index === players.length - 1;

        return (
          <div
            key={player.id}
            className="grid grid-cols-[40px_1fr_auto_auto_auto_auto] items-center gap-2 rounded-2xl border border-[var(--color-border)]/60 bg-[var(--color-bg-900)]/60 px-2 py-2 max-[390px]:gap-1.5"
          >
            <div className="grid h-10 w-10 place-items-center rounded-full border border-[var(--color-border)] bg-[var(--color-bg-800)] text-sm font-semibold">
              {initial}
            </div>
            <input
              value={player.name}
              onChange={event => onName(player.id, event.target.value)}
              maxLength={12}
              className="h-10 rounded-full border border-[var(--color-border)] bg-transparent px-3 text-[clamp(14px,3.6vw,16px)] text-text placeholder:text-text-subtle focus-visible:outline-none"
            />
            <span className="h-8 min-w-[64px] rounded-full border border-[var(--color-border)] px-2 text-center text-xs leading-8 text-text-subtle">
              ⚡ {player.boostPoints}
            </span>
            <button
              type="button"
              onClick={() => onUp(player.id)}
              aria-label="Subir"
              disabled={isFirst}
              className="grid h-10 w-10 place-items-center rounded-full border border-[var(--color-border)] text-base text-text-subtle transition-colors hover:text-text disabled:cursor-not-allowed disabled:opacity-40 max-[390px]:h-9 max-[390px]:w-9"
            >
              ↑
            </button>
            <button
              type="button"
              onClick={() => onDown(player.id)}
              aria-label="Descer"
              disabled={isLast}
              className="grid h-10 w-10 place-items-center rounded-full border border-[var(--color-border)] text-base text-text-subtle transition-colors hover:text-text disabled:cursor-not-allowed disabled:opacity-40 max-[390px]:h-9 max-[390px]:w-9"
            >
              ↓
            </button>
            <button
              type="button"
              onClick={() => onDel(player.id)}
              aria-label="Remover"
              disabled={disableRemove}
              className="grid h-10 w-10 place-items-center rounded-full border border-[var(--color-border)] text-base text-text-subtle transition-colors hover:text-secondary-300 disabled:cursor-not-allowed disabled:opacity-40 max-[390px]:h-9 max-[390px]:w-9"
            >
              ✖
            </button>
          </div>
        );
      })}

      <div className="grid grid-cols-[1fr_auto] gap-2 max-[390px]:gap-1.5">
        <input
          placeholder="Novo jogador"
          value={draftName}
          onChange={event => onDraftChange(event.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={12}
          disabled={!canAddMore}
          className="h-10 rounded-full border border-[var(--color-border)] bg-transparent px-3 text-[clamp(14px,3.6vw,16px)] text-text placeholder:text-text-subtle disabled:opacity-40 focus-visible:outline-none max-[390px]:h-9"
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={addDisabled}
          className="h-10 rounded-full border border-[var(--color-border)] px-4 text-sm font-semibold text-text transition-colors hover:text-primary-200 disabled:cursor-not-allowed disabled:opacity-40 max-[390px]:h-9"
        >
          ✚
        </button>
      </div>
    </div>
  );
};
