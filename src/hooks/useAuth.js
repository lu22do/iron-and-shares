import { useState, useEffect } from 'react';
import { 
  signInAnonymously, 
  onAuthStateChanged,
  signInWithCustomToken,
  signOut
} from 'firebase/auth';
import { auth } from '../config/firebase';

export const useAuth = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    console.log("Initializing Auth...");
    const initAuth = async () => {
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
    await signInAnonymously(auth);
  };

  return { user, handleLogout };
};
