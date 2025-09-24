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
  } = useGameState();

  return (
    <div className="min-h-screen">
      {gameState.phase === 'setup' ? (
        <SetupScreen onStartGame={startGame} />
      ) : (
        <GameScreen
          gameState={gameState}
          onDrawCard={drawCard}
          onFulfillCard={fulfillCard}
          onPassCard={passCard}
          onAddCustomCard={addCustomCard}
          onResetGame={resetGame}
        />
      )}
    </div>
  );
}

export default App;