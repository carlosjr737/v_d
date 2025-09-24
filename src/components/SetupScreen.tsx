
import React, { useEffect, useRef, useState } from 'react';

import {
  GameMode,
  IntensityLevel,
  Player,
  StartGameResult,
  StartGameOptions,
} from '../types/game';
import {
  Users,
  UserPlus,
  X,
  ArrowUp,
  ArrowDown,
  Play,
  Loader2,
  Flame,
  Sun,
  Skull,
  Sparkles,
  PartyPopper,
  Crown,
  Rocket,
  Star,
  Gem,
  Map,
  Gauge,
} from 'lucide-react';
import { LobbyHero } from './LobbyHero';
import { GameOptionCard } from './GameOptionCard';

interface SetupScreenProps {
  onStartGame: (
    mode: GameMode,
    intensity: IntensityLevel,
    players: Player[],
    options?: StartGameOptions
  ) => Promise<StartGameResult>;
  isStarting: boolean;
}

const intensityLabels: Record<IntensityLevel, string> = {
  leve: 'Leve',
  medio: 'Médio',
  pesado: 'Pesado',
  extremo: 'Extremo',
};

interface IntensityConfig {
  description: string;
  Icon: React.ComponentType<{ className?: string }>;
  tagline: string;
}

const intensityConfigs: Record<IntensityLevel, IntensityConfig> = {
  leve: {
    description: 'Aquecimento suave para quebrar o gelo.',
    Icon: Sparkles,
    tagline: 'Comece devagar',
  },
  medio: {
    description: 'Equilíbrio perfeito entre risadas e segredos.',
    Icon: Sun,
    tagline: 'Confiança em alta',
  },
  pesado: {
    description: 'Desafios ousados para corações corajosos.',
    Icon: Flame,
    tagline: 'Só para valentes',
  },
  extremo: {
    description: 'Sem filtros. Apenas adrenalina pura.',
    Icon: Skull,
    tagline: 'Limites? Quais?',
  },
};

const avatarIcons = [Sparkles, PartyPopper, Crown, Rocket, Star, Gem];
const BOOST_MAX = 5;

