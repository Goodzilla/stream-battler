import React, { useState } from 'react';
import { apiFetch } from '../utils/api';
import { Shield, Flame } from 'lucide-react';

interface AuthProps {
  onLoginSuccess: (user: any, character: any) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleDevLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setError(null);
    setLoading(true);

    try {
      const data = await apiFetch('/auth/dev-login', {
        method: 'POST',
        body: JSON.stringify({ username: username.trim() })
      });
      onLoginSuccess(data.user, data.character);
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate. Dev login might be restricted.');
    } finally {
      setLoading(false);
    }
  };

  const handleTwitchRedirect = () => {
    window.location.href = '/api/auth/twitch';
  };

  return (
    <div className="min-h-[82vh] flex flex-col justify-center items-center px-4 relative select-none">
      {/* Dynamic ambient backgrounds */}
      <div className="absolute w-[400px] h-[400px] rounded-full bg-neon-cyan/5 blur-[120px] top-12 left-12 -z-10 animate-pulse" />
      <div className="absolute w-[400px] h-[400px] rounded-full bg-neon-magenta/5 blur-[120px] bottom-12 right-12 -z-10 animate-pulse" />

      {/* Cyber Grid Base Canvas or styling in CSS */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293708_1px,transparent_1px),linear-gradient(to_bottom,#1f293708_1px,transparent_1px)] bg-[size:32px_32px] -z-20 opacity-30" />

      <div className="w-full max-w-lg p-10 bg-[#090e1a]/95 border border-neon-cyan/20 rounded-2xl shadow-[0_0_50px_rgba(0,216,255,0.08)] relative overflow-hidden backdrop-blur-xl">
        {/* Top Terminal Corner Decors */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-neon-cyan/60 rounded-tl-2xl" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-neon-cyan/60 rounded-tr-2xl" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-neon-cyan/60 rounded-bl-2xl" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-neon-cyan/60 rounded-br-2xl" />

        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 border border-neon-cyan/30 rounded-full bg-neon-cyan/5 text-[9px] font-pixel text-neon-cyan uppercase tracking-widest mb-4">
            <Flame className="w-3 h-3 animate-bounce" /> LOBBY SYSTEM IS ONLINE <Flame className="w-3 h-3 animate-bounce" />
          </div>
          
          <h1 className="text-4xl md:text-5xl font-black m-0 mb-3 tracking-wider text-white select-none">
            STREAM <span className="text-neon-cyan text-neon-cyan">BATTLERS</span>
          </h1>
          <p className="text-[10px] text-slate-400 font-pixel uppercase tracking-widest leading-relaxed">
            [ MULTIPLAYER TWITCH IDLE RPG ]
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-950/50 border border-red-800/40 text-red-400 rounded-lg text-xs leading-relaxed font-mono">
            ⚠ ERROR: {error}
          </div>
        )}

        {/* Development Login */}
        {(!import.meta.env.PROD || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && (
          <>
            <form onSubmit={handleDevLogin} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-pixel text-slate-400 uppercase tracking-widest">
                  Simulate Twitch Username
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="e.g. streamer_boss or viewer_1"
                    maxLength={25}
                    className="w-full px-4 py-3 bg-black/60 border border-white/10 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-neon-cyan focus:shadow-[0_0_15px_rgba(0,216,255,0.25)] transition duration-300 placeholder-slate-600"
                    required
                    disabled={loading}
                  />
                </div>
                <div className="flex items-center gap-1.5 mt-1.5 text-slate-500">
                  <Shield className="w-3.5 h-3.5 text-neon-magenta" />
                  <span className="text-[9px] uppercase tracking-wider font-mono">
                    *Include "admin" in the name to grant dev panel control.
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-neon-cyan/10 hover:bg-neon-cyan text-neon-cyan hover:text-black border border-neon-cyan/40 hover:border-neon-cyan rounded-lg font-display uppercase font-bold tracking-widest text-xs transition duration-300 shadow-md hover:shadow-neon-cyan/25"
              >
                {loading ? 'SYNCHRONIZING TERMINAL...' : 'ENTER DEV SIMULATION'}
              </button>
            </form>

            <div className="relative my-8 flex items-center justify-center">
              <div className="border-t border-white/5 w-full absolute" />
              <span className="bg-[#090e1a] px-4 text-[10px] font-pixel text-slate-600 uppercase tracking-widest z-10">
                OR
              </span>
            </div>
          </>
        )}

        {/* Production Login */}
        <button
          onClick={handleTwitchRedirect}
          className="w-full py-4 bg-[#772ce8] hover:bg-[#9146ff] text-white rounded-lg font-display uppercase font-bold tracking-widest text-xs flex items-center justify-center gap-2.5 transition duration-300 shadow-lg hover:shadow-purple-500/20 border border-purple-400/20"
        >
          <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
            <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
          </svg>
          Connect Twitch Account
        </button>
        <p className="text-[10px] text-slate-500 mt-3 text-center leading-relaxed font-mono">
          Log in with your official Twitch credentials to claim character stats!
        </p>
      </div>
    </div>
  );
};
