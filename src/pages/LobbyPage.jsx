import { Users, LogOut } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export const LobbyPage = ({ gameId, gameState, user, onStartGame, onLogout }) => {
  const isHost = user.uid === gameState.hostId;

  return (
    <div className="min-h-screen bg-slate-100 p-8 font-sans">
      <Card className="max-w-2xl mx-auto p-6 text-center relative">
        <div className="absolute top-4 right-4">
          <Button variant="ghost" onClick={onLogout} title="Leave Game">
            <LogOut size={16} />
          </Button>
        </div>

        <h1 className="text-2xl font-bold mb-4">Lobby: {gameId}</h1>
        <div className="mb-6">
          <p className="text-slate-500 mb-2">Share this Game ID:</p>
          <div className="flex items-center justify-center gap-2">
            <div className="bg-slate-100 p-3 rounded text-xl font-mono tracking-widest select-all inline-block border border-slate-300">
              {gameId}
            </div>
          </div>
        </div>
        
        <div className="mb-8">
          <h3 className="font-semibold text-slate-700 mb-3">Players Joined:</h3>
          <div className="flex flex-wrap gap-2 justify-center">
            {Object.values(gameState.players).map(p => (
              <span key={p.id} className="px-4 py-2 bg-slate-800 text-white rounded-full flex items-center gap-2">
                <Users size={16} /> {p.name}
              </span>
            ))}
          </div>
        </div>

        {isHost ? (
          <Button onClick={onStartGame} className="w-full py-4 text-lg">Start Game</Button>
        ) : (
          <div className="text-slate-500 italic animate-pulse">Waiting for host to start...</div>
        )}
      </Card>
    </div>
  );
};
