import { Briefcase } from 'lucide-react';
import { Card } from './ui/Card';

export const PlayerPortfolio = ({ portfolio, companies }) => {
  const portfolioEntries = Object.entries(portfolio || {}).filter(([_, shares]) => shares > 0);
  
  return (
    <Card className="p-0 overflow-hidden">
      <div className="bg-slate-100 p-3 font-semibold text-slate-700 border-b flex items-center gap-2">
        <Briefcase size={16} />
        Your Portfolio
      </div>
      {portfolioEntries.length === 0 ? (
        <div className="p-4 text-center text-slate-400 text-sm">
          No shares owned yet
        </div>
      ) : (
        <div className="divide-y">
          {portfolioEntries.map(([companyId, shares]) => {
            const company = companies[companyId];
            const totalValue = shares * company.price;
            return (
              <div key={companyId} className="p-3 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded ${company.color}`}></div>
                  <div>
                    <div className="font-bold text-sm">{company.id}</div>
                    <div className="text-xs text-slate-500">{company.name}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-sm">{shares} shares</div>
                  <div className="text-xs text-slate-500">${totalValue} value</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};
