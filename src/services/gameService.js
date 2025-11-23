import { 
  doc, 
  setDoc, 
  updateDoc, 
  arrayUnion, 
  increment, 
  runTransaction,
  collection,
  getDocs
} from 'firebase/firestore';
import { db, appId } from '../config/firebase';
import { COMPANIES_CONFIG, INITIAL_CASH } from '../config/constants';

export const createGame = async (user, playerName) => {
  const newGameId = Math.random().toString(36).substring(2, 8).toUpperCase();

  const initialCompanies = {};
  COMPANIES_CONFIG.forEach(c => {
    initialCompanies[c.id] = { ...c, treasury: 0, sharesSold: 0, trackLevel: 1, stations: 0, lastRun: 0 };
  });

  const gameData = {
    id: newGameId,
    hostId: user.uid,
    phase: 'LOBBY',
    turnPlayerId: user.uid,
    roundNumber: 1,
    operatingCompanyIdx: 0,
    passedPlayers: 0,
    players: {
      [user.uid]: {
        id: user.uid,
        name: playerName,
        cash: INITIAL_CASH,
        netWorth: INITIAL_CASH,
      }
    },
    playerOrder: [user.uid],
    companies: initialCompanies,
    portfolio: { [user.uid]: {} },
    logs: [`Game created by ${playerName}.`]
  };

  await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'games', newGameId), gameData);
  return newGameId;
};

export const joinGame = async (user, playerName, targetGameId) => {
  const gameRef = doc(db, 'artifacts', appId, 'public', 'data', 'games', targetGameId);
  
  await runTransaction(db, async (transaction) => {
    const gameDoc = await transaction.get(gameRef);
    if (!gameDoc.exists()) throw "Game doc does not exist. Check ID or App Universe.";
    const data = gameDoc.data();
    if (data.phase !== 'LOBBY') throw "Game already started";
    
    if (!data.players[user.uid]) {
      transaction.update(gameRef, {
        [`players.${user.uid}`]: {
          id: user.uid,
          name: playerName,
          cash: INITIAL_CASH,
          netWorth: INITIAL_CASH,
        },
        playerOrder: arrayUnion(user.uid),
        logs: arrayUnion(`${playerName} joined the game.`)
      });
    }
  });
};

export const startGame = async (gameId) => {
  const gameRef = doc(db, 'artifacts', appId, 'public', 'data', 'games', gameId);
  await updateDoc(gameRef, {
    phase: 'STOCK',
    logs: arrayUnion("Game Started! Stock Trading Phase Round 1.")
  });
};

export const buyShare = async (gameId, user, companyId, gameState) => {
  const gameRef = doc(db, 'artifacts', appId, 'public', 'data', 'games', gameId);
  const company = gameState.companies[companyId];

  await runTransaction(db, async (t) => {
    const gDoc = await t.get(gameRef);
    const gData = gDoc.data();
    const nextPlayerIdx = (gData.playerOrder.indexOf(user.uid) + 1) % gData.playerOrder.length;
    
    t.update(gameRef, {
      [`players.${user.uid}.cash`]: increment(-company.price),
      [`companies.${companyId}.treasury`]: increment(company.price),
      [`companies.${companyId}.sharesSold`]: increment(1),
      [`portfolio.${user.uid}.${companyId}`]: increment(1),
      turnPlayerId: gData.playerOrder[nextPlayerIdx],
      passedPlayers: 0,
      logs: arrayUnion(`${gData.players[user.uid].name} bought a share of ${companyId} for $${company.price}.`)
    });
  });
};

