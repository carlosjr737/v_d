import React, { useState } from 'react';
import { GameMode, IntensityLevel, Player } from '../types/game';
import { Users, UserPlus, X, ArrowUp, ArrowDown, Play } from 'lucide-react';

interface SetupScreenProps {
  onStartGame: (mode: GameMode, intensity: IntensityLevel, players: Player[]) => void;
}

export const SetupScreen: React.FC<SetupScreenProps> = ({ onStartGame }) => {
  const [mode, setMode] = useState<GameMode | null>(null);
  const [intensity, setIntensity] = useState<IntensityLevel | null>(null);
  const [players, setPlayers] = useState<Player[]>([
    { id: '1', name: '', boostPoints: 3 },
    { id: '2', name: '', boostPoints: 3 },
  ]);
  const [newPlayerName, setNewPlayerName] = useState('');

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
    setPlayers(players.map(p => p.id === id ? { ...p, name } : p));
  };

  const movePlayer = (index: number, direction: 'up' | 'down') => {
    const newPlayers = [...players];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex >= 0 && targetIndex < players.length) {
      [newPlayers[index], newPlayers[targetIndex]] = [newPlayers[targetIndex], newPlayers[index]];
      setPlayers(newPlayers);
    }
  };

  const canStart = mode && intensity && players.length >= 2 && 
                   players.every(p => p.name.trim().length > 0) &&
                   (mode === 'casal' ? players.length === 2 : players.length >= 3);

  const handleStart = () => {
    if (canStart) {
      onStartGame(mode!, intensity!, players);
    }
  };

  const intensityColors = {
    leve: 'bg-green-500 hover:bg-green-600',
    medio: 'bg-yellow-500 hover:bg-yellow-600', 
    pesado: 'bg-orange-500 hover:bg-orange-600',
    extremo: 'bg-red-500 hover:bg-red-600',
  };

  const intensityLabels = {
    leve: 'Leve',
    medio: 'Médio',
    pesado: 'Pesado',
    extremo: 'Extremo',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 p-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Verdade ou Desafio
          </h1>
          <p className="text-blue-100">Configure sua sessão</p>
        </div>

        <div className="bg-white rounded-xl shadow-xl p-6 space-y-6">
          {/* Mode Selection */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Modo de Jogo</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setMode('casal')}
                className={`p-4 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${
                  mode === 'casal'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Users size={20} />
                <span className="font-medium">Casal (2)</span>
              </button>
              <button
                onClick={() => setMode('grupo')}
                className={`p-4 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${
                  mode === 'grupo'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Users size={20} />
                <span className="font-medium">Grupo (3+)</span>
              </button>
            </div>
          </div>

          {/* Intensity Selection */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Intensidade <span className="text-red-500">*</span>
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(intensityLabels).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setIntensity(key as IntensityLevel)}
                  className={`p-3 rounded-lg text-white font-medium transition-all ${
                    intensity === key
                      ? intensityColors[key as IntensityLevel] + ' ring-4 ring-white'
                      : intensityColors[key as IntensityLevel]
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Players */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Jogadores ({players.length} {mode === 'casal' ? '- máx 2' : '- mín 3'})
            </h3>
            
            <div className="space-y-3 mb-4">
              {players.map((player, index) => (
                <div key={player.id} className="flex items-center gap-2">
                  <span className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </span>
                  <input
                    type="text"
                    placeholder="Nome do jogador"
                    value={player.name}
                    onChange={(e) => updatePlayerName(player.id, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <div className="flex gap-1">
                    <button
                      onClick={() => movePlayer(index, 'up')}
                      disabled={index === 0}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                    >
                      <ArrowUp size={16} />
                    </button>
                    <button
                      onClick={() => movePlayer(index, 'down')}
                      disabled={index === players.length - 1}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                    >
                      <ArrowDown size={16} />
                    </button>
                    <button
                      onClick={() => removePlayer(player.id)}
                      disabled={players.length <= 2}
                      className="p-1 text-gray-400 hover:text-red-500 disabled:opacity-30"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {(!mode || mode === 'grupo' || players.length < 2) && (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nome do novo jogador"
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addPlayer()}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={addPlayer}
                  disabled={!newPlayerName.trim()}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <UserPlus size={16} />
                  Adicionar
                </button>
              </div>
            )}
          </div>

          {/* Start Button */}
          <button
            onClick={handleStart}
            disabled={!canStart}
            className="w-full py-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold text-lg rounded-lg hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
          >
            <Play size={20} />
            Iniciar Sessão
          </button>

          {!canStart && (
            <div className="text-sm text-gray-500 text-center">
              {!mode && '• Escolha um modo de jogo'}
              {mode && !intensity && '• Selecione a intensidade'}
              {mode && intensity && (!players.every(p => p.name.trim()) && '• Preencha todos os nomes')}
              {mode === 'grupo' && players.length < 3 && '• Adicione pelo menos 3 jogadores'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};