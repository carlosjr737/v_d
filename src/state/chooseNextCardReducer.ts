import type { Card } from '@/models/cards';
import type { GameState } from '@/models/game';
import type { ChooseNextCardPayload } from '@/models/payloads';
import type { PlayerId } from '@/models/players';

export type Action =
  | { type: 'POWER_CHOOSE_NEXT_REQUEST'; chooserId: PlayerId }
  | { type: 'POWER_CHOOSE_NEXT_REFUND'; chooserId: PlayerId }
  | { type: 'POWER_CHOOSE_NEXT_COMMIT'; payload: ChooseNextCardPayload }
  | { type: 'CARD_CREATED_LOCAL'; card: Card }
  | { type: 'TICK_TURN' }
  | { type: 'LOG'; message: string }
  | { type: 'POWER_CHOOSE_NEXT_CONSUMED'; targetId: PlayerId };

export function canTarget(state: GameState, chooserId: PlayerId, targetId: PlayerId): boolean {
  if (chooserId === targetId) return true;
  const target = state.players[targetId];
  return target?.lastTargetedByChooseNextCard !== chooserId;
}

export function applyCooldown(state: GameState, pid: PlayerId, turns: number) {
  const safeTurns = Math.max(0, turns | 0);
  const cd = { ...(state.cooldowns[pid] ?? {}) };
  cd.choose_next_card = safeTurns;
  state.cooldowns = { ...state.cooldowns, [pid]: cd };
}

export function debitPoints(state: GameState, pid: PlayerId, amount: number): boolean {
  const player = state.players[pid];
  if (!player || player.points < amount) {
    return false;
  }
  state.players = {
    ...state.players,
    [pid]: { ...player, points: player.points - amount },
  };
  return true;
}

function ensureCooldowns(state: GameState) {
  if (!state.cooldowns) {
    state.cooldowns = {};
  }
}

function cloneState(state: GameState): GameState {
  return {
    ...state,
    cardsById: { ...state.cardsById },
    players: { ...state.players },
    remainingByIntensity: { ...state.remainingByIntensity },
    queuedNextForPlayer: { ...state.queuedNextForPlayer },
    cooldowns: { ...state.cooldowns },
    logs: [...state.logs],
  };
}

export function chooseNextCardReducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'POWER_CHOOSE_NEXT_REQUEST': {
      const next = cloneState(state);
      const chooser = next.players[action.chooserId];
      if (!chooser) {
        next.logs.push(`Falha: jogador ${action.chooserId} não encontrado.`);
        return next;
      }
      const cooldown = next.cooldowns[action.chooserId]?.choose_next_card ?? 0;
      if (cooldown > 0) {
        next.logs.push(
          `Falha: ${chooser.name} ainda está em cooldown da Escolha do Destino (${cooldown} turno(s) restante(s)).`
        );
        return next;
      }
      if (chooser.points < 5) {
        next.logs.push(`Falha: ${chooser.name} sem pontos para Escolha do Destino.`);
        return next;
      }
      return next;
    }
    case 'CARD_CREATED_LOCAL': {
      const next = cloneState(state);
      const { card } = action;
      next.cardsById[card.id] = card;
      const arr = next.remainingByIntensity[next.intensity] ?? [];
      next.remainingByIntensity = {
        ...next.remainingByIntensity,
        [next.intensity]: [card.id, ...arr],
      };
      next.logs.push(`Carta criada: ${card.type.toUpperCase()} — "${card.text.slice(0, 40)}..."`);
      return next;
    }
    case 'POWER_CHOOSE_NEXT_COMMIT': {
      const { chooserId, targetId, chosenCardId } = action.payload;
      const next = cloneState(state);
      ensureCooldowns(next);
      const chooser = next.players[chooserId];
      if (!chooser) {
        next.logs.push(`Falha: ${chooserId} não encontrado para Escolha do Destino.`);
        return next;
      }
      const cooldown = next.cooldowns[chooserId]?.choose_next_card ?? 0;
      if (cooldown > 0) {
        next.logs.push('Falha: cooldown ativo.');
        return next;
      }
      if (!debitPoints(next, chooserId, 5)) {
        next.logs.push(`Falha: ${chooser.name} sem pontos para Escolha do Destino.`);
        return next;
      }
      if (!canTarget(next, chooserId, targetId)) {
        next.logs.push('Alvo inválido para Escolha do Destino (noRepeatTargetBackToBack).');
        next.players = {
          ...next.players,
          [chooserId]: {
            ...next.players[chooserId],
            points: (next.players[chooserId]?.points ?? 0) + 5,
          },
        };
        return next;
      }
      const targetPlayer = next.players[targetId];
      if (!targetPlayer) {
        next.logs.push(`Alvo ${targetId} não encontrado para Escolha do Destino.`);
        next.players = {
          ...next.players,
          [chooserId]: {
            ...next.players[chooserId],
            points: (next.players[chooserId]?.points ?? 0) + 5,
          },
        };
        return next;
      }

      const arr = next.remainingByIntensity[next.intensity] ?? [];
      next.remainingByIntensity = {
        ...next.remainingByIntensity,
        [next.intensity]: arr.filter(id => id !== chosenCardId),
      };
      next.queuedNextForPlayer = {
        ...next.queuedNextForPlayer,
        [targetId]: chosenCardId,
      };
      next.players = {
        ...next.players,
        [targetId]: {
          ...targetPlayer,
          lastTargetedByChooseNextCard: chooserId,
        },
      };
      applyCooldown(next, chooserId, 4);
      const card = next.cardsById[chosenCardId];
      const chooserName = chooser?.name ?? chooserId;
      const targetName = targetPlayer?.name ?? targetId;
      next.logs.push(
        `Escolha do Destino: ${chooserName} designou "${card?.text?.slice(0, 40)}..." para ${targetName}.`
      );
      return next;
    }
    case 'POWER_CHOOSE_NEXT_REFUND': {
      const chooserId = action.chooserId;
      const next = cloneState(state);
      const chooser = next.players[chooserId];
      if (!chooser) {
        next.logs.push(`Falha ao reembolsar: jogador ${chooserId} não encontrado.`);
        return next;
      }
      next.players = {
        ...next.players,
        [chooserId]: { ...chooser, points: chooser.points + 5 },
      };
      next.logs.push('Reembolso: sem cartas disponíveis para Escolha do Destino.');
      return next;
    }
    case 'POWER_CHOOSE_NEXT_CONSUMED': {
      const next = cloneState(state);
      if (next.queuedNextForPlayer[action.targetId]) {
        next.queuedNextForPlayer = {
          ...next.queuedNextForPlayer,
          [action.targetId]: null,
        };
      }
      return next;
    }
    case 'TICK_TURN': {
      const next = cloneState(state);
      ensureCooldowns(next);
      Object.entries(next.cooldowns).forEach(([pid, cd]) => {
        if (typeof cd?.choose_next_card === 'number') {
          const updated = Math.max(0, (cd.choose_next_card ?? 0) - 1);
          if (updated !== cd.choose_next_card) {
            next.cooldowns = {
              ...next.cooldowns,
              [pid]: { ...cd, choose_next_card: updated },
            };
          }
        }
      });
      return next;
    }
    case 'LOG': {
      const next = cloneState(state);
      next.logs.push(action.message);
      return next;
    }
    default:
      return state;
  }
}
