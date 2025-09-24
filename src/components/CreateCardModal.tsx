import React, { useState } from 'react';
import { Player, IntensityLevel } from '../types/game';
import { Heart, Zap, X, Plus, Sparkles } from 'lucide-react';

interface CreateCardModalProps {
  currentPlayer: Player;
  intensity: IntensityLevel;
  onAddCard: (type: 'truth' | 'dare', text: string, applyBoost: boolean) => boolean;
  onClose: () => void;
}

export const CreateCardModal: React.FC<CreateCardModalProps> = ({
  currentPlayer,
  intensity,
  onAddCard,
  onClose,
}) => {
  const [cardType, setCardType] = useState<'truth' | 'dare'>('truth');
  const [cardText, setCardText] = useState('');
  const [applyBoost, setApplyBoost] = useState(false);

  const canApplyBoost = currentPlayer.boostPoints >= 2;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!cardText.trim()) {
      alert('Digite o texto da carta!');
      return;
    }

    if (applyBoost && !canApplyBoost) {
      alert('Você não tem pontos suficientes para aplicar boost!');
      return;
    }

    const success = onAddCard(cardType, cardText.trim(), applyBoost);
    
    if (success) {
      onClose();
    } else {
      alert('Erro ao criar carta. Verifique se você tem pontos suficientes.');
    }
  };

  const intensityLabels = {
    leve: 'Leve',
    medio: 'Médio',
    pesado: 'Pesado', 
    extremo: 'Extremo',
  };

  const intensityColors = {
    leve: 'from-green-400 to-green-600',
    medio: 'from-yellow-400 to-yellow-600',
    pesado: 'from-orange-400 to-orange-600',
    extremo: 'from-red-400 to-red-600',
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-xl font-bold text-gray-800">Criar Nova Carta</h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Player Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Criando como:</span>
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-800">{currentPlayer.name}</span>
                <span className={`px-2 py-1 rounded-full text-white text-xs bg-gradient-to-r ${intensityColors[intensity]}`}>
                  {intensityLabels[intensity]}
                </span>
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-500">
              Pontos de boost: {currentPlayer.boostPoints}/5
            </div>
          </div>

          {/* Card Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Tipo da Carta
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setCardType('truth')}
                className={`p-4 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${
                  cardType === 'truth'
                    ? 'border-pink-500 bg-pink-50 text-pink-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Heart size={18} />
                <span className="font-medium">Verdade</span>
              </button>
              <button
                type="button"
                onClick={() => setCardType('dare')}
                className={`p-4 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${
                  cardType === 'dare'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Zap size={18} />
                <span className="font-medium">Desafio</span>
              </button>
            </div>
          </div>

          {/* Card Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Texto da Carta *
            </label>
            <textarea
              value={cardText}
              onChange={(e) => setCardText(e.target.value)}
              placeholder={`Digite aqui sua ${cardType === 'truth' ? 'pergunta' : 'ação de desafio'}...`}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              required
            />
            <div className="mt-1 text-xs text-gray-500">
              {cardText.length}/500 caracteres
            </div>
          </div>

          {/* Boost Option */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={applyBoost}
                onChange={(e) => setApplyBoost(e.target.checked)}
                disabled={!canApplyBoost}
                className="mt-1 h-4 w-4 text-yellow-600 rounded focus:ring-yellow-500"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-yellow-600" />
                  <span className="font-medium text-gray-800">
                    Aplicar Boost (2 pontos)
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Prioriza esta carta na próxima rodada e evita que seja descartada após o uso.
                </p>
                {!canApplyBoost && (
                  <p className="text-sm text-red-600 mt-1">
                    Você precisa de pelo menos 2 pontos de boost.
                  </p>
                )}
              </div>
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-all font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!cardText.trim()}
              className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center justify-center gap-2"
            >
              <Plus size={18} />
              Criar Carta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};