import React, { useEffect, useState } from 'react';
import { apiFetch } from '../utils/api';
import { ArrowLeft, Trophy } from 'lucide-react';
import { CLASSES } from '../game/constants';

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
    <div className="max-w-4xl mx-auto py-8 px-4 flex flex-col gap-6">
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
        {['GLOBAL', 'WARRIOR', 'MAGE', 'CLERIC', 'ROGUE', 'RANGER'].map(c => (
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

      {/* Leaderboard Table */}
      <div className="glass-panel border-white/5 overflow-hidden">
        {loading ? (
          <div className="text-slate-500 text-center py-12 text-sm italic">Loading ranks...</div>
        ) : leaders.length === 0 ? (
          <div className="text-slate-500 text-center py-12 text-sm italic">No ranked characters found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-black/40 border-b border-white/5 font-display text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="p-4 w-16 text-center">Rank</th>
                  <th className="p-4">Player</th>
                  <th className="p-4">Class</th>
                  <th className="p-4 w-24 text-center">Level</th>
                  <th className="p-4">Weapon</th>
                  <th className="p-4">Armor</th>
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
