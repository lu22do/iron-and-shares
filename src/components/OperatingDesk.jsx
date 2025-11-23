import { Briefcase } from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';

export const OperatingDesk = ({ company, actionInProgress, onUpgradeTrack, onFinishOperation }) => {
  return (
    <Card className="border-2 border-orange-400 shadow-xl">
      <div className="bg-orange-100 p-3 border-b border-orange-200 flex items-center gap-2 text-orange-800 font-bold">
        <Briefcase size={20} /> President's Desk: {company.name}
      </div>
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="font-semibold text-slate-700">1. Infrastructure</h4>
          <div className="bg-slate-50 p-4 rounded border">
            <div className="text-sm text-slate-500 mb-2">Upgrade Track Level to increase revenue.</div>
            <div className="flex justify-between items-center mb-4">
              <span className="font-bold">Cost: ${(company.trackLevel + 1) * 20}</span>
              <span className="text-emerald-600 font-bold">+${30} Revenue</span>
            </div>
            <Button 
              onClick={onUpgradeTrack} 
              disabled={company.treasury < (company.trackLevel + 1) * 20 || actionInProgress}
              className="w-full"
            >
              Build Track
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-semibold text-slate-700">2. Dividends & Revenue</h4>
          <div className="bg-slate-50 p-4 rounded border">
            <div className="text-sm text-slate-500 mb-2">Current Revenue: <span className="font-bold text-slate-900">${company.trackLevel * 30}</span></div>
            <div className="grid grid-cols-2 gap-3">
              <Button onClick={() => onFinishOperation('WITHHOLD')} variant="secondary" className="text-sm" disabled={actionInProgress}>
                Withhold
              </Button>
              <Button onClick={() => onFinishOperation('DIVIDEND')} variant="success" className="text-sm" disabled={actionInProgress}>
                Pay Out <br/>(${(company.trackLevel * 30) / 10} per share)
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
