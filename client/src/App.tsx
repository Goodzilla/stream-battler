import { useState, useEffect, useRef } from 'react';
import { Auth } from './pages/Auth';
import { Dashboard } from './pages/Dashboard';
import { SoloMap } from './pages/SoloMap';
import { StreamerLobby } from './pages/StreamerLobby';
import { ViewerSpectate } from './pages/ViewerSpectate';
import { Leaderboard } from './pages/Leaderboard';
import { apiFetch } from './utils/api';
import { io, Socket } from 'socket.io-client';
import { CLASSES } from 'shared';
import { Zap } from 'lucide-react';
import confetti from 'canvas-confetti';
import { CharacterVisualizer } from './components/CharacterVisualizer';
import { AlertModal } from './components/AlertModal';
import { ConfirmModal } from './components/ConfirmModal';

type PageState = 'AUTH' | 'DASHBOARD' | 'SOLO_ARENA' | 'STREAMER_LOBBY' | 'VIEWER_LOBBY' | 'LEADERBOARD';

export default function App() {
  const [page, setPage] = useState<PageState>('AUTH');
  const [user, setUser] = useState<any | null>(null);
  const [character, setCharacter] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);
  
  // Navigation parameter holders
  const [navigationParams, setNavigationParams] = useState<any>(null);

  // Alert Modal State
  const [alertConfig, setAlertConfig] = useState<{ title: string; message: string } | null>(null);

  const showAlert = (message: string, title = 'ALERT') => {
    setAlertConfig({ title, message });
  };

  // Confirm Modal State
  const [confirmConfig, setConfirmConfig] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const showConfirm = (message: string, onConfirm: () => void, title = 'CONFIRM') => {
    setConfirmConfig({ title, message, onConfirm });
  };

  // Unlock Modal State
  const [unlockedClassesToShow, setUnlockedClassesToShow] = useState<string[]>([]);
  const [currentUnlockIdx, setCurrentUnlockIdx] = useState<number>(0);
  const prevUnlockedRef = useRef<string[] | null>(null);

  const CLASS_UNLOCK_REQUIREMENTS: Record<string, string> = {
    VALKYRIE: 'WARRIOR',
    NECROMANCER: 'MAGE',
    MONK: 'CLERIC',
    ALCHEMIST: 'ROGUE',
    BARD: 'RANGER'
  };

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

  // Check auth on load
  const checkAuth = async () => {
    try {
      const data = await apiFetch('/auth/me');
      if (data.authenticated) {
        setUser(data.user);
        setCharacter(data.character);
        setPage('DASHBOARD');
      } else {
        setPage('AUTH');
      }
    } catch (err) {
      setPage('AUTH');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  // Establish socket connection when user logged in
  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const socketUrl = window.location.hostname === 'localhost' ? 'http://localhost:3001' : window.location.origin;
    const socketConn = io(socketUrl, {
      withCredentials: true
    });

    setSocket(socketConn);

    return () => {
      socketConn.disconnect();
    };
  }, [user]);

  // Register user room inside socket
  useEffect(() => {
    if (socket && character) {
      socket.emit('register-user', character.userId);
    }
  }, [socket, character]);

  // Listen to boot events
  useEffect(() => {
    if (!socket) return;
    socket.on('boot-from-solo-arena', () => {
      if (page === 'SOLO_ARENA') {
        setPage('DASHBOARD');
        showAlert('You joined a streamer raid and were booted from your solo arena run.', 'RAID JOINED');
      }
    });
    return () => {
      socket.off('boot-from-solo-arena');
    };
  }, [socket, page]);

  const handleLoginSuccess = (loggedInUser: any, char: any) => {
    setUser(loggedInUser);
    setCharacter(char);
    setPage('DASHBOARD');
  };

  const handleLogout = async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
      setUser(null);
      setCharacter(null);
      setPage('AUTH');
    } catch (err) {
      console.error(err);
    }
  };

  const handleNavigate = (targetPage: string, params: any = null) => {
    setNavigationParams(params);
    setPage(targetPage.toUpperCase().replace(/-/g, '_') as PageState);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07090e] flex items-center justify-center font-display text-xs tracking-widest text-slate-500">
        LOADING BATTLER INTERFACE...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between">
      {/* Header Bar */}
      <header className="px-6 py-4 bg-[#0a0d17]/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between select-none">
        <div 
          onClick={() => user && setPage('DASHBOARD')}
          className="font-display font-black text-white text-lg tracking-wider cursor-pointer hover:opacity-80"
        >
          STREAM <span className="text-neon-cyan">BATTLER</span>
        </div>
        <div className="text-[10px] text-slate-600 font-display uppercase tracking-wider">
          v1.0.0-Beta
        </div>
      </header>

      {/* Main viewport */}
      <main className="flex-1 w-full relative">
        {page === 'AUTH' && (
          <Auth onLoginSuccess={handleLoginSuccess} />
        )}
        
        {page === 'DASHBOARD' && character && (
          <Dashboard
            user={user}
            character={character}
            onUpdateCharacter={setCharacter}
            onLogout={handleLogout}
            onNavigate={handleNavigate}
            showAlert={showAlert}
            showConfirm={showConfirm}
          />
        )}

        {page === 'SOLO_ARENA' && character && (
          <SoloMap
            character={character}
            mapLevel={navigationParams?.mapLevel || 1}
            onUpdateCharacter={setCharacter}
            onBackToDashboard={() => setPage('DASHBOARD')}
            showAlert={showAlert}
          />
        )}

        {page === 'STREAMER_LOBBY' && (
          <StreamerLobby
            user={user}
            bossName={navigationParams?.bossName || 'Neon Goliath'}
            bossLevel={navigationParams?.bossLevel || 5}
            socket={socket}
            onBackToDashboard={() => setPage('DASHBOARD')}
            showAlert={showAlert}
          />
        )}

        {page === 'VIEWER_LOBBY' && (
          <ViewerSpectate
            user={user}
            streamerName={navigationParams?.streamerName}
            socket={socket}
            onBackToDashboard={() => setPage('DASHBOARD')}
            showAlert={showAlert}
          />
        )}

        {page === 'LEADERBOARD' && (
          <Leaderboard
            onBackToDashboard={() => setPage('DASHBOARD')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="py-4 border-t border-white/5 text-center text-[10px] text-slate-600 font-display select-none">
        @Heikob on twitch
      </footer>

      {/* Fullscreen class unlock modal */}
      {unlockedClassesToShow.length > 0 && (() => {
        const classKey = unlockedClassesToShow[currentUnlockIdx];
        const config = CLASSES[classKey];
        if (!config) return null;

        const baseClassKey = CLASS_UNLOCK_REQUIREMENTS[classKey];
        const baseClassName = CLASSES[baseClassKey]?.name || baseClassKey;

        return (
          <div className="fixed inset-0 bg-[#04060d]/95 backdrop-blur-md flex items-center justify-center z-[9999] p-4 animate-fadeIn">
            <div 
              className="glass-panel p-8 rounded-3xl text-center flex flex-col items-center max-w-md w-full relative border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] animate-scaleUp"
              style={{
                borderColor: `${config.color}33`,
                boxShadow: `0 0 40px ${config.color}22`
              }}
            >
              <div className="absolute -top-12 w-24 h-24 rounded-full bg-gradient-to-b from-[#111827] to-[#030712] border flex items-center justify-center shadow-xl" style={{ borderColor: config.color }}>
                <Zap className="w-10 h-10 animate-bounce" style={{ color: config.color }} />
              </div>

              <h2 className="text-xl font-black text-white mt-12 mb-2 tracking-widest font-display uppercase" style={{ color: config.color }}>
                Class Unlocked!
              </h2>
              <div className="text-[9px] font-pixel text-slate-500 uppercase tracking-widest mb-6">
                [ Advanced Progression Tier ]
              </div>

              <div className="my-2 select-none pointer-events-none">
                <CharacterVisualizer charClass={classKey} equippedItems={[]} />
              </div>

              <h3 className="text-base font-bold text-white mt-4 mb-2 font-display">{config.name}</h3>
              
              <p className="text-xs text-slate-400 leading-relaxed mb-6 px-2">
                Congratulations! Reaching Level 100 with your <span className="text-white font-bold">{baseClassName}</span> has unlocked the <span className="font-bold" style={{ color: config.color }}>{config.name}</span> advanced class.
                <br />
                <span className="text-[10px] text-slate-500 font-mono mt-2 block">
                  Active Ability: <span className="text-white">{config.activeSkill.name}</span>
                  <br />
                  {config.activeSkill.description}
                </span>
              </p>

              <button
                onClick={handleNextUnlock}
                className="w-full py-3 rounded-xl text-xs font-display font-bold uppercase tracking-widest text-black transition-all duration-300 hover:scale-[1.03] active:scale-[0.98]"
                style={{ 
                  backgroundColor: config.color,
                  boxShadow: `0 4px 15px ${config.color}55`
                }}
              >
                {currentUnlockIdx < unlockedClassesToShow.length - 1 ? 'Next Unlock' : 'Claim & Continue'}
              </button>
            </div>
          </div>
        );
      })()}

      {alertConfig && (
        <AlertModal
          title={alertConfig.title}
          message={alertConfig.message}
          onClose={() => setAlertConfig(null)}
        />
      )}

      {confirmConfig && (
        <ConfirmModal
          title={confirmConfig.title}
          message={confirmConfig.message}
          onConfirm={() => {
            confirmConfig.onConfirm();
            setConfirmConfig(null);
          }}
          onCancel={() => setConfirmConfig(null)}
        />
      )}
    </div>
  );
}
