import React from 'react';
import { useGameState } from './hooks/useGameState';
import { SetupScreen } from './components/SetupScreen';
import { GameScreen } from './components/GameScreen';

function App() {
  const {
    gameState,
    startGame,
    drawCard,
    fulfillCard,
    passCard,
    addCustomCard,
    resetGame,
    isStartingGame,
    drawNextPlayer,
  } = useGameState();

  return (
    <div className="min-h-screen bg-bg-900 text-text relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-grad-heat opacity-[0.18] blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 bg-[var(--texture-noise)] opacity-40 mix-blend-soft-light" aria-hidden="true" />
      <div className="relative z-10 flex min-h-screen flex-col">
        {gameState.phase === 'setup' ? (
          <SetupScreen onStartGame={startGame} isStarting={isStartingGame} />
        ) : (
          <GameScreen
            gameState={gameState}
            onDrawCard={drawCard}
            onFulfillCard={fulfillCard}
            onPassCard={passCard}
            onAddCustomCard={addCustomCard}
            onResetGame={resetGame}
            onDrawNextPlayer={drawNextPlayer}
          />
        )}
      </div>
    </div>
  );
}

export default App;
