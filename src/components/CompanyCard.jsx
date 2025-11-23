import { ChevronsUp } from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';

export const CompanyCard = ({ company, isMyTurn, isStockRound, playerCash, actionInProgress, onBuyShare }) => {
  return (
    <Card className="relative">
      <div className={`${company.color} ${company.text} p-3 flex justify-between items-center`}>
        <h3 className="font-bold text-lg flex items-center gap-2">
          {company.name} <span className="opacity-75 text-sm">({company.id})</span>
        </h3>
        <div className="bg-white/20 px-2 py-1 rounded text-sm font-mono">
          ${company.price} / share
        </div>
      </div>
      <div className="p-4 space-y-3">
        <div className="flex justify-between text-sm border-b pb-2">
          <span className="text-slate-500">Treasury</span>
          <span className="font-mono font-bold">${company.treasury}</span>
        </div>
        <div className="flex justify-between text-sm border-b pb-2">
          <span className="text-slate-500">Track Level</span>
          <span className="font-bold flex items-center gap-1">
            <ChevronsUp size={14} className="text-emerald-600"/> {company.trackLevel} 
            <span className="text-xs text-slate-400 ml-1">(Rev: ${company.trackLevel * 30})</span>
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Shares Sold</span>
          <span>{company.sharesSold} / 10</span>
        </div>

        {isMyTurn && isStockRound && (
          <Button 
            onClick={() => onBuyShare(company.id)}
            disabled={company.sharesSold >= 10 || playerCash < company.price || actionInProgress}
            className="w-full mt-2"
          >
            Buy Share (${company.price})
          </Button>
        )}
      </div>
    </Card>
  );
};
