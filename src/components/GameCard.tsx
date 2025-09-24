import React, { forwardRef } from 'react';
import { Heart, Sparkles, Zap } from 'lucide-react';

const typeLabels = {
  truth: 'Verdade',
  dare: 'Desafio',
} as const;

const typeDescriptors = {
  truth: 'Confissão',
  dare: 'Coragem',
} as const;

const cn = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ');

export interface GameCardProps extends React.HTMLAttributes<HTMLDivElement> {
  type: 'truth' | 'dare';
  text?: string;
  isBoosted?: boolean;
  isCustom?: boolean;
  highlight?: boolean;
  footer?: React.ReactNode;
  children?: React.ReactNode;
}

export const GameCard = forwardRef<HTMLDivElement, GameCardProps>(
  (
    {
      type,
      text,
      isBoosted = false,
      isCustom = false,
      highlight = false,
      footer,
      children,
      className,
      ...rest
    },
    ref
  ) => {
    const Icon = type === 'truth' ? Heart : Zap;
    const label = typeLabels[type];
    const descriptor = typeDescriptors[type];

    const accentBarClass =
      type === 'truth' ? 'bg-primary-500/70' : 'bg-secondary-500/70';
    const baseGlowClass =
      type === 'truth' ? 'bg-primary-500/15' : 'bg-secondary-500/15';

    return (
      <div
        ref={ref}
        className={cn(
          'relative isolate flex h-full flex-col overflow-hidden rounded-card border border-border/60 bg-bg-900/80 p-5 text-text shadow-none transition-all duration-500 ease-out',
          'backdrop-blur-xl focus-visible:outline-none',
          isBoosted || highlight
            ? 'border-accent-500/80 shadow-heat [--focus-shadow:var(--shadow-heat)]'
            : 'hover:border-border/40',
          className
        )}
        {...rest}
      >
        <div
          className={cn(
            'pointer-events-none absolute inset-x-6 top-0 h-1 rounded-full opacity-90',
            accentBarClass
          )}
          aria-hidden="true"
        />
        <div
          className={cn(
            'pointer-events-none absolute -left-16 top-10 h-32 w-32 rounded-full blur-3xl',
            baseGlowClass
          )}
          aria-hidden="true"
        />
        <div
          className={cn(
            'pointer-events-none absolute -right-12 bottom-10 h-28 w-28 rounded-full blur-3xl transition-opacity duration-500',
            isBoosted ? 'bg-accent-500/25 opacity-100' : baseGlowClass
          )}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/12 via-transparent to-white/5 opacity-80"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-0 bg-[var(--texture-noise)] opacity-20 mix-blend-soft-light"
          aria-hidden="true"
        />

        <div
          className="pointer-events-none absolute -top-16 right-8 flex h-28 w-28 items-center justify-center rounded-full border border-white/10 bg-bg-900/70 shadow-inner backdrop-blur-xl"
          aria-hidden="true"
        >
          <Icon className="h-9 w-9 text-white/45 animate-float-slow" />
        </div>
        {isBoosted && (
          <div
            className="pointer-events-none absolute -bottom-10 left-4 flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-bg-900/70 shadow-inner backdrop-blur-md animate-float-slower"
            aria-hidden="true"
          >
            <Sparkles className="h-6 w-6 text-accent-500/80" />
          </div>
        )}

        <div className="relative z-10 flex flex-1 flex-col gap-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  'inline-flex items-center gap-2 rounded-pill px-3 py-1 text-xs font-semibold uppercase tracking-[0.35em]',
                  type === 'truth'
                    ? 'bg-primary-500 text-[var(--color-bg-900)]'
                    : 'bg-secondary-500 text-[var(--color-bg-900)]'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </span>
              {isCustom && (
                <span className="inline-flex items-center gap-2 rounded-pill border border-dashed border-white/35 px-3 py-1 text-[0.6rem] uppercase tracking-[0.35em] text-text-subtle">
                  Criada na sessão
                </span>
              )}
            </div>
            {isBoosted && (
              <span className="inline-flex items-center gap-2 rounded-pill bg-accent-500/90 px-3 py-1 text-[0.6rem] uppercase tracking-[0.35em] text-text shadow-heat [--focus-shadow:var(--shadow-heat)]">
                <Sparkles className="h-3.5 w-3.5" /> boost ativo
              </span>
            )}
          </div>

          <span className="text-[0.65rem] uppercase tracking-[0.4em] text-text-subtle">
            {descriptor}
          </span>

          <div className="flex-1 space-y-4 text-base leading-relaxed text-text">
            {children ? (
              <div className="flex h-full flex-col gap-4">{children}</div>
            ) : text ? (
              <p>{text}</p>
            ) : (
              <p className="text-text-subtle">Esta carta aguarda conteúdo.</p>
            )}
          </div>

          {footer && (
            <div className="border-t border-white/10 pt-3 text-xs uppercase tracking-[0.3em] text-text-subtle">
              {footer}
            </div>
          )}
        </div>
      </div>
    );
  }
);

GameCard.displayName = 'GameCard';
