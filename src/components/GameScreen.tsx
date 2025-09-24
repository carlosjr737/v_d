import React, { useState } from 'react';
import { GameState, Card } from '../types/game';
import { Heart, Zap, Plus, Eye, RotateCcw, CheckCircle, XCircle } from 'lucide-react';
import { CreateCardModal } from './CreateCardModal';
import { DeckModal } from './DeckModal';

interface GameScreenProps {
  gameState: GameState;
  onDrawCard: (type: 'truth' | 'dare') => Card | null;
  onFulfillCard: () => void;
  onPassCard: () => void;
  onAddCustomCard: (type: 'truth' | 'dare', text: string, applyBoost: boolean) => boolean;
  onResetGame: () => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({
  gameState,
  onDrawCard,
  onFulfillCard,
  onPassCard,
  onAddCustomCard,
  onResetGame,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeckModal, setShowDeckModal] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const { currentCard } = gameState;

  const handleDrawCard = (type: 'truth' | 'dare') => {
    const card = onDrawCard(type);
    if (!card) {
      alert(`Não há mais cartas de ${type === 'truth' ? 'Verdade' : 'Desafio'} disponíveis!`);
    }
  };

  const intensityColors = {
    leve: 'from-green-400 to-green-600',
    medio: 'from-yellow-400 to-yellow-600',
    pesado: 'from-orange-400 to-orange-600',
    extremo: 'from-red-400 to-red-600',
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
        {/* Header */}
        <div className="bg-white rounded-t-xl shadow-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                Vez de: {currentPlayer.name}
              </h2>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Zap size={14} />
                  {currentPlayer.boostPoints} pontos
                </span>
                <span className={`px-2 py-1 rounded-full text-white text-xs bg-gradient-to-r ${intensityColors[gameState.intensity!]}`}>
                  {intensityLabels[gameState.intensity!]}
                </span>
              </div>
            </div>
            <div className="text-right text-sm text-gray-500">
              Jogador {gameState.currentPlayerIndex + 1} de {gameState.players.length}
            </div>
          </div>
        </div>

        {/* Game Area */}
        <div className="bg-white rounded-b-xl shadow-lg p-6 mb-4">
          {!currentCard ? (
            // Card Selection
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 text-center mb-6">
                Escolha sua opção:
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleDrawCard('truth')}
                  className="h-24 bg-gradient-to-br from-pink-400 to-pink-600 text-white rounded-xl font-bold text-lg hover:from-pink-500 hover:to-pink-700 transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
                >
                  <Heart size={24} />
                  VERDADE
                </button>
                <button
                  onClick={() => handleDrawCard('dare')}
                  className="h-24 bg-gradient-to-br from-blue-400 to-blue-600 text-white rounded-xl font-bold text-lg hover:from-blue-500 hover:to-blue-700 transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
                >
                  <Zap size={24} />
                  DESAFIO
                </button>
              </div>
            </div>
          ) : (
            // Current Card Display
            <div className="space-y-6">
              <div className="text-center">
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-white font-medium mb-4 ${
                  currentCard.type === 'truth' 
                    ? 'bg-gradient-to-r from-pink-400 to-pink-600' 
                    : 'bg-gradient-to-r from-blue-400 to-blue-600'
                }`}>
                  {currentCard.type === 'truth' ? <Heart size={18} /> : <Zap size={18} />}
                  {currentCard.type === 'truth' ? 'VERDADE' : 'DESAFIO'}
                  {currentCard.isBoosted && (
                    <span className="bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold ml-2">
                      BOOST
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 border-l-4 border-gray-300">
                <p className="text-gray-800 text-lg leading-relaxed">
                  {currentCard.text}
                </p>
                {currentCard.isCustom && (
                  <div className="mt-3 text-xs text-gray-500 flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Carta personalizada
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={onFulfillCard}
                  className="py-3 bg-gradient-to-r from-green-400 to-green-600 text-white font-bold rounded-lg hover:from-green-500 hover:to-green-700 transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle size={20} />
                  CUMPRIR
                </button>
                <button
                  onClick={onPassCard}
                  className="py-3 bg-gradient-to-r from-gray-400 to-gray-600 text-white font-bold rounded-lg hover:from-gray-500 hover:to-gray-700 transition-all flex items-center justify-center gap-2"
                >
                  <XCircle size={20} />
                  PASSAR
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="py-3 bg-gradient-to-r from-purple-400 to-purple-600 text-white font-medium rounded-lg hover:from-purple-500 hover:to-purple-700 transition-all flex items-center justify-center gap-2"
          >
            <Plus size={18} />
            Criar Carta
          </button>
          <button
            onClick={() => setShowDeckModal(true)}
            className="py-3 bg-gradient-to-r from-indigo-400 to-indigo-600 text-white font-medium rounded-lg hover:from-indigo-500 hover:to-indigo-700 transition-all flex items-center justify-center gap-2"
          >
            <Eye size={18} />
            Baralho
          </button>
          <button
            onClick={() => setShowResetConfirm(true)}
            className="py-3 bg-gradient-to-r from-red-400 to-red-600 text-white font-medium rounded-lg hover:from-red-500 hover:to-red-700 transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw size={18} />
            Reiniciar
          </button>
        </div>

        {/* Modals */}
        {showCreateModal && (
          <CreateCardModal
            currentPlayer={currentPlayer}
            intensity={gameState.intensity!}
            onAddCard={onAddCustomCard}
            onClose={() => setShowCreateModal(false)}
          />
        )}

        {showDeckModal && (
          <DeckModal
            cards={gameState.availableCards}
            intensity={gameState.intensity!}
            onClose={() => setShowDeckModal(false)}
          />
        )}

        {/* Reset Confirmation */}
        {showResetConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 max-w-sm w-full">
              <h3 className="text-lg font-bold text-gray-800 mb-3">Reiniciar Sessão?</h3>
              <p className="text-gray-600 mb-6">
                Isso irá apagar todo o progresso e cartas criadas. Esta ação não pode ser desfeita.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    onResetGame();
                    setShowResetConfirm(false);
                  }}
                  className="flex-1 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all"
                >
                  Reiniciar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};