export const passTurn = async (gameId, user, gameState, getPresident) => {
  const gameRef = doc(db, 'artifacts', appId, 'public', 'data', 'games', gameId);
  
  const nextPassedCount = gameState.passedPlayers + 1;
  const isRoundOver = nextPassedCount >= gameState.playerOrder.length;

  if (isRoundOver && gameState.phase === 'STOCK') {
    const sortedCompanies = Object.values(gameState.companies)
      .filter(c => c.sharesSold > 0)
      .sort((a, b) => b.price - a.price)
      .map(c => c.id);

    if (sortedCompanies.length === 0) {
      await updateDoc(gameRef, {
        passedPlayers: 0,
        roundNumber: increment(1),
        logs: arrayUnion("Operating Round skipped (no companies). Round " + (gameState.roundNumber + 1))
      });
      return;
    }

    await updateDoc(gameRef, {
      phase: 'OPERATING',
      operatingQueue: sortedCompanies,
      operatingCompanyIdx: 0,
      turnPlayerId: getPresident(sortedCompanies[0], gameState.players, gameState.portfolio),
      passedPlayers: 0,
      logs: arrayUnion("Stock Trading Phase ended. Company Operating Phase begins.")
    });
  } else {
    const nextPlayerIdx = (gameState.playerOrder.indexOf(user.uid) + 1) % gameState.playerOrder.length;
    await updateDoc(gameRef, {
      turnPlayerId: gameState.playerOrder[nextPlayerIdx],
      passedPlayers: increment(1),
      logs: arrayUnion(`${gameState.players[user.uid].name} passed.`)
    });
  }
};

export const upgradeTrack = async (gameId, gameState) => {
  const companyId = gameState.operatingQueue[gameState.operatingCompanyIdx];
  const company = gameState.companies[companyId];
  const cost = (company.trackLevel + 1) * 20;
  const gameRef = doc(db, 'artifacts', appId, 'public', 'data', 'games', gameId);
  
  await updateDoc(gameRef, {
    [`companies.${companyId}.treasury`]: increment(-cost),
    [`companies.${companyId}.trackLevel`]: increment(1),
    logs: arrayUnion(`${companyId} built track (Level ${company.trackLevel + 1}) for $${cost}.`)
  });
};

export const finishOperation = async (gameId, gameState, payout, getPresident) => {
  const companyId = gameState.operatingQueue[gameState.operatingCompanyIdx];
  const company = gameState.companies[companyId];
  const revenue = company.trackLevel * 30; 
  const gameRef = doc(db, 'artifacts', appId, 'public', 'data', 'games', gameId);

  let updates = {};
  let logMsg = "";

  if (payout === 'WITHHOLD') {
    updates[`companies.${companyId}.treasury`] = increment(revenue);
    const newPrice = Math.max(10, company.price - 5);
    updates[`companies.${companyId}.price`] = newPrice;
    logMsg = `${companyId} withheld $${revenue}. Stock drops to $${newPrice}.`;
  } else {
    const perShare = revenue / 10;
    Object.keys(gameState.players).forEach(pid => {
      const shares = gameState.portfolio[pid]?.[companyId] || 0;
      if (shares > 0) updates[`players.${pid}.cash`] = increment(shares * perShare);
    });
    const newPrice = company.price + 10;
    updates[`companies.${companyId}.price`] = newPrice;
    logMsg = `${companyId} paid dividends ($${revenue}). Stock rises to $${newPrice}.`;
  }

  const nextIdx = gameState.operatingCompanyIdx + 1;
  if (nextIdx >= gameState.operatingQueue.length) {
    updates['phase'] = 'STOCK';
    updates['roundNumber'] = increment(1);
    updates['passedPlayers'] = 0;
    updates['turnPlayerId'] = gameState.playerOrder[0]; 
    logMsg += " End of Operating Round.";
  } else {
    updates['operatingCompanyIdx'] = nextIdx;
    const nextCompanyId = gameState.operatingQueue[nextIdx];
    updates['turnPlayerId'] = getPresident(nextCompanyId, gameState.players, gameState.portfolio);
  }
  updates['logs'] = arrayUnion(logMsg);
  await updateDoc(gameRef, updates);
};

export const fetchAvailableGames = async () => {
  const querySnapshot = await getDocs(collection(db, 'artifacts', appId, 'public', 'data', 'games'));
  const games = [];
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    if (data.phase === 'LOBBY') {
      games.push(data);
    }
  });
  return games;
};
