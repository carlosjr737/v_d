import React from 'react';
import { Sparkles, Sparkle, Shuffle } from 'lucide-react';

const PARTICLES = [
  { top: '8%', left: '12%', delay: '0s', duration: '9s' },
  { top: '18%', left: '62%', delay: '1.4s', duration: '12s' },
  { top: '32%', left: '28%', delay: '2.1s', duration: '10s' },
  { top: '46%', left: '78%', delay: '0.8s', duration: '11s' },
  { top: '64%', left: '18%', delay: '1.9s', duration: '13s' },
  { top: '70%', left: '52%', delay: '0.4s', duration: '8s' },
  { top: '24%', left: '86%', delay: '2.7s', duration: '10s' },
  { top: '82%', left: '72%', delay: '1.2s', duration: '12s' },
  { top: '58%', left: '4%', delay: '2.5s', duration: '9s' },
  { top: '12%', left: '88%', delay: '0.6s', duration: '14s' },
  { top: '38%', left: '8%', delay: '1.8s', duration: '10s' },
  { top: '88%', left: '30%', delay: '0.2s', duration: '11s' },
];

export const LobbyHero: React.FC = () => {
  return (
    <section className="relative overflow-hidden rounded-[2.5rem] border border-border/60 bg-bg-900/80 p-8 text-text shadow-heat [--focus-shadow:var(--shadow-heat)] backdrop-blur-xl sm:p-10">
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-secondary-500/20 via-primary-500/10 to-amber-500/25"
        aria-hidden="true"
      />
      <div className="pointer-events-none absolute -left-40 -top-48 h-80 w-80 rounded-full bg-primary-500/30 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -bottom-56 -right-48 h-96 w-96 rounded-full bg-secondary-500/25 blur-3xl" aria-hidden />

      <div className="pointer-events-none absolute inset-0 opacity-60 mix-blend-screen" aria-hidden>
        {PARTICLES.map((particle, index) => (
          <span
            key={`particle-${index}`}
            className="absolute h-1.5 w-1.5 rounded-full bg-white/70 animate-ping"
            style={{
              top: particle.top,
              left: particle.left,
              animationDelay: particle.delay,
              animationDuration: particle.duration,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-xl space-y-5">
          <span className="inline-flex items-center gap-2 rounded-pill border border-border/50 bg-bg-900/70 px-5 py-2 text-xs font-semibold uppercase tracking-[0.4em] text-text-subtle">
            <Sparkles className="h-4 w-4" />
            Lobby VC
          </span>
          <div className="space-y-3">
            <h1 className="text-4xl font-display uppercase tracking-[0.18em] text-text sm:text-5xl lg:text-6xl">
              Verdade ou Consequência
            </h1>
            <p className="text-base text-text-subtle sm:text-lg">
              Prepare a atmosfera antes das cartas. Escolha o modo ideal, defina o calor da sessão e alinhe o time para uma noite inesquecível.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-xs uppercase tracking-[0.3em] text-text-subtle">
            <span className="inline-flex items-center gap-2 rounded-pill border border-border/40 bg-bg-900/60 px-4 py-2">
              <Shuffle className="h-3.5 w-3.5" /> Ordem dinâmica garantida
            </span>
            <span className="inline-flex items-center gap-2 rounded-pill border border-border/40 bg-bg-900/60 px-4 py-2">
              <Sparkle className="h-3.5 w-3.5" /> Boosts personalizados
            </span>
          </div>
        </div>

        <div className="relative mx-auto hidden w-full max-w-xs shrink-0 sm:block">
          <div className="pointer-events-none absolute -inset-16 rounded-full bg-gradient-to-br from-primary-500/40 via-secondary-500/20 to-amber-500/30 opacity-80 blur-3xl" aria-hidden />
          <div className="relative flex h-64 w-48 items-center justify-center">
            <div className="absolute -left-10 -top-4 h-52 w-36 -rotate-[18deg] rounded-[2rem] border border-border/40 bg-bg-900/70 shadow-heat [--focus-shadow:var(--shadow-heat)]" aria-hidden>
              <div className="absolute inset-0 rounded-[2rem] bg-[var(--texture-noise)] opacity-30 mix-blend-soft-light" />
            </div>
            <div className="absolute -right-9 top-6 h-52 w-36 rotate-[16deg] rounded-[2rem] border border-border/40 bg-bg-900/70 shadow-heat [--focus-shadow:var(--shadow-heat)]" aria-hidden>
              <div className="absolute inset-0 rounded-[2rem] bg-[var(--texture-noise)] opacity-30 mix-blend-soft-light" />
            </div>
            <div className="relative h-56 w-40 rounded-[2.3rem] border border-transparent bg-grad-heat p-6 text-bg-900 shadow-heat [--focus-shadow:var(--shadow-heat)]">
              <div className="flex h-full flex-col justify-between rounded-[1.9rem] border border-white/20 bg-white/10 p-5 backdrop-blur-xl">
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em]">
                  <span>Deck VC</span>
                  <Sparkle className="h-4 w-4" />
                </div>
                <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
                  <span className="text-sm uppercase tracking-[0.4em]">Pronto para</span>
                  <strong className="text-2xl font-display uppercase tracking-[0.3em]">Arder</strong>
                </div>
                <div className="flex items-center justify-between text-[0.65rem] uppercase tracking-[0.25em]">
                  <span>Cartas 120+</span>
                  <span>Intensidade 4</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LobbyHero;
