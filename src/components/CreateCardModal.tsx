import React, { useState } from 'react';
import { Player, IntensityLevel } from '../types/game';
import { Zap, X, Plus, Sparkles, Loader2 } from 'lucide-react';
import { GameCard } from './GameCard';

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
      <div className="relative w-full max-w-5xl overflow-hidden rounded-card border border-border/60 bg-bg-900/85 shadow-heat [--focus-shadow:var(--shadow-heat)] backdrop-blur-2xl">
        <div
          className="pointer-events-none absolute -inset-32 bg-grad-overlay opacity-60 blur-3xl animate-gradient-pulse"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-0 bg-[var(--texture-noise)] opacity-30 mix-blend-soft-light animate-noise-fade"
          aria-hidden="true"
        />
        <div className="relative z-10 flex flex-col">
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
              <span className="sr-only">Fechar</span>
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="grid gap-6 px-6 py-6 lg:grid-cols-[1.05fr_1fr]"
          >
            <div className="space-y-6">
              <div>
                <span className="text-xs font-semibold uppercase tracking-[0.35em] text-text-subtle">
                  Tipo da carta
                </span>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  {(['truth', 'dare'] as const).map(type => {
                    const isActive = cardType === type;

                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setCardType(type)}
                        aria-pressed={isActive}
                        className="group relative h-full rounded-card text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/80 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-900"
                      >
                        <GameCard
                          type={type}
                          className={`h-full transition-all duration-500 group-hover:-translate-y-1 group-focus-visible:-translate-y-1 ${
                            isActive
                              ? 'border-transparent shadow-heat [--focus-shadow:var(--shadow-heat)]'
                              : 'opacity-80 hover:opacity-100'
                          }`}
                        >
                          <div className="flex h-full flex-col justify-between gap-4 text-sm text-text-subtle">
                            <div className="space-y-2">
                              <p className="text-text">
                                {type === 'truth'
                                  ? 'Estimule confissões memoráveis com perguntas ousadas.'
                                  : 'Ative a adrenalina do grupo com desafios criativos.'}
                              </p>
                              <span className="text-[0.65rem] uppercase tracking-[0.4em] text-text-subtle/80">
                                {type === 'truth' ? 'Explorar segredos' : 'Liberar coragem'}
                              </span>
                            </div>
                            <span
                              className={`text-xs font-semibold uppercase tracking-[0.3em] ${
                                isActive ? 'text-text' : 'text-text-subtle'
                              }`}
                            >
                              {isActive ? 'Selecionada' : 'Escolher'}
                            </span>
                          </div>
                        </GameCard>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="relative overflow-hidden rounded-card border border-border/60 bg-bg-900/65 p-4">
                  <div
                    className="pointer-events-none absolute -inset-6 bg-gradient-to-br from-white/8 via-transparent to-white/5 opacity-70"
                    aria-hidden="true"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-[var(--texture-noise)] opacity-10" aria-hidden="true" />
                  <div className="relative z-10 space-y-3">
                    <span className="text-xs uppercase tracking-[0.35em] text-text-subtle">
                      Jogador responsável
                    </span>
                    <p className="text-xl font-display uppercase tracking-[0.2em] text-text">
                      {currentPlayer.name}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-[0.65rem] uppercase tracking-[0.35em] text-text-subtle">
                      <span className="inline-flex items-center gap-2 rounded-pill border border-border/50 bg-bg-900/70 px-3 py-1 text-text">
                        <Zap size={14} /> {currentPlayer.boostPoints} pontos de boost
                      </span>
                      <span
                        className={`inline-flex items-center gap-2 rounded-pill px-3 py-1 text-text ${intensityColors[intensity]}`}
                      >
                        {intensityLabels[intensity]}
                      </span>
                    </div>
                  </div>
                </div>

                <label
                  className={`relative flex h-full cursor-pointer flex-col justify-between gap-3 overflow-hidden rounded-card border border-dashed border-border/60 bg-bg-900/65 p-4 transition ${
                    applyBoost
                      ? 'border-accent-500/80 bg-accent-500/10 shadow-heat [--focus-shadow:var(--shadow-heat)]'
                      : 'hover:border-primary-500/70'
                  } ${
                    !canApplyBoost || isSubmitting
                      ? 'cursor-not-allowed opacity-50'
                      : ''
                  }`}
                >
                  <div
                    className="pointer-events-none absolute -inset-6 bg-gradient-to-br from-white/8 via-transparent to-white/5 opacity-70"
                    aria-hidden="true"
                  />
                  <div className="relative z-10 flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={applyBoost}
                      onChange={e => setApplyBoost(e.target.checked)}
                      disabled={!canApplyBoost || isSubmitting}
                      className="mt-1 h-5 w-5 accent-accent-500"
                    />
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Sparkles size={18} className="text-accent-500" />
                        <span className="text-sm font-semibold uppercase tracking-[0.25em] text-text">
                          Aplicar boost (2 pontos)
                        </span>
                      </div>
                      <p className="text-sm text-text-subtle">
                        Garante prioridade na próxima rodada e protege esta carta do descarte automático.
                      </p>
                      {!canApplyBoost && (
                        <p className="text-sm text-secondary-300">
                          Você precisa de pelo menos 2 pontos para usar este recurso.
                        </p>
                      )}
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex flex-col gap-5">
              <GameCard
                type={cardType}
                isBoosted={applyBoost}
                isCustom
                className="min-h-[22rem]"
                footer={
                  <div className="flex flex-wrap items-center gap-2 text-[0.65rem] normal-case tracking-[0.2em]">
                    <span className="inline-flex items-center gap-2 rounded-pill border border-border/50 bg-bg-900/70 px-3 py-1 text-text">
                      Responsável: {currentPlayer.name}
                    </span>
                    <span
                      className={`inline-flex items-center gap-2 rounded-pill px-3 py-1 text-text ${intensityColors[intensity]}`}
                    >
                      {intensityLabels[intensity]}
                    </span>
                  </div>
                }
              >
                <label
                  className="text-xs font-semibold uppercase tracking-[0.35em] text-text-subtle"
                  htmlFor="card-text"
                >
                  Texto da carta
                </label>
                <textarea
                  id="card-text"
                  value={cardText}
                  onChange={e => setCardText(e.target.value)}
                  placeholder={`Digite aqui sua ${
                    cardType === 'truth' ? 'pergunta reveladora' : 'provocação audaciosa'
                  }...`}
                  rows={6}
                  className="min-h-[10rem] w-full resize-none rounded-xl border border-border/60 bg-bg-900/70 px-4 py-3 text-base text-text placeholder:text-text-subtle focus-visible:outline-none focus-visible:ring-0"
                  maxLength={500}
                  disabled={isSubmitting}
                  required
                />
                <div className="flex items-center justify-between text-xs text-text-subtle">
                  <span>Limite: 500 caracteres</span>
                  <span>{cardText.length}/500</span>
                </div>
              </GameCard>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
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
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
