import { useCallback, useState } from 'react';
import { Toast } from '@/components/Toast';
import type { GameState } from '@/models/game';
import type { PlayerId } from '@/models/players';

export type ChooseNextCardButtonProps = {
  currentPlayerId: PlayerId | null;
  state: GameState;
  onOpenModal: () => void;
  toast?: { error?: (message: string) => void; info?: (message: string) => void };
};

type LocalToastState = { open: boolean; message: string; variant: 'error' | 'info' };

export function ChooseNextCardButton({ currentPlayerId, state, onOpenModal, toast }: ChooseNextCardButtonProps) {
  const [localToast, setLocalToast] = useState<LocalToastState>({
    open: false,
    message: '',
    variant: 'info',
  });

  const player = currentPlayerId ? state.players[currentPlayerId] : undefined;
  const points = player?.points ?? 0;
  const cooldown = currentPlayerId ? state.cooldowns[currentPlayerId]?.choose_next_card ?? 0 : 0;
  const hasEnoughPoints = points >= 5;
  const canUse = Boolean(player) && hasEnoughPoints && cooldown === 0;

  const openToast = useCallback(
    (variant: 'error' | 'info', message: string) => {
      if (variant === 'error' && toast?.error) {
        toast.error(message);
        return;
      }

      if (variant === 'info' && toast?.info) {
        toast.info(message);
        return;
      }

      setLocalToast({ open: true, message, variant });
    },
    [toast]
  );

  const handleClick = () => {
    if (!player) {
      openToast('info', 'Aguardando jogador para usar a ação especial.');
      return;
    }

    if (!hasEnoughPoints) {
      openToast('error', 'Você precisa de 5 pontos para executar esta ação especial.');
      return;
    }

    if (cooldown > 0) {
      openToast('info', 'Ação em recarga. Aguarde o fim do cooldown.');
      return;
    }

    onOpenModal();
  };

  const hint = !player
    ? 'Aguardando jogador'
    : cooldown > 0
    ? `Cooldown: ${cooldown}`
    : `${points} pts disponíveis`;

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={!canUse}
        aria-disabled={!canUse}
        className={`flex h-full w-full flex-col items-center justify-center gap-1 rounded-3xl border border-white/10 text-white transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 ${
          canUse
            ? 'bg-gradient-to-r from-pink-500 to-orange-400 text-white shadow-md hover:scale-[1.02] hover:shadow-lg active:scale-95'
            : 'cursor-not-allowed bg-bg-900/60 text-white/60 opacity-70'
        }`}
      >
        <span className="text-xl">🎯</span>
        <span className="text-[11px] font-semibold leading-tight text-center">Escolha do Destino</span>
        <span className="text-[11px] text-white/70">{hint}</span>
      </button>
      <Toast
        open={localToast.open}
        message={localToast.message}
        variant={localToast.variant}
        onClose={() => setLocalToast(prev => ({ ...prev, open: false }))}
      />
    </>
  );
}
