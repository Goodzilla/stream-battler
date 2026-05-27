import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { apiFetch } from '../utils/api';
import confetti from 'canvas-confetti';

interface AuthContextType {
  user: any | null;
  character: any | null;
  loading: boolean;
  unlockedClassesToShow: string[];
  currentUnlockIdx: number;
  login: (username: string) => Promise<void>;
  logout: () => Promise<void>;
  updateCharacter: (char: any) => void;
  checkAuth: () => Promise<void>;
  handleNextUnlock: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const CLASS_UNLOCK_REQUIREMENTS: Record<string, string> = {
  VALKYRIE: 'WARRIOR',
  NECROMANCER: 'MAGE',
  MONK: 'CLERIC',
  ALCHEMIST: 'ROGUE',
  BARD: 'RANGER'
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [character, setCharacter] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [unlockedClassesToShow, setUnlockedClassesToShow] = useState<string[]>([]);
  const [currentUnlockIdx, setCurrentUnlockIdx] = useState<number>(0);
  const prevUnlockedRef = useRef<string[] | null>(null);

  const getUnlockedAdvancedClasses = (characters: any[]): string[] => {
    const unlocked: string[] = [];
    for (const [adv, base] of Object.entries(CLASS_UNLOCK_REQUIREMENTS)) {
      const baseChar = characters?.find((c: any) => c.class === base);
      if (baseChar && baseChar.level >= 100) {
        unlocked.push(adv);
      }
    }
    return unlocked;
  };

  const triggerUnlockConfetti = () => {
    const duration = 2.5 * 1000;
    const end = Date.now() + duration;

    (function frame() {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.8 }
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.8 }
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  };

  // Monitor class unlocks
  useEffect(() => {
    if (character && character.user && character.user.characters) {
      const currentUnlocked = getUnlockedAdvancedClasses(character.user.characters);
      
      if (prevUnlockedRef.current !== null) {
        const newlyUnlocked = currentUnlocked.filter(c => !prevUnlockedRef.current!.includes(c));
        if (newlyUnlocked.length > 0) {
          setUnlockedClassesToShow(newlyUnlocked);
          setCurrentUnlockIdx(0);
          setTimeout(() => triggerUnlockConfetti(), 300);
        }
      }
      
      prevUnlockedRef.current = currentUnlocked;
    } else {
      prevUnlockedRef.current = null;
    }
  }, [character]);

  const handleNextUnlock = () => {
    if (currentUnlockIdx < unlockedClassesToShow.length - 1) {
      setCurrentUnlockIdx(currentUnlockIdx + 1);
      setTimeout(() => triggerUnlockConfetti(), 300);
    } else {
      setUnlockedClassesToShow([]);
      setCurrentUnlockIdx(0);
    }
  };

  const checkAuth = async () => {
    try {
      const data = await apiFetch('/auth/me');
      if (data.authenticated) {
        setUser(data.user);
        setCharacter(data.character);
      } else {
        setUser(null);
        setCharacter(null);
      }
    } catch (err) {
      setUser(null);
      setCharacter(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string) => {
    const data = await apiFetch('/auth/dev-login', {
      method: 'POST',
      body: JSON.stringify({ username })
    });
    setUser(data.user);
    setCharacter(data.character);
  };

  const logout = async () => {
    await apiFetch('/auth/logout', { method: 'POST' });
    setUser(null);
    setCharacter(null);
  };

  const updateCharacter = (char: any) => {
    setCharacter(char);
    if (char && char.user) {
      setUser(char.user);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        character,
        loading,
        unlockedClassesToShow,
        currentUnlockIdx,
        login,
        logout,
        updateCharacter,
        checkAuth,
        handleNextUnlock
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
