import { GameHeader } from '../components/GameHeader';
import { TurnIndicator } from '../components/TurnIndicator';
import { CompanyCard } from '../components/CompanyCard';
import { OperatingDesk } from '../components/OperatingDesk';
import { TransactionLog } from '../components/TransactionLog';
import { PlayerInfo } from '../components/PlayerInfo';
import { PlayerPortfolio } from '../components/PlayerPortfolio';
import { PlayerStandings } from '../components/PlayerStandings';

export const GamePage = ({ 
  gameId, 
  gameState, 
  user, 
  isMyTurn, 
  isOperatingRound,
  isStockRound,
  activeCompany,
  actionInProgress,
  onLogout,
  onPassTurn,
  onBuyShare,
  onUpgradeTrack,
  onFinishOperation
}) => {
  const currentPlayer = gameState.players[user.uid];
  const activeCompanyId = isOperatingRound ? gameState.operatingQueue[gameState.operatingCompanyIdx] : null;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans flex flex-col">
      <GameHeader 
        gameId={gameId}
        roundNumber={gameState.roundNumber}
        phase={gameState.phase}
        onLogout={onLogout}
      />

      <main className="flex-1 overflow-auto p-4 md:p-6 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <TurnIndicator 
            isMyTurn={isMyTurn}
            isOperatingRound={isOperatingRound}
            activeCompanyName={activeCompany?.name}
            currentPlayerName={gameState.players[gameState.turnPlayerId]?.name}
            isStockRound={isStockRound}
            actionInProgress={actionInProgress}
            onPassTurn={onPassTurn}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.values(gameState.companies)
              .sort((a, b) => a.id.localeCompare(b.id))
              .map(company => (
              <CompanyCard 
                key={company.id}
                company={company}
                isMyTurn={isMyTurn}
                isStockRound={isStockRound}
                playerCash={currentPlayer.cash}
                actionInProgress={actionInProgress}
                onBuyShare={onBuyShare}
              />
            ))}
          </div>

          {isMyTurn && isOperatingRound && activeCompany && (
            <OperatingDesk 
              company={activeCompany}
              actionInProgress={actionInProgress}
              onUpgradeTrack={onUpgradeTrack}
              onFinishOperation={onFinishOperation}
            />
          )}

          <TransactionLog logs={gameState.logs} />
        </div>

        <div className="space-y-6">
          <PlayerInfo 
            player={currentPlayer}
            portfolio={gameState.portfolio[user.uid]}
          />

          <PlayerPortfolio 
            portfolio={gameState.portfolio[user.uid]}
            companies={gameState.companies}
          />

          <PlayerStandings 
            players={gameState.players}
            portfolio={gameState.portfolio}
            companies={gameState.companies}
            currentTurnPlayerId={gameState.turnPlayerId}
          />
        </div>
      </main>
    </div>
  );
};
