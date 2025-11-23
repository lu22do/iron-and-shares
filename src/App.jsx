import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged,
  signInWithCustomToken,
  signOut
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs,
  onSnapshot, 
  updateDoc, 
  arrayUnion, 
  increment, 
  runTransaction 
} from 'firebase/firestore';
import { 
  Train, 
  DollarSign, 
  TrendingUp, 
  Users, 
  Play, 
  Activity, 
  Briefcase, 
  AlertCircle, 
  ChevronsUp,
  RefreshCw,
  Search,
  LogOut,
  Copy,
  Info
} from 'lucide-react';

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'iron-and-shares';

// --- Game Constants & Types ---
const COMPANIES_CONFIG = [
  { id: 'PRR', name: 'Pennsylvania RR', color: 'bg-red-700', text: 'text-red-100', price: 67 },
  { id: 'NYC', name: 'New York Central', color: 'bg-slate-800', text: 'text-slate-100', price: 67 },
  { id: 'B&O', name: 'Baltimore & Ohio', color: 'bg-blue-700', text: 'text-blue-100', price: 67 },
  { id: 'C&O', name: 'Chesapeake & Ohio', color: 'bg-yellow-600', text: 'text-yellow-900', price: 67 },
];

const INITIAL_CASH = 600;

// --- Components ---

const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-lg shadow-md border border-slate-200 overflow-hidden ${className}`}>
    {children}
  </div>
);

const Button = ({ onClick, disabled, children, variant = 'primary', className = "" }) => {
  const base = "px-4 py-2 rounded font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 flex items-center justify-center gap-2";
  const variants = {
    primary: "bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-300",
    secondary: "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 disabled:bg-slate-100 disabled:text-slate-400",
    success: "bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-emerald-300",
    danger: "bg-rose-600 text-white hover:bg-rose-700 disabled:bg-rose-300",
    ghost: "bg-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100"
  };
  return (
    <button 
      onClick={onClick} 
      disabled={disabled} 
      className={`${base} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

