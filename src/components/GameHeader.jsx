import { Train, LogOut } from 'lucide-react';
import { Button } from './ui/Button';

export const GameHeader = ({ gameId, roundNumber, phase, onLogout }) => {
  return (
    <header className="bg-slate-900 text-white p-4 shadow-lg flex justify-between items-center">
      <div className="flex items-center gap-3">
        <Train className="text-yellow-500" />
        <div>
          <h1 className="font-bold text-lg leading-tight">Iron & Shares</h1>
          <div className="text-xs text-slate-400">Game: {gameId} • Round {roundNumber}</div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className={`px-3 py-1 rounded text-sm font-bold ${phase === 'STOCK' ? 'bg-emerald-500 text-emerald-900' : 'bg-orange-500 text-orange-900'}`}>
          {phase} ROUND
        </div>
        <Button variant="ghost" onClick={onLogout} className="text-slate-400 hover:text-white">
          <LogOut size={16} />
        </Button>
      </div>
    </header>
  );
};
