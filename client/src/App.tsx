import { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { Auth } from './pages/Auth';
import { Dashboard } from './pages/Dashboard';
import { SoloMap } from './pages/SoloMap';
import { StreamerLobby } from './pages/StreamerLobby';
import { ViewerSpectate } from './pages/ViewerSpectate';
import { Leaderboard } from './pages/Leaderboard';
import { useAuth } from './contexts/AuthContext';
import { useSocket } from './contexts/SocketContext';
import { useUI } from './contexts/UIContext';
import { CLASSES } from 'shared';
import { Zap } from 'lucide-react';
import { CharacterVisualizer } from './components/CharacterVisualizer';

const CLASS_UNLOCK_REQUIREMENTS: Record<string, string> = {
  VALKYRIE: 'WARRIOR',
  NECROMANCER: 'MAGE',
  MONK: 'CLERIC',
  ALCHEMIST: 'ROGUE',
  BARD: 'RANGER'
};

// Route wrapper for authenticated users
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  return <>{children}</>;
};

// Route wrapper for public pages (redirects logged-in users away from login)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
};

// Wrapper to parse parameters for SoloMap
const SoloMapWrapper = ({ checkAuth }: { checkAuth: () => void }) => {
  const { level } = useParams<{ level: string }>();
  const navigate = useNavigate();
  const { character } = useAuth();
  
  if (!character) return <Navigate to="/auth" replace />;
  
  return (
    <SoloMap
      mapLevel={Number(level) || 1}
      onBackToDashboard={() => {
        checkAuth();
        navigate('/dashboard');
      }}
    />
  );
};

// Wrapper to parse query params for StreamerLobby
const StreamerLobbyWrapper = ({ checkAuth }: { checkAuth: () => void }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const bossName = searchParams.get('bossName') || 'Neon Goliath';
  const bossLevel = Number(searchParams.get('bossLevel')) || 5;

  return (
    <StreamerLobby
      bossName={bossName}
      bossLevel={bossLevel}
      onBackToDashboard={() => {
        checkAuth();
        navigate('/dashboard');
      }}
    />
  );
};

// Wrapper to parse parameters for ViewerSpectate
const ViewerSpectateWrapper = ({ checkAuth }: { checkAuth: () => void }) => {
  const { streamerName } = useParams<{ streamerName: string }>();
  const navigate = useNavigate();

  return (
    <ViewerSpectate
      streamerName={streamerName}
      onBackToDashboard={() => {
        checkAuth();
        navigate('/dashboard');
      }}
    />
  );
};

export default function App() {
  const {
    user,
    character,
    loading,
    unlockedClassesToShow,
    currentUnlockIdx,
    checkAuth,
    updateCharacter,
    handleNextUnlock
  } = useAuth();

  const { socket } = useSocket();
  const { showAlert } = useUI();
  const navigate = useNavigate();
  const location = useLocation();

  // Listen to boot events and character updates from WebSocket
  useEffect(() => {
    if (!socket) return;
    
    socket.on('boot-from-solo-arena', () => {
      if (location.pathname.startsWith('/arena/play')) {
        navigate('/dashboard');
        showAlert('You joined a streamer raid and were booted from your solo arena run.', 'RAID JOINED');
      }
    });

    socket.on('character-updated', (updatedChar: any) => {
      updateCharacter(updatedChar);
    });

    return () => {
      socket.off('boot-from-solo-arena');
      socket.off('character-updated');
    };
  }, [socket, location.pathname]);

  const handleNavigate = (targetPage: string, params: any = null) => {
    const normalizedPage = targetPage.toUpperCase().replace(/-/g, '_');
    if (normalizedPage === 'LEADERBOARD') {
      navigate('/leaderboard');
    } else if (normalizedPage === 'SOLO_ARENA') {
      navigate(`/arena/play/${params?.mapLevel || 1}`);
    } else if (normalizedPage === 'STREAMER_LOBBY') {
      const p = new URLSearchParams();
      if (params?.bossName) p.set('bossName', params.bossName);
      if (params?.bossLevel) p.set('bossLevel', String(params.bossLevel));
      navigate(`/raids/streamer?${p.toString()}`);
    } else if (normalizedPage === 'VIEWER_LOBBY') {
      navigate(`/raids/viewer/${params?.streamerName}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07090e] flex items-center justify-center font-display text-xs tracking-widest text-slate-500">
        LOADING BATTLERS INTERFACE...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between">
      {/* Header Bar */}
      <header className="px-6 py-4 bg-[#0a0d17]/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between select-none">
        <div 
          onClick={() => {
            if (user) {
              navigate('/dashboard');
            }
          }}
          className="font-display font-black text-white text-lg tracking-wider cursor-pointer hover:opacity-80"
        >
          STREAM <span className="text-neon-cyan">BATTLERS</span>
        </div>
        <div className="text-[10px] text-slate-600 font-display uppercase tracking-wider">
          v1.0.0-Beta
        </div>
      </header>

      {/* Main viewport */}
      <main className="flex-1 w-full relative">
        <Routes>
          {/* Public login/register page */}
          <Route path="/auth" element={
            <PublicRoute>
              <Auth onLoginSuccess={(_, char) => {
                updateCharacter(char);
                navigate('/dashboard');
              }} />
            </PublicRoute>
          } />

          {/* Core dashboard layouts mapped to sub-routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              {character ? <Dashboard onNavigate={handleNavigate} /> : <Navigate to="/auth" replace />}
            </ProtectedRoute>
          } />
          
          <Route path="/dashboard/:tab" element={
            <ProtectedRoute>
              {character ? <Dashboard onNavigate={handleNavigate} /> : <Navigate to="/auth" replace />}
            </ProtectedRoute>
          } />

          <Route path="/arena" element={
            <ProtectedRoute>
              {character ? <Dashboard onNavigate={handleNavigate} /> : <Navigate to="/auth" replace />}
            </ProtectedRoute>
          } />

          <Route path="/raids" element={
            <ProtectedRoute>
              {character ? <Dashboard onNavigate={handleNavigate} /> : <Navigate to="/auth" replace />}
            </ProtectedRoute>
          } />

          {/* Active battle/raid views */}
          <Route path="/arena/play/:level" element={
            <ProtectedRoute>
              <SoloMapWrapper checkAuth={checkAuth} />
            </ProtectedRoute>
          } />

          <Route path="/raids/streamer" element={
            <ProtectedRoute>
              <StreamerLobbyWrapper checkAuth={checkAuth} />
            </ProtectedRoute>
          } />

          <Route path="/raids/viewer/:streamerName" element={
            <ProtectedRoute>
              <ViewerSpectateWrapper checkAuth={checkAuth} />
            </ProtectedRoute>
          } />

          {/* Leaderboard page */}
          <Route path="/leaderboard" element={
            <ProtectedRoute>
              <Leaderboard onBackToDashboard={() => navigate('/dashboard')} />
            </ProtectedRoute>
          } />

          {/* Fallback redirects */}
          <Route path="/" element={<Navigate to={user ? "/dashboard" : "/auth"} replace />} />
          <Route path="*" element={<Navigate to={user ? "/dashboard" : "/auth"} replace />} />
        </Routes>
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
    </div>
  );
}
