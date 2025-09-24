import React, { useState } from 'react';
import { Card, IntensityLevel } from '../types/game';
import { X, Heart, Zap, Sparkles, Filter } from 'lucide-react';

interface DeckModalProps {
  cards: Card[];
  intensity: IntensityLevel;
  onClose: () => void;
}

export const DeckModal: React.FC<DeckModalProps> = ({ cards, intensity, onClose }) => {
  const [filter, setFilter] = useState<'all' | 'truth' | 'dare' | 'boosted' | 'custom'>('all');

  const filteredCards = cards.filter(card => {
    switch (filter) {
      case 'truth':
        return card.type === 'truth';
      case 'dare':
        return card.type === 'dare';
      case 'boosted':
        return card.isBoosted;
      case 'custom':
        return card.isCustom;
      default:
        return true;
    }
  });

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

  const stats = {
    total: cards.length,
    truths: cards.filter(c => c.type === 'truth').length,
    dares: cards.filter(c => c.type === 'dare').length,
    boosted: cards.filter(c => c.isBoosted).length,
    custom: cards.filter(c => c.isCustom).length,
  };

  const filterOptions = [
    { key: 'all', label: 'Todas', count: stats.total },
    { key: 'truth', label: 'Verdades', count: stats.truths },
    { key: 'dare', label: 'Desafios', count: stats.dares },
    { key: 'boosted', label: 'Boostadas', count: stats.boosted },
    { key: 'custom', label: 'Criadas', count: stats.custom },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-lg h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h3 className="text-xl font-bold text-gray-800">Baralho da Sessão</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2 py-1 rounded-full text-white text-xs bg-gradient-to-r ${intensityColors[intensity]}`}>
                {intensityLabels[intensity]}
              </span>
              <span className="text-sm text-gray-500">
                {stats.total} cartas restantes
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center gap-2 mb-3">
            <Filter size={16} className="text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Filtros:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {filterOptions.map((option) => (
              <button
                key={option.key}
                onClick={() => setFilter(option.key as typeof filter)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  filter === option.key
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                } ${option.count === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={option.count === 0}
              >
                {option.label} ({option.count})
              </button>
            ))}
          </div>
        </div>

        {/* Cards List */}
        <div className="flex-1 overflow-auto p-4">
          {filteredCards.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-2">🃏</div>
              <p>Nenhuma carta encontrada com este filtro.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCards.map((card) => (
                <div
                  key={card.id}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    card.isBoosted 
                      ? 'border-yellow-400 bg-yellow-50' 
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`p-1 rounded ${
                        card.type === 'truth' 
                          ? 'bg-pink-100 text-pink-600' 
                          : 'bg-blue-100 text-blue-600'
                      }`}>
                        {card.type === 'truth' ? <Heart size={14} /> : <Zap size={14} />}
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        {card.type === 'truth' ? 'Verdade' : 'Desafio'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {card.isBoosted && (
                        <div className="flex items-center gap-1 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold">
                          <Sparkles size={12} />
                          BOOST
                        </div>
                      )}
                      {card.isCustom && (
                        <div className="w-2 h-2 bg-green-500 rounded-full" title="Carta personalizada"></div>
                      )}
                    </div>
                  </div>
                  <p className="text-gray-800 text-sm leading-relaxed">
                    {card.text}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50">
          <div className="text-center text-sm text-gray-600">
            Mostrando {filteredCards.length} de {stats.total} cartas
            {stats.boosted > 0 && (
              <div className="mt-1 text-xs text-yellow-700">
                {stats.boosted} carta{stats.boosted > 1 ? 's' : ''} boostada{stats.boosted > 1 ? 's' : ''} será{stats.boosted > 1 ? 'ão' : ''} priorizada{stats.boosted > 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};