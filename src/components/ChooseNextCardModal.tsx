import { useEffect, useMemo, useRef, useState } from 'react';
import type { Card } from '@/models/cards';
import type { GameState } from '@/models/game';
import type { PlayerId } from '@/models/players';
import type { Action } from '@/state/chooseNextCardReducer';
import { canTarget } from '@/state/chooseNextCardReducer';
import { createCardLocal, getCandidateCards } from '@/services/cardsService';
import type { CardType } from '@/models/cards';

interface ChooseNextCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: GameState;
  chooserId: PlayerId;
  optionsShown?: number;
  dispatch: (action: Action) => void | Promise<void>;
  onCardCreated?: (card: Card) => void;
}

const MIN_TEXT_LENGTH = 5;

function CardPreview({ card, selected, onSelect }: { card: Card; selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-lg border p-4 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 ${
        selected ? 'border-accent-500 bg-accent-500/10 shadow-lg' : 'border-white/10 hover:border-accent-400/70'
      }`}
      aria-pressed={selected}
    >
      <span className="text-xs uppercase tracking-wide text-white/60">{card.type === 'truth' ? 'Verdade' : 'Desafio'}</span>
      <p className="mt-1 text-sm font-medium text-white">
        {card.text.length > 120 ? `${card.text.slice(0, 117)}...` : card.text}
      </p>
    </button>
  );
}

export function ChooseNextCardModal({
  isOpen,
  onClose,
  state,
  chooserId,
  optionsShown = 3,
  dispatch,
  onCardCreated,
}: ChooseNextCardModalProps) {
  const [candidates, setCandidates] = useState<Card[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<PlayerId | ''>('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCardType, setNewCardType] = useState<CardType>('truth');
  const [newCardText, setNewCardText] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const chooser = state.players[chooserId];
  const cooldown = state.cooldowns[chooserId]?.choose_next_card ?? 0;

  const availableTargets = useMemo(() => Object.values(state.players), [state.players]);

  const isOpenRef = useRef(false);
  useEffect(() => {
    isOpenRef.current = isOpen;
    if (!isOpen) {
      setCandidates([]);
      setSelectedCardId(null);
      setSelectedTarget('');
      setShowCreateForm(false);
      setNewCardText('');
      setNewCardType('truth');
      setFormError(null);
      setActionError(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const reqIdRef = useRef(0);
  useEffect(() => {
    if (!isOpen) return;
    const reqId = ++reqIdRef.current;
    (async () => {
      const list = getCandidateCards(state, optionsShown).slice(0, optionsShown);
      if (isOpenRef.current && reqIdRef.current === reqId) {
        setCandidates(list);
        setSelectedCardId(list[0]?.id ?? null);
      }
    })();
    return () => {
      reqIdRef.current++;
    };
  }, [isOpen, optionsShown, state.intensity, state.remainingByIntensity[state.intensity]?.length]);

  useEffect(() => {
    if (!isOpen) return;
    if (!selectedCardId && candidates.length > 0) {
      setSelectedCardId(candidates[0].id);
    }
  }, [candidates, isOpen, selectedCardId]);

  useEffect(() => {
    if (selectedTarget && !state.players[selectedTarget]) {
      setActionError('O jogador selecionado saiu do jogo. Escolha outro alvo.');
    } else {
      setActionError(null);
    }
  }, [selectedTarget, state.players]);

  if (!isOpen) {
    return null;
  }

  const handleClose = () => {
    setIsSubmitting(false);
    onClose();
  };

  const handleCreateCard = () => {
    const trimmed = newCardText.trim();
    if (trimmed.length < MIN_TEXT_LENGTH) {
      setFormError('O texto da carta precisa de pelo menos 5 caracteres.');
      return;
    }

    const card = createCardLocal(state, { type: newCardType, text: trimmed, createdBy: chooserId });
    void dispatch({ type: 'CARD_CREATED_LOCAL', card });
    onCardCreated?.(card);
    setCandidates(prev => [card, ...prev.filter(c => c.id !== card.id)].slice(0, optionsShown));
    setSelectedCardId(card.id);
    setNewCardText('');
    setShowCreateForm(false);
    setFormError(null);
    setActionError(null);
  };

  const handleConfirm = () => {
    if (isSubmitting) {
      return;
    }
    if (!chooser) {
      setActionError('Jogador inválido.');
      return;
    }

    if (cooldown > 0) {
      setActionError('Este poder ainda está em cooldown. Aguarde mais turnos.');
      return;
    }

    if (chooser.points < 5) {
      setActionError('Você não tem pontos suficientes.');
      return;
    }

    if (!selectedTarget) {
      setActionError('Selecione um alvo antes de confirmar.');
      return;
    }

    if (!state.players[selectedTarget]) {
      setActionError('O alvo selecionado não está disponível.');
      return;
    }

    if (!selectedCardId) {
      if (candidates.length === 0) {
        const refundResult = dispatch({ type: 'POWER_CHOOSE_NEXT_REFUND', chooserId });
        void Promise.resolve(refundResult);
        handleClose();
        return;
      }
      setActionError('Selecione uma carta para continuar.');
      return;
    }

    if (!canTarget(state, chooserId, selectedTarget)) {
      setActionError('Você não pode escolher o mesmo alvo consecutivamente.');
      return;
    }

    setIsSubmitting(true);

    const result = dispatch({
      type: 'POWER_CHOOSE_NEXT_COMMIT',
      payload: {
        chooserId,
        targetId: selectedTarget,
        chosenCardId: selectedCardId,
      },
    });
    onClose();
    if (typeof window !== 'undefined') {
      window.location.hash = '#/jogar';
    }
    void Promise.resolve(result).finally(() => {
      setTimeout(() => {
        if (!isOpenRef.current) {
          setIsSubmitting(false);
        }
      }, 300);
    });
  };

  const hasNoCards = candidates.length === 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Escolha do Destino"
    >
      <div className="w-full max-w-2xl rounded-2xl bg-bg-800 p-6 shadow-2xl">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-white">Escolha do Destino</h2>
            <p className="mt-1 text-sm text-white/70">
              Gaste 5 pontos para escolher a próxima carta que {chooser?.name ?? 'o jogador'} receberá.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-full border border-white/10 p-2 text-white/60 transition hover:border-white/30 hover:text-white"
            aria-label="Fechar modal"
          >
            ✕
          </button>
        </header>

        <section className="mt-6">
          <h3 className="text-sm font-medium uppercase tracking-wide text-white/60">Cartas sugeridas</h3>
          {hasNoCards ? (
            <p className="mt-3 text-sm text-white/70">
              Sem cartas disponíveis nesta intensidade. Crie uma carta personalizada para prosseguir.
            </p>
          ) : (
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              {candidates.map(card => (
                <CardPreview
                  key={card.id}
                  card={card}
                  selected={selectedCardId === card.id}
                  onSelect={() => {
                    setSelectedCardId(card.id);
                    setActionError(null);
                  }}
                />
              ))}
            </div>
          )}
        </section>

        <section className="mt-6">
          <button
            type="button"
            onClick={() => {
              setShowCreateForm(prev => !prev);
              setFormError(null);
            }}
            className="rounded-lg border border-white/10 px-3 py-2 text-sm font-medium text-white transition hover:border-accent-400/60 hover:text-accent-200"
            aria-expanded={showCreateForm}
          >
            {showCreateForm ? 'Cancelar criação' : 'Criar nova carta'}
          </button>

          {showCreateForm && (
            <div className="mt-4 space-y-3 rounded-xl border border-white/10 p-4">
              <div>
                <label htmlFor="choose-card-type" className="text-xs font-semibold uppercase text-white/60">
                  Tipo da carta
                </label>
                <select
                  id="choose-card-type"
                  className="mt-1 w-full rounded-md border border-white/10 bg-bg-900 px-3 py-2 text-sm text-white focus:border-accent-400 focus:outline-none"
                  value={newCardType}
                  onChange={event => setNewCardType(event.target.value as CardType)}
                >
                  <option value="truth">Verdade</option>
                  <option value="dare">Desafio</option>
                </select>
              </div>

              <div>
                <label htmlFor="choose-card-text" className="text-xs font-semibold uppercase text-white/60">
                  Texto
                </label>
                <textarea
                  id="choose-card-text"
                  className="mt-1 h-28 w-full resize-none rounded-md border border-white/10 bg-bg-900 px-3 py-2 text-sm text-white focus:border-accent-400 focus:outline-none"
                  value={newCardText}
                  onChange={event => setNewCardText(event.target.value)}
                  aria-required="true"
                />
              </div>

              {formError && <p className="text-sm text-red-400">{formError}</p>}

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleCreateCard}
                  className="rounded-lg bg-accent-500 px-4 py-2 text-sm font-semibold text-bg-900 transition hover:bg-accent-400"
                >
                  Salvar carta
                </button>
              </div>
            </div>
          )}
        </section>

        <section className="mt-6">
          <label htmlFor="choose-target" className="text-xs font-semibold uppercase text-white/60">
            Selecionar alvo
          </label>
          <select
            id="choose-target"
            className="mt-1 w-full rounded-md border border-white/10 bg-bg-900 px-3 py-2 text-sm text-white focus:border-accent-400 focus:outline-none"
            value={selectedTarget}
            onChange={event => {
              setSelectedTarget(event.target.value as PlayerId | '');
              setActionError(null);
            }}
          >
            <option value="">Selecione um jogador</option>
            {availableTargets.map(player => (
              <option key={player.id} value={player.id}>
                {player.name} {player.id === chooserId ? '(você)' : ''}
              </option>
            ))}
          </select>
        </section>

        {actionError && <p className="mt-4 text-sm text-red-400">{actionError}</p>}

        <footer className="mt-8 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-white/80 transition hover:border-white/30 hover:text-white"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className={`rounded-lg bg-accent-500 px-5 py-2 text-sm font-semibold text-bg-900 transition hover:bg-accent-400 disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-white/50 ${
              isSubmitting ? 'opacity-60 cursor-wait' : ''
            }`}
            disabled={
              isSubmitting ||
              !selectedCardId ||
              !selectedTarget ||
              !state.players[selectedTarget] ||
              !chooser ||
              chooser.points < 5 ||
              cooldown > 0
            }
            aria-disabled={
              isSubmitting ||
              !selectedCardId ||
              !selectedTarget ||
              !state.players[selectedTarget] ||
              !chooser ||
              chooser.points < 5 ||
              cooldown > 0
            }
          >
            Confirmar
          </button>
        </footer>
      </div>
    </div>
  );
}
