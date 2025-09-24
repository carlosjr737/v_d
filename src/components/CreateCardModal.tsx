import React, { useState } from 'react';
import { Player, IntensityLevel } from '../types/game';
import { Heart, Zap, X, Plus, Sparkles, Loader2 } from 'lucide-react';

interface CreateCardModalProps {
  currentPlayer: Player;
  intensity: IntensityLevel;
  onAddCard: (type: 'truth' | 'dare', text: string, applyBoost: boolean) => Promise<boolean>;
  onClose: () => void;
}

const intensityLabels: Record<IntensityLevel, string> = {
  leve: 'Leve',
  medio: 'Médio',
  pesado: 'Pesado',
  extremo: 'Extremo',
};

const intensityColors: Record<IntensityLevel, string> = {
  leve: 'bg-[var(--level-leve)]',
  medio: 'bg-[var(--level-medio)]',
  pesado: 'bg-[var(--level-pesado)]',
  extremo: 'bg-[var(--level-extremo)]',
};

const cardTypeAccent = {
  truth: {
    base: 'bg-[var(--color-primary-500)] text-[var(--color-bg-900)]',
    icon: 'bg-[var(--color-primary-500)] text-[var(--color-bg-900)]',
  },
  dare: {
    base: 'bg-[var(--color-secondary-500)] text-[var(--color-bg-900)]',
    icon: 'bg-[var(--color-secondary-500)] text-[var(--color-bg-900)]',
  },
} as const;

export const CreateCardModal: React.FC<CreateCardModalProps> = ({
  currentPlayer,
  intensity,
  onAddCard,
  onClose,
}) => {
  const [cardType, setCardType] = useState<'truth' | 'dare'>('truth');
  const [cardText, setCardText] = useState('');
  const [applyBoost, setApplyBoost] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canApplyBoost = currentPlayer.boostPoints >= 2;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cardText.trim()) {
      alert('Digite o texto da carta!');
      return;
    }

    if (applyBoost && !canApplyBoost) {
      alert('Você não tem pontos suficientes para aplicar boost!');
      return;
    }

    setIsSubmitting(true);

    try {
      const success = await onAddCard(cardType, cardText.trim(), applyBoost);

      if (success) {
        onClose();
      } else {
        alert('Não foi possível criar a carta. Confira seus pontos e sua conexão.');
      }
    } catch (error) {
      console.error('Erro ao enviar carta personalizada:', error);
      alert('Ocorreu um erro inesperado ao criar a carta. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--overlay-veil)] p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-card border border-border/60 bg-bg-900/85 shadow-heat [--focus-shadow:var(--shadow-heat)] backdrop-blur-2xl">
        <div className="flex items-center justify-between border-b border-border/50 px-6 py-4">
          <div className="space-y-1">
            <span className="text-xs uppercase tracking-[0.4em] text-text-subtle">
              Criar carta personalizada
            </span>
            <h3 className="text-2xl font-display uppercase tracking-[0.18em] text-text">
              Inspiração imediata
            </h3>
          </div>
          <button
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-full border border-border/60 text-text-subtle transition hover:text-text"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 px-6 py-6">
          <div className="rounded-card border border-border/60 bg-bg-800/70 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-text-subtle">
              <span>Jogador responsável</span>
              <div className="flex items-center gap-3">
                <span className="rounded-pill border border-border/50 bg-bg-900/60 px-3 py-1 text-text">
                  {currentPlayer.name}
                </span>
                <span className={`rounded-pill px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-text ${intensityColors[intensity]}`}>
                  {intensityLabels[intensity]}
                </span>
              </div>
            </div>
            <p className="mt-3 text-xs uppercase tracking-[0.3em] text-text-subtle">
              Pontos de boost: {currentPlayer.boostPoints}/5
            </p>
          </div>

          <div className="space-y-3">
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-text-subtle">
              Tipo da carta
            </span>
            <div className="grid gap-3 sm:grid-cols-2">
              {(['truth', 'dare'] as const).map(type => {
                const isActive = cardType === type;
                const Icon = type === 'truth' ? Heart : Zap;

                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setCardType(type)}
                    className={`flex h-20 items-center justify-between rounded-card border px-5 transition focus-visible:outline-none focus-visible:ring-0 ${
                      isActive
                        ? `${cardTypeAccent[type].base} border-transparent shadow-heat [--focus-shadow:var(--shadow-heat)]`
                        : 'border-border/60 bg-bg-900/60 text-text hover:border-border'
                    }`}
                  >
                    <span className="flex items-center gap-3 text-left">
                      <span
                        className={`grid h-10 w-10 place-items-center rounded-full shadow-heat [--focus-shadow:var(--shadow-heat)] ${
                          isActive
                            ? cardTypeAccent[type].icon
                            : 'bg-bg-800 text-text'
                        }`}
                      >
                        <Icon size={18} />
                      </span>
                      <span className="text-sm font-semibold uppercase tracking-[0.2em]">
                        {type === 'truth' ? 'Verdade' : 'Desafio'}
                      </span>
                    </span>
                    <span className="text-[0.65rem] uppercase tracking-[0.3em] text-text-subtle">
                      {type === 'truth' ? 'Confissão' : 'Coragem'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-text-subtle" htmlFor="card-text">
              Texto da carta
            </label>
            <textarea
              id="card-text"
              value={cardText}
              onChange={e => setCardText(e.target.value)}
              placeholder={`Digite aqui sua ${cardType === 'truth' ? 'pergunta reveladora' : 'provocação audaciosa'}...`}
              rows={4}
              className="w-full rounded-card border border-border/60 bg-bg-900/60 px-4 py-3 text-base text-text placeholder:text-text-subtle focus-visible:outline-none focus-visible:ring-0"
              maxLength={500}
              disabled={isSubmitting}
              required
            />
            <div className="flex items-center justify-between text-xs text-text-subtle">
              <span>Limite: 500 caracteres</span>
              <span>{cardText.length}/500</span>
            </div>
          </div>

          <div className="rounded-card border border-dashed border-border/60 bg-bg-800/70 p-4">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={applyBoost}
                onChange={e => setApplyBoost(e.target.checked)}
                disabled={!canApplyBoost || isSubmitting}
                className="mt-1 h-4 w-4 accent-accent-500"
              />
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles size={18} className="text-accent-500" />
                  <span className="text-sm font-semibold uppercase tracking-[0.2em] text-text">
                    Aplicar boost (2 pontos)
                  </span>
                </div>
                <p className="text-sm text-text-subtle">
                  Garante prioridade para esta carta na próxima rodada e impede o descarte automático após o uso.
                </p>
                {!canApplyBoost && (
                  <p className="text-sm text-secondary-300">
                    Você precisa de pelo menos 2 pontos para usar este recurso.
                  </p>
                )}
              </div>
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex h-12 items-center justify-center rounded-pill border border-border px-4 text-sm font-semibold uppercase tracking-[0.2em] text-text transition hover:border-primary-500 hover:text-primary-300 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!cardText.trim() || isSubmitting}
              className="flex h-12 items-center justify-center gap-2 rounded-pill bg-grad-heat px-4 text-sm font-semibold uppercase tracking-[0.2em] text-text shadow-heat [--focus-shadow:var(--shadow-heat)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus size={18} />}
              {isSubmitting ? 'Criando...' : 'Criar carta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