export default function IronAndSharesApp() {
  // --- State ---
  const [user, setUser] = useState(null);
  
  const [gameId, setGameId] = useState("");
  const [joinInput, setJoinInput] = useState(""); 
  
  const [playerName, setPlayerName] = useState("");
  const [gameState, setGameState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // New state for game browser
  const [availableGames, setAvailableGames] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // --- Auth & Init ---
  useEffect(() => {
    console.log("Initializing Auth...");
    const initAuth = async () => {
      // Only attempt auto-sign-in if we aren't already signed in
      if (!auth.currentUser) {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
            try {
               await signInWithCustomToken(auth, __initial_auth_token);
            } catch (e) {
               console.error("Custom token failed, falling back to anon", e);
               await signInAnonymously(auth);
            }
        } else {
            await signInAnonymously(auth);
        }
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => {
        setUser(u);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
      await signOut(auth);
      setGameState(null);
      setGameId("");
      // Force re-login as anonymous to get a new ID (if not using custom token)
      await signInAnonymously(auth);
  };

  // --- Game Browser ---
  const fetchGames = async () => {
      setRefreshing(true);
      try {
          const querySnapshot = await getDocs(collection(db, 'artifacts', appId, 'public', 'data', 'games'));
          const games = [];
          querySnapshot.forEach((doc) => {
              const data = doc.data();
              if (data.phase === 'LOBBY') {
                  games.push(data);
              }
          });
          setAvailableGames(games);
      } catch (e) {
          console.error("Error fetching games:", e);
      }
      setRefreshing(false);
  };

  useEffect(() => {
      if (user && !gameState) {
          fetchGames();
      }
  }, [user, gameState]);


  // --- Game Sync ---
  useEffect(() => {
    if (!user || !gameId) return;

    const gameRef = doc(db, 'artifacts', appId, 'public', 'data', 'games', gameId);
    
    const unsubscribe = onSnapshot(gameRef, (docSnap) => {
      if (docSnap.exists()) {
        setGameState(docSnap.data());
        setError(""); 
      } else {
        if (!loading) setError("Game not found.");
      }
    }, (err) => {
      console.error("Snapshot error:", err);
      setError("Error connecting to game: " + err.message);
    });

    return () => unsubscribe();
  }, [user, gameId, loading]);

  // --- Helpers ---
  const getPresident = (companyId, players, portfolio) => {
    let maxShares = 0;
    let presidentId = null;
    Object.keys(players).forEach(pid => {
      const count = portfolio[pid]?.[companyId] || 0;
      if (count > maxShares) {
        maxShares = count;
        presidentId = pid;
      }
    });
    return presidentId;
  };

  const isMyTurn = gameState && gameState.turnPlayerId === user?.uid;
  const isOperatingRound = gameState?.phase === 'OPERATING';
  const isStockRound = gameState?.phase === 'STOCK';

  // --- Actions ---

  const createGame = async () => {
    if (!playerName) return setError("Please enter a name");
    setLoading(true);
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

    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'games', newGameId), gameData);
      setGameId(newGameId); 
    } catch (e) {
      console.error("Error creating game:", e);
      setError("Failed to create game: " + e.message);
    }
    setLoading(false);
  };

  const joinGame = async (targetIdInput) => {
    const targetId = targetIdInput || joinInput;
    
    if (!targetId || !playerName) return setError("Enter Game ID and Name");
    setLoading(true);
    const targetGameId = targetId.trim().toUpperCase();
    const gameRef = doc(db, 'artifacts', appId, 'public', 'data', 'games', targetGameId);
    
    try {
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
      setError("");
      setGameId(targetGameId);
    } catch (e) {
      console.error("Join transaction failed:", e);
      setError(e.toString());
    }
    setLoading(false);
  };

  const startGame = async () => {
    const gameRef = doc(db, 'artifacts', appId, 'public', 'data', 'games', gameId);
    try {
        await updateDoc(gameRef, {
            phase: 'STOCK',
            logs: arrayUnion("Game Started! Stock Round 1.")
        });
    } catch (e) { console.error(e); }
  };

  const buyShare = async (companyId) => {
    if (!isMyTurn || gameState.phase !== 'STOCK') return;

    const gameRef = doc(db, 'artifacts', appId, 'public', 'data', 'games', gameId);
    const company = gameState.companies[companyId];
    const player = gameState.players[user.uid];

    if (player.cash < company.price) return alert("Not enough cash");
    if (company.sharesSold >= 10) return alert("All shares sold");

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

  const passTurn = async () => {
    if (!isMyTurn) return;
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
            logs: arrayUnion("Stock Round ended. Operating Round begins.")
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

  const upgradeTrack = async () => {
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

  const finishOperation = async (payout) => {
    const companyId = gameState.operatingQueue[gameState.operatingCompanyIdx];
    const company = gameState.companies[companyId];
    const revenue = company.trackLevel * 30; 
    const gameRef = doc(db, 'artifacts', appId, 'public', 'data', 'games', gameId);

    let updates = {};
    let logMsg = "";

    if (payout === 'WITHHOLD') {
        updates[`companies.${companyId}.treasury`] = increment(revenue);
        updates[`companies.${companyId}.price`] = increment(revenue > 0 ? -5 : 0);
        if (company.price - 5 < 10) updates[`companies.${companyId}.price`] = 10;
        logMsg = `${companyId} withheld $${revenue}. Stock drops.`;
    } else {
        const perShare = revenue / 10;
        Object.keys(gameState.players).forEach(pid => {
            const shares = gameState.portfolio[pid]?.[companyId] || 0;
            if (shares > 0) updates[`players.${pid}.cash`] = increment(shares * perShare);
        });
        updates[`companies.${companyId}.price`] = increment(10);
        logMsg = `${companyId} paid dividends ($${revenue}). Stock rises.`;
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


  // --- Render ---

  if (!user) return <div className="p-10 text-center animate-pulse">Connecting to server...</div>;

  if (!gameState) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center font-sans p-4">
        <Card className="w-full max-w-lg p-6 relative">
          <div className="absolute top-4 right-4">
              <Button variant="ghost" onClick={handleLogout} title="Reset User Identity">
                  <LogOut size={16} />
              </Button>
          </div>
          
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-slate-800 flex items-center justify-center gap-2">
              <Train className="w-8 h-8" /> Iron & Shares
            </h1>
            <p className="text-slate-500">1830-style Strategy Light</p>
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
                 onClick={createGame} 
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
                        onClick={() => joinGame()} 
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
                                    onClick={() => joinGame(g.id)} 
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
  }

  // --- Main Game View ---
  if (gameState.phase === 'LOBBY') {
    return (
      <div className="min-h-screen bg-slate-100 p-8 font-sans">
        <Card className="max-w-2xl mx-auto p-6 text-center relative">
             <div className="absolute top-4 right-4">
                <Button variant="ghost" onClick={handleLogout} title="Leave Game">
                    <LogOut size={16} />
                </Button>
            </div>

            <h1 className="text-2xl font-bold mb-4">Lobby: {gameId}</h1>
            <div className="mb-6">
                <p className="text-slate-500 mb-2">Share this Game ID:</p>
                <div className="flex items-center justify-center gap-2">
                    <div className="bg-slate-100 p-3 rounded text-xl font-mono tracking-widest select-all inline-block border border-slate-300">
                        {gameId}
                    </div>
                </div>
            </div>
            
            <div className="mb-8">
                <h3 className="font-semibold text-slate-700 mb-3">Players Joined:</h3>
                <div className="flex flex-wrap gap-2 justify-center">
                    {Object.values(gameState.players).map(p => (
                        <span key={p.id} className="px-4 py-2 bg-slate-800 text-white rounded-full flex items-center gap-2">
                            <Users size={16} /> {p.name}
                        </span>
                    ))}
                </div>
            </div>

            {user.uid === gameState.hostId ? (
                <Button onClick={startGame} className="w-full py-4 text-lg">Start Game</Button>
            ) : (
                <div className="text-slate-500 italic animate-pulse">Waiting for host to start...</div>
            )}
        </Card>
      </div>
    );
  }

  const activeCompanyId = isOperatingRound ? gameState.operatingQueue[gameState.operatingCompanyIdx] : null;
  const activeCompany = activeCompanyId ? gameState.companies[activeCompanyId] : null;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans flex flex-col">
      <header className="bg-slate-900 text-white p-4 shadow-lg flex justify-between items-center">
        <div className="flex items-center gap-3">
            <Train className="text-yellow-500" />
            <div>
                <h1 className="font-bold text-lg leading-tight">Iron & Shares</h1>
                <div className="text-xs text-slate-400">Game: {gameId} • Round {gameState.roundNumber}</div>
            </div>
        </div>
        <div className="flex items-center gap-4">
            <div className={`px-3 py-1 rounded text-sm font-bold ${gameState.phase === 'STOCK' ? 'bg-emerald-500 text-emerald-900' : 'bg-orange-500 text-orange-900'}`}>
                {gameState.phase} ROUND
            </div>
            <Button variant="ghost" onClick={handleLogout} className="text-slate-400 hover:text-white">
                <LogOut size={16} />
            </Button>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-4 md:p-6 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
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
                                ? `Operating: ${gameState.companies[activeCompanyId].name}` 
                                : gameState.players[gameState.turnPlayerId]?.name}
                        </div>
                    </div>
                </div>
                {isMyTurn && gameState.phase === 'STOCK' && (
                     <Button variant="secondary" onClick={passTurn}>Pass Turn</Button>
                )}
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.values(gameState.companies).map(company => (
                    <Card key={company.id} className="relative">
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

                            {isMyTurn && gameState.phase === 'STOCK' && (
                                <Button 
                                    onClick={() => buyShare(company.id)}
                                    disabled={company.sharesSold >= 10 || gameState.players[user.uid].cash < company.price}
                                    className="w-full mt-2"
                                >
                                    Buy Share (${company.price})
                                </Button>
                            )}
                        </div>
                    </Card>
                ))}
            </div>

            {isMyTurn && isOperatingRound && activeCompany && (
                <Card className="border-2 border-orange-400 shadow-xl">
                    <div className="bg-orange-100 p-3 border-b border-orange-200 flex items-center gap-2 text-orange-800 font-bold">
                        <Briefcase size={20} /> President's Desk: {activeCompany.name}
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h4 className="font-semibold text-slate-700">1. Infrastructure</h4>
                            <div className="bg-slate-50 p-4 rounded border">
                                <div className="text-sm text-slate-500 mb-2">Upgrade Track Level to increase revenue.</div>
                                <div className="flex justify-between items-center mb-4">
                                    <span className="font-bold">Cost: ${(activeCompany.trackLevel + 1) * 20}</span>
                                    <span className="text-emerald-600 font-bold">+${30} Revenue</span>
                                </div>
                                <Button 
                                    onClick={upgradeTrack} 
                                    disabled={activeCompany.treasury < (activeCompany.trackLevel + 1) * 20}
                                    className="w-full"
                                >
                                    Build Track
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="font-semibold text-slate-700">2. Dividends & Revenue</h4>
                             <div className="bg-slate-50 p-4 rounded border">
                                <div className="text-sm text-slate-500 mb-2">Current Revenue: <span className="font-bold text-slate-900">${activeCompany.trackLevel * 30}</span></div>
                                <div className="grid grid-cols-2 gap-3">
                                    <Button onClick={() => finishOperation('WITHHOLD')} variant="secondary" className="text-sm">
                                        Withhold
                                    </Button>
                                    <Button onClick={() => finishOperation('DIVIDEND')} variant="success" className="text-sm">
                                        Pay Out
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>
            )}

            <Card className="bg-slate-50 h-48 overflow-auto p-4 font-mono text-sm text-slate-600">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Transaction Log</h4>
                <div className="flex flex-col-reverse">
                    {gameState.logs.slice().reverse().map((log, i) => (
                        <div key={i} className="border-b border-slate-100 py-1">{log}</div>
                    ))}
                </div>
            </Card>

        </div>

        <div className="space-y-6">
            <Card className="bg-slate-900 text-white p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-slate-700 rounded-full">
                        <Users size={20} />
                    </div>
                    <div>
                        <div className="text-sm text-slate-400">You are</div>
                        <div className="font-bold text-xl">{gameState.players[user.uid].name}</div>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="bg-slate-800 p-3 rounded">
                        <div className="text-xs text-slate-400 uppercase">Cash</div>
                        <div className="text-2xl text-emerald-400 font-mono">${gameState.players[user.uid].cash.toFixed(0)}</div>
                    </div>
                    <div className="bg-slate-800 p-3 rounded">
                        <div className="text-xs text-slate-400 uppercase">Shares</div>
                        <div className="text-2xl font-mono">{
                            Object.values(gameState.portfolio[user.uid] || {}).reduce((a,b) => a+b, 0)
                        }</div>
                    </div>
                </div>
            </Card>

            <Card className="p-0 overflow-hidden">
                <div className="bg-slate-100 p-3 font-semibold text-slate-700 border-b">Player Standings</div>
                <div className="divide-y">
                    {Object.values(gameState.players).sort((a,b) => b.cash - a.cash).map(p => {
                         let stockValue = 0;
                         if (gameState.portfolio[p.id]) {
                             Object.entries(gameState.portfolio[p.id]).forEach(([cid, count]) => {
                                 stockValue += (gameState.companies[cid].price * count);
                             });
                         }
                         const netWorth = p.cash + stockValue;
                         return (
                            <div key={p.id} className={`p-4 flex justify-between items-center ${p.id === gameState.turnPlayerId ? 'bg-yellow-50' : ''}`}>
                                <div>
                                    <div className="font-bold text-slate-800 flex items-center gap-2">
                                        {p.name}
                                        {p.id === gameState.turnPlayerId && <Activity size={14} className="text-orange-500" />}
                                    </div>
                                    <div className="text-xs text-slate-500">Cash: ${p.cash.toFixed(0)}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-bold text-slate-900">${netWorth.toFixed(0)}</div>
                                    <div className="text-xs text-slate-400">Net Worth</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Card>
        </div>
      </main>
    </div>
  );
}