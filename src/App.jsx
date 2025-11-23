import { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { useGameSync } from './hooks/useGameSync';
import { getPresident } from './utils/helpers';
import * as gameService from './services/gameService';
import { WelcomePage } from './pages/WelcomePage';
import { LobbyPage } from './pages/LobbyPage';
import { GamePage } from './pages/GamePage';

export default function IronAndSharesApp() {
  const { user, handleLogout } = useAuth();
  
  const [gameId, setGameId] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [loading, setLoading] = useState(false);
  
  const { gameState, error, setError } = useGameSync(user, gameId, loading);

  const isMyTurn = gameState && gameState.turnPlayerId === user?.uid;
  const isOperatingRound = gameState?.phase === 'OPERATING';
  const isStockRound = gameState?.phase === 'STOCK';

  // --- Actions ---
  const createGame = async () => {
    if (!playerName) return setError("Please enter a name");
    setLoading(true);
    try {
      const newGameId = await gameService.createGame(user, playerName);
      setGameId(newGameId);
    } catch (e) {
      console.error("Error creating game:", e);
      setError("Failed to create game: " + e.message);
    }
    setLoading(false);
  };

  const joinGame = async (targetIdInput) => {
    if (!targetIdInput || !playerName) return setError("Enter Game ID and Name");
    setLoading(true);
    const targetGameId = targetIdInput.trim().toUpperCase();
    
    try {
      await gameService.joinGame(user, playerName, targetGameId);
      setError("");
      setGameId(targetGameId);
    } catch (e) {
      console.error("Join transaction failed:", e);
      setError(e.toString());
    }
    setLoading(false);
  };

  const startGame = async () => {
    try {
      await gameService.startGame(gameId);
    } catch (e) {
      console.error(e);
    }
  };

  const buyShare = async (companyId) => {
    if (!isMyTurn || gameState.phase !== 'STOCK') return;

    const company = gameState.companies[companyId];
    const player = gameState.players[user.uid];

    if (player.cash < company.price) return alert("Not enough cash");
    if (company.sharesSold >= 10) return alert("All shares sold");

    try {
      await gameService.buyShare(gameId, user, companyId, gameState);
    } catch (e) {
      console.error(e);
    }
  };

  const passTurn = async () => {
    if (!isMyTurn) return;
    try {
      await gameService.passTurn(gameId, user, gameState, getPresident);
    } catch (e) {
      console.error(e);
    }
  };

  const upgradeTrack = async () => {
    try {
      await gameService.upgradeTrack(gameId, gameState);
    } catch (e) {
      console.error(e);
    }
  };

  const finishOperation = async (payout) => {
    try {
      await gameService.finishOperation(gameId, gameState, payout, getPresident);
    } catch (e) {
      console.error(e);
    }
  };

  const logout = async () => {
    await handleLogout();
    setGameId("");
  };

  // --- Render ---
  if (!user) return <div className="p-10 text-center animate-pulse">Connecting to server...</div>;

  if (!gameState) {
    return (
      <WelcomePage 
        user={user}
        playerName={playerName}
        setPlayerName={setPlayerName}
        error={error}
        onCreateGame={createGame}
        onJoinGame={joinGame}
        onLogout={logout}
        loading={loading}
      />
    );
  }

  if (gameState.phase === 'LOBBY') {
    return (
      <LobbyPage 
        gameId={gameId}
        gameState={gameState}
        user={user}
        onStartGame={startGame}
        onLogout={logout}
      />
    );
  }

  const activeCompanyId = isOperatingRound ? gameState.operatingQueue[gameState.operatingCompanyIdx] : null;
  const activeCompany = activeCompanyId ? gameState.companies[activeCompanyId] : null;

  return (
    <GamePage 
      gameId={gameId}
      gameState={gameState}
      user={user}
      isMyTurn={isMyTurn}
      isOperatingRound={isOperatingRound}
      isStockRound={isStockRound}
      activeCompany={activeCompany}
      onLogout={logout}
      onPassTurn={passTurn}
      onBuyShare={buyShare}
      onUpgradeTrack={upgradeTrack}
      onFinishOperation={finishOperation}
    />
  );
}