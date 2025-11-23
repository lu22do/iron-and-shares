import { Card } from './ui/Card';
import { Button } from './ui/Button';

export const TurnIndicator = ({ 
  isMyTurn, 
  isOperatingRound, 
  activeCompanyName, 
  currentPlayerName, 
  isStockRound,
  onPassTurn 
}) => {
  return (
    <Card className="p-4 bg-yellow-50 border-yellow-200 flex flex-col md:flex-row justify-between items-center gap-4">
      <div className="flex items-center gap-3">
        {isMyTurn ? (
          <div className="w-3 h-3 bg-green-500 rounded-full animate-ping"></div>
        ) : (
          <div className="w-3 h-3 bg-slate-300 rounded-full"></div>
        )}
        <div>
          <span className="text-sm text-slate-500 uppercase font-bold tracking-wider">Current Turn</span>
          <div className="text-xl font-bold">
            {isOperatingRound 
              ? `Operating: ${activeCompanyName}` 
              : currentPlayerName}
          </div>
        </div>
      </div>
      {isMyTurn && isStockRound && (
        <Button variant="secondary" onClick={onPassTurn}>Pass Turn</Button>
      )}
    </Card>
  );
};
