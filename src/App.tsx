import React from 'react';
import { useGameState } from './hooks/useGameState';
import { SetupScreen } from './components/SetupScreen';
import { GameScreen } from './components/GameScreen';

function App() {
  const {
    gameState,
    setSetupIntensity,
    startGame,
    drawCard,
    forceCard,
    fulfillCard,
    passCard,
    addCustomCard,
    resetGame,
    isStartingGame,
    drawNextPlayer,
    addCardToDeck,
    removeCardFromDeck,
  } = useGameState();

  return (
    <div className="min-h-screen bg-bg-900 text-text relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-grad-heat opacity-[0.18] blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 bg-[var(--texture-noise)] opacity-40 mix-blend-soft-light" aria-hidden="true" />
      <div className="relative z-10 flex min-h-screen flex-col">
        {gameState.phase === 'setup' ? (
          <SetupScreen
            intensity={gameState.intensity}
            onSelectIntensity={setSetupIntensity}
            onStartGame={startGame}
            isStarting={isStartingGame}
          />
        ) : (
          <GameScreen
            gameState={gameState}
            onDrawCard={drawCard}
            onForceCard={forceCard}
            onFulfillCard={fulfillCard}
            onPassCard={passCard}
            onAddCustomCard={addCustomCard}
            onResetGame={resetGame}
            onDrawNextPlayer={drawNextPlayer}
            onAddCardToDeck={addCardToDeck}
            onRemoveCardFromDeck={removeCardFromDeck}
          />
        )}
      </div>
    </div>
  );
}

export default App;
