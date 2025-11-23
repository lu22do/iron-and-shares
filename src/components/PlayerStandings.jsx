import { Activity } from 'lucide-react';
import { Card } from './ui/Card';

export const PlayerStandings = ({ players, portfolio, companies, currentTurnPlayerId }) => {
  const playersWithNetWorth = Object.values(players).map(p => {
    let stockValue = 0;
    if (portfolio[p.id]) {
      Object.entries(portfolio[p.id]).forEach(([cid, count]) => {
        stockValue += (companies[cid].price * count);
      });
    }
    return {
      ...p,
      netWorth: p.cash + stockValue,
      stockValue
    };
  });

  return (
    <Card className="p-0 overflow-hidden">
      <div className="bg-slate-100 p-3 font-semibold text-slate-700 border-b">Player Standings</div>
      <div className="divide-y">
        {playersWithNetWorth.sort((a, b) => b.cash - a.cash).map(p => (
          <div 
            key={p.id} 
            className={`p-4 flex justify-between items-center ${p.id === currentTurnPlayerId ? 'bg-yellow-50' : ''}`}
          >
            <div>
              <div className="font-bold text-slate-800 flex items-center gap-2">
                {p.name}
                {p.id === currentTurnPlayerId && <Activity size={14} className="text-orange-500" />}
              </div>
              <div className="text-xs text-slate-500">Cash: ${p.cash.toFixed(0)}</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-slate-900">${p.netWorth.toFixed(0)}</div>
              <div className="text-xs text-slate-400">Net Worth</div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
