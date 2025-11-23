import { Users } from 'lucide-react';
import { Card } from './ui/Card';

export const PlayerInfo = ({ player, portfolio }) => {
  const totalShares = Object.values(portfolio || {}).reduce((a, b) => a + b, 0);

  return (
    <Card className="bg-slate-900 text-white p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-slate-700 rounded-full">
          <Users size={20} />
        </div>
        <div>
          <div className="text-sm text-slate-400">You are</div>
          <div className="font-bold text-xl text-slate-800">{player.name}</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 text-center">
        <div className="bg-slate-800 p-3 rounded">
          <div className="text-xs text-slate-400 uppercase">Cash</div>
          <div className="text-2xl text-emerald-400 font-mono">${player.cash.toFixed(0)}</div>
        </div>
        <div className="bg-slate-800 p-3 rounded">
          <div className="text-xs text-slate-400 uppercase">Shares</div>
          <div className="text-2xl font-mono">{totalShares}</div>
        </div>
      </div>
    </Card>
  );
};
