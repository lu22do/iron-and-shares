import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, appId } from '../config/firebase';

export const useGameSync = (user, gameId, loading) => {
  const [gameState, setGameState] = useState(null);
  const [error, setError] = useState("");

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

  return { gameState, error, setError };
};
