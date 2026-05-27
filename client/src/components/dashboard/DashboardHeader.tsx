import React from 'react';
import { LogOut, Coins } from 'lucide-react';
import { CLASSES } from 'shared';

interface DashboardHeaderProps {
  character: any;
  shopGold: number;
  inventoryLength: number;
  xpPercent: number;
  xpNeeded: number;
  onNavigate: (page: string, params?: any) => void;
  onLogout: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  character,
  shopGold,
  inventoryLength,
  xpPercent,
  xpNeeded,
  onNavigate,
  onLogout
}) => {
  const classColor = CLASSES[character.class]?.color || '#ff3b30';
  const className = CLASSES[character.class]?.name || 'Unknown';

  return (
    <div className="glass-panel p-6 border-white/5 bg-[#090e1a]/95 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-2 h-full" style={{ backgroundColor: classColor }} />
      
      <div className="flex flex-col gap-1.5 pl-2">
        <div className="flex items-center gap-3">
          <h2 className="text-3xl font-black text-white m-0 tracking-wider">
            {character.user.displayName.toUpperCase()}
          </h2>
          <span
            className="text-[9px] font-pixel uppercase px-2 py-0.5 rounded border shadow-sm"
            style={{
              borderColor: `${classColor}55`,
              color: classColor,
              backgroundColor: `${classColor}11`
            }}
          >
            {className}
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono mt-1 text-slate-400">
          <div className="flex items-center gap-1.5 text-yellow-500 font-bold text-sm">
            <Coins className="w-4 h-4 shrink-0" />
            <span>{shopGold} <span className="text-[10px] font-normal uppercase text-yellow-600/70">Gold</span></span>
          </div>
          <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
          <div>
            Backpack Stash: <span className="text-white font-bold">{inventoryLength}</span> / 30 Slots
          </div>
        </div>
      </div>

      {/* Level XP Bar */}
      <div className="flex-1 max-w-md w-full">
        <div className="flex justify-between text-[10px] font-pixel text-slate-400 mb-1.5">
          <span>LEVEL {character.level}</span>
          <span>{character.xp} / {xpNeeded} XP</span>
        </div>
        <div className="w-full h-3 bg-black/40 rounded-full overflow-hidden border border-white/5 p-[2px]">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${xpPercent}%`,
              backgroundColor: classColor,
              boxShadow: `0 0 10px ${classColor}88`
            }}
          />
        </div>
      </div>

      <div className="flex gap-2 shrink-0">
        <button
          onClick={() => onNavigate('leaderboard')}
          className="px-4 py-2.5 border border-yellow-500/20 text-yellow-500 text-xs font-display font-semibold uppercase tracking-wider rounded-lg hover:bg-yellow-500 hover:text-black transition duration-300"
        >
          Leaderboard
        </button>
        <button
          onClick={onLogout}
          className="px-4 py-2.5 border border-red-500/20 text-red-400 text-xs font-display font-semibold uppercase tracking-wider rounded-lg hover:bg-red-500 hover:text-black transition duration-300 flex items-center gap-1.5"
        >
          <LogOut className="w-3.5 h-3.5" />
          Log Out
        </button>
      </div>
    </div>
  );
};
