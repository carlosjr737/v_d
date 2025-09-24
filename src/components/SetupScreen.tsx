
import React, { useEffect, useRef, useState } from 'react';

import {
  GameMode,
  IntensityLevel,
  Player,
  StartGameResult,
  StartGameOptions,
} from '../types/game';
import { Loader2 } from 'lucide-react';
import { SetupHeader } from '../ui/setup/SetupHeader';
import { SetupAccordion } from '../ui/setup/SetupAccordion';
import { SegmentedMode } from '../ui/setup/SegmentedMode';
import { IntensityChips } from '../ui/setup/IntensityChips';
import { PlayersCompact } from '../ui/setup/PlayersCompact';
import { SetupFooter } from '../ui/setup/SetupFooter';

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

const intensityAccent: Record<IntensityLevel, string> = {
  leve: 'var(--level-leve)',
  medio: 'var(--level-medio)',
  pesado: 'var(--level-pesado)',
  extremo: 'var(--level-extremo)',
};

export const SetupScreen: React.FC<SetupScreenProps> = ({ onStartGame, isStarting }) => {
  const [mode, setMode] = useState<GameMode | null>(null);
  const [intensity, setIntensity] = useState<IntensityLevel | null>(null);
  const [players, setPlayers] = useState<Player[]>([
    { id: '1', name: '', boostPoints: 3 },
    { id: '2', name: '', boostPoints: 3 },
  ]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [openSection, setOpenSection] = useState<'mode' | 'intensity' | 'players'>('mode');
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

  const onSelectMode = (value: GameMode) => {
    setMode(value);
    setOpenSection('intensity');
  };

  const onSelectIntensity = (level: IntensityLevel) => {
    setIntensity(level);
    setOpenSection('players');
  };

  const onUpdatePlayerName = (id: string, name: string) => {
    setPlayers(players.map(p => (p.id === id ? { ...p, name } : p)));
  };

  const onAddPlayer = (name?: string) => {
    const fallbackName = name ?? newPlayerName;
    const trimmed = fallbackName.trim();
    const isCoupleMode = mode === 'casal';

    if (!trimmed || (isCoupleMode && players.length >= 2)) {
      return;
    }

    const newPlayer: Player = {
      id: Date.now().toString(),
      name: trimmed,
      boostPoints: 3,
    };

    setPlayers([...players, newPlayer]);
    setNewPlayerName('');
  };

  const onRemovePlayer = (id: string) => {
    if (players.length > 2) {
      setPlayers(players.filter(p => p.id !== id));
    }
  };

  const movePlayerById = (id: string, direction: 'up' | 'down') => {
    const currentIndex = players.findIndex(player => player.id === id);

    if (currentIndex === -1) {
      return;
    }

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= players.length) {
      return;
    }

    const reordered = [...players];
    [reordered[currentIndex], reordered[targetIndex]] = [
      reordered[targetIndex],
      reordered[currentIndex],
    ];
    setPlayers(reordered);
  };

  const onMoveUp = (id: string) => movePlayerById(id, 'up');
  const onMoveDown = (id: string) => movePlayerById(id, 'down');

  const canStart =
    mode &&
    intensity &&
    players.length >= 2 &&
    players.every(p => p.name.trim().length > 0) &&
    (mode === 'casal' ? players.length === 2 : players.length >= 3);

  const onStart = async () => {
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

  const canAddMorePlayers = mode !== 'casal' || players.length < 2;
  const intensityLabel = intensity ? intensityLabels[intensity] : undefined;
  const intensitySummary = intensity ? (
    <span style={{ color: intensityAccent[intensity] }}>{intensityLabel}</span>
  ) : (
    <span className="text-text-subtle/70">Selecione</span>
  );
  const playersSummary = `${players.length} ${players.length === 1 ? 'jogador' : 'jogadores'}`;
  const canStartNow = Boolean(canStart) && !isStarting && !isShuffling;

  const accordionSections = [
    {
      id: 'mode' as const,
      icon: '👥',
      label: 'Modo',
      summary: mode ? (mode === 'casal' ? 'Casal' : 'Grupo') : 'Escolha',
      content: (
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-text-subtle/70">Escolha</p>
          <SegmentedMode value={mode ?? null} onChange={onSelectMode} />
        </div>
      ),
    },
    {
      id: 'intensity' as const,
      icon: '🔥',
      label: 'Intensidade',
      summary: intensitySummary,
      content: (
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-text-subtle/70">Selecione 1 nível</p>
          <IntensityChips value={intensity ?? undefined} onSelect={onSelectIntensity} />
        </div>
      ),
    },
    {
      id: 'players' as const,
      icon: '🎯',
      label: 'Jogadores',
      badge: 'Min 2',
      summary: playersSummary,
      content: (
        <PlayersCompact
          players={players}
          draftName={newPlayerName}
          onDraftChange={setNewPlayerName}
          canAddMore={canAddMorePlayers}
          onAdd={onAddPlayer}
          onName={onUpdatePlayerName}
          onDel={onRemovePlayer}
          onUp={onMoveUp}
          onDown={onMoveDown}
          disableRemove={players.length <= 2}
        />
      ),
    },
  ];

  return (
    <div className="grid min-h-dvh grid-rows-[56px_auto_88px] overflow-hidden">
      <SetupHeader intensityLabel={intensityLabel} />

      <main className="overflow-hidden px-3 pb-3">
        <div className="h-full rounded-[24px] border border-[var(--color-border)]/60 bg-[var(--color-bg-800)]/65 p-3 backdrop-blur">
          <SetupAccordion
            sections={accordionSections}
            openSection={openSection}
            onChange={section => setOpenSection(section)}
          />
        </div>
      </main>

      <SetupFooter
        canStart={canStartNow}
        onStart={onStart}
        isBusy={isStarting || isShuffling}
      />

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






