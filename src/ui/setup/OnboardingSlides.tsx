import React, { useState } from 'react';
import { IntensityLevel } from '../../types/game';
import { ChipLevel } from '../ChipLevel';

const slides: Array<{
  level: IntensityLevel;
  icon: string;
  title: string;
  description: string;
  gradient: string;
}> = [
  {
    level: 'leve',
    icon: '🌸',
    title: 'LEVE',
    description: 'Perguntas divertidas e desafios simples',
    gradient: 'linear-gradient(135deg, #FF6AA6 0%, #FF2E7E 100%)',
  },
  {
    level: 'medio',
    icon: '🔥',
    title: 'MÉDIO',
    description: 'Aumenta a temperatura da brincadeira',
    gradient: 'linear-gradient(135deg, #FF2E7E 0%, #FF6B4A 100%)',
  },
  {
    level: 'pesado',
    icon: '💥',
    title: 'PESADO',
    description: 'Para quem não tem medo de ousar',
    gradient: 'linear-gradient(135deg, #D94C2E 0%, #FF6B4A 100%)',
  },
  {
    level: 'extremo',
    icon: '⚡',
    title: 'EXTREMO',
    description: 'Só para os mais corajosos',
    gradient: 'linear-gradient(135deg, #C400FF 0%, #FF2E7E 100%)',
  },
];

interface OnboardingSlidesProps {
  onSelectLevel: (level: IntensityLevel) => void;
}

export const OnboardingSlides: React.FC<OnboardingSlidesProps> = ({ onSelectLevel }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const currentSlideData = slides[currentSlide];

  return (
    <div className="flex h-full flex-col">
      <div 
        className="flex-1 flex flex-col items-center justify-center p-8 text-center text-white"
        style={{ background: currentSlideData.gradient }}
      >
        <div className="mb-8 text-8xl">{currentSlideData.icon}</div>
        <h1 className="mb-4 font-display text-6xl font-bold tracking-wider">
          {currentSlideData.title}
        </h1>
        <p className="mb-8 text-lg opacity-90">
          {currentSlideData.description}
        </p>
        <button
          onClick={() => onSelectLevel(currentSlideData.level)}
          className="h-16 w-48 rounded-pill bg-white/20 font-display text-xl font-bold text-white backdrop-blur-sm transition-all hover:scale-105 hover:bg-white/30 active:scale-95"
        >
          JOGAR
        </button>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between p-4">
        <button
          onClick={prevSlide}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-bg-800/80 text-white transition-all hover:scale-110 active:scale-95"
        >
          ←
        </button>

        {/* Dots */}
        <div className="flex gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-3 w-3 rounded-full transition-all ${
                index === currentSlide ? 'bg-white' : 'bg-white/40'
              }`}
            />
          ))}
        </div>

        <button
          onClick={nextSlide}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-bg-800/80 text-white transition-all hover:scale-110 active:scale-95"
        >
          →
        </button>
      </div>
    </div>
  );
};