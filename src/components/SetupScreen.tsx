
import React, { useEffect, useRef, useState } from 'react';

import {
  GameMode,
  IntensityLevel,
  Player,
  StartGameResult,
  StartGameOptions,
} from '../types/game';
import { Users, UserPlus, X, ArrowUp, ArrowDown, Play, Loader2 } from 'lucide-react';
import { shuffleArray } from '../utils/shuffle';

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

const intensityStyles: Record<IntensityLevel, string> = {
  leve: 'bg-[var(--level-leve)] text-[var(--color-bg-900)]',
  medio: 'bg-[var(--level-medio)] text-[var(--color-bg-900)]',
  pesado: 'bg-[var(--level-pesado)] text-[var(--color-bg-900)]',
  extremo: 'bg-[var(--level-extremo)] text-text',
};

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
  const shuffleTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const isMountedRef = useRef(true);

  const clearShuffleTimers = () => {
    if (shuffleIntervalRef.current) {
      clearInterval(shuffleIntervalRef.current);
      shuffleIntervalRef.current = null;
    }

    shuffleTimeoutsRef.current.forEach(timeoutId => {
      clearTimeout(timeoutId);
    });
    shuffleTimeoutsRef.current = [];
  };

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      clearShuffleTimers();
    };
  }, []);

  const queueTimeout = (handler: () => void, delay: number) => {
    const timeoutId = setTimeout(handler, delay);
    shuffleTimeoutsRef.current.push(timeoutId);
    return timeoutId;
  };

  const performShuffleAnimation = (playersToShuffle: Player[]): Promise<Player[]> => {
    clearShuffleTimers();

    if (playersToShuffle.length === 0) {
      return Promise.resolve([]);
    }

    const finalOrder = shuffleArray(playersToShuffle);

    if (!isMountedRef.current) {
      return Promise.resolve(finalOrder);
    }

    setIsShuffling(true);
    setShuffleDisplayPlayers(finalOrder);
    setRevealedCount(0);
    setCurrentShuffleName(null);

    shuffleIntervalRef.current = setInterval(() => {
      const randomPlayer = finalOrder[Math.floor(Math.random() * finalOrder.length)];
      setCurrentShuffleName(randomPlayer?.name ?? null);
    }, 120);

    return new Promise(resolve => {
      const highlightDuration = Math.max(1500, finalOrder.length * 180);

      queueTimeout(() => {
        if (shuffleIntervalRef.current) {
          clearInterval(shuffleIntervalRef.current);
          shuffleIntervalRef.current = null;
        }

        setCurrentShuffleName(null);

        const revealPlayer = (index: number) => {
          setRevealedCount(prev => (index + 1 > prev ? index + 1 : prev));

          if (index < finalOrder.length - 1) {
            queueTimeout(() => revealPlayer(index + 1), 350);
          } else {
            queueTimeout(() => {
              setCurrentShuffleName('Ordem definida!');
              resolve(finalOrder);
            }, 700);
          }
        };

        revealPlayer(0);
      }, highlightDuration);
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
    } finally {
      clearShuffleTimers();

      if (isMountedRef.current) {
        setIsShuffling(false);
        setShuffleDisplayPlayers([]);
        setRevealedCount(0);
        setCurrentShuffleName(null);
      }
    }
  };

  const isOrderDefined =
    revealedCount === shuffleDisplayPlayers.length && shuffleDisplayPlayers.length > 0;
  const highlightText =
    currentShuffleName ?? (isOrderDefined ? 'Ordem definida!' : 'Embaralhando...');

  return (
    <div className="flex flex-1 justify-center px-4 py-10 sm:px-6 lg:px-8">
      <div className="w-full max-w-4xl space-y-10">
        <header className="text-center space-y-3">
          <div className="mx-auto inline-flex items-center gap-2 rounded-pill border border-border/60 bg-bg-800/80 px-6 py-2 uppercase tracking-[0.5em] text-xs text-text-subtle">
            VC
          </div>
          <h1 className="text-5xl sm:text-6xl font-display uppercase tracking-[0.14em] text-text">
            Verdade ou Consequência
          </h1>
          <p className="font-accent text-lg italic text-text-subtle">
            “Escolha o nível. Sinta a tensão.”
          </p>
        </header>

        <div className="rounded-card border border-border/60 bg-bg-800/80 p-8 shadow-heat [--focus-shadow:var(--shadow-heat)] backdrop-blur-xl">
          <div className="grid gap-8">
            <section className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-text-subtle">
                Modo de jogo
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  onClick={() => setMode('casal')}
                  className={`group flex h-20 items-center justify-center gap-3 rounded-card border px-6 transition-all focus-visible:outline-none focus-visible:ring-0 ${
                    mode === 'casal'
                      ? 'border-transparent bg-grad-heat text-text shadow-heat [--focus-shadow:var(--shadow-heat)]'
                      : 'border-border/60 bg-bg-900/60 text-text hover:border-border hover:bg-bg-800'
                  }`}
                >
                  <Users className="h-5 w-5" />
                  <span className="font-semibold uppercase tracking-[0.18em]">Casal (2)</span>
                </button>
                <button
                  onClick={() => setMode('grupo')}
                  className={`group flex h-20 items-center justify-center gap-3 rounded-card border px-6 transition-all focus-visible:outline-none focus-visible:ring-0 ${
                    mode === 'grupo'
                      ? 'border-transparent bg-grad-heat text-text shadow-heat [--focus-shadow:var(--shadow-heat)]'
                      : 'border-border/60 bg-bg-900/60 text-text hover:border-border hover:bg-bg-800'
                  }`}
                >
                  <Users className="h-5 w-5" />
                  <span className="font-semibold uppercase tracking-[0.18em]">Grupo (3+)</span>
                </button>
              </div>
            </section>

            <section className="space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-text-subtle">
                  Intensidade
                </h3>
                <span className="text-xs uppercase tracking-[0.3em] text-text-subtle">
                  Escolha 1 para desbloquear o jogo
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {(Object.keys(intensityLabels) as IntensityLevel[]).map(level => (
                  <button
                    key={level}
                    onClick={() => setIntensity(level)}
                    className={`flex h-14 items-center justify-between rounded-pill border px-5 text-sm font-semibold uppercase tracking-[0.2em] transition-all focus-visible:outline-none focus-visible:ring-0 ${
                      intensity === level
                        ? 'border-transparent shadow-heat [--focus-shadow:var(--shadow-heat)]'
                        : 'border-border/70'
                    } ${intensityStyles[level]}`}
                  >
                    <span>{intensityLabels[level]}</span>
                    <span className="text-[0.65rem] font-normal tracking-[0.25em] text-text/70">
                      {level === 'leve'
                        ? 'Aquecimento'
                        : level === 'medio'
                        ? 'Confiança'
                        : level === 'pesado'
                        ? 'Coragem'
                        : 'Sem limites'}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            <section className="space-y-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-text-subtle">
                  Jogadores ({players.length} {mode === 'casal' ? '- máx 2' : '- mín 3'})
                </h3>
                <p className="text-xs text-text-subtle">

                  A cada rodada um nome será sorteado automaticamente.

                </p>
              </div>

              <div className="space-y-3">
                {players.map((player, index) => (
                  <div
                    key={player.id}
                    className="flex flex-col gap-3 rounded-card border border-border/60 bg-bg-900/60 p-4 transition-colors sm:flex-row sm:items-center"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-500 text-sm font-semibold text-bg-900 shadow-heat [--focus-shadow:var(--shadow-heat)]">
                        {index + 1}
                      </span>
                      <input
                        type="text"
                        placeholder="Nome do jogador"
                        value={player.name}
                        onChange={e => updatePlayerName(player.id, e.target.value)}
                        className="flex-1 rounded-pill border border-border/60 bg-transparent px-4 py-2 text-base text-text placeholder:text-text-subtle focus-visible:outline-none focus-visible:ring-0"
                      />
                    </div>
                    <div className="flex items-center justify-end gap-2 sm:ml-auto">
                      <button
                        onClick={() => movePlayer(index, 'up')}
                        disabled={index === 0}
                        className="grid h-10 w-10 place-items-center rounded-full border border-border/40 text-text-subtle transition hover:text-text disabled:opacity-40"
                      >
                        <ArrowUp size={16} />
                      </button>
                      <button
                        onClick={() => movePlayer(index, 'down')}
                        disabled={index === players.length - 1}
                        className="grid h-10 w-10 place-items-center rounded-full border border-border/40 text-text-subtle transition hover:text-text disabled:opacity-40"
                      >
                        <ArrowDown size={16} />
                      </button>
                      <button
                        onClick={() => removePlayer(player.id)}
                        disabled={players.length <= 2}
                        className="grid h-10 w-10 place-items-center rounded-full border border-border/40 text-text-subtle transition hover:text-secondary-500 disabled:opacity-40"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {(!mode || mode === 'grupo' || players.length < 2) && (
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    type="text"
                    placeholder="Nome do novo jogador"
                    value={newPlayerName}
                    onChange={e => setNewPlayerName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addPlayer()}
                    className="flex-1 rounded-pill border border-border/60 bg-bg-900/60 px-4 py-3 text-base text-text placeholder:text-text-subtle focus-visible:outline-none focus-visible:ring-0"
                  />
                  <button
                    onClick={addPlayer}
                    disabled={!newPlayerName.trim()}
                    className="flex h-[var(--button-height)] items-center justify-center gap-2 rounded-pill border border-dashed border-border/60 px-6 text-sm font-semibold uppercase tracking-[0.2em] text-text transition disabled:cursor-not-allowed disabled:opacity-40 hover:border-primary-500"
                  >
                    <UserPlus size={18} />
                    Adicionar jogador
                  </button>
                </div>
              )}
            </section>

            <section className="space-y-3">
              <button
                onClick={handleStart}
                disabled={!canStart || isStarting || isShuffling}
                aria-busy={isStarting || isShuffling}
                className="flex h-[var(--button-height)] w-full items-center justify-center gap-3 rounded-pill bg-grad-heat px-6 text-lg font-semibold uppercase tracking-[0.24em] text-text shadow-heat [--focus-shadow:var(--shadow-heat)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
              >

                {isStarting ? (

                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Play size={22} />
                )}

                {isStarting ? 'Sincronizando baralho...' : 'Iniciar sessão'}

              </button>
              {!canStart && (
                <div className="rounded-card border border-dashed border-border/60 bg-bg-900/50 p-4 text-center text-sm text-text-subtle">
                  {!mode && '• Escolha um modo de jogo'}
                  {mode && !intensity && '• Selecione a intensidade'}
                  {mode && intensity && !players.every(p => p.name.trim()) && '• Preencha todos os nomes'}
                  {mode === 'grupo' && players.length < 3 && '• Adicione pelo menos 3 jogadores'}
                </div>
              )}
            </section>
          </div>
        </div>
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
