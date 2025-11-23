import { useState, useEffect } from 'react';
import { Train, LogOut, Search, RefreshCw, Info } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { appId } from '../config/firebase';
import { fetchAvailableGames } from '../services/gameService';

export const WelcomePage = ({ user, playerName, setPlayerName, error, onCreateGame, onJoinGame, onLogout, loading }) => {
  const [joinInput, setJoinInput] = useState("");
  const [availableGames, setAvailableGames] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchGames = async () => {
    setRefreshing(true);
    try {
      const games = await fetchAvailableGames();
      setAvailableGames(games);
    } catch (e) {
      console.error("Error fetching games:", e);
    }
    setRefreshing(false);
  };

  useEffect(() => {
    if (user) {
      fetchGames();
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center font-sans p-4">
      <Card className="w-full max-w-lg p-6 relative">
        <div className="absolute top-4 right-4">
          <Button variant="ghost" onClick={onLogout} title="Reset User Identity">
            <LogOut size={16} />
          </Button>
        </div>
        
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-slate-800 flex items-center justify-center gap-2">
            <Train className="w-8 h-8" /> Iron & Shares
          </h1>
          <p className="text-slate-500">1830-style Light Strategy game</p>
          <div className="text-xs text-slate-400 mt-1 font-mono">Version: 1.1</div>
          <div className="text-xs text-slate-400 mt-1 font-mono">User ID: {user.uid.slice(0,6)}...</div>
        </div>

        <div className="space-y-4">
          {error && <div className="p-3 bg-red-100 text-red-700 rounded text-sm font-medium">{error}</div>}
          
          <div className="bg-blue-50 p-3 rounded text-sm text-blue-800 flex gap-2">
            <Info className="shrink-0 mt-0.5" size={16} />
            <div>
              To play with others, send them the <strong>URL of this page</strong>. 
              To play solo (2-handed), open this URL in an <strong>Incognito Window</strong>.
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">My Player Name</label>
            <input 
              type="text" 
              value={playerName} 
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-slate-500 outline-none"
              placeholder="Enter your name..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <button 
              onClick={onCreateGame} 
              disabled={loading}
              className="bg-slate-800 text-white py-3 rounded hover:bg-slate-900 transition font-semibold disabled:opacity-50"
            >
              Create New Game
            </button>
            <div className="flex flex-col gap-2">
              <div className="flex gap-1">
                <input 
                  type="text" 
                  value={joinInput} 
                  onChange={(e) => setJoinInput(e.target.value.toUpperCase())}
                  placeholder="ID"
                  className="w-full p-2 border border-slate-300 rounded text-center uppercase font-mono tracking-widest"
                />
                <button 
                  onClick={() => onJoinGame(joinInput)} 
                  disabled={loading}
                  className="bg-white border-2 border-slate-800 text-slate-800 px-3 rounded hover:bg-slate-50 font-semibold disabled:opacity-50"
                >
                  Join
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-8 border-t pt-4">
          <div className="flex justify-between items-end mb-2">
            <h3 className="font-bold text-slate-700 flex items-center gap-2">
              <Search size={16} /> Public Games
            </h3>
            <button 
              onClick={fetchGames} 
              className="text-slate-500 hover:text-slate-800 p-1"
              title="Refresh List"
            >
              <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            </button>
          </div>
          
          <div className="bg-slate-50 rounded border border-slate-200 min-h-[100px] max-h-[200px] overflow-auto">
            {availableGames.length === 0 ? (
              <div className="p-4 text-center text-slate-400 text-sm">
                {refreshing ? "Searching..." : "No active lobbies found in this universe."}
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {availableGames.map(g => (
                  <div key={g.id} className="p-3 flex justify-between items-center hover:bg-slate-100">
                    <div>
                      <div className="font-bold text-sm">Host: {Object.values(g.players)[0]?.name}</div>
                      <div className="text-xs text-slate-500 font-mono">ID: {g.id}</div>
                    </div>
                    <Button 
                      onClick={() => onJoinGame(g.id)} 
                      className="text-xs py-1 px-3"
                      disabled={loading || !playerName}
                    >
                      Quick Join
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="text-center mt-6 text-xs text-slate-400 font-mono">
          App Universe ID: {appId.substring(0, 8)}...
        </div>
      </Card>
    </div>
  );
};
