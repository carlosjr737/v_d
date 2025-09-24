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
    <div className="flex flex-col gap-2 max-h-[30vh] overflow-auto">
      {players.map((player, index) => {
        const initial = player.name?.trim()?.[0]?.toUpperCase() ?? '?';
        const isFirst = index === 0;
        const isLast = index === players.length - 1;

        return (
          <div
            key={player.id}
            className="grid grid-cols-[36px_1fr_auto_32px_32px_32px] items-center gap-2 rounded-card border border-border/40 bg-bg-900/60 px-3 py-2"
          >
            <div className="grid h-9 w-9 place-items-center rounded-full bg-grad-heat text-sm font-bold text-white">
              {initial}
            </div>
            <input
              value={player.name}
              onChange={event => onName(player.id, event.target.value)}
              maxLength={12}
              className="h-9 rounded-pill border border-border/40 bg-transparent px-3 text-sm text-white placeholder:text-text-subtle focus-visible:outline-none focus-visible:border-primary-500"
            />
            <span className="inline-flex items-center gap-1 rounded-pill bg-bg-800/60 px-2 py-1 text-xs font-semibold text-white">
              ⚡ {player.boostPoints}
            </span>
            <button
              type="button"
              onClick={() => onUp(player.id)}
              aria-label="Subir"
              disabled={isFirst}
              className="grid h-8 w-8 place-items-center rounded-full bg-bg-800/60 text-sm text-white transition-all hover:scale-110 hover:bg-primary-500/20 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              ↑
            </button>
            <button
              type="button"
              onClick={() => onDown(player.id)}
              aria-label="Descer"
              disabled={isLast}
              className="grid h-8 w-8 place-items-center rounded-full bg-bg-800/60 text-sm text-white transition-all hover:scale-110 hover:bg-primary-500/20 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              ↓
            </button>
            <button
              type="button"
              onClick={() => onDel(player.id)}
              aria-label="Remover"
              disabled={disableRemove}
              className="grid h-8 w-8 place-items-center rounded-full bg-bg-800/60 text-sm text-white transition-all hover:scale-110 hover:bg-secondary-500/20 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              ✖
            </button>
          </div>
        );
      })}

      <div className="grid grid-cols-[1fr_auto] gap-2">
        <input
          placeholder="Novo jogador"
          value={draftName}
          onChange={event => onDraftChange(event.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={12}
          disabled={!canAddMore}
          className="h-9 rounded-pill border border-border/40 bg-transparent px-3 text-sm text-white placeholder:text-text-subtle disabled:opacity-40 focus-visible:outline-none focus-visible:border-primary-500"
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={addDisabled}
          className="h-9 w-9 rounded-full bg-grad-heat text-lg font-bold text-white transition-all hover:scale-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
        >
          ✚
        </button>
      </div>
    </div>
  );
};
