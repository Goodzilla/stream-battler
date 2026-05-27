import { useState, useEffect } from 'react';
import { Auth } from './pages/Auth';
import { Dashboard } from './pages/Dashboard';
import { SoloMap } from './pages/SoloMap';
import { StreamerLobby } from './pages/StreamerLobby';
import { ViewerSpectate } from './pages/ViewerSpectate';
import { Leaderboard } from './pages/Leaderboard';
import { apiFetch } from './utils/api';
import { io, Socket } from 'socket.io-client';

type PageState = 'AUTH' | 'DASHBOARD' | 'SOLO_ARENA' | 'STREAMER_LOBBY' | 'VIEWER_LOBBY' | 'LEADERBOARD';

export default function App() {
  const [page, setPage] = useState<PageState>('AUTH');
  const [user, setUser] = useState<any | null>(null);
  const [character, setCharacter] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);
  
  // Navigation parameter holders
  const [navigationParams, setNavigationParams] = useState<any>(null);

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
          />
        )}

        {page === 'SOLO_ARENA' && character && (
          <SoloMap
            character={character}
            mapLevel={navigationParams?.mapLevel || 1}
            onUpdateCharacter={setCharacter}
            onBackToDashboard={() => setPage('DASHBOARD')}
          />
        )}

        {page === 'STREAMER_LOBBY' && (
          <StreamerLobby
            user={user}
            bossName={navigationParams?.bossName || 'Neon Goliath'}
            bossLevel={navigationParams?.bossLevel || 5}
            socket={socket}
            onBackToDashboard={() => setPage('DASHBOARD')}
          />
        )}

        {page === 'VIEWER_LOBBY' && (
          <ViewerSpectate
            user={user}
            streamerName={navigationParams?.streamerName}
            socket={socket}
            onBackToDashboard={() => setPage('DASHBOARD')}
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
        © 2026 Antigravity Inc. All rights reserved.
      </footer>
    </div>
  );
}
