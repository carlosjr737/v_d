import React from 'react';

type ElementType = 'button' | 'div';

interface GameOptionCardProps {
  as?: ElementType;
  icon: React.ReactNode;
  title: string;
  description: string;
  meta?: string;
  isActive?: boolean;
  isCompleted?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

const baseClasses =
  'group relative overflow-hidden rounded-[1.75rem] border border-border/60 bg-bg-900/60 p-5 text-left transition-all duration-300 focus-visible:outline-none focus-visible:ring-0';

const activeClasses =
  'border-transparent bg-bg-900/70 shadow-heat [--focus-shadow:var(--shadow-heat)] ring-1 ring-primary-500/60';

const completedClasses = 'border-primary-500/50 bg-bg-800/70';

const disabledClasses = 'opacity-60 grayscale';

const iconWrapperBase =
  'relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-500/80 via-secondary-500/70 to-amber-500/70 text-bg-900 shadow-heat transition-all duration-300';

const metaClasses =
  'inline-flex items-center gap-1 rounded-pill border border-border/40 bg-bg-900/60 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-text-subtle';

const descriptionClasses = 'text-sm leading-relaxed text-text-subtle';

const auraClasses =
  'pointer-events-none absolute -inset-16 opacity-0 transition-opacity duration-300 group-hover:opacity-40 group-focus-within:opacity-40';

const glowClasses =
  'pointer-events-none absolute inset-0 bg-gradient-to-r from-primary-500/10 via-secondary-500/10 to-amber-500/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100';

const InnerContent: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  meta?: string;
  isActive?: boolean;
  isCompleted?: boolean;
}> = ({ icon, title, description, meta, isActive, isCompleted }) => (
  <>
    <div className="absolute inset-0 rounded-[1.75rem] border border-white/5" aria-hidden />
    <div className="absolute inset-0 rounded-[1.75rem] bg-[var(--texture-noise)] opacity-20 mix-blend-soft-light" aria-hidden />
    <div className={auraClasses} aria-hidden>
      <div className="absolute inset-0 bg-grad-heat blur-3xl" />
    </div>
    <div className={glowClasses} aria-hidden />

    <div className="relative z-10 flex items-start gap-4">
      <div className={`${iconWrapperBase} ${isActive ? 'scale-105 ring-2 ring-primary-400/70' : ''} ${
        isCompleted ? 'from-secondary-500/90 via-primary-500/80 to-amber-400/80' : ''
      }`}>
        {icon}
      </div>
      <div className="flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-base font-semibold uppercase tracking-[0.22em] text-text">{title}</p>
          {meta && <span className={metaClasses}>{meta}</span>}
        </div>
        <p className={descriptionClasses}>{description}</p>
        {isActive && !isCompleted && (
          <span className="inline-flex text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-primary-200">
            Selecionado agora
          </span>
        )}
        {isCompleted && (
          <span className="inline-flex text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-secondary-200">
            Etapa concluída
          </span>
        )}
      </div>
    </div>
  </>
);

export const GameOptionCard: React.FC<GameOptionCardProps> = ({
  as = 'button',
  icon,
  title,
  description,
  meta,
  isActive,
  isCompleted,
  onClick,
  disabled,
}) => {
  const classes = [
    baseClasses,
    isActive ? activeClasses : '',
    isCompleted ? completedClasses : '',
    disabled ? disabledClasses : '',
    as === 'button' ? 'hover:-translate-y-0.5 hover:border-primary-500/70 hover:shadow-heat' : '',
  ]
    .filter(Boolean)
    .join(' ');

  if (as === 'button') {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-pressed={isActive}
        data-state={isActive ? 'active' : 'inactive'}
        className={classes}
      >
        <InnerContent icon={icon} title={title} description={description} meta={meta} isActive={isActive} isCompleted={isCompleted} />
      </button>
    );
  }

  return (
    <div className={classes} aria-live="polite">
      <InnerContent icon={icon} title={title} description={description} meta={meta} isActive={isActive} isCompleted={isCompleted} />
    </div>
  );
};

export default GameOptionCard;
