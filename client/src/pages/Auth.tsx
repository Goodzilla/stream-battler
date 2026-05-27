import React, { useState } from 'react';
import { apiFetch } from '../utils/api';

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
      setError(err.message || 'Failed to authenticate. Dev mode might be disabled in production.');
    } finally {
      setLoading(false);
    }
  };

  const handleTwitchRedirect = () => {
    window.location.href = '/api/auth/twitch';
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center px-4 relative select-none">
      {/* Decorative ambient background glows */}
      <div className="absolute w-[300px] h-[300px] rounded-full bg-cyan-500/10 blur-[100px] top-1/4 left-1/4 -z-10" />
      <div className="absolute w-[300px] h-[300px] rounded-full bg-magenta-500/10 blur-[100px] bottom-1/4 right-1/4 -z-10" />

      <div className="w-full max-w-md p-8 glass-panel glass-panel-glow-cyan text-center">
        {/* Logo */}
        <h1 className="text-4xl md:text-5xl font-black m-0 mb-2 tracking-wider text-white">
          STREAM <span className="text-neon-cyan pulse-glow-cyan">BATTLER</span>
        </h1>
        <p className="text-xs text-slate-400 font-display uppercase tracking-widest mb-8">
          The Multiplayer Twitch Idle RPG
        </p>

        {error && (
          <div className="mb-6 p-3 bg-red-950/40 border border-red-800/40 text-red-400 rounded-lg text-xs leading-relaxed">
            {error}
          </div>
        )}

        {/* Development Login */}
        <form onSubmit={handleDevLogin} className="flex flex-col gap-4 text-left">
          <div>
            <label className="block text-xs font-display text-slate-400 uppercase tracking-wider mb-2">
              Developer Username (Simulate Twitch User)
            </label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="e.g. streamer_boss or viewer_1"
              maxLength={25}
              className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-cyan-500 transition"
              required
              disabled={loading}
            />
            <p className="text-[10px] text-slate-500 mt-1 italic">
              *Logging in with "admin" or including "admin" will grant production admin powers locally.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-cyan-950/30 text-neon-cyan border border-cyan-500/30 rounded-lg font-display uppercase font-bold tracking-widest text-xs hover:bg-cyan-500 hover:text-black transition duration-300 shadow-lg hover:shadow-cyan-500/20"
          >
            {loading ? 'INITIALIZING...' : 'ENTER DEV SIMULATION'}
          </button>
        </form>

        <div className="relative my-8 flex items-center justify-center">
          <div className="border-t border-white/5 w-full absolute" />
          <span className="bg-[#0b0f19] px-4 text-xs font-display text-slate-500 uppercase tracking-widest z-10">
            OR
          </span>
        </div>

        {/* Production Login */}
        <button
          onClick={handleTwitchRedirect}
          className="w-full py-3.5 bg-[#af52de] hover:bg-[#c974f1] text-white rounded-lg font-display uppercase font-bold tracking-widest text-xs flex items-center justify-center gap-2 transition duration-300 shadow-lg hover:shadow-purple-500/20"
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
          </svg>
          Connect Twitch Account
        </button>
        <p className="text-[10px] text-slate-500 mt-2 text-center leading-relaxed">
          Log in securely with your official Twitch credentials to claim characters created in chat!
        </p>
      </div>
    </div>
  );
};
