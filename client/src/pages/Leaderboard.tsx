import React, { useEffect, useState } from 'react';
import { apiFetch } from '../utils/api';
import { ArrowLeft, Trophy } from 'lucide-react';
import { CLASSES } from 'shared';

interface LeaderboardProps {
  onBackToDashboard: () => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ onBackToDashboard }) => {
  const [leaders, setLeaders] = useState<any[]>([]);
  const [filterClass, setFilterClass] = useState<string>('GLOBAL');
  const [loading, setLoading] = useState<boolean>(true);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const url = filterClass === 'GLOBAL' ? '/leaderboard' : `/leaderboard?class=${filterClass}`;
      const data = await apiFetch(url);
      setLeaders(data);
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [filterClass]);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'COMMON': return 'text-slate-400';
      case 'UNCOMMON': return 'text-emerald-400';
      case 'RARE': return 'text-blue-400';
      case 'EPIC': return 'text-purple-400';
      case 'LEGENDARY': return 'text-orange-500 font-bold';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <button
          onClick={onBackToDashboard}
          className="flex items-center gap-2 text-xs font-display font-semibold uppercase tracking-wider text-slate-400 hover:text-white transition"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>

        <div className="flex items-center gap-2">
          <Trophy size={20} className="text-yellow-500" />
          <h2 className="text-xl font-black text-white m-0 tracking-wider font-display">HALL OF FAME</h2>
        </div>
      </div>

      {/* Class filter tabs */}
      <div className="flex border-b border-white/5 gap-1 select-none overflow-x-auto pb-1">
        {['GLOBAL', ...Object.keys(CLASSES)].map(c => (
          <button
            key={c}
            onClick={() => setFilterClass(c)}
            className={`px-4 py-2 font-display text-[10px] font-bold uppercase tracking-wider border-b-2 transition shrink-0 ${
              filterClass === c
                ? 'border-yellow-500 text-yellow-500'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Top 3 Podium */}
      {!loading && leaders.length > 0 && (
        <div className="flex items-end justify-center gap-2 sm:gap-6 my-2 p-6 bg-black/25 border border-white/5 rounded-2xl relative overflow-hidden select-none">
          <div className="absolute w-64 h-64 rounded-full bg-yellow-500/5 blur-[80px] -top-12 left-1/2 -translate-x-1/2 -z-10" />

          {/* 2nd Place */}
          {(() => {
            const char = leaders.find(l => l.rank === 2);
            if (!char) return <div className="w-20 sm:w-28 animate-pulse flex flex-col items-center"><div className="w-16 h-10 bg-white/5 rounded mb-2" /><div className="w-20 sm:w-28 h-20 bg-white/5 rounded-t-xl border border-white/5" /></div>;
            const classColor = CLASSES[char.class]?.color || '#ffffff';
            const className = CLASSES[char.class]?.name || char.class;
            return (
              <div className="flex flex-col items-center animate-scaleUp">
                <div className="text-center mb-2 flex flex-col items-center">
                  <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">🥈 2nd</span>
                  <div className="font-bold text-slate-200 text-[11px] sm:text-xs tracking-wide truncate max-w-[95px] sm:max-w-[120px]">{char.displayName}</div>
                  <div className="text-[9px] sm:text-[10px] font-semibold" style={{ color: classColor }}>{className}</div>
                  <div className="text-[9px] sm:text-[10px] text-slate-500 font-mono">Lvl {char.level}</div>
                </div>
                <div className="w-20 sm:w-28 h-20 bg-gradient-to-t from-slate-900/95 to-slate-800/80 border border-slate-700/30 rounded-t-xl flex items-center justify-center shadow-lg">
                  <span className="text-2xl font-black text-slate-500 font-display">2</span>
                </div>
              </div>
            );
          })()}

          {/* 1st Place */}
          {(() => {
            const char = leaders.find(l => l.rank === 1);
            if (!char) return <div className="w-24 sm:w-32 animate-pulse flex flex-col items-center"><div className="w-20 h-10 bg-white/5 rounded mb-2" /><div className="w-24 sm:w-32 h-28 bg-white/5 rounded-t-2xl border border-white/5" /></div>;
            const classColor = CLASSES[char.class]?.color || '#ffffff';
            const className = CLASSES[char.class]?.name || char.class;
            return (
              <div className="flex flex-col items-center animate-scaleUp">
                <div className="text-center mb-2 flex flex-col items-center">
                  <span className="text-[10px] text-yellow-400 font-mono font-bold flex items-center gap-1">🥇 1st</span>
                  <div className="font-black text-white text-xs sm:text-sm tracking-widest truncate max-w-[110px] sm:max-w-[140px] drop-shadow-[0_0_8px_rgba(234,179,8,0.3)]">{char.displayName}</div>
                  <div className="text-[9px] sm:text-[10px] font-bold" style={{ color: classColor }}>{className}</div>
                  <div className="text-[9px] sm:text-[10px] text-yellow-500/80 font-mono font-bold">Lvl {char.level}</div>
                </div>
                <div className="w-24 sm:w-32 h-28 bg-gradient-to-t from-yellow-950/80 to-yellow-800/20 border border-yellow-500/30 rounded-t-2xl flex items-center justify-center shadow-2xl relative">
                  <div className="absolute inset-0 bg-yellow-500/5 animate-pulse rounded-t-2xl" />
                  <span className="text-4xl font-black text-yellow-400 font-display drop-shadow-[0_0_12px_rgba(234,179,8,0.5)]">1</span>
                </div>
              </div>
            );
          })()}

          {/* 3rd Place */}
          {(() => {
            const char = leaders.find(l => l.rank === 3);
            if (!char) return <div className="w-20 sm:w-28 animate-pulse flex flex-col items-center"><div className="w-16 h-10 bg-white/5 rounded mb-2" /><div className="w-20 sm:w-28 h-12 bg-white/5 rounded-t-xl border border-white/5" /></div>;
            const classColor = CLASSES[char.class]?.color || '#ffffff';
            const className = CLASSES[char.class]?.name || char.class;
            return (
              <div className="flex flex-col items-center animate-scaleUp">
                <div className="text-center mb-2 flex flex-col items-center">
                  <span className="text-[10px] text-amber-600 font-mono flex items-center gap-1">🥉 3rd</span>
                  <div className="font-bold text-amber-100 text-[11px] sm:text-xs tracking-wide truncate max-w-[95px] sm:max-w-[120px]">{char.displayName}</div>
                  <div className="text-[9px] sm:text-[10px] font-semibold" style={{ color: classColor }}>{className}</div>
                  <div className="text-[9px] sm:text-[10px] text-slate-500 font-mono">Lvl {char.level}</div>
                </div>
                <div className="w-20 sm:w-28 h-12 bg-gradient-to-t from-amber-950/60 to-amber-900/20 border border-amber-800/20 rounded-t-xl flex items-center justify-center shadow-md">
                  <span className="text-xl font-black text-amber-700 font-display">3</span>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Leaderboard Table */}
      <div className="glass-panel border-white/5 overflow-hidden flex flex-col">
        {loading ? (
          <div className="text-slate-500 text-center py-12 text-sm italic">Loading ranks...</div>
        ) : leaders.length === 0 ? (
          <div className="text-slate-500 text-center py-12 text-sm italic">No ranked characters found.</div>
        ) : (
          <div className="overflow-y-auto max-h-[350px] overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-black/45 border-b border-white/5 font-display text-slate-400 uppercase tracking-wider text-[10px] sticky top-0 z-10 backdrop-blur-sm">
                  <th className="p-4 w-16 text-center">Rank</th>
                  <th className="p-4">Player</th>
                  <th className="p-4">Class</th>
                  <th className="p-4 w-24 text-center">Level</th>
                  <th className="p-4">Weapon</th>
                  <th className="p-4">Armor</th>
                  <th className="p-4">Accessory</th>
                </tr>
              </thead>
              <tbody>
                {leaders.map((char: any) => {
                  const classColor = CLASSES[char.class]?.color || '#ffffff';
                  const className = CLASSES[char.class]?.name || char.class;

                  return (
                    <tr key={char.characterId} className="border-b border-white/5 hover:bg-white/5 transition">
                      <td className="p-4 text-center font-display font-bold">
                        {char.rank === 1 ? (
                          <span className="text-yellow-400">🥇 1</span>
                        ) : char.rank === 2 ? (
                          <span className="text-slate-300">🥈 2</span>
                        ) : char.rank === 3 ? (
                          <span className="text-amber-600">🥉 3</span>
                        ) : (
                          char.rank
                        )}
                      </td>
                      <td className="p-4 font-bold text-white tracking-wide">
                        {char.displayName}
                      </td>
                      <td className="p-4">
                        <span className="font-semibold" style={{ color: classColor }}>
                          {className}
                        </span>
                      </td>
                      <td className="p-4 text-center font-mono font-bold text-white">
                        {char.level}
                      </td>
                      <td className="p-4 truncate max-w-[150px]">
                        {char.equipped.weapon ? (
                          <span className={getRarityColor(char.equipped.weapon.rarity)}>
                            {char.equipped.weapon.name}
                          </span>
                        ) : (
                          <span className="text-slate-700">None</span>
                        )}
                      </td>
                      <td className="p-4 truncate max-w-[150px]">
                        {char.equipped.armor ? (
                          <span className={getRarityColor(char.equipped.armor.rarity)}>
                            {char.equipped.armor.name}
                          </span>
                        ) : (
                          <span className="text-slate-700">None</span>
                        )}
                      </td>
                      <td className="p-4 truncate max-w-[150px]">
                        {char.equipped.accessory ? (
                          <span className={getRarityColor(char.equipped.accessory.rarity)}>
                            {char.equipped.accessory.name}
                          </span>
                        ) : (
                          <span className="text-slate-700">None</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
