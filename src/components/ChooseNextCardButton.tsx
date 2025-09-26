import type { GameState } from '@/models/game';
import type { PlayerId } from '@/models/players';

export type ChooseNextCardButtonProps = {
  currentPlayerId: PlayerId | null;
  state: GameState;
  onOpenModal: () => void;
  toast?: { error?: (message: string) => void; info?: (message: string) => void };
};

function showAlert(message: string) {
  if (typeof window !== 'undefined' && window.alert) {
    window.alert(message);
    return;
  }
  console.warn(message);
}

export function ChooseNextCardButton({ currentPlayerId, state, onOpenModal, toast }: ChooseNextCardButtonProps) {
  const player = currentPlayerId ? state.players[currentPlayerId] : undefined;
  const points = player?.points ?? 0;
  const cooldown = currentPlayerId ? state.cooldowns[currentPlayerId]?.choose_next_card ?? 0 : 0;
  const hasEnoughPoints = points >= 5;
  const onCooldown = cooldown > 0;
  const canUse = Boolean(player) && hasEnoughPoints && !onCooldown;

  const handleClick = () => {
    if (!player) {
      toast?.info?.('Aguardando jogador para usar a ação especial.');
      return;
    }

    if (!hasEnoughPoints) {
      const message = 'Você precisa de 5 pontos para executar esta ação especial.';
      toast?.error?.(message) ?? showAlert(message);
      return;
    }

    if (onCooldown) {
      const message = 'Ação em recarga. Aguarde o fim do cooldown.';
      toast?.info?.(message) ?? showAlert(message);
      return;
    }

    onOpenModal();
  };

  const hint = !player
    ? 'Aguardando jogador'
    : onCooldown
    ? `Cooldown: ${cooldown}`
    : `${points} pts disponíveis`;

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-disabled={!canUse}
      className={`flex h-full w-full flex-col items-center justify-center gap-1 rounded-card bg-bg-900/60 text-white transition-all active:scale-95 ${
        canUse ? 'hover:scale-105 hover:bg-accent-500/20' : 'cursor-not-allowed opacity-50'
      }`}
    >
      <span className="text-xl">🎯</span>
      <span className="text-[11px] font-semibold leading-tight text-center">Escolha do Destino</span>
      <span className="text-[11px] text-white/60">{hint}</span>
    </button>
  );
}