export const SetupScreen: React.FC<SetupScreenProps> = ({ onStartGame, isStarting }) => {
  const [mode, setMode] = useState<GameMode | null>(null);
  const [intensity, setIntensity] = useState<IntensityLevel | null>(null);
  const [players, setPlayers] = useState<Player[]>([
    { id: '1', name: '', boostPoints: 3 },
    { id: '2', name: '', boostPoints: 3 },
  ]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [isShuffling, setIsShuffling] = useState(false);
  const [shuffleDisplayPlayers, setShuffleDisplayPlayers] = useState<Player[]>([]);
  const [currentShuffleName, setCurrentShuffleName] = useState<string | null>(null);
  const [revealedCount, setRevealedCount] = useState(0);

  const shuffleIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const shuffleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);

  const clearShuffleTimers = () => {
    if (shuffleIntervalRef.current) {
      clearInterval(shuffleIntervalRef.current);
      shuffleIntervalRef.current = null;
    }
    if (shuffleTimeoutRef.current) {
      clearTimeout(shuffleTimeoutRef.current);
      shuffleTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      clearShuffleTimers();
    };
  }, []);



  const runShufflePreview = (playersToReveal: Player[]): Promise<void> => {

    clearShuffleTimers();

    if (!playersToReveal.length) {
      return Promise.resolve();
    }

    if (!isMountedRef.current) {
      return Promise.resolve();
    }

    setIsShuffling(true);
    setShuffleDisplayPlayers(playersToReveal);
    setRevealedCount(0);
    setCurrentShuffleName(null);

    const revealInterval = Math.max(450, 1100 - playersToReveal.length * 80);

    return new Promise(resolve => {
      let index = 0;

      shuffleIntervalRef.current = setInterval(() => {
        if (!isMountedRef.current) {
          clearShuffleTimers();
          resolve();
          return;
        }

        const player = playersToReveal[index];
        if (player) {
          setCurrentShuffleName(player.name);
          setRevealedCount(prev => {
            const next = index + 1;
            return next > prev ? next : prev;
          });
        }

        index += 1;

        if (index >= playersToReveal.length) {
          if (shuffleIntervalRef.current) {
            clearInterval(shuffleIntervalRef.current);
            shuffleIntervalRef.current = null;
          }

          shuffleTimeoutRef.current = setTimeout(() => {
            if (!isMountedRef.current) {
              resolve();
              return;
            }

            setCurrentShuffleName('Ordem definida!');
            resolve();
            shuffleTimeoutRef.current = null;
          }, 600);
        }
      }, revealInterval);
    });
  };

  const addPlayer = () => {
    if (newPlayerName.trim()) {
      const newPlayer: Player = {
        id: Date.now().toString(),
        name: newPlayerName.trim(),
        boostPoints: 3,
      };
      setPlayers([...players, newPlayer]);
      setNewPlayerName('');
    }
  };

  const removePlayer = (id: string) => {
    if (players.length > 2) {
      setPlayers(players.filter(p => p.id !== id));
    }
  };

  const updatePlayerName = (id: string, name: string) => {
    setPlayers(players.map(p => (p.id === id ? { ...p, name } : p)));
  };

  const movePlayer = (index: number, direction: 'up' | 'down') => {
    const newPlayers = [...players];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex >= 0 && targetIndex < players.length) {
      [newPlayers[index], newPlayers[targetIndex]] = [
        newPlayers[targetIndex],
        newPlayers[index],
      ];
      setPlayers(newPlayers);
    }
  };

  const canStart =
    mode &&
    intensity &&
    players.length >= 2 &&
    players.every(p => p.name.trim().length > 0) &&
    (mode === 'casal' ? players.length === 2 : players.length >= 3);

  const handleStart = async () => {
    if (!canStart || isStarting || isShuffling) {
      return;
    }

    const sanitizedPlayers = players.map(player => ({
      ...player,
      name: player.name.trim(),
    }));

    const animationPromise = runShufflePreview(sanitizedPlayers);

    try {
      const result = await onStartGame(mode!, intensity!, sanitizedPlayers, {
        shouldShuffle: false,
      });

      if (result.errorMessage) {
        alert(result.errorMessage);
      }
    } catch (error) {
      console.error('Erro ao iniciar o jogo:', error);
      alert('Não foi possível iniciar o jogo. Tente novamente.');
    }

    await animationPromise.catch(() => undefined);

    clearShuffleTimers();

    if (isMountedRef.current) {
      setIsShuffling(false);
      setShuffleDisplayPlayers([]);
      setRevealedCount(0);
      setCurrentShuffleName(null);
    }
  };

  const isOrderDefined =
    revealedCount === shuffleDisplayPlayers.length && shuffleDisplayPlayers.length > 0;
  const highlightText =
    currentShuffleName ?? (isOrderDefined ? 'Ordem definida!' : 'Embaralhando...');

  const minPlayersRequired = mode === 'casal' ? 2 : 3;
  const hasMinimumPlayers = players.length >= minPlayersRequired;
  const hasExactCouple = mode === 'casal' ? players.length === 2 : true;
  const hasValidNames = players.every(p => p.name.trim().length > 0);
  const playersConfigured = Boolean(mode) && hasMinimumPlayers && hasValidNames && hasExactCouple;

  const steps = [
    {
      id: 1,
      title: 'Passo 1 · Modo',
      description: 'Escolha o modo ideal para a rodada.',
      completed: Boolean(mode),
      Icon: Map,
    },
    {
      id: 2,
      title: 'Passo 2 · Intensidade',
      description: 'Ajuste o nível de tensão que o grupo aguenta.',
      completed: Boolean(intensity),
      Icon: Gauge,
    },
    {
      id: 3,
      title: 'Passo 3 · Jogadores',
      description: 'Garanta nomes, boosts e ordem estelar.',
      completed: playersConfigured,
      Icon: Users,
    },
    {
      id: 4,
      title: 'Passo 4 · Sessão',
      description: 'Tudo pronto? É hora de soltar as cartas.',
      completed: canStart,
      Icon: Play,
    },
  ];

  const activeStepIndex = steps.findIndex(step => !step.completed);
  const currentStepIndex = activeStepIndex === -1 ? steps.length - 1 : activeStepIndex;

  return (
    <div className="flex flex-1 justify-center px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex w-full max-w-6xl flex-col gap-10 lg:flex-row">
        <div className="flex-1 space-y-10">
          <LobbyHero />

          <div className="space-y-8">
            <section className="rounded-card border border-border/60 bg-bg-800/80 p-8 shadow-heat [--focus-shadow:var(--shadow-heat)] backdrop-blur-xl space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-text-subtle">Modo de jogo</h3>
                  <p className="text-xs uppercase tracking-[0.3em] text-text-subtle/80">
                    Defina como a ordem das cartas vai acontecer.
                  </p>
                </div>
                <span className="inline-flex items-center gap-2 rounded-pill border border-border/50 bg-bg-900/60 px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-text-subtle">
                  {mode ? `Modo selecionado: ${mode === 'casal' ? 'Casal' : 'Grupo'}` : 'Passo 1 de 4'}
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <GameOptionCard
                  icon={<Users className="h-6 w-6" />}
                  title="Casal (2)"
                  description="Conexão intimista para duplas que querem elevar a temperatura."
                  isActive={mode === 'casal'}
                  onClick={() => setMode('casal')}
                />
                <GameOptionCard
                  icon={<Users className="h-6 w-6" />}
                  title="Grupo (3+)"
                  description="Energia coletiva com rodadas cheias de surpresas."
                  isActive={mode === 'grupo'}
                  onClick={() => setMode('grupo')}
                />
              </div>
            </section>

            <section className="rounded-card border border-border/60 bg-bg-800/80 p-8 shadow-heat [--focus-shadow:var(--shadow-heat)] backdrop-blur-xl space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-text-subtle">Intensidade</h3>
                  <p className="text-xs uppercase tracking-[0.3em] text-text-subtle/80">
                    Escolha 1 nível para liberar o baralho.
                  </p>
                </div>
                <span className="inline-flex items-center gap-2 rounded-pill border border-border/50 bg-bg-900/60 px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-text-subtle">
                  {intensity ? `Selecionado: ${intensityLabels[intensity]}` : 'Passo 2 de 4'}
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {(Object.keys(intensityLabels) as IntensityLevel[]).map(level => {
                  const { Icon, description, tagline } = intensityConfigs[level];
                  return (
                    <GameOptionCard
                      key={level}
                      icon={<Icon className="h-6 w-6" />}
                      title={intensityLabels[level]}
                      description={description}
                      meta={tagline}
                      isActive={intensity === level}
                      onClick={() => setIntensity(level)}
                    />
                  );
                })}
              </div>
            </section>

            <section className="rounded-card border border-border/60 bg-bg-800/80 p-8 shadow-heat [--focus-shadow:var(--shadow-heat)] backdrop-blur-xl space-y-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-text-subtle">
                    Jogadores ({players.length} {mode === 'casal' ? '- máx 2' : `- mín ${minPlayersRequired}`})
                  </h3>
                  <p className="text-xs text-text-subtle">
                    A ordem é definida automaticamente. Personalize boosts e prepare o squad.
                  </p>
                </div>
                <span className="inline-flex items-center gap-2 rounded-pill border border-border/50 bg-bg-900/60 px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-text-subtle">
                  {playersConfigured ? 'Configuração pronta' : 'Passo 3 de 4'}
                </span>
              </div>

              <div className="space-y-4">
                {players.map((player, index) => {
                  const AvatarIcon = avatarIcons[index % avatarIcons.length];
                  const boostPercent = Math.min(100, Math.max(0, (player.boostPoints / BOOST_MAX) * 100));
                  const boostStyle = { width: `${boostPercent}%` };

                  return (
                    <div
                      key={player.id}
                      className="group relative overflow-hidden rounded-[1.75rem] border border-border/60 bg-bg-900/60 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-primary-500/60 focus-within:border-primary-500/60"
                    >
                      <div className="pointer-events-none absolute -inset-20 opacity-0 transition-opacity duration-300 group-hover:opacity-25 group-focus-within:opacity-30" aria-hidden>
                        <div className="absolute inset-0 bg-grad-heat blur-3xl" />
                      </div>

                      <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-1 items-center gap-4">
                          <div className="relative">
                            <span className="pointer-events-none absolute inset-0 rounded-full bg-grad-heat opacity-60 blur-2xl" aria-hidden />
                            <div className="relative flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-bg-900/70 text-text shadow-heat [--focus-shadow:var(--shadow-heat)]">
                              <AvatarIcon className="h-6 w-6" />
                            </div>
                          </div>

                          <div className="flex-1 space-y-3">
                            <input
                              type="text"
                              placeholder="Nome do jogador"
                              value={player.name}
                              onChange={e => updatePlayerName(player.id, e.target.value)}
                              className="w-full rounded-pill border border-border/60 bg-transparent px-4 py-2 text-base text-text placeholder:text-text-subtle focus-visible:outline-none focus-visible:ring-0"
                            />
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[0.65rem] uppercase tracking-[0.3em] text-text-subtle">
                                <span className="inline-flex items-center gap-1">
                                  <Sparkles className="h-3.5 w-3.5" /> Boost ativo
                                </span>
                                <span>{player.boostPoints} pts</span>
                              </div>
                              <div className="h-1.5 w-full overflow-hidden rounded-full border border-border/40 bg-bg-900/60">
                                <div className="h-full rounded-full bg-grad-heat transition-all duration-500" style={boostStyle} />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => movePlayer(index, 'up')}
                            disabled={index === 0}
                            aria-label="Mover jogador para cima"
                            className="grid h-10 w-10 place-items-center rounded-full border border-border/40 bg-bg-900/60 text-text-subtle transition-all duration-200 hover:-translate-y-0.5 hover:border-primary-500/50 hover:text-text focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <ArrowUp size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => movePlayer(index, 'down')}
                            disabled={index === players.length - 1}
                            aria-label="Mover jogador para baixo"
                            className="grid h-10 w-10 place-items-center rounded-full border border-border/40 bg-bg-900/60 text-text-subtle transition-all duration-200 hover:translate-y-0.5 hover:border-primary-500/50 hover:text-text focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <ArrowDown size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => removePlayer(player.id)}
                            disabled={players.length <= 2}
                            aria-label="Remover jogador"
                            className="grid h-10 w-10 place-items-center rounded-full border border-border/40 bg-bg-900/60 text-text-subtle transition-all duration-200 hover:scale-105 hover:border-secondary-500/60 hover:text-secondary-300 focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {(!mode || mode === 'grupo' || players.length < 2) && (
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    type="text"
                    placeholder="Nome do novo jogador"
                    value={newPlayerName}
                    onChange={e => setNewPlayerName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addPlayer()}
                    className="flex-1 rounded-pill border border-border/60 bg-bg-900/70 px-4 py-3 text-base text-text placeholder:text-text-subtle focus-visible:outline-none focus-visible:ring-0"
                  />
                  <button
                    onClick={addPlayer}
                    disabled={!newPlayerName.trim()}
                    className="flex h-[var(--button-height)] items-center justify-center gap-2 rounded-pill border border-dashed border-border/60 px-6 text-sm font-semibold uppercase tracking-[0.2em] text-text transition-all duration-200 hover:border-primary-500 hover:text-primary-200 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <UserPlus size={18} />
                    Adicionar jogador
                  </button>
                </div>
              )}
            </section>

            <section className="rounded-card border border-border/60 bg-bg-800/80 p-8 shadow-heat [--focus-shadow:var(--shadow-heat)] backdrop-blur-xl space-y-4">
              <button
                onClick={handleStart}
                disabled={!canStart || isStarting || isShuffling}
                aria-busy={isStarting || isShuffling}
                className="flex h-[var(--button-height)] w-full items-center justify-center gap-3 rounded-pill bg-grad-heat px-6 text-lg font-semibold uppercase tracking-[0.24em] text-text shadow-heat [--focus-shadow:var(--shadow-heat)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isStarting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Play size={22} />}
                {isStarting ? 'Sincronizando baralho...' : 'Iniciar sessão'}
              </button>
              {!canStart && (
                <div className="rounded-card border border-dashed border-border/60 bg-bg-900/60 p-4 text-center text-sm text-text-subtle">
                  {!mode && '• Escolha um modo de jogo'}
                  {mode && !intensity && '• Selecione a intensidade'}
                  {mode && intensity && !players.every(p => p.name.trim()) && '• Preencha todos os nomes'}
                  {mode === 'grupo' && players.length < 3 && '• Adicione pelo menos 3 jogadores'}
                </div>
              )}
            </section>
          </div>
        </div>

        <aside className="lg:w-72 xl:w-80">
          <div className="space-y-6 rounded-[2rem] border border-border/60 bg-bg-800/70 p-6 shadow-heat [--focus-shadow:var(--shadow-heat)] backdrop-blur-xl lg:sticky lg:top-24">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-2 rounded-pill border border-border/40 bg-bg-900/60 px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-text-subtle">
                Roadmap da sessão
              </span>
              <h2 className="text-2xl font-display uppercase tracking-[0.18em] text-text">Etapas</h2>
              <p className="text-sm text-text-subtle">
                Acompanhe o fluxo para chegar ao momento da verdade. Cada passo libera novas possibilidades no deck.
              </p>
            </div>

            <div className="space-y-3">
              {steps.map((step, index) => {
                const StepIcon = step.Icon;
                const isActive = index === currentStepIndex;

                return (
                  <GameOptionCard
                    key={step.id}
                    as="div"
                    icon={<StepIcon className="h-6 w-6" />}
                    title={step.title}
                    description={step.description}
                    meta={step.completed ? 'Concluído' : isActive ? 'Agora' : 'Pendente'}
                    isActive={isActive}
                    isCompleted={step.completed}
                  />
                );
              })}
            </div>
          </div>
        </aside>
      </div>

      {isShuffling && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--overlay-veil)]/95 px-4 py-6 backdrop-blur-md">
          <div className="relative w-full max-w-xl overflow-hidden rounded-card border border-border/60 bg-bg-900/85 p-8 text-center shadow-heat [--focus-shadow:var(--shadow-heat)]">
            <div className="pointer-events-none absolute -inset-24 opacity-40" aria-hidden="true">
              <div className="absolute inset-0 animate-spin-slower bg-grad-heat blur-3xl" />
            </div>
            <div className="pointer-events-none absolute inset-0 bg-[var(--texture-noise)] opacity-20 mix-blend-soft-light" aria-hidden="true" />
            <div className="relative z-10 space-y-6">
              <span className="inline-flex items-center gap-2 rounded-pill border border-border/40 bg-bg-800/70 px-5 py-2 text-xs font-semibold uppercase tracking-[0.4em] text-text-subtle animate-shuffle-pulse">
                Sorteando ordem
              </span>
              <div className="min-h-[3rem] text-3xl font-display uppercase tracking-[0.2em] text-text" aria-live="polite">
                {highlightText}
              </div>
              <p className="text-sm text-text-subtle">
                A vez de cada jogador é escolhida aleatoriamente. Respire fundo e boa sorte!
              </p>
              <div className="space-y-3 text-left">
                {shuffleDisplayPlayers.map((player, index) => {
                  const isRevealed = index < revealedCount;
                  return (
                    <div
                      key={player.id}
                      className={`flex items-center justify-between rounded-card border border-border/40 bg-bg-800/70 px-4 py-3 transition-all duration-500 ${
                        isRevealed ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-grad-heat text-sm font-semibold uppercase tracking-[0.2em] text-text shadow-heat [--focus-shadow:var(--shadow-heat)]">
                          {index + 1}
                        </span>
                        <span className="text-base font-semibold uppercase tracking-[0.18em] text-text">
                          {isRevealed ? player.name : '???'}
                        </span>
                      </div>
                      <span className="text-xs uppercase tracking-[0.3em] text-text-subtle">
                        {isRevealed ? 'Pronto' : '...'}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-center gap-2 text-xs uppercase tracking-[0.3em] text-text-subtle">
                {(isStarting || !isOrderDefined) && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>{isStarting ? 'Sincronizando cartas' : isOrderDefined ? 'Vamos jogar!' : 'Preparando sequência'}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};